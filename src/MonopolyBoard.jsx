import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./MonopolyBoard.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
let socket;

// Fallback board array if engine getState() omits static board data
const DEFAULT_BOARD = [
  { name: "START", type: "corner" },
  { name: "Salvador", price: 60, colorGroup: "#8b5cf6", countryCode: "BR" },
  { name: "Treasure", type: "chest" },
  { name: "Rio", price: 60, colorGroup: "#8b5cf6", countryCode: "BR" },
  { name: "Earnings Tax", price: 75, type: "tax" },
  { name: "TLV Airport", price: 200, type: "airport" },
  { name: "Tel Aviv", price: 100, colorGroup: "#3b82f6", countryCode: "IL" },
  { name: "Haifa", price: 100, colorGroup: "#3b82f6", countryCode: "IL" },
  { name: "Surprise", type: "chance" },
  { name: "Jerusalem", price: 120, colorGroup: "#3b82f6", countryCode: "IL" },
  { name: "Jail / Visiting", type: "corner" },
  { name: "Venice", price: 130, colorGroup: "#ec4899", countryCode: "IT" },
  { name: "Power Company", price: 150, type: "utility" },
  { name: "Milan", price: 140, colorGroup: "#ec4899", countryCode: "IT" },
  { name: "Rome", price: 160, colorGroup: "#ec4899", countryCode: "IT" },
  { name: "MUC Airport", price: 200, type: "airport" },
  { name: "Frankfurt", price: 180, colorGroup: "#f59e0b", countryCode: "DE" },
  { name: "Treasure", type: "chest" },
  { name: "Munich", price: 190, colorGroup: "#f59e0b", countryCode: "DE" },
  { name: "Berlin", price: 200, colorGroup: "#f59e0b", countryCode: "DE" },
  { name: "Vacation", type: "corner" },
  { name: "CDG Airport", price: 200, type: "airport" },
  { name: "Surprise", type: "chance" },
  { name: "Water Company", price: 150, type: "utility" },
  { name: "Go To Jail", type: "corner" },
  { name: "Liverpool", price: 290, colorGroup: "#10b981", countryCode: "GB" },
  { name: "Manchester", price: 300, colorGroup: "#10b981", countryCode: "GB" },
  { name: "Treasure", type: "chest" },
  { name: "London", price: 320, colorGroup: "#10b981", countryCode: "GB" },
  { name: "JFK Airport", price: 200, type: "airport" },
  { name: "Surprise", type: "chance" },
  { name: "San Francisco", price: 360, colorGroup: "#ef4444", countryCode: "US" },
  { name: "Premium Tax", price: 100, type: "tax" },
  { name: "New York", price: 400, colorGroup: "#ef4444", countryCode: "US" }
];

// Maps perimeter tiles around an 11x11 grid
const getTileGridStyle = (index) => {
  if (index >= 0 && index <= 10) {
    return { gridColumn: 11 - index, gridRow: 11 };
  } else if (index >= 11 && index <= 20) {
    return { gridColumn: 1, gridRow: 11 - (index - 10) };
  } else if (index >= 21 && index <= 30) {
    return { gridColumn: 1 + (index - 20), gridRow: 1 };
  } else if (index >= 31 && index <= 39) {
    return { gridColumn: 11, gridRow: 1 + (index - 30) };
  }
  return {};
};

