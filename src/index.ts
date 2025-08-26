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

    app.post("/messages", async (req, res) => {
        const text = req.body.text;
        const message = new Message({
            text,
        });
        await message.save();
        res.status(201).json(message);
    });

app.get("/messages", async (req, res) => {
    const messages = await Message.find();
    res.json(messages);
});



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {console.log(`Server is running on port ${PORT}`)});