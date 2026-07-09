# Project Implementation & Developer Report — ChatFlow

This developer-focused report details the architecture, design choices, flow lifecycles, and security models of ChatFlow.

---

## 1. Project Summary

ChatFlow is a real-time cybernetic messaging platform designed to facilitate secure, instant communications in a glassmorphic dashboard interface. 

### Architectural Pattern
The application follows a **Decoupled Client-Server Architecture** utilizing:
- **Express.js HTTP REST endpoints** for one-time stateless operations (Registration, Session Initialization).
- **Socket.IO (WebSockets)** for bi-directional stateful communication (Message broadcasting, Active directory tracking, typing indicators).
- **Mongoose / MongoDB Atlas** for data persistence.

```text
+------------------+                   +--------------------+
|  Client Browser  | <---(REST HTTPS)--|   Express.js API   |
|  (HTML/CSS/JS)   | ---(Socket.IO)--->|  & Socket Server   |
+------------------+                   +---------+----------+
                                                 |
                                            (Mongoose)
                                                 v
                                       +--------------------+
                                       |   MongoDB Atlas    |
                                       +--------------------+
```

---

## 2. Technology Stack Selection

### Backend
- **Node.js (v18+)**: Selected for its asynchronous, event-driven JavaScript engine, which is optimal for handling concurrent I/O operations such as WebSocket connections.
- **Express.js (v5.2+)**: Chosen as the routing framework for REST endpoints due to its fast execution, ease of middleware integration, and native Express 5 asynchronous error-routing capabilities.
- **Socket.IO (v4.8+)**: Utilized over raw WebSockets because it provides out-of-the-box polling fallbacks, automatic reconnect channels, multiplexing support, and built-in connection buffering.
- **MongoDB Atlas & Mongoose (v9.6+)**: NoSQL is chosen over relational databases because chat messages are unstructured, document-centric, and written frequently. Mongoose provides clean validation and schema compilation.
- **JWT (JsonWebToken v9.0+)**: Enabled stateless authorization, allowing the server to verify user sessions without querying the database for every single HTTP or WebSocket request.

### Frontend
- **HTML5 & Vanilla CSS3**: Selected to optimize loading speeds, minimize bundle weights, and achieve custom visual layouts (such as neon-glow borders, glass backdrops, and aurora animations) without UI kit limits.
- **Vanilla ES6+ JavaScript**: Chosen to build a lightweight, fast Single Page Application (SPA) without the compilation overhead of React or Vue.

---

## 3. Folder Structure & Code Responsibilities

- **`backend/`**: Contains server code.
  - **`config/db.js`**: Connects to the remote MongoDB Atlas cluster using Mongoose and handles graceful connection failures.
  - **`controllers/authController.js`**: Houses registration and login controller methods. Applies input validations and hashes credentials.
  - **`middleware/authMiddleware.js`**: Validates the HTTP `Authorization: Bearer <token>` header on protected REST routes.
  - **`models/user.js`**: Defines the user document database properties.
  - **`models/messageModel.js`**: Defines the chat logging schema.
  - **`routes/authRoutes.js`**: Maps REST endpoints to their respective authentication controllers.
  - **`sockets/chatSocket.js`**: Encapsulates all Socket.IO server configurations, verifying handshake tokens and handling message logs.
  - **`server.js`**: Application entry point. Configures security middlewares, serves the frontend assets, and registers routes.
- **`frontend/`**: Contains static assets.
  - **`index.html`**: SPA landing layout, including auth overlays and skeleton loaders.
  - **`style.css`**: Styling sheets managing backgrounds, transitions, and responsive grid layouts.
  - **`script.js`**: Controls login, token validation, WebSocket connection, message rendering, and typing state debouncing.

---

## 4. System Processing Flows

### Backend Lifecycle Flow
1. **Startup**: `node server.js` runs. `dotenv` injects env keys.
2. **DB Connection**: Mongoose requests connection to the Atlas cluster. If connection fails, the process exits with status code `1`.
3. **HTTP Middlewares**: Incoming HTTP queries pass through `helmet` (header protection), `customMongoSanitize` (NoSQL query cleaning), and `cors`.
4. **Auth Routes**: Express routes incoming `/api/auth` calls to controllers.
5. **WebSocket Verification**: The `Server` class intercepts `/socket.io/` connections. The JWT token is read from the handshake and verified. If invalid, the connection is closed.
6. **Socket Events**: If valid, the socket joins the channel, loads message history, and starts event listeners.
7. **Error Propagation**: Any asynchronous errors in controllers are forwarded to the centralized error middleware via `next(error)`.

