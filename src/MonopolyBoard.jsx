import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import confetti from "canvas-confetti";
import PropertyCardModal from "./PropertyCardModal";
import "./MonopolyBoard.css";
import "./PropertyCardModal.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
let socket;

const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "roll") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === "buy") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    console.log("Audio Error", e);
  }
};

const star = (cx, cy, r, rot = -90) => {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const a = ((rot + i * 36) * Math.PI) / 180;
    const rr = i % 2 ? r * 0.382 : r;
    p.push((cx + rr * Math.cos(a)).toFixed(1) + "," + (cy + rr * Math.sin(a)).toFixed(1));
  }
  return <polygon points={p.join(" ")} key={`${cx}-${cy}`} />;
};

const fsvg = (inner) => (
  <svg viewBox="0 0 60 60" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    {inner}
  </svg>
);

const FLAGS = {
  BR: fsvg(
    <>
      <rect width="60" height="60" fill="#009c3b" />
      <path d="M30 7 55 30 30 53 5 30z" fill="#ffdf00" />
      <circle cx="30" cy="30" r="12.5" fill="#002776" />
      <path d="M18 32.5c8-4.5 18-4 25 .5" stroke="#fff" strokeWidth="2.6" fill="none" />
    </>
  ),
  IL: fsvg(
    <>
      <rect width="60" height="60" fill="#fff" />
      <rect y="9" width="60" height="7" fill="#0038b8" />
      <rect y="44" width="60" height="7" fill="#0038b8" />
      <g fill="none" stroke="#0038b8" strokeWidth="2.6">
        <path d="M30 18 40.4 36H19.6z" />
        <path d="M30 42 19.6 24H40.4z" />
      </g>
    </>
  ),
  IT: fsvg(
    <>
      <rect width="20" height="60" fill="#009246" />
      <rect x="20" width="20" height="60" fill="#f1f2f1" />
      <rect x="40" width="20" height="60" fill="#ce2b37" />
    </>
  ),
  DE: fsvg(
    <>
      <rect width="60" height="20" fill="#111" />
      <rect y="20" width="60" height="20" fill="#dd0000" />
      <rect y="40" width="60" height="20" fill="#ffce00" />
    </>
  ),
  FR: fsvg(
    <>
      <rect width="20" height="60" fill="#0055a4" />
      <rect x="20" width="20" height="60" fill="#fff" />
      <rect x="40" width="20" height="60" fill="#ef4135" />
    </>
  ),
  CN: fsvg(
    <>
      <rect width="60" height="60" fill="#de2910" />
      <g fill="#ffde00">
        {star(17, 19, 11)}
        {star(35, 8, 3.6, -70)}
        {star(42, 16, 3.6, -45)}
        {star(42, 26, 3.6, -30)}
        {star(35, 33, 3.6, -85)}
      </g>
    </>
  ),
  GB: fsvg(
    <>
      <rect width="60" height="60" fill="#012169" />
      <path d="M0 0 60 60M60 0 0 60" stroke="#fff" strokeWidth="12" />
      <path d="M0 0 60 60M60 0 0 60" stroke="#c8102e" strokeWidth="4" />
      <path d="M30 0v60M0 30h60" stroke="#fff" strokeWidth="20" />
      <path d="M30 0v60M0 30h60" stroke="#c8102e" strokeWidth="12" />
    </>
  ),
  US: fsvg(
    <>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} y={(i * 60) / 7} width="60" height={60 / 7 + 0.2} fill={i % 2 ? "#fff" : "#b22234"} />
      ))}
      <rect width="29" height="34.3" fill="#3c3b6e" />
      <g fill="#fff">
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3].map((c) => (
            <circle key={`${r}-${c}`} cx={4.5 + c * 7.2} cy={5 + r * 8.6} r="1.4" />
          ))
        )}
      </g>
    </>
  )
};

