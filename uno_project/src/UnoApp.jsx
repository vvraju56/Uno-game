
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import io from "socket.io-client";

// ---------------------------
// UNO Game — Single-file React Component
// Default export at bottom: <UnoApp />
// Tailwind CSS is used for styling (no import needed here).
// Dependencies (install in your project):
//   npm i socket.io-client framer-motion lucide-react
//   (plus a Socket.IO server — example server code included at the bottom)
// Recommended project: Vite + React + Tailwind
// Deployment targets:
//   • Backend: Render.com, Fly.io, Railway, or similar
//   • Frontend: Vercel, Netlify, or similar
// Environment variables:
//   • Create a `.env.example` with: VITE_SERVER_URL=http://localhost:4000
//   • Copy to `.env.local` and set your deployed server URL
// ---------------------------

// Card model: { color: "red"|"green"|"blue"|"yellow"|"wild", value: string }
// value: 0-9, "skip", "reverse", "draw2", "wild", "wild4"

const COLORS = ["red", "yellow", "green", "blue"];

function createDeck() {
  const deck = [];
  // number cards
  for (const c of COLORS) {
    deck.push({ color: c, value: "0", id: `${c}-0` });
    for (let n = 1; n <= 9; n++) {
      deck.push({ color: c, value: `${n}`, id: `${c}-${n}-a` });
      deck.push({ color: c, value: `${n}`, id: `${c}-${n}-b` });
    }
    // action cards: skip, reverse, draw2 (two of each per color)
    for (let i = 0; i < 2; i++) {
      deck.push({ color: c, value: "skip", id: `${c}-skip-${i}` });
      deck.push({ color: c, value: "reverse", id: `${c}-rev-${i}` });
      deck.push({ color: c, value: "draw2", id: `${c}-d2-${i}` });
    }
  }
  // wilds
  for (let i = 0; i < 4; i++) deck.push({ color: "wild", value: "wild", id: `wild-${i}` });
  for (let i = 0; i < 4; i++) deck.push({ color: "wild", value: "wild4", id: `wild4-${i}` });
  return shuffle(deck);
}

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function canPlay(card, topCard, currentColor) {
  if (!card) return false;
  if (card.color === "wild") return true;
  if (card.color === currentColor) return true;
  if (card.value === topCard.value && topCard.value !== "wild" && topCard.value !== "wild4") return true;
  return false;
}

function CardView({ card, small }) {
  if (!card) return null;
  const isWild = card.color === "wild";

  return (
    <motion.div
      layout
      className={`rounded-xl shadow-md p-3 min-w-[80px] ${small ? "text-xs p-2 min-w-[60px]" : "text-sm"}`}
      style={{ background: isWild ? "linear-gradient(45deg,#333, #666)" : card.color }}
    >
      <div className="font-bold text-white">{isWild ? card.value.toUpperCase() : card.value}</div>
      {!isWild && <div className="mt-2 text-white/70 text-[11px]">{card.color.toUpperCase()}</div>}
    </motion.div>
  );
}

// ---------- Socket events:
// client -> server: create_room, join_room, start_game, play_card, draw_card, call_uno
// server -> client: room_update, game_state, your_id, error

