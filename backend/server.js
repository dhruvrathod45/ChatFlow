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

/* SOCKET IO */

const io = new Server(server, {

  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }

});

/* MIDDLEWARE */

app.use(cors());

app.use(express.json());

/* ROUTES */

app.use("/api/auth", authRoutes);

/* DATABASE */

mongoose.connect(process.env.MONGO_URI)

.then(() => {
  console.log("MongoDB Connected");
})

.catch((err) => {
  console.log(err);
});

/* ONLINE USERS */

let onlineUsers = 0;

/* SOCKET CONNECTION */

io.on("connection", (socket) => {

  console.log("User Connected:", socket.id);

  /* JOIN CHAT */

  socket.on("join-chat", (username) => {

    onlineUsers++;

    io.emit("online-users", onlineUsers);

    io.emit("receive-message", {

      username: "System",

      message: `${username} joined the chat`,

      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })

    });

  });

  /* SEND MESSAGE */

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

  /* DISCONNECT */

  socket.on("disconnect", () => {

    onlineUsers--;

    if (onlineUsers < 0) {
      onlineUsers = 0;
    }

    io.emit("online-users", onlineUsers);

    console.log("User Disconnected");

  });

});

/* PORT */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);

});