const PLANE = "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z";
const ART = {
  airport: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="21" fill="rgba(120,190,255,.14)" stroke="rgba(160,210,255,.55)" strokeWidth="1.6" />
      <g transform="translate(6 6) scale(1.5)">
        <g transform="rotate(45 12 12)" fill="#e2f2ff">
          <path d={PLANE} />
        </g>
      </g>
    </svg>
  ),
  power: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="21" fill="rgba(255,210,63,.14)" stroke="rgba(255,210,63,.6)" strokeWidth="1.6" />
      <path transform="translate(8 8) scale(1.33)" d="M13 2 4 14h6l-1 8 9-12h-6z" fill="#ffd23f" />
    </svg>
  ),
  water: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="21" fill="rgba(79,209,255,.14)" stroke="rgba(79,209,255,.6)" strokeWidth="1.6" />
      <path transform="translate(8 8) scale(1.33)" d="M12 2.5c3.6 4.5 6.2 7.7 6.2 11.1a6.2 6.2 0 0 1-12.4 0c0-3.4 2.6-6.6 6.2-11.1z" fill="#4fd1ff" />
    </svg>
  ),
  tax: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="21" fill="#b79bff" stroke="#6f4fd8" strokeWidth="2.4" />
      <text x="24" y="31" textAnchor="middle" fontSize="21" fill="#2a1763" style={{ fontFamily: "Bungee, Impact, sans-serif" }}>%</text>
    </svg>
  ),
  treasure: (
    <svg viewBox="0 0 64 56" aria-hidden="true">
      <rect x="6" y="24" width="52" height="26" rx="4" fill="#c46a0a" />
      <rect x="26" y="25" width="12" height="15" rx="2.5" fill="#ffe08a" stroke="#7a3d05" strokeWidth="2" />
    </svg>
  ),
  surprise: (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="27" fill="#d1308f" stroke="#ffd0ee" strokeWidth="2" />
      <path d="M23 26a9 9 0 1 1 13.5 7.8c-3 1.8-4.5 3.4-4.5 7" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="50" r="3.7" fill="#fff" />
    </svg>
  ),
  trade: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <g fill="none" stroke="#9fd8ff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 17h28l-7-7M39 31H11l7 7" />
      </g>
    </svg>
  ),
  bank: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="19" fill="#f6c744" stroke="#a8780f" strokeWidth="3" />
      <text x="24" y="31.5" textAnchor="middle" fontSize="20" fill="#6b4a05" style={{ fontFamily: "Bungee, Impact, sans-serif" }}>$</text>
    </svg>
  )
};

const GROUPS = {
  BR: { name: "Brazil", color: "#34d27b" },
  IL: { name: "Israel", color: "#4ea5ff" },
  IT: { name: "Italy", color: "#ff6b81" },
  DE: { name: "Germany", color: "#ffd23f" },
  CN: { name: "China", color: "#ff8a3d" },
  FR: { name: "France", color: "#b57cff" },
  GB: { name: "United Kingdom", color: "#ff7ccf" },
  US: { name: "United States", color: "#35e0d2" }
};

