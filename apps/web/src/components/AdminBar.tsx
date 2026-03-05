import { useState } from "react";

interface Props {
  adminMode: boolean;
  adminKey: string;
  onToggle: () => void;
  onKeyChange: (key: string) => void;
  onCreateIncident: () => void;
}

export function AdminBar({ adminMode, adminKey, onToggle, onKeyChange, onCreateIncident }: Props) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="admin-bar">
      <div className="admin-bar-left">
        <button
          className={`btn ${adminMode ? "btn-danger" : "btn-secondary"} btn-sm`}
          onClick={onToggle}
        >
          {adminMode ? "Exit Admin" : "Admin"}
        </button>
        {adminMode && (
          <button className="btn btn-primary btn-sm" onClick={onCreateIncident}>
            + Create Incident
          </button>
        )}
      </div>

      {adminMode && (
        <div className="admin-bar-right">
          <label className="admin-key-label">Admin Key:</label>
          <div className="admin-key-field">
            <input
              type={showKey ? "text" : "password"}
              placeholder="Admin key..."
              value={adminKey}
              onChange={(e) => onKeyChange(e.target.value)}
            />
            <button
              className="admin-key-toggle"
              type="button"
              onClick={() => setShowKey(!showKey)}
              title={showKey ? "Hide key" : "Show key"}
            >
              <span className="material-icons" style={{ fontSize: "1.1rem" }}>
                {showKey ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
