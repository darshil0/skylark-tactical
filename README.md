# SkyTrack - Tactical Flight Surveillance System

SkyTrack is a high-performance, real-time flight tracking application built with React, Vite, and D3.js. It features a tactical, air traffic control-inspired interface for monitoring global aviation data.

## Features

-   **Tactical Map Interface**: A high-contrast, black-ops style map built with D3.js, supporting natural earth projections, smooth zooming, **animated flight trajectories**, and interactive map layers.
-   **AI Weather Radar Layer**: Live global weather system tracking powered by Gemini with Search Grounding, identifying storms and precipitation centers in real-time.
-   **Type-Safe Architecture (v1.7.0)**: Fully hardened codebase utilizing **TypeScript 6 Strict Mode** and a **Zero-Any Policy**. All data structures are enforced via Zod validation, ensuring mission-critical reliability.
-   **High-Fidelity HUD**: Enhanced tactical display with accurate velocity, altitude, and heading indicators synchronized with current positional vectors.
-   **Tactical Airspace Sectors**: Visualization of major Flight Information Regions (FIRs) and tactical airspace boundaries.
-   **Advanced Telemetry History**: High-fidelity data visualization for flight paths, featuring scaled Lat/Lng progression charts, interactive tooltips, and predictive fuel burn calculations.
-   **Intelligent Proximity Alerts**: Real-time detection of aircraft within a user-defined radius (up to 250NM), featuring pulsing visual highlights, callsign identification in the HUD, and specialized audible warning tones.
-   **Live Radar Ingestion**: Real-time flight data fetching from ADSB-Exchange and Google Search Grounding to provide current aircraft positions.
-   **AI-Powered Search**: Natural language search capabilities powered by **Gemini 1.5 Flash** (via `@google/genai` v1.51) to find specific flights or simulate data.
-   **ATC Communication Decryption**: Anonymized, simulated ATC transcripts based on current flight sectors for enhanced situational awareness.
-   **Flight Management**: Full CRUD operations for managing a personal database of tracked flights.
-   **Deep Linking & Sharing**: Easily share specific flight tracking data via generated URLs.
-   **Adaptive Mobile Experience**: Fully optimized for mobile with a collapsible flight manifest and specialized touch interactions.

## Tactical Design Language

SkyTrack utilizes a custom-built design system optimized for high-stress surveillance environments:

-   **Tactical Glassmorphism**: Secondary interface elements (modals, overlays) leverage a specialized glassmorphism layer with real-time backdrop filtering for depth and clarity.
-   **Peripheral HUD Glows**: Critical data containers feature blue/red peripheral glows to guide the operator's eye toward active vectors and proximity warnings.
-   **CRT Scanline Simulation**: A multi-layered CSS animation system simulates high-fidelity tactical CRT monitors, providing a unique immersive experience.
-   **Dynamic Radar Sweeps**: Integrated visual radar sweeps provide constant system activity feedback.

## Surveillance Protocols

### Proximity Alert System (PAS)

The system continuously monitors the spatial relationship between the operator's geolocation and active flight vectors. When an object enters the defined radius:

1.  **Visual Link**: A pulsing red vector blip appears on the map.
2.  **HUD Warning**: A critical warning banner identifies the object's callsign.
3.  **Audible Signal**: A synthesized warning tone is generated via the Web Audio API.

### Vector Data Ingestion

Telemetry is synchronized via a dual-feed system:

-   **Core Database**: Locally persisted flights with detailed historical tracking.
-   **OpenSky Live Feed**: Real-time global ADS-B data proxied through the Express backend to bypass browser CORS restrictions.

## Project Structure

SkyTrack follows a modular architecture designed for high-fidelity surveillance performance:

-   **/server**: Express 5.2 backend handling ADS-B proxying and flight database management.
-   **/src/hooks**: Custom React hooks (e.g., `useSkyTrack`) encapsulating core surveillance logic and state.
-   **/src/utils**: Tactical utilities for geospatial calculations and Web Audio signal generation.
-   **/src/constants**: Centralized system preferences and operational defaults.
-   **/src/components**: Hardened UI components organized by feature and layout.
-   **/src/styles**: Global CSS with tactical scanline effects and design tokens.

## Performance Optimization

SkyTrack is engineered for high-frequency data updates and complex spatial visualizations:

-   **Layer Memoization**: Static map layers (boundaries, graticules, airspace) are memoized using React's `useMemo`, preventing expensive D3 path re-calculations during real-time flight vector updates.
-   **Optimized State Management**: Core surveillance logic is encapsulated in a custom `useSkyTrack` hook, minimizing re-renders across the UI and ensuring efficient telemetry ingestion.
-   **Hardware-Accelerated Animations**: CRT scanlines and radar sweeps are offloaded to CSS animations and the GPU via `motion/react`.

## Path Aliases

SkyTrack uses established path aliases for cleaner imports and improved maintainability:

-   **`@/*`**: Root `src` directory
-   **`@components/*`**: Tactical UI components
-   **`@hooks/*`**: Core surveillance logic hooks
-   **`@utils/*`**: Geospatial and Signal utilities
-   **`@services/*`**: AI and Telemetry ingestion services
-   **`@constants/*`**: System operational defaults

## Technical Stack

-   **Frontend**: React 19.2, **Vite 8.0**, Tailwind CSS 4.1
-   **Animations**: Motion 12.3
-   **Backend**: Node.js 22+, **Express 5.2**, Zod 4.4
-   **Data Visualization**: D3.js 7.9, Recharts 3.8
-   **AI Engine**: Google Generative AI (**Gemini 1.5 Flash**) with Search Grounding
-   **Icons**: Lucide React 1.14
-   **Styling**: Tactical UI System with custom scanline effects and grid overlays

## API Configuration

The application includes a built-in Express server that handles:

-   `GET /api/flights`: Retrieves the manifest of tracked flights.
-   `POST /api/flights`: Adds a new flight to the tracking database.
-   `PATCH /api/flights/:id`: Updates existing flight telemetry.
-   `DELETE /api/flights/:id`: Removes a flight from the system.
-   `GET /api/external/live-flights`: Proxy route for real-time ADS-B data from the OpenSky Network.

## Security & Reliability

### API Integrity
- **CORS Protocol**: The Express server implements a dynamic CORS callback system that validates incoming requests against the `APP_URL` environment variable.
- **Payload Validation**: All incoming flight registration and update requests are validated against a strict Zod schema to prevent state corruption.
- **AI Response Sanitization**: The system includes defensive regex-based parsing to ensure Gemini AI responses are valid JSON before ingestion.

### Data Privacy
- **Client-Side Persistence**: User preferences (units, map layers, alert radius) are persisted locally in the browser to minimize server-side storage needs.
- **Anonymization**: Simulated ATC logs utilize randomized sector identifiers to maintain a realistic yet secure operational environment.

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
