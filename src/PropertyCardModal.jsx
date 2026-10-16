import React from "react";
import "./PropertyCardModal.css";

export default function PropertyCardModal({
  property,
  onClose,
  currentPlayer,
  gameState,
  onBuild,
  onMortgage
}) {
  if (!property) return null;

  const rentList = property.rent || [35, 180, 550, 1150, 1350, 1525];

  const isOwner =
    property.ownerId === currentPlayer?.id ||
    property.owner === currentPlayer?.name;
  const isMyTurn =
    gameState?.isMyTurn ||
    gameState?.currentPlayerId === currentPlayer?.id;

  const canBuild =
    isOwner &&
    property.hasCountryMonopoly &&
    !property.isMortgaged &&
    (property.houses || 0) < 5;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="property-card-modal card-3d-flip"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose}>
          ×
        </button>

        <h2 className="property-title">{property.name}</h2>

        {property.type === "PROPERTY" || property.price ? (
          <>
            <div className="rent-table">
              <div className="table-header">
                <span>when</span>
                <span>get</span>
              </div>
              <div className="rent-row">
                <span>with rent</span>
                <span>${rentList[0]}</span>
              </div>
              <div className="rent-row">
                <span>with one house</span>
                <span>${rentList[1]}</span>
              </div>
              <div className="rent-row">
                <span>with two houses</span>
                <span>${rentList[2]}</span>
              </div>
              <div className="rent-row">
                <span>with three houses</span>
                <span>${rentList[3]}</span>
              </div>
              <div className="rent-row">
                <span>with four houses</span>
                <span>${rentList[4]}</span>
              </div>
              <div className="rent-row highlight-hotel">
                <span>with a hotel</span>
                <span>${rentList[5]}</span>
              </div>
            </div>

            <div className="property-costs">
              <div className="cost-item">
                <span>Price</span>
                <strong>${property.price}</strong>
              </div>
              <div className="cost-item">
                <span>🏠</span>
                <strong>${property.houseCost || 200}</strong>
              </div>
              <div className="cost-item">
                <span>🏨</span>
                <strong>${property.houseCost || 200}</strong>
              </div>
            </div>

            {(property.ownerName || property.owner) && (
              <p
                style={{
                  textAlign: "center",
                  marginTop: "12px",
                  fontSize: "13px",
                  color: "#cbd5e1"
                }}
              >
                Owned by{" "}
                <strong style={{ color: property.ownerColor || "#818cf8" }}>
                  {property.ownerName || property.owner}
                </strong>
                {property.isMortgaged ? " (Mortgaged)" : ""}
              </p>
            )}

            {isMyTurn && isOwner && (
              <div className="property-actions">
                {canBuild && (
                  <button
                    className="action-btn build-btn"
                    onClick={() => onBuild(property.id)}
                  >
                    Build {(property.houses || 0) === 4 ? "Hotel 🏨" : "House 🏠"}
                  </button>
                )}

                <button
                  className="action-btn mortgage-btn"
                  onClick={() => onMortgage(property.id)}
                >
                  {property.isMortgaged ? "Unmortgage" : "Mortgage"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "10px" }}>
              {property.icon || "🎲"}
            </div>
            <p>{property.type || "SPECIAL TILE"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
