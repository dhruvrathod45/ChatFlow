# Known Limitations & Technical Debt — ChatFlow

This document captures the current technical boundaries, architectural limitations, scalability considerations, and future roadmaps of ChatFlow.

---

## 1. Technical Debt

- **Monolithic Server Architecture**: Both HTTP REST routes and WebSocket servers run in a single process. While simple, this makes horizontal scaling difficult.
- **In-Memory Connection Registry**: Online user directories are tracked using an in-memory JS `Map` (`activeSockets`). If the Node process restarts, the online state is cleared, and active clients must reconnect to re-register.
- **Client Script Monolith**: The frontend script is stored in a single file ([script.js](file:///c:/Users/dhruv/OneDrive%20-%20Adani%20University/Dhruv/BACKEND/NODE%20JS/CHATFLOW/frontend/script.js)). While fast for development, it can become hard to maintain as features grow.
- **No Refreshes/Access Token Split**: The app relies on a single long-lived JWT token (7 days). If intercepted, there is no built-in token revocation mechanism.

---

## 2. Scalability Limits

- **Vertical Node.js Scaling**: Because active users are mapped in memory, the server cannot scale horizontally across multiple instances (e.g. on Render) without Socket.IO events breaking. A user connected to Instance A won't see messages from a user connected to Instance B.
- **Single Room Constraints**: The current system broadcasts all chat messages to a single main room. As user numbers grow, this can create network congestion.
- **Unbounded History Fetch**: The historical message fetch is capped at 50 records. Without pagination, this limit can cause delays if history demands increase.

---

## 3. Recommended Future Improvements

### Architecture Scaling
- **Redis Adapter Integration**: Integrate `@socket.io/redis-adapter` to distribute event broadcasts across multiple backend instances.
- **Database Pagination**: Replace the static historical fetch with cursor-based pagination (e.g. `/api/messages?before=timestamp`).
- **Token Security**: Implement short-lived Access Tokens (e.g., 15 mins) and long-lived HTTP-Only cookie Refresh Tokens.

### Client Upgrades
- **Visual Improvements**: Add profile picture uploads, direct private messaging, and chat room selection.
- **Asset Bundler**: Add Webpack or Vite to modularize JS files and compile CSS into optimized production bundles.
