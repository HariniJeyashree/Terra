/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CalculateInput, calculateEmission } from "../lib/api";
import { X, Train, Car, Navigation, Pizza, Zap, ShoppingBag, Eye, CheckCircle2, RefreshCw } from "lucide-react";

interface LogEntryModalProps {
  onClose: () => void;
  onSave: (category: "transport" | "food" | "energy" | "shopping", value_kg: number, metadata: any) => void;
  city: string;
}

export default function LogEntryModal({ onClose, onSave, city }: LogEntryModalProps) {
  const [category, setCategory] = useState<"transport" | "food" | "energy" | "shopping">("transport");
  
  // Transport Sub-states
  const [vehicle, setVehicle] = useState("petrol car");
  const [distance, setDistance] = useState<number>(10);

  // Food Sub-states
  const [foodItem, setFoodItem] = useState("vegetables");
  const [foodWeight, setFoodWeight] = useState<number>(1);

  // Energy Sub-states
  const [kwh, setKwh] = useState<number>(3);

  // Shopping Sub-states
  const [orders, setOrders] = useState<number>(1);

  // Estimation Previews
  const [preCalculating, setPreCalculating] = useState(false);
  const [preValue, setPreValue] = useState<number>(0.89);
  const [preComparison, setPreComparison] = useState("");
  const [apiError, setApiError] = useState("");

  const [saving, setSaving] = useState(false);

  // Calculate real-time preview matches on changing sub-parameters
  useEffect(() => {
    let active = true;
    const body: CalculateInput = { category, city };

    if (category === "transport") {
      body.vehicleType = vehicle;
      body.distanceKm = Number(distance) || 0;
    } else if (category === "food") {
      body.foodItem = foodItem;
      body.foodWeightKg = Number(foodWeight) || 0;
    } else if (category === "energy") {
      body.electricityKwh = Number(kwh) || 0;
    } else if (category === "shopping") {
      body.deliveryOrders = Number(orders) || 0;
    }

    setPreCalculating(true);
    setApiError("");

    const delayDebounceFilename = setTimeout(() => {
      calculateEmission(body)
        .then((res) => {
          if (active) {
            setPreValue(res.co2_kg);
            setPreComparison(res.real_world_comparison);
          }
        })
        .catch((err) => {
          if (active) {
            setApiError(err.message || "Failed to estimate preview");
          }
        })
        .finally(() => {
          if (active) setPreCalculating(false);
        });
    }, 200); // 200ms debounce

    return () => {
      active = false;
      clearTimeout(delayDebounceFilename);
    };
  }, [category, vehicle, distance, foodItem, foodWeight, kwh, orders, city]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    try {
      // Validate caps per requirements
      if (category === "transport" && distance > 2000) {
        throw new Error("Safety Cap: Individual transport entries capped at 2000 km.");
      }
      if (category === "energy" && kwh > 10000) {
        throw new Error("Safety Cap: Single energy entries capped at 10000 kWh.");
      }

      // Assemble custom localized metadata payload
      let metadata: any = { activityName: "" };
      if (category === "transport") {
        metadata = {
          activityName: `${vehicle.charAt(0).toUpperCase() + vehicle.slice(1)} trip`,
          distanceKm: distance,
          vehicleType: vehicle,
          comparisonQuote: preComparison
        };
      } else if (category === "food") {
        metadata = {
          activityName: `${foodItem.charAt(0).toUpperCase() + foodItem.slice(1)} item consumed`,
          foodWeightKg: foodWeight.toString(),
          foodItem: foodItem,
          comparisonQuote: preComparison
        };
      } else if (category === "energy") {
        metadata = {
          activityName: `Household Electricity Power`,
          electricityKwh: kwh,
          comparisonQuote: preComparison
        };
      } else if (category === "shopping") {
        metadata = {
          activityName: `Online Shopping Deliveries`,
          deliveringOrders: orders,
          comparisonQuote: preComparison
        };
      }

      onSave(category, preValue, metadata);
    } catch (err: any) {
      setApiError(err.message || "Saving failed. Verify constraints.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl transition-all" id="emission_logger_modal_backdrop">
      <div className="glass-card max-w-lg w-full bg-[#050708]/90 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow decoration */}
        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 rounded-full bg-emerald-500/10 blur-[40px] pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h3 className="text-lg font-bold tracking-tight text-white">Log Carbon Activity</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg border border-white/5 hover:bg-white/5 text-white/50 hover:text-white transition-colors cursor-pointer"
            aria-label="Close logging dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {apiError && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/20 border border-red-500/20 text-xs text-red-300 leading-relaxed">
            ⚠️ {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10 flex-1">
          {/* Category selection bar */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "transport", icon: <Car className="w-4 h-4" />, label: "Transit" },
                { id: "food", icon: <Pizza className="w-4 h-4" />, label: "Food" },
                { id: "energy", icon: <Zap className="w-4 h-4" />, label: "Power" },
                { id: "shopping", icon: <ShoppingBag className="w-4 h-4" />, label: "Parcel" }
              ].map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id as any)}
                  className={`py-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    category === c.id
                      ? "bg-emerald-500/10 border-emerald-500 text-white font-semibold"
                      : "bg-white/5 border-white/5 text-white/55 hover:text-white hover:border-white/10"
                  }`}
                >
                  {c.icon}
                  <span className="text-[10px] uppercase font-mono">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Category Specific content inputs */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 min-h-[140px] flex flex-col justify-center">
            
            {category === "transport" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "petrol car", label: "Petrol Sedan" },
                    { id: "diesel", label: "Diesel Car" },
                    { id: "bike", label: "Scooter / Bike" },
                    { id: "auto", label: "Auto Rickshaw" },
                    { id: "metro", label: "Metro Train" },
                    { id: "bus", label: "Local Bus" },
                    { id: "domestic flight", label: "Domestic Flight" }
                  ].map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setVehicle(t.id)}
                      className={`py-1.5 px-3 rounded-lg border text-xs text-left cursor-pointer transition-colors ${
                        vehicle === t.id
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 font-medium"
                          : "bg-black/40 border-white/5 text-white/60 hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-white/50 font-mono text-[10px] uppercase tracking-wider">
                    <span>Distance (Kilometers)</span>
                    <span className="text-white font-semibold">{distance} km</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={vehicle === "domestic flight" ? "1200" : "150"}
                    value={distance}
                    onChange={(e) => setDistance(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-1 bg-white/10 rounded-full cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] opacity-35 font-mono">
                    <span>1 km</span>
                    <span>{vehicle === "domestic flight" ? "1200" : "150"} km</span>
                  </div>
                </div>
              </div>
            )}

            {category === "food" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">Ingredient type consumed</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "vegetables", label: "Local Seasonal Veggies" },
                      { id: "rice", label: "Paddy Rice Base" },
                      { id: "chicken", label: "Poultry Chicken" },
                      { id: "beef", label: "Imported Beef" }
                    ].map((f) => (
                      <button
                        type="button"
                        key={f.id}
                        onClick={() => setFoodItem(f.id)}
                        className={`py-2 px-3 rounded-xl border text-xs text-left cursor-pointer transition-colors ${
                          foodItem === f.id
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 font-medium"
                            : "bg-black/40 border-white/5 text-white/60 hover:text-white"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-white/50 font-mono text-[10px] uppercase tracking-wider">
                    <span>Weight / Portions (kg equivalent)</span>
                    <span className="text-white font-semibold">{foodWeight} kg</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={foodWeight}
                    onChange={(e) => setFoodWeight(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-1 bg-white/10 rounded-full cursor-pointer"
                  />
                </div>
              </div>
            )}

            {category === "energy" && (
              <div className="space-y-3">
                <p className="text-[10px] leading-relaxed opacity-55 text-white">
                  Enter domestic power consumed. We recommend taking your average meter cycle differences.
                </p>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">Domestic Grid Power (kWh)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={kwh}
                      onChange={(e) => setKwh(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/50"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs opacity-50 font-mono">
                      UNIT kWh
                    </span>
                  </div>
                </div>
              </div>
            )}

            {category === "shopping" && (
              <div className="space-y-3">
                <p className="text-[10px] leading-relaxed opacity-55 text-white">
                  Indian e-commerce delivery parcels generate shadow packaging carbon cycles of roughly 15 kg per dispatch package box.
                </p>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">Number of Amazon/Zomato parcel packets</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={orders}
                      onChange={(e) => setOrders(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/50"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs opacity-50 font-mono">
                      PACKET PACKS
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Interactive live preview and translation panel */}
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-2 relative">
            <div className="flex justify-between items-center">
              <span className="text-[9px] uppercase tracking-widest font-mono text-emerald-400 font-bold flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Core Live Footprint estimate
              </span>
              {preCalculating && (
                <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
              )}
            </div>

            <div className="flex items-baseline gap-1.5">
              <p className="text-4xl font-extralight text-white font-mono">
                {preValue.toFixed(2)}
              </p>
              <span className="text-xs uppercase font-mono text-white/50 font-bold">KG CO₂ Shadow</span>
            </div>

            <p className="text-xs text-emerald-300 leading-relaxed">
              {preComparison || "Input parameter attributes to generate structural impact."}
            </p>
          </div>

          {/* Core submit CTA */}
          <div className="pt-3 border-t border-white/5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs text-white/60 hover:text-white border border-white/10 hover:bg-white/5 rounded-xl cursor-pointer font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={preCalculating}
              className="flex-1 py-3 text-xs text-black bg-emerald-500 hover:scale-[1.02] shadow-lg shadow-emerald-500/10 font-bold rounded-xl cursor-pointer transition-transform disabled:opacity-50"
            >
              Save Entry
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
