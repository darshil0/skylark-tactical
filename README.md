# SkyTrack - Real-Time Flight Tracking System

![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?style=flat&logo=typescript)
![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat&logo=vite)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
![Last Commit](https://img.shields.io/github/last-commit/darshil0/skytrack?style=flat&color=blue)

SkyTrack is a high-performance, real-time flight tracking application built with React, Vite, and D3.js. It provides a tactical, air traffic control-inspired interface for monitoring global aviation data with proximity alerts, weather tracking, and AI-powered search.

---

## 📑 Table of Contents

1. [Features](#features)
2. [Design Language](#design-language)
3. [How It Works](#how-it-works)
4. [Project Structure](#project-structure)
5. [Performance](#performance)
6. [Technical Stack](#technical-stack)
7. [API Reference](#api-reference)
8. [Environment Setup](#environment-setup)
9. [Development](#development)
10. [Troubleshooting](#troubleshooting)

---

## Features

- **Real-Time Flight Map**: D3.js-powered interactive map with natural earth projections, smooth zooming, animated flight trajectories, and tactical airspace sectors (FIRs).
- **Proximity Alert System**: Monitors aircraft within a configurable radius (up to 250 NM) and triggers visual highlights, HUD banners, and audible warnings.
- **Weather Radar Layer**: AI-powered weather tracking via Google Gemini with Search Grounding to identify active storm systems.
- **Flight Search & Analysis**: Natural language flight search powered by Gemini 1.5 Flash; includes telemetry history, velocity/altitude tracking, and fuel burn calculations.
- **Type-Safe Codebase**: Full TypeScript strict mode with Zod schema validation across all API boundaries and data structures.
- **Flight Database**: CRUD operations for managing personal flight tracking records.
- **ATC Communication Simulator**: Anonymized, sector-based ATC transcript generation for situational awareness.
- **Mobile Optimized**: Responsive design with collapsible manifest and touch-optimized interactions.
- **Shareable Links**: Deep linking for specific flight data via unique URLs.

## Design Language

SkyTrack uses a tactical, high-contrast design system optimized for focus and readability:

- **Glassmorphism Overlays**: Frosted glass effects on modals and secondary UI elements with real-time backdrop filtering.
- **Peripheral Visual Cues**: Blue/red glow indicators on critical data containers to draw attention to active alerts.
- **CRT Scanline Effects**: Multi-layered CSS animations simulate vintage CRT monitor aesthetics.
- **Dynamic Radar Sweeps**: Continuous visual feedback indicating system activity and data refresh cycles.

## How It Works

### Data Flow

1. **Flight Ingestion**: Real-time ADS-B data fetched from OpenSky Network via proxied Express backend.
2. **Local Persistence**: Flight records stored in browser localStorage and Express backend database.
3. **Proximity Monitoring**: System continuously compares user geolocation against active flight positions every ~5 seconds.
4. **Alert Dispatch**: When aircraft enters configured radius:
   - Visual marker appears on map with pulsing animation
   - HUD banner displays callsign and distance
   - Web Audio API synthesizes warning tone (1000 Hz, 200 ms)

### AI Integration

Weather and flight search requests are proxied through Express backend to prevent client-side API key exposure:

```
Client → /api/ai/weather → Google Gemini API → Response
Client → /api/ai/search → Google Gemini API → Response
```

## Project Structure

```
skytrack/
├── server/                 # Express 5.2 backend
│   ├── routes/            # API endpoints
│   └── services/          # Flight & cache logic
├── src/
│   ├── components/        # React UI components
│   ├── hooks/            # useSkyTrack, custom hooks
│   ├── utils/            # Geospatial, Web Audio utilities
│   ├── services/         # API clients
│   ├── constants/        # Defaults & config
│   ├── styles/           # Global CSS + scanline effects
│   └── App.tsx
├── vite.config.ts        # Vite + path aliases
├── tsconfig.json         # TypeScript strict mode
└── package.json
```

## Performance

SkyTrack handles real-time updates efficiently through:

- **Memoized Map Layers**: Static layers (boundaries, graticules, airspace) cached with `useMemo` to prevent D3 re-calculations during flight updates.
- **Optimized State Management**: Core logic in `useSkyTrack` hook minimizes component re-renders.
- **Hardware Acceleration**: CRT effects and radar sweeps offloaded to CSS animations and GPU.
- **Server-Side Caching**: OpenSky data cached for 15 seconds via node-cache to reduce API calls.

**Performance Targets:**
- Map interaction latency: <16ms (60 FPS)
- Proximity check interval: ~5 seconds
- Flight data refresh: 10-30 seconds (OpenSky default)

## Technical Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite 8.0, Tailwind CSS 4.1 |
| **Animations** | Motion 12.3 |
| **Backend** | Node.js 22+, Express 5.2 |
| **Data Viz** | D3.js 7.9, Recharts 3.8 |
| **AI** | Google Generative AI (Gemini 1.5 Flash) |
| **Validation** | Zod 4.4 |
| **Storage** | Node-Cache 5.1, localStorage |
| **Testing** | Vitest 4.1 |
| **Icons** | Lucide React 1.14 |

## API Reference

### Flight Management

#### `GET /api/flights`
Retrieve all tracked flights.

**Response:**
```json
[
  {
    "id": "uuid",
    "callsign": "UAL456",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "altitude": 35000,
    "heading": 180,
    "velocity": 450,
    "timestamp": "2025-01-15T12:00:00Z"
  }
]
```

#### `POST /api/flights`
Add a new flight to tracking database.

**Request Body:**
```json
{
  "callsign": "UAL456",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "altitude": 35000,
  "heading": 180,
  "velocity": 450
}
```

**Response:** 201 Created, returns flight object with assigned `id`.

#### `PATCH /api/flights/:id`
Update existing flight telemetry.

**Request Body:** (all fields optional)
```json
{
  "altitude": 36000,
  "heading": 185,
  "velocity": 455
}
```

**Response:** 200 OK, returns updated flight object.

#### `DELETE /api/flights/:id`
Remove flight from database.

**Response:** 204 No Content

### External Data

#### `GET /api/external/live-flights`
Proxy to OpenSky Network for real-time ADS-B data.

**Query Parameters:**
- `lamin`: Min latitude (default: -90)
- `lamax`: Max latitude (default: 90)
- `lomin`: Min longitude (default: -180)
- `lomax`: Max longitude (default: 180)

**Response:** OpenSky format with aircraft state vectors.

**Note:** Responses cached for 15 seconds server-side.

### AI Endpoints

#### `POST /api/ai/search`
Natural language flight search.

**Request Body:**
```json
{
  "query": "flights from New York to Los Angeles"
}
```

**Response:**
```json
{
  "results": [
    {
      "callsign": "DAL123",
      "origin": "JFK",
      "destination": "LAX",
      "confidence": 0.95
    }
  ]
}
```

#### `POST /api/ai/weather`
Get current weather analysis for a region.

**Request Body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 100
}
```

**Response:**
```json
{
  "status": "clear" | "scattered" | "severe",
  "storms": [
    { "lat": 40.8, "lng": -74.1, "intensity": "moderate" }
  ],
  "summary": "Clear skies with scattered thunderstorms to the west."
}
```

**Error Codes:**
- `400 Bad Request`: Invalid coordinates or missing required fields
- `401 Unauthorized`: Missing GEMINI_API_KEY
- `500 Internal Server Error`: Gemini API timeout or parsing error

## Environment Setup

### Prerequisites

- **Node.js**: 22.0.0 or higher
- **npm**: 10.5.0 or higher
- **Google AI Studio API Key**: https://aistudio.google.com/apikey

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/darshil0/skytrack.git
   cd skytrack
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env.local` file** in the root directory:
   ```
   GEMINI_API_KEY=your_api_key_here
   APP_URL=http://localhost:5173
   ```

4. **Start development server** (both Express + Vite):
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Development

### Project Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Start Express + Vite dev servers |
| `npm run build` | Build React + Express for production |
| `npm start` | Run production build |
| `npm test` | Run all tests with Vitest |
| `npx vitest` | Run tests in watch mode |

### Code Quality

- **TypeScript Strict Mode**: Enabled in `tsconfig.json`
- **Zero-Any Policy**: No implicit `any` types allowed
- **Schema Validation**: All API inputs validated with Zod

### Path Aliases

Import cleaner with configured aliases:

```typescript
import { useSkyTrack } from '@hooks/useSkyTrack';
import { calculateDistance } from '@utils/geospatial';
import { ALERT_RADIUS } from '@constants/defaults';
```

## Troubleshooting

### CORS Errors

**Problem:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
- Ensure `APP_URL` environment variable matches your deployment URL
- For local development, `APP_URL=http://localhost:5173` should work automatically
- Verify Express server is running on port 3000

### Missing API Key

**Problem:** `Error: GEMINI_API_KEY not found`

**Solution:**
- Check `.env.local` file exists in root directory
- Verify key is set: `echo $GEMINI_API_KEY`
- Generate new key at https://aistudio.google.com/apikey

### OpenSky Proxy Failures

**Problem:** `GET /api/external/live-flights returns 502 Bad Gateway`

**Solution:**
- Check OpenSky Network status: https://status.adsbexchange.com
- Verify network connectivity from your server
- Review server logs: `npm run dev` shows proxy errors

### Map Not Loading

**Problem:** D3 map renders blank or frozen

**Solution:**
- Open DevTools (F12) and check Console for errors
- Clear browser cache and localStorage
- Verify browser supports WebGL (Chrome, Firefox, Safari, Edge)
- Check if running behind corporate proxy; may need to whitelist d3js.org

### Proximity Alerts Not Triggering

**Problem:** Aircraft in radius but no alert fires

**Solution:**
- Verify geolocation permission granted in browser
- Check browser console for geolocation errors
- Confirm OpenSky has live data for your region (may be sparse in some areas)
- Review proximity radius setting (default 50 NM)
- Audio: Ensure browser allows Web Audio API; some restrictive environments block it

### Slow Performance / High CPU

**Problem:** Map laggy, animations stutter, high memory usage

**Solution:**
- Reduce number of tracked flights (manifest size)
- Disable CRT scanline effects in settings (trades aesthetics for performance)
- Check for memory leaks: DevTools → Performance tab
- Update to latest Chrome/Firefox for better hardware acceleration

## License

MIT

---
