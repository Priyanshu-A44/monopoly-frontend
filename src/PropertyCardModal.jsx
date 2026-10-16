import React from "react";

const RENT_LABELS = ["Base rent", "1 house", "2 houses", "3 houses", "4 houses", "Hotel"];
const AIRPORT_LABELS = ["1 airport", "2 airports", "3 airports", "4 airports"];

export default function PropertyCardModal({ property, onClose, currentPlayer, gameState, onBuild, onMortgage }) {
  if (!property) return null;

  const ownable = ["prop", "airport", "utility"].includes(property.type);
  const isOwner = !!property.ownerId && property.ownerId === currentPlayer?.id;
  const canAct = isOwner && gameState?.isMyTurn;
  const houses = property.houses || 0;
  const isCity = property.type === "prop";

  const mortgageValue = Math.round((property.price || 0) / 2);
  const unmortgageCost = Math.round(mortgageValue * 1.1);
  const labels = property.type === "airport" ? AIRPORT_LABELS : RENT_LABELS;

  return (
    <div className="pcm-overlay" onClick={onClose}>
      <div className="pcm-card" onClick={(e) => e.stopPropagation()}>
        <div className="pcm-head">
          <button className="pcm-close" onClick={onClose} aria-label="Close">✕</button>
          <h3>{property.name}</h3>
          {property.price ? <small>Price ${property.price}</small> : null}
        </div>

        <div className="pcm-body">
          {!ownable && <p className="pcm-note">This is a special tile and cannot be owned.</p>}

          {ownable && (
            <>
              <div className="pcm-owner">
                {property.ownerId ? (
                  <>
                    <span className="pcm-dot" style={{ background: property.ownerColor || "#888" }} />
                    Owned by <b>{property.ownerName}</b>
                  </>
                ) : (
                  "Unowned"
                )}
                {property.isMortgaged && <span className="pcm-badge">MORTGAGED</span>}
              </div>

              {Array.isArray(property.rent) &&
                property.rent.map((r, i) => (
                  <div
                    key={i}
                    className={`pcm-row ${isCity && i === houses ? "active" : ""}`}
                  >
                    <span>{labels[i]}</span>
                    <span>${r}</span>
                  </div>
                ))}

              {property.type === "utility" && (
                <p className="pcm-note">Rent: 4× the dice roll (10× if the owner has both utilities).</p>
              )}

              {isCity && property.houseCost ? (
                <div className="pcm-row">
                  <span>House / hotel cost</span>
                  <span>${property.houseCost}</span>
                </div>
              ) : null}

              <div className="pcm-row">
                <span>Mortgage value</span>
                <span>${mortgageValue}</span>
              </div>
            </>
          )}
        </div>

        {ownable && canAct && (
          <div className="pcm-actions">
            {isCity && !property.isMortgaged && houses < 5 && (
              <button className="pcm-build" onClick={() => onBuild(property.id)}>
                {houses === 4 ? "Build hotel" : "Build house"} (${property.houseCost})
              </button>
            )}
            {property.isMortgaged ? (
              <button className="pcm-mortgage" onClick={() => onMortgage(property.id)}>
                Unmortgage (${unmortgageCost})
              </button>
            ) : (
              houses === 0 && (
                <button className="pcm-mortgage" onClick={() => onMortgage(property.id)}>
                  Mortgage (+${mortgageValue})
                </button>
              )
            )}
          </div>
        )}

        {ownable && isOwner && !gameState?.isMyTurn && (
          <p className="pcm-note" style={{ padding: "0 16px 14px" }}>You can build or mortgage on your turn.</p>
        )}
      </div>
    </div>
  );
}
