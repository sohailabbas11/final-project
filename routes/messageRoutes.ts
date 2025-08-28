import { Router } from "express";
import { Server as IOServer } from "socket.io";
import Message from "../models/Message"; // keep your existing model

// export a factory to accept io
export default function MessageRoutes(io: IOServer) {
  const router = Router();

  // GET /messages?page=1&limit=20
  router.get("/messages", async (req, res) => {
    try {
      const page = parseInt((req.query.page as string) || "1", 10) || 1;
      const limit = parseInt((req.query.limit as string) || "20", 10) || 20;
      const skip = (page - 1) * limit;

      const [messages, total] = await Promise.all([
        Message.find()
          .sort({ createdAt: -1 }) // newest first
          .skip(skip)
          .limit(limit),
        Message.countDocuments(),
      ]);

      res.json({
        messages,
        total,
        hasMore: page * limit < total,
      });
    } catch (err) {
      console.error("GET /messages error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /messages -> save message, emit real-time event
  router.post("/messages", async (req, res) => {
    try {
      const message = new Message(req.body);
      const saved = await message.save();

      // Emit saved message to all connected clients
      io.emit("receiveMessage", saved);

      // If you want rooms: io.to(roomId).emit(...)
      res.status(201).json(saved);
    } catch (err) {
      console.error("POST /messages error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DELETE /messages/:id -> delete and emit deletion event
  router.delete("/messages/:id", async (req, res) => {
    try {
      const deleted = await Message.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Message not found" });

      // Notify clients that a message was deleted (send id)
      io.emit("messageDeleted", { id: req.params.id });

      res.json(deleted);
    } catch (err) {
      console.error("DELETE /messages/:id error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return router;
}
