# Changelog

All notable changes to this project will be documented in this file.

## [1.7.0] - 2026-04-29

### Added
- **Full Type Safety hardening**: Enabled `strict` mode in `tsconfig.json` and eliminated `any` types across the entire codebase.
- **Dependency Overhaul**: Updated all libraries to their latest major/stable versions, including Vite 8, Express 5, and TypeScript 6.

### Fixed
- **Deprecated Logic Removal**: Replaced deprecated `substr` with `slice` in backend services.
- **Environment Compatibility**: Improved AudioContext initialization to better handle legacy and modern browser shims without `any`.
- **System Stability**: Verified and hardened all component interfaces against major library updates.

## [1.6.2] - 2026-04-29

### Added
- **Premium Tactical UI System**:
  - Implemented `.glass-panel` and `.tactical-glow` utility classes for high-fidelity interface design.
  - Added new soft-pulse and optimized scanline animations to `index.css`.
- **UI Refinements**:
  - Redesigned `FlightRow` airline indicators with smart initials generation.
  - Integrated glassmorphism and tactical glows into `SettingsModal`, `FlightModal`, and Map overlays.

### Fixed
- **Layout Management**:
  - Repositioned HUD proximity alerts and mobile manifest toggles to prevent overlap with the system ticker.
  - Adjusted z-index hierarchy for tactical HUD brackets to ensure clear visibility of interactive sidebars.
  - Optimized custom scrollbar thickness and color for a more subtle tactical feel.

## [1.6.1] - 2026-04-29

### Fixed
- **Type Safety**:
  - Implemented strict interface for Live Radar data (`LiveRadarFlight`) replacing `any` usage.
  - Resolved TypeScript errors in `Map.tsx`, `App.tsx`, and `Sidebar.tsx` related to flight property access.
  - Fixed property access bugs in HUD/Overlay: `speed` and `altitude` are now correctly accessed via `currentPosition`.
- **System Stability**:
  - Synchronized Zod schema in `server.ts` with frontend `Flight` interface, including all optional fields.
  - Improved CORS configuration with more robust origin validation.
  - Enhanced Gemini API response parsing to handle Markdown code blocks and empty results gracefully.
- **UI/UX Refinement**:
  - Fixed "Gulf of Guinea" bug where new flights defaulted to (0,0) coordinates; now defaults to sensible global hubs.
  - Optimized AudioContext initialization to better handle browser autoplay restrictions and resource management.

## [1.6.0] - 2026-04-29

### Added
- **Tactical UI Polish**:
  - Implemented ultra-thin "Blue Matrix" tactical scrollbars for enhanced aesthetics.
  - Added "Live Sector" heartbeat animations to flight indicators.
  - Improved data integrity visualization in the status bar with pulsing indicators.
- **Robust AI Integration**:
  - Enhanced `geminiService` with comprehensive error boundary handling for generative AI calls.
  - Improved structured data parsing resilience for asynchronous telemetry updates.
- **Advanced Telemetry Visualizations**:
  - Implemented high-fidelity Recharts-powered tracking history with dual-axis coordinate mapping (Lat/Lng) and interactive hover tooltips.
  - Developed "Status-Aware" data fallbacks providing clear tactical indicators when telemetry or history data is pending or unavailable.
- **Dependency Optimization**:
  - Migrated development-only type definitions to `devDependencies` to optimize production bundle overhead.
  - Bumped internal system version to v1.6.0.

### Fixed
- **State Integrity**: Resolved a minor potential race condition during initial database hydration in `App.tsx`.
- **UI Consistency**: Fixed alignment issues in the tactical HUD overlays on ultra-wide displays.
- **Robustness**: 
  - Added defensive null-checks for telemetry data in the tactical map overlay.
  - Implemented graceful handling and tactical UI indicators for Geolocation permission denial.
  - Suppressed benign Vite WebSocket connection errors and unhandled rejections using multi-layered event interception and console shadowing for a clean session experience.
  - Hard-coded HMR disablement in `vite.config.ts` to ensure consistent performance in the AI Studio environment.

## [1.5.0] - 2026-04-29

