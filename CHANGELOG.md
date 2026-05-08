# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.8.0] - 2026-05-08 — Production Readiness & Security Hardening

### Added
- **Server-Side AI Proxy**: Migrated all Google Gemini API calls to backend endpoints (`/api/ai/*`), eliminating client-side `GEMINI_API_KEY` exposure and improving security posture.
- **Schema Validation Layer**: Integrated `zod` for runtime schema validation across all Express API routes and AI response parsing, ensuring type safety at the boundary.
- **Testing Framework**: Established `vitest` test suite with initial coverage for API validation logic.
- **UUID v4 Integration**: Replaced ad-hoc ID generation with `uuid` v4 for robust, collision-free flight record identifiers.
- **Repository Badges**: Added professional metadata badges documenting MIT License, last commit date, and core tech stack (TypeScript 6, React 19, Vite 8).

### Changed
- **AI Engine Bump**: Updated `@google/generative-ai` to v0.24.1 for enhanced search grounding and improved model capabilities.

### Changed
- **AI Engine Update**: Bumped `@google/generative-ai` to v0.24.1 for enhanced search grounding capabilities.

### Fixed
- **CORS Hardening**: Implemented dynamic CORS policy with allowed-origin validation and credential support for secure cross-origin requests.
- **OpenSky Radar Caching**: Resolved performance bottlenecks by introducing `node-cache` with 15-second TTL for telemetry data, reducing redundant API calls.
- **Environment Management**: Standardized server-side environment variable loading via dedicated `dotenv` utility for consistent configuration handling.
- **Documentation**: Corrected repository badge URLs in `README.md`.

---

## [1.7.2] - 2026-04-29 — Configuration Hardening

### Added
- **Path Aliasing**: Implemented import path aliases (`@/`, `@components/`, `@hooks/`, etc.) in `tsconfig.json` and `vite.config.ts` for cleaner, more maintainable imports across the codebase.
- **Development Proxy**: Configured Vite development proxy to seamlessly redirect API requests to the local Express server without CORS friction.
- **Project Hygiene**: Expanded `.gitignore` significantly and refined `.env.example` with detailed setup instructions.

### Fixed
- **Configuration Consistency**: Standardized `postcss.config.js` and `tsconfig.json` to include both frontend and backend directories, enabling full-stack type checking.

---

## [1.7.1] - 2026-04-29 — Architectural Reorganization

### Added
- **Backend Directory Structure**: Relocated server logic to dedicated `server/` directory with clear separation of concerns.
- **Custom State Hook**: Implemented `useSkyTrack` hook to decouple core surveillance state management from UI presentation logic.
- **Project Conventions**: Established standardized directories for `src/hooks`, `src/utils`, `src/constants`, and `src/styles` to improve discoverability and maintainability.

### Optimized
- **Map Layer Memoization**: Memoized static geographical and airspace layers to significantly reduce re-render cycles during real-time updates.
- **State Efficiency**: Refactored `useSkyTrack` to eliminate redundant state variables and minimize re-render triggers in the surveillance loop.

### Fixed
- **Code Complexity**: Reduced `App.tsx` footprint by ~60%, improving readability and testability.
- **Import Paths**: Synchronized all stylesheet and asset imports with new directory structure.

---

## [1.7.0] - 2026-04-29 — Full Type Safety & Dependency Overhaul

### Added
- **Strict TypeScript**: Enabled `strict` mode in `tsconfig.json` and eliminated all `any` type usage across the codebase.
- **Dependency Refresh**: Updated to latest stable versions: Vite 8, Express 5, TypeScript 6, and all peer dependencies.
- **Documentation Overhaul**: Complete rewrite of `README.md` for technical accuracy, security protocols, and architectural patterns.

### Cleaned
- **Data Initialization**: Streamlined redundant fetch cycles during bootstrap to reduce initial network overhead.
- **Dead Code**: Removed unused variables and legacy prototyping logic from Map and HUD components.

