# Changelog — ChatFlow

All notable changes to the ChatFlow project are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] — 2026-07-09

### Added
- **JWT Socket Handshake Middleware**: Intercepts WebSocket requests, verifying auth tokens before granting server connection.
- **Persistent Chat History**: Added a MongoDB fetch event that loads and reverses the last 50 stored messages for clients on connection.
- **Dynamic Online Operator Registry**: Implemented list emissions showing details of connected operators.
- **Cyberpunk Authentication UI**: Built tabbed Login and Register overlays in the frontend interface.
- **Local Storage Management**: Implemented token saving and loading for session restoration on page refresh.
- **Ambient Visual Elements**: Added CSS mesh backgrounds and rotating aurora blobs to the background layout.
- **HUD Connection Lost Banner**: Added a top banner that displays reconnection states when connection is lost.
- **In-App Toast System**: Added a notification system that displays success/error alerts in the top-right corner.
- **Skeleton Layout Skeletons**: Added placeholder skeletons that appear during initial messaging and active sidebar queries.

### Changed
- **User Schema Redesign**: Overwrote the duplicate message schema in [user.js](file:///c:/Users/dhruv/OneDrive%20-%20Adani%20University/Dhruv/BACKEND/NODE%20JS/CHATFLOW/backend/models/user.js) to define correct user fields (`name`, `email`, `password`) and export the `"User"` namespace.
- **SPA Fallback Routing**: Replaced wildcard router handlers with Express `app.use` catch-alls to ensure Express 5 routing compatibility.
- **HTTP Middleware Pipeline**: Hardened [server.js](file:///c:/Users/dhruv/OneDrive%20-%20Adani%20University/Dhruv/BACKEND/NODE%20JS/CHATFLOW/backend/server.js) with standard Express security and rate-limiting modules.

### Improved
- **JWT Payload Fields**: Added user names and emails to token payloads, eliminating extra database queries on WebSocket connections.
- **Active Directory Logic**: Rewrote online counts to track unique database user IDs instead of counting duplicate socket connections.
- **CSS Styling System**: Implemented HSL colors, responsive widths, and standard media queries for better mobile sizing.
- **Escaped Message Rendering**: Implemented HTML escaping in client rendering logic to block script injections.

### Fixed
- **Express 5 Query Sanitization Crash**: Removed `express-mongo-sanitize` package which caused query property reassignments to crash in Express 5, implementing a custom in-place operator cleaner instead.
- **Hardcoded Backend Connection Endpoint**: Replaced static Render domain references with local vs production endpoint auto-detection.

### Security Improvements
- Added 12 rounds of password hashing using `bcryptjs`.
- Configured Express `helmet` headers for browser sandbox protections.
- Applied rate-limit bounds on authentication REST queries (100 requests per 15 mins).
- Integrated sanitizers that strip `$`/`.` symbols from client query inputs.

### Performance Improvements
- Handshake token decoding avoids database queries for user profiles during socket connections.
- Added debouncing to client typing indicators to throttle event rates.
- Replaced layout animations with hardware-accelerated transforms and opacity transitions.
