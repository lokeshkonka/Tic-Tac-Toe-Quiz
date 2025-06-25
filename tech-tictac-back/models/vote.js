const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  sessionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'VoteSession',
    required: true 
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  voterIp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Ensure one vote per IP per session
voteSchema.index({ sessionId: 1, voterIp: 1 }, { unique: true });

const Vote = mongoose.model("Vote", voteSchema);
module.exports = Vote; 