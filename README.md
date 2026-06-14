# 📊 Terra: AI-Powered Habit & Carbon Behavior Change System

Terra is a high-fidelity carbon footprint tracking and behavior-modification engine built for the **Prompt Wars Challenge**, organized by **Hack2skill** and **Google for Developers**. By combining interactive, localized 3D visualizations, dynamic context-aware AI coaching, and a zero-latency engine, Terra transforms passive environmental awareness into active daily habit loops.

---

## 🎯 1. Chosen Vertical & Core Objective
*   **Vertical:** Sustainability & AI-Driven Behavioral Modification Assistant.
*   **Objective:** To eliminate user drop-off in environmental tracking applications by delivering an instantaneous user experience coupled with deeply hyper-localized, conversational AI guidance.

---

## 🧠 2. Approach and Architectural Logic

### A. Zero-Perceived-Latency via Optimistic UI
Traditional tracking apps stall user interactions behind blocking cloud writes and loading spinners. Terra utilizes an **Optimistic UI Engine** to decouple frontend rendering from database confirmations:
1. When an entry (transport, food, energy) is logged, client-side range-cap validations run immediately.
2. The entry modal is dismissed instantly, and local state speculatively generates a `temp-ID`.
3. Dashboard telemetry, localized D3.js donut rings, and the 3D globe's glow intensity recalculate and animate in parallel.
4. **State Reconciliation:** The write executes asynchronously to Firestore in the background. If successful, the `temp-ID` swaps seamlessly with the server record. On network failure, a graceful rollback to a secure state snapshot occurs, accompanied by a non-intrusive warning toast.

### B. High-Performance Math Graphics
To maintain extreme structural efficiency, complex 3D rendering was restricted from heavy WebGL assets that cause frame drops on mobile devices. Terra utilizes a mathematical dot-density engine drawn directly inside an HTMLCanvas2D context, rendering high-fidelity biomes (Sahara Desert, Amazon Jungle) and active city pulse overlays of Indian metropolitan hubs smoothly at 60 FPS.

---

## 🛠️ 3. Tech Stack & Implementation Details

*   **Frontend Core:** React 18, Vite, TypeScript (strictly typed data models for profiles, telemetry vectors, and communities), Tailwind CSS.
*   **Graphics & Visualizations:** Custom HTML5 Canvas 3D Globe (`ThreeGlobe`), Modular D3.js SVGs (Donut Breakdown Ring & 7-Day Multi-Metric Forecast Line Chart).
*   **Backend Infrastructure:** Express.js & Node.js middleware server proxying calculation routines, containerized inside Cloud Run with an Nginx reverse proxy gateway.
*   **Database Layer:** Google Cloud Firestore.

---

## 🤖 4. How the Solution Works (AI Engine Integration)
Terra leverages Google's Gemini models through an internal middleware backend proxy. 
*   **Context-Aware Orchestration:** The AI engine digests past entry historical logs, seasonal city configurations (e.g., grid load context in Chennai, Bangalore, Mumbai), and current streak configurations.
*   **Dynamic Rulesets:** Rather than spitting out generic text answers, the assistant acts as a smart behavioral coach, processing user constraints to output tailored 7-day carbon diet rulesets.

---

## 🔒 5. Security & Engineering Optimizations
*   **Zero Exposed Keys:** All interactions with the Gemini API and database mutations pass through an Express proxy layer. API tokens never reach the client bundle.
*   **Responsive Telemetry:** Handled layout aspect ratio warping across diverse viewports by attaching high-efficiency `ResizeObservers` directly to graphical canvas wrapper components.
*   **HMR WebSocket Overrides:** Configured server-level routing rules to isolate sandboxed iframe HMR conflicts, maintaining completely clean production browser console environments.

---

## 📋 6. Assumptions Made
1. **Connectivity Transitions:** Assumed volatile user networks; the engine treats background latency and temporary disconnections as expected edge cases rather than system failures.
2. **Standard Emission Factors:** Utilized localized Indian baseline coefficients for transport types and energy calculations per kilometer/kilowatt-hour.

---
