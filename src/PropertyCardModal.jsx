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

  const typeLower = (property.type || "").toLowerCase();
  const isOwnable = ["prop", "property", "utility", "airport", "railroad"].includes(typeLower);

  if (!isOwnable) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          <h2>{property.name}</h2>
          <p style={{ margin: "20px 0", color: "#9ca3af", textAlign: "center" }}>
            This is a special tile and cannot be owned.
          </p>
        </div>
      </div>
    );
  }

  const isOwner = property.ownerId === currentPlayer?.id;
  const canInteract = gameState?.isMyTurn && isOwner;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header" style={{ borderBottom: `4px solid ${property.ownerColor || "#3b82f6"}` }}>
          <h2>{property.name}</h2>
          <p>{property.countryCode ? `Country: ${property.countryCode}` : "Utility / Facility"}</p>
        </div>

        <div className="modal-body">
          <div className="info-row">
            <span>Purchase Price:</span>
            <strong>${property.price || 150}</strong>
          </div>

          <div className="info-row">
            <span>Owner:</span>
            <strong>{property.ownerName || "Unowned"}</strong>
          </div>

          {property.houses > 0 && (
            <div className="info-row">
              <span>Buildings:</span>
              <strong>{property.houses === 5 ? "1 Hotel 🏨" : `${property.houses} House(s) 🏠`}</strong>
            </div>
          )}

          {property.rent && (
            <div className="rent-table">
              <h4>Rent Schedule</h4>
              <ul>
                <li>Base Rent: ${property.rent[0]}</li>
                <li>1 House: ${property.rent[1]}</li>
                <li>2 Houses: ${property.rent[2]}</li>
                <li>3 Houses: ${property.rent[3]}</li>
                <li>4 Houses: ${property.rent[4]}</li>
                <li>Hotel: ${property.rent[5]}</li>
              </ul>
            </div>
          )}

          {canInteract && (
            <div className="modal-actions" style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              {typeLower === "prop" && property.houses < 5 && (
                <button 
                  className="action-btn build-btn" 
                  onClick={() => onBuild(property.id)}
                  style={{ flex: 1, padding: "8px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  Build (${property.houseCost || 100})
                </button>
              )}
              <button 
                className="action-btn mortgage-btn" 
                onClick={() => onMortgage(property.id)}
                style={{ flex: 1, padding: "8px", background: property.isMortgaged ? "#3b82f6" : "#ef4444", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
              >
                {property.isMortgaged ? "Unmortgage" : "Mortgage"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
