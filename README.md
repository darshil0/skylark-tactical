# SkyTrack - Tactical Flight Surveillance System

SkyTrack is a high-performance, real-time flight tracking application built with React, Vite, and D3.js. It features a tactical, air traffic control-inspired interface for monitoring global aviation data.

## Key Improvements (Audited)

- **Security Hardening**: Gemini AI calls are now proxied through a secure backend (Express server). API keys are never exposed to the client.
- **Robustness**:
    - Full input validation using **Zod** on the server-side.
    - UUID generation for all internal flight records.
    - Improved error handling and logging across the stack.
- **Architecture**:
    - Major refactor of `App.tsx` into specialized custom hooks (`useFlights`, `useLiveRadar`, `useFlightAlerts`, `useUserLocation`).
    - Full TypeScript migration for critical components to eliminate `any` types.
- **Performance**:
    - Server-side in-memory caching using `node-cache` for external API and AI requests, significantly reducing latency and API consumption.
- **Testing**:
    - Integrated **Vitest** for unit testing of core utility functions.
    - Automated CI/CD workflow via GitHub Actions.

## Features

-   **Tactical Map Interface**: A high-contrast, black-ops style map built with D3.js, supporting natural earth projections, smooth zooming, and interactive map layers.
-   **AI Weather Radar Layer**: Live global weather system tracking powered by Gemini 1.5 Flash with Search Grounding.
-   **Intelligent Proximity Alerts**: Real-time detection of aircraft within a user-defined radius, featuring visual highlights and optional audible alerts.
-   **AI-Powered Search**: Natural language search capabilities powered by Gemini to find specific flights or simulate data.
-   **Flight Management**: Full CRUD operations for managing a personal database of tracked flights.
-   **Deep Linking & Sharing**: Easily share specific flight tracking data via generated URLs.

## Technical Stack

-   **Frontend**: React 19, Vite, Tailwind CSS, Motion
-   **Backend**: Node.js, Express, Zod, Node-Cache
-   **Data Visualization**: D3.js, Recharts
-   **AI Engine**: Google Generative AI (Gemini 1.5 Flash)
-   **Testing**: Vitest, React Testing Library

## Getting Started

1.  **Clone the repository**.
2.  **Install dependencies**: `npm install`
3.  **Environment Setup**: Create a `.env` file in the root and add:
    ```env
    GEMINI_API_KEY=your_api_key_here
    APP_URL=http://localhost:3000
    ```
4.  **Run development server**: `npm run dev` (Starts both the Express server and Vite dev environment)
5.  **Run tests**: `npm test`
6.  **Linting**: `npm run lint`

## Architecture Overview

The application follows a modern full-stack architecture where the Express server handles all external data orchestration and AI processing. This ensures that sensitive credentials remain server-side. The frontend is built with a hook-based architecture for clean state management and performance.

## License

MIT
