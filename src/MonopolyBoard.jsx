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
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    socket = io(BACKEND_URL);

    socket.on("gameState", (updatedState) => {
      setGameState(updatedState);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (playerName.trim() && roomCode.trim()) {
      socket.emit("joinRoom", { name: playerName, room: roomCode });
      setJoined(true);
    }
  };

  const handleStartGame = () => {
    socket.emit("startGame", { room: roomCode });
  };

  const handleRollDice = () => {
    socket.emit("rollDice", { room: roomCode });
  };

  const handleBuyProperty = () => {
    socket.emit("buyProperty", { room: roomCode });
  };

  const handleEndTurn = () => {
    socket.emit("endTurn", { room: roomCode });
  };

  // 1. Pre-Game Lobby / Join Screen
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

  // 2. Loading State while waiting for Backend Game Data (Prevents Blank Screen)
  if (joined && !gameState) {
    return (
      <div className="lobby-container">
        <h2>Connecting to Server...</h2>
        <p style={{ color: "#a5b4fc", marginTop: "12px", textAlign: "center" }}>
          Waking up backend server. Please wait a few seconds...
        </p>
      </div>
    );
  }

  // 3. Waiting Room Screen before Host starts
  if (gameState && !gameState.started) {
    return (
      <div className="lobby-container">
        <h2>Room Code: {roomCode}</h2>
        <h3>Players Joined:</h3>
        <ul>
          {gameState.players.map((p) => (
            <li key={p.id} style={{ color: p.color, fontWeight: "bold" }}>
              {p.name}
            </li>
          ))}
        </ul>
        {gameState.hostId === socket.id && (
          <button onClick={handleStartGame}>Start Game</button>
        )}
      </div>
    );
  }

  const board = gameState?.board || [];
  const players = gameState?.players || [];
  const currentTurnPlayer = players[gameState?.currentTurnIndex] || {};
  const isMyTurn = currentTurnPlayer.id === socket?.id;

  // Helper to render individual tiles with flags and googly-eyed tokens
  const renderTile = (tileIndex) => {
    const tile = board[tileIndex];
    if (!tile) return <div key={tileIndex} className="tile empty" />;

    const playersOnTile = players.filter((p) => p.position === tileIndex);

    return (
      <div key={tileIndex} className={`tile ${tile.type || ""}`}>
        {/* Color Bar for Property Groups */}
        {tile.colorGroup && (
          <div
            className="tile-color-bar"
            style={{ backgroundColor: tile.colorGroup }}
          />
        )}

        <div className="tile-content">
          {/* Country Flag Image */}
          {tile.countryCode && (
            <img
              src={`https://flagcdn.com/w40/${tile.countryCode.toLowerCase()}.png`}
              alt={tile.countryCode}
              className="tile-flag"
            />
          )}

          {/* Tile Title & Price */}
          <div className="tile-name">{tile.name}</div>
          {tile.price && <div className="tile-price">${tile.price}</div>}

          {/* Googly-Eyed Character Player Tokens */}
          <div className="player-tokens-container">
            {playersOnTile.map((player) => (
              <div
                key={player.id}
                className="player-character-token"
                style={{ backgroundColor: player.color }}
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

  // 4. Main Live Game Board
  return (
    <div className="game-wrapper">
      <div className="board-container">
        {/* Center Board Information */}
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
                <button onClick={handleBuyProperty}>Buy Property</button>
              )}
              {gameState.hasRolled && (
                <button onClick={handleEndTurn}>End Turn</button>
              )}
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
              <span className="player-dot" style={{ backgroundColor: p.color }} />
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
