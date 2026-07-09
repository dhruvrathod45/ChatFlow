# Technical Q&A Reference — ChatFlow

This document contains 102 detailed technical questions and answers regarding ChatFlow's architecture, flow pipelines, database layouts, WebSockets, and security.

---

## 🏛️ SECTION 1: Architecture & Technology Stack (Q1 - Q15)

#### Q1: What architectural pattern does ChatFlow implement?
**A**: ChatFlow implements a decoupled Client-Server architecture. The server acts as a stateless REST API for user session validation (login/register) and a stateful WebSocket node for real-time messaging, using MongoDB Atlas for storage.

#### Q2: What is the benefit of keeping the REST API and Socket server on the same Node process?
**A**: Running them on the same process simplifies deployment on platforms like Render, allows them to share the database connection, port binding, and environment configurations, and avoids cross-origin complex socket handshake overheads.

#### Q3: Why was Vanilla JS chosen over React or Vue for the frontend?
**A**: To avoid build/transpiling steps, eliminate dependencies, reduce asset bundle weights, and achieve instant page-loading speeds.

#### Q4: Why was Express 5 chosen instead of Express 4?
**A**: Express 5 supports native promise handling in route controllers, automatically routing rejected promises and thrown errors to the centralized error middleware without needing manual `try-catch` wrapper functions or `next()` calls for every exception.

#### Q5: Why was Socket.IO selected instead of raw WebSockets?
**A**: Socket.IO provides built-in heartbeats, automatic reconnection, fallback channels (polling), packet buffering, and namespace room abstractions that are complex to write from scratch in raw WebSockets.

#### Q6: Why is MongoDB suited for ChatFlow instead of PostgreSQL?
**A**: Chat messages are unstructured document logs. MongoDB handles write-heavy workflows, scale-out document stores, and dynamic keys (like system notification flags) more efficiently than relational SQL nodes.

#### Q7: How does the server serve the client assets locally?
**A**: In `server.js`, `app.use(express.static(path.join(__dirname, "../frontend")))` instructs Express to serve static files from the frontend directory.

#### Q8: What does the catch-all middleware in server.js do?
**A**: It catches any GET requests that do not match `/api/` paths and redirects them to serve `index.html`, supporting Single Page Application (SPA) routing.

#### Q9: What happens if the MongoDB connection drops while the server is running?
**A**: Mongoose automatically buffers queries and attempts reconnection in the background. If a database query fails, the exception propagates to the server error handler.

#### Q10: How does environment variable injection work in local development?
**A**: The `dotenv` package reads `.env` on startup and assigns the key-values to `process.env`.

#### Q11: Why is `.env` excluded from the git history?
**A**: To prevent exposure of secrets (like database credentials and JWT keys) in repository histories.

#### Q12: How does the application detect whether it is in a local or production host?
**A**: In `frontend/script.js`, `window.location.hostname` is checked. If it is `localhost` or `127.0.0.1`, it targets port `5000` locally. Otherwise, it points to the production URL.

#### Q13: What template engine is used by the frontend?
**A**: None. The frontend uses standard HTML template strings in JavaScript to build HTML layouts dynamically.

#### Q14: How are dependencies managed in this project?
**A**: Managed using npm and registered in `package.json`.

#### Q15: What is the main entry file of the backend?
**A**: `backend/server.js`.

---

## 🔒 SECTION 2: Authentication & Sessions (Q16 - Q30)

#### Q16: How is user registration handled?
**A**: The client sends a POST request with `name`, `email`, and `password` to `/api/auth/register`. The controller validates inputs, hashes the password, writes the user to the database, and returns a signed JWT.

#### Q17: What validations are performed during registration?
**A**: The backend validates that all fields are present, `name` is $\ge 2$ characters, `email` matches a regular expression, and `password` is $\ge 6$ characters.

#### Q18: What password hashing algorithm is used?
**A**: `bcryptjs` is used to hash passwords with 12 salt rounds.

#### Q19: Why was the salt round set to 12 instead of 10?
**A**: 12 rounds increases computational complexity, making brute-force dictionary attacks harder, while keeping response times fast.

#### Q20: What payload is stored in the JWT?
**A**: The token stores the user's database ID (`id`), name (`name`), and email (`email`).

#### Q21: Why store the user's name in the JWT payload?
**A**: It allows both the client and the socket handshake to access the username instantly without querying the database.

#### Q22: What is the expiration time of the JWT?
**A**: 7 days (`7d`).

#### Q23: How does the backend protect routes from unauthenticated users?
**A**: By routing requests through the `authMiddleware.js` middleware, which validates the JWT before passing control to route handlers.

#### Q24: How does `authMiddleware.js` extract the token?
**A**: It reads the `Authorization` header and strips out the `Bearer ` prefix.

#### Q25: What happens if an expired token is passed to `authMiddleware.js`?
**A**: `jwt.verify` throws an error, and the middleware returns a `401 Unauthorized` response.

#### Q26: Where does the frontend store the JWT?
**A**: In `localStorage` as `chatflow_token`.