### Fixed
- **Deprecated Methods**: Replaced `substr()` with `slice()` across backend services.
- **AudioContext Initialization**: Improved legacy/modern browser compatibility without type escaping.
- **System Stability**: Verified all component interfaces against major library updates.
- **AI Prompts**: Standardized all Gemini prompts to English for consistency.

---

## [1.6.2] - 2026-04-29 — Tactical UI Polish

### Added
- **Glass Morphism System**: Introduced `.glass-panel` and `.tactical-glow` utility classes for premium interface aesthetics.
- **Animation Suite**: Added soft-pulse and optimized scanline animations to `index.css` for enhanced visual feedback.
- **Airline Indicators**: Redesigned `FlightRow` component with intelligent callsign initials generation.
- **UI Enhancements**: Integrated glassmorphism and tactical glows into `SettingsModal`, `FlightModal`, and map overlays.

### Fixed
- **Layout Hierarchy**: Repositioned HUD proximity alerts and mobile toggles to prevent overlap with system ticker.
- **Z-Index Management**: Adjusted tactical HUD bracket stacking to ensure interactive sidebars remain accessible.
- **Scrollbar Styling**: Optimized custom scrollbar appearance for a more subtle, tactical aesthetic.

---

## [1.6.1] - 2026-04-29 — Type Safety & Stability

### Fixed
- **Type Definitions**: Implemented strict `LiveRadarFlight` interface, eliminating `any` usage in radar data handling.
- **Component Errors**: Resolved TypeScript errors in `Map.tsx`, `App.tsx`, and `Sidebar.tsx` related to flight property access.
- **Property Access**: Fixed HUD/Overlay bugs where `speed` and `altitude` now correctly reference `currentPosition`.
- **Schema Synchronization**: Aligned Zod validation schema in `server.ts` with frontend `Flight` interface, including all optional fields.
- **CORS Robustness**: Enhanced origin validation logic for more reliable cross-origin requests.
- **AI Parsing**: Improved Gemini API response parsing to gracefully handle Markdown code blocks and empty results.
- **Coordinate Defaults**: Fixed "Gulf of Guinea" bug where new flights defaulted to (0,0); now defaults to sensible global hubs.
- **AudioContext**: Optimized initialization to respect browser autoplay restrictions and resource constraints.

---

## [1.6.0] - 2026-04-29 — AI Telemetry & History

### Added
- **Blue Matrix Scrollbars**: Implemented ultra-thin tactical scrollbars with custom styling for enhanced aesthetics.
- **Heartbeat Animations**: Added "Live Sector" pulse animations to flight indicators for visual feedback.
- **AI Integration**: Enhanced `geminiService` with comprehensive error boundaries for generative AI calls.
- **Telemetry Visualization**: Built high-fidelity Recharts-powered tracking history with dual-axis coordinate mapping (Lat/Lng) and interactive tooltips.
- **Status-Aware Fallbacks**: Implemented tactical indicators for pending telemetry and history data states.
- **Dependency Optimization**: Migrated dev-only type definitions to `devDependencies` to reduce production bundle size.

### Fixed
- **Race Conditions**: Resolved potential hydration race condition during initial database load in `App.tsx`.
- **HUD Alignment**: Fixed tactical overlay positioning on ultra-wide displays.
- **Defensive Checks**: Added null-checks for telemetry data in map overlays.
- **Geolocation Handling**: Implemented graceful fallback when permission denied.
- **Error Suppression**: Suppressed benign Vite WebSocket and unhandled rejection errors for clean logs.
- **HMR Configuration**: Hard-coded HMR disablement in `vite.config.ts` for consistent performance in AI Studio.

---

## [1.5.0] - 2026-04-29 — Architectural Refactor & Tactical Polish

### Fixed
- **Race Conditions**: Consolidated `App.tsx` initialization to prevent redundant fetches and data hydration conflicts.
- **Singleton Pattern**: Refactored `geminiService.ts` to use lazy initialization, preventing crashes when `GEMINI_API_KEY` is undefined.
- **Memory Leaks**: Fixed infinite loop in proximity alerts `useEffect` via deep-comparison check on alert sets.
- **Production Build**: Normalized `package.json` and ensured Node.js native TypeScript type stripping for server entry point.

