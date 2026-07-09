const jwt = require("jsonwebtoken");
const Message = require("../models/messageModel");
const User = require("../models/user");

// Keep track of active sockets
// Map: socket.id -> { userId, name, email }
const activeSockets = new Map();

module.exports = (io) => {
  // Middleware to authenticate Socket.IO connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers['authorization'];
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const cleanToken = token.replace("Bearer ", "");
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.user.name} (${socket.user.id})`);

    // Store in active sockets
    activeSockets.set(socket.id, {
      userId: socket.user.id,
      name: socket.user.name,
      email: socket.user.email
    });

    // Helper to get unique list of online users
    const getOnlineUsersList = () => {
      const list = [];
      const seen = new Set();
      for (const [sid, user] of activeSockets.entries()) {
        if (!seen.has(user.userId)) {
          seen.add(user.userId);
          list.push({ id: user.userId, name: user.name, email: user.email });
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
          message: `${socket.user.name} joined the chat`,
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
        if (!data.message || data.message.trim() === "") return;

        const newMessage = new Message({
          username: socket.user.name,
          message: data.message.trim(),
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })
        });

        await newMessage.save();

        io.emit("receive-message", {
          username: newMessage.username,
          message: newMessage.message,
          time: newMessage.time,
          createdAt: newMessage.createdAt
        });
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    // Handle typing indicator
    socket.on("typing", () => {
      socket.broadcast.emit("typing", socket.user.name);
    });

    // Handle stop typing indicator
    socket.on("stop-typing", () => {
      socket.broadcast.emit("stop-typing", socket.user.name);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      const user = activeSockets.get(socket.id);
      if (user) {
        activeSockets.delete(socket.id);
        console.log(`User Disconnected: ${user.name}`);

        const updatedOnlineList = getOnlineUsersList();
        io.emit("online-users-list", updatedOnlineList);
        io.emit("online-users", updatedOnlineList.length);

        // Broadcast system message that user left
        socket.broadcast.emit("receive-message", {
          username: "System",
          message: `${user.name} left the chat`,
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