const DEFAULT_BOARD = [
  { id: 0, name: "Start", type: "start" },
  { id: 1, name: "Salvador", countryCode: "BR", price: 60, type: "prop", rent: [2, 10, 30, 90, 160, 250], houseCost: 50 },
  { id: 2, name: "Treasure", type: "treasure" },
  { id: 3, name: "Rio", countryCode: "BR", price: 70, type: "prop", rent: [4, 20, 60, 180, 320, 450], houseCost: 50 },
  { id: 4, name: "Earnings Tax", price: 200, type: "tax", amount: "10%" },
  { id: 5, name: "TLV Airport", countryCode: "IL", price: 200, type: "airport" },
  { id: 6, name: "Tel Aviv", countryCode: "IL", price: 90, type: "prop", rent: [6, 30, 90, 270, 400, 550], houseCost: 50 },
  { id: 7, name: "Haifa", countryCode: "IL", price: 100, type: "prop", rent: [6, 30, 90, 270, 400, 550], houseCost: 50 },
  { id: 8, name: "Surprise", type: "surprise" },
  { id: 9, name: "Jerusalem", countryCode: "IL", price: 110, type: "prop", rent: [8, 40, 100, 300, 450, 600], houseCost: 50 },
  { id: 10, name: "Prison", type: "jail" },
  { id: 11, name: "Venice", countryCode: "IT", price: 130, type: "prop", rent: [10, 50, 150, 450, 625, 750], houseCost: 100 },
  { id: 12, name: "Power Company", price: 150, type: "utility", u: "power" },
  { id: 13, name: "Milan", countryCode: "IT", price: 140, type: "prop", rent: [10, 50, 150, 450, 625, 750], houseCost: 100 },
  { id: 14, name: "Rome", countryCode: "IT", price: 160, type: "prop", rent: [12, 60, 180, 500, 700, 900], houseCost: 100 },
  { id: 15, name: "MUC Airport", countryCode: "DE", price: 200, type: "airport" },
  { id: 16, name: "Frankfurt", countryCode: "DE", price: 170, type: "prop", rent: [14, 70, 200, 550, 750, 950], houseCost: 100 },
  { id: 17, name: "Treasure", type: "treasure" },
  { id: 18, name: "Munich", countryCode: "DE", price: 190, type: "prop", rent: [14, 70, 200, 550, 750, 950], houseCost: 100 },
  { id: 19, name: "Berlin", countryCode: "DE", price: 200, type: "prop", rent: [16, 80, 220, 600, 800, 1000], houseCost: 100 },
  { id: 20, name: "Vacation", type: "vacation" },
  { id: 21, name: "Shenzhen", countryCode: "CN", price: 210, type: "prop", rent: [18, 90, 250, 700, 875, 1050], houseCost: 150 },
  { id: 22, name: "Surprise", type: "surprise" },
  { id: 23, name: "Beijing", countryCode: "CN", price: 230, type: "prop", rent: [18, 90, 250, 700, 875, 1050], houseCost: 150 },
  { id: 24, name: "Shanghai", countryCode: "CN", price: 250, type: "prop", rent: [20, 100, 300, 750, 925, 1100], houseCost: 150 },
  { id: 25, name: "CDG Airport", countryCode: "FR", price: 200, type: "airport" },
  { id: 26, name: "Lyon", countryCode: "FR", price: 260, type: "prop", rent: [22, 110, 330, 800, 975, 1150], houseCost: 150 },
  { id: 27, name: "Water Company", price: 150, type: "utility", u: "water" },
  { id: 28, name: "Toulouse", countryCode: "FR", price: 270, type: "prop", rent: [22, 110, 330, 800, 975, 1150], houseCost: 150 },
  { id: 29, name: "Paris", countryCode: "FR", price: 290, type: "prop", rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150 },
  { id: 30, name: "Go to prison", type: "gotojail" },
  { id: 31, name: "Liverpool", countryCode: "GB", price: 310, type: "prop", rent: [22, 110, 330, 800, 975, 1150], houseCost: 150 },
  { id: 32, name: "Manchester", countryCode: "GB", price: 320, type: "prop", rent: [22, 110, 330, 800, 975, 1150], houseCost: 150 },
  { id: 33, name: "Treasure", type: "treasure" },
  { id: 34, name: "London", countryCode: "GB", price: 340, type: "prop", rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150 },
  { id: 35, name: "JFK Airport", countryCode: "US", price: 200, type: "airport" },
  { id: 36, name: "Surprise", type: "surprise" },
  { id: 37, name: "San Francisco", countryCode: "US", price: 360, type: "prop", rent: [35, 180, 550, 1150, 1350, 1525], houseCost: 200 },
  { id: 38, name: "Premium Tax", price: 75, type: "tax", amount: "$75" },
  { id: 39, name: "New York", countryCode: "US", price: 400, type: "prop", rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200 }
];

const posOf = (i) => {
  if (i === 0) return { corner: 1, r: 0, c: 0 };
  if (i < 10) return { side: "top", r: 0, c: i };
  if (i === 10) return { corner: 1, r: 0, c: 10 };
  if (i < 20) return { side: "right", r: i - 10, c: 10 };
  if (i === 20) return { corner: 1, r: 10, c: 10 };
  if (i < 30) return { side: "bottom", r: 10, c: 10 - (i - 20) };
  if (i === 30) return { corner: 1, r: 10, c: 0 };
  return { side: "left", r: 10 - (i - 30), c: 0 };
};

