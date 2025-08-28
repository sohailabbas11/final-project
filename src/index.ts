import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import Message from "../models/Message";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/chat-app")
.then(() => {console.log("Connected to MongoDB")})
.catch((err) => {console.log(err)});

app.get("/messages", async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
  
    const [messages, total] = await Promise.all([
      Message.find()
        .sort({ createdAt: -1 }) // newest first
        .skip(skip)
        .limit(limit),
      Message.countDocuments()
    ]);
  
    res.json({
      messages,
      total,
      hasMore: page * limit < total
    });
  });
  
  app.post("/messages", async (req, res) => {
    const message = new Message(req.body);
    await message.save();
    res.json(message);
  });

    
app.delete("/messages/:id", async (req, res) => {
    const message = await Message.findByIdAndDelete(req.params.id);
    res.json(message);
});     



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {console.log(`Server is running on port ${PORT}`)});