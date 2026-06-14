# Carbon Footprint Tracker - India Eco-Calculator 🌱

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

An interactive, responsive, full-stack application designed to help users track, calculate, and minimize their daily carbon footprint using localized emission factors for Indian cities. Features an immersive, real-time 3D interactive rotating Earth globe canvas, community gamification, AI-powered tailored eco-action plans (powered by Gemini), and an offline-first highly optimized experience.

## 🛠️ Tech Stack & Architecture
- **Frontend**: React (v19) & TypeScript, Tailwind CSS, Lucide Icons, Motion (Framer Motion)
- **Interactive Visualizers**: High-fidelity custom 3D HTML5 Canvas rendering engine (Dynamic Earth Globe with biome-distinct land points, dynamic atmospheric halos, cloud shadows, and sparkling nighttime urban city web)
- **Backend**: Express.js server co-hosted securely providing robust RESTful APIs
- **Database/Persistence**: Persistent JSON-based relational state model with reliable schema
- **AI Integration**: Official `@google/genai` TypeScript SDK for regional Indian localized dynamic impact analyses and personalized carbon containment plans
- **Testing suite**: Vitest automated unit testing runner

## 🚀 Getting Started

To run this project locally, ensure you have [Node.js](https://nodejs.org/) (v22+) installed.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/terra-tracker.git
   cd terra-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   PORT=3000
   ```

4. **Start the application:**
   ```bash
   npm run build
   npm run start
   ```
   The application will be available at `http://localhost:3000`.

---

## 🧪 Automated Testing
This repository uses Vitest for robust unit testing functionality.
To run the test suite locally:
```bash
npm install
npm run test
```

The test runner scans for test matrices under `src/test/*.test.ts` to verify:
1. Standard vehicle sector carbon coefficients.
2. Regional Indian electricity grid emissions factors (e.g. South grid vs. West grid).
3. Realistic public/private transport options.

---

## 🚀 Key Standout Features

1. **Precision Lok-Sabha/Grid Level Factors**: Unlike simple calculators, our calculations utilize the real Regional Grid Factors of Indian cities (e.g. Bengaluru, Mumbai, Pune, Delhi) ensuring high-precision, actionable telemetry.
2. **Immersive 3D Celestial Canvas**: Built from scratch using native mathematical projection routines, featuring specular sunlight glints, floating clouds, day-night cycles, and active city pulsing.
3. **Optimistic UI Engine**: All logged activities are processed via an Optimistic UI state pattern. Logs reflect immediately on dashboard counters, with background transactions synching, and graceful fallback rollback snapshots for state persistence.
4. **AI-Powered Customized Recommendation engine**: Uses Google Gemini to analyze emission graphs, current streaks, and household contexts to formulate personalized, high-yield actionable nudges.

---

## ♿ Accessibility Compliance (WCAG 2.1 AA)
* **Semantic Architecture:** Built using strict semantic HTML5 elements (`<main>`, `<section>`, `<nav>`).
* **Screen Reader Optimization:** Fully integrated with descriptive `aria-label` attributes and explicit interactive `role` parameters on dynamic SVG charts and canvas visualizers.
* **Keyboard Focus Navigation:** Interactive telemetry grids and modal states utilize explicit `tabIndex` sequences to allow complete mouse-free operation.