export default function MonopolyBoard() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("qb4kw");
  const [joined, setJoined] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [bidAmount, setBidAmount] = useState("");

  useEffect(() => {
    socket = io(BACKEND_URL);

    socket.on("ROOM_UPDATE", ({ players }) => {
      setLobbyPlayers(players || []);
    });

    socket.on("GAME_STATE_UPDATE", (updatedState) => {
      setGameState(updatedState);
    });

    socket.on("ERROR", (errMsg) => {
      console.error("[Engine Error]:", errMsg);
      alert(errMsg);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (playerName.trim() && roomCode.trim()) {
      socket.emit("JOIN_GAME", { roomCode, playerName });
      setJoined(true);
    }
  };

  const handleStartGame = () => socket.emit("START_GAME", { roomCode });
  const handleRollDice = () => socket.emit("ACTION_ROLL", { roomCode });
  const handleBuyProperty = () => socket.emit("ACTION_BUY", { roomCode });
  const handleDeclineProperty = () => socket.emit("ACTION_DECLINE", { roomCode });

  const handlePlaceBid = (e) => {
    e.preventDefault();
    if (bidAmount) {
      socket.emit("ACTION_BID", { roomCode, amount: bidAmount });
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

  // Ensure board array is populated
  const rawBoard = gameState?.board || gameState?.tiles;
  const board = Array.isArray(rawBoard) && rawBoard.length > 0 ? rawBoard : DEFAULT_BOARD;

  const players = gameState?.players || [];
  const logs = gameState?.logs || gameState?.log || gameState?.history || [];

  // Resolve current active player across engine formats
  const getCurrentTurnPlayer = () => {
    if (!players.length) return {};
    if (typeof gameState?.currentTurn === "object" && gameState?.currentTurn?.name) {
      return gameState.currentTurn;
    }
    const turnId = gameState?.currentTurnPlayerId || gameState?.activePlayerId || gameState?.currentTurn;
    const foundById = players.find((p) => p.id === turnId || p.socketId === turnId);
    if (foundById) return foundById;

    const turnIdx =
      typeof gameState?.currentTurnIndex === "number"
        ? gameState.currentTurnIndex
        : typeof gameState?.currentTurn === "number"
        ? gameState.currentTurn
        : 0;

    return players[turnIdx] || players[0] || {};
  };

  const currentTurnPlayer = getCurrentTurnPlayer();
  const isMyTurn = currentTurnPlayer.id === socket?.id || currentTurnPlayer.name === playerName;

  const renderTile = (tile, tileIndex) => {
    const playersOnTile = players.filter((p) => p.position === tileIndex);

    return (
      <div
        key={tileIndex}
        className={`tile ${tile?.type || ""}`}
        style={getTileGridStyle(tileIndex)}
      >
        {(tile?.colorGroup || tile?.color) && (
          <div
            className="tile-color-bar"
            style={{ backgroundColor: tile.colorGroup || tile.color }}
          />
        )}

        <div className="tile-content">
          {tile?.countryCode && (
            <img
              src={`https://flagcdn.com/w40/${tile.countryCode.toLowerCase()}.png`}
              alt={tile.countryCode}
              className="tile-flag"
            />
          )}

          <div className="tile-name">{tile?.name || `Tile ${tileIndex}`}</div>
          {tile?.price && <div className="tile-price">${tile.price}</div>}

          <div className="player-tokens-container">
            {playersOnTile.map((player) => (
              <div
                key={player.id || player.name}
                className="player-character-token"
                style={{ backgroundColor: player.color || "#6366f1" }}
                title={player.name}
              >
                <div className="character-eyes">
                  <div className="eye">
                    <div className="pupil" />
                  </div>
                  <div className="eye">
                    <div className="pupil" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="game-wrapper">
      <div className="board-container">
        <div className="board-center">
          <h1>Monopoly</h1>

          {gameState?.lastRoll && (
            <div className="dice-display">
              🎲 {gameState.lastRoll[0]} : {gameState.lastRoll[1]} 🎲
            </div>
          )}

          <div className="turn-indicator">
            Current Turn: <strong>{currentTurnPlayer.name || "N/A"}</strong>
          </div>

          <div className="action-buttons">
            {isMyTurn && !gameState?.hasRolled && (
              <button onClick={handleRollDice}>Roll Dice</button>
            )}
            {isMyTurn && gameState?.canBuy && (
              <>
                <button onClick={handleBuyProperty}>Buy Property</button>
                <button onClick={handleDeclineProperty} style={{ backgroundColor: "#ef4444" }}>
                  Auction Property
                </button>
              </>
            )}
            {isMyTurn && gameState?.hasRolled && !gameState?.canBuy && (
              <button onClick={handleEndTurn}>End Turn</button>
            )}
          </div>

          {gameState?.inAuction && (
            <div className="auction-controls" style={{ marginTop: "12px" }}>
              <p>Auction in Progress! Highest Bid: ${gameState.currentBid || 0}</p>
              <form onSubmit={handlePlaceBid} style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <input
                  type="number"
                  placeholder="Bid Amount"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  style={{ width: "100px", padding: "4px" }}
                />
                <button type="submit">Place Bid</button>
                <button type="button" onClick={handlePassBid} style={{ backgroundColor: "#6b7280" }}>
                  Pass
                </button>
              </form>
            </div>
          )}
        </div>

        {board.map((tile, index) => renderTile(tile, index))}
      </div>

      <div className="sidebar">
        <div className="player-list">
          <h3>Players</h3>
          {players.map((p) => (
            <div key={p.id || p.name} className="player-card">
              <span className="player-dot" style={{ backgroundColor: p.color || "#6366f1" }} />
              <strong>{p.name}</strong> : ${p.money}
            </div>
          ))}
        </div>

        <div className="game-log">
          <h3>Game Log</h3>
          <div className="log-messages">
            {(logs || []).slice().reverse().map((log, i) => (
              <div key={i} className="log-entry">
                {typeof log === "string" ? log : log.text || JSON.stringify(log)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
