# SkyTrack - Tactical Flight Surveillance System

SkyTrack is a high-performance, real-time flight tracking application built with React, Vite, and D3.js. It features a tactical, air traffic control-inspired interface for monitoring global aviation data.

## Features

-   **Tactical Map Interface**: A high-contrast, black-ops style map built with D3.js, supporting natural earth projections, smooth zooming, **animated flight trajectories**, and interactive map layers.
-   **AI Weather Radar Layer**: Live global weather system tracking powered by Gemini with Search Grounding, identifying storms and precipitation centers in real-time.
-   **Tactical Airspace Sectors**: Visualization of major Flight Information Regions (FIRs) and tactical airspace boundaries.
-   **Intelligent Proximity Alerts**: Real-time detection of aircraft within a user-defined radius (up to 250NM), featuring pulsing visual highlights, callsign identification in the HUD, and optional audible synthesizer tones.
-   **Live Radar Ingestion**: Real-time flight data fetching from ADSB-Exchange and Google Search Grounding to provide current aircraft positions.
-   **AI-Powered Search**: Natural language search capabilities powered by Gemini 1.5 Flash to find specific flights or simulate data.
-   **ATC Communication Decryption**: Anonymized, simulated ATC transcripts based on current flight sectors for enhanced situational awareness.
-   **Flight Management**: Full CRUD operations for managing a personal database of tracked flights.
-   **Deep Linking & Sharing**: Easily share specific flight tracking data via generated URLs.
-   **Adaptive Mobile Experience**: Fully optimized for mobile with a collapsible flight manifest and specialized touch interactions.

## Technical Stack

-   **Frontend**: React 18, Vite, Tailwind CSS
-   **Animations**: Motion (`motion/react`)
-   **Data Visualization**: D3.js, Recharts
-   **AI Engine**: Google Generative AI (Gemini) with Search Grounding
-   **Icons**: Lucide React
-   **Styling**: Modern Tactical UI (Black-ops aesthetic)

## Getting Started

1.  **Clone the repository**.
2.  **Install dependencies**: `npm install`
3.  **Set up environment**: Define `GEMINI_API_KEY` in your environment.
4.  **Run development server**: `npm run dev`
5.  **Build for production**: `npm run build`

## License

MIT
