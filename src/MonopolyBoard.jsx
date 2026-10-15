import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { BOARD_TILES } from "./boardData";
import "./MonopolyBoard.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const socket = io(BACKEND_URL);

// Map 0-39 indices directly to CSS 11x11 Grid coordinates around perimeter
const getGridPosition = (index) => {
  if (index >= 0 && index <= 10) return { gridColumn: 11 - index, gridRow: 1 }; // Top row (right to left)
  if (index > 10 && index <= 20) return { gridColumn: 1, gridRow: index - 10 + 1 }; // Right column (top to bottom)
  if (index > 20 && index <= 30) return { gridColumn: index - 20 + 1, gridRow: 11 }; // Bottom row (left to right)
  if (index > 30 && index < 40) return { gridColumn: 11, gridRow: 11 - (index - 30) }; // Left column (bottom to top)
};

export default function MonopolyBoard() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("qb4kw");
  const [joined, setJoined] = useState(false);
  const [roomInfo, setRoomInfo] = useState({ players: [], started: false });
  const [gameState, setGameState] = useState(null);
  const [bidInput, setBidInput] = useState("");

  useEffect(() => {
    socket.on("ROOM_UPDATE", (data) => setRoomInfo(data));
    socket.on("GAME_STATE_UPDATE", (state) => setGameState(state));
    socket.on("ERROR", (msg) => alert(msg));
    return () => socket.off();
  }, []);

  const handleJoin = () => {
    if (!playerName) return alert("Please enter your name");
    socket.emit("JOIN_GAME", { roomCode, playerName });
    setJoined(true);
  };

  const handleStart = () => socket.emit("START_GAME", { roomCode });
  const handleRoll = () => socket.emit("ACTION_ROLL", { roomCode });
  const handleBuy = () => socket.emit("ACTION_BUY", { roomCode });
  const handleDecline = () => socket.emit("ACTION_DECLINE", { roomCode });
  const handleEndTurn = () => socket.emit("ACTION_END_TURN", { roomCode });
  const handleBuildHouse = (tileId) => socket.emit("ACTION_BUILD_HOUSE", { roomCode, tileId });

  const handleBid = () => {
    if (!bidInput || isNaN(bidInput)) return alert("Enter valid bid amount");
    socket.emit("ACTION_BID", { roomCode, amount: Number(bidInput) });
    setBidInput("");
  };
  const handlePass = () => socket.emit("ACTION_PASS_BID", { roomCode });

  if (!joined) {
    return (
      <div className="login-screen">
        <h2>Join Monopoly Game</h2>
        <input placeholder="Your Name" value={playerName} onChange={e => setPlayerName(e.target.value)} />
        <input placeholder="Room Code" value={roomCode} onChange={e => setRoomCode(e.target.value)} />
        <button onClick={handleJoin}>Join Lobby</button>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="lobby-screen">
        <h2>Room: {roomCode}</h2>
        <h3>Connected Players ({roomInfo.players.length}):</h3>
        <ul>{roomInfo.players.map((p, i) => <li key={i}>{p.name}</li>)}</ul>
        {roomInfo.players.length >= 2 ? (
          <button onClick={handleStart}>Start Game</button>
        ) : (
          <p>Waiting for at least 2 players to join...</p>
        )}
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.turnIndex];
  const isMyTurn = currentPlayer.id === socket.id;

  const auctionTile = gameState.auction ? BOARD_TILES[gameState.auction.tileId] : null;
  const activeBidderId = gameState.auction?.activeBidders[gameState.auction.turnIndex];
  const isMyBidTurn = activeBidderId === socket.id;

  return (
    <div className="game-container">
      <div className="monopoly-board">
        {BOARD_TILES.map((tile) => {
          const prop = gameState.properties[tile.id];
          const houses = prop?.houses || 0;

          return (
            <div key={tile.id} className="tile" style={getGridPosition(tile.id)}>
              {tile.group && <div className={`color-bar group-${tile.group}`} />}
              <div className="tile-name">
                {tile.flag && <span className="flag-icon">{tile.flag} </span>}
                {tile.name}
              </div>
              {tile.price && <div className="tile-price">${tile.price}</div>}

              {houses > 0 && (
                <div className="building-container">
                  {houses === 5 ? "🏨" : "🏠".repeat(houses)}
                </div>
              )}

              <div className="token-container">
                {gameState.players
                  .filter((p) => p.position === tile.id)
                  .map((p) => (
                    <span key={p.id} className="player-token" style={{ backgroundColor: p.color }} title={p.name} />
                  ))}
              </div>
            </div>
          );
        })}

        <div className="board-center">
          <h2>Monopoly</h2>
          <div className="dice-display">
            🎲 {gameState.currentDice[0]} : {gameState.currentDice[1]} 🎲
          </div>

          {gameState.turnPhase !== "AUCTION" && (
            <>
              <p>Current Turn: <strong>{currentPlayer.name}</strong></p>
              {isMyTurn && (
                <div className="action-buttons">
                  {gameState.turnPhase === "AWAITING_ROLL" && <button onClick={handleRoll}>Roll Dice</button>}
                  {gameState.turnPhase === "ACTION_REQUIRED" && (
                    <>
                      <button onClick={handleBuy}>Buy Property</button>
                      <button onClick={handleDecline}>Decline (Auction)</button>
                    </>
                  )}
                  <button onClick={handleEndTurn}>End Turn</button>
                </div>
              )}
            </>
          )}

          {gameState.turnPhase === "AUCTION" && auctionTile && (
            <div className="auction-overlay">
              <h3>🔨 AUCTION: {auctionTile.name}</h3>
              <p>Current High Bid: <strong>${gameState.auction.currentBid}</strong></p>
              <p>Bidding Turn: <strong>{gameState.players.find(p => p.id === activeBidderId)?.name}</strong></p>

              {isMyBidTurn ? (
                <div className="bid-controls">
                  <input
                    type="number"
                    placeholder={`> $${gameState.auction.currentBid}`}
                    value={bidInput}
                    onChange={(e) => setBidInput(e.target.value)}
                  />
                  <button onClick={handleBid}>Bid</button>
                  <button onClick={handlePass}>Pass</button>
                </div>
              ) : (
                <p>Waiting for current bidder...</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="sidebar">
        <h3>Players</h3>
        {gameState.players.map((p) => (
          <div key={p.id} className="player-card">
            <span className="color-dot" style={{ backgroundColor: p.color }} />
            <strong>{p.name}</strong>: ${p.money}
          </div>
        ))}

        <h3>Game Log</h3>
        <div className="log-box">
          {gameState.log.map((entry, idx) => <p key={idx}>{entry}</p>)}
        </div>
      </div>
    </div>
  );
}