import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import React from "react";

export default function App() {
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const joinRoom = async () => {
    if (!roomCode || !playerName) {
      setMessage("Please enter both room code and player name");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("https://tech-tictac-back.onrender.com/api/rooms/join", {
        roomCode,
        playerId: playerName,
      });

      navigate(`/game/${roomCode}/${playerName}`);
    } catch (error) {
      setMessage(error.response?.data?.message || "Error joining room");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 relative overflow-hidden font-[Oxanium]">
      {/* Logo Image */}
      <div className="absolute top-4 left-4 z-10">
        <img 
          src="/img/itsa.png" 
          alt="Game Logo" 
          className="w-24 h-24 object-contain"
        />
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,#000000_25%,transparent_25%,transparent_50%,#000000_50%,#000000_75%,transparent_75%,transparent)] bg-[length:30px_30px] opacity-30"></div>
      
      {/* Glowing Orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl"></div>

      <div className="text-center mb-5 relative z-10 max-w mx-auto">
      <h1 className="text-5xl font-extrabold mb-4 pb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-blue-400 to-red-400 animate-pulse tracking-tight">
        Techgyanathon 2025: Mastermind Arena
        </h1>
        <h1 className="text-4xl font-extrabold mb-2 pb-1 text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-blue-400 to-red-400 animate-pulse tracking-tight">
        ❌ Tic-Tac-Toe: Knowledge Battle ⭕
        </h1>
        <div className="text-gray-100 space-y-2 max-w-2xl mx-auto">
          <p className="flex items-center gap-3 text-xl">
            <span className="text-red-400 text-2xl">🎯</span>
            Answer questions to earn your move on the battlefield
          </p>
          <p className="flex items-center gap-3 text-xl">
            <span className="text-blue-400 text-2xl">⚔️</span>
            Only the strongest will survive and claim victory
          </p>
        </div>
      </div>
      
      <div className="bg-black/90 backdrop-blur-md p-5 rounded-2xl shadow-2xl w-full max-w-xl border-2 border-red-500/40 relative z-10">
        <div className="space-y-8">
          <div>
            <label className="block text-xl font-semibold text-red-400 mb-3">Room Code</label>
            <input
              type="text"
              placeholder="Enter Room Code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="w-full p-4 rounded-xl bg-black/60 border-2 border-red-500/40 text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
            />
          </div>
          <div>
            <label className="block text-xl font-semibold text-blue-400 mb-3">Player Name</label>
            <input
              type="text"
              placeholder="Enter Player Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-4 rounded-xl bg-black/60 border-2 border-blue-500/40 text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            />
          </div>
          <button 
            onClick={joinRoom} 
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-400 hover:to-blue-400 px-4 py-4 rounded-xl font-bold text-2xl transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg relative overflow-hidden group"
          >
            <span className="relative z-10">
              {loading ? "⚡ Preparing Battle..." : "⚔️ Enter the Arena ⚔️"}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/30 to-blue-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          {message && (
            <p className="mt-6 text-center text-red-400 bg-red-500/10 p-4 rounded-xl border-2 border-red-500/30 text-lg">
              ⚠️ {message}
            </p>
          )}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-8 left-8 text-red-400/40 text-7xl">❌</div>
      <div className="absolute bottom-8 right-8 text-blue-400/40 text-7xl">⭕</div>

      {/* Copyright Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-gray-400 text-sm z-10">
        © 2025 Tic-Tac-Toe. Techgyanathon 2025, ITSA - Technical Team. All rights reserved. 
      </div>
    </div>
  );
}