const SERVER_DEFAULT = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export default function UnoApp({ serverUrl = SERVER_DEFAULT }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState([]);
  const [game, setGame] = useState(null); // holds full game state from server
  const [hand, setHand] = useState([]);
  const [myId, setMyId] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [selectedColor, setSelectedColor] = useState(null);
  const inputRoomRef = useRef(null);

  useEffect(() => {
    const s = io(serverUrl, { transports: ["websocket"] });
    setSocket(s);
    s.on("connect", () => {
      setConnected(true);
      setStatusMsg("Connected to server");
    });
    s.on("disconnect", () => {
      setConnected(false);
      setStatusMsg("Disconnected");
    });
    s.on("your_id", (id) => setMyId(id));

    s.on("room_update", (r) => {
      setPlayers(r.players || []);
      setRoomId(r.roomId || "");
    });

    s.on("game_state", (g) => {
      setGame(g);
      const me = g?.players?.find((p) => p.id === s.id);
      setHand(me?.hand || []);
    });

    s.on("error_message", (e) => {
      setStatusMsg(e);
    });

    return () => s.disconnect();
  }, [serverUrl]);

  function createRoom() {
    if (!playerName) {
      setStatusMsg("Pick a display name first.");
      return;
    }
    socket.emit("create_room", { name: playerName }, (resp) => {
      if (resp.error) setStatusMsg(resp.error);
      else setStatusMsg(`Room ${resp.roomId} created. Waiting for players...`);
    });
  }

  function joinRoom() {
    if (!playerName) {
      setStatusMsg("Pick a display name first.");
      return;
    }
    const id = inputRoomRef.current?.value || roomId;
    if (!id) {
      setStatusMsg("Enter a room id to join.");
      return;
    }
    socket.emit("join_room", { roomId: id, name: playerName }, (resp) => {
      if (resp.error) setStatusMsg(resp.error);
      else setStatusMsg(`Joined ${id}`);
    });
  }

  function startGame() {
    socket.emit("start_game", { roomId });
  }

  function playCard(card, chosenColor = null) {
    if (!game) return;
    if (!canPlay(card, game.discard[game.discard.length - 1], game.currentColor)) {
      setStatusMsg("You cannot play that card now.");
      return;
    }
    // for wilds: chosenColor must be provided
    socket.emit("play_card", { roomId, card, chosenColor });
  }

  function drawCard() {
    socket.emit("draw_card", { roomId });
  }

  function callUno() {
    socket.emit("call_uno", { roomId });
  }

  // UI helpers
  const myTurn = game && game.currentPlayerId === socket?.id;
  const topCard = game?.discard?.[game?.discard?.length - 1] || null;
  const currentColor = game?.currentColor || (topCard && topCard.color);

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold">UNO — Multiplayer</h1>
          <div className="text-sm text-slate-300">Status: {statusMsg || (connected ? "Ready" : "Connecting...")}</div>
        </header>

        <section className="grid grid-cols-3 gap-6">
          <div className="col-span-1 bg-slate-900 p-4 rounded-2xl shadow-lg">
            <h2 className="font-bold mb-2">Lobby</h2>
            <input className="w-full mb-2 p-2 rounded bg-slate-800" placeholder="Your name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
            <input ref={inputRoomRef} className="w-full mb-2 p-2 rounded bg-slate-800" placeholder="Room id (or create)" />
            <div className="flex gap-2 mb-2">
              <button className="px-3 py-2 rounded bg-indigo-600" onClick={createRoom}>Create</button>
              <button className="px-3 py-2 rounded bg-green-600" onClick={joinRoom}>Join</button>
            </div>
            <div className="mb-2">
              <strong>Room:</strong> {roomId || "—"}
            </div>
            <div className="mb-2">
              <strong>Players ({players.length}):</strong>
              <ul className="mt-2 space-y-1">
                {players.map((p) => (
                  <li key={p.id} className="flex justify-between">
                    <span>{p.name}{p.id === myId ? " (you)" : ""}</span>
                    <span className="text-xs text-slate-400">{p.ready ? "Ready" : "Waiting"}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <button className="w-full py-2 rounded bg-amber-500 text-black" onClick={startGame}>Start Game</button>
            </div>
          </div>

          <div className="col-span-1 flex flex-col items-center justify-center">
            <h2 className="font-bold mb-2">Table</h2>
            <div className="w-full p-4 bg-slate-900 rounded-2xl shadow-lg flex flex-col items-center">
              <div className="mb-3">Top:</div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="text-xs mb-1 text-slate-300">Discard</div>
                  <CardView card={topCard} />
                </div>
                <div>
                  <div className="text-xs mb-1 text-slate-300">Deck</div>
                  <div className="rounded-xl shadow-md p-3 min-w-[80px] bg-slate-700 text-sm">{game ? game.deckCount + " cards" : "—"}</div>
                </div>
              </div>

              <div className="mt-4 w-full">
                <div className="text-xs text-slate-400 mb-2">Current color: <span className="font-semibold">{currentColor || "—"}</span></div>
                <div className="flex gap-2 justify-center">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setSelectedColor(c)} className={`px-3 py-1 rounded ${selectedColor === c ? 'ring-4 ring-white/30' : ''}`} style={{ background: c }}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 bg-slate-900 p-4 rounded-2xl shadow-lg">
            <h2 className="font-bold mb-2">Controls</h2>
            <div className="flex gap-2 mb-2">
              <button className="px-3 py-2 rounded bg-sky-600" onClick={drawCard}>Draw</button>
              <button className="px-3 py-2 rounded bg-pink-600" onClick={callUno}>Call UNO</button>
            </div>

            <div className="mt-4">
              <div className="text-xs text-slate-400">Players' hands:</div>
              <ul className="mt-2 space-y-1">
                {game?.players?.map((p) => (
                  <li key={p.id} className="flex justify-between items-center">
                    <span>{p.name}{p.id === socket?.id ? " (you)" : ""}</span>
                    <span className="text-xs text-slate-300">{p.handCount} cards</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h3 className="text-xl font-semibold mb-3">Your Hand {myTurn ? " — Your Turn" : ""}</h3>
          <div className="flex gap-3 overflow-x-auto py-2">
            {hand.map((c, idx) => (
              <div key={c.id} onClick={() => {
                if (c.color === 'wild' && !selectedColor) {
                  setStatusMsg('Pick a color (buttons above) for wild card');
                  return;
                }
                playCard(c, c.color === 'wild' ? selectedColor : null);
              }}>
                <CardView card={c} />
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-8 text-sm text-slate-400">Tip: Play matching color or number/symbol. Wild changes color. Reverse/Skip/Draw2 have special effects. This demo uses a simple Socket.IO server — see the included server snippet in the code file.</footer>
      </div>
    </div>
  );
}

/* ---------------------------
  Example minimal server (Node.js + Express + Socket.IO)
  Save as server.js and run with: node server.js
  This is a compact implementation for demo rooms and basic UNO rules.
  For production: add validation, persistence, reconnection handling and security.

  npm i express socket.io

  Deployment:
  • Push this server to Render.com, Fly.io, Railway, or similar.
  • Set CORS origin to your frontend deployment URL (Vercel, Netlify, etc.).
  • Expose the port with process.env.PORT || 4000.
  • Add SERVER_URL to your frontend .env.local as VITE_SERVER_URL.

--------------------------- */
