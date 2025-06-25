const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config();

// Import Room model
const Room = require("./models/room");

// Import Routes
const roomRoutes = require("./routes/roomRoutes");
const voteRoutes = require("./routes/voteRoutes");
const blindCodingRoutes = require("./routes/blindCodingRoutes");

// Sample questions for the quiz
const sampleQuestions = [
  {
    question: "If a player has two tokens in the home stretch, one outside, and rolls a 6, what should they do? (LUDO)",
    options: ["Move the home stretch token", "Bring out a new token", "Capture an opponent’s piece", "Roll again before moving"],
    correctAnswer: "Bring out a new token"
  },
  {
    question: "What happens if a player lands on their own token? (LUDO)",
    options: ["Both tokens move together", "The turn is skipped", "One token is sent back to start", "Nothing happens"],
    correctAnswer: "Both tokens move together"
  },
  {
    question: "What is the probability of rolling a six in Ludo? (LUDO)",
    options: ["1/2", "1/3", "1/6", "1/4"],
    correctAnswer: "1/6"
  },
  {
    question: "If you own all properties of a color but don’t build houses, what happens? (MONOPOLY)",
    options: ["Rent stays the same", "Rent doubles", "You lose a property", "You get an extra turn"],
    correctAnswer: "Rent doubles"
  },
  {
    question: "What happens if you pocket the striker but also pocket a coin? (CARROM)",
    options: ["You get a free turn", "You lose both pieces", "The coin stays, but you get a penalty", "The opponent wins"],
    correctAnswer: "The coin stays, but you get a penalty"
  },
  {
    question: "What is the advantage of sacrificing a piece in chess? (CHESS)",
    options: ["To create space", "To set up a checkmate", "To confuse the opponent", "All of the above"],
    correctAnswer: "All of the above"
  },
  {
    question: "If you land in jail, when is it best to stay? (MONOPOLY)",
    options: ["Early in the game", "When you have hotels", "When you own railroads", "Always"],
    correctAnswer: "When you have hotels"
  },
  {
    question: "If all properties are owned and you are low on money, what should you do? (MONOPOLY)",
    options: ["Hope for good dice rolls", "Offer unfair trades", "Try to mortgage wisely", "Declare bankruptcy"],
    correctAnswer: "Try to mortgage wisely"
  },
  {
    question: "If a player has only one card left, what should you do? (UNO)",
    options: ["Play a Draw 4", "Change the color", "Skip their turn", "All of the above"],
    correctAnswer: "All of the above"
  },
  {
    question: "What is the best first move in chess? (CHESS)",
    options: ["Moving a knight", "Moving a central pawn", "Moving a bishop", "Castling early"],
    correctAnswer: "Moving a central pawn"
  },
  {
    question: "How many points is a queen worth in chess? (CHESS)",
    options: ["3", "5", "9", "10"],
    correctAnswer: "9"
  },
  {
    question: "In UNO, what should you say before placing your last card?",
    options: ["Last Card!", "UNO!", "Skip!", "Draw 4!"],
    correctAnswer: "UNO!"
  },
  {
    question: "If you roll doubles three times in a row in Monopoly, what happens?",
    options: ["You get an extra turn", "You pay a fine", "You go to jail", "You roll again"],
    correctAnswer: "You go to jail"
  },
  {
    question: "What is the strongest piece in chess?",
    options: ["King", "Queen", "Rook", "Bishop"],
    correctAnswer: "Queen"
  },
  {
    question: "What does 'Checkmate' mean in chess?",
    options: ["The game is paused", "The king is trapped", "A player loses a piece", "It's a tie"],
    correctAnswer: "The king is trapped"
  },
  {
    question: "What is the penalty for missing an opponent’s turn in Carrom?",
    options: ["Lose a turn", "Lose a coin", "Lose the game", "No penalty"],
    correctAnswer: "Lose a coin"
  },
  {
    question: "What happens if you buy a property in Monopoly but don’t build houses?",
    options: ["Rent remains the same", "Rent doubles", "You must sell it", "You lose a turn"],
    correctAnswer: "Rent remains the same"
  },
  {
    question: "What is the minimum number of moves to checkmate in chess?",
    options: ["4", "2", "6", "10"],
    correctAnswer: "2"
  },
  {
    question: "If a pawn reaches the other side of the board, what happens?",
    options: ["It is removed", "It becomes a queen", "It becomes a knight", "It goes back to start"],
    correctAnswer: "It becomes a queen"
  },
  {
    question: "Which card allows you to change color in UNO?",
    options: ["Reverse", "Draw Two", "Wild", "Skip"],
    correctAnswer: "Wild"
  },
  {
    question: "What is the main goal in Monopoly?",
    options: ["Own all properties", "Have the most cash", "Bankrupt opponents", "Reach a certain score"],
    correctAnswer: "Bankrupt opponents"
  },
  {
    question: "What is the purpose of castling in chess?",
    options: ["Attack", "Protect the king", "Swap pieces", "Gain a turn"],
    correctAnswer: "Protect the king"
  },
  {
    question: "Which board game uses two dice and properties?",
    options: ["Ludo", "Monopoly", "Chess", "Carrom"],
    correctAnswer: "Monopoly"
  },
  {
    question: "Which piece moves in an L shape in chess?",
    options: ["Rook", "Bishop", "Knight", "Queen"],
    correctAnswer: "Knight"
  },
  {
    question: "What happens when all players but one are bankrupt in Monopoly?",
    options: ["The game resets", "The last player wins", "Everyone continues", "The game is a draw"],
    correctAnswer: "The last player wins"
  },
  {
    question: "What happens if you land on Free Parking in Monopoly?",
    options: ["Collect money", "Do nothing", "Go to jail", "Take another turn"],
    correctAnswer: "Do nothing"
  },
  {
    question: "Which game uses the term 'blitz'?",
    options: ["Monopoly", "Chess", "UNO", "Ludo"],
    correctAnswer: "Chess"
  },
  {
    question: "How many spaces are there on a Monopoly board?",
    options: ["30", "36", "40", "50"],
    correctAnswer: "40"
  },
  {
    question: "Which of these is not a chess opening?",
    options: ["King's Gambit", "Queen’s Indian", "Ludo Attack", "Sicilian Defense"],
    correctAnswer: "Ludo Attack"
  }
];

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/rooms", roomRoutes);
app.use("/api", voteRoutes);
app.use("/api/blind-coding", blindCodingRoutes);

