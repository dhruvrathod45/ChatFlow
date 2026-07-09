const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");

// Config env variables
dotenv.config();

const connectDB = require("./config/db");
const chatSocket = require("./sockets/chatSocket");

// Express App
const app = express();
const server = http.createServer(app);

// Connect to Database
connectDB();

// Custom In-Place MongoDB Injection Sanitizer (Express 5 compatible)
const sanitizeObject = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        sanitizeObject(obj[key]);
      }
    }
  }
};

const customMongoSanitize = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
};

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for ease of fetching CDN files in frontend
    crossOriginEmbedderPolicy: false
  })
);
app.use(customMongoSanitize);

// CORS configuration
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

// Serve static frontend files (ideal for local testing and direct backend access)
app.use(express.static(path.join(__dirname, "../frontend")));

// Fallback index.html serve for SPA routing
app.use((req, res, next) => {
  if (!req.path.startsWith("/api/")) {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
  } else {
    res.status(404).json({ message: "API endpoint not found" });
  }
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Error Handler Caught:", err.stack || err.message || err);
  
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Internal Server Error"
  });
});

// Create Socket.io server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Bind socket handlers
chatSocket(io);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});