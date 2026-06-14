/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Define state interfaces
import { 
  UserProfile, 
  EmissionEntry, 
  CommunityCircle, 
  NudgeMessage, 
  ChatMessage,
  ActionItem,
  ForecastPoint
} from "./src/types";

// Setup dynamic/persistent database
interface DatabaseState {
  users: Record<string, UserProfile>;
  emissions: Record<string, EmissionEntry[]>;
  communities: CommunityCircle[];
  nudges: Record<string, NudgeMessage[]>;
  chats: Record<string, ChatMessage[]>;
}

// Default Seed Data
const DEFAULT_CITIES = [
  { name: "Bengaluru", state: "KA", grid_factor: 0.72 },
  { name: "Mumbai", state: "MH", grid_factor: 0.84 },
  { name: "Delhi", state: "DL", grid_factor: 0.81 },
  { name: "Chennai", state: "TN", grid_factor: 0.78 },
  { name: "Kolkata", state: "WB", grid_factor: 0.88 },
  { name: "Hyderabad", state: "TS", grid_factor: 0.79 },
  { name: "Pune", state: "MH", grid_factor: 0.84 }
];

const DEFAULT_DB: DatabaseState = {
  users: {
    "default-uid": {
      uid: "default-uid",
      name: "Amit Sharma",
      email: "amit.sharma@gmail.com",
      city: "Bengaluru",
      householdSize: 3,
      vehicleType: "petrol car",
      dietType: "veg",
      electricityBillINR: 2200,
      totalLifetimeCo2Kg: 52.4,
      streakDays: 12,
      joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      onboardingBaselineInsight: "Based on your tech-focused lifestyle in Bengaluru with a petrol sedan and regular delivery habits, your custom baseline is 5.4 kg/day. Transiting to Namma Metro twice a week and opting for bulk ordering can drop your emissions by an impressive 28% while saving ₹1,800 monthly!"
    }
  },
  emissions: {
    "default-uid": [
      {
        id: "entry-1",
        uid: "default-uid",
        category: "transport",
        value_kg: 4.23,
        source: "manual",
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { activityName: "Auto Rickshaw Commute", distanceKm: 15, vehicleType: "auto", comparisonQuote: "Equivalent to 6.5 hours of operating a high-eff AC." }
      },
      {
        id: "entry-2",
        uid: "default-uid",
        category: "energy",
        value_kg: 12.3,
        source: "manual",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { activityName: "Kitchen Appliances & Geyser", electricityKwh: 15, comparisonQuote: "Equals charging your phone for 1,200 cycles." }
      },
      {
        id: "entry-3",
        uid: "default-uid",
        category: "shopping",
        value_kg: 15.0,
        source: "api",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { activityName: "Zomato Dinner & Amazon Box", deliveringOrders: 1, comparisonQuote: "Takes a mature neem tree 5 days to sequester." }
      },
      {
        id: "entry-4",
        uid: "default-uid",
        category: "food",
        value_kg: 3.5,
        source: "manual",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { activityName: "Chicken Biryani Feast", foodWeightKg: "1", foodItem: "chicken", comparisonQuote: "Produces 8x the emissions of a Dal Tadka meal." }
      },
      {
        id: "entry-5",
        uid: "default-uid",
        category: "transport",
        value_kg: 18.2,
        source: "manual",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { activityName: "Weekend drive in sedan", distanceKm: 204, vehicleType: "petrol car", comparisonQuote: "Requires 1.5 saplings planted to neutralize." }
      },
      {
        id: "entry-6",
        uid: "default-uid",
        category: "food",
        value_kg: 2.9,
        source: "manual",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { activityName: "Steamed Basmati Rice lunch", foodWeightKg: "1", foodItem: "rice", comparisonQuote: "Due to high methane yield from flooded Indian paddies." }
      },
      {
        id: "entry-7",
        uid: "default-uid",
        category: "energy",
        value_kg: 8.2,
        source: "manual",
        timestamp: new Date().toISOString(),
        metadata: { activityName: "AC Bedroom Cooling", electricityKwh: 10, comparisonQuote: "Could power 80 ceiling fans running full blast." }
      }
    ]
  },
  communities: [
    {
      id: "circle-blr-south",
      name: "BLR South Green Alliance",
      members: [
        { uid: "default-uid", name: "Amit Sharma", contribution_kg: 52.4 },
        { uid: "uid-2", name: "Priyanka N.", contribution_kg: 45.1 },
        { uid: "uid-3", name: "Vikram Sen", contribution_kg: 78.6 },
        { uid: "uid-4", name: "Rohan Das", contribution_kg: 24.3 }
      ],
      monthly_goal_kg: 1000,
      current_total_kg: 820,
      created_by: "uid-3",
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "circle-delhi-loop",
      name: "Delhi Metro Commuters Club",
      members: [
        { uid: "uid-5", name: "Sneha Kapoor", contribution_kg: 12.0 },
        { uid: "uid-6", name: "Mohit Malik", contribution_kg: 18.5 }
      ],
      monthly_goal_kg: 1200,
      current_total_kg: 540,
      created_by: "uid-5",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  nudges: {
    "default-uid": [
      {
        id: "nudge-1",
        uid: "default-uid",
        message: "🔥 12 Day Streak: You've helped BLR South circle inch 82% closer to their green goal today!",
        trigger_context: "streak",
        dismissed: false,
        sent_at: new Date().toISOString()
      },
      {
        id: "nudge-2",
        uid: "default-uid",
        message: "⚡ Quick Win: Unplug chargers tonight to save INR 14 and 0.4kg of grid CO2 in Bengaluru.",
        trigger_context: "monday_forecast",
        dismissed: false,
        sent_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
      }
    ]
  },
  chats: {
    "default-uid": [
      {
        id: "chat-1",
        role: "assistant",
        content: "Namaste Amit! I am Terra, your personal carbon footprint coach. I have analyzed your transport patterns in Bengaluru. Would you like a custom commute optimization plan for tomorrow?",
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      }
    ]
  }
};

// Safe Database File I/O
function loadDB(): DatabaseState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Failed to load local DB state:", error);
  }
  // Initialize with seed data
  saveDB(DEFAULT_DB);
  return DEFAULT_DB;
}

