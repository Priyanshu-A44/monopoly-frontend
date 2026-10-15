import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./MonopolyBoard.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
let socket;

// Symmetrical 40-Tile Mapping around an 11x11 Grid
const getTileGridStyle = (index) => {
  if (index >= 0 && index <= 10) {
    // Bottom edge (START at 11,11 -> Jail at 1,11)
    return { gridColumn: 11 - index, gridRow: 11 };
  } else if (index >= 11 && index <= 20) {
    // Left edge (1,10 up to Free Parking at 1,1)
    return { gridColumn: 1, gridRow: 11 - (index - 10) };
  } else if (index >= 21 && index <= 30) {
    // Top edge (2,1 right to Go To Jail at 11,1)
    return { gridColumn: 1 + (index - 20), gridRow: 1 };
  } else if (index >= 31 && index <= 39) {
    // Right edge (11,2 down to 11,10)
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

  // Smooth Step-by-Step Token Hop Movement (150ms per tile)
  useEffect(() => {
    if (!gameState?.players) return;

    gameState.players.forEach((player) => {
      const targetPos = player.position;
      const currentPos = displayPositions[player.id] ?? targetPos;

      if (currentPos !== targetPos) {
        const interval = setInterval(() => {
          setDisplayPositions((prev) => {
            const pos = prev[player.id] ?? currentPos;
            if (pos === targetPos) {
              clearInterval(interval);
              return prev;
            }
            const nextPos = (pos + 1) % 40;
            return { ...prev, [player.id]: nextPos };
          });
        }, 150);

        return () => clearInterval(interval);
      }
    });
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
    const playersOnTile = players.filter((p) => {
      const pos = displayPositions[p.id] ?? p.position;
      return pos === tileIndex;
    });

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

  return (
    <div className="game-wrapper">
      <div className="board-container">
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

        {board.map((tile, index) => renderTile(tile, index))}
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
