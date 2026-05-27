const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const Message = require("./models/messageModel");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}));

app.use(express.json());

app.use("/api/auth", authRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("MongoDB Connected");
})
.catch((err) => {
  console.log(err);
});

let onlineUsers = 0;

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  onlineUsers++;
  io.emit("online-users", onlineUsers);

  socket.on("join-chat", (username) => {
    io.emit("receive-message", {
      username: "System",
      message: `${username} joined the chat`,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    });
  });

  socket.on("send-message", async (data) => {
    try {
      const newMessage = new Message({
        username: data.username,
        message: data.message,
        time: data.time
      });

      await newMessage.save();

      io.emit("receive-message", data);

    } catch (error) {
      console.log(error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected");

    onlineUsers--;

    io.emit("online-users", onlineUsers);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});