// Sample API Route
app.get("/", (req, res) => {
  res.send("Tic-Tac-Toe Backend is Running!");
});

// Keep track of active timers by room
const roomTimers = new Map();
// Keep track of wrong answers by room
const roomWrongAnswers = new Map();

// WebSocket Connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Player joins a room
  socket.on("joinRoom", ({ roomCode, playerId }) => {
    socket.join(roomCode);
    console.log(`${playerId} joined room ${roomCode}`);

    // Notify all clients in the room
    io.to(roomCode).emit("playerUpdate", { message: `${playerId} joined`, playerId });
  });

  // Player leaves a room
  socket.on("leaveRoom", ({ roomCode, playerId }) => {
    socket.leave(roomCode);
    console.log(`${playerId} left room ${roomCode}`);

    // Notify all clients in the room
    io.to(roomCode).emit("playerUpdate", { message: `${playerId} left`, playerId });
  });

  // Handle start game event from admin
  socket.on("startGame", async ({ roomCode }) => {
    try {
      console.log(`Starting game in room ${roomCode}`);
      const room = await Room.findOne({ roomCode });
      
      if (!room) {
        console.log(`Room ${roomCode} not found`);
        return;
      }
      
      if (room.players.length !== 2) {
        console.log(`Room ${roomCode} doesn't have 2 players`);
        return;
      }
      
      // Clear any existing timers for this room
      clearRoomTimers(roomCode);
      
      // Reset wrong answers for this room
      roomWrongAnswers.set(roomCode, []);
      
      // Update room status
      room.status = "started";
      
      // Initialize game state if it doesn't exist
      if (!room.gameState) {
        room.gameState = {
          board: Array(9).fill(null),
          currentTurn: null,
          winner: null
        };
      }
      
      await room.save();
      
      console.log(`Game started in room ${roomCode}`);
      
      // Notify all clients that the game has started
      io.to(roomCode).emit("gameStarted", {
        players: room.players,
        gameState: room.gameState
      });
      
      // Assign symbols to players
      io.to(roomCode).emit("symbolAssigned", { playerId: room.players[0], symbol: "X" });
      io.to(roomCode).emit("symbolAssigned", { playerId: room.players[1], symbol: "O" });
      
      // Send first question after a short delay
      const startDelay = setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * sampleQuestions.length);
        io.to(roomCode).emit("quizUpdate", {
          question: sampleQuestions[randomIndex],
          showingAnswer: false,
          activePlayer: null,
          timeRemaining: 5,
          wrongAnswers: []
        });
        
        startQuestionTimer(roomCode, sampleQuestions[randomIndex]);
      }, 1000);
      
      // Store the timer
      if (!roomTimers.has(roomCode)) {
        roomTimers.set(roomCode, []);
      }
      roomTimers.get(roomCode).push(startDelay);
      
    } catch (error) {
      console.error("Error starting game:", error);
    }
  });
  
  // Function to clear all timers for a room
  function clearRoomTimers(roomCode) {
    if (roomTimers.has(roomCode)) {
      const timers = roomTimers.get(roomCode);
      timers.forEach(timer => {
        if (timer.intervalId) {
          clearInterval(timer.intervalId);
        } else if (typeof timer === 'number') {
          clearTimeout(timer);
        }
      });
      roomTimers.set(roomCode, []);
    }
  }

  // Function to start a question timer
  function startQuestionTimer(roomCode, question) {
    // Clear any existing timers for this room
    clearRoomTimers(roomCode);
    
    let timeRemaining = 5;
    
    // Send initial time
    io.to(roomCode).emit("timerUpdate", { timeRemaining });
    
    const timerInterval = setInterval(() => {
      timeRemaining--;
      
      if (timeRemaining > 0) {
        io.to(roomCode).emit("timerUpdate", { timeRemaining });
      } else {
        clearInterval(timerInterval);
        
        // Show answer when time is up
        io.to(roomCode).emit("quizUpdate", {
          question: question,
          showingAnswer: true,
          activePlayer: null,
          timeRemaining: 0,
          wrongAnswers: roomWrongAnswers.get(roomCode) || []
        });
        
        // Send a new question after showing the answer
        const nextQuestionTimer = setTimeout(() => {
          // Reset wrong answers for the next question
          roomWrongAnswers.set(roomCode, []);
          
          const nextIndex = Math.floor(Math.random() * sampleQuestions.length);
          io.to(roomCode).emit("quizUpdate", {
            question: sampleQuestions[nextIndex],
            showingAnswer: false,
            activePlayer: null,
            timeRemaining: 5,
            wrongAnswers: []
          });
          
          // Start a new timer for the next question
          startQuestionTimer(roomCode, sampleQuestions[nextIndex]);
        }, 2000);
        
        // Store the timer
        if (!roomTimers.has(roomCode)) {
          roomTimers.set(roomCode, []);
        }
        roomTimers.get(roomCode).push(nextQuestionTimer);
      }
    }, 1000);
    
    // Store the interval
    if (!roomTimers.has(roomCode)) {
      roomTimers.set(roomCode, []);
    }
    roomTimers.get(roomCode).push({ intervalId: timerInterval });
  }

  // Handle quiz answers
  socket.on("submitAnswer", async ({ roomCode, playerId, answer, question }) => {
    console.log(`Player ${playerId} submitted answer: ${answer}`);
    
    try {
      const room = await Room.findOne({ roomCode });
      if (!room) return;
      
      // Get player's symbol
      const playerIndex = room.players.indexOf(playerId);
      if (playerIndex === -1) return;
      
      const playerSymbol = playerIndex === 0 ? "X" : "O";
      
      // Check if the answer is correct
      if (answer === question.correctAnswer) {
        console.log(`Player ${playerId} answered correctly!`);
        
        // Clear any existing timers for this room
        clearRoomTimers(roomCode);
        
        // Reset wrong answers for this room
        roomWrongAnswers.set(roomCode, []);
        
        // Notify all clients that this player answered correctly and can play
        io.to(roomCode).emit("quizUpdate", {
          question: question,  // Keep the question visible
          showingAnswer: false,
          activePlayer: playerId,
          timeRemaining: 0,
          wrongAnswers: [],
          nextSymbol: playerSymbol // Send the player's symbol to use for the next move
        });
        
        // Update the current turn in the room
        room.gameState.currentTurn = playerSymbol;
        await room.save();
        
        // Send an update with the current player's turn
        io.to(roomCode).emit("gameUpdate", {
          board: room.gameState.board,
          currentTurn: playerSymbol, // Set the current turn to this player's symbol
          winner: room.gameState.winner,
          moves: room.gameState.moves
        });
      } else {
        console.log(`Player ${playerId} answered incorrectly!`);
        
        // Add player to wrong answers list
        if (!roomWrongAnswers.has(roomCode)) {
          roomWrongAnswers.set(roomCode, []);
        }
        
        const wrongAnswers = roomWrongAnswers.get(roomCode);
        if (!wrongAnswers.includes(playerId)) {
          wrongAnswers.push(playerId);
          roomWrongAnswers.set(roomCode, wrongAnswers);
        }
        
        // Get the room to check player count
        try {
          const room = await Room.findOne({ roomCode });
          
          // If all players have answered incorrectly, show the answer and move to next question
          if (room && room.players.length === wrongAnswers.length) {
            // Clear any existing timers for this room
            clearRoomTimers(roomCode);
            
            // Show answer when all players answered incorrectly
            io.to(roomCode).emit("quizUpdate", {
              question: question,
              showingAnswer: true,
              activePlayer: null,
              timeRemaining: 0,
              wrongAnswers: wrongAnswers
            });
            
            // Send a new question after showing the answer
            const nextQuestionTimer = setTimeout(() => {
              // Reset wrong answers for the next question
              roomWrongAnswers.set(roomCode, []);
              
              const nextIndex = Math.floor(Math.random() * sampleQuestions.length);
              io.to(roomCode).emit("quizUpdate", {
                question: sampleQuestions[nextIndex],
                showingAnswer: false,
                activePlayer: null,
                timeRemaining: 5,
                wrongAnswers: []
              });
              
              // Start a new timer for the next question
              startQuestionTimer(roomCode, sampleQuestions[nextIndex]);
            }, 2000);
            
            // Store the timer
            if (!roomTimers.has(roomCode)) {
              roomTimers.set(roomCode, []);
            }
            roomTimers.get(roomCode).push(nextQuestionTimer);
          } else {
            // Notify all clients about the wrong answer
            io.to(roomCode).emit("wrongAnswer", {
              wrongAnswers: wrongAnswers
            });
          }
        } catch (error) {
          console.error("Error processing wrong answer:", error);
        }
      }
    } catch (error) {
      console.error("Error processing answer:", error);
    }
  });

  // Handle game moves
  socket.on("makeMove", async ({ roomCode, playerId, index, symbol, winner }) => {
    try {
      console.log(`Player ${playerId} made move at index ${index} with symbol ${symbol}`);
      
      const room = await Room.findOne({ roomCode });
      if (!room) return;
      
      // Initialize game state if it doesn't exist
      if (!room.gameState) {
        room.gameState = {
          board: Array(9).fill(null),
          currentTurn: null, // Remove strict turn tracking
          winner: null,
          moves: []
        };
      }
      
      // Add this move to the moves array
      room.gameState.moves = room.gameState.moves || [];
      room.gameState.moves.push({
        player: playerId,
        symbol: symbol,
        index: index,
        timestamp: new Date()
      });
      
      // Reconstruct the board from all moves to ensure consistency
      const newBoard = Array(9).fill(null);
      room.gameState.moves.forEach(move => {
        newBoard[move.index] = move.symbol;
      });
      
      // Check for winner
      const gameWinner = winner || calculateWinner(newBoard);
      
      // Update the game state
      room.gameState.board = newBoard;
      // Don't update currentTurn based on symbol - we'll determine who plays next by quiz answers
      room.gameState.winner = gameWinner;
      
      if (gameWinner) {
        room.status = "completed";
        
        // Clear any existing timers for this room
        clearRoomTimers(roomCode);
      }
      
      await room.save();
      
      // Broadcast the updated game state
      io.to(roomCode).emit("gameUpdate", {
        board: newBoard,
        currentTurn: null, // Don't specify a next turn
        winner: room.gameState.winner,
        moves: room.gameState.moves
      });
      
      // If game continues, send a new question
      if (!gameWinner) {
        // Clear any existing timers for this room
        clearRoomTimers(roomCode);
        
        // Reset wrong answers for the next question
        roomWrongAnswers.set(roomCode, []);
        
        // Select a random question
        const randomIndex = Math.floor(Math.random() * sampleQuestions.length);
        const newQuestion = sampleQuestions[randomIndex];
        
        // Important: Add a small delay before sending the new question
        // This ensures the game state update is processed first
        setTimeout(() => {
          // Send the new question to all players
          io.to(roomCode).emit("quizUpdate", {
            question: newQuestion,
            showingAnswer: false,
            activePlayer: null,  // Reset active player to null
            timeRemaining: 5,
            wrongAnswers: []
          });
          
          // Start a new timer for the next question
          startQuestionTimer(roomCode, newQuestion);
        }, 500);
      } else {
        // Game is over, send a final update without a question
        io.to(roomCode).emit("quizUpdate", {
          question: null,
          showingAnswer: false,
          activePlayer: null,
          timeRemaining: null,
          wrongAnswers: []
        });
      }
    } catch (error) {
      console.error("Error processing move:", error);
    }
  });

  // Helper function to calculate winner
  function calculateWinner(board) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    
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
  }

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Connection Error:", err));

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
