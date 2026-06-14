/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  UserProfile, 
  EmissionEntry, 
  CommunityCircle, 
  NudgeMessage, 
  ChatMessage,
  ActionItem,
  ForecastPoint
} from "../types";

const BASE_URL = ""; // Relative calls since backend and frontend are co-hosted on port 3000

export async function getProfile(): Promise<UserProfile> {
  const res = await fetch(`${BASE_URL}/api/profile`);
  if (!res.ok) throw new Error("Failed to load user profile");
  return res.json();
}

export async function updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch(`${BASE_URL}/api/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

export async function getEmissions(): Promise<EmissionEntry[]> {
  const res = await fetch(`${BASE_URL}/api/emissions`);
  if (!res.ok) throw new Error("Failed to read emissions");
  return res.json();
}

export interface CalculateInput {
  category: string;
  vehicleType?: string;
  distanceKm?: number;
  foodWeightKg?: number;
  foodItem?: string;
  electricityKwh?: number;
  city?: string;
  deliveryOrders?: number;
}

export interface CalculateResult {
  co2_kg: number;
  category: string;
  explanation: string;
  real_world_comparison: string;
}

export async function calculateEmission(data: CalculateInput): Promise<CalculateResult> {
  const res = await fetch(`${BASE_URL}/api/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to calculate carbon footprint");
  }
  return res.json();
}

export async function addEmissionEntry(category: string, value_kg: number, metadata: any): Promise<{ entry: EmissionEntry; user: UserProfile }> {
  const res = await fetch(`${BASE_URL}/api/emissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, value_kg, metadata })
  });
  if (!res.ok) throw new Error("Failed to log emission event");
  return res.json();
}

export async function getForecast(): Promise<{ forecast: ForecastPoint[] }> {
  const res = await fetch(`${BASE_URL}/api/forecast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history: [] })
  });
  if (!res.ok) throw new Error("Failed to load eco-forecast");
  return res.json();
}

export async function getActionPlan(userProfile: UserProfile, emissions: EmissionEntry[]): Promise<{ plan: ActionItem[] }> {
  const res = await fetch(`${BASE_URL}/api/action-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userProfile, emissions })
  });
  if (!res.ok) throw new Error("Failed to compile customized action plan");
  return res.json();
}

export async function getCommunities(): Promise<CommunityCircle[]> {
  const res = await fetch(`${BASE_URL}/api/communities`);
  if (!res.ok) throw new Error("Failed to load community groups");
  return res.json();
}

export async function createCommunity(name: string, monthly_goal_kg: number): Promise<CommunityCircle> {
  const res = await fetch(`${BASE_URL}/api/communities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, monthly_goal_kg })
  });
  if (!res.ok) throw new Error("Failed to construct a new circle");
  return res.json();
}

export async function joinCommunity(circleId: string): Promise<CommunityCircle> {
  const res = await fetch(`${BASE_URL}/api/communities/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ circleId })
  });
  if (!res.ok) throw new Error("Failed to register with circle");
  return res.json();
}

export async function getNudges(): Promise<NudgeMessage[]> {
  const res = await fetch(`${BASE_URL}/api/nudges`);
  if (!res.ok) throw new Error("Failed to download active insights");
  return res.json();
}

export async function dismissNudge(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE_URL}/api/nudges/dismiss`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });
  if (!res.ok) throw new Error("Failed to retire notification");
  return res.json();
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  const res = await fetch(`${BASE_URL}/api/coach/history`);
  if (!res.ok) throw new Error("Failed to retrieve chat database");
  const data = await res.json();
  // Ensure types are aligned
  return data.map((d: any) => ({
    id: d.id,
    role: d.role === "assistant" ? "assistant" : "user",
    content: d.content,
    timestamp: d.timestamp
  }));
}

export async function postChatMessage(role: "user" | "assistant", content: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/coach/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, content })
  });
  if (!res.ok) throw new Error("Failed to sync chat state");
  return res.json();
}

export async function clearChatHistory(): Promise<ChatMessage[]> {
  const res = await fetch(`${BASE_URL}/api/coach/clear`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to reset session records");
  const data = await res.json();
  return data.map((d: any) => ({
    id: d.id,
    role: d.role === "assistant" ? "assistant" : "user",
    content: d.content,
    timestamp: d.timestamp
  }));
}

// Custom streamer callback connector
export function streamCoachMessage(
  message: string,
  emissionSummary: any,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: any) => void
) {
  fetch(`${BASE_URL}/api/coach`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, emission_summary: emissionSummary })
  })
    .then(response => {
      if (!response.ok) throw new Error("Network issue during coaching stream");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) {
        throw new Error("Local platform streaming pipeline is disabled");
      }

      function read() {
        reader!.read().then(({ done, value }) => {
          if (done) {
            onDone();
            return;
          }
          const chunkStr = decoder.decode(value, { stream: true });
          
          // Split by server sent event delimiters (data:)
          const lines = chunkStr.split("\n");
          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith("data: ")) {
              const rawData = cleanLine.substring(6);
              if (rawData === "[DONE]") {
                onDone();
                return;
              }
              try {
                const parsed = JSON.parse(rawData);
                if (parsed.text) {
                  onChunk(parsed.text);
                }
              } catch (e) {
                // Ignore parsing slips
              }
            }
          }
          read();
        }).catch(err => {
          onError(err);
        });
      }

      read();
    })
    .catch(err => {
      onError(err);
    });
}
