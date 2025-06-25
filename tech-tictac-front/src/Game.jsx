import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import React from "react";

// Sample questions for the quiz (keep these for reference)
const sampleQuestions = [
  {
    question: "What is the result of 2 + 2 * 3?",
    options: ["8", "10", "6", "12"],
    correctAnswer: "8"
  },
  {
    question: "Which method is used to add an element to the end of an array in JavaScript?",
    options: ["push()", "pop()", "shift()", "unshift()"],
    correctAnswer: "push()"
  },
  {
    question: "What does DOM stand for?",
    options: ["Document Object Model", "Data Object Model", "Document Oriented Model", "Digital Object Model"],
    correctAnswer: "Document Object Model"
  },
  {
    question: "Which operator is used for strict equality in JavaScript?",
    options: ["==", "===", "=", "!="],
    correctAnswer: "==="
  },
  {
    question: "What is the output of console.log(typeof [])?",
    options: ["array", "object", "undefined", "null"],
    correctAnswer: "object"
  }
];

export default function Game() {
  const { roomCode, playerName } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const socketRef = useRef(null);
  
  // Game state
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState("X");
  const [winner, setWinner] = useState(null);
  const [playerSymbol, setPlayerSymbol] = useState(null);
  
  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [canPlay, setCanPlay] = useState(false);
  const [activePlayer, setActivePlayer] = useState(null);
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  
  // Add a state for moves history
  const [moves, setMoves] = useState([]);

  useEffect(() => {
    // Redirect if no room code or player name
    if (!roomCode || !playerName) {
      navigate("/");
      return;
    }

    // Initialize socket connection
    socketRef.current = io("https://tech-tictac-back.onrender.com");
    
    // Join the room
    socketRef.current.emit("joinRoom", { roomCode, playerId: playerName });
    
    // Listen for game started event
    socketRef.current.on("gameStarted", (data) => {
      console.log("Game started event received:", data);
      // Refresh room data
      fetchRoomData();
    });
    
    // Listen for game updates
    socketRef.current.on("gameUpdate", (gameData) => {
      console.log("Game update received:", gameData);
      
      // Update moves history if provided
      if (gameData.moves) {
        setMoves(gameData.moves);
        
        // Reconstruct the board from moves to ensure consistency
        const reconstructedBoard = Array(9).fill(null);
        gameData.moves.forEach(move => {
          reconstructedBoard[move.index] = move.symbol;
        });
        setBoard(reconstructedBoard);
      } else {
        setBoard(gameData.board);
      }
      
      // Only update currentTurn if it's provided
      if (gameData.currentTurn) {
        setCurrentTurn(gameData.currentTurn);
      }
      
      // Only update winner if it's set - this prevents resetting it
      if (gameData.winner) {
        setWinner(gameData.winner);
      }
      
      // Reset quiz state when game updates
      setAnswerSubmitted(false);
      setWrongAnswers([]);
      
      // Don't reset active player here - it will be reset by the quizUpdate event
    });
    
    // Listen for quiz updates
    socketRef.current.on("quizUpdate", (quizData) => {
      console.log("Quiz update received:", quizData);
      
      // Always update these states
      setCurrentQuestion(quizData.question);
      setShowingAnswer(quizData.showingAnswer);
      setWrongAnswers(quizData.wrongAnswers || []);
      setTimeRemaining(quizData.timeRemaining);
      
      // Update active player and canPlay
      setActivePlayer(quizData.activePlayer);
      setCanPlay(quizData.activePlayer === playerName);
      
      // If a nextSymbol is provided, update currentTurn
      if (quizData.nextSymbol) {
        setCurrentTurn(quizData.nextSymbol);
      }
      
      // Reset answer submitted state when a new question arrives
      if (!quizData.showingAnswer && quizData.question && !quizData.activePlayer) {
        setAnswerSubmitted(false);
      }
    });
    
    // Listen for wrong answer notification
    socketRef.current.on("wrongAnswer", (data) => {
      console.log("Wrong answer notification:", data);
      setWrongAnswers(data.wrongAnswers);
    });
    
    // Listen for timer updates
    socketRef.current.on("timerUpdate", (data) => {
      console.log("Timer update:", data);
      setTimeRemaining(data.timeRemaining);
    });
    
    // Listen for player symbol assignment
    socketRef.current.on("symbolAssigned", (data) => {
      console.log("Symbol assigned:", data);
      if (data.playerId === playerName) {
        setPlayerSymbol(data.symbol);
      }
    });

    const fetchRoomData = async () => {
      try {
        const response = await axios.get(`https://tech-tictac-back.onrender.com/api/rooms/${roomCode}`);
        const roomData = response.data.room;
        setRoom(roomData);
        
        if (roomData.status === "started") {
          // Set board state from server
          if (roomData.gameState?.moves && roomData.gameState.moves.length > 0) {
            setMoves(roomData.gameState.moves);
            
            // Reconstruct the board from moves
            const reconstructedBoard = Array(9).fill(null);
            roomData.gameState.moves.forEach(move => {
              reconstructedBoard[move.index] = move.symbol;
            });
            setBoard(reconstructedBoard);
          } else {
            setBoard(roomData.gameState?.board || Array(9).fill(null));
          }
          
          setCurrentTurn(roomData.gameState?.currentTurn || "X");
          setWinner(roomData.gameState?.winner || null);
          
          // Determine player symbol based on player order
          if (roomData.players.length >= 2) {
            const isFirstPlayer = roomData.players[0] === playerName;
            setPlayerSymbol(isFirstPlayer ? "X" : "O");
          }
        }
        
        setLoading(false);
      } catch (error) {
        setError(error.response?.data?.message || "Error fetching room data");
        setLoading(false);
      }
    };

    fetchRoomData();

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leaveRoom", { roomCode, playerId: playerName });
        socketRef.current.disconnect();
      }
    };
  }, [roomCode, playerName, navigate]);

  const handleAnswerSelection = (selectedAnswer) => {
    // Prevent multiple submissions for the same question
    if (showingAnswer || activePlayer || answerSubmitted) return;
    
    console.log("Submitting answer:", selectedAnswer);
    setAnswerSubmitted(true);
    
    // Send answer to server
    socketRef.current.emit("submitAnswer", {
      roomCode,
      playerId: playerName,
      answer: selectedAnswer,
      question: currentQuestion
    });
  };

  const handleCellClick = (index) => {
    // Check if the cell is already filled or player can't play or winner exists
    if (board[index] || !canPlay || winner) {
      return;
    }
    
    console.log("Making move at index:", index);
    
    // Create a new board with the move
    const newBoard = [...board];
    newBoard[index] = playerSymbol;
    
    // Check for winner locally before sending to server
    const newWinner = calculateWinner(newBoard);
    
    // Send move to server
    socketRef.current.emit("makeMove", {
      roomCode,
      playerId: playerName,
      index,
      symbol: playerSymbol,
      winner: newWinner
    });
    
    // Reset quiz state locally
    setCanPlay(false);
    // Don't reset activePlayer here - it will be reset by the quizUpdate event
  };

  // Function to calculate winner (same as server-side)
  const calculateWinner = (board) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    
    // Check for winner
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    
    // Check for draw
    if (board.every(cell => cell !== null)) {
      return "draw";
    }
    
    return null;
  };

  const goToLobby = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 relative overflow-hidden font-[Oxanium]">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#000000_25%,transparent_25%,transparent_50%,#000000_50%,#000000_75%,transparent_75%,transparent)] bg-[length:30px_30px] opacity-30"></div>
        
        {/* Glowing Orbs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl"></div>

        <div className="relative z-10 text-center">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-blue-400 to-red-400 animate-pulse">
            Initializing Battle Arena...
          </h2>
        </div>

        {/* Copyright Footer */}
        <div className="absolute bottom-4 left-0 right-0 text-center text-gray-400 text-xs z-10">
          © 2025 Tic-Tac-Toe. Techgyanathon 2025, ITSA - Technical Team. All rights reserved.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-black text-white p-6 relative overflow-hidden font-[Oxanium]">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#000000_25%,transparent_25%,transparent_50%,#000000_50%,#000000_75%,transparent_75%,transparent)] bg-[length:30px_30px] opacity-30"></div>
        
        {/* Glowing Orbs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl"></div>

        <div className="relative z-10 text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-lg mb-6">{error}</p>
          <button 
            onClick={() => navigate("/")} 
            className="bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-400 hover:to-blue-400 px-6 py-3 rounded-xl font-bold text-lg transition duration-300 transform hover:scale-105 shadow-lg relative overflow-hidden group"
          >
            <span className="relative z-10">Return to Arena Selection</span>
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

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 relative overflow-hidden font-[Oxanium]">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#000000_25%,transparent_25%,transparent_50%,#000000_50%,#000000_75%,transparent_75%,transparent)] bg-[length:30px_30px] opacity-30"></div>
        
        {/* Glowing Orbs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl"></div>

        <div className="relative z-10 text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Arena Not Found</h2>
          <button 
            onClick={() => navigate("/")} 
            className="bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-400 hover:to-blue-400 px-6 py-3 rounded-xl font-bold text-lg transition duration-300 transform hover:scale-105 shadow-lg relative overflow-hidden group"
          >
            <span className="relative z-10">Return to Arena Selection</span>
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 relative overflow-hidden font-[Oxanium]">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,#000000_25%,transparent_25%,transparent_50%,#000000_50%,#000000_75%,transparent_75%,transparent)] bg-[length:30px_30px] opacity-30"></div>
      
      {/* Glowing Orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl"></div>

      <div className="relative z-10 w-full max-w-6xl">
        {/* Game Status */}
        <div className="bg-black/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border-2 border-red-500/40 mb-6">
          <div className="flex justify-between items-center">
            <div className="text-lg">
              <span className="text-red-400">Arena Code:</span>{" "}
              <span className="text-white">{roomCode}</span>
            </div>
            <div className="text-lg">
              <span className="text-blue-400">Team Name:</span>{" "}
              <span className="text-white">{playerName}</span>
              {/* {playerSymbol && (
                <span className="ml-2 text-xs bg-gray-700/50 px-2 py-1 rounded">
                  {playerSymbol}
                </span>
              )} */}
            </div>
          </div>
        </div>

        {room.status === "lobby" ? (
          <div className="bg-black/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl border-2 border-yellow-500/40 text-center">
            <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              Waiting for Host to Begin Battle
            </h2>
            <p className="text-lg mb-4">Teams in arena: {room.players.length}/2</p>
            <div className="flex flex-col space-y-3 mt-6">
              {room.players.map((player, index) => (
                <div key={player} className="bg-black/60 p-4 rounded-xl border-2 border-blue-500/40">
                  <span className="font-semibold text-lg">
                    Team {index + 1}: {player}
                  </span>
                  {player === playerName && (
                    <span className="ml-2 text-green-400 text-sm bg-green-500/20 px-2 py-1 rounded">
                      (You)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : room.status === "started" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column - Game Board */}
            <div className="bg-black/90 backdrop-blur-md p-3 rounded-2xl shadow-2xl border-2 border-red-500/40">
              <h2 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-blue-400 text-center">
                Battle Field
              </h2>
              
              {/* Player info */}
              <div className="flex justify-between mb-6">
                <div className={`p-3 rounded-xl border-2 ${
                  currentTurn === "X" 
                    ? "border-blue-500/60 bg-blue-500/20" 
                    : "border-gray-700/50 bg-black/40"
                }`}>
                  <p className="font-bold text-red-400">
                    Team X: {room.players[0]}
                    {room.players[0] === playerName && <span className="ml-2 text-green-400 text-sm">(You)</span>}
                  </p>
                  {/* {playerSymbol === "X" && <p className="text-yellow-400 text-sm">Your Symbol</p>} */}
                </div>
                <div className={`p-3 rounded-xl border-2 ${
                  currentTurn === "O" 
                    ? "border-blue-500/60 bg-blue-500/20" 
                    : "border-gray-700/50 bg-black/40"
                }`}>
                  <p className="font-bold text-blue-400">
                    Team O: {room.players[1]}
                    {room.players[1] === playerName && <span className="ml-2 text-green-400 text-sm">(You)</span>}
                  </p>
                  {/* {playerSymbol === "O" && <p className="text-yellow-400 text-sm">Your Symbol</p>} */}
                </div>
              </div>
              
              {/* Game board */}
              <div className="grid grid-cols-3 gap-3 mb-3 max-w-[280px] mx-auto">
                {board.map((cell, index) => (
                  <button
                    key={index}
                    onClick={() => handleCellClick(index)}
                    disabled={!canPlay || winner}
                    className={`aspect-square rounded-xl text-3xl font-bold transition-all duration-300 transform hover:scale-105 ${
                      cell
                        ? cell === "X"
                          ? "text-red-400"
                          : "text-blue-400"
                        : "text-white/50 hover:text-white"
                    } ${
                      !cell && canPlay && !winner
                        ? "bg-black/60 border-2 border-blue-500/40 hover:border-blue-400"
                        : "bg-black/40 border-2 border-gray-700/50"
                    }`}
                  >
                    {cell}
                  </button>
                ))}
              </div>

              {/* Game status */}
              <div className="text-center">
                {winner ? (
                  <p className="text-2xl font-bold text-white">
                    {winner === "draw"
                      ? "The battle ends in a draw!"
                      : winner === playerSymbol
                        ? "You Win! 🏆"
                        : "You Lose! ⚔️"}
                  </p>
                ) : (
                  <p className="text-lg">
                    {canPlay ? (
                      <span className="text-green-400">Your turn! Make a move.</span>
                    ) : activePlayer ? (
                      <span className="text-gray-400">Waiting for {activePlayer} to make a move...</span>
                    ) : (
                      <span className="text-yellow-400">Answer the question correctly to play!</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column - Quiz and Move History */}
            <div className="space-y-6">
              {/* Quiz Section */}
              {!winner && currentQuestion ? (
                <div className="bg-black/90 backdrop-blur-md p-3 rounded-2xl shadow-2xl border-2 border-blue-500/40">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-blue-400">
                      Battle Challenge
                    </h3>
                    {timeRemaining !== null && (
                      <div className="text-lg font-mono text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded-lg">
                        Time: {timeRemaining}s
                      </div>
                    )}
                  </div>
                  
                  <p className="text-lg mb-4">{currentQuestion.question}</p>
                  
                  {activePlayer ? (
                    <div className="text-center p-4 bg-blue-900/30 rounded-xl border border-blue-500/30">
                      <p className="text-lg font-semibold">
                        {activePlayer === playerName ? 
                          "You answered correctly! Make your move." : 
                          `${activePlayer} answered correctly and is making a move.`}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-5">
                      {currentQuestion.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelection(option)}
                          disabled={showingAnswer || activePlayer !== null || answerSubmitted || wrongAnswers.includes(playerName)}
                          className={`p-3 rounded-xl text-base font-semibold transition-all duration-300 transform hover:scale-105 ${
                            showingAnswer
                              ? option === currentQuestion.correctAnswer
                                ? "bg-green-500/80"
                                : wrongAnswers.includes(option)
                                ? "bg-red-500/80"
                                : "bg-gray-700/50"
                              : "bg-black/60 border-2 border-blue-500/40 hover:border-blue-400"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {showingAnswer && (
                    <p className="mt-4 text-center text-yellow-400">
                      Correct answer: {currentQuestion.correctAnswer}
                    </p>
                  )}
                  
                  {answerSubmitted && !showingAnswer && !activePlayer && !wrongAnswers.includes(playerName) && (
                    <p className="mt-4 text-center text-blue-400">
                      Answer submitted, waiting for result...
                    </p>
                  )}
                  
                  {wrongAnswers.includes(playerName) && !showingAnswer && !activePlayer && (
                    <p className="mt-4 text-center text-red-400">
                      Your answer was incorrect. Waiting for opponent...
                    </p>
                  )}
                  
                  {wrongAnswers.length > 0 && !wrongAnswers.includes(playerName) && !showingAnswer && !activePlayer && !answerSubmitted && (
                    <p className="mt-4 text-center text-yellow-400">
                      Opponent answered incorrectly. Your turn to answer!
                    </p>
                  )}
                </div>
              ) : !winner && (
                <div className="bg-black/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl border-2 border-blue-500/40 text-center">
                  <p className="text-lg">Waiting for next challenge...</p>
                </div>
              )}

              {/* Move History */}
              {moves.length > 0 && (
                <div className="bg-black/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl border-2 border-red-500/40">
                  <h3 className="text-lg font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-blue-400 text-center">
                    Battle History
                  </h3>
                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-auto">
                    {moves.map((move, idx) => {
                      const isPlayerMove = move.player === playerName;
                      return (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-xl border-2 ${
                            isPlayerMove 
                              ? "border-blue-500/40 bg-blue-500/20" 
                              : "border-gray-700/50 bg-black/40"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${
                              isPlayerMove ? 'text-blue-400' : 'text-gray-400'
                            }`}>
                              {move.symbol}
                            </span>
                            <span className="truncate">
                              {isPlayerMove ? 'You' : move.player}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>Position {move.index + 1}</span>
                            <span>{new Date(move.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-black/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl border-2 border-red-500/40 text-center">
            <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text">
              Battle Completed
            </h2>
            <p className="text-xl mb-6 text-white">
              {winner === "draw" 
                ? "The battle ended in a draw!" 
                : winner === playerSymbol 
                  ? "You Win! 🏆" 
                  : "You Lose! ⚔️"}
            </p>
          </div>
        )}

        {/* Back to Lobby Button - Only show when game is over */}
        {winner && (
          <button
            onClick={goToLobby}
            className="w-full my-6 bg-gradient-to-r from-red-500 to-purple-500 hover:from-red-400 hover:to-purple-400 px-6 py-3 rounded-xl font-bold text-lg transition duration-300 transform hover:scale-105 shadow-lg relative overflow-hidden group"
          >
            <span className="relative z-10">Return to Arena Selection</span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/30 to-purple-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        )}
      </div>

      {/* Copyright Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-gray-400 text-xs z-10">
        © 2025 Tic-Tac-Toe. Techgyanathon 2025, ITSA - Technical Team. All rights reserved.
      </div>
    </div>
  );
} 