function saveDB(state: DatabaseState) {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save local DB state:", error);
  }
}

// Initialize db memory state
let db = loadDB();

// Setup Gemini SDK
const geminiApiKey = process.env.GEMINI_API_KEY || "";
let aiClient: GoogleGenAI | null = null;

if (geminiApiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
    console.log("Gemini custom client initialized safely.");
  } catch (err) {
    console.error("Critical: Failed to prelink Gemini client", err);
  }
} else {
  console.warn("WARN: GEMINI_API_KEY environment variable is not defined. AI functionality will use elegant local fallbacks.");
}

// Helper to retry Gemini requests that experience transient errors (like 503, 429)
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 2, delayMs = 500): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateOrUnavailable = 
      error?.status === 503 || 
      error?.status === 429 || 
      error?.message?.includes("503") || 
      error?.message?.includes("429") ||
      error?.message?.includes("demand") ||
      error?.message?.includes("UNAVAILABLE") ||
      error?.message?.includes("RESOURCE_EXHAUSTED");

    if (retries > 0 && isRateOrUnavailable) {
      console.warn(`Gemini call encountered dynamic transient state. Retrying in ${delayMs}ms... (Retries left: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return retryWithBackoff(fn, retries - 1, delayMs * 1.5);
    }
    throw error;
  }
}

// Express Core Middleware
app.use(express.json());

// API RATE LIMITING (10 requests/minute per endpoint approximate local state tracker)
const rateLimits: Record<string, { count: number; resetAt: number }> = {};
function apiRateLimit(req: Request, res: Response, next: () => void) {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous";
  const endpoint = req.path;
  const key = `${ip}:${endpoint}`;
  const now = Date.now();

  if (!rateLimits[key] || now > rateLimits[key].resetAt) {
    rateLimits[key] = { count: 1, resetAt: now + 60000 };
    return next();
  }

  // Use a relaxed limit of 30 requests/minute for client state-syncing forecast
  const limitThreshold = endpoint === "/api/forecast" ? 30 : 10;

  if (rateLimits[key].count >= limitThreshold) {
    return res.status(429).json({
      error: "Rate limit exceeded. Take a deep breath & carbon-conscious pause!",
      retryAfterMs: rateLimits[key].resetAt - now
    });
  }

  rateLimits[key].count++;
  next();
}

app.use("/api/calculate", apiRateLimit);
app.use("/api/forecast", apiRateLimit);
app.use("/api/nudge-generate", apiRateLimit);
app.use("/api/coach", apiRateLimit);
app.use("/api/action-plan", apiRateLimit);


// -------------------------------------------------------------
// CORE MATHEMATICAL ENDPOINT: POST /calculate
// -------------------------------------------------------------
app.post("/api/calculate", (req: Request, res: Response) => {
  try {
    const { category, vehicleType, distanceKm, foodWeightKg, foodItem, electricityKwh, city, customGridFactor, deliveryOrders } = req.body;

    // Reject negative values
    if (distanceKm < 0 || foodWeightKg < 0 || electricityKwh < 0 || deliveryOrders < 0) {
      return res.status(400).json({ error: "Input values cannot be negative." });
    }

    // Capacity caps for security & integrity
    if (distanceKm > 2000) {
      return res.status(400).json({ error: "Distance exceeds individual trip limit of 2000 km." });
    }
    if (electricityKwh > 10000) {
      return res.status(400).json({ error: "Electricity consumption exceeds safety limit of 10,000 kWh." });
    }

    let val = 0;
    let explanation = "";

    switch (category) {
      case "transport": {
        const km = Number(distanceKm) || 0;
        const vType = String(vehicleType).toLowerCase();
        let factor = 0.089; // Default petrol car

        if (vType === "petrol car") {
          factor = 0.089;
          explanation = "petrol passenger car commute";
        } else if (vType === "diesel") {
          factor = 0.041;
          explanation = "diesel car commute";
        } else if (vType === "metro" || vType === "local train" || vType === "metro/local train") {
          factor = 0.011;
          explanation = "clean Namma Metro / local train mass transit";
        } else if (vType === "domestic flight") {
          factor = 0.255;
          explanation = "high-intensity domestic aviation flight";
        } else if (vType === "bus") {
          factor = 0.004;
          explanation = "bengaluru public bus fleet travel";
        } else if (vType === "bike" || vType === "motorcycle") {
          factor = 0.035;
          explanation = "two-wheeler transit emission";
        } else if (vType === "auto" || vType === "auto rickshaw") {
          factor = 0.025;
          explanation = "three-wheeler auto rickshaw run";
        } else if (vType === "walk" || vType === "bicycle") {
          factor = 0;
          explanation = "zero-emission wellness commute";
        }

        val = km * factor;
        break;
      }
      case "food": {
        const weight = Number(foodWeightKg) || 0.5; // defaults to 500g
        const item = String(foodItem).toLowerCase();
        let factor = 0.4; // Default veggie

        if (item === "beef") {
          factor = 27.0;
          explanation = "imported high-intensity ruminant beef processing";
        } else if (item === "chicken") {
          factor = 3.5;
          explanation = "chicken poultry production chain";
        } else if (item === "rice") {
          factor = 2.9;
          explanation = "Indian flooded paddy fields high methane emission";
        } else if (item === "vegetables" || item === "veggies" || item === "local vegetables") {
          factor = 0.4;
          explanation = "locally sourced seasonal indian garden crops";
        } else if (item === "veg meal" || item === "paneer") {
          factor = 1.2;
          explanation = "traditional indian vegetarian dairy-infused plate";
        }

        val = weight * factor;
        break;
      }
      case "energy": {
        const kwh = Number(electricityKwh) || 0;
        
        // Dynamic grid factor support based on state
        let factor = 0.82; // Default India CEA grid average
        if (customGridFactor) {
          factor = Number(customGridFactor);
        } else {
          const matchedCity = DEFAULT_CITIES.find(c => c.name.toLowerCase() === String(city || "").toLowerCase());
          if (matchedCity) {
            factor = matchedCity.grid_factor;
          }
        }

        val = kwh * factor;
        explanation = `household grid supply power consumption (at ${factor} kg CO2/kWh)`;
        break;
      }
      case "shopping": {
        const orders = Number(deliveryOrders) || 1;
        // 15 shadow kg per online delivery packaging + parcel transit chain
        val = orders * 15;
        explanation = "doorstep ecommerce shadow dispatch packaging loop";
        break;
      }
      default:
        return res.status(400).json({ error: "Invalid category typed." });
    }

    const co2_kg = parseFloat(val.toFixed(2));
    
    // Real world comparison string formula
    let comparison = "";
    if (co2_kg < 1) {
      comparison = `= Just ${Math.round(co2_kg * 1000)}g. Equivalent to charging a phone for ${Math.round(co2_kg * 100)} hours.`;
    } else if (co2_kg < 5) {
      comparison = `= ${co2_kg} kg. Equivalent to operating a regular ceiling fan for ${Math.round(co2_kg * 12)} hours.`;
    } else if (co2_kg < 15) {
      comparison = `= ${co2_kg} kg. Equivalent to running a 1.5 ton split AC for ${Math.round(co2_kg * 1.5)} hours in peak summer.`;
    } else {
      comparison = `= ${co2_kg} kg. Takes a fully grown Neem tree ${Math.round(co2_kg / 0.1)} days to capture from the atmosphere.`;
    }

    res.json({
      co2_kg,
      category,
      explanation,
      real_world_comparison: comparison
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// -------------------------------------------------------------
// POST /api/forecast
// -------------------------------------------------------------
app.post("/api/forecast", (req: Request, res: Response) => {
  try {
    const { history } = req.body; // Array of past 7 days logs
    
    // Auto prediction fallback generator - predicted next 7 days in cycles
    const daysOut: ForecastPoint[] = [];
    const dateOpts = { weekday: 'short' } as const;

    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayStr = d.toLocaleDateString('en-IN', dateOpts);

      // Give a realistic slight reducing trend as habit kicks in
      daysOut.push({
        date: dayStr,
        predicted: {
          transport: parseFloat((2 + Math.sin(i) * 1.2).toFixed(1)),
          food: parseFloat((1.5 + Math.cos(i) * 0.4).toFixed(1)),
          energy: parseFloat((4.5 - i * 0.2).toFixed(1)),
          shopping: i % 3 === 0 ? 15 : 0
        }
      });
    }

    res.json({ forecast: daysOut });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// -------------------------------------------------------------
// DYNAMIC PERSONALIZED OFFLINE FALLBACK ENGINE
// (Serves highly customized plans/advice when quota is exhausted)
// -------------------------------------------------------------

function getPersonalizedOfflinePlan(profile: any, emissions: any[]): ActionItem[] {
  const city = profile?.city || "Bengaluru";
  const diet = profile?.dietType || "non-veg";
  const vehicle = profile?.vehicleType || "";
  const elecBill = Number(profile?.electricityBillINR) || 0;

  const plan: ActionItem[] = [];

  // Day 1 Commute Habit Shift
  if (vehicle.toLowerCase().includes("car") || vehicle.toLowerCase().includes("four") || vehicle.toLowerCase().includes("suv")) {
    plan.push({
      day: 1,
      dayName: "Monday",
      title: "Namma Metro Ride",
      description: `Switch your single-rider commute in ${city} for the Metro or electric public bus.`,
      co2SavedKg: 5.6,
      effort: "easy",
      motivation: "Avoid long gridlocks and save over ₹150 in fuel/parking expenses!"
    });
  } else {
    plan.push({
      day: 1,
      dayName: "Monday",
      title: "Carpool / Shared Commute",
      description: `Use a shared auto pool or carpool for your office journey in ${city}.`,
      co2SavedKg: 3.2,
      effort: "easy",
      motivation: "Half the emissions and enjoy pleasant conversations with fellow commuters."
    });
  }

  // Day 2 Energy Standby Load
  if (elecBill > 2500) {
    plan.push({
      day: 2,
      dayName: "Tuesday",
      title: "Standby Smart Switch",
      description: "Unplug heavy appliance sockets (geyser, microwave, home theatre) when offline.",
      co2SavedKg: 1.4,
      effort: "easy",
      motivation: `Standby parasitic loads can drain 8-12% of your monthly ₹${Math.round(elecBill)} electricity utility.`
    });
  } else {
    plan.push({
      day: 2,
      dayName: "Tuesday",
      title: "Geyser Power Management",
      description: "Shut off water heater boilers 5 minutes before ending your morning shower.",
      co2SavedKg: 0.9,
      effort: "easy",
      motivation: "Remanent thermal heat in the tank is fully sufficient while clipping grid spikes."
    });
  }

  // Day 3 Diet Choice Swap
  if (diet === "non-veg") {
    plan.push({
      day: 3,
      dayName: "Wednesday",
      title: "Traditional Plant Tiffin",
      description: "Choose organic hand-pound ragi, millets, or locally farm-grown seasonal greens.",
      co2SavedKg: 2.1,
      effort: "medium",
      motivation: "Swapping sheep/poultry meats for farm-direct local grains reduces water and carbon footprints by 90%."
    });
  } else {
    plan.push({
      day: 3,
      dayName: "Wednesday",
      title: "Locally Sourced Organics",
      description: "Avoid long-packaged items and purchase locally grown seasonal fruits and vegetables of South India.",
      co2SavedKg: 0.8,
      effort: "easy",
      motivation: "Saves massive shadow packaging emissions while securing high-vitamin farm nutrition."
    });
  }

  // Day 4 Smart Delivery Batching
  plan.push({
    day: 4,
    dayName: "Thursday",
    title: "Eco Bottle / No-Plastic Bag",
    description: "Keep a foldable cotton grocery carrier and a reusable stainless steel flask in your backpack.",
    co2SavedKg: 0.5,
    effort: "easy",
    motivation: "Slickly side-steps single-use bottles and paper bags during quick local market buys."
  });

  // Day 5 AC Calibration
  plan.push({
    day: 5,
    dayName: "Friday",
    title: "Thermostat Set to 26°C",
    description: "Align your air conditioner cooling limit strictly to 26°C and employ a low ceiling fan.",
    co2SavedKg: 3.8,
    effort: "easy",
    motivation: "Every single degree Celsius raised above 21°C saves approximately 6.5% of compressor energy!"
  });

  // Day 6 Delivery Consolidation
  plan.push({
    day: 6,
    dayName: "Saturday",
    title: "Batch Online Deliveries",
    description: "Combine all weekly grocery/food items into a single bulk order instead of fragmented single parcels.",
    co2SavedKg: 4.5,
    effort: "medium",
    motivation: "Prevents courier delivery micro-cycles emitting tailpipe pollutants right inside your colony."
  });

  // Day 7 Community Accountability Check
  plan.push({
    day: 7,
    dayName: "Sunday",
    title: "Green Circle Campaign",
    description: "Document your weekly net streak with your neighborhood local sustainability group.",
    co2SavedKg: 10.0,
    effort: "hard",
    motivation: "Community shared success increases continuous adoption of high-impact carbon habits by 4x!"
  });

  return plan;
}

function stripMarkdownFormatting(text: string): string {
  if (!text) return "";
  return text.replace(/[*#]/g, "");
}

function cleanObjectTextOfMarkdown(obj: any): any {
  if (typeof obj === "string") {
    return stripMarkdownFormatting(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanObjectTextOfMarkdown);
  }
  if (obj && typeof obj === "object") {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = cleanObjectTextOfMarkdown(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

function getPersonalizedOfflineNudge(ctx: string, profile: any): string {
  const city = profile?.city || "Bengaluru";
  const diet = profile?.dietType || "non-veg";
  const vehicle = profile?.vehicleType || "two-wheeler";

  if (ctx === "high_emission") {
    if (vehicle.toLowerCase().includes("car") || vehicle.toLowerCase().includes("four")) {
      return `💡 Spike warning in ${city}! Toggle your SUV commute to Namma Metro today to trim 6kg CO₂ and save ₹180!`;
    }
    return `💡 Energy alert! Swap your single-rider ride for an EV scooter share to bypass morning jams in ${city}.`;
  }
  if (ctx === "weekly_overview") {
    return `📈 Looking good, ${profile?.name || "sustainable buddy"}! Check your weekly progress against the 12% lower Bengaluru benchmark.`;
  }
  if (diet === "non-veg" && Math.random() > 0.5) {
    return `🍽️ Green Bite: Choosing local South Indian veggie options for lunch cuts footprint by 1.8kg!`;
  }
  return `⚡ Habit Win: Switching stand-by TV and geyser sockets offline trims ₹120 off your upcoming bill!`;
}

function getPersonalizedOfflineCoachResponse(profile: any, userPrompt?: string): string {
  const p = profile || { name: "Green Hero", city: "Bengaluru", dietType: "non-veg", vehicleType: "petrol-car", electricityBillINR: 2200 };
  const query = (userPrompt || "").toLowerCase();
  
  let intro = `Namaste ${p.name}! I am currently running in a smart offline coaching mode. Based on your active profile elements in **${p.city}** (diet: **${p.dietType}**, transit: **${p.vehicleType}**), here is customized advice for you:\n\n`;

  if (query.includes("diet") || query.includes("food") || query.includes("veg") || query.includes("eat") || query.includes("meal")) {
    return intro + `### 🍏 Targeted Food & Diet Actions
1. **Prioritize Indian Millets (Ragi, Jowar) (Easy)**
   - **CO₂ Reduction**: 2.3 kg CO₂ per kg of grain replaced.
   - **Financial Saving**: Save ~₹40/kg compared to processed imported rice/wheat.
   - **Why it matters**: Millets thrive in dry Deccan soils with nearly zero synthetic nitrate fertilization, slashing agricultural carbon footprints by up to 85%!
2. **Switch to Fresh Tiffin Pots (Easy)**
   - **CO₂ Reduction**: 1.1 kg CO₂ weekly.
   - **Financial Saving**: Save ₹60 in transport/packaging delivery fees.
   - **Why it matters**: Bringing zero-mile homemade tiffin boxes cancels delivery vehicle emissions entirely.`;
  }

  if (query.includes("electricity") || query.includes("power") || query.includes("bill") || query.includes("energy") || query.includes("ac") || query.includes("geyser") || query.includes("utility")) {
    const savings = Math.round(Number(p.electricityBillINR) * 0.15 || 300);
    return intro + `### ⚡ Energy & Electricity Efficiency Actions
1. **Calibrate AC to 26°C with ceiling fan (Medium)**
   - **CO₂ Reduction**: 4.1 kg CO₂ per night of operation.
   - **Financial Saving**: Shaves ₹${savings} off your monthly electricity bills!
   - **Why it matters**: Air conditioning load is the single largest residential grid burner. Each 1°C increase saves 6% power.
2. **Standby Kill-Switch habit (Easy)**
   - **CO₂ Reduction**: 0.8 kg CO₂ weekly.
   - **Financial Saving**: Saves ~₹50 on invisible standby current draw.
   - **Why it matters**: Microwaves, geysers, and adapters load the grid silently even when not in direct use.`;
  }

  if (query.includes("commute") || query.includes("travel") || query.includes("metro") || query.includes("car") || query.includes("bus") || query.includes("bike") || query.includes("transport")) {
    return intro + `### 🚗 Low-Carbon Commute Strategies
1. **Combine Namma Metro Loops (Easy)**
   - **CO₂ Reduction**: 4.8 kg CO₂ per work trip.
   - **Financial Saving**: Save ₹120-180 in surge prices or fuel.
   - **Why it matters**: Utilizing modern electric Metro links is the single most powerful shift an urban citizen of ${p.city} can make to halt tailpipe diesel/petrol pollution.
2. **First/Last-Mile EV Fleet (Easy)**
   - **CO₂ Reduction**: 1.5 kg CO₂ per trip.
   - **Why it matters**: Opting for zero-tailpipe electric auto-pools or rental bikes instead of heavy solo cabs keeps local residential air pristine.`;
  }

  // Balanced generic view
  return intro + `### 🌟 Selected Sustainability Checklist
1. **First-Step Commute Shift (Easy)**
   - **Commute Tip**: Switch your regular solo ride to Metro / EV shuttles for a day. Saves ~4.8 kg CO₂ and ₹120.
2. **AC & Geyser Smart Slashes (Medium)**
   - **Energy Tip**: Maintain your AC at 26°C. Swapping standby geysers off early trims ₹${Math.round(Number(p.electricityBillINR) * 0.08 || 150)} weekly structure.
3. **Deccan Millet lunch swaps (Easy)**
   - **Food Tip**: Opt for plant-based grains (like ragi or jowar) once this week, saving 2.1 kg CO₂ and enjoying authentic regional wellness.`;
}


// -------------------------------------------------------------
// POST /api/nudge-generate
// -------------------------------------------------------------
app.post("/api/nudge-generate", async (req: Request, res: Response) => {
  const triggerContext = req.body?.triggerContext || "monday_forecast";
  const uid = "default-uid";
  const profile = db?.users?.[uid] || DEFAULT_DB.users[uid] || { uid, name: "Green Hero", city: "Bengaluru", dietType: "veg" as const, vehicleType: "metro", electricityBillINR: 2200 };

  try {
    const { userSummary } = req.body;

    if (!aiClient) {
      return res.json({
        nudge: getPersonalizedOfflineNudge(triggerContext, profile)
      });
    }

    const prompt = `You are Terra, a high-converting Indian carbon habit-change UX engineer. Generate an actionable, positive, urgent but warm micro-coaching notification (max 100 chars, no hashtags, use Indian contexts like INR, metro, local, autorecycling, state CEA electricity or seasonal items).
Do NOT include any asterisks (*) or hashtag symbols (#).
Theme: [${triggerContext}]
Context: [${JSON.stringify(userSummary || 'User is doing well')}]
Output ONLY the message string.`;

    const response = await retryWithBackoff(() => 
      aiClient!.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.8,
          maxOutputTokens: 60
        }
      })
    );

    const msg = response.text ? response.text.trim().replace(/^"|"$/g, "") : getPersonalizedOfflineNudge(triggerContext, profile);
    res.json({ nudge: stripMarkdownFormatting(msg) });
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      console.info("Gemini API Quota reached (429). Flowing beautiful personalized offline nudge.");
    } else {
      console.warn("Gemini Nudge generation completed via offline fallback:", error.message || error);
    }
    res.json({ nudge: getPersonalizedOfflineNudge(triggerContext, profile) });
  }
});


// -------------------------------------------------------------
// STREAMING COOPERATIVE ENDPOINT: POST /api/coach
// -------------------------------------------------------------
app.post("/api/coach", async (req: Request, res: Response) => {
  const { message, emission_summary } = req.body;
  const uid = "default-uid";
  const profile = db?.users?.[uid] || DEFAULT_DB.users[uid] || { uid, name: "Green Hero", city: "Bengaluru", dietType: "veg" as const, vehicleType: "metro", electricityBillINR: 2200 };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const fallbackCoachResponse = stripMarkdownFormatting(getPersonalizedOfflineCoachResponse(profile, message));

  if (!aiClient) {
    // Stream local fallback message token by token to make UI beautiful
    const tokens = fallbackCoachResponse.split(" ");
    let i = 0;
    const interval = setInterval(() => {
      if (i < tokens.length) {
        res.write(`data: ${JSON.stringify({ text: tokens[i] + " " })}\n\n`);
        i++;
      } else {
        res.write("data: [DONE]\n\n");
        clearInterval(interval);
        res.end();
      }
    }, 45);
    return;
  }

  try {
    const sysPrompt = "You are Terra, a friendly carbon footprint coach for Indian citizens. Access to user's full emission history of transport, food, energy, shopping is supplied in prompt. You must maintain a warm, non-judgmental, motivating tone. For every single suggestion, you MUST clearly include: CO₂ saved, cost in INR saved, and difficulty (easy/medium/hard). Always structure output to offer exactly 3 interesting options. Never shame. Celebrate wins enthusiastically, referencing Indian cities (e.g. Bengaluru ORR, Mumbai Local, Delhi winter/summer, Chennai sea breeze). Use rupee symbols ₹. Do NOT use any formatting symbols like asterisks (*) or double asterisks (**) for bolding, nor heading hashes (#) under any circumstances. Keep the output as clean normal text, structured elegantly with capital title words and standard spacing instead.";
    
    const userPrompt = `Emission context info: ${JSON.stringify(emission_summary || {})}
User statement: "${message}"`;

    const stream = await retryWithBackoff(() => 
      aiClient!.models.generateContentStream({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: sysPrompt,
          temperature: 0.7,
        }
      })
    );

    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: stripMarkdownFormatting(chunk.text) })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      console.info("Gemini API Quota reached (429). Streaming personalized offline coach response.");
    } else {
      console.warn("Gemini voice coach completed via offline fallback:", error.message || error);
    }
    
    // Stream the clean dynamic fallback text word by word
    const tokens = fallbackCoachResponse.split(" ");
    for (const token of tokens) {
      res.write(`data: ${JSON.stringify({ text: token + " " })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  }
});


// -------------------------------------------------------------
// JSON STRUCTURED API: POST /api/action-plan
// -------------------------------------------------------------
app.post("/api/action-plan", async (req: Request, res: Response) => {
  try {
    const { userProfile, emissions } = req.body;
    const uid = "default-uid";
    const profile = userProfile || db?.users?.[uid] || DEFAULT_DB.users[uid] || { uid, name: "Green Hero", city: "Bengaluru", dietType: "veg" as const, vehicleType: "metro", electricityBillINR: 2200 };
    const offlinePlan = getPersonalizedOfflinePlan(profile, emissions || []);

    if (!aiClient) {
      return res.json({ plan: offlinePlan });
    }

    const prompt = `You are Terra, a high-fidelity carbon habit designer. Generate a customized 7-day sustainability plan tailored to this active profile: ${JSON.stringify(profile || {})} and weekly history: ${JSON.stringify(emissions || [])}. 

You MUST return your response as a valid JSON object matching this schema:
{
  "plan": [
    {
      "day": number,
      "dayName": "Monday",
      "title": "Short title",
      "description": "Short specific actionable instruction",
      "co2SavedKg": number,
      "effort": "easy" | "medium" | "hard",
      "motivation": "Fun local motivation phrase"
    }
  ]
}

Ensure the days index 1 to 7. Use only rupees context, Indian cities or Namma Metro, local trains, auto pools, tiffin boxes, CEA factors. Do NOT contain any formatting symbols like asterisks (*) or double asterisks (**), or hashtag symbols (#) in any returned string value. Return ONLY clean raw JSON.`;

    const response = await retryWithBackoff(() => 
      aiClient!.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.5,
        }
      })
    );

    if (response.text) {
      try {
        const parsed = JSON.parse(response.text.trim());
        if (parsed && Array.isArray(parsed.plan)) {
          return res.json(cleanObjectTextOfMarkdown(parsed));
        }
      } catch (jsonErr) {
        console.warn("Failed to parse dynamic plan response, using baseline:", jsonErr, response.text);
      }
    }

    res.json({ plan: cleanObjectTextOfMarkdown(offlinePlan) });
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      console.info("Gemini API Quota reached (429). Flowing beautiful personalized offline plan.");
    } else {
      console.warn("Action plan generation fell back to offline baseline:", error.message || error);
    }
    const { userProfile, emissions } = req.body;
    const uid = "default-uid";
    const profile = userProfile || db?.users?.[uid] || DEFAULT_DB.users[uid] || { uid, name: "Green Hero", city: "Bengaluru", dietType: "veg" as const, vehicleType: "metro", electricityBillINR: 2200 };
    res.json({ plan: getPersonalizedOfflinePlan(profile, emissions || []) });
  }
});


