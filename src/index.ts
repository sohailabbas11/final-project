import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server as IOServer } from "socket.io";
import MessageRoutes from "../routes/messageRoutes";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Mongo connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/chat-app")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// create http server and socket.io
const server = http.createServer(app);
const io = new IOServer(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:8081",
    methods: ["GET", "POST"],
  },
});

// Socket.IO connection handlers
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join room (optional): client can emit "joinRoom" with a room id/room name
  socket.on("joinRoom", (roomId: string) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // Leave room (optional)
  socket.on("leaveRoom", (roomId: string) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room ${roomId}`);
  });

  // Relay sendMessage -> broadcast
  socket.on("sendMessage", (data) => {
    // if you want to scope to a room: io.to(data.roomId).emit(...)
    io.emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// mount message routes, injecting io so routes can emit events when saving/deleting messages
app.use("/", MessageRoutes(io));

// start server (use server.listen, not app.listen, because socket.io uses the http server)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
