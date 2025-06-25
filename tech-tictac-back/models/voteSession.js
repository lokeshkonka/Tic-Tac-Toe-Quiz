const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true }
});

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  voteCount: { type: Number, default: 0 },
  candidates: [candidateSchema]
});

const voteSessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  teams: [teamSchema],
  isActive: { type: Boolean, default: false },
  startTime: { type: Date },
  endTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Ensure only one active session at a time
voteSessionSchema.pre('save', async function(next) {
  if (this.isActive) {
    const activeSession = await this.constructor.findOne({ isActive: true, _id: { $ne: this._id } });
    if (activeSession) {
      throw new Error('Another voting session is already active');
    }
  }
  this.updatedAt = new Date();
  next();
});

const VoteSession = mongoose.model("VoteSession", voteSessionSchema);
module.exports = VoteSession; 