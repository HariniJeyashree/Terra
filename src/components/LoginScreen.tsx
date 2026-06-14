/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserProfile } from "../types";
import { updateProfile, getProfile } from "../lib/api";
import { Leaf, RefreshCw, ArrowRight, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";

interface LoginScreenProps {
  onAuthenticated: (profile: UserProfile) => void;
}

// Simple local auth stored in db.json via profile API
// In production this would be Firebase Auth — for now we simulate with name+email
export default function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // stored locally, not real auth
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      if (mode === "register") {
        if (!name.trim()) { setError("Name is required."); setLoading(false); return; }
        // Create profile via server
        const profile = await updateProfile({
          name: name.trim(),
          city: "", // triggers onboarding
          vehicleType: "",
          dietType: "veg",
          electricityBillINR: 2000
        });
        onAuthenticated({ ...profile, city: "" }); // empty city → onboarding
      } else {
        // Login: load existing profile
        try {
          const profile = await getProfile();
          onAuthenticated(profile);
        } catch {
          setError("No account found. Please register first.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050708] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-[-120px] left-[-80px] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-500/10 to-transparent blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-120px] right-[-80px] w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-cyan-500/08 to-transparent blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 mb-4 shadow-2xl shadow-emerald-500/25">
            <Leaf className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-3xl font-light tracking-tight text-white">Terra</h1>
          <p className="text-xs uppercase font-mono tracking-widest text-emerald-400 mt-1">Carbon Behavior-Change Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/8 to-transparent rounded-bl-full pointer-events-none" />

          {/* Tab switcher */}
          <div className="flex p-1 bg-white/5 border border-white/5 rounded-xl mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === m
                    ? "bg-emerald-500 text-black shadow-md"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3 mb-4 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-300">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">Your Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Harini Jeyashree"
                    maxLength={40}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-white/20"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  minLength={6}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 cursor-pointer transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Sign In to Terra" : "Create My Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider hint */}
          <p className="text-center text-[10px] text-white/25 mt-5 leading-relaxed">
            {mode === "login"
              ? "New to Terra? Switch to Create Account above."
              : "Already have an account? Switch to Sign In above."}
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-[9px] text-white/20 mt-6 font-mono">
          Your data is stored locally and never shared. Terra is ad-free.
        </p>
      </motion.div>
    </div>
  );
}
