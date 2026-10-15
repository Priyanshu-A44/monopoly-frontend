import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./MonopolyBoard.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
let socket;

// Symmetrical 40-Tile Grid Position Mapping (11x11 Grid)
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
  const [displayPositions, setDisplayPositions] = useState({});
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

  // Continuous Linear Step-by-Step Walking Animation Engine
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
    }, 150); // 150ms per step

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
  const handleRollDice = () => socket.emit("ACTION_ROLL", { roomCode });
  const handleBuyProperty = () => socket.emit("ACTION_BUY", { roomCode });
  const handleDeclineProperty = () => socket.emit("ACTION_DECLINE", { roomCode });

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

  const board = gameState?.board || [];
  const players = gameState?.players || [];
  const logs = gameState?.log || [];
  const turnPhase = gameState?.turnPhase;

  const currentTurnPlayer = players[gameState?.turnIndex] || players[0] || {};
  const isMyTurn = currentTurnPlayer.id === socket?.id;

  const renderTile = (tile, tileIndex) => {
    return (
      <div
        key={tileIndex}
        className={`tile ${tile?.type || ""}`}
        style={getTileGridStyle(tileIndex)}
      >
        {tile?.colorGroup && (
          <div
            className="tile-color-bar"
            style={{ backgroundColor: tile.colorGroup }}
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

          <div className="tile-name">{tile?.name}</div>
          {tile?.price && <div className="tile-price">${tile.price}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="game-wrapper">
      <div className="board-container" style={{ position: "relative" }}>
        <div className="board-center">
          <h1>Monopoly</h1>

          {gameState?.currentDice && (
            <div className="dice-display">
              🎲 {gameState.currentDice[0]} : {gameState.currentDice[1]} 🎲
            </div>
          )}

          <div className="turn-indicator">
            Current Turn: <strong>{currentTurnPlayer.name || "N/A"}</strong>
          </div>

          {isMyTurn && (
            <div className="action-buttons">
              {turnPhase === "AWAITING_ROLL" && (
                <button onClick={handleRollDice}>Roll Dice</button>
              )}
              {turnPhase === "ACTION_REQUIRED" && (
                <>
                  <button onClick={handleBuyProperty}>Buy Property</button>
                  <button onClick={handleDeclineProperty} style={{ backgroundColor: "#ef4444" }}>
                    Auction Property
                  </button>
                </>
              )}
              {turnPhase === "AWAITING_END_TURN" && (
                <button onClick={handleEndTurn}>End Turn</button>
              )}
            </div>
          )}

          {turnPhase === "AUCTION" && gameState?.auction && (
            <div className="auction-controls" style={{ marginTop: "12px" }}>
              <p>Auction in Progress! Highest Bid: ${gameState.auction.currentBid || 0}</p>
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

        {/* 1. Board Grid Tiles */}
        {board.map((tile, index) => renderTile(tile, index))}

        {/* 2. Floating Animated Player Tokens with Linear GPU Transitions */}
        {players.map((player, pIdx) => {
          const pos = displayPositions[player.id] ?? player.position;
          const gridStyle = getTileGridStyle(pos);
          const colIndex = gridStyle.gridColumn - 1; // 0 to 10
          const rowIndex = gridStyle.gridRow - 1;    // 0 to 10

          // Calculate exact center percentages on an 11x11 grid
          const colCenter = ((colIndex + 0.5) / 11) * 100;
          const rowCenter = ((rowIndex + 0.5) / 11) * 100;

          // Offset tokens on the same tile so they don't hide each other
          const offsetX = (pIdx % 2) * 12 - 6;
          const offsetY = Math.floor(pIdx / 2) * 12 - 6;

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
                transition: "left 0.15s linear, top 0.15s linear",
                zIndex: 30,
                pointerEvents: "none"
              }}
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
          );
        })}
      </div>

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
