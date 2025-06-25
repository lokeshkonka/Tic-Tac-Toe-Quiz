import { useState, useEffect, useRef } from "react";
import axios from "axios";
import React from "react";
import { io } from "socket.io-client";
export default function AdminPage() {
  const [rooms, setRooms] = useState([]);
  const [message, setMessage] = useState("");
  const [adminAuth, setAdminAuth] = useState(localStorage.getItem("isAdmin") === "true");
  const [password, setPassword] = useState("");
  const socketRef = useRef(null);

  const fetchRooms = async () => {
    try {
      const response = await axios.get("https://tech-tictac-back.onrender.com/api/rooms");
      setRooms(response.data.rooms);
    } catch (error) {
      setMessage(error.response?.data?.message || "Error fetching  rooms");
    }
  };

  const createRoom = async () => {
    try {
      const response = await axios.post("https://tech-tictac-back.onrender.com/api/rooms/create", {
        adminKey: import.meta.env.VITE_ADMIN_KEY,
      });
      alert(`Room Created! Room Code: ${response.data.room.roomCode}`);
      fetchRooms();
    } catch (error) {
      setMessage(error.response?.data?.message || "Error creating room");
    }
  };

  const removePlayer = async (roomCode, player) => {
    try {
      await axios.delete("https://tech-tictac-back.onrender.com/api/rooms/remove-player", {
        data: { roomCode, playerId: player },
      });
      fetchRooms();
    } catch (error) {
      alert(error.response?.data?.message || "Error removing player");
    }
  };

  const deleteRoom = async (roomCode) => {
    try {
      await axios.delete("https://tech-tictac-back.onrender.com/api/rooms/delete", {
        data: { roomCode },
      });
      fetchRooms();
    } catch (error) {
      alert(error.response?.data?.message || "Error deleting room");
    }
  };

  const checkAdminPassword = () => {
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      localStorage.setItem("isAdmin", "true");
      setAdminAuth(true);
      fetchRooms();
    } else {
      alert("Incorrect Password!");
    }
  };

  const logout = () => {
    localStorage.removeItem("isAdmin");
    setAdminAuth(false);
  };

  const startGame = async (roomCode) => {
    try {
      // First update the room status in the database
      const response = await axios.post("https://tech-tictac-back.onrender.com/api/rooms/start-game", {
        roomCode
      });
      
      // Then emit the socket event to notify all clients
      // You'll need to initialize a socket connection in AdminPage
      if (!socketRef.current) {
        socketRef.current = io("https://tech-tictac-back.onrender.com");
      }
      
      socketRef.current.emit("startGame", { roomCode });
      
      fetchRooms();
      setMessage(`Game started in room ${roomCode}`);
    } catch (error) {
      alert(error.response?.data?.message || "Error starting game");
    }
  };

  useEffect(() => {
    if (adminAuth) {
      fetchRooms();
      
      // Initialize socket connection if not already done
      if (!socketRef.current) {
        socketRef.current = io("https://tech-tictac-back.onrender.com");
      }
      
      // Listen for game updates to refresh room data
      socketRef.current.on("gameUpdate", (gameData) => {
        if (gameData.winner) {
          // Refresh rooms when a game completes
          fetchRooms();
        }
      });
      
      // Clean up on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.off("gameUpdate");
        }
      };
    }
  }, [adminAuth]);

  return adminAuth ? (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 relative overflow-hidden font-[Oxanium]">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,#000000_25%,transparent_25%,transparent_50%,#000000_50%,#000000_75%,transparent_75%,transparent)] bg-[length:30px_30px] opacity-30"></div>
      
      {/* Glowing Orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl"></div>

      {/* Logo Image */}
      <div className="absolute top-4 left-4 z-10">
        <img 
          src="/img/itsa.png" 
          alt="Game Logo" 
          className="w-24 h-24 object-contain"
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <h1 className="text-3xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-blue-400 to-red-400 animate-pulse tracking-tight text-center">
          Admin Panel - Mastermind Arena
        </h1>

        <button 
          onClick={createRoom} 
          className="w-full bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-400 hover:to-blue-400 px-6 py-3 rounded-xl font-bold text-lg transition duration-300 transform hover:scale-105 shadow-lg relative overflow-hidden group mb-6"
        >
          <span className="relative z-10">Create New Arena</span>
          <div className="absolute inset-0 bg-gradient-to-r from-red-400/30 to-blue-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>

        <div className="bg-black/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl border-2 border-red-500/40">
          <h2 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-blue-400">Active Arenas</h2>
          {rooms.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No arenas available.</p>
          ) : (
            rooms.map((room) => (
              <div key={room.roomCode} className="bg-black/60 p-5 mb-4 rounded-xl border-2 border-blue-500/40">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-base text-red-400">Room Code: {room.roomCode}</p>
                  <span className={`px-3 py-1 rounded text-xs font-semibold ${
                    !room.status || room.status === "lobby" ? "bg-yellow-500/80" : 
                    room.status === "started" ? "bg-green-500/80" : "bg-red-500/80"
                  }`}>
                    {(room.status || "lobby").charAt(0).toUpperCase() + (room.status || "lobby").slice(1)}
                  </span>
                </div>

                {room.status === "completed" && room.gameState && room.gameState.winner && (
                  <div className="mt-2 p-3 bg-blue-900/30 rounded-lg border border-blue-500/30">
                    <h3 className="text-lg font-semibold text-blue-300">Game Result:</h3>
                    {room.gameState.winner === "draw" ? (
                      <p className="text-yellow-400 font-bold">The battle ended in a draw!</p>
                    ) : (
                      <div>
                        <p className="text-green-400 font-bold">
                          Winner: {room.gameState.winner === "X" ? room.players[0] : room.players[1]} ({room.gameState.winner})
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {room.gameState.moves?.length || 0} moves executed
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <h3 className="text-lg font-semibold mt-3 text-blue-400">Teams:</h3>
                {room.players.length === 0 ? (
                  <p className="text-gray-400 text-center py-2">No Teams yet.</p>
                ) : (
                  <ul className="space-y-2 mt-2">
                    {room.players.map((player, index) => (
                      <li key={player} className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-red-500/30">
                        <div>
                          <span className="text-white">{player}</span>
                          {room.status === "started" || room.status === "completed" ? (
                            <span className="ml-2 text-xs bg-gray-700/50 px-2 py-1 rounded">
                              {index === 0 ? "X" : "O"}
                            </span>
                          ) : null}
                          {room.status === "completed" && 
                           room.gameState?.winner && 
                           room.gameState.winner !== "draw" && 
                           ((index === 0 && room.gameState.winner === "X") || 
                            (index === 1 && room.gameState.winner === "O")) && (
                            <span className="ml-2 text-xs bg-green-700/50 px-2 py-1 rounded">
                              Winner
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removePlayer(room.roomCode, player)}
                          className="bg-red-500/80 hover:bg-red-600 px-3 py-1 rounded text-xs font-semibold transition duration-300"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex space-x-8 mt-4">
                  {room.status === "lobby" && room.players.length === 2 && (
                    <button
                      onClick={() => startGame(room.roomCode)}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 px-5 py-2 rounded-xl text-base font-semibold transition duration-300 transform hover:scale-105 flex-1 shadow-lg relative overflow-hidden group"
                    >
                      <span className="relative z-10">Begin Battle</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400/30 to-blue-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  )}
                  <button
                    onClick={() => deleteRoom(room.roomCode)}
                    className="bg-gradient-to-r from-red-500 to-purple-500 hover:from-red-400 hover:to-purple-400 px-5 py-2 mx-6 rounded-xl text-base font-semibold transition duration-300 transform hover:scale-105 flex-1 shadow-lg relative overflow-hidden group"
                  >
                    <span className="relative z-10">Delete Arena</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400/30 to-purple-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <button 
          onClick={logout} 
          className="w-full mt-6 bg-gradient-to-r from-red-500 to-purple-500 hover:from-red-400 hover:to-purple-400 px-6 py-3 rounded-xl font-bold text-lg transition duration-300 transform hover:scale-105 shadow-lg relative overflow-hidden group"
        >
          <span className="relative z-10">Logout</span>
          <div className="absolute inset-0 bg-gradient-to-r from-red-400/30 to-purple-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </div>

      {/* Copyright Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-gray-400 text-xs z-10">
        © 2025 Tic-Tac-Toe. Techgyanathon 2025, ITSA - Technical Team. All rights reserved.
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 relative overflow-hidden font-[Oxanium]">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,#000000_25%,transparent_25%,transparent_50%,#000000_50%,#000000_75%,transparent_75%,transparent)] bg-[length:30px_30px] opacity-30"></div>
      
      {/* Glowing Orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl"></div>

      {/* Logo Image */}
      <div className="absolute top-4 left-4 z-10">
        <img 
          src="/img/itsa.png" 
          alt="Game Logo" 
          className="w-24 h-24 object-contain"
        />
      </div>

      <div className="bg-black/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl border-2 border-red-500/40 relative z-10 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-blue-400 to-red-400 animate-pulse tracking-tight text-center">
          Admin Access
        </h1>
        <input
          type="password"
          placeholder="Enter Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-4 rounded-xl bg-black/60 border-2 border-blue-500/40 text-white text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 mb-6"
        />
        <button 
          onClick={checkAdminPassword} 
          className="w-full bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-400 hover:to-blue-400 px-6 py-3 rounded-xl font-bold text-lg transition duration-300 transform hover:scale-105 shadow-lg relative overflow-hidden group"
        >
          <span className="relative z-10">Access Control</span>
          <div className="absolute inset-0 bg-gradient-to-r from-red-400/30 to-blue-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </div>

      {/* Copyright Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-gray-400 text-xs z-10">
        © 2025 Tic-Tac-Toe. Techgyanathon 2025, ITSA - Technical Team. All rights reserved.
      </div>
    </div>
  );
}
