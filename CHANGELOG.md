# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Security Hardening**: Migrated Gemini AI interactions to server-side proxies to protect sensitive API keys.
- **Data Validation**: Integrated `zod` for robust schema validation on all API endpoints.
- **Automated Testing**: Added comprehensive unit and integration tests using Vitest.
- **CI/CD Pipeline**: Configured GitHub Actions for automated linting and testing on push/pull requests.
- **Server-side Caching**: Implemented `node-cache` for external API and AI requests to improve performance and reduce rate-limiting.
- **Robust Identifiers**: Replaced pseudo-random IDs with UUID v4 for better collision resistance.

### Changed
- **Logic Refactoring**: Extracted complex state and side-effect logic from `App.tsx` into specialized custom hooks (`useFlights`, `useLiveRadar`, `useFlightAlerts`, `useUserLocation`).
- **Type Safety**: Eliminated `any` types throughout the codebase and enforced stricter TypeScript configurations.
- **Documentation**: Added JSDoc comments to core utility functions and updated project README.

## [1.4.0] - 2026-04-24

### Changed
- **Architectural Refactor**: Migrated monolithic sections of `App.tsx` into modular layout components (`Sidebar`, `HUD`, `FlightDetailSidebar`) to improve maintainability and performance.
- **Enhanced Animations**: Improved the flight detail panel transitions using `motion` and `AnimatePresence` for smoother user interaction.
- **Code Optimization**: Streamlined the main application state and reduced redundant render cycles in the root component.

### Fixed
- **Runtime Stability**: Resolved `ReferenceError` caused by missing icon imports (`Radio`, `Activity`) in the main application loop.
- **Sidebar Persistence**: Fixed an issue where the detail sidebar would fail to unmount correctly during state transitions.
- **Cleaned Orphaned Nodes**: Removed a large block of unused JSX from `App.tsx` that was causing potential hydration mismatches.

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