// -------------------------------------------------------------
// FRONTEND PERSISTENCE LAYER (CRUD SIMULATING FIRESTORE REPLICATE)
// -------------------------------------------------------------

// Read current user profile
app.get("/api/profile", (req: Request, res: Response) => {
  const uid = "default-uid";
  const profile = db.users[uid] || DEFAULT_DB.users["default-uid"];
  res.json(profile);
});

// Update user profile (e.g. Onboarding or changes)
app.post("/api/profile", (req: Request, res: Response) => {
  const uid = "default-uid";
  const { city, householdSize, vehicleType, dietType, electricityBillINR, name } = req.body;
  
  const currentProfile = db.users[uid] || { 
    uid, 
    name: "Green Hero", 
    email: "hero@terra.org", 
    city: "Bengaluru",
    householdSize: 3,
    vehicleType: "metro",
    dietType: "veg" as const,
    electricityBillINR: 2200,
    totalLifetimeCo2Kg: 0, 
    streakDays: 1, 
    joinedAt: new Date().toISOString() 
  };
  
  // Calculate a baseline insight using Gemini if available, or locally immediately
  const cityMatched = DEFAULT_CITIES.find(c => c.name.toLowerCase() === (city || "").toLowerCase());
  const factor = cityMatched ? cityMatched.grid_factor : 0.82;
  const carbonEst = Math.round((electricityBillINR / 8) * factor * 0.12); // rough estimate

  const localInsight = `Based on your life in ${city || "Bengaluru"} with ${vehicleType || "metro"} transit and a ${dietType} diet, we estimate your starting footprint at ${carbonEst}kg/month. Switching to electric bike feeds and shutting secondary ventilation cuts this down dynamically by 32%!`;

  const updatedProfile: UserProfile = {
    ...currentProfile,
    uid,
    name: name || currentProfile.name || "Green Hero",
    email: currentProfile.email || "hero@terra.org",
    city: city || "Bengaluru",
    householdSize: Number(householdSize) || 2,
    vehicleType: vehicleType || "metro",
    dietType: dietType || "veg",
    electricityBillINR: Number(electricityBillINR) || 1200,
    totalLifetimeCo2Kg: currentProfile.totalLifetimeCo2Kg || 0,
    streakDays: currentProfile.streakDays || 1,
    joinedAt: currentProfile.joinedAt || new Date().toISOString(),
    onboardingBaselineInsight: localInsight
  };

  db.users[uid] = updatedProfile;
  saveDB(db);
  res.json(updatedProfile);
});