### Frontend Lifecycle Flow
1. **Boot**: The page loads. CSS sets up the mesh background and begins floating particles.
2. **Session Restore**: JavaScript checks `localStorage` for `chatflow_token`.
   - **If found**: Skips auth and calls `initializeInterface()`.
   - **If missing**: Renders the login overlay.
3. **Session Capture**: Registration or login calls fetch APIs. On success, the JWT token and user metadata are saved, and the interface transitions.
4. **WebSocket Link**: The script initiates a WebSocket connection, sending the token inside the `auth` envelope.
5. **Feed Load**: The client receives the `"message-history"` array and prints the initial bubbles, scrolling to the bottom.
6. **Transmission**: Sending a message emits `"send-message"`. Typing triggers a debounced `"typing"` event, notifying other users.
7. **Interruption Banner**: If the connection drops, a reconnect HUD slides down and states update to "reconnecting". Once restored, the banner is hidden.

---

## 5. Session & Authentication Lifecycle

```text
[Register User]
  └── Operator Name, Email, Password inputs.
  └── POST to /api/auth/register.
  └── Controller validates fields.
  └── Bcryptjs hashes password with 12 salt rounds.
  └── User document written to MongoDB.
  └── JWT Token signed with payload { id, name, email }.
  └── Returned to client with 201 status code.

[Login User]
  └── Email and Password inputs.
  └── POST to /api/auth/login.
  └── Document queried by email.
  └── Bcryptjs compares password with stored hash.
  └── JWT Token signed with payload { id, name, email }.
  └── Returned to client with 200 status code.

[Socket Connection Handshake]
  └── Client initializes socket: io(URL, { auth: { token } }).
  └── Server intercepts handshake: socket.handshake.auth.token.
  └── jwt.verify checks token signature against process.env.JWT_SECRET.
  └── On Success: Connection allowed; socket.user set to token payload.
  └── On Failure: Handshake rejected with Error.
```

---

## 6. Database Schema Design

### 1. `User` Collection
Stores registered operator profile details.
- **Fields**:
  - `name` (String, required, trimmed): Display username.
  - `email` (String, required, unique, lowercase, trimmed): Secure email.
  - `password` (String, required): Bcrypt hashed string.
  - `createdAt` / `updatedAt` (Date): Automatic mongoose timestamps.
- **Indexes**:
  - Unique index on `email` to prevent duplicate registrations.

### 2. `Message` Collection
Persistent chat logs.
- **Fields**:
  - `username` (String, required): Display name of the sender.
  - `message` (String, required): Sanitized message payload.
  - `time` (String): Display timestamp (e.g. `12:30 PM`).
  - `createdAt` / `updatedAt` (Date): Timestamps.
- **Indexes**:
  - Index on `createdAt` (descending) to optimize sorted history queries.

---

## 7. Socket.IO Event Schema

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `join-chat` | Client ➔ Server | *None* | Sent when client is ready to receive history and online list. |
| `message-history` | Server ➔ Client | `Array<Message>` | List of last 50 messages sent to the newly connected client. |
| `send-message` | Client ➔ Server | `{"message": string}` | Dispatches a new message. |
| `receive-message` | Server ➔ Client | `Message` | Broadcasts message or system notification to all sockets. |
| `online-users` | Server ➔ Client | `number` | Unique online user count. |
| `online-users-list` | Server ➔ Client | `Array<User>` | Profile details of all currently active connections. |
| `typing` | Client ➔ Server | *None* | Client notifies that they are typing. |
| `typing` | Server ➔ Client | `string` | Broadcasts typing username to all other clients. |
| `stop-typing` | Client ➔ Server | *None* | Client notifies they stopped typing. |
| `stop-typing` | Server ➔ Client | `string` | Tells other clients to clear typing indicators. |
| `disconnect` | System | *None* | Fired when connection drops. Clears user from active list. |

---

## 8. API Endpoint Documentation

### POST `/api/auth/register`
- **Request Validation**:
  - `name` must be at least 2 characters.
  - `email` must match standard email formats.
  - `password` must be at least 6 characters.
