const jwt = require("jsonwebtoken");
const Message = require("../models/messageModel");
const User = require("../models/user");

// Keep track of active sockets
// Map: socket.id -> { userId, name, email }
const activeSockets = new Map();

module.exports = (io) => {
  // Middleware to authenticate Socket.IO connections
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers['authorization'];
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const cleanToken = token.replace("Bearer ", "");
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
      
      // Fetch user from DB to ensure validity and get name/email if not in token
      const dbUser = await User.findById(decoded.id);
      if (!dbUser) {
        return next(new Error("Authentication error: User not found in database"));
      }

      socket.user = {
        id: dbUser._id.toString(),
        name: dbUser.name,
        email: dbUser.email
      };
      
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

        // 2. Security validation: check if authenticated user details exist on socket
        if (!socket.user || !socket.user.name) {
          socket.emit("chat-error", { message: "Authentication identity missing. Please reconnect." });
          return;
        }

        // 3. Construct and save the message
        const newMessage = new Message({
          username: socket.user.name,
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
