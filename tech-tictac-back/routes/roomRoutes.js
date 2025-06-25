// routes/rooms.js
const express = require("express");
const Room = require("../models/room");

const router = express.Router();
const generateRoomCode = () => Math.random().toString(36).substr(2, 6).toUpperCase();

router.post("/create", async (req, res) => {
  try {
    const roomCode = generateRoomCode();
    const newRoom = new Room({ roomCode, players: [] });
    await newRoom.save();
    res.status(201).json({ success: true, message: "Room created successfully", room: newRoom });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating room", error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching rooms" });
  }
});

router.post("/join", async (req, res) => {
  try {
    const { roomCode, playerId } = req.body;
    const room = await Room.findOne({ roomCode });
    if (!room) return res.status(404).json({ success: false, message: "Room not found" });
    if (room.players.length >= 2) return res.status(400).json({ success: false, message: "Room is full" });
    if (room.players.includes(playerId)) return res.status(400).json({ success: false, message: "Player name already exists in this room" });
    room.players.push(playerId);
    await room.save();
    res.status(200).json({ success: true, message: "Joined room successfully", room });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error joining room", error: error.message });
  }
});

router.delete("/remove-player", async (req, res) => {
  try {
    const { roomCode, playerId } = req.body;
    const room = await Room.findOne({ roomCode });
    if (!room) return res.status(404).json({ success: false, message: "Room not found" });
    room.players = room.players.filter(player => player !== playerId);
    await room.save();
    res.status(200).json({ success: true, message: "Player removed successfully", room });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error removing player", error: error.message });
  }
});

router.delete("/delete", async (req, res) => {
  try {
    const { roomCode } = req.body;
    const room = await Room.findOneAndDelete({ roomCode });
    if (!room) return res.status(404).json({ success: false, message: "Room not found" });
    res.status(200).json({ success: true, message: "Room deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting room", error: error.message });
  }
});

router.post("/start-game", async (req, res) => {
  try {
    const { roomCode } = req.body;
    const room = await Room.findOne({ roomCode });
    
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }
    
    if (room.players.length !== 2) {
      return res.status(400).json({ success: false, message: "Need exactly 2 players to start the game" });
    }
    
    room.status = "started";
    await room.save();
    
    res.status(200).json({ success: true, message: "Game started successfully", room });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error starting game", error: error.message });
  }
});

router.get("/:roomCode", async (req, res) => {
  try {
    const { roomCode } = req.params;
    const room = await Room.findOne({ roomCode });
    
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }
    
    res.status(200).json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching room", error: error.message });
  }
});

module.exports = router;
