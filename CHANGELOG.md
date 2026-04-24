# Changelog

All notable changes to this project will be documented in this file.

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