### Added
- **Heartbeat Indicator**: Integrated "Systems Operational" pulsing indicator in status bar.
- **Telemetry Ticker**: Added scrolling telemetry overlay to HUD for immersive real-time feedback.
- **Compass Rose**: Implemented tactical compass element centered on map view.
- **Motion Control**: Integrated `useAnimate` in Map component for granular flight path transition control.
- **Tactical View**: Added mini-overlay on map showing quick telemetry when flight is selected.
- **Live Indicators**: Added pulsing "LIVE" badge and tactical status highlights to flight detail headers.

---

## [1.3.0] - 2026-04-24 — AI Weather & Airspace Visualization

### Added
- **AI Weather Layer**: Integrated Gemini-powered weather system detection with search grounding; added dynamic radar overlays.
- **Airspace Boundaries**: Added tactical Flight Information Region (FIR) boundaries to the map.
- **Proximity Highlighting**: Active alerts trigger pulsing red outline on specific aircraft.
- **Alert Callsigns**: Proximity warning banner now displays flight numbers of all objects within alert radius.

### Changed
- **State Reconstruction**: Implemented automated deep-merging of local storage preferences to prevent crashes on schema evolution.
- **Rendering Efficiency**: Refined Map component re-render cycles for smoother overlays during real-time updates.

### Fixed
- **Undefined Weather**: Resolved crash on "Cannot read properties of undefined (reading 'weather')" during initial boot.
- **Settings Toggles**: Fixed bug where missing mapLayer schema keys caused toggle failure.

---

## [1.2.0] - 2026-04-24 — Proximity Alerts & Interactive Maps

### Added
- **Proximity Detection**: User-configurable alert system for aircraft within 10–250 NM sectors with visual HUD warnings.
- **Audible Alerts**: Integrated Web Audio API synthesizer for proximity alert notification tones.
- **Animated Paths**: Flight paths animate relative to aircraft progress using dynamic dash-offset and path masking.
- **Smart Centering**: Implemented transition-aware algorithm for map centering on selected aircraft without losing context.
- **MIT License**: Added official license documentation.

### Changed
- **Mobile UX**: Refined flight manifest toggle for improved tablet and mobile usability.
- **Visuals**: Enhanced radar blips with active pulse animations for live-tracked targets.

### Fixed
- **D3 Performance**: Improved projection performance during rapid zoom operations.
- **Coordinate Wrapping**: Resolved trans-meridian flight path display issues.

---

## [1.1.0] - 2026-04-24 — Search Grounding & Deep Linking

### Added
- **Gemini Search Grounding**: Implemented real-time flight data verification via Gemini's web search integration.
- **ATC Logs**: Added anonymized ATC-style radio communication logs for selected flights.
- **Deep Linking**: Support for `?flightId=` query parameters for automatic flight tracking.
- **Natural Earth Projection**: Switched to Natural Earth 1 projection for better polar region visibility.
- **Mobile Responsiveness**: Added collapsible flight list and full-screen sidebar for mobile users.
- **Search UX**: Added "Clear" button and skeleton loading states for better user feedback.
- **Social Sharing**: Integrated Web Share API with clipboard fallback for flight data sharing.

### Changed
- **Map Interaction**: Improved auto-centering and zoom transitions on flight selection.
- **Visual Design**: Enhanced tactical aesthetic with improved contrast, emerald live indicators, and refined typography.

### Fixed
- **Mobile CSS**: Resolved layout issues on mobile devices.
- **Error Handling**: Improved remote data fetching resilience.
- **Projections**: Fixed linting issues and optimized coordinate projection logic.

---

## [1.0.0] - 2026-04-24 — Initial Release

### Added
- Basic flight tracking and map visualization.
- CRUD operations for flight database.
- Gemini-powered mock flight data generation.
