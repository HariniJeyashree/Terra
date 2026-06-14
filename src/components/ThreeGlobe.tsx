/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";

interface GlobeProps {
  city: string;
  co2Value: number;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export default function ThreeGlobe({ city, co2Value }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Determine glow color by footprint percentile
  // Under 6kg: green, 6-12kg: yellow, over 12kg: red
  let glowColor = "rgba(16, 185, 129, 0.85)"; // Emerald-500
  let glowTailwind = "text-emerald-400";
  let ratingLabel = "Neutral (Top 18% BLR)";
  if (co2Value > 12) {
    glowColor = "rgba(239, 68, 68, 0.85)"; // Red-500
    glowTailwind = "text-red-400";
    ratingLabel = "High-Emission (Bottom 30%)";
  } else if (co2Value > 6) {
    glowColor = "rgba(245, 158, 11, 0.85)"; // Amber-500
    glowTailwind = "text-amber-400";
    ratingLabel = "Average (Top 55%)";
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = canvas.width;
    let height = canvas.height;

    // Handle ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        canvas.width = w * window.devicePixelRatio;
        canvas.height = h * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        width = w;
        height = h;
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // High-fidelity continent detection (gives a highly realistic biological world map)
    function isLand(phi: number, theta: number): boolean {
      const lat = phi * (180 / Math.PI);
      const lon = (theta * (180 / Math.PI)) - 180;

      // Antarctica
      if (lat < -60) return true;

      // Greenland
      if (lat >= 60 && lat <= 83 && lon >= -73 && lon <= -12) {
        // Taper at South
        if (lat < 72) {
          const margin = (72 - lat) * 2.2;
          if (lon < -73 + margin || lon > -12 - margin) return false;
        }
        return true;
      }

      // North America
      if (lat >= 7 && lat <= 75 && lon >= -168 && lon <= -52) {
        // Cut out Hudson Bay
        if (lat >= 51 && lat <= 65 && lon >= -95 && lon <= -72) return false;
        // Cut out Gulf of Mexico
        if (lat >= 15 && lat <= 30 && lon >= -100 && lon <= -81) return false;
        // Baja California / Gulf of California cutout
        if (lat >= 22 && lat <= 32 && lon >= -115 && lon <= -110) return false;

        // Alaska peninsula narrowing
        if (lat > 55 && lon < -140) {
          if (lat < 65 && lon < -165) return false;
        }
        // Central America taper
        if (lat < 15) {
          const center = -86 + (lat - 7) * 0.75;
          const width = 1.6 + (lat - 7) * 0.4;
          return Math.abs(lon - center) < width;
        }
        return true;
      }

      // South America
      if (lat >= -56 && lat <= 13 && lon >= -82 && lon <= -34) {
        let westLimit = -82;
        if (lat < -20) {
          westLimit = -70 + (lat + 20) * (12 / 36);
        } else {
          westLimit = -82 + (lat + 5) * (7 / 18);
        }
        let eastLimit = -34;
        if (lat < -8) {
          eastLimit = -34 + (lat + 8) * (31 / 48);
        } else {
          eastLimit = -34 - (lat + 8) * 1.5;
        }
        return lon >= westLimit && lon <= eastLimit;
      }

      // Africa
      if (lat >= -35 && lat <= 37 && lon >= -18 && lon <= 51) {
        if (lat > 12 && lat < 30 && lon > 32) {
          if (lon > 43 - (lat - 12) * 0.6) return false; // Red Sea separation
        }
        let westLimit = -18;
        if (lat < 5) {
          westLimit = -18 + (5 - lat) * 0.65;
          if (westLimit > 10) westLimit = 10;
        }
        let eastLimit = 51;
        if (lat > 11) {
          eastLimit = 51 - (lat - 11) * 1.5;
        } else if (lat < 11) {
          eastLimit = 51 - (11 - lat) * 0.35;
        }
        return lon >= westLimit && lon <= eastLimit;
      }

      // Madagascar
      if (lat >= -25 && lat <= -12 && lon >= 43 && lon <= 51) return true;

      // Europe
      if (lat >= 35 && lat <= 71 && lon >= -10 && lon <= 30) {
        if (lat < 44 && lon > -5 && lon < 30) {
          if (lat >= 36 && lat <= 44 && lon >= -10 && lon <= -2) return true; // Iberia
          if (lat >= 37 && lat <= 46 && lon >= 10 && lon <= 16) return true;  // Italy
          if (lat >= 35 && lat <= 43 && lon >= 20 && lon <= 26) return true;  // Greece/Balkans
          return false;
        }
        if (lon < -2 && lat > 50) return false;
        if (lat > 54 && lat < 65 && lon > 12 && lon < 24) return false; // Baltic Sea
        return true;
      }

      // United Kingdom & Ireland
      if (lat >= 50 && lat <= 61 && lon >= -11 && lon <= 2) {
        if (lon < -5.5 && lat >= 51 && lat <= 56) return true; // Ireland
        if (lon >= -6 && lon <= 2 && lat >= 50 && lat <= 59) return true; // UK
      }

      // Asia
      if (lat >= 1.5 && lat <= 77 && lon >= 30 && lon <= 180) {
        if (lat < 30 && lon < 60) {
          if (lat > 15 && lat < 30 && lon > 48 && lon < 60) {
            if (lon > 48 + (lat - 15) * 0.8) return false; // Persian Gulf
          }
          return lat >= 12 && lon >= 35; // Arabian Peninsula
        }
        if (lat > 37 && lat < 48 && lon > 47 && lon < 55) return false; // Caspian Sea
        if (lat > 40 && lat < 47 && lon > 27 && lon < 42) return false; // Black Sea

        // India peninsula
        if (lat >= 5 && lat < 25 && lon >= 68 && lon < 88) {
          const center = 77.5;
          const width = 10.5 - (24 - lat) * 0.45;
          return Math.abs(lon - center) < Math.max(1.2, width);
        }

        // Indochina
        if (lat >= 1 && lat < 22 && lon >= 95 && lon < 110) {
          if (lat < 7) {
            return Math.abs(lon - 102) < 1.0; // Malay Peninsula
          }
          return true;
        }
        return true;
      }

      // Japan
      if (lat >= 31 && lat <= 46 && lon >= 129 && lon <= 146) {
        const centerLon = 130 + (lat - 31) * 0.95;
        return Math.abs(lon - centerLon) < 1.8;
      }

      // Korea Peninsula
      if (lat >= 34 && lat <= 41 && lon >= 125 && lon <= 130) {
        return true;
      }

      // Taiwan
      if (lat >= 21.8 && lat <= 25.3 && lon >= 119.8 && lon <= 122.2) {
        return true;
      }

      // Sri Lanka
      if (lat >= 5.9 && lat <= 9.8 && lon >= 79.5 && lon <= 81.9) {
        return true;
      }

      // Indonesia & Philippines
      if (lat >= -9 && lat <= 19 && lon >= 95 && lon <= 141) {
        // Sumatra
        if (lat >= -6 && lat <= 6 && lon >= 95 && lon <= 106) {
          const sumatraCenter = 100 - lat * 0.9;
          return Math.abs(lon - sumatraCenter) < 2.5;
        }
        // Java
        if (lat >= -9 && lat <= -6 && lon >= 105 && lon <= 116) {
          return true;
        }
        // Borneo
        if (lat >= -4 && lat <= 7 && lon >= 108 && lon <= 119) {
          if (lon < 110 && lat > 4) return false;
          return true;
        }
        // Sulawesi
        if (lat >= -6 && lat <= 2 && lon >= 119 && lon <= 125) {
          return true;
        }
        // Philippines
        if (lat >= 5 && lat <= 19 && lon >= 117 && lon <= 126) {
          return (Math.sin(lat * 1.5) + Math.cos(lon * 1.5)) > 0.1;
        }
        // New Guinea
        if (lat >= -9 && lat <= 0 && lon >= 130 && lon <= 141) {
          const height = 4 - Math.abs(lat + 4.5);
          return Math.abs(lon - 136) < (height * 1.5 + 2);
        }
      }

      // Australia
      if (lat >= -39 && lat <= -10 && lon >= 112 && lon <= 154) {
        if (lat >= -39 && lat < -31 && lon > 120 && lon < 140) return false; // Bight
        if (lat > -26 && lat <= -10 && lon > 135 && lon < 143) {
          if (lat > -16.5) return false;
          if (lon > 135.5 && lon < 141) return false; // Carpentaria
        }
        return true;
      }

      // Tasmania
      if (lat >= -44 && lat <= -40 && lon >= 143.5 && lon <= 148.5) return true;

      // New Zealand
      if (lat >= -47 && lat <= -34 && lon >= 165 && lon <= 179) {
        const centerLon = 165 + (lat + 47) * 1.1;
        return Math.abs(lon - centerLon) < 1.5;
      }

      return false;
    }

    // Build dense continental land points grid for realistic detailed biomes placement
    interface LandPoint {
      nx: number;
      ny: number;
      nz: number;
      colorType: "lush" | "india" | "desert" | "ice" | "mountain" | "tropical";
      phi: number;
      theta: number;
    }

    const landPoints: LandPoint[] = [];
    const phiStep = 0.022;   // High resolution density 
    const thetaStep = 0.026; // High resolution density

    for (let phi = -1.52; phi <= 1.52; phi += phiStep) {
      for (let theta = 0; theta < Math.PI * 2; theta += thetaStep) {
        if (isLand(phi, theta)) {
          const nx = Math.cos(phi) * Math.cos(theta);
          const ny = Math.sin(phi);
          const nz = Math.cos(phi) * Math.sin(theta);

          const lat = phi * (180 / Math.PI);
          const lon = (theta * (180 / Math.PI)) - 180;

          let colorType: "lush" | "india" | "desert" | "ice" | "mountain" | "tropical" = "lush";
          
          if (lat >= 8 && lat <= 36 && lon >= 68 && lon <= 88) {
            colorType = "india"; // India: highly vibrant bright emerald green
          } else if (
            (lat >= 26 && lat <= 38 && lon >= 70 && lon <= 102) ||    // Himalayas / Tibetan Plateau
            (lat >= -55 && lat <= 12 && lon >= -78 && lon <= -68) ||   // Andes
            (lat >= 32 && lat <= 65 && lon >= -125 && lon <= -105) ||  // Rockies
            (lat >= 44 && lat <= 48 && lon >= 5 && lon <= 16)          // Alps
          ) {
            colorType = "mountain"; // Earthy mountain highlight
          } else if (
            (lat >= -15 && lat <= 6 && lon >= -75 && lon <= -45) ||    // Amazon Basin
            (lat >= -6 && lat <= 6 && lon >= 10 && lon <= 28) ||       // Congo Basin
            (lat >= -10 && lat <= 10 && lon >= 95 && lon <= 145)       // Indonesia / SE Asia
          ) {
            colorType = "tropical"; // Deep rainforest green
          } else if (
            (lat >= 14 && lat <= 30 && lon >= -16 && lon <= 35) ||     // Sahara
            (lat >= 12 && lat <= 32 && lon >= 35 && lon <= 58) ||      // Arabian desert
            (lat >= 38 && lat <= 50 && lon >= 80 && lon <= 118) ||     // Gobi Desert
            (lat >= -35 && lat <= -18 && lon >= 113 && lon <= 142) ||  // Australian Outback
            (lat >= -28 && lat <= -18 && lon >= 15 && lon <= 30)       // Kalahari
          ) {
            colorType = "desert"; // Golden sandy orange
          } else if (lat < -60 || lat > 72) {
            colorType = "ice"; // Polar white
          }

          landPoints.push({ nx, ny, nz, colorType, phi, theta });
        }
      }
    }

    // Coastal shelf points generation (shallow water halo)
    const shelfPoints: { nx: number; ny: number; nz: number; phi: number; theta: number }[] = [];
    const shelfPhiStep = 0.035;
    const shelfThetaStep = 0.04;
    for (let phi = -1.5; phi <= 1.5; phi += shelfPhiStep) {
      for (let theta = 0; theta < Math.PI * 2; theta += shelfThetaStep) {
        if (!isLand(phi, theta) && phi > -0.95 && phi < 0.95) {
          const checkOffsets = [
            [0.035, 0], [-0.035, 0], [0, 0.04], [0, -0.04],
            [0.035, 0.04], [-0.035, -0.04]
          ];
          let nearLand = false;
          for (const [dp, dt] of checkOffsets) {
            if (isLand(phi + dp, theta + dt)) {
              nearLand = true;
              break;
            }
          }
          if (nearLand) {
            const nx = Math.cos(phi) * Math.cos(theta);
            const ny = Math.sin(phi);
            const nz = Math.cos(phi) * Math.sin(theta);
            shelfPoints.push({ nx, ny, nz, phi, theta });
          }
        }
      }
    }

    // Floating Clouds Layer above the Earth
    interface CloudPoint {
      nx: number;
      ny: number;
      nz: number;
      scale: number;
      seed: number;
    }
    const cloudPoints: CloudPoint[] = [];
    for (let k = 0; k < 60; k++) {
      const phi = Math.random() * 2.4 - 1.2;
      const theta = Math.random() * Math.PI * 2;
      cloudPoints.push({
        nx: Math.cos(phi) * Math.cos(theta),
        ny: Math.sin(phi),
        nz: Math.cos(phi) * Math.sin(theta),
        scale: Math.random() * 12 + 6,
        seed: Math.random()
      });
    }

    // Generates general background Stars
    const stars: { x: number; y: number; size: number; alpha: number }[] = [];
    for (let k = 0; k < 60; k++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.3
      });
    }

