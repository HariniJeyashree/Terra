/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { UserProfile, EmissionEntry, CommunityCircle, NudgeMessage, ActionItem, ForecastPoint } from "./types";
import {
  getProfile,
  getEmissions,
  getCommunities,
  getNudges,
  dismissNudge,
  getForecast,
  getActionPlan,
  addEmissionEntry
} from "./lib/api";

import LoginScreen from "./components/LoginScreen";
import Onboarding from "./components/Onboarding";
const ThreeGlobe = React.lazy(() => import("./components/ThreeGlobe"));
import { DonutRing, TrendForecastLineChart } from "./components/D3Charts";
import LogEntryModal from "./components/LogEntryModal";
import CarbonCoach from "./components/CarbonCoach";
import CommunityCircles from "./components/CommunityCircles";
import ProfileEditModal from "./components/ProfileEditModal";

import {
  TrendingUp,
  Bot,
  Users,
  Calendar,
  X,
  Sparkles,
  RefreshCw,
  Flame,
  Plus
} from "lucide-react";

// ─── Toast system ────────────────────────────────────────────────────────────
interface Toast { id: string; message: string; type: "success" | "info" | "warn" }
function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-2xl border text-xs font-medium shadow-2xl backdrop-blur-md pointer-events-auto max-w-xs transition-all
            ${t.type === "success" ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300"
            : t.type === "warn" ? "bg-amber-950/90 border-amber-500/30 text-amber-300"
            : "bg-[#0a0f1a]/90 border-white/10 text-white/80"}`}
        >
          <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="leading-relaxed flex-1">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="text-white/30 hover:text-white/60 transition-colors cursor-pointer ml-1">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Auth state ───────────────────────────────────────────────────────────────
type AuthState = "checking" | "logged-out" | "onboarding" | "ready";

export default function App() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [emissions, setEmissions] = useState<EmissionEntry[]>([]);
  const [nudges, setNudges] = useState<NudgeMessage[]>([]);
  const [communities, setCommunities] = useState<CommunityCircle[]>([]);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);

  const [activeTab, setActiveTab] = useState<"dashboard" | "coach" | "community" | "action-plan">("dashboard");
  const [showLogModal, setShowLogModal] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  const [actionPlan, setActionPlan] = useState<ActionItem[]>([]);
  const [compilingPlan, setCompilingPlan] = useState(false);
  const [simulatingMonday, setSimulatingMonday] = useState(false);

  // ─── Toast queue ────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  // ─── Data loading ────────────────────────────────────────────────────────────
  const loadState = useCallback(async () => {
    try {
      const [e, c, n] = await Promise.allSettled([
        getEmissions(),
        getCommunities(),
        getNudges()
      ]);
      if (e.status === "fulfilled") setEmissions(e.value);
      if (c.status === "fulfilled") setCommunities(c.value);
      if (n.status === "fulfilled") setNudges(n.value);

      // Forecast with local fallback
      try {
        const f = await getForecast();
        setForecast(f.forecast);
      } catch {
        const daysOut: ForecastPoint[] = [];
        for (let i = 1; i <= 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          daysOut.push({
            date: d.toLocaleDateString("en-IN", { weekday: "short" }),
            predicted: {
              transport: parseFloat((2 + Math.sin(i) * 1.2).toFixed(1)),
              food: parseFloat((1.5 + Math.cos(i) * 0.4).toFixed(1)),
              energy: parseFloat((4.5 - i * 0.2).toFixed(1)),
              shopping: i % 3 === 0 ? 15 : 0
            }
          });
        }
        setForecast(daysOut);
      }
    } catch (err) {
      console.error("Failed to load app state:", err);
    }
  }, []);

  // ─── Initial auth check ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      // Check if a session exists (profile was previously saved)
      const wasLoggedIn = sessionStorage.getItem("terra_session");
      if (!wasLoggedIn) {
        setAuthState("logged-out");
        setLoading(false);
        return;
      }
      try {
        const p = await getProfile();
        if (p && p.city) {
          setProfile(p);
          setAuthState("ready");
          await loadState();
        } else if (p) {
          setProfile(p);
          setAuthState("onboarding");
        } else {
          setAuthState("logged-out");
        }
      } catch {
        setAuthState("logged-out");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadState]);

  // ─── Pre-fetch action plan ───────────────────────────────────────────────────
  useEffect(() => {
    if (profile && actionPlan.length === 0 && authState === "ready") {
      handleCompileActionPlan();
    }
  }, [profile, authState]);

  const handleCompileActionPlan = async () => {
    if (!profile) return;
    setCompilingPlan(true);
    try {
      const res = await getActionPlan(profile, emissions);
      setActionPlan(res.plan);
    } catch (err) {
      console.error("Action plan failed:", err);
    } finally {
      setCompilingPlan(false);
    }
  };

  // ─── Auth handlers ────────────────────────────────────────────────────────────
  const handleLoginAuthenticated = (p: UserProfile) => {
    sessionStorage.setItem("terra_session", "1");
    setProfile(p);
    if (!p.city) {
      setAuthState("onboarding");
    } else {
      setAuthState("ready");
      loadState();
    }
  };

  const handleOnboardingComplete = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    setAuthState("ready");
    await loadState();
    addToast("Welcome to Terra! Your dashboard is ready. 🌱", "success");
  };

  const handleSignOut = () => {
    sessionStorage.removeItem("terra_session");
    setProfile(null);
    setAuthState("logged-out");
    setEmissions([]);
    setNudges([]);
    setCommunities([]);
    setActionPlan([]);
  };

  // ─── Simulate Monday ──────────────────────────────────────────────────────────
  const handleSimulateMonday = async () => {
    if (simulatingMonday) return;
    setSimulatingMonday(true);
    addToast("⏳ Simulating Monday forecast nudge...", "info");
    try {
      const res = await fetch("/api/nudge-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          triggerContext: "monday_forecast",
          userSummary: { profile, emissions }
        })
      });
      const data = await res.json();
      const rawNudgeMsg = data.nudge || "Monday tip: Try swapping one commute to Metro this week!";
      const nudgeMsg = rawNudgeMsg.replace(/[*#]/g, "");

      // ✅ FIX: Add nudge directly to UI state + show toast
      const newNudge: NudgeMessage = {
        id: "mon-" + Math.random().toString(36).substring(2, 9),
        uid: "default-uid",
        message: nudgeMsg,
        trigger_context: "monday_forecast",
        dismissed: false,
        sent_at: new Date().toISOString()
      };
      setNudges((prev) => [newNudge, ...prev]);
      addToast(`📅 Monday nudge delivered: "${nudgeMsg.substring(0, 60)}${nudgeMsg.length > 60 ? "…" : ""}"`, "success");
    } catch (e) {
      console.error("Simulate Monday failed:", e);
      addToast("Could not generate Monday nudge. Check server connection.", "warn");
    } finally {
      setSimulatingMonday(false);
    }
  };

  const handleDismissNudge = async (id: string) => {
    try {
      await dismissNudge(id);
      setNudges((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Nudge dismiss failed:", err);
    }
  };

  const handleLogEmissionOptimistically = async (
    category: "transport" | "food" | "energy" | "shopping",
    value_kg: number,
    metadata: any
  ) => {
    if (!profile) return;
    
    // Close modal immediately so the user can see state changes on the dashboard instantly
    setShowLogModal(false);

    const tempId = "temp-" + Math.random().toString(36).substring(2, 9);
    const optimisticEntry: EmissionEntry = {
      id: tempId,
      uid: profile.uid || "default-uid",
      category,
      value_kg,
      source: "manual",
      timestamp: new Date().toISOString(),
      metadata
    };

    // Rollback backup snapshots
    const backupEmissions = [...emissions];
    const backupProfile = { ...profile };

    // Update emissions state immediately
    setEmissions((prev) => [optimisticEntry, ...prev]);

    // Update profile total lifetime and streak days optimistically too
    const isFirstLogToday = !emissions.some(
      (e) => new Date(e.timestamp).toDateString() === new Date().toDateString()
    );
    const updatedStreak = isFirstLogToday ? profile.streakDays + 1 : profile.streakDays;
    const updatedTotal = parseFloat((profile.totalLifetimeCo2Kg + value_kg).toFixed(1));

    setProfile({
      ...profile,
      totalLifetimeCo2Kg: updatedTotal,
      streakDays: updatedStreak
    });

    addToast("⚡ Dashboard updated optimistically! Saving in background...", "success");

    try {
      // Fire the asynchronous API write call to Firestore in background
      const result = await addEmissionEntry(category, value_kg, metadata);
      
      // Update the emissions list to replace the temporary optimistic node with real persisting database node
      setEmissions((prev) =>
        prev.map((e) => (e.id === tempId ? result.entry : e))
      );
      
      // Update with exact server-confirmed metrics (including actual database counters for lifetime summary etc.)
      if (result.user) {
        setProfile((prev) => prev ? { ...prev, ...result.user } : result.user);
      }
      
      addToast("✅ Activity successfully saved to archive! 🌱", "success");
    } catch (err: any) {
      console.error("Optimistic write sync failed, rolling back:", err);
      // Rollback to secure snapshots
      setEmissions(backupEmissions);
      setProfile(backupProfile);
      addToast("⚠️ Connection error: Failed to sync activity. Local rollback applied.", "warn");
    }
  };

  // ─── Derived stats ────────────────────────────────────────────────────────────
  const todayEmissions = React.useMemo(() => {
    return emissions.filter((e) => {
      return new Date(e.timestamp).toDateString() === new Date().toDateString();
    });
  }, [emissions]);

  const todayCo2Sum = React.useMemo(() => {
    return parseFloat(todayEmissions.reduce((s, e) => s + e.value_kg, 0).toFixed(1));
  }, [todayEmissions]);

  let realComparisonString = "Your ledger is clean! Log your first activity to start tracking.";
  if (todayCo2Sum > 0 && todayEmissions[0]?.metadata?.comparisonQuote) {
    realComparisonString = todayEmissions[0].metadata.comparisonQuote;
  } else if (todayCo2Sum < 5 && todayCo2Sum > 0) {
    realComparisonString = `= Running a split AC for 2 hours in Bengaluru. Doing better than 84% of the city!`;
  } else if (todayCo2Sum >= 5) {
    realComparisonString = `= Running a split AC for ${Math.round(todayCo2Sum * 1.5)} hours. Consider planting a sapling to offset!`;
  }

  // ─── Render guards ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050708] text-white flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-xs uppercase font-mono tracking-widest text-emerald-400 animate-pulse">
          Calibrating Terra Core...
        </p>
      </div>
    );
  }

  if (authState === "logged-out") {
    return <LoginScreen onAuthenticated={handleLoginAuthenticated} />;
  }

  if (authState === "onboarding" || !profile?.city) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // ─── Main app ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050708] text-white font-sans overflow-x-hidden flex flex-col relative select-none">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* Background glows */}
      <div className="absolute top-[-100px] left-[-100px] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.10)_0%,transparent_70%)] blur-[60px] z-0 pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.07)_0%,transparent_70%)] blur-[60px] z-0 pointer-events-none" />

      {/* ── HEADER ── */}
      <header className="relative z-10 flex justify-between items-center px-6 md:px-10 py-5 border-b border-white/[0.04] bg-black/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center font-bold text-black text-md">
            T
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white">Terra</span>
            <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-400 mt-0.5">Behavior Change System</span>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl">
          {[
            { id: "dashboard", label: "Dashboard", icon: <TrendingUp className="w-3.5 h-3.5" /> },
            { id: "coach", label: "Terra AI Coach", icon: <Bot className="w-3.5 h-3.5" /> },
            { id: "community", label: "Alliances", icon: <Users className="w-3.5 h-3.5" /> },
            { id: "action-plan", label: "7-Day Plan", icon: <Calendar className="w-3.5 h-3.5" /> }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs tracking-tight rounded-lg cursor-pointer transition-all ${
                activeTab === t.id
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/10 font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateMonday}
            disabled={simulatingMonday}
            className={`text-[9px] uppercase font-mono px-2.5 py-1.5 border rounded-lg cursor-pointer transition-all ${
              simulatingMonday
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 animate-pulse"
                : "border-white/5 bg-white/5 text-cyan-400 hover:text-white hover:border-cyan-500/20 active:scale-95"
            }`}
            title="Simulate Monday weekly nudge"
          >
            {simulatingMonday ? "Generating…" : "Simulate Monday"}
          </button>

          <div className="flex flex-col items-end text-xs">
            <span className="opacity-50 text-[9px] uppercase font-mono tracking-wider">{profile.city}</span>
            <span className="font-semibold text-white">{profile.name}</span>
          </div>

          {/* ✅ FIX: Avatar is now clickable to open profile editor */}
          <button
            onClick={() => setShowProfileEdit(true)}
            className="w-10 h-10 rounded-full border border-emerald-500 p-0.5 shadow-lg shadow-emerald-500/15 hover:border-cyan-400 hover:scale-105 transition-all cursor-pointer group relative"
            title="Edit profile"
            aria-label="Edit your profile"
          >
            <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold font-mono text-emerald-400 group-hover:text-cyan-400 transition-colors">
              {profile.name.substring(0, 2).toUpperCase()}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border border-[#050708] flex items-center justify-center">
              <span className="text-[6px] text-black font-bold">✎</span>
            </span>
          </button>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="text-[9px] uppercase font-mono px-2 py-1.5 border border-white/5 bg-white/5 text-white/40 hover:text-red-400 hover:border-red-500/20 rounded-lg cursor-pointer transition-all"
            title="Sign out"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      <nav aria-label="Mobile Navigation Drawer" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/90 border-t border-white/10 backdrop-blur-lg px-2 py-2 flex justify-around">
        {[
          { id: "dashboard", label: "Metrics", icon: <TrendingUp className="w-4 h-4" /> },
          { id: "coach", label: "AI Coach", icon: <Bot className="w-4 h-4" /> },
          { id: "community", label: "Circles", icon: <Users className="w-4 h-4" /> },
          { id: "action-plan", label: "Plan", icon: <Calendar className="w-4 h-4" /> }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            aria-label={`Open tab: ${t.label}`}
            className={`flex flex-col items-center gap-1.5 py-1 px-3 text-[10px] rounded-lg cursor-pointer transition-colors ${
              activeTab === t.id ? "text-emerald-400 font-bold" : "text-white/40"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Nudge alerts */}
      {nudges.length > 0 && (
        <div className="relative z-20 px-6 md:px-10 pt-4 space-y-2">
          {nudges.map((n) => (
            <div
              key={n.id}
              className="flex justify-between items-center gap-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-cyan-950/30 border border-emerald-500/20 backdrop-blur-md text-xs text-emerald-300 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="leading-relaxed font-medium">{n.message.replace(/[*#]/g, "")}</p>
              </div>
              <button
                onClick={() => handleDismissNudge(n.id)}
                className="text-[10px] font-mono hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-black/50 border border-white/5 shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-10 flex-1 px-6 md:px-10 py-6 md:py-8 pb-20 md:pb-8 flex flex-col">

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">

              {/* Left stats */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                <div className="glass-card p-6 bg-white/[0.03] border border-white/10 flex flex-col justify-between rounded-[24px]">
                  <div className="space-y-1">
                    <h3 className="text-xs uppercase tracking-widest opacity-50 font-medium">Daily Footprint</h3>
                    <div className="flex items-baseline gap-1">
                      <p className="text-5xl font-light text-white font-mono">{todayCo2Sum}</p>
                      <span className="text-md opacity-40 uppercase font-mono font-bold">kg</span>
                    </div>
                  </div>
                  <div className="py-4">
                    <div className="flex justify-between text-[11px] mb-2 font-mono">
                      <span className="opacity-50">vs. {profile.city} Average</span>
                      <span className="text-emerald-400 font-bold">-24%</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[76%]" />
                    </div>
                  </div>
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <p className="text-xs leading-relaxed text-emerald-400 font-medium">{realComparisonString}</p>
                  </div>
                </div>

                <div className="glass-card p-6 bg-white/[0.03] border border-white/10 rounded-[24px]">
                  <h3 className="text-xs uppercase tracking-widest opacity-50 font-medium mb-3">Emission Breakdown</h3>
                  <DonutRing entries={emissions} />
                </div>
              </div>

              {/* Globe */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center relative min-h-[420px] rounded-[30px] border border-white/5 bg-black/40 overflow-hidden shadow-2xl">
                <React.Suspense fallback={<div className="animate-pulse bg-[#050708] h-full w-full rounded-2xl flex flex-col items-center justify-center text-xs text-emerald-400 font-mono">Loading Celestial Interactive Globe...</div>}>
                  <ThreeGlobe city={profile.city} co2Value={todayCo2Sum} />
                </React.Suspense>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/70 backdrop-blur-md px-6 py-3.5 rounded-full border border-white/10 z-10 shadow-xl select-none">
                  <span className="text-xs font-semibold text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500 animate-pulse fill-amber-500" />
                    {profile.streakDays} Day Habit Streak
                  </span>
                  <div className="w-[1px] h-4 bg-white/20" />
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {profile.totalLifetimeCo2Kg}kg Logged Overall
                  </span>
                </div>
              </div>

              {/* Right panel */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                <div className="glass-card p-5 bg-white/[0.03] border border-white/10 flex-1 flex flex-col min-h-[300px] justify-between rounded-[24px]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <h3 className="text-xs uppercase tracking-widest opacity-50 font-medium">Terra Coach Mini</h3>
                  </div>
                  <div className="flex-1 space-y-3.5 overflow-hidden text-xs pb-3">
                    <div className="bg-white/5 rounded-2xl rounded-tl-none p-4 border border-white/5 text-white/80 leading-relaxed">
                      👋 Namaste {profile.name}! Your transport levels are looking good for {profile.city}. Ask me for this week's plan!
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => setActiveTab("coach")}
                        className="w-full text-left p-3 rounded-xl border border-white/10 hover:border-emerald-500/20 hover:bg-emerald-500/5 text-xs text-white/80 transition-all cursor-pointer flex justify-between items-center"
                      >
                        <span>💬 Launch AI Coaching...</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">Open →</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("action-plan")}
                        className="w-full text-left p-3 rounded-xl border border-white/10 hover:border-cyan-500/20 hover:bg-cyan-500/5 text-xs text-white/80 transition-all cursor-pointer flex justify-between items-center"
                      >
                        <span>📅 View 7-Day Carbon Plan...</span>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">Open →</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-5 bg-gradient-to-br from-emerald-950/25 to-transparent border border-white/10 rounded-[24px]">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xs uppercase tracking-widest opacity-50 font-medium">Circle: Alliance</h3>
                    <button onClick={() => setActiveTab("community")} className="text-[9px] uppercase font-mono text-emerald-400 font-bold hover:underline cursor-pointer">
                      View All
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5 mb-3.5">
                    <div className="flex -space-x-2">
                      {["AS", "PN", "VS"].map((init, i) => (
                        <div key={i} className={`w-6 h-6 rounded-full border border-black flex items-center justify-center text-[8px] text-black font-semibold ${["bg-emerald-500", "bg-sky-500", "bg-indigo-500"][i]}`}>{init}</div>
                      ))}
                    </div>
                    <span className="text-[10px] opacity-60 font-mono">+{communities.reduce((s, c) => s + c.members.length, 0)} active</span>
                  </div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="opacity-50">{profile.city} Progress</span>
                    <span className="text-emerald-400 font-bold">82%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-emerald-500 rounded-full w-[82%] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Trend chart row */}
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row gap-6 w-full items-stretch">
              <div className="flex-1 min-w-[300px]">
                <TrendForecastLineChart pastEntries={emissions} forecastPoints={forecast} />
              </div>
              <div className="md:w-72 p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-center space-y-1 text-xs">
                <span className="text-[9px] uppercase font-mono tracking-widest font-bold text-cyan-400">Habit-Change Tip</span>
                <p className="text-white/80 leading-relaxed font-medium">
                  "One weekly office commute switched from petrol sedan to Metro saves ₹160 and avoids 8.4kg CO₂ immediately."
                </p>
              </div>
            </div>
          </>
        )}

        {/* COACH */}
        {activeTab === "coach" && (
          <div className="flex-1 max-w-5xl mx-auto w-full py-2" style={{ minHeight: "60vh" }}>
            <CarbonCoach emissions={emissions} city={profile.city} />
          </div>
        )}

        {/* COMMUNITY */}
        {activeTab === "community" && (
          <div className="flex-1 max-w-5xl mx-auto w-full py-2">
            <CommunityCircles circles={communities} onRefresh={loadState} userLifetimeCo2={profile.totalLifetimeCo2Kg} />
          </div>
        )}

        {/* ACTION PLAN */}
        {activeTab === "action-plan" && (
          <div className="max-w-4xl mx-auto w-full space-y-6 py-2">
            <div className="flex justify-between items-center p-5 bg-white/[0.01] border border-white/5 rounded-2xl">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold">Custom Habituator</span>
                <h3 className="text-md font-semibold text-white">Your 7-Day Carbon Diet Plan</h3>
              </div>
              <button
                onClick={handleCompileActionPlan}
                disabled={compilingPlan}
                className="flex items-center gap-1.5 px-3.5 py-2 font-bold bg-white/5 border border-white/10 hover:bg-cyan-500 hover:text-black rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-40"
              >
                {compilingPlan ? "Generating…" : "Re-generate with AI"}
              </button>
            </div>

            {compilingPlan ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-xs opacity-50 font-mono animate-pulse">Terra mapping your optimal habit routes...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {actionPlan.map((p) => {
                  const effortColor = p.effort === "easy"
                    ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
                    : p.effort === "medium"
                    ? "border-amber-500/20 text-amber-400 bg-amber-500/5"
                    : "border-red-500/20 text-red-400 bg-red-500/5";

                  return (
                    <div key={p.day} className="glass-card bg-[#050708]/65 border border-white/10 p-4 rounded-xl flex flex-col justify-between hover:border-emerald-500/15 transition-colors">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-white/40 uppercase">Day {p.day}</span>
                          <span className="font-bold text-xs text-white">{p.dayName}</span>
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-white tracking-tight leading-snug">{p.title}</h4>
                          <p className="text-[10px] opacity-55 leading-relaxed">{p.description}</p>
                        </div>
                      </div>
                      <div className="pt-4 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="opacity-45">CO₂ Offset</span>
                          <span className="text-emerald-400 font-bold">-{p.co2SavedKg}kg</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="opacity-45">Level</span>
                          <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold uppercase ${effortColor}`}>{p.effort}</span>
                        </div>
                        <div className="pt-1.5 border-t border-white/5 text-[9px] text-emerald-400 font-medium leading-relaxed italic">
                          💡 {p.motivation}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowLogModal(true)}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-10 w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform z-40 cursor-pointer shadow-emerald-500/40 text-3xl"
        title="Log carbon activity"
        aria-label="Add carbon emission entry"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Modals */}
      {showLogModal && (
        <LogEntryModal
          city={profile.city}
          onClose={() => setShowLogModal(false)}
          onSave={handleLogEmissionOptimistically}
        />
      )}

      {showProfileEdit && (
        <ProfileEditModal
          profile={profile}
          onClose={() => setShowProfileEdit(false)}
          onSaved={(updated) => {
            setProfile(updated);
            setShowProfileEdit(false);
            addToast(`Profile updated! Welcome, ${updated.name} 🌿`, "success");
          }}
        />
      )}
    </div>
  );
}