// Get user emission entries
app.get("/api/emissions", (req: Request, res: Response) => {
  const uid = "default-uid";
  const entries = db.emissions[uid] || [];
  res.json(entries);
});

// Create general logged entry
app.post("/api/emissions", async (req: Request, res: Response) => {
  const uid = "default-uid";
  const { category, value_kg, metadata } = req.body;

  const newEntry: EmissionEntry = {
    id: "entry-" + Math.random().toString(36).substring(2, 9),
    uid,
    category,
    value_kg: Number(value_kg) || 0.1,
    source: "manual",
    timestamp: new Date().toISOString(),
    metadata: metadata || { activityName: "Custom Activity" }
  };

  if (!db.emissions[uid]) {
    db.emissions[uid] = [];
  }
  
  db.emissions[uid].unshift(newEntry); // Add to head of logs

  // Add up to cumulative lifetime kg
  if (db.users[uid]) {
    const total = db.emissions[uid].reduce((sum, e) => sum + e.value_kg, 0);
    db.users[uid].totalLifetimeCo2Kg = parseFloat(total.toFixed(1));
    
    // Increment streak on log
    db.users[uid].streakDays = (db.users[uid].streakDays || 0) + 1;
  }

  // Handle Nudge trigger conditions
  // High-emission entry > 5kg -> automatically generates a reframe alternatives nudge!
  if (newEntry.value_kg > 5) {
    const triggerMsg = getPersonalizedOfflineNudge("high_emission", db.users[uid]);
    const newNudge: NudgeMessage = {
      id: "nudge-" + Math.random().toString(36).substring(2, 9),
      uid,
      message: triggerMsg,
      trigger_context: "high_emission",
      dismissed: false,
      sent_at: new Date().toISOString()
    };
    if (!db.nudges[uid]) db.nudges[uid] = [];
    db.nudges[uid].unshift(newNudge);
  }

  // Update matched communities contribution
  const defaultComm = db.communities.find(c => c.id === "circle-blr-south");
  if (defaultComm) {
    const member = defaultComm.members.find(m => m.uid === uid);
    if (member) {
      member.contribution_kg = db.users[uid].totalLifetimeCo2Kg;
    } else {
      defaultComm.members.push({ uid, name: db.users[uid].name, contribution_kg: db.users[uid].totalLifetimeCo2Kg });
    }
    // recalculate totals
    defaultComm.current_total_kg = parseFloat(defaultComm.members.reduce((sum, m) => sum + m.contribution_kg, 0).toFixed(1));
  }

  saveDB(db);
  res.json({ entry: newEntry, user: db.users[uid] });
});

