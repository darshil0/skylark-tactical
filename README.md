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

-   **Frontend**: React 19, Vite 6, Tailwind CSS 4
-   **Animations**: Motion (`motion/react`)
-   **Backend**: Node.js, Express, Zod (Validation)
-   **Data Visualization**: D3.js, Recharts
-   **AI Engine**: Google Generative AI (Gemini 1.5 Flash) with Search Grounding
-   **Icons**: Lucide React
-   **Styling**: Tactical UI System with custom scanline effects and grid overlays

## API Configuration

The application includes a built-in Express server that handles:

-   `GET /api/flights`: Retrieves the manifest of tracked flights.
-   `POST /api/flights`: Adds a new flight to the tracking database.
-   `PATCH /api/flights/:id`: Updates existing flight telemetry.
-   `DELETE /api/flights/:id`: Removes a flight from the system.
-   `GET /api/external/live-flights`: Proxy route for real-time ADS-B data from the OpenSky Network.

## Environment Variables

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | **Required**. Your Google AI Studio API key for flight search and telemetry analysis. |
| `APP_URL` | Optional. The public URL of the application, used for CORS and sharing links. |

## Development

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Start the development server (includes Express + Vite)**:
    ```bash
    npm run dev
    ```
3.  **Build for production**:
    ```bash
    npm run build
    ```
4.  **Start production server**:
    ```bash
    npm start
    ```

## License

MIT
