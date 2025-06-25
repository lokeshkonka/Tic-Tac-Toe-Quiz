const express = require('express');
const router = express.Router();
const VoteSession = require('../models/voteSession');
const Vote = require('../models/vote');

// Get  vote sessions
router.get('/vote-sessions', async (req, res) => {
  try {
    const sessions = await VoteSession.find().sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get active vote session
router.get('/vote-sessions/active', async (req, res) => {
  try {
    const session = await VoteSession.findOne({ isActive: true });
    if (!session) {
      return res.status(404).json({ message: 'No active voting session found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new vote session
router.post('/vote-sessions', async (req, res) => {
  try {
    const { title, description, teams } = req.body;
    
    // Validate teams data
    if (!teams || teams.length !== 2) {
      return res.status(400).json({ message: 'Exactly two teams are required' });
    }

    const sessionData = {
      title,
      description,
      teams: teams.map(team => ({
        name: team.name,
        voteCount: 0,
        candidates: team.candidates.map(candidate => ({
          name: candidate.name
        }))
      }))
    };

    const session = new VoteSession(sessionData);
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Start a vote session
router.patch('/vote-sessions/:id/start', async (req, res) => {
  try {
    const session = await VoteSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    session.isActive = true;
    session.startTime = new Date();
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// End a vote session
router.patch('/vote-sessions/:id/end', async (req, res) => {
  try {
    const session = await VoteSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    session.isActive = false;
    session.endTime = new Date();
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Cast a vote
router.post('/votes', async (req, res) => {
  try {
    const { sessionId, teamId } = req.body;

    const session = await VoteSession.findById(sessionId);
    if (!session || !session.isActive) {
      return res.status(400).json({ message: 'No active voting session found' });
    }

    // Validate team exists
    const team = session.teams.id(teamId);
    if (!team) {
      return res.status(400).json({ message: 'Team not found' });
    }

    // Get the real IP address from various possible headers
    const voterIp = req.headers['x-forwarded-for']?.split(',')[0] || 
                    req.headers['x-real-ip'] || 
                    req.connection.remoteAddress;
    
    // Check if user has already voted in this session
    const existingVote = await Vote.findOne({
      sessionId,
      voterIp
    });

    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted in this session' });
    }

    // Create vote record
    const vote = new Vote({
      sessionId,
      teamId,
      voterIp
    });
    await vote.save();

    // Update vote count atomically
    await VoteSession.findOneAndUpdate(
      { _id: sessionId, 'teams._id': teamId },
      { $inc: { 'teams.$.voteCount': 1 } },
      { new: true }
    );

    res.status(201).json({ message: 'Vote recorded successfully' });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 