    // Mapped cities (positioned exactly relative to rotating Earth sphere coords)
    const citiesOffsets = [
      { name: "Bengaluru", phi: 0.22, theta: 4.54 },
      { name: "Mumbai", phi: 0.33, theta: 4.45 },
      { name: "Delhi", phi: 0.49, theta: 4.46 },
      { name: "Chennai", phi: 0.23, theta: 4.57 },
      { name: "Kolkata", phi: 0.39, theta: 4.75 },
      { name: "Hyderabad", phi: 0.30, theta: 4.52 },
      { name: "Pune", phi: 0.32, theta: 4.47 }
    ];

    let angleX = 0.22; // subtle forward tilt
    let angleY = 0.0035; // continuous orbital spin speed
    let currentYRotation = 0;

    function rotateY(pt: Point3D, angle: number): Point3D {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: pt.x * cos - pt.z * sin,
        y: pt.y,
        z: pt.x * sin + pt.z * cos
      };
    }

    function rotateX(pt: Point3D, angle: number): Point3D {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: pt.x,
        y: pt.y * cos - pt.z * sin,
        z: pt.y * sin + pt.z * cos
      };
    }

    let pulseSize = 4;
    let pulseGrowing = true;

    function render() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);

      // Dynamically calculate radius based on actual parent dimensions
      const currentRadius = Math.min(width, height) * 0.44 || 140;

      // Draw starry back space
      ctx.fillStyle = "#020406";
      ctx.fillRect(0, 0, width, height);

      for (const s of stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x * width, s.y * height, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      const cx = width / 2;
      const cy = height / 2;

      // Draw background space nebula glow
      const spaceGlow = ctx.createRadialGradient(cx, cy, currentRadius * 0.4, cx, cy, currentRadius * 1.6);
      spaceGlow.addColorStop(0, "rgba(16, 185, 129, 0.03)");
      spaceGlow.addColorStop(0.5, "rgba(56, 189, 248, 0.02)");
      spaceGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = spaceGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // 1. Draw solid marine ocean background sphere
      const oceanGrad = ctx.createRadialGradient(cx - currentRadius * 0.2, cy - currentRadius * 0.2, currentRadius * 0.1, cx, cy, currentRadius);
      oceanGrad.addColorStop(0, "#0c1b33");    // bright turquoise-blue seabed
      oceanGrad.addColorStop(0.3, "#09152a");  // deep deep ocean navy
      oceanGrad.addColorStop(0.7, "#050d1a");  // dark midnight ocean
      oceanGrad.addColorStop(0.95, "#0d2847"); // blue coast reflection on shelf
      oceanGrad.addColorStop(1, "#123154");    // bright rim edge glow in ocean blue
      ctx.fillStyle = oceanGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
      ctx.fill();

      // 1.5. Render Coastal Shelf Highlights (shallow waters hugging continents)
      for (const sp of shelfPoints) {
        const pt = {
          x: sp.nx * (currentRadius - 0.5),
          y: sp.ny * (currentRadius - 0.5),
          z: sp.nz * (currentRadius - 0.5)
        };
        let rPt = rotateY(pt, currentYRotation);
        rPt = rotateX(rPt, angleX);

        if (rPt.z > 0) {
          const x2d = cx + rPt.x;
          const y2d = cy + rPt.y;

          const dotScale = Math.max(0.12, rPt.z / currentRadius);
          const dotRadius = Math.max(1.1, 3.4 * dotScale);

          const lx = -0.38;
          const ly = -0.38;
          const lz = 0.84;
          const dot = (rPt.x * lx + rPt.y * ly + rPt.z * lz) / currentRadius;

          if (dot >= -0.15) {
            const intensity = Math.max(0.15, (dot + 0.3) / 1.3);
            ctx.fillStyle = `rgba(14, 116, 144, ${intensity * 0.45})`; // Beautiful bright glowing cyan/teal shelf water
            ctx.beginPath();
            ctx.arc(x2d, y2d, dotRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Slow dynamic continuous rotations
      currentYRotation += angleY;
      if (currentYRotation > Math.PI * 2) currentYRotation -= Math.PI * 2;

      // 2. Render Continental Landmasses (front face z > 0)
      for (const p of landPoints) {
        // Project onto the active radius dynamically
        const pt = {
          x: p.nx * currentRadius,
          y: p.ny * currentRadius,
          z: p.nz * currentRadius
        };
        let rPt = rotateY(pt, currentYRotation);
        rPt = rotateX(rPt, angleX);

        if (rPt.z > 0) { // Front hemisphere of the sphere
          const x2d = cx + rPt.x;
          const y2d = cy + rPt.y;

          // Scale dot sizing according to 3D perspective depth (curving near edge of Earth sphere)
          const dotScale = Math.max(0.12, rPt.z / currentRadius);
          
          // Slightly larger dots to overlap seamlessly and form a completely solid, real continent texture
          const dotRadius = Math.max(1.85, 4.2 * dotScale);

          // Sunlight lighting shading factor (Sun shines from top-left-front)
          const lx = -0.38;
          const ly = -0.38;
          const lz = 0.84;
          const dot = (rPt.x * lx + rPt.y * ly + rPt.z * lz) / currentRadius;
          
          // Day side gets dynamic rich geographical biome coloring with high-fidelity shading
          if (dot >= -0.05) {
            const intensity = Math.max(0.2, (dot + 0.3) / 1.3);

            if (p.colorType === "india") {
              ctx.fillStyle = `rgba(34, 197, 94, ${intensity * 0.98})`; // Vivid lush emerald green
            } else if (p.colorType === "tropical") {
              ctx.fillStyle = `rgba(16, 124, 65, ${intensity * 0.96})`; // Deep tropical jungle green (Amazon/Congo)
            } else if (p.colorType === "mountain") {
              ctx.fillStyle = `rgba(168, 120, 80, ${intensity * 0.92})`;  // Rocky mountain earthy bronze/brown
            } else if (p.colorType === "lush") {
              ctx.fillStyle = `rgba(34, 139, 34, ${intensity * 0.95})`;   // Lush temperate green forests
            } else if (p.colorType === "desert") {
              ctx.fillStyle = `rgba(224, 130, 4, ${intensity * 0.95})`;   // Golden Sahara sand
            } else {
              ctx.fillStyle = `rgba(240, 249, 255, ${intensity * 0.98})`;  // Snowy polar caps
            }

            ctx.beginPath();
            ctx.arc(x2d, y2d, dotRadius, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Shaded night side: dark landscape with twinkling golden city light web!
            const isUrban = (p.colorType === "india") || // India highly lit
                            (p.phi > 0.4 && p.phi < 0.65 && p.theta > 2.8 && p.theta < 3.8) || // Europe
                            (p.phi > 0.4 && p.phi < 0.65 && p.theta > 5.5 && p.theta < 6.1) || // East Asia / Japan
                            (p.phi > 0.32 && p.phi < 0.62 && p.theta > 1.6 && p.theta < 2.3);    // US East Coast

            // Render dark shaded land base
            ctx.fillStyle = `rgba(4, 12, 24, 0.45)`;
            ctx.beginPath();
            ctx.arc(x2d, y2d, dotRadius, 0, Math.PI * 2);
            ctx.fill();

            // Sines-based twinkling noise for beautiful living cities
            if (isUrban && (Math.sin(p.phi * 120 + p.theta * 50 + currentYRotation * 18) > 0.4)) {
              ctx.fillStyle = `rgba(253, 224, 71, ${0.5 * Math.abs(dot)})`; // Sparkling warm yellow
              ctx.beginPath();
              ctx.arc(x2d, y2d, 1.25, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // 3. Render cloud points floating above the Earth (rotate at a slightly different atmospheric speed!)
      const currentCloudRotation = currentYRotation * 1.22 + 1.2;
      for (const cp of cloudPoints) {
        const pt = {
          x: cp.nx * (currentRadius + 3.5),
          y: cp.ny * (currentRadius + 3.5),
          z: cp.nz * (currentRadius + 3.5)
        };
        let rPt = rotateY(pt, currentCloudRotation);
        rPt = rotateX(rPt, angleX);

        if (rPt.z > 0) {
          const x2d = cx + rPt.x;
          const y2d = cy + rPt.y;

          const dotScale = Math.max(0.1, rPt.z / currentRadius);
          
          // Sunlight shading for clouds
          const lx = -0.38;
          const ly = -0.38;
          const lz = 0.84;
          const dot = (rPt.x * lx + rPt.y * ly + rPt.z * lz) / currentRadius;

          // Clouds fully lit on day side, darker and thinner on night side
          const cloudAlpha = dot > 0 ? (0.24 + 0.12 * dot) : Math.max(0.02, 0.24 + dot * 0.4);

          ctx.fillStyle = `rgba(255, 255, 255, ${cloudAlpha * dotScale})`;
          ctx.beginPath();
          ctx.arc(x2d, y2d, cp.scale * dotScale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Draw a subtle cyber-grid lines overlays (to maintain high tech coordinate telemetry)
      ctx.strokeStyle = "rgba(56, 189, 248, 0.045)"; // teal-cyan cyan lines
      ctx.lineWidth = 0.5;

      const numLatGrid = 10;
      const numLonGrid = 12;
      for (let i = 1; i < numLatGrid; i++) {
        const phi = (Math.PI / numLatGrid) * i - Math.PI / 2;
        ctx.beginPath();
        for (let j = 0; j <= 50; j++) {
          const theta = (2 * Math.PI / 50) * j;
          const pt: Point3D = {
            x: currentRadius * Math.cos(phi) * Math.cos(theta),
            y: currentRadius * Math.sin(phi),
            z: currentRadius * Math.cos(phi) * Math.sin(theta)
          };
          let rPt = rotateY(pt, currentYRotation);
          rPt = rotateX(rPt, angleX);
          if (rPt.z > 0) {
            const x2d = cx + rPt.x;
            const y2d = cy + rPt.y;
            if (j === 0) ctx.moveTo(x2d, y2d);
            else ctx.lineTo(x2d, y2d);
          }
        }
        ctx.stroke();
      }

      // 5. Render Atmosphere Outer halo rim glow (gives 3D volumetric spherical dome)
      const atmGrad = ctx.createRadialGradient(cx, cy, currentRadius * 0.96, cx, cy, currentRadius * 1.05);
      atmGrad.addColorStop(0, "rgba(56, 189, 248, 0)");       // completely transparent inside
      atmGrad.addColorStop(0.3, "rgba(56, 189, 248, 0.16)");  // soft cyan atmosphere density
      atmGrad.addColorStop(0.8, "rgba(16, 185, 129, 0.32)");  // emerald airglow ring
      atmGrad.addColorStop(1, "rgba(16, 185, 129, 0)");       // fading out to cosmos
      ctx.fillStyle = atmGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric thin rings
      ctx.strokeStyle = "rgba(16, 185, 129, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(56, 189, 248, 0.04)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius + 6, 0, Math.PI * 2);
      ctx.stroke();

      // 6. Render India Active City Pulse highlights on Earth surface
      if (pulseGrowing) {
        pulseSize += 0.2;
        if (pulseSize > 12) pulseGrowing = false;
      } else {
        pulseSize -= 0.2;
        if (pulseSize < 4.5) pulseGrowing = true;
      }

      for (const target of citiesOffsets) {
        const pLat = target.phi;
        const pLon = target.theta;

        const mPt: Point3D = {
          x: currentRadius * Math.cos(pLat) * Math.cos(pLon),
          y: currentRadius * Math.sin(pLat),
          z: currentRadius * Math.cos(pLat) * Math.sin(pLon)
        };

        let rM = rotateY(mPt, currentYRotation);
        rM = rotateX(rM, angleX);

        if (rM.z > 0) { // City is currently on the visible side
          const mx = cx + rM.x;
          const my = cy + rM.y;

          const isCurrentCity = target.name.toLowerCase() === city.toLowerCase();

          // Main node center point
          ctx.beginPath();
          ctx.arc(mx, my, isCurrentCity ? 4.5 : 2.0, 0, Math.PI * 2);
          ctx.fillStyle = isCurrentCity ? glowColor : "rgba(255, 255, 255, 0.45)";
          ctx.fill();

          if (isCurrentCity) {
            // Echo pulses
            ctx.beginPath();
            ctx.arc(mx, my, pulseSize, 0, Math.PI * 2);
            ctx.strokeStyle = glowColor.replace("0.85", "0.22");
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Label city informational widget popup inside Canvas
            ctx.fillStyle = "rgba(4, 10, 18, 0.92)";
            ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
            ctx.lineWidth = 1;

            const boxW = 100;
            const boxH = 38;
            const bx = mx - boxW / 2;
            const by = my - boxH - 12;

            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(bx, by, boxW, boxH, 6);
            } else {
              ctx.rect(bx, by, boxW, boxH);
            }
            ctx.fill();
            ctx.stroke();

            // City name
            ctx.font = "bold 9.5px sans-serif";
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.fillText(target.name, mx, by + 14);

            // Footprint description
            ctx.font = "500 8px monospace";
            if (co2Value > 12) ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
            else if (co2Value > 6) ctx.fillStyle = "rgba(245, 158, 11, 0.9)";
            else ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
            ctx.fillText(`${co2Value} kg CO₂/d`, mx, by + 28);

            // Connect pin line
            ctx.beginPath();
            ctx.moveTo(mx, by + boxH);
            ctx.lineTo(mx, my - 3);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [city, co2Value, glowColor]);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0 rounded-3xl" id="earth_interactive_stage">
      <canvas ref={canvasRef} className="w-full h-full opacity-75" />
      
      {/* Front-facing glowing percentile metadata badges overlay */}
      <div className="absolute top-6 left-6 z-10 glass-card px-4 py-3 bg-black/60 border border-white/10 flex items-center gap-3 backdrop-blur-md rounded-2xl shadow-xl">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
        <div className="flex flex-col text-xs">
          <span className="opacity-60 text-[9px] uppercase tracking-wider font-mono text-emerald-400">Atmospheric Mesh Link</span>
          <span className="font-semibold text-white flex items-center gap-1.5 mt-0.5">
            {city} Nodes <span className={`text-[9.5px] px-2 py-0.5 rounded-full bg-black/40 ${glowTailwind} font-mono border border-white/5`}>{ratingLabel}</span>
          </span>
        </div>
      </div>
    </div>
  );
}