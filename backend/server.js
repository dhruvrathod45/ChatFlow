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

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.use("/api/auth", authRoutes);

let onlineUsers = 0;

io.on("connection", (socket) => {

  onlineUsers++;

  io.emit("online-users", onlineUsers);

  console.log("User Connected:", socket.id);

  socket.on("new-user", (username) => {

    socket.broadcast.emit("user-joined", username);

  });

  socket.on("send-message", async (data) => {

    try {

      const newMessage = new Message({
        username: data.username,
        message: data.message,
        time: data.time
      });

      await newMessage.save();

      socket.broadcast.emit("receive-message", data);

    } catch (error) {

      console.log(error.message);

    }

  });

  socket.on("disconnect", () => {

    onlineUsers--;

    io.emit("online-users", onlineUsers);

    console.log("User Disconnected");

  });

});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);

});