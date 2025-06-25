const express = require('express');
const router = express.Router();
const BlindCoding = require('../models/blindCoding');

// Generate a unique room code
const generateRoomCode = () => Math.random().toString(36).substr(2, 6).toUpperCase();

// Create a new blind coding session
router.post('/create', async (req, res) => {
  try {
    const { teams, createdBy } = req.body;
    
    if (!teams || teams.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one team is required' });
    }

    const roomCode = generateRoomCode();
    const session = new BlindCoding({
      roomCode,
      teams: teams.map(team => ({
        name: team.name,
        roomCode: generateRoomCode(), // Each team gets their own room code
        players: []
      })),
      createdBy
    });

    await session.save();
    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Join a team's room
router.post('/join-team', async (req, res) => {
  try {
    const { teamRoomCode, playerId, playerName } = req.body;
    
    const session = await BlindCoding.findOne({
      'teams.roomCode': teamRoomCode
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Team room not found' });
    }

    const team = session.teams.find(t => t.roomCode === teamRoomCode);
    
    if (team.players.some(p => p.id === playerId)) {
      return res.status(400).json({ success: false, message: 'Player already in this team' });
    }

    team.players.push({
      id: playerId,
      name: playerName,
      ready: false
    });

    await session.save();
    res.status(200).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Set player ready status
router.patch('/player-ready', async (req, res) => {
  try {
    const { teamRoomCode, playerId } = req.body;
    
    const session = await BlindCoding.findOne({
      'teams.roomCode': teamRoomCode
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Team room not found' });
    }

    const team = session.teams.find(t => t.roomCode === teamRoomCode);
    const player = team.players.find(p => p.id === playerId);

    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    player.ready = true;
    await session.save();

    // Check if all players are ready
    const allPlayersReady = session.teams.every(team => 
      team.players.every(player => player.ready)
    );

    res.status(200).json({ 
      success: true, 
      session,
      allPlayersReady
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start the game (only creator can start)
router.post('/start-game', async (req, res) => {
  try {
    const { roomCode, creatorId } = req.body;
    
    const session = await BlindCoding.findOne({ roomCode });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.createdBy !== creatorId) {
      return res.status(403).json({ success: false, message: 'Only the creator can start the game' });
    }

    // Check if all players are ready
    const allPlayersReady = session.teams.every(team => 
      team.players.every(player => player.ready)
    );

    if (!allPlayersReady) {
      return res.status(400).json({ success: false, message: 'All players must be ready before starting' });
    }

    session.status = 'in_progress';
    session.startedAt = new Date();
    await session.save();

    res.status(200).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// End the game (only creator can end)
router.post('/end-game', async (req, res) => {
  try {
    const { roomCode, creatorId } = req.body;
    
    const session = await BlindCoding.findOne({ roomCode });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.createdBy !== creatorId) {
      return res.status(403).json({ success: false, message: 'Only the creator can end the game' });
    }

    session.status = 'completed';
    session.endedAt = new Date();
    await session.save();

    res.status(200).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get session status
router.get('/:roomCode', async (req, res) => {
  try {
    const session = await BlindCoding.findOne({ roomCode: req.params.roomCode });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    res.status(200).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 