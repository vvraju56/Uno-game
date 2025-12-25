
// Minimal Node.js + Socket.IO server for UNO demo.
// Save as server/server.js and run: node server/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const rooms = {}; // roomId -> { players: [{id,name,hand}], deck, discard, currentPlayerIndex, direction, currentColor }

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createDeck() {
  const COLORS = ['red','yellow','green','blue'];
  let deck = [];
  for (const c of COLORS) {
    deck.push({ color: c, value: '0', id: `${c}-0` });
    for (let n = 1; n <= 9; n++) {
      deck.push({ color: c, value: `${n}`, id: `${c}-${n}-a` });
      deck.push({ color: c, value: `${n}`, id: `${c}-${n}-b` });
    }
    for (let i = 0; i < 2; i++) {
      deck.push({ color: c, value: 'skip', id: `${c}-skip-${i}` });
      deck.push({ color: c, value: 'reverse', id: `${c}-rev-${i}` });
      deck.push({ color: c, value: 'draw2', id: `${c}-d2-${i}` });
    }
  }
  for (let i = 0; i < 4; i++) deck.push({ color: 'wild', value: 'wild', id: `wild-${i}` });
  for (let i = 0; i < 4; i++) deck.push({ color: 'wild', value: 'wild4', id: `wild4-${i}` });
  return shuffle(deck);
}

function initRoom(roomId) {
  const deck = createDeck();
  return { players: [], deck, discard: [], currentPlayerIndex: 0, direction: 1, currentColor: null };
}

function broadcastRoom(roomId) {
  const r = rooms[roomId];
  if (!r) return;
  const publicPlayers = r.players.map(p => ({ id: p.id, name: p.name, handCount: p.hand.length }));
  io.to(roomId).emit('room_update', { roomId, players: publicPlayers });
  io.to(roomId).emit('game_state', { ...r, players: publicPlayers, deckCount: r.deck.length, currentPlayerId: r.players[r.currentPlayerIndex]?.id });
}

function dealHands(r) {
  for (let i = 0; i < r.players.length; i++) {
    r.players[i].hand = r.deck.splice(0, 7);
  }
}

io.on('connection', (socket) => {
  socket.emit('your_id', socket.id);

  socket.on('create_room', ({ name }, cb) => {
    const roomId = Math.random().toString(36).slice(2,8).toUpperCase();
    rooms[roomId] = initRoom(roomId);
    rooms[roomId].players.push({ id: socket.id, name, hand: [] });
    socket.join(roomId);
    cb && cb({ roomId });
    broadcastRoom(roomId);
  });

  socket.on('join_room', ({ roomId, name }, cb) => {
    const r = rooms[roomId];
    if (!r) return cb && cb({ error: 'Room not found' });
    r.players.push({ id: socket.id, name, hand: [] });
    socket.join(roomId);
    cb && cb({ ok: true });
    broadcastRoom(roomId);
  });

  socket.on('start_game', ({ roomId }) => {
    const r = rooms[roomId];
    if (!r) return;
    r.deck = createDeck();
    dealHands(r);
    // put first non-wild on discard
    while (r.deck.length) {
      const c = r.deck.shift();
      r.discard.push(c);
      if (c.color !== 'wild') { r.currentColor = c.color; break; }
    }
    broadcastRoom(roomId);
  });

  socket.on('draw_card', ({ roomId }) => {
    const r = rooms[roomId];
    if (!r) return;
    const player = r.players.find(p => p.id === socket.id);
    if (!player) return;
    if (!r.deck.length) { r.deck = createDeck(); }
    const c = r.deck.shift();
    player.hand.push(c);
    broadcastRoom(roomId);
  });

  socket.on('play_card', ({ roomId, card, chosenColor }) => {
    const r = rooms[roomId];
    if (!r) return;
    const player = r.players.find(p => p.id === socket.id);
    if (!player) return;
    const idx = player.hand.findIndex(h => h.id === card.id);
    if (idx === -1) return;
    const played = player.hand.splice(idx,1)[0];
    r.discard.push(played);
    if (played.color === 'wild') {
      r.currentColor = chosenColor || 'red';
    } else {
      r.currentColor = played.color;
    }
    // handle basic effects (skip/reverse/draw2) — simplified for demo:
    if (played.value === 'reverse') r.direction *= -1;
    if (played.value === 'skip') r.currentPlayerIndex = (r.currentPlayerIndex + r.direction + r.players.length) % r.players.length;
    if (played.value === 'draw2') {
      const targetIdx = (r.currentPlayerIndex + r.direction + r.players.length) % r.players.length;
      const target = r.players[targetIdx];
      if (target) {
        for (let i = 0; i < 2; i++) {
          if (!r.deck.length) r.deck = createDeck();
          target.hand.push(r.deck.shift());
        }
      }
    }
    // advance turn
    r.currentPlayerIndex = (r.currentPlayerIndex + r.direction + r.players.length) % r.players.length;
    broadcastRoom(roomId);
  });

  socket.on('call_uno', ({ roomId }) => {
    io.to(roomId).emit('message', `${socket.id} called UNO!`);
  });

  socket.on('disconnect', () => {
    for (const rid of Object.keys(rooms)) {
      const room = rooms[rid];
      const i = room.players.findIndex(p => p.id === socket.id);
      if (i >= 0) {
        room.players.splice(i,1);
        broadcastRoom(rid);
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log('UNO server listening on', PORT));