### Fixed
- **Architectural Refactor**: Consolidated `App.tsx` initialization logic to prevent race conditions and redundant fetches during initial data load.
- **Lazy Initialization**: Refactored `geminiService.ts` to use a singleton pattern for `GoogleGenAI` initialization, preventing silent crashes when `GEMINI_API_KEY` is missing.
- **Infinite Loop Guard**: Fixed a memory-leak inducing infinite loop in the proximity alerts `useEffect` by implementing a deep-comparison check on new alert sets.
- **Deployment Build System**: Normalized `package.json` and ensured production compatibility by leveraging Node.js native TypeScript type stripping for the server entry point.

### Added
- **Tactical UI Polish**: 
  - Integrated a "Systems Operational" heartbeat indicator in the status bar.
  - Added a scrolling telemetry ticker overlay to the HUD for enhanced immersion.
  - Implemented a tactical "Compass Rose" element centered on the map view.
- **Motion Orchestration**: Integrated `useAnimate` in the `Map` component for more granular control over flight path transitions, enabling smoother updates during real-time tracking.
- **Enhanced Flight Details**: Added a "Tactical View" mini-overlay on the map when a flight is selected, providing quick telemetry at a glance.
- **Visual Feedback**: Added a pulsing "LIVE" indicator and tactical status highlights to flight detail headers.

## [1.3.0] - 2026-04-24

### Added
- **AI Weather Radar Layer**: Integrated live weather system identification using Gemini with Search Grounding; added dynamic radar overlays on the tactical map.
- **Airspace Sector Visualization**: Added tactical boundaries for major Flight Information Regions (FIRs).
- **Enhanced Proximity Highlighting**: Active alerts now trigger a pulsing red outline on the map for the specific aircraft causing the alert.
- **Alert HUD Callsigns**: The proximity warning banner now lists the flight numbers or callsigns of all objects within the alert radius.

### Changed
- **Robust State Reconstruction**: Implemented automated deep-merging of local storage preferences to prevent crashes when new schema keys (like map layers) are introduced.
- **UI Performance**: Refined re-render cycles in the Map component for smoother tactical overlays.

### Fixed
- Resolved "Cannot read properties of undefined (reading 'weather')" crash during initial boot.
- Fixed a bug where settings toggles would fail if mapLayer preferences were partially missing from local history.

## [1.2.0] - 2026-04-24

### Added
- **Intelligent Proximity Alerts**: Detection system for aircraft within user-defined sectors (10-250NM) with visual HUD warnings.
- **Audible Signal Tones**: Integrated a Web Audio API synthesizer for proximity alert notification sounds.
- **Animated Trajectories**: Flight paths now animate relative to aircraft progress, using dynamic dash-offset and path-masking techniques.
- **Advanced Map Centering**: Implemented a transition-aware centering algorithm that focuses the tactical map on selections without losing spatial context.
- **License**: Added official MIT License documentation.

### Changed
- **Mobile UX**: Refined the flight manifest toggle for better tablet and mobile usability.
- **Visuals**: Enhanced radar blip indicators with active pulse animations for live-tracked targets.

### Fixed
- Improved D3 projection performance during rapid zoom maneuvers.
- Resolved coordinate wrapping issues for trans-meridian flight paths.

## [1.1.0] - 2026-04-24

### Added
- **Google Search Grounding**: Implemented real-time flight data verification using Gemini's search capabilities.
- **ATC Communication Decryption**: Added a new UI section showing anonymized ATC-style radio logs for selected flights.
- **Deep Linking**: Support for `?flightId=` query parameters to automatically open and track specific flights.
- **Natural Earth Projection**: Switched map to Natural Earth 1 projection for better polar region visibility.
- **Mobile Responsiveness**: Added a collapsible flight list and full-screen sidebar for mobile users.
- **Search Enhancements**: Added a "Clear" button to the search input and better loading states (skeletons).
- **Social Sharing**: Integrated Web Share API and clipboard fallbacks for sharing flight data.

### Changed
- **Map Interaction**: Improved auto-centering and zoom transitions when a flight is selected.
- **Visual Design**: Enhanced the "Tactical" aesthetic with better contrast, emerald live indicators, and refined typography.

### Fixed
- Fixed various CSS layout issues on mobile devices.
- Improved error handling for remote data fetching.
- Resolved linting issues and optimized coordinate projections.

## [1.0.0] - Initial Release
- Basic flight tracking and map representation.
- CRUD functionality for flight database.
- Gemini-powered mock flight generator.
