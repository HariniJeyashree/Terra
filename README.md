# Carbon Footprint Tracker - Terra🌱

An interactive, responsive, full-stack application designed to help users track, calculate, and minimize their daily carbon footprint using localized emission factors for Indian cities. Features an immersive, real-time 3D interactive rotating Earth globe canvas, community gamification, AI-powered tailored eco-action plans, and an offline-first highly optimized experience.

---

## 🎯 Challenge Parameters

* **Chosen Vertical:** Sustainability, Environmental Telemetry & Conversational AI Coaching.
* **Target Audience:** Indian metropolitan citizens seeking actionable, highly contextual carbon reduction.

---

## 🧠 Approach and Architectural Logic

To achieve an optimal blend of performance, security, and smart context-driven decision-making, the system utilizes a three-tier architecture:

1.  **State Speculation (Optimistic UI Logic):** Traditional carbon trackers suffer from high user drop-off due to network latency during database writes. Terra implements an Optimistic UI state pattern. The client bundle performs immediate validation and range-caps, dismissing the logger modal instantly. Dashboard metrics and the 3D globe's telemetry recalculate immediately on a local speculative state, while actual data persistence synchronizes asynchronously with the background server.
2.  **Resource Efficiency via Native Math Projections:** Instead of overloading mobile viewports with bulky, unoptimized WebGL assets, the interactive 3D earth canvas is built from scratch using native mathematical projection routines inside an HTML5 Canvas2D layer. This locks performance at 60 FPS while keeping the bundle lightweight.
3.  **Secure AI Processing:** To protect critical infrastructure and prevent runtime API key leaks, the frontend never interfaces directly with LLM networks. Instead, a strict Express.js middleware proxy handles context compilation and sanitizes system prompts before querying the AI models.

---

## 🛠️ Tech Stack & Architecture

* **Frontend:** React (v19) & TypeScript, Tailwind CSS, Lucide Icons, Motion (Framer Motion)
* **Interactive Visualizers:** High-fidelity custom 3D HTML5 Canvas rendering engine (Dynamic Earth Globe with biome-distinct land points, dynamic atmospheric halos, cloud shadows, and sparkling nighttime urban city web)
* **Backend:** Express.js server co-hosted securely providing robust RESTful APIs
* **Database/Persistence:** Persistent JSON-based relational state model with reliable schema
* **AI Integration:** Official `@google/genai` TypeScript SDK for regional Indian localized dynamic impact analyses and personalized carbon containment plans
* **Testing Suite:** Vitest automated unit testing runner

---

## 🤖 How the Solution Works

1.  **Data Ingestion:** The user logs daily domestic or transit activities.
2.  **Regional Grid Calibration:** The application maps incoming inputs against localized Indian regional power grids (e.g., tracking distinct emissions coefficients for the Southern Grid vs. the Western Grid).
3.  **Context Assembly:** The system aggregates user trends, historic performance graphs, ongoing streaks, and geographical constraints into a single sanitized state block.
4.  **AI Engine Decisioning:** The `@google/genai` SDK processes this structured history using the Gemini model to synthesize dynamic, hyper-localized 7-day carbon diet rulesets rather than generic eco-tips.

---

## 📋 Key Assumptions Made

* **Grid Stability baselines:** Emission calculations assume the Central Electricity Authority (CEA) standard baseline grid factors for India (averaging roughly 0.72–0.84 kg CO2 per kWh depending on specific municipal grids).
* **Graceful Degradation:** Assumed highly volatile mobile networks. If background synchronization fails, the engine assumes connection loss, activates local state rollbacks using secure snapshots, and pushes a safe warning alert to avoid corrupt data states.

---

## 🧪 Automated Testing

This repository uses Vitest for robust unit testing functionality. To run the test suite locally:

```bash
npm install
npm run test
