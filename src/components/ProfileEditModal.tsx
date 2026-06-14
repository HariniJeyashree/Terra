/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserProfile } from "../types";
import { updateProfile } from "../lib/api";
import { X, MapPin, Navigation, Leaf, Zap, User, CheckCircle2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProfileEditModalProps {
  profile: UserProfile;
  onClose: () => void;
  onSaved: (updated: UserProfile) => void;
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

export default function ProfileEditModal({ profile, onClose, onSaved }: ProfileEditModalProps) {
  const [name, setName] = useState(profile.name);
  const [city, setCity] = useState(profile.city);
  const [vehicle, setVehicle] = useState(profile.vehicleType);
  const [diet, setDiet] = useState<"veg" | "non-veg" | "vegan">(profile.dietType);
  const [bill, setBill] = useState(profile.electricityBillINR);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await updateProfile({
        name: name.trim() || "Green Legend",
        city,
        vehicleType: vehicle,
        dietType: diet,
        electricityBillINR: Number(bill) || 1200
      });
      setSaved(true);
      setTimeout(() => {
        onSaved(updated);
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="max-w-lg w-full bg-[#050708]/95 border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden"
      >
        {/* Glow */}
        <div className="absolute top-[-60px] right-[-60px] w-48 h-48 rounded-full bg-emerald-500/10 blur-[50px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Edit Profile</h3>
              <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Changes saved to database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-white/40 hover:text-white transition-colors cursor-pointer"
            aria-label="Close profile editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {error && (
            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-300">
              ⚠️ {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-white/50 flex items-center gap-1.5">
              <User className="w-3 h-3" /> Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Your name"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* City */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-white/50 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> City (affects grid factor)
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-[#0a0d0f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              {INDIAN_CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} — {c.state} ({c.grid} kg CO₂/kWh)
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-white/50 flex items-center gap-1.5">
              <Navigation className="w-3 h-3" /> Primary Transport
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "petrol car", label: "Petrol Car" },
                { id: "diesel", label: "Diesel Car" },
                { id: "bike", label: "Scooter/Bike" },
                { id: "auto", label: "Auto Rickshaw" },
                { id: "metro", label: "Metro/Rail" },
                { id: "walk", label: "Walk/Cycle" }
              ].map((v) => (
                <button
                  type="button"
                  key={v.id}
                  onClick={() => setVehicle(v.id)}
                  className={`py-2 px-3 rounded-xl border text-xs text-left cursor-pointer transition-all ${
                    vehicle === v.id
                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-medium"
                      : "bg-white/[0.02] border-white/5 text-white/55 hover:text-white hover:border-white/10"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Diet */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-white/50 flex items-center gap-1.5">
              <Leaf className="w-3 h-3" /> Diet Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "veg", label: "Vegetarian" },
                { id: "vegan", label: "Vegan" },
                { id: "non-veg", label: "Non-Veg" }
              ].map((d) => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => setDiet(d.id as any)}
                  className={`py-2.5 rounded-xl border text-xs text-center cursor-pointer transition-all ${
                    diet === d.id
                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-medium"
                      : "bg-white/[0.02] border-white/5 text-white/55 hover:text-white hover:border-white/10"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Electricity Bill */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-white/50 flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Monthly Electricity Bill (₹ INR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-semibold font-mono text-sm">₹</span>
              <input
                type="number"
                min="100"
                max="50000"
                value={bill}
                onChange={(e) => setBill(Number(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-20 py-3 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-white/40 font-mono">
                ≈ {Math.round((bill || 0) / 8)} kWh
              </span>
            </div>
          </div>

          {/* Stats (read-only) */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { label: "Streak", value: `${profile.streakDays} days` },
              { label: "Lifetime CO₂", value: `${profile.totalLifetimeCo2Kg} kg` },
              { label: "Joined", value: new Date(profile.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) }
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                <p className="text-[9px] uppercase font-mono tracking-wider text-white/35 mb-1">{s.label}</p>
                <p className="text-xs font-semibold text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-xs text-white/50 hover:text-white border border-white/10 hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex-1 py-3 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-60 bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20"
          >
            {saved ? (
              <><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</>
            ) : saving ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...</>
            ) : (
              "Save Profile"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