// Get user nudges
app.get("/api/nudges", (req: Request, res: Response) => {
  const uid = "default-uid";
  const list = db.nudges[uid] || [];
  res.json(list.filter(n => !n.dismissed));
});

// Dismiss a nudge
app.post("/api/nudges/dismiss", (req: Request, res: Response) => {
  const uid = "default-uid";
  const { id } = req.body;
  const list = db.nudges[uid] || [];
  const found = list.find(n => n.id === id);
  if (found) {
    found.dismissed = true;
    saveDB(db);
  }
  res.json({ success: true });
});

// Get communities
app.get("/api/communities", (req: Request, res: Response) => {
  res.json(db.communities);
});

// Create community circle
app.post("/api/communities", (req: Request, res: Response) => {
  const uid = "default-uid";
  const { name, monthly_goal_kg } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Circle name is required" });
  }

  const uName = db.users[uid]?.name || "Green Legend";

  const newCircle: CommunityCircle = {
    id: "circle-" + Math.random().toString(36).substring(2, 9),
    name,
    members: [
      { uid, name: uName, contribution_kg: db.users[uid]?.totalLifetimeCo2Kg || 0 }
    ],
    monthly_goal_kg: Number(monthly_goal_kg) || 1000,
    current_total_kg: db.users[uid]?.totalLifetimeCo2Kg || 0,
    created_by: uid,
    createdAt: new Date().toISOString()
  };

  db.communities.push(newCircle);
  saveDB(db);
  res.json(newCircle);
});

