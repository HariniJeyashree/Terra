/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Shared TypeScript declarations for Terra Carbon Behavior-Change Platform

export type CategoryType = 'transport' | 'food' | 'energy' | 'shopping';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  city: string;
  householdSize: number;
  vehicleType: string;
  dietType: 'veg' | 'non-veg' | 'vegan';
  electricityBillINR: number;
  totalLifetimeCo2Kg: number;
  streakDays: number;
  joinedAt: string;
  onboardingBaselineInsight?: string;
}

export interface EmissionEntry {
  id: string;
  uid: string;
  category: CategoryType;
  value_kg: number;
  source: 'manual' | 'api';
  timestamp: string;
  metadata: {
    activityName: string;
    // Category specific details
    distanceKm?: number;
    vehicleType?: string;
    foodWeightKg?: string;
    foodItem?: string;
    electricityKwh?: number;
    deliveringOrders?: number;
    inrConversion?: boolean;
    comparisonQuote?: string;
  };
}

export interface CommunityCircle {
  id: string;
  name: string;
  members: Array<{
    uid: string;
    name: string;
    contribution_kg: number;
  }>;
  monthly_goal_kg: number;
  current_total_kg: number;
  created_by: string;
  createdAt: string;
}

export interface NudgeMessage {
  id: string;
  uid: string;
  message: string;
  trigger_context: string;
  dismissed: boolean;
  sent_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ActionItem {
  day: number;
  dayName: string;
  title: string;
  description: string;
  co2SavedKg: number;
  effort: 'easy' | 'medium' | 'hard';
  motivation: string;
}

export interface ForecastPoint {
  date: string;
  predicted: {
    transport: number;
    food: number;
    energy: number;
    shopping: number;
  };
}
