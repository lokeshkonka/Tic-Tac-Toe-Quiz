const mongoose = require('mongoose');

const blindCodingSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true
  },
  teams: [{
    name: String,
    roomCode: String,
    players: [{
      id: String,
      name: String,
      ready: {
        type: Boolean,
        default: false
      }
    }]
  }],
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'completed'],
    default: 'waiting'
  },
  createdBy: {
    type: String,
    required: true
  },
  startedAt: Date,
  endedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BlindCoding', blindCodingSchema); 