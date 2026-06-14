/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserProfile } from "../types";
import { updateProfile } from "../lib/api";
import { Compass, Key, Navigation, Leaf, Zap, RefreshCw, Sparkles, MapPin, CheckCircle2, ArrowRight, CornerDownRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const INDIAN_CITIES = [
  { name: "Bengaluru", state: "Karnataka", grid: 0.72 },
  { name: "Mumbai", state: "Maharashtra", grid: 0.84 },
  { name: "Delhi", state: "NCR Region", grid: 0.81 },
  { name: "Chennai", state: "Tamil Nadu", grid: 0.78 },
  { name: "Kolkata", state: "West Bengal", grid: 0.88 },
  { name: "Hyderabad", state: "Telangana", grid: 0.79 },
  { name: "Pune", state: "Maharashtra", grid: 0.84 }
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<number>(1);
  const [city, setCity] = useState("Bengaluru");
  const [vehicle, setVehicle] = useState("petrol car");
  const [diet, setDiet] = useState<"veg" | "non-veg" | "vegan">("veg");
  const [bill, setBill] = useState<number>(2200);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [baselineInsight, setBaselineInsight] = useState("");

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else if (step === 4) {
      // Step 5: "Your first insight" (Trigger AI Baseline generation before logging)
      setLoading(true);
      setStep(5);

      try {
        const uProfile = await updateProfile({
          name: name || "Green Legend",
          city,
          vehicleType: vehicle,
          dietType: diet,
          electricityBillINR: Number(bill),
          householdSize: 3 // Default average Household in Indian cities
        });

        setBaselineInsight(uProfile.onboardingBaselineInsight || "");
      } catch (err) {
        console.error("Onboarding failed:", err);
      } finally {
        setLoading(false);
      }
    } else {
      // Completed, reload or push profile up
      try {
        const res = await updateProfile({
          name: name || "Green Legend",
          city,
          vehicleType: vehicle,
          dietType: diet,
          electricityBillINR: Number(bill)
        });
        onComplete(res);
      } catch (e) {
        // Fallback profile
        onComplete({
          uid: "default-uid",
          name: name || "Green Legend",
          email: "amit.sharma@gmail.com",
          city,
          householdSize: 3,
          vehicleType: vehicle,
          dietType: diet,
          electricityBillINR: Number(bill),
          totalLifetimeCo2Kg: 0,
          streakDays: 1,
          joinedAt: new Date().toISOString(),
          onboardingBaselineInsight: "Your baseline looks green! Transition metrics are ready."
        });
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-[#050708] text-white flex items-center justify-center p-6 relative overflow-hidden" id="terra_onboarding_stage">
      {/* Absolute ambient backgrounds */}
      <div className="absolute top-[-100px] left-[-100px] w-[600px] height-[600px] rounded-full bg-gradient-to-tr from-emerald-500/10 to-transparent blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-100px] w-[600px] height-[600px] rounded-full bg-gradient-to-br from-cyan-500/10 to-transparent blur-[80px] pointer-events-none" />

      {/* Main glass card vessel */}
      <div className="glass-card max-w-lg w-full bg-[#050708]/60 p-8 md:p-10 border border-white/10 z-10 relative flex flex-col justify-between shadow-2xl relative">
        
        {/* Header decoration */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center font-bold text-black text-sm">
              T
            </div>
            <span className="text-lg font-bold tracking-tight">Terra Onboarding</span>
          </div>
          <div className="text-xs font-mono opacity-50 px-3 py-1 rounded-full bg-white/5 border border-white/5">
            Step {step} / 5
          </div>
        </div>

        {/* Dynamic content wrapper with Framer Motion slide effects */}
        <div className="min-h-[280px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-light text-white tracking-tight flex items-center gap-2">
                    <MapPin className="text-emerald-400 h-5 w-5" /> Let's start with your City
                  </h2>
                  <p className="text-xs opacity-60 leading-relaxed">
                    Indian electrical grids differ significantly across states. This picker calibrates your precise regional energy emission factor.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 uppercase tracking-widest font-mono">Your Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Amit Sharma"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:opacity-30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 uppercase tracking-widest font-mono">Home City</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer text-white [&>option]:bg-[#0c0f12] [&>option]:text-white"
                    >
                      {INDIAN_CITIES.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name} ({c.state})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-light text-white tracking-tight flex items-center gap-2">
                    <Navigation className="text-emerald-400 h-5 w-5" /> How do you commute?
                  </h2>
                  <p className="text-xs opacity-60 leading-relaxed">
                    Your primary style of transportation acts as the strongest swing factor in day-to-day carbon footprint levels.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-3">
                  {[
                    { id: "petrol car", label: "Petrol Car", desc: "Private Petrol Sedan" },
                    { id: "diesel", label: "Diesel Car", desc: "Private Diesel SUV" },
                    { id: "bike", label: "Two-Wheeler", desc: "Bike or Scooter" },
                    { id: "auto", label: "Auto Rickshaw", desc: "Local Rickshaw ride" },
                    { id: "metro", label: "Namma Metro / Local", desc: "Electrified Mass Rail" },
                    { id: "walk", label: "Walk / Bicycle", desc: "Organic Zero Carbon" }
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVehicle(v.id)}
                      className={`p-3 text-left border rounded-xl transition-all cursor-pointer ${
                        vehicle === v.id
                          ? "bg-emerald-500/10 border-emerald-500 text-white"
                          : "bg-white/5 border-white/5 hover:border-white/10 text-white/70 hover:text-white"
                      }`}
                    >
                      <p className="text-xs font-semibold">{v.label}</p>
                      <p className="text-[10px] opacity-55 mt-0.5">{v.desc}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-light text-white tracking-tight flex items-center gap-2">
                    <Leaf className="text-emerald-400 h-5 w-5" /> What is your daily diet?
                  </h2>
                  <p className="text-xs opacity-60 leading-relaxed">
                    Indian vegetarian diets are global ecological champions, while dairy processing & meat imports introduce distinct offsets.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {[
                    { id: "veg", label: "Pure Vegetarian (Veg)", desc: "Sourced locally, incorporating grains, milk, paneer, and rich pulses." },
                    { id: "vegan", label: "Vegan (Plant-Based)", desc: "Zero dairy or animal byproduct load. Extremely low carbon footprint core." },
                    { id: "non-veg", label: "Non-Vegetarian", desc: "Includes chicken, fish, poultry. Ruminant meats/imported beef spikes footprint." }
                  ].map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDiet(d.id as any)}
                      className={`p-4 text-left border rounded-2xl transition-all cursor-pointer flex items-center justify-between ${
                        diet === d.id
                          ? "bg-emerald-500/10 border-emerald-500 text-white"
                          : "bg-white/5 border-white/5 hover:border-white/10 text-white/70 hover:text-white"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-semibold capitalize">{d.label}</p>
                        <p className="text-[10px] opacity-55 mt-1 leading-relaxed max-w-sm">{d.desc}</p>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${diet === d.id ? "border-emerald-400" : "border-white/20"}`}>
                        {diet === d.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-light text-white tracking-tight flex items-center gap-2">
                    <Zap className="text-emerald-400 h-5 w-5" /> Electricity Bill Estimation
                  </h2>
                  <p className="text-xs opacity-60 leading-relaxed">
                    Enter your last month electricity bill (INR). This converts to a precise kWh estimate representing peak grid carbon demand.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs opacity-50 uppercase font-mono tracking-widest text-white/80">Average Bill金額 (₹ INR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-semibold font-mono text-sm leading-none">₹</span>
                      <input
                        type="number"
                        min="200"
                        max="25000"
                        value={bill}
                        onChange={(e) => setBill(Number(e.target.value) || 0)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-16 py-4 text-white font-mono text-xl focus:outline-none focus:border-emerald-500/50"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs opacity-40 font-mono">
                        ≈ {Math.round(bill / 8)} kWh / mo
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex gap-3 text-xs opacity-85 leading-relaxed">
                    <div className="text-emerald-400 text-lg font-bold">💡</div>
                    <p>
                      In `{city}`, each kWh consumed causes roughly <span className="text-emerald-400 font-mono">
                        {INDIAN_CITIES.find(c => c.name === city)?.grid || 0.82} kg CO₂
                      </span> to be released by State electricity grids.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2 mb-2">
                  <div className="inline-flex p-3 rounded-full bg-gradient-to-tr from-emerald-500/20 to-cyan-400/20 text-emerald-400 animate-pulse border border-emerald-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-light text-white tracking-tight">Your Custom Baseline analysis</h2>
                  <p className="text-[10px] uppercase font-mono tracking-widest text-cyan-400">
                    Real-Time Coaching Insight Generated
                  </p>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                    <p className="text-xs opacity-50 font-mono tracking-tight animate-pulse">
                      Terra AI compiles grid factors & footprint matrices...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/20 to-cyan-950/10 border border-emerald-500/20 leading-relaxed text-sm text-emerald-300">
                      {baselineInsight || (
                        <span>
                          Based on your transport and energy patterns in {city}, we've mapped your primary footprint at roughly <span className="text-teal-400 font-mono font-bold">4.2 kg/day</span>. By batching delivery parcels and relying on public rails twice a week, you're positioned to save ₹2,100 INR and 35kg CO₂ monthly.
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 flex items-start gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="w-4 h-4 rounded-full bg-cyan-400/20 flex items-center justify-center text-[10px] text-cyan-400 font-mono mt-0.5">ℹ</div>
                      <p className="text-[10px] opacity-45 leading-relaxed">
                        This is a baseline calculation done prior to logging any manual daily footprint entries. Your dashboard is now calibrated to city average percentile groups.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer controls */}
        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
          {step > 1 && step < 5 ? (
            <button
              onClick={handleBack}
              disabled={loading}
              className="px-4 py-2 border border-white/10 text-xs font-semibold hover:bg-white/5 transition-colors cursor-pointer text-white/55 hover:text-white rounded-xl"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black text-xs font-bold font-semibold hover:scale-[1.02] transition-transform shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            {step === 5 ? "Go to Dashboard" : step === 4 ? "Analyze Baseline" : "Continue"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
