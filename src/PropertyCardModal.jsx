// PropertyCardModal.jsx
import React from 'react';
import './PropertyCardModal.css';

export default function PropertyCardModal({ property, onClose, currentPlayer, gameState, onBuild, onMortgage }) {
  if (!property) return null;

  const isOwner = property.owner === currentPlayer.id;
  const canBuild = isOwner && gameState.isCurrentTurn && !property.isMortgaged;
  const canMortgage = isOwner && gameState.isCurrentTurn && property.houses === 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="property-card-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        
        <h2 className="property-title">{property.name}</h2>
        
        <div className="rent-table">
          <div className="table-header">
            <span>when</span>
            <span>get</span>
          </div>
          <div className="rent-row"><span>with rent</span><span>${property.rent.base}</span></div>
          <div className="rent-row"><span>with one house</span><span>${property.rent.oneHouse}</span></div>
          <div className="rent-row"><span>with two houses</span><span>${property.rent.twoHouses}</span></div>
          <div className="rent-row"><span>with three houses</span><span>${property.rent.threeHouses}</span></div>
          <div className="rent-row"><span>with four houses</span><span>${property.rent.fourHouses}</span></div>
          <div className="rent-row"><span>with a hotel</span><span>${property.rent.hotel}</span></div>
        </div>

        <div className="property-costs">
          <div className="cost-item">
            <span>Price</span>
            <strong>${property.price}</strong>
          </div>
          <div className="cost-item">
            <span>🏠 House</span>
            <strong>${property.houseCost}</strong>
          </div>
          <div className="cost-item">
            <span>🏢 Hotel</span>
            <strong>${property.hotelCost}</strong>
          </div>
        </div>

        {/* Action Controls for Building / Mortgaging */}
        {isOwner && (
          <div className="property-actions">
            {canBuild && (
              <button 
                className="action-btn build-btn"
                onClick={() => onBuild(property.id)}
                disabled={currentPlayer.money < property.houseCost}
              >
                {property.houses < 4 ? "Build House" : "Build Hotel"}
              </button>
            )}

            {canMortgage && (
              <button 
                className="action-btn mortgage-btn"
                onClick={() => onMortgage(property.id)}
              >
                {property.isMortgaged ? "Unmortgage" : "Mortgage"} (${property.mortgageValue})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