#### Q27: How is user metadata persisted on the client?
**A**: Saved in `localStorage` under `chatflow_user` as a JSON string.

#### Q28: How does the client restore an active session on startup?
**A**: It checks `localStorage` for `chatflow_token` and `chatflow_user`. If present, it initializes the chat interface.

#### Q29: What happens when the user clicks 'Logout'?
**A**: The client clears `localStorage`, disconnects the socket, and displays the login overlay.

#### Q30: Can a user log in with multiple browsers simultaneously?
**A**: Yes. The JWT is stateless, allowing multiple concurrent sessions.

---

## 🔌 SECTION 3: WebSockets & Socket.IO (Q31 - Q45)

#### Q31: How is the WebSocket server authenticated?
**A**: Socket.IO uses middleware to check the `token` in the handshake payload. If missing or invalid, the connection is rejected.

#### Q32: What socket handshake middleware is registered in chatSocket.js?
**A**: `io.use((socket, next) => { ... })` checks the handshake authorization.

#### Q33: How does the client pass the token during connection?
**A**: By setting `auth: { token }` in the Socket.IO client constructor options.

#### Q34: What is the function of the 'join-chat' event?
**A**: It registers the connection, returns message history, and broadcasts a system join alert.

#### Q35: How does the server track online users?
**A**: Using a `Map` of socket IDs mapping to user objects (`activeSockets`).

#### Q36: Why does the server map socket IDs instead of user IDs?
**A**: Mapping socket IDs ensures that if a user opens multiple tabs, disconnecting one tab only removes that specific connection.

#### Q37: How is the unique online user count calculated?
**A**: By filtering `activeSockets` by unique user IDs.

#### Q38: When is 'online-users-list' emitted?
**A**: Emitted to all clients whenever a user connects or disconnects.

#### Q39: What properties are sent in the 'online-users-list' payload?
**A**: An array of objects, each containing a user's `id`, `name`, and `email`.

#### Q40: What happens when 'send-message' is received by the server?
**A**: The server saves the message to MongoDB and broadcasts it to all connected sockets.

#### Q41: How are system notifications formatted?
**A**: Sent as a message object with `username: "System"`, a status string, and `isSystem: true`.

#### Q42: How does the typing indicator work?
**A**: The client emits `typing` or `stop-typing`. The server broadcasts the event to all other sockets.

#### Q43: How are typing indicators debounced on the client?
**A**: The client uses a timeout that emits `stop-typing` if the user stops typing for 1.5 seconds.

#### Q44: What transports are enabled for Socket.IO?
**A**: `websocket` and `polling`.

#### Q45: How does the server notify others when a socket disconnects?
**A**: The server removes the socket from `activeSockets` and broadcasts a system message.

---

## 🧠 SECTION 4: Backend Processing & Middlware (Q46 - Q60)

#### Q46: How are uncaught router exceptions handled?
**A**: Uncaught exceptions are routed to the centralized error middleware in `server.js`.

#### Q47: What does the custom database configuration module config/db.js do?
**A**: It exports `connectDB`, which initializes the database connection.

#### Q48: Why was express-mongo-sanitize replaced?
**A**: It crashed in Express 5 by attempting to write to the read-only `req.query` getter.

#### Q49: How does customMongoSanitize prevent injection?
**A**: It recursively deletes keys in `req.body`, `req.query`, and `req.params` that start with `$` or contain `.`.

#### Q50: How is Helmet configured on the backend?
**A**: Enabled with custom options (`contentSecurityPolicy: false`) to allow external Socket.IO CDNs.

#### Q51: What rate limiter is applied, and why?
**A**: `express-rate-limit` limits auth routes to 100 requests per 15 minutes to prevent brute-force attacks.

#### Q52: What CORS configuration is applied on the server?
**A**: Express CORS allows origins, setting `methods` to `["GET", "POST", "OPTIONS"]` and permitting custom headers.

#### Q53: What port does the server listen on?
**A**: It binds to `process.env.PORT` or falls back to port `5000`.

#### Q54: How does Express parse incoming request bodies?
**A**: Using the built-in `express.json()` parser middleware.

#### Q55: How does the server serve static frontend assets?
**A**: By using the `express.static` middleware.

#### Q56: What does the route app.use("/api/auth", authRoutes) do?
**A**: It binds authentication REST endpoints to their respective paths.

#### Q57: How does the backend controller forward errors to the centralized error handler?
**A**: By calling `next(error)` inside catch blocks.

#### Q58: What is the default status code for uncaught server errors?
**A**: `500 Internal Server Error`.

#### Q59: Why is process.exit(1) called when the database fails to connect on startup?
**A**: The server cannot function without a database, so it exits immediately.

#### Q60: How does Mongoose compile schemas?
**A**: Mongoose compiles schemas into models using `mongoose.model(name, schema)`.

---

## 🗄️ SECTION 5: Database Design & Queries (Q61 - Q75)

#### Q61: What collections exist in the MongoDB cluster?
**A**: `users` and `messages`.

