
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const UnoGame = require('./game-logic');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.static(__dirname));

const game = new UnoGame();
const rooms = new Map();

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', socket => {
  console.log('Player connected: ' + socket.id);

  socket.on('create_room', data => {
    const roomId = generateRoomId();
    const room = game.createRoom(roomId);
    rooms.set(roomId, room);
    
    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerName = data.name;
    
    game.addPlayer(room, { id: socket.id, name: data.name });
    
    socket.emit('room_created', { roomId, playerId: socket.id });
    io.to(roomId).emit('room_update', game.getGameState(room));
    
    console.log('Room ' + roomId + ' created by ' + data.name);
  });

  socket.on('join_room', data => {
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
    
    console.log(data.name + ' joined room ' + data.roomId + '. Total players: ' + room.players.length);
  });

  socket.on('start_game', () => {
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

    if (room.players[0].id !== socket.id) {
      socket.emit('error_message', 'Only host can start game');
      return;
    }

    game.startGame(room);
    
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
    
    console.log('Game started in room ' + roomId);
  });

  socket.on('play_card', data => {
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

    const result = game.playCard(room, socket.id, data.cardId, data.chosenColor, false, data.targetPlayerId, data.customRule);
    
    for (const player of room.players) {
      const playerSocket = io.sockets.sockets.get(player.id);
      if (playerSocket) {
        playerSocket.emit('hand_update', {
          hand: player.hand,
          gameState: result.gameState
        });
      }
    }
    
    io.to(roomId).emit('card_played', {
      playerId: socket.id,
      card: result.playedCard,
      chosenColor: result.chosenColor,
      gameState: result.gameState,
      effect: getCardEffect(result.playedCard),
      targetPlayerId: data.targetPlayerId
    });
    
    io.to(roomId).emit('turn_update', { 
      currentPlayerIndex: room.currentPlayerIndex,
      gameState: result.gameState
    });
    
    if (result.gameState.wild4ChallengeWindow) {
      io.to(roomId).emit('wild4_challenge_available', {
        challengeableBy: room.wild4ChallengableBy,
        playerId: socket.id
      });
    }
    
    console.log('Card played in room ' + roomId);
  });

  socket.on('draw_card', () => {
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

    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex !== room.currentPlayerIndex) {
      socket.emit('error_message', 'Not your turn');
      return;
    }

    const card = game.drawCard(room);
    const player = room.players[playerIndex];
    player.hand.push(card);
    player.handCount = player.hand.length;

    const topCard = room.discardPile[room.discardPile.length - 1];
    const canPlay = game.canPlayCard(card, topCard, room.currentColor);

    socket.emit('card_drawn', {
      card,
      hand: player.hand,
      canPlayDrawnCard: canPlay,
      gameState: game.getGameState(room)
    });

    if (!canPlay) {
      room.currentPlayerIndex = game.getNextPlayerIndex(room);
      io.to(roomId).emit('turn_update', {
        currentPlayerIndex: room.currentPlayerIndex,
        gameState: game.getGameState(room)
      });
    }

    console.log('Card drawn in room ' + roomId);
  });

  socket.on('call_uno', () => {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    try {
      game.callUno(room, socket.id);
      io.to(roomId).emit('uno_called', { playerId: socket.id });
    } catch (error) {
      socket.emit('error_message', error.message);
    }
  });

  socket.on('challenge_wild4', () => {
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

    try {
      const result = game.challengeWild4(room, socket.id);
      io.to(roomId).emit('wild4_challenge_result', result);
      io.to(roomId).emit('turn_update', {
        currentPlayerIndex: room.currentPlayerIndex,
        gameState: game.getGameState(room)
      });
      console.log('Wild Draw Four challenge in room ' + roomId);
    } catch (error) {
      socket.emit('error_message', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected: ' + socket.id);
    
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        game.removePlayer(room, socket.id);
        
        if (room.players.length === 0) {
          rooms.delete(socket.roomId);
          console.log('Room ' + socket.roomId + ' deleted (empty)');
        } else {
          io.to(socket.roomId).emit('room_update', game.getGameState(room));
        }
      }
    }
  });
});

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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('UNO server running on port ' + PORT);
  console.log('Visit http://localhost:' + PORT + ' to play');
});
