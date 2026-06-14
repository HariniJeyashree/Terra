/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage, EmissionEntry } from "../types";
import {
  getChatHistory,
  postChatMessage,
  clearChatHistory,
  streamCoachMessage
} from "../lib/api";
import { Send, Bot, User, Trash2, Loader2 } from "lucide-react";

interface CarbonCoachProps {
  emissions: EmissionEntry[];
  city: string;
}

const CHIPS = [
  "What's my worst habit?",
  "Give me this week's plan",
  "How do I compare to Chennai average?",
  "Easiest way to save ₹500 weekly?"
];

export default function CarbonCoach({ emissions, city }: CarbonCoachProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // ✅ FIX: Use a ref to accumulate streaming text — avoids stale closure bug
  const streamBufferRef = useRef<string>("");

  useEffect(() => {
    getChatHistory()
      .then((history) => {
        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([{
            id: "welcome-coach",
            role: "assistant",
            content: `Namaste! I am Terra, your personal carbon footprint coach. I have synced with your ${city} profile and emission logs. Ask me anything, or tap one of the prompt chips below!`,
            timestamp: new Date().toISOString()
          }]);
        }
      })
      .catch((err) => console.error("History fetch failed:", err));
  }, [city]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleSendMessage = useCallback(async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setInputValue("");
    setLoading(true);

    const userMsg: ChatMessage = {
      id: "usr-" + Math.random().toString(36).substring(2, 9),
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      await postChatMessage("user", textToSend);
    } catch (e) {
      console.warn("Chat sync offline:", e);
    }

    // ✅ FIX: Reset ref buffer before starting a new stream
    streamBufferRef.current = "";
    setStreamingText("");

    const transportTotal = emissions.filter(e => e.category === "transport").reduce((s, e) => s + e.value_kg, 0);
    const foodTotal = emissions.filter(e => e.category === "food").reduce((s, e) => s + e.value_kg, 0);
    const energyTotal = emissions.filter(e => e.category === "energy").reduce((s, e) => s + e.value_kg, 0);
    const shoppingTotal = emissions.filter(e => e.category === "shopping").reduce((s, e) => s + e.value_kg, 0);

    const emissionContext = {
      city,
      historySummary: {
        totalDaysLogged: emissions.length,
        aggregatedTotals: {
          transport_kg: transportTotal,
          food_kg: foodTotal,
          energy_kg: energyTotal,
          shopping_kg: shoppingTotal,
          grandTotal_kg: transportTotal + foodTotal + energyTotal + shoppingTotal
        },
        recentLogs: emissions.slice(0, 5).map(e => ({
          category: e.category,
          val: e.value_kg,
          at: e.timestamp,
          desc: e.metadata?.activityName
        }))
      }
    };

    streamCoachMessage(
      textToSend,
      emissionContext,
      // ✅ FIX: onChunk — append to ref AND update display state
      (chunk) => {
        streamBufferRef.current += chunk.replace(/[*#]/g, "");
        setStreamingText(streamBufferRef.current);
      },
      // ✅ FIX: onDone — read from ref (not stale state closure)
      async () => {
        const finalContent = streamBufferRef.current.replace(/[*#]/g, "");
        setLoading(false);
        setStreamingText("");
        streamBufferRef.current = "";

        if (finalContent.trim()) {
          const assistantMsg: ChatMessage = {
            id: "bot-" + Math.random().toString(36).substring(2, 9),
            role: "assistant",
            content: finalContent,
            timestamp: new Date().toISOString()
          };
          setMessages((prev) => [...prev, assistantMsg]);

          try {
            await postChatMessage("assistant", finalContent);
          } catch (err) {
            console.warn("Bot msg sync failed:", err);
          }
        }
      },
      // onError
      (err) => {
        console.error("SSE stream error:", err);
        setLoading(false);
        setStreamingText("");
        streamBufferRef.current = "";
        setMessages((prev) => [
          ...prev,
          {
            id: "err-" + Math.random().toString(36).substring(2, 9),
            role: "assistant",
            content: "Connection hiccup! Let's try again — what would you like to optimize?",
            timestamp: new Date().toISOString()
          }
        ]);
      }
    );
  }, [loading, emissions, city]);

  const handleClearHistory = async () => {
    if (window.confirm("Reset your coaching chat history?")) {
      try {
        const remaining = await clearChatHistory();
        setMessages(remaining);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050708]/40 border border-white/5 rounded-2xl relative z-10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-sm uppercase tracking-widest font-semibold text-white/90">Terra Carbon Coach</h3>
        </div>
        <button
          onClick={handleClearHistory}
          className="p-1.5 rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/5 text-white/55 hover:text-red-400 transition-colors cursor-pointer"
          title="Clear coaching history"
          aria-label="Clear coaching history"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 min-h-[300px]">
        {messages.map((m) => {
          const isBot = m.role === "assistant";
          return (
            <div key={m.id} className={`flex gap-3 max-w-[85%] ${isBot ? "" : "ml-auto flex-row-reverse"}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/10 ${
                isBot
                  ? "bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 text-emerald-400"
                  : "bg-white/5 text-cyan-400"
              }`}>
                {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-3xl text-xs leading-relaxed whitespace-pre-line ${
                isBot
                  ? "bg-white/[0.04] border border-white/5 rounded-tl-none text-white/95"
                  : "bg-emerald-500/10 border border-emerald-500/10 rounded-tr-none text-emerald-300"
              }`}>
                {m.content.replace(/[*#]/g, "")}
              </div>
            </div>
          );
        })}

        {/* ✅ FIX: Show streaming text as it accumulates */}
        {streamingText && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-white/10">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-3xl bg-white/[0.04] border border-white/5 rounded-tl-none text-xs leading-relaxed text-white/90 whitespace-pre-line">
              {streamingText.replace(/[*#]/g, "")}
              <span className="inline-block w-1.5 h-3 bg-emerald-400 ml-1 animate-pulse" />
            </div>
          </div>
        )}

        {loading && !streamingText && (
          <div className="flex gap-3 items-center text-xs opacity-50 px-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span className="font-mono tracking-tight">Terra processing your query...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chips */}
      <div className="px-5 py-3 border-t border-white/5 bg-black/20 flex flex-wrap gap-2">
        {CHIPS.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            disabled={loading}
            className="text-[10px] py-1.5 px-3 border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-white/70 hover:text-white rounded-full transition-all cursor-pointer disabled:opacity-40"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 bg-white/[0.01] border-t border-white/5">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage(inputValue)}
            placeholder="Ask Terra anything about your carbon footprint..."
            disabled={loading}
            maxLength={500}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-14 py-3.5 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50"
            aria-label="Ask Terra a question"
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={loading || !inputValue.trim()}
            className="absolute right-2 px-3.5 py-2 hover:scale-105 bg-emerald-500 text-black font-bold h-8 flex items-center justify-center rounded-lg transition-transform cursor-pointer disabled:opacity-30 disabled:scale-100"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
