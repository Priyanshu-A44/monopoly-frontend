import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./MonopolyBoard.css";

// Connect to cloud backend URL or fallback to local development
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
let socket;

export default function MonopolyBoard() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("qb4kw");
  const [joined, setJoined] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [bidAmount, setBidAmount] = useState("");

  useEffect(() => {
    socket = io(BACKEND_URL);

    // 1. Lobby Update Event
    socket.on("ROOM_UPDATE", ({ players, started }) => {
      setLobbyPlayers(players);
    });

    // 2. Monopoly Engine Game State Event
    socket.on("GAME_STATE_UPDATE", (updatedState) => {
      setGameState(updatedState);
    });

    // 3. Error Event Handling
    socket.on("ERROR", (errMsg) => {
      console.error("[Engine Error]:", errMsg);
      alert(errMsg);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Action Dispatchers matching server.js
  const handleJoin = (e) => {
    e.preventDefault();
    if (playerName.trim() && roomCode.trim()) {
      socket.emit("JOIN_GAME", { roomCode, playerName });
      setJoined(true);
    }
  };

  const handleStartGame = () => {
    socket.emit("START_GAME", { roomCode });
  };

  const handleRollDice = () => {
    socket.emit("ACTION_ROLL", { roomCode });
  };

  const handleBuyProperty = () => {
    socket.emit("ACTION_BUY", { roomCode });
  };

  const handleDeclineProperty = () => {
    socket.emit("ACTION_DECLINE", { roomCode });
  };

  const handlePlaceBid = (e) => {
    e.preventDefault();
    if (bidAmount) {
      socket.emit("ACTION_BID", { roomCode, amount: bidAmount });
      setBidAmount("");
    }
  };

  const handlePassBid = () => {
    socket.emit("ACTION_PASS_BID", { roomCode });
  };

  const handleEndTurn = () => {
    socket.emit("ACTION_END_TURN", { roomCode });
  };

  // 1. Pre-Game Join Screen
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

  // 2. Waiting Room / Pre-Start Lobby
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
        {lobbyPlayers.length >= 1 ? (
          <button onClick={handleStartGame}>Start Game</button>
        ) : (
          <p style={{ color: "#a5b4fc", marginTop: "12px" }}>
            Waiting for connection...
          </p>
        )}
      </div>
    );
  }

  const board = gameState?.board || [];
  const players = gameState?.players || [];
  const currentTurnPlayer = players.find((p) => p.id === gameState?.currentTurnPlayerId) || players[gameState?.currentTurnIndex] || {};
  const isMyTurn = currentTurnPlayer.id === socket?.id;

  // Helper to render individual tile with flags and googly-eyed tokens
  const renderTile = (tileIndex) => {
    const tile = board[tileIndex];
    if (!tile) return <div key={tileIndex} className="tile empty" />;

    const playersOnTile = players.filter((p) => p.position === tileIndex);

    return (
      <div key={tileIndex} className={`tile ${tile.type || ""}`}>
        {tile.colorGroup && (
          <div
            className="tile-color-bar"
            style={{ backgroundColor: tile.colorGroup }}
          />
        )}

        <div className="tile-content">
          {tile.countryCode && (
            <img
              src={`https://flagcdn.com/w40/${tile.countryCode.toLowerCase()}.png`}
              alt={tile.countryCode}
              className="tile-flag"
            />
          )}

          <div className="tile-name">{tile.name}</div>
          {tile.price && <div className="tile-price">${tile.price}</div>}

          {/* Googly-Eyed Character Tokens */}
          <div className="player-tokens-container">
            {playersOnTile.map((player) => (
              <div
                key={player.id}
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

  // 3. Main Live Game Board
  return (
    <div className="game-wrapper">
      <div className="board-container">
        {/* Center Board Information & Actions */}
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

          {/* Player Actions */}
          {isMyTurn && (
            <div className="action-buttons">
              {!gameState.hasRolled && (
                <button onClick={handleRollDice}>Roll Dice</button>
              )}
              {gameState.canBuy && (
                <>
                  <button onClick={handleBuyProperty}>Buy Property</button>
                  <button onClick={handleDeclineProperty} style={{ backgroundColor: "#ef4444" }}>
                    Auction Property
                  </button>
                </>
              )}
              {gameState.hasRolled && !gameState.canBuy && (
                <button onClick={handleEndTurn}>End Turn</button>
              )}
            </div>
          )}

          {/* Auction UI Controls */}
          {gameState?.inAuction && (
            <div className="auction-controls" style={{ marginTop: "12px" }}>
              <p>Auctioning Property! Current Bid: ${gameState.currentBid || 0}</p>
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

        {/* Board Tile Grid */}
        {board.map((_, index) => renderTile(index))}
      </div>

      {/* Right Sidebar (Players & Game Log) */}
      <div className="sidebar">
        <div className="player-list">
          <h3>Players</h3>
          {players.map((p) => (
            <div key={p.id} className="player-card">
              <span className="player-dot" style={{ backgroundColor: p.color || "#6366f1" }} />
              <strong>{p.name}</strong> : ${p.money}
            </div>
          ))}
        </div>

        <div className="game-log">
          <h3>Game Log</h3>
          <div className="log-messages">
            {(gameState?.logs || []).slice().reverse().map((log, i) => (
              <div key={i} className="log-entry">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
