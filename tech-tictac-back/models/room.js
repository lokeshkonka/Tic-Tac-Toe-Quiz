const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true }, // Unique room code
  players: { type: [String], default: [] }, // Player IDs
  gameState: {
    board: {
      type: [mongoose.Schema.Types.Mixed],
      default: Array(9).fill(null), // Tic-Tac-Toe board
    },
    currentTurn: { type: String, default: "X" }, // X or O
    winner: { type: String, default: null },
    moves: [{
      player: String,
      symbol: String,
      index: Number,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  status: { type: String, default: "lobby", enum: ["lobby", "started", "completed"] }, // Room status
  createdAt: { type: Date, default: Date.now } // Timestamp
});

const Room = mongoose.model("Room", roomSchema);
module.exports = Room;
