import React from 'react';
import PropertyCardModal from './PropertyCardModal';

export default function MonopolyBoard({ 
  boardData, 
  players, 
  currentPlayer, 
  gameState, 
  selectedProperty, 
  onTileClick, 
  onCloseModal, 
  onBuild, 
  onMortgage,
  onRollDice,
  onEndTurn 
}) {
  return (
    <div className="game-wrapper">
      {/* Main 11x11 Grid Monopoly Board */}
      <div className="board-container">
        {boardData.map((tile, index) => {
          // Find players standing on this tile index
          const playersOnTile = players.filter(p => p.position === index);

          return (
            <div
              key={tile.id || index}
              className={`tile tile-${index} ${tile.isMortgaged ? 'mortgaged' : ''}`}
              onClick={() => onTileClick(tile)}
            >
              {/* Top Color Bar for Properties */}
              {tile.color && (
                <div 
                  className="tile-color-bar" 
                  style={{ backgroundColor: tile.color }} 
                />
              )}

              {/* Mortgage Tag if applicable */}
              {tile.isMortgaged && <span className="mortgage-tag">MORTGAGED</span>}

              <div className="tile-content">
                {tile.flag && <img src={tile.flag} alt="flag" className="tile-flag" />}
                {tile.icon && <span className="tile-icon">{tile.icon}</span>}
                <span className="tile-name">{tile.name}</span>
                {tile.price && <span className="tile-price">${tile.price}</span>}

                {/* Houses / Hotels display */}
                {tile.houses > 0 && (
                  <div className="houses-container">
                    {tile.houses === 5 ? (
                      <span className="hotel-symbol">🏢</span>
                    ) : (
                      Array.from({ length: tile.houses }).map((_, i) => (
                        <span key={i} className="house-symbol">🏠</span>
                      ))
                    )}
                  </div>
                )}

                {/* Owner color indicator badge */}
                {tile.owner && (
                  <span 
                    className="owner-badge" 
                    style={{ backgroundColor: tile.ownerColor || '#fff' }} 
                  />
                )}

                {/* Player Tokens inside the tile */}
                <div className="player-tokens">
                  {playersOnTile.map(player => (
                    <div 
                      key={player.id} 
                      className="player-token" 
                      style={{ backgroundColor: player.color }}
                      title={player.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Center Control Panel */}
        <div className="board-center">
          <h1>MONOPOLY</h1>
          <div className="dice-display">
            {gameState.dice ? `🎲 ${gameState.dice[0]} - ${gameState.dice[1]}` : '🎲 Roll to Start'}
          </div>
          <div className="turn-indicator">
            Turn: <strong>{gameState.currentTurnName || 'Waiting...'}</strong>
          </div>
          
          <div className="action-buttons">
            <button onClick={onRollDice} disabled={!gameState.isMyTurn}>
              Roll Dice
            </button>
            <button onClick={onEndTurn} disabled={!gameState.isMyTurn}>
              End Turn
            </button>
          </div>
        </div>
      </div>

        {/* Sidebar / Player Status Display */}
        <div className="sidebar">
          <div className="player-list">
            <h3>Players</h3>
            {players.map(p => (
              <div key={p.id} className="player-card">
                <span className="player-dot" style={{ backgroundColor: p.color }} />
                <div>
                  <strong>{p.name}</strong>
                  <div>${p.money}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="game-log">
            <h3>Game Log</h3>
            <div className="log-messages">
              {gameState.logs?.map((log, index) => (
                <div key={index} className="log-entry">{log}</div>
              )) || <div className="log-entry">Game started. Welcome!</div>}
            </div>
          </div>
        </div>

      {/* Property Details Modal Popup */}
      {selectedProperty && (
        <PropertyCardModal
          property={selectedProperty}
          onClose={onCloseModal}
          currentPlayer={currentPlayer}
          gameState={gameState}
          onBuild={onBuild}
          onMortgage={onMortgage}
        />
      )}
    </div>
  );
}