- **Status Codes**:
  - `201 Created`: User created. Returns token and user object.
  - `400 Bad Request`: Input validation failed or user exists.
  - `500 Server Error`: Uncaught exceptions.

### POST `/api/auth/login`
- **Request Validation**:
  - `email` and `password` must be present.
- **Status Codes**:
  - `200 OK`: Login successful. Returns token and user object.
  - `401 Unauthorized`: Invalid credentials.
  - `500 Server Error`: Uncaught exceptions.

---

## 9. UI/UX Decisions

- **Cyberpunk Theme Consistency**: High contrast neon highlights (`#00ffd5`, `#7b61ff`, `#ff00c8`) combined with dark backgrounds (`#07070c`) provide a clean HUD (Heads Up Display) cybernetic aesthetic.
- **Glassmorphism**: Backdrop blur (`35px`) and thin borders (`rgba(255,255,255,0.07)`) create depth, separating controls from the animated particles background.
- **Transitions and Animations**:
  - Fade/slide transitions for the login overlay.
  - Smooth slide-up animations for messages.
  - Pulsing indicators for active connections.
- **Mobile Responsiveness**: Designed with media queries down to `320px`. The active users sidebar collapses off-screen on mobile devices and can be toggled using a header button.

---

## 10. Performance & Security Hardening

### Performance
- **handshake decoding**: Session profiles (`name`, `email`) are encoded directly in the JWT payload, preventing database reads on socket connections.
- **Typing Debouncing**: The frontend uses a timeout to emit `stop-typing` events, reducing socket spam.
- **GPU Acceleration**: CSS animations use `transform` and `opacity` to avoid layout thrashing and maintain 60fps renders.

### Security
- **JWT Protection**: Sessions expire in 7 days.
- **Password Safety**: Hashing uses `bcryptjs` with 12 salt rounds.
- **Header Throttling & Rate Limits**: Auth routes are capped at 100 requests per 15 minutes to block brute-force attempts.
- **Helmet Headers**: Injects security headers, disabling MIME-sniffing and cross-site framing.
- **XSS Protection**: HTML entities are escaped on message rendering to prevent script injections.
- **In-Place Mongo Injection Sanitizer**: Prevents operator injections without breaking Express 5 request getters.

---

## 11. Bug Resolution Log

### Bug 1: User Schema Mismatch
- **Problem**: Registrations failed.
- **Root Cause**: [user.js](file:///c:/Users/dhruv/OneDrive%20-%20Adani%20University/Dhruv/BACKEND/NODE%20JS/CHATFLOW/backend/models/user.js) was a copy-paste of the message schema.
- **Fix**: Redefined schema with name, email, and password. Modified [user.js](file:///c:/Users/dhruv/OneDrive%20-%20Adani%20University/Dhruv/BACKEND/NODE%20JS/CHATFLOW/backend/models/user.js).

### Bug 2: Express 5 Router Wildcard Crash
- **Problem**: Server crashed on startup.
- **Root Cause**: Express 5 uses path-to-regexp v8, which throws on `*` paths.
- **Fix**: Replaced wildcard router with `app.use((req, res, next) => { ... })` catch-all middleware. Modified [server.js](file:///c:/Users/dhruv/OneDrive%20-%20Adani%20University/Dhruv/BACKEND/NODE%20JS/CHATFLOW/backend/server.js).

### Bug 3: Mongo Sanitize Getter Crash
- **Problem**: Request handler crashed when routing queries.
- **Root Cause**: `express-mongo-sanitize` attempted to write to Express 5's read-only `req.query` getter.
- **Fix**: Replaced package with `customMongoSanitize` which performs recursive key deletions in-place. Modified [server.js](file:///c:/Users/dhruv/OneDrive%20-%20Adani%20University/Dhruv/BACKEND/NODE%20JS/CHATFLOW/backend/server.js).

---

## 12. Deployment Setup

- **Frontend (Vercel)**: Serve static client assets. Needs the backend production URL set in the JS build or configured correctly.
- **Backend (Render)**: Hosts the Express server process.
  - Environment variables must be configured on Render (`PORT`, `MONGO_URI`, `JWT_SECRET`).
  - CORS must allow the Vercel app's domain to prevent connection blocks.
