const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const UnoGame = require('./game-logic');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static(path.join(__dirname)));

const game = new UnoGame();
const rooms = new Map();

// Generate room ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Get card effect description
function getCardEffect(card) {
  const effects = {
    'skip': 'Next player skipped!',
    'reverse': 'Direction reversed!',
    'draw2': 'Next player draws 2 cards!',
    'wild': 'Color changed!',
    'wild4': 'Next player draws 4 cards!'
  };
  return effects[card.value] || null;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('create_room', (data) => {
    try {
      const roomId = generateRoomId();
      const room = game.createRoom(roomId);
      rooms.set(roomId, room);
      
      socket.join(roomId);
      socket.roomId = roomId;
      socket.playerName = data.name;
      
      game.addPlayer(room, { id: socket.id, name: data.name });
      
      socket.emit('room_created', { roomId, playerId: socket.id });
      io.to(roomId).emit('room_update', game.getGameState(room));
      
      console.log(`Room ${roomId} created by ${data.name}`);
    } catch (error) {
      socket.emit('error_message', error.message);
    }
  });

  socket.on('join_room', (data) => {
    try {
      const room = rooms.get(data.roomId);
      if (!room) {
        socket.emit('error_message', 'Room not found');
        return;
      }

      if (room.gameStarted) {
        socket.emit('error_message', 'Game already started');
        return;
      }

      socket.join(data.roomId);
      socket.roomId = data.roomId;
      socket.playerName = data.name;
      
      game.addPlayer(room, { id: socket.id, name: data.name });
      
      socket.emit('room_joined', { roomId: data.roomId, playerId: socket.id });
      io.to(data.roomId).emit('room_update', game.getGameState(room));
      io.to(data.roomId).emit('player_joined', { name: data.name });
      
      console.log(`${data.name} joined room ${data.roomId}. Total players: ${room.players.length}`);
    } catch (error) {
      socket.emit('error_message', error.message);
    }
  });

  socket.on('start_game', () => {
    try {
      const roomId = socket.roomId;
      if (!roomId) {
        socket.emit('error_message', 'Not in a room');
        return;
      }

      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error_message', 'Room not found');
        return;
      }

      // Check if player is host (first player)
      if (room.players[0].id !== socket.id) {
        socket.emit('error_message', 'Only host can start game');
        return;
      }

      game.startGame(room);
      
      // Send each player their hand
      for (const player of room.players) {
        const playerSocket = io.sockets.sockets.get(player.id);
        if (playerSocket) {
          playerSocket.emit('game_started', {
            hand: player.hand,
            gameState: game.getGameState(room)
          });
        }
      }
      
      io.to(roomId).emit('turn_update', { 
        currentPlayerIndex: room.currentPlayerIndex,
        gameState: game.getGameState(room)
      });
      
      console.log(`Game started in room ${roomId}`);
    } catch (error) {
      socket.emit('error_message', error.message);
    }
   });
   });

  socket.on('play_card', (data) => {
    try {
      const roomId = socket.roomId;
      if (!roomId) {
        socket.emit('error_message', 'Not in a room');
        return;
      }

      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error_message', 'Room not found');
        return;
      }

      const result = game.playCard(room, socket.id, data.cardId, data.chosenColor);
      
      // Send updated hands to all players
      for (const player of room.players) {
        const playerSocket = io.sockets.sockets.get(player.id);
        if (playerSocket) {
          playerSocket.emit('hand_update', {
            hand: player.hand,
            gameState: result.gameState
        });
      }
    } catch (error) {
      socket.emit('error_message', error.message);
    }
  });
      
      // Update turn
      io.to(roomId).emit('turn_update', {
        currentPlayerIndex: result.nextPlayerIndex,
        gameState: result.gameState
      });
      
      // Check for winner
      if (result.winner) {
        io.to(roomId).emit('game_over', {
          winner: result.winner,
          gameState: result.gameState
        });
      }
      
    } catch (error) {
      socket.emit('error_message', error.message);
    }
  });

  socket.on('draw_card', () => {
    try {
      const roomId = socket.roomId;
      if (!roomId) {
        socket.emit('error_message', 'Not in a room');
        return;
      }

      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error_message', 'Room not found');
        return;
      }

      // Verify it's the player's turn
      if (room.currentPlayerIndex !== room.players.findIndex(p => p.id === socket.id)) {
        socket.emit('error_message', 'Not your turn');
        return;
      }

      const drawnCard = game.drawCard(room);
      const player = room.players.find(p => p.id === socket.id);
      player.hand.push(drawnCard);
      player.handCount = player.hand.length;

      socket.emit('card_drawn', {
        card: drawnCard,
        hand: player.hand,
        gameState: game.getGameState(room)
      });

      // Check if the drawn card can be played
      const topCard = room.discardPile[room.discardPile.length - 1];
      const canPlay = game.canPlayCard(drawnCard, topCard, room.currentColor);
      
      if (canPlay) {
        socket.emit('can_play_drawn_card', true);
      } else {
        // End turn if cannot play
        room.currentPlayerIndex = game.getNextPlayerIndex(room);
        io.to(roomId).emit('turn_update', {
          currentPlayerIndex: room.currentPlayerIndex,
          gameState: game.getGameState(room)
        });
      }
      
    } catch (error) {
      socket.emit('error_message', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    try {
      const roomId = socket.roomId;
      if (!roomId) {
        return;
      }

      const room = rooms.get(roomId);
      if (!room) {
        return;
      }

      game.removePlayer(room, socket.id);

      if (room.players.length === 0) {
        rooms.delete(roomId);
      } else {
        io.to(roomId).emit('room_update', game.getGameState(room));
      }
    } catch (error) {
      console.error('Disconnect error:', error.message, error.stack);
      socket.emit('error_message', error.message);
    }
  });

});

  socket.on('challenge_uno', (data) => {
    try {
      const roomId = socket.roomId;
      if (!roomId) {
        socket.emit('error_message', 'Not in a room');
        return;
      }

      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error_message', 'Room not found');
        return;
      }

      const result = game.challengeUno(room, socket.id, data.targetId);
      
      io.to(roomId).emit('uno_challenge', {
        challengerId: socket.id,
        targetId: data.targetId,
        success: result.success,
        penaltyCards: result.penaltyCards,
        gameState: game.getGameState(room)
      });
      
    } catch (error) {
      socket.emit('error_message', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        game.removePlayer(room, socket.id);
        
        // Mark player as disconnected
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
          player.connected = false;
        }
        
        io.to(socket.roomId).emit('player_left', {
          playerId: socket.id,
          gameState: game.getGameState(room)
        });
        
        // Clean up empty rooms
        if (room.players.length === 0) {
          rooms.delete(socket.roomId);
          console.log(`Room ${socket.roomId} deleted (empty)`);
        }
      }
    }
   });


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`UNO server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to play`);
});