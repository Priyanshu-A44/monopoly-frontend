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
    } else if (type === "build") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    console.log("Audio Context Error", e);
  }
};

const DEFAULT_BOARD = [
  { id: 0, name: "START", type: "CORNER" },
  { id: 1, name: "Salvador", price: 60, colorGroup: "#ec4899", countryCode: "BR", type: "PROPERTY", houseCost: 50, rent: [2, 10, 30, 90, 160, 250] },
  { id: 2, name: "Community Chest", type: "CHEST" },
  { id: 3, name: "Rio", price: 60, colorGroup: "#ec4899", countryCode: "BR", type: "PROPERTY", houseCost: 50, rent: [4, 20, 60, 180, 320, 450] },
  { id: 4, name: "Income Tax", price: 200, type: "TAX" },
  { id: 5, name: "TLV Airport", price: 200, type: "RAILROAD" },
  { id: 6, name: "Tel Aviv", price: 100, colorGroup: "#3b82f6", countryCode: "IL", type: "PROPERTY", houseCost: 50, rent: [6, 30, 90, 270, 400, 550] },
  { id: 7, name: "Chance", type: "CHANCE" },
  { id: 8, name: "Haifa", price: 100, colorGroup: "#3b82f6", countryCode: "IL", type: "PROPERTY", houseCost: 50, rent: [6, 30, 90, 270, 400, 550] },
  { id: 9, name: "Jerusalem", price: 120, colorGroup: "#3b82f6", countryCode: "IL", type: "PROPERTY", houseCost: 50, rent: [8, 40, 100, 300, 450, 600] },
  { id: 10, name: "Visiting Jail", type: "CORNER" },
  { id: 11, name: "Venice", price: 140, colorGroup: "#8b5cf6", countryCode: "IT", type: "PROPERTY", houseCost: 100, rent: [10, 50, 150, 450, 625, 750] },
  { id: 12, name: "Electric Company", price: 150, type: "UTILITY" },
  { id: 13, name: "Milan", price: 140, colorGroup: "#8b5cf6", countryCode: "IT", type: "PROPERTY", houseCost: 100, rent: [10, 50, 150, 450, 625, 750] },
  { id: 14, name: "Rome", price: 160, colorGroup: "#8b5cf6", countryCode: "IT", type: "PROPERTY", houseCost: 100, rent: [12, 60, 180, 500, 700, 900] },
  { id: 15, name: "MUC Airport", price: 200, type: "RAILROAD" },
  { id: 16, name: "Frankfurt", price: 180, colorGroup: "#f59e0b", countryCode: "DE", type: "PROPERTY", houseCost: 100, rent: [14, 70, 200, 550, 750, 950] },
  { id: 17, name: "Community Chest", type: "CHEST" },
  { id: 18, name: "Munich", price: 180, colorGroup: "#f59e0b", countryCode: "DE", type: "PROPERTY", houseCost: 100, rent: [14, 70, 200, 550, 750, 950] },
  { id: 19, name: "Berlin", price: 200, colorGroup: "#f59e0b", countryCode: "DE", type: "PROPERTY", houseCost: 100, rent: [16, 80, 220, 600, 800, 1000] },
  { id: 20, name: "Vacation", type: "CORNER" },
  { id: 21, name: "Paris", price: 220, colorGroup: "#10b981", countryCode: "FR", type: "PROPERTY", houseCost: 150, rent: [18, 90, 250, 700, 875, 1050] },
  { id: 22, name: "Chance", type: "CHANCE" },
  { id: 23, name: "Nice", price: 220, colorGroup: "#10b981", countryCode: "FR", type: "PROPERTY", houseCost: 150, rent: [18, 90, 250, 700, 875, 1050] },
  { id: 24, name: "Lyon", price: 240, colorGroup: "#10b981", countryCode: "FR", type: "PROPERTY", houseCost: 150, rent: [20, 100, 300, 750, 925, 1100] },
  { id: 25, name: "CDG Airport", price: 200, type: "RAILROAD" },
  { id: 26, name: "Liverpool", price: 260, colorGroup: "#ef4444", countryCode: "GB", type: "PROPERTY", houseCost: 150, rent: [22, 110, 330, 800, 975, 1150] },
  { id: 27, name: "Manchester", price: 260, colorGroup: "#ef4444", countryCode: "GB", type: "PROPERTY", houseCost: 150, rent: [22, 110, 330, 800, 975, 1150] },
  { id: 28, name: "Water Works", price: 150, type: "UTILITY" },
  { id: 29, name: "London", price: 280, colorGroup: "#ef4444", countryCode: "GB", type: "PROPERTY", houseCost: 150, rent: [24, 120, 360, 850, 1025, 1200] },
  { id: 30, name: "Go To Prison", type: "CORNER" },
  { id: 31, name: "San Francisco", price: 360, colorGroup: "#e11d48", countryCode: "US", type: "PROPERTY", houseCost: 200, rent: [35, 180, 550, 1150, 1350, 1525] },
  { id: 32, name: "Seattle", price: 300, colorGroup: "#e11d48", countryCode: "US", type: "PROPERTY", houseCost: 200, rent: [26, 130, 390, 900, 1100, 1275] },
  { id: 33, name: "Community Chest", type: "CHEST" },
  { id: 34, name: "New York", price: 320, colorGroup: "#e11d48", countryCode: "US", type: "PROPERTY", houseCost: 200, rent: [28, 150, 450, 1000, 1200, 1400] },
  { id: 35, name: "JFK Airport", price: 200, type: "RAILROAD" },
  { id: 36, name: "Chance", type: "CHANCE" },
  { id: 37, name: "Kyoto", price: 350, colorGroup: "#6366f1", countryCode: "JP", type: "PROPERTY", houseCost: 200, rent: [35, 175, 500, 1100, 1300, 1500] },
  { id: 38, name: "Luxury Tax", price: 100, type: "TAX" },
  { id: 39, name: "Tokyo", price: 400, colorGroup: "#6366f1", countryCode: "JP", type: "PROPERTY", houseCost: 200, rent: [50, 200, 600, 1400, 1700, 2000] }
];

