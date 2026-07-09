const jwt = require("jsonwebtoken");
const Message = require("../models/messageModel");

// Keep track of active sockets
// Map: socket.id -> { username }
const activeSockets = new Map();

module.exports = (io) => {
  // Middleware to authenticate Socket.IO connections (Username-based)
  io.use((socket, next) => {
    const username = socket.handshake.auth?.username;
    if (!username || typeof username !== "string" || username.trim() === "" || username.toLowerCase() === "undefined" || username.toLowerCase() === "null") {
      return next(new Error("Authentication error: Valid username is required"));
    }

    socket.username = username.trim();
    next();
  });

  io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.username} (${socket.id})`);

    // Store in active sockets
    activeSockets.set(socket.id, {
      username: socket.username
    });

    // Helper to get unique list of online users
    const getOnlineUsersList = () => {
      const list = [];
      const seen = new Set();
      for (const [sid, user] of activeSockets.entries()) {
        if (!seen.has(user.username)) {
          seen.add(user.username);
          list.push({ id: sid, name: user.username });
        }
      }
      return list;
    };

    // Emit updated online users immediately on connection
    const onlineList = getOnlineUsersList();
    io.emit("online-users-list", onlineList);
    io.emit("online-users", onlineList.length);

    // Handle joining the chat room (specifically loading history and showing system alert)
    socket.on("join-chat", async () => {
      try {
        // Send message history to the newly connected socket
        const messages = await Message.find()
          .sort({ createdAt: -1 })
          .limit(50);
        
        socket.emit("message-history", messages.reverse());

        // Broadcast system message that user joined
        socket.broadcast.emit("receive-message", {
          username: "System",
          message: `${socket.username} joined the chat`,
          isSystem: true,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })
        });
      } catch (err) {
        console.error("Error in join-chat:", err);
      }
    });

    // Handle sending a message
    socket.on("send-message", async (data) => {
      try {
        // 1. Validation: check if payload is valid and has message property
        if (!data || typeof data !== "object") {
          socket.emit("chat-error", { message: "Invalid message payload received." });
          return;
        }

        const messageContent = data.message;
        if (messageContent === undefined || messageContent === null) {
          socket.emit("chat-error", { message: "Message text is missing from payload." });
          return;
        }

        if (typeof messageContent !== "string" || messageContent.trim() === "") {
          socket.emit("chat-error", { message: "Message content cannot be empty or whitespace-only." });
          return;
        }

        // 2. Security validation: check if username exists on socket
        if (!socket.username) {
          socket.emit("chat-error", { message: "Identity missing. Please reconnect." });
          return;
        }

        // 3. Construct and save the message
        const newMessage = new Message({
          username: socket.username,
          message: messageContent.trim(),
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })
        });

        await newMessage.save();

        // 4. Broadcast message to all connected clients
        io.emit("receive-message", {
          username: newMessage.username,
          message: newMessage.message,
          time: newMessage.time,
          createdAt: newMessage.createdAt
        });
      } catch (error) {
        console.error("Error saving message:", error);
        socket.emit("chat-error", { message: "An error occurred while saving your message." });
      }
    });

    // Handle typing indicator
    socket.on("typing", () => {
      socket.broadcast.emit("typing", socket.username);
    });

    // Handle stop typing indicator
    socket.on("stop-typing", () => {
      socket.broadcast.emit("stop-typing", socket.username);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      const user = activeSockets.get(socket.id);
      if (user) {
        activeSockets.delete(socket.id);
        console.log(`User Disconnected: ${user.username}`);

        const updatedOnlineList = getOnlineUsersList();
        io.emit("online-users-list", updatedOnlineList);
        io.emit("online-users", updatedOnlineList.length);

        // Broadcast system message that user left
        socket.broadcast.emit("receive-message", {
          username: "System",
          message: `${user.username} left the chat`,
          isSystem: true,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })
        });
      }
    });
  });
};
