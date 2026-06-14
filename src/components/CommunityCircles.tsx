/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CommunityCircle } from "../types";
import { createCommunity, joinCommunity } from "../lib/api";
import { Users, Plus, Award, Check, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CommunityCirclesProps {
  circles: CommunityCircle[];
  onRefresh: () => void;
  userLifetimeCo2: number;
}

export default function CommunityCircles({ circles, onRefresh, userLifetimeCo2 }: CommunityCirclesProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCircleName, setNewCircleName] = useState("");
  const [newCircleGoal, setNewCircleGoal] = useState<number>(1000);
  const [errorMsg, setErrorMsg] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Confetti splash trigger state
  const [confettiSplashes, setConfettiSplashes] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

  const triggerMilestoneConfetti = () => {
    const colors = ["#10b981", "#22d3ee", "#3b82f6", "#a78bfa", "#f59e0b"];
    const splashes: any[] = [];
    for (let i = 0; i < 40; i++) {
      splashes.push({
        id: Math.random(),
        x: Math.random() * 80 + 10, // percentages
        y: Math.random() * 80 + 10,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    setConfettiSplashes(splashes);
    setTimeout(() => {
      setConfettiSplashes([]);
    }, 2800);
  };

  const handleCreateCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCircleName.trim()) return;

    try {
      setErrorMsg("");
      await createCommunity(newCircleName, newCircleGoal);
      setNewCircleName("");
      setNewCircleGoal(1000);
      setShowAddModal(false);
      onRefresh();
      triggerMilestoneConfetti();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to establish a new green circle.");
    }
  };

  const handleJoinCircle = async (circleId: string) => {
    setJoiningId(circleId);
    try {
      await joinCommunity(circleId);
      onRefresh();
      triggerMilestoneConfetti();
    } catch (err) {
      console.error(err);
    } finally {
      setJoiningId(null);
    }
  };

  const currentUserId = "default-uid";

  return (
    <div className="space-y-6 relative z-10" id="community_alliances_lobby">
      
      {/* Dynamic inline Custom Confetti particle system */}
      {confettiSplashes.length > 0 && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {confettiSplashes.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 1, scale: 0, y: "100vh" }}
              animate={{
                opacity: [1, 1, 0],
                scale: [0.5, 1.5, 0.5],
                y: [`${s.y + 40}vh`, `${s.y - 10}vh`],
                x: [`${s.x - 10}vw`, `${s.x + 10}vw`]
              }}
              transition={{ duration: 2.2, ease: "easeOut" }}
              className="absolute w-2 h-4 rounded-sm rotate-45"
              style={{ backgroundColor: s.color }}
            />
          ))}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 border border-emerald-500/30 px-6 py-4 rounded-2xl flex flex-col items-center gap-1 backdrop-blur-md shadow-2xl">
            <Sparkles className="w-8 h-8 text-emerald-400 animate-spin" />
            <h4 className="text-white font-bold text-center tracking-tight text-sm">Milestone Unlocked!</h4>
            <p className="text-[10px] text-emerald-300 uppercase font-mono tracking-wider">Alliances Progress Boosted</p>
          </div>
        </div>
      )}

      {/* Action Header bar */}
      <div className="flex justify-between items-center bg-white/[0.01] p-4 rounded-2xl border border-white/5">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest font-mono opacity-50">Social Alliances</span>
          <h3 className="text-sm font-semibold text-white">Join Circles & Compete</h3>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 font-bold bg-white/5 border border-white/10 text-white hover:bg-emerald-500 hover:text-black rounded-xl text-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Start a Circle
        </button>
      </div>

      {/* Grid of registered circles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {circles.map((c) => {
          const isMember = c.members.some((m) => m.uid === currentUserId);
          const ratio = Math.min(1, c.current_total_kg / c.monthly_goal_kg);
          const percentage = Math.round(ratio * 100);

          // Find milestone badges
          const reached80 = percentage >= 80;
          const reached100 = percentage >= 100;

          // Assemble leaderboard list sorted descending by individual contribution
          const leaderboard = [...c.members].sort((a, b) => b.contribution_kg - a.contribution_kg);

          return (
            <div
              key={c.id}
              className="glass-card bg-[#050708]/55 border border-white/10 p-5 flex flex-col justify-between hover:border-emerald-500/15 transition-all relative overflow-hidden group shadow-xl"
            >
              {/* Dynamic milestone glow indicator */}
              {reached100 ? (
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent blur-md pointer-events-none" />
              ) : reached80 ? (
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/10 to-transparent blur-md pointer-events-none" />
              ) : null}

              <div className="space-y-4">
                {/* Title line */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-mono tracking-widest font-bold text-cyan-400 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {c.members.length} member Alliance
                    </span>
                    <h4 className="text-md font-semibold text-white tracking-tight leading-snug">
                      {c.name}
                    </h4>
                  </div>

                  {isMember ? (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                      Joined
                    </span>
                  ) : (
                    <button
                      onClick={() => handleJoinCircle(c.id)}
                      disabled={joiningId === c.id}
                      className="px-3 py-1 font-bold bg-white/5 border border-white/10 hover:bg-emerald-500 hover:text-black rounded-lg text-[10px] text-white transition-colors cursor-pointer"
                    >
                      {joiningId === c.id ? "Connecting..." : "Join Circle"}
                    </button>
                  )}
                </div>

                {/* Monthly progress indicator bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="opacity-60 text-[10px] uppercase font-mono">Circle Progress</span>
                    <span className="font-semibold text-white" style={{ color: reached100 ? "#10b981" : reached80 ? "#22d3ee" : "#ffffff" }}>
                      {percentage}% ({Math.round(c.current_total_kg)} / {c.monthly_goal_kg} kg)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1.2 }}
                      className={`h-full rounded-full ${
                        reached100 
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                          : reached80 
                            ? "bg-gradient-to-r from-cyan-500 to-blue-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                            : "bg-emerald-500"
                      }`}
                    />
                  </div>

                  {/* Solidarity nudge warnings when lagging behind goals */}
                  {!reached100 && percentage < 50 && (
                    <div className="flex gap-1 py-1.5 items-center text-[9px] text-amber-400 font-medium">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span>Alliance is lagging monthly pace. Challenge your members to cut single transit runs!</span>
                    </div>
                  )}

                  {/* Milestone badges row */}
                  <div className="flex gap-2 pt-1 font-mono text-[9px]">
                    <div className={`px-2 py-0.5 rounded border ${reached80 ? "border-cyan-500/20 bg-cyan-900/10 text-cyan-400 font-semibold" : "border-white/5 opacity-30 text-white"}`}>
                      🛡️ 80% Solidarity badge
                    </div>
                    <div className={`px-2 py-0.5 rounded border ${reached100 ? "border-emerald-500/20 bg-emerald-900/10 text-emerald-400 font-semibold" : "border-white/5 opacity-30 text-white"}`}>
                      🏆 100% Net Zero badge
                    </div>
                  </div>
                </div>

                {/* Scoreboard List with staggered rankings */}
                <div className="space-y-2 pt-1">
                  <h5 className="text-[9px] uppercase font-mono tracking-widest text-white/40 pb-1 border-b border-white/5">
                    Individual Leaderboard
                  </h5>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {leaderboard.map((m, idx) => {
                      const isMe = m.uid === currentUserId;
                      return (
                        <div
                          key={m.uid}
                          className={`flex items-center justify-between text-xs py-1.5 px-2 bg-white/[0.01] border border-white/[0.02] rounded-lg ${
                            isMe ? "border-emerald-500/30 bg-emerald-500/[0.02]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-white/30 text-right w-4">
                              {idx + 1}.
                            </span>
                            <span className={`font-medium ${isMe ? "text-emerald-400 font-bold" : "text-white/80"}`}>
                              {m.name} {isMe && "(You)"}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-white/50">
                            {m.contribution_kg.toFixed(1)} kg cumulative
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Start Circle Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <div className="glass-card max-w-sm w-full bg-[#050708]/90 border border-white/10 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-4">
              <h4 className="text-sm font-semibold text-white">Create Sustainable Circle</h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-md border border-white/5 hover:bg-white/5 text-white/50 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-2 mb-3 bg-red-950/20 border border-red-500/25 text-[10px] text-red-300 rounded">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateCircle} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">Circle Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pune Green Commuters"
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  maxLength={30}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">Monthly CO₂ Savings Goal (kg)</label>
                <input
                  type="number"
                  min="100"
                  max="10000"
                  value={newCircleGoal}
                  onChange={(e) => setNewCircleGoal(Number(e.target.value) || 1000)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 text-xs border border-white/10 text-white/60 hover:text-white rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs bg-emerald-500 text-black font-bold rounded-lg cursor-pointer max-w-[150px]"
                >
                  Confirm Circle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