const getTileIcon = (tile) => {
  if (!tile) return null;
  const name = tile.name?.toLowerCase() || "";
  const type = tile.type || "";

  if (name.includes("start")) return "🏁";
  if (name.includes("vacation") || name.includes("free parking")) return "🏝️";
  if (name.includes("go to prison")) return "🚔";
  if (name.includes("jail") || name.includes("visiting")) return "🔒";
  if (type === "CHEST" || name.includes("chest")) return "📦";
  if (type === "CHANCE" || name.includes("chance")) return "❓";
  if (type === "RAILROAD" || name.includes("airport")) return "✈️";
  if (type === "TAX" || name.includes("tax")) return "💸";
  if (name.includes("electric")) return "⚡";
  if (name.includes("water")) return "💧";

  return null;
};

const getTileGridStyle = (index) => {
  if (index >= 0 && index <= 10) return { gridColumn: 11 - index, gridRow: 11 };
  if (index >= 11 && index <= 20) return { gridColumn: 1, gridRow: 11 - (index - 10) };
  if (index >= 21 && index <= 30) return { gridColumn: 1 + (index - 20), gridRow: 1 };
  if (index >= 31 && index <= 39) return { gridColumn: 11, gridRow: 1 + (index - 30) };
  return {};
};

export default function MonopolyBoard() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("qb4kw");
  const [joined, setJoined] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [displayPositions, setDisplayPositions] = useState({});
  const [bidAmount, setBidAmount] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [floatingEmotes, setFloatingEmotes] = useState([]);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    socket = io(BACKEND_URL);

    socket.on("ROOM_UPDATE", ({ players }) => setLobbyPlayers(players || []));
    socket.on("GAME_STATE_UPDATE", (updatedState) => {
      setGameState(updatedState);
      setIsRolling(false);
    });

    socket.on("RECEIVE_EMOTE", ({ playerId, emote }) => {
      const id = Date.now() + Math.random();
      setFloatingEmotes((prev) => [...prev, { id, playerId, emote }]);
      setTimeout(() => {
        setFloatingEmotes((prev) => prev.filter((e) => e.id !== id));
      }, 2000);
    });

    socket.on("ERROR", (errMsg) => alert(errMsg));

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (!gameState?.players) return;

    setDisplayPositions((prev) => {
      const initial = { ...prev };
      let updated = false;
      gameState.players.forEach((p) => {
        if (initial[p.id] === undefined) {
          initial[p.id] = p.position;
          updated = true;
        }
      });
      return updated ? initial : prev;
    });

    const timer = setInterval(() => {
      setDisplayPositions((prev) => {
        let hasMoved = false;
        const nextPositions = { ...prev };

        gameState.players.forEach((p) => {
          const current = nextPositions[p.id];
          const target = p.position;

          if (current !== undefined && current !== target) {
            nextPositions[p.id] = (current + 1) % 40;
            hasMoved = true;
          }
        });

        return hasMoved ? nextPositions : prev;
      });
    }, 140);

    return () => clearInterval(timer);
  }, [gameState]);

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
    socket.emit("ACTION_ROLL", { roomCode });
  };

  const handlePayBail = () => socket.emit("ACTION_PAY_BAIL", { roomCode });

  const handleBuyProperty = () => {
    playSound("buy");
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    socket.emit("ACTION_BUY", { roomCode });
  };

  const handleDeclineProperty = () => socket.emit("ACTION_DECLINE", { roomCode });

  const handleBuildHouse = (tileId) => {
    playSound("build");
    confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
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

  const sendEmote = (emote) => {
    socket.emit("SEND_EMOTE", { roomCode, emote });
  };

  const handlePlaceBid = (e) => {
    e.preventDefault();
    if (bidAmount) {
      socket.emit("ACTION_BID", { roomCode, amount: Number(bidAmount) });
      setBidAmount("");
    }
  };

  const handlePassBid = () => socket.emit("ACTION_PASS_BID", { roomCode });
  const handleEndTurn = () => socket.emit("ACTION_END_TURN", { roomCode });

  if (!joined) {
    return (
      <div className="lobby-container">
        <h2>Join Monopoly Game</h2>
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
          <button type="submit">Join Lobby</button>
        </form>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="lobby-container">
        <h2>Room Code: {roomCode}</h2>
        <h3>Players Joined ({lobbyPlayers.length}):</h3>
        <ul>
          {lobbyPlayers.map((p, idx) => (
            <li key={p.id || idx} style={{ color: p.color || "#a5b4fc", fontWeight: "bold" }}>
              {p.name}
            </li>
          ))}
        </ul>
        <button onClick={handleStartGame}>Start Game</button>
      </div>
    );
  }

  const board = gameState?.board || DEFAULT_BOARD;
  const players = gameState?.players || [];
  const logs = gameState?.log || [];
  const properties = gameState?.properties || {};
  const turnPhase = gameState?.turnPhase;

  const currentTurnPlayer = players[gameState?.turnIndex] || players[0] || {};
  const isMyTurn = currentTurnPlayer.id === socket?.id;

  const hasFullCountry = (countryCode) => {
    if (!countryCode) return false;
    const countryTiles = board.filter((t) => t.countryCode === countryCode);
    return (
      countryTiles.length > 0 &&
      countryTiles.every((t) => properties[t.id]?.ownerId === socket?.id)
    );
  };

  const handleTileClick = (tile) => {
    const propData = properties[tile.id];
    const owner = players.find((p) => p.id === propData?.ownerId);

    setSelectedProperty({
      ...tile,
      ownerId: propData?.ownerId,
      ownerName: owner?.name,
      ownerColor: owner?.color,
      houses: propData?.houses || 0,
      isMortgaged: propData?.isMortgaged || false,
      hasCountryMonopoly: hasFullCountry(tile.countryCode)
    });
  };

  const renderTile = (tile, tileIndex) => {
    const icon = getTileIcon(tile);
    const propData = properties[tile.id];
    const owner = players.find((p) => p.id === propData?.ownerId);
    const houses = propData?.houses || 0;

    return (
      <div
        key={tileIndex}
        className={`tile ${tile?.type || ""} ${propData?.isMortgaged ? "mortgaged" : ""}`}
        style={getTileGridStyle(tileIndex)}
        onClick={() => handleTileClick(tile)}
      >
        {tile?.colorGroup && (
          <div
            className="tile-color-bar"
            style={{ backgroundColor: tile.colorGroup }}
          />
        )}

        <div className="tile-content">
          {tile?.countryCode ? (
            <img
              src={`https://flagcdn.com/w80/${tile.countryCode.toLowerCase()}.png`}
              alt={tile.countryCode}
              className="tile-flag-circle"
            />
          ) : icon ? (
            <div className="tile-icon">{icon}</div>
          ) : null}

          <div className="tile-name">{tile?.name}</div>
          {tile?.price && <div className="tile-price">${tile.price}</div>}

          {owner && (
            <div
              className="owner-badge glow-owner"
              style={{ backgroundColor: owner.color || "#6366f1" }}
              title={`Owned by ${owner.name}`}
            />
          )}

          {houses > 0 && (
            <div className="houses-container">
              {houses === 5 ? (
                <span className="hotel-symbol">🏨</span>
              ) : (
                Array.from({ length: houses }).map((_, i) => (
                  <span key={i} className="house-symbol">🏠</span>
                ))
              )}
            </div>
          )}

          {propData?.isMortgaged && <div className="mortgage-tag">MORTGAGED</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="game-wrapper">
      <div className="board-container" style={{ position: "relative" }}>
        {/* Golden Circular Center Stage */}
        <div className="board-center">
          <h1>Monopoly</h1>

          {gameState?.currentDice && (
            <div className={`dice-display ${isRolling ? "dice-shake" : ""}`}>
              🎲 {gameState.currentDice[0]} : {gameState.currentDice[1]} 🎲
            </div>
          )}

          <div className="turn-indicator">
            Turn: <strong>{currentTurnPlayer.name || "N/A"}</strong>
          </div>

          <div className="emote-bar">
            {["😎", "💸", "🤑", "😭", "💩"].map((emo) => (
              <button key={emo} onClick={() => sendEmote(emo)}>
                {emo}
              </button>
            ))}
          </div>

          {isMyTurn && (
            <div className="action-buttons" style={{ flexDirection: "column", alignItems: "center" }}>
              {turnPhase === "AWAITING_ROLL" && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleRollDice}>
                    {currentTurnPlayer.inJail ? "Roll for Doubles 🎲" : "Roll the Dice 🎲"}
                  </button>
                  {currentTurnPlayer.inJail && (
                    <button onClick={handlePayBail} style={{ backgroundColor: "#f59e0b" }}>
                      Pay $50 Bail 🔓
                    </button>
                  )}
                </div>
              )}

              {turnPhase === "ACTION_REQUIRED" && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleBuyProperty}>Buy Property 🏠</button>
                  <button onClick={handleDeclineProperty} style={{ backgroundColor: "#ef4444" }}>
                    Auction Property 🔨
                  </button>
                </div>
              )}

              {turnPhase === "AWAITING_END_TURN" && (
                <button onClick={handleEndTurn}>End Turn ⌛</button>
              )}
            </div>
          )}

          {turnPhase === "AUCTION" && gameState?.auction && (
            <div className="auction-controls" style={{ marginTop: "10px" }}>
              <p>Highest Bid: ${gameState.auction.currentBid || 0}</p>
              <form onSubmit={handlePlaceBid} style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <input
                  type="number"
                  placeholder="Bid Amount"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  style={{ width: "90px", padding: "4px" }}
                />
                <button type="submit">Place Bid</button>
                <button type="button" onClick={handlePassBid} style={{ backgroundColor: "#6b7280" }}>
                  Pass
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Board Tiles */}
        {board.map((tile, index) => renderTile(tile, index))}

        {/* Player Tokens */}
        {players.map((player, pIdx) => {
          const pos = displayPositions[player.id] ?? player.position;
          const gridStyle = getTileGridStyle(pos);
          const colIndex = gridStyle.gridColumn - 1;
          const rowIndex = gridStyle.gridRow - 1;

          const colCenter = ((colIndex + 0.5) / 11) * 100;
          const rowCenter = ((rowIndex + 0.5) / 11) * 100;

          const offsetX = (pIdx % 2) * 12 - 6;
          const offsetY = Math.floor(pIdx / 2) * 12 - 6;

          const myEmote = floatingEmotes.find((e) => e.playerId === player.id);

          return (
            <div
              key={player.id}
              className="player-character-token floating-token"
              style={{
                position: "absolute",
                left: `calc(${colCenter}% + ${offsetX}px)`,
                top: `calc(${rowCenter}% + ${offsetY}px)`,
                transform: "translate(-50%, -50%)",
                backgroundColor: player.color || "#6366f1",
                transition: "left 0.14s ease-out, top 0.14s ease-out",
                zIndex: 30,
                pointerEvents: "none"
              }}
              title={player.name}
            >
              <div className="character-eyes">
                <div className="eye"><div className="pupil" /></div>
                <div className="eye"><div className="pupil" /></div>
              </div>

              {myEmote && <div className="floating-emote-bubble">{myEmote.emote}</div>}
            </div>
          );
        })}

        {/* Property Modal */}
        {selectedProperty && (
          <PropertyCardModal
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
            currentPlayer={{ id: socket?.id, name: playerName }}
            gameState={{ isMyTurn, currentPlayerId: currentTurnPlayer.id }}
            onBuild={handleBuildHouse}
            onMortgage={handleMortgage}
          />
        )}
      </div>

      {/* Sidebar */}
      <div className="sidebar">
        <div className="player-list">
          <h3>Players</h3>
          {players.map((p) => (
            <div key={p.id} className="player-card">
              <span className="player-dot glow-owner" style={{ backgroundColor: p.color || "#6366f1" }} />
              <strong>{p.name}</strong> : ${p.money} {p.inJail ? "🔒" : ""}
            </div>
          ))}
        </div>

        <div className="game-log">
          <h3>Game Log</h3>
          <div className="log-messages">
            {(logs || []).map((log, i) => (
              <div key={i} className="log-entry">
                {typeof log === "string" ? log : JSON.stringify(log)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