// Join community circle
app.post("/api/communities/join", (req: Request, res: Response) => {
  const uid = "default-uid";
  const { circleId } = req.body;

  const circle = db.communities.find(c => c.id === circleId);
  if (!circle) {
    return res.status(404).json({ error: "Circle not found" });
  }

  const uName = db.users[uid]?.name || "Green Legend";
  const alreadyMember = circle.members.some(m => m.uid === uid);

  if (!alreadyMember) {
    circle.members.push({
      uid,
      name: uName,
      contribution_kg: db.users[uid]?.totalLifetimeCo2Kg || 0
    });
    circle.current_total_kg = parseFloat(circle.members.reduce((sum, m) => sum + m.contribution_kg, 0).toFixed(1));
    saveDB(db);
  }

  res.json(circle);
});

// Get Chat History
app.get("/api/coach/history", (req: Request, res: Response) => {
  const uid = "default-uid";
  res.json(db.chats[uid] || []);
});

// Add message to History
app.post("/api/coach/message", (req: Request, res: Response) => {
  const uid = "default-uid";
  const { role, content } = req.body;

  const newMsg = {
    id: "msg-" + Math.random().toString(36).substring(2, 9),
    role: role || "user",
    content: stripMarkdownFormatting(content || ""),
    timestamp: new Date().toISOString()
  };

  if (!db.chats[uid]) db.chats[uid] = [];
  db.chats[uid].push(newMsg);
  saveDB(db);
  res.json(newMsg);
});

// Clear Chat History
app.post("/api/coach/clear", (req: Request, res: Response) => {
  const uid = "default-uid";
  db.chats[uid] = [
    {
      id: "chat-1",
      role: "assistant",
      content: "Namaste! I've cleared our chat record. Ready to chart a fresh slate: what carbon goals are we hitting today?",
      timestamp: new Date().toISOString()
    }
  ];
  saveDB(db);
  res.json(db.chats[uid]);
});


// -------------------------------------------------------------
// VITE AND ASSETS ROUTING LAYER (Standard Full-Stack)
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Vite Dev Server middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Serve static compiled output in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[TERRA SERVER] Express API running on http://localhost:${PORT}`);
  });
}

startServer();