const PIPS = {
  1: [5],
  2: [3, 7],
  3: [3, 5, 7],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9]
};

const renderCubeFace = (cls, v) => (
  <div className={`face ${cls}`} key={cls}>
    {PIPS[v].map((n) => (
      <i key={n} style={{ gridArea: `${Math.ceil(n / 3)} / ${((n - 1) % 3) + 1}` }} />
    ))}
  </div>
);

const R = {
  1: [0, 0],
  6: [0, 180],
  2: [0, -90],
  5: [0, 90],
  3: [-90, 0],
  4: [90, 0]
};

const getArtForTile = (tile) => {
  const name = tile.name?.toLowerCase() || "";
  const type = tile.type?.toLowerCase() || "";

  if (type === "railroad" || name.includes("airport")) return ART.airport;
  if (type === "utility" || name.includes("water")) return ART.water;
  if (name.includes("power") || name.includes("electric")) return ART.power;
  if (type === "tax" || name.includes("tax")) return ART.tax;
  if (type === "chest" || name.includes("treasure")) return ART.treasure;
  if (type === "chance" || name.includes("surprise")) return ART.surprise;
  return null;
};

export default function MonopolyBoard() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("qb4kw");
  const [joined, setJoined] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [selectedTileIndex, setSelectedTileIndex] = useState(null);
  const [modalProperty, setModalProperty] = useState(null);
  const [spinA, setSpinA] = useState([0, 0]);
  const [spinB, setSpinB] = useState([0, 0]);
  const [isRolling, setIsRolling] = useState(false);
  const [bidAmount, setBidAmount] = useState("");

  useEffect(() => {
    socket = io(BACKEND_URL);

    socket.on("ROOM_UPDATE", ({ players }) => setLobbyPlayers(players || []));
    socket.on("GAME_STATE_UPDATE", (updatedState) => {
      setGameState(updatedState);
      setIsRolling(false);
    });

    socket.on("ERROR", (errMsg) => alert(errMsg));

    return () => socket.disconnect();
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (playerName.trim() && roomCode.trim()) {
      socket.emit("JOIN_GAME", { roomCode, playerName });
      setJoined(true);
    }
  };

  const handleStartGame = () => socket.emit("START_GAME", { roomCode });

  const handleRollDice = () => {
    setIsRolling(true);
    playSound("roll");
    setSpinA([spinA[0] + 720, spinA[1] + 720]);
    setSpinB([spinB[0] + 720, spinB[1] + 720]);
    socket.emit("ACTION_ROLL", { roomCode });
  };

  const handleBuyProperty = () => {
    playSound("buy");
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    socket.emit("ACTION_BUY", { roomCode });
  };

  const handleDeclineProperty = () => socket.emit("ACTION_DECLINE", { roomCode });
  const handleEndTurn = () => socket.emit("ACTION_END_TURN", { roomCode });

  const handlePlaceBid = (e) => {
    e.preventDefault();
    if (bidAmount) {
      socket.emit("ACTION_BID", { roomCode, amount: Number(bidAmount) });
      setBidAmount("");
    }
  };
  const handlePassBid = () => socket.emit("ACTION_PASS_BID", { roomCode });

  const handleBuildHouse = (tileId) => {
    socket.emit("ACTION_BUILD_HOUSE", { roomCode, tileId });
  };

  const handleMortgage = (tileId) => {
    const prop = gameState?.properties?.[tileId];
    if (prop?.isMortgaged) {
      socket.emit("ACTION_UNMORTGAGE", { roomCode, tileId });
    } else {
      socket.emit("ACTION_MORTGAGE", { roomCode, tileId });
    }
  };

  const openTradeModal = () => {
    const playerProp = (gameState?.board || DEFAULT_BOARD).find(
      (t) => gameState?.properties?.[t.id]?.ownerId === socket?.id
    );

    if (!playerProp) {
      alert("You don't own any properties to trade yet!");
      return;
    }

    setModalProperty({
      ...playerProp,
      ownerId: socket?.id,
      ownerName: playerName,
      houses: gameState?.properties?.[playerProp.id]?.houses || 0,
      isMortgaged: gameState?.properties?.[playerProp.id]?.isMortgaged || false
    });
  };

  const openPropertyModal = (tile) => {
    const propData = gameState?.properties?.[tile.id];
    const owner = gameState?.players?.find((p) => p.id === propData?.ownerId);

    setModalProperty({
      ...tile,
      ownerId: propData?.ownerId,
      ownerName: owner?.name,
      ownerColor: owner?.color,
      houses: propData?.houses || 0,
      isMortgaged: propData?.isMortgaged || false
    });
  };

  if (!joined) {
    return (
      <div className="lobby-container">
        <h2>Grand Tour Monopoly</h2>
        <form onSubmit={handleJoin}>
          <input
            type="text"
            placeholder="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            required
          />
          <button type="submit">Join Game</button>
        </form>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="lobby-container">
        <h2>Room Code: {roomCode}</h2>
        <h3>Joined Players ({lobbyPlayers.length}):</h3>
        <ul>
          {lobbyPlayers.map((p, idx) => (
            <li key={p.id || idx}>{p.name}</li>
          ))}
        </ul>
        <button onClick={handleStartGame}>Start Game</button>
      </div>
    );
  }

  const board = gameState?.board || DEFAULT_BOARD;
  const players = gameState?.players || [];
  const properties = gameState?.properties || {};
  const logs = gameState?.log || [];
  const turnPhase = gameState?.turnPhase;

  const currentTurnPlayer = players[gameState?.turnIndex] || players[0] || {};
  const isMyTurn = currentTurnPlayer.id === socket?.id;

  const diceA = gameState?.currentDice?.[0] || 4;
  const diceB = gameState?.currentDice?.[1] || 3;

  const selectedTile = selectedTileIndex !== null ? board[selectedTileIndex] : null;
  const selectedPropData = selectedTile ? properties[selectedTile.id] : null;

  return (
    <div className="layout">
      <main style={{ minWidth: 0 }}>
        <div className="stage">
          <div className="frame">
            <div className="board">
              <div className="inner">
                {/* Board Grid */}
                <div className="grid">
                  {board.map((tile, i) => {
                    const pos = posOf(i);
                    const propData = properties[tile.id];
                    const owner = players.find((p) => p.id === propData?.ownerId);

                    let groupColor = "#7d8bb5";
                    if (tile.countryCode && GROUPS[tile.countryCode]) {
                      groupColor = GROUPS[tile.countryCode].color;
                    }

                    const isSelected = selectedTileIndex === i;
                    const tileTypeLower = (tile.type || "").toLowerCase();
                    const nameLower = (tile.name || "").toLowerCase();
                    const isCorner = i === 0 || i === 10 || i === 20 || i === 30 || tileTypeLower === "corner";

                    return (
                      <div
                        key={i}
                        className={`c ${isCorner ? "corner-cell" : "s-" + pos.side} ${isSelected ? "sel" : ""}`}
                        style={{ gridRow: pos.r + 1, gridColumn: pos.c + 1 }}
                        onClick={() => {
                          setSelectedTileIndex(i);
                          openPropertyModal(tile);
                        }}
                      >
                        {isCorner ? (
                          <div className={`t corner ${tileTypeLower}`}>
                            {i === 0 && (
                              <>
                                <div className="cn-title">START</div>
                                <svg className="chev" viewBox="0 0 40 32">
                                  <path d="M3 3l14 13L3 29zM21 3l14 13-14 13z" fill="#b4f23c" />
                                </svg>
                                <div className="cn-sub">Collect $200</div>
                              </>
                            )}
                            {i === 10 && (
                              <>
                                <div className="j-top">Just visiting</div>
                                <div className="j-label">In Prison</div>
                              </>
                            )}
                            {i === 20 && <div className="cn-title">Vacation</div>}
                            {i === 30 && <div className="cn-title">Go to prison</div>}
                          </div>
                        ) : (
                          <div
                            className={`t k-${tileTypeLower} ${owner ? "own" : ""}`}
                            style={{ "--g": owner ? owner.color : groupColor }}
                          >
                            <div className="band">
                              {owner ? (
                                <span className="dot">{owner.name[0]}</span>
                              ) : (
                                `$${tile.price || tile.amount || ""}`
                              )}
                            </div>
                            <div className="body">
                              <div className="name">{tile.name}</div>
                              <div className="art">{getArtForTile(tile)}</div>
                              {tile.countryCode && FLAGS[tile.countryCode] && (
                                <div className="flag">{FLAGS[tile.countryCode]}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Center Deck Arena */}
                <div className="center">
                  <div className="deck" style={{ left: "4cqw", top: "5cqh", "--r": "-8deg" }}>
                    <i></i><i></i><div>{ART.surprise}</div><span>Surprise</span>
                  </div>
                  <div className="deck" style={{ left: "84cqw", top: "5cqh", "--r": "7deg" }}>
                    <i></i><i></i><div>{ART.treasure}</div><span>Treasure</span>
                  </div>
                  
                  {/* Interactive Trade Deck */}
                  <div
                    className="deck"
                    style={{ left: "4cqw", top: "70cqh", "--r": "6deg", cursor: "pointer" }}
                    onClick={openTradeModal}
                    title="Click to Open Trade Menu"
                  >
                    <i></i><i></i><div>{ART.trade}</div><span>Trade</span>
                  </div>

                  <div className="deck" style={{ left: "84cqw", top: "70cqh", "--r": "-7deg" }}>
                    <i></i><i></i><div>{ART.bank}</div><span>Bank</span>
                  </div>

                  <div className="halo"></div>
                  <div className="ring">
                    <div className="ring-in">
                      {/* 3D Dice */}
                      <div className={`die-slot a ${isRolling ? "rolling" : ""}`}>
                        <div className="tilt">
                          <div
                            className="cube"
                            style={{
                              transform: `rotateX(${spinA[0] + R[diceA][0]}deg) rotateY(${spinA[1] + R[diceA][1]}deg)`
                            }}
                          >
                            {renderCubeFace("fF", 1)}
                            {renderCubeFace("fB", 6)}
                            {renderCubeFace("fR", 2)}
                            {renderCubeFace("fL", 5)}
                            {renderCubeFace("fT", 3)}
                            {renderCubeFace("fU", 4)}
                          </div>
                        </div>
                      </div>

                      <div className={`die-slot b ${isRolling ? "rolling" : ""}`}>
                        <div className="tilt">
                          <div
                            className="cube"
                            style={{
                              transform: `rotateX(${spinB[0] + R[diceB][0]}deg) rotateY(${spinB[1] + R[diceB][1]}deg)`
                            }}
                          >
                            {renderCubeFace("fF", 1)}
                            {renderCubeFace("fB", 6)}
                            {renderCubeFace("fR", 2)}
                            {renderCubeFace("fL", 5)}
                            {renderCubeFace("fT", 3)}
                            {renderCubeFace("fU", 4)}
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Turn Action Overlay */}
                      {isMyTurn && (
                        <div style={{ position: "absolute", bottom: "10%", left: "50%", transform: "translateX(-50%)", zIndex: 50, display: "flex", gap: "6px" }}>
                          {turnPhase === "AWAITING_ROLL" && (
                            <button className="roll" type="button" onClick={handleRollDice}>
                              {currentTurnPlayer.inJail ? "Roll Doubles 🎲" : "Roll the dice"}
                            </button>
                          )}

                          {turnPhase === "ACTION_REQUIRED" && (
                            <>
                              <button className="roll" style={{ background: "#10b981", width: "auto", padding: "0 12px" }} onClick={handleBuyProperty}>
                                Buy 🏠
                              </button>
                              <button className="roll" style={{ background: "#ef4444", width: "auto", padding: "0 12px" }} onClick={handleDeclineProperty}>
                                Auction 🔨
                              </button>
                            </>
                          )}

                          {turnPhase === "AWAITING_END_TURN" && (
                            <button className="roll" onClick={handleEndTurn}>
                              End Turn ⌛
                            </button>
                          )}
                        </div>
                      )}

                      {!isMyTurn && (
                        <div className="roll" style={{ opacity: 0.6, cursor: "not-allowed" }}>
                          Waiting for {currentTurnPlayer.name}...
                        </div>
                      )}
                    </div>
                  </div>

                  {turnPhase === "AUCTION" && gameState?.auction && (
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "#181433", padding: "12px", borderRadius: "10px", border: "1px solid var(--gold)", zIndex: 60, textAlign: "center" }}>
                      <p>Auction Bid: ${gameState.auction.currentBid || 0}</p>
                      <form onSubmit={handlePlaceBid} style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
                        <input type="number" placeholder="Bid" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} style={{ width: "70px", padding: "4px" }} />
                        <button type="submit" style={{ padding: "4px 8px" }}>Bid</button>
                        <button type="button" onClick={handlePassBid} style={{ padding: "4px 8px" }}>Pass</button>
                      </form>
                    </div>
                  )}

                  <div className="turn">
                    <span>
                      <b style={{ color: "#fff" }}>{currentTurnPlayer.name}</b> is playing…
                    </span>
                  </div>

                  <ol className="log">
                    {logs.slice(-4).map((l, idx) => (
                      <li key={idx}>{typeof l === "string" ? l : JSON.stringify(l)}</li>
                    ))}
                  </ol>
                </div>

                {/* Player Tokens */}
                <div className="tokens">
                  {players.map((p) => {
                    const pos = posOf(p.position);
                    return (
                      <div
                        key={p.id}
                        className={`tok ${p.id === currentTurnPlayer.id ? "on" : ""}`}
                        style={{
                          left: `${(pos.c / 10) * 85 + 7.5}%`,
                          top: `${(pos.r / 10) * 85 + 7.5}%`
                        }}
                      >
                        <span className="blob" style={{ "--c": p.color || "#ff6b9d" }}>
                          <i></i><i></i>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar Inspector (Tapping any tile shows its card) */}
      <aside>
        {selectedTile ? (
          <section className="card">
            <h2>Tile Inspector</h2>
            <div className="ihead">
              <div className="bigflag">
                {selectedTile.countryCode && FLAGS[selectedTile.countryCode] ? (
                  FLAGS[selectedTile.countryCode]
                ) : (
                  getArtForTile(selectedTile) || null
                )}
              </div>
              <div>
                <h3>{selectedTile.name}</h3>
                <p>{selectedTile.countryCode ? GROUPS[selectedTile.countryCode]?.name : "Special Tile"}</p>
              </div>
            </div>

            <dl className="rows">
              {selectedTile.price && (
                <>
                  <dt>Price</dt>
                  <dd>${selectedTile.price}</dd>
                </>
              )}
              {selectedPropData?.ownerId && (
                <>
                  <dt>Owner</dt>
                  <dd>{players.find((p) => p.id === selectedPropData.ownerId)?.name}</dd>
                </>
              )}
              {selectedTile.rent && (
                <>
                  <dt>Base Rent</dt>
                  <dd>${selectedTile.rent[0]}</dd>
                </>
              )}
            </dl>
          </section>
        ) : (
          <section className="card">
            <h2>Tile Inspector</h2>
            <p className="note" style={{ textAlign: "center", padding: "12px 0" }}>
              Tap any state, country, or tile on the board to inspect its details!
            </p>
          </section>
        )}

        <section className="card">
          <h2>Players</h2>
          <ul className="players">
            {players.map((p) => (
              <li key={p.id} className={`pl ${p.id === currentTurnPlayer.id ? "on" : ""}`}>
                <span className="blob" style={{ "--c": p.color || "#ff6b9d" }}>
                  <i></i><i></i>
                </span>
                <b>{p.name}</b>
                <em>${p.money}</em>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      {/* Property & Trade Modal */}
      {modalProperty && (
        <PropertyCardModal
          property={modalProperty}
          onClose={() => setModalProperty(null)}
          currentPlayer={{ id: socket?.id, name: playerName }}
          gameState={{ isMyTurn, currentPlayerId: currentTurnPlayer.id }}
          onBuild={handleBuildHouse}
          onMortgage={handleMortgage}
        />
      )}
    </div>
  );
}
