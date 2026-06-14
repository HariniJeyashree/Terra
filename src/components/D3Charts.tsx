/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { EmissionEntry, CategoryType } from "../types";

// Helper color map
export const CATEGORY_COLORS: Record<CategoryType, { stroke: string; bg: string; text: string }> = {
  transport: { stroke: "#10b981", bg: "rgba(16, 185, 129, 0.15)", text: "text-emerald-400" }, // emerald
  food: { stroke: "#0ea5e9", bg: "rgba(14, 165, 233, 0.15)", text: "text-sky-400" },     // sky
  energy: { stroke: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", text: "text-amber-400" },   // amber
  shopping: { stroke: "#a78bfa", bg: "rgba(167, 139, 250, 0.15)", text: "text-violet-400" } // violet
};

// -------------------------------------------------------------
// Donut Ring Chart with center focus information
// -------------------------------------------------------------
interface DonutRingProps {
  entries: EmissionEntry[];
}

export function DonutRing({ entries }: DonutRingProps) {
  const [hoveredCategory, setHoveredCategory] = useState<CategoryType | null>(null);

  // Group entries by category
  const totals: Record<CategoryType, number> = {
    transport: 0,
    food: 0,
    energy: 0,
    shopping: 0
  };

  entries.forEach((e) => {
    if (totals[e.category] !== undefined) {
      totals[e.category] += e.value_kg;
    }
  });

  const grandTotal = Object.values(totals).reduce((sum, v) => sum + v, 0);

  // Construct chart portions
  const categories: { category: CategoryType; value: number; percent: number }[] = [];
  (Object.keys(totals) as CategoryType[]).forEach((cat) => {
    const val = totals[cat];
    categories.push({
      category: cat,
      value: val,
      percent: grandTotal > 0 ? (val / grandTotal) * 100 : 0
    });
  });

  // SVG parameters
  const size = 200;
  const radius = 75;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 14;
  const centerCoord = size / 2;

  // Compute stroke offsets
  let currentOffset = 0;
  const segments = categories.map((c) => {
    const dashArray = `${(c.percent / 100) * circumference} ${circumference}`;
    const dashOffset = -currentOffset;
    currentOffset += (c.percent / 100) * circumference;
    return {
      ...c,
      dashArray,
      dashOffset
    };
  });

  const displayedCategory = hoveredCategory || (categories.reduce((max, cat) => cat.value > max.value ? cat : max, categories[0])?.category || "transport");
  const displayedValue = totals[displayedCategory];
  const displayedPercent = grandTotal > 0 ? ((displayedValue / grandTotal) * 100).toFixed(0) : "0";

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 justify-around w-full" id="donut_footprint_analytics_row">
      {/* Donut graphic */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-label="Emission breakdown circular donut chart"
          role="img"
          className="transform -rotate-90"
        >
          {/* Base shadow circular track */}
          <circle
            cx={centerCoord}
            cy={centerCoord}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {grandTotal === 0 ? (
            <circle
              cx={centerCoord}
              cy={centerCoord}
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={strokeWidth}
            />
          ) : (
            segments.map((seg) => {
              if (seg.value === 0) return null;
              const isSelected = hoveredCategory === seg.category;
              return (
                <circle
                  key={seg.category}
                  cx={centerCoord}
                  cy={centerCoord}
                  r={radius}
                  fill="transparent"
                  stroke={CATEGORY_COLORS[seg.category].stroke}
                  strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={seg.dashArray}
                  strokeDashoffset={seg.dashOffset}
                  className="transition-all duration-300 cursor-pointer"
                  style={{ strokeLinecap: "round" }}
                  onMouseEnter={() => setHoveredCategory(seg.category)}
                  aria-label={`${seg.category} portion: ${seg.value.toFixed(1)} kilograms, ${seg.percent.toFixed(0)} percent`}
                />
              );
            })
          )}
        </svg>

        {/* Center overlay label */}
        <div className="absolute flex flex-col items-center justify-center text-center select-none">
          <p className="text-xs uppercase tracking-widest opacity-50 font-medium">
            {displayedCategory}
          </p>
          <p className="text-3xl font-light text-white my-0.5">
            {displayedValue.toFixed(1)}
            <span className="text-xs ml-0.5 opacity-50 uppercase">kg</span>
          </p>
          <p className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10" style={{ color: CATEGORY_COLORS[displayedCategory].stroke }}>
            {displayedPercent}% of footprint
          </p>
        </div>
      </div>

      {/* Side Legend list controls */}
      <div className="flex-1 w-full space-y-3.5">
        <h4 className="text-xs uppercase tracking-widest opacity-50 font-medium pb-1.5 border-b border-white/5">
          Carbon Categories
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((c) => {
            const isSelected = displayedCategory === c.category;
            return (
              <button
                key={c.category}
                onClick={() => setHoveredCategory(c.category)}
                onMouseEnter={() => setHoveredCategory(c.category)}
                className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                  isSelected 
                    ? "bg-white/5 border-white/15 scale-[1.02] shadow-lg shadow-black/40" 
                    : "bg-transparent border-transparent hover:border-white/5"
                }`}
                aria-label={`Highlight details for ${c.category}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[c.category].stroke }}
                  />
                  <span className="text-xs font-semibold capitalize text-white">
                    {c.category}
                  </span>
                </div>
                <div className="flex items-baseline justify-between w-full">
                  <span className="text-sm font-light text-white/90">
                    {c.value.toFixed(1)} kg
                  </span>
                  <span className="text-[10px] uppercase font-mono opacity-40">
                    {c.percent.toFixed(0)}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


// -------------------------------------------------------------
// Weekly Trend and AI Forecast Line/Bar Chart (D3 Styled)
// -------------------------------------------------------------
interface TrendProps {
  pastEntries: EmissionEntry[];
  forecastPoints: {
    date: string;
    predicted: { transport: number; food: number; energy: number; shopping: number };
  }[];
}

export function TrendForecastLineChart({ pastEntries, forecastPoints }: TrendProps) {
  // Aggregate past 7 days emissions
  const pastDaysMap: Record<string, number> = {};
  const dateOptions = { weekday: 'short' } as const;

  // Let's take current and past 6 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString('en-IN', dateOptions);
    pastDaysMap[dayStr] = 0;
  }

  pastEntries.forEach((e) => {
    const dayName = new Date(e.timestamp).toLocaleDateString("en-IN", dateOptions);
    if (pastDaysMap[dayName] !== undefined) {
      pastDaysMap[dayName] += e.value_kg;
    }
  });

  const chartData: { day: string; value: number; isForecast: boolean }[] = [];
  
  // Append past days
  Object.keys(pastDaysMap).forEach((day) => {
    chartData.push({
      day,
      value: parseFloat(pastDaysMap[day].toFixed(1)),
      isForecast: false
    });
  });

  // Append forecasts
  forecastPoints.forEach((f) => {
    const totalPred = Object.values(f.predicted).reduce((sum, v) => sum + v, 0);
    chartData.push({
      day: f.date,
      value: parseFloat(totalPred.toFixed(1)),
      isForecast: true
    });
  });

  // SVG boundaries
  const width = 500;
  const height = 140;
  const paddingX = 40;
  const paddingY = 20;

  const maxVal = Math.max(...chartData.map((d) => d.value), 20); // clip min ceiling at 20
  
  // Calculate relative coordinate points
  const points = chartData.map((d, index) => {
    const x = paddingX + (index * (width - 2 * paddingX)) / (chartData.length - 1);
    const y = height - paddingY - (d.value / maxVal) * (height - 2 * paddingY);
    return { x, y, ...d };
  });

  // Generate SVG path for line segments
  let pastPath = "";
  let forecastPath = "";

  points.forEach((p, idx) => {
    if (idx === 0) {
      pastPath += `M ${p.x} ${p.y}`;
    } else if (idx < 7) {
      // Connect first 7 points (history)
      pastPath += ` L ${p.x} ${p.y}`;
      if (idx === 6) {
        forecastPath += `M ${p.x} ${p.y}`; // start forecast path from index 6
      }
    } else {
      // Connect remaining (forecast helper segment)
      forecastPath += ` L ${p.x} ${p.y}`;
    }
  });

  return (
    <div className="w-full flex flex-col" id="weekly_trends_container">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs uppercase tracking-widest opacity-50 font-medium">
          Carbon Trend & 7-Day Forecast
        </h4>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="w-4 h-[2px] bg-emerald-500 rounded-full" />
            <span className="opacity-70">Past History</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="w-4 h-[2px] border-b border-dashed border-cyan-400 rounded-full" />
            <span className="opacity-70">AI Forecast</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden h-36 bg-white/[0.02] rounded-2xl border border-white/5 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="100%"
          className="overflow-visible"
          aria-label="Carbon emission lines trend over the past week and next 7 days forecast"
          role="img"
        >
          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.03)" />
          <line x1={paddingX} y1={(height) / 2} x2={width - paddingX} y2={(height) / 2} stroke="rgba(255,255,255,0.03)" />
          <line
            x1={paddingX} y1={height - paddingY}
            x2={width - paddingX} y2={height - paddingY}
            stroke="rgba(255,255,255,0.08)"
          />

          {/* Connecting line paths */}
          {pastPath && (
            <path
              d={pastPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]"
            />
          )}
          {forecastPath && (
            <path
              d={forecastPath}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
          )}

          {/* Anchor dots and value tooltips */}
          {points.map((p, idx) => {
            const isToday = idx === 6;
            return (
              <g key={idx} className="group cursor-help">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isToday ? 5 : p.isForecast ? 3 : 4}
                  fill={isToday ? "#10b981" : p.isForecast ? "#06b6d4" : "#ffffff"}
                  stroke={isToday ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.1)"}
                  strokeWidth={isToday ? 2 : 1}
                  className="transition-all hover:scale-125"
                />
                
                {/* Micro hovering tooltips */}
                <rect
                  x={p.x - 20}
                  y={p.y - 25}
                  width="40"
                  height="16"
                  rx="3"
                  className="fill-black/95 stroke-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                />
                <text
                  x={p.x}
                  y={p.y - 14}
                  fontSize="8"
                  textAnchor="middle"
                  fill="#ffffff"
                  className="opacity-0 group-hover:opacity-100 font-mono tracking-tight font-semibold pointer-events-none"
                >
                  {p.value}kg
                </text>
              </g>
            );
          })}

          {/* Grid labels */}
          {points.map((p, idx) => {
            // Label every other point to avoid visual crowding
            if (idx % 2 !== 0 && idx !== 6) return null;
            return (
              <text
                key={`lbl-${idx}`}
                x={p.x}
                y={height - 4}
                fill="rgba(255,255,255,0.4)"
                fontSize="8"
                fontWeight="500"
                textAnchor="middle"
                className="font-sans uppercase tracking-[0.05em]"
              >
                {p.day}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