#### Q62: What is the purpose of the unique constraint on the User email?
**A**: To prevent multiple registrations with the same email.

#### Q63: Why are lowercase and trim flags applied to the email schema?
**A**: To standardize email formatting and prevent duplicate lookups caused by case differences or trailing spaces.

#### Q64: What is the message schema format?
**A**: It defines `username`, `message`, and `time` fields.

#### Q65: Why is the time field stored as a string instead of a Date object?
**A**: The client formats timestamps locally before sending them to the server for consistent rendering.

#### Q66: How is message history queried on user join?
**A**: The server queries messages, sorts them by `createdAt` in descending order, limits the output to 50, and reverses the result.

#### Q67: What indexes are applied to the User collection?
**A**: A unique index is created on the `email` field.

#### Q68: What indexes are applied to the Message collection?
**A**: An index is created on the `createdAt` field.

#### Q69: Why use { timestamps: true } in Mongoose schemas?
**A**: It automatically adds and updates `createdAt` and `updatedAt` fields.

#### Q70: How does Mongoose prevent schema compilation collisions?
**A**: By checking if the model is already compiled (`mongoose.models.Message || ...`).

#### Q71: How does Mongoose connect to MongoDB Atlas?
**A**: Using `mongoose.connect(uri)`.

#### Q72: What is the role of Mongoose validation rules?
**A**: To ensure required fields are validated before write operations.

#### Q73: What happens if a save operation fails validation?
**A**: Mongoose throws a ValidationError, which is caught and handled by the catch block.

#### Q74: Why is it important to index fields used in sorting operations?
**A**: Indexes avoid memory sorting overheads, improving query performance.

#### Q75: How does the app handle database connections in server.js?
**A**: It calls `connectDB()`, which runs asynchronously on startup.

---

## 🎨 SECTION 6: Frontend Logic & UI/UX (Q76 - Q90)

#### Q76: What library is used to run animations?
**A**: Vanilla CSS transitions and CSS keyframe animations.

#### Q77: How are message elements added to the DOM?
**A**: By dynamically creating a `div`, setting its `innerHTML`, and appending it to the message container.

#### Q78: Why is innerHTML safe to use here?
**A**: Message contents are escaped before being added to the DOM.

#### Q79: How is the chat viewport kept scrolled to the bottom?
**A**: By setting `messageContainer.scrollTop = messageContainer.scrollHeight`.

#### Q80: How does the client display user initials as avatars?
**A**: By extracting the first letters of the user's name.

#### Q81: What fonts are used in ChatFlow?
**A**: `Orbitron` for headers and `Outfit` for body text.

#### Q82: How does the frontend handle API request failures?
**A**: It displays an error toast notification to the user.

#### Q83: What is the styling strategy for the glassmorphic panels?
**A**: Thin borders and `backdrop-filter: blur(35px)`.

#### Q84: How is mobile responsiveness implemented?
**A**: Using CSS media queries (`@media`).

#### Q85: How does the sidebar toggle work on mobile?
**A**: By toggling an `.active` class on the sidebar element.

#### Q86: How does the custom scrollbar style work?
**A**: Using `-webkit-scrollbar` pseudoelements.

#### Q87: What is the mesh background layout?
**A**: A grid pattern created with linear CSS gradients.

#### Q88: How are ambient particles animated?
**A**: By generating random particle positions and animating them.

#### Q89: How does the offline banner work?
**A**: It slides down from the top of the viewport when connection is lost.

#### Q90: Why are HTML elements assigned unique IDs?
**A**: To simplify DOM queries and support testing.

---

## 🚀 SECTION 7: Operations & Hardening (Q91 - Q102)

#### Q91: How does token verification speed up socket authentication?
**A**: Resolving session data from token signatures avoids database lookup overhead.

#### Q92: What are the security benefits of CORS in production?
**A**: Limiting access to whitelisted domains prevents unauthorized external sites from reading data.

#### Q93: Why is rate limiting important?
**A**: Throttles brute-force attempts on authentication endpoints.

#### Q94: How does Helmet mitigate security risks?
**A**: It adds HTTP headers that block common exploits (XSS, clickjacking, etc.).

#### Q95: Why does the app escape HTML inputs?
**A**: To prevent Cross-Site Scripting (XSS) attacks.

#### Q96: What is a NoSQL Injection?
**A**: An exploit where attackers query database fields using operators (e.g. `$ne`).

#### Q97: How does customMongoSanitize prevent NoSQL injection?
**A**: It strips characters like `$` and `.` from request objects.

#### Q98: How are uncaught router exceptions logged?
**A**: They are printed to `console.error` inside the central error handler.

#### Q99: What does process.env.NODE_ENV control?
**A**: Controls environment modes (e.g., showing detailed error traces in development).

#### Q100: How is Socket.IO configured for production?
**A**: Points to the deployed URL and enables CORS for secure connections.

#### Q101: What happens if a client attempts to connect without a token?
**A**: The connection is rejected by the server handshake middleware.

#### Q102: How is the database connection kept alive?
**A**: Mongoose manages the underlying connection pool to keep it active.
