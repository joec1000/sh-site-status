import { useState } from "react";
import type { Incident } from "@sh/shared";
import { useStatus, useIncidents } from "./hooks/useApi.js";
import { StatusHeader } from "./components/StatusHeader.js";
import { ComponentCards } from "./components/ComponentCards.js";
import { IncidentList } from "./components/IncidentList.js";
import { AdminBar } from "./components/AdminBar.js";
import { AdminPanel } from "./components/AdminPanel.js";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_URL || "";

export function App() {
  const { status, loading, error, refresh: refreshStatus, lastRefreshed } = useStatus();
  const { incidents, loading: incidentsLoading, refresh: refreshIncidents } = useIncidents();
  const [adminMode, setAdminMode] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [panelIncident, setPanelIncident] = useState<Incident | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginKey, setLoginKey] = useState(() => localStorage.getItem("adminKey") ?? "");
  const [loginError, setLoginError] = useState("");
  const [showLoginKey, setShowLoginKey] = useState(false);

  const refresh = () => {
    refreshStatus();
    refreshIncidents();
  };

  const openCreate = () => { setPanelIncident(null); setShowPanel(true); };
  const openEdit = (incident: Incident) => { setPanelIncident(incident); setShowPanel(true); };
  const closePanel = () => setShowPanel(false);

  const handleAdminLogin = async () => {
    setLoginError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": loginKey },
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem("adminKey", loginKey);
        setAdminKey(loginKey);
        setAdminMode(true);
        setShowLoginPrompt(false);
        setLoginKey("");
      } else {
        setLoginError("Invalid admin key");
      }
    } catch {
      setLoginError("Could not verify key");
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("adminKey");
    setAdminMode(false);
    setAdminKey("");
  };

  if (loading && !status) {
    return (
      <div className="page">
        <div className="container loading-container">
          <div className="spinner" />
          <p>Loading system status...</p>
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="page">
        <div className="container error-container">
          <p className="error-text">Failed to load status: {error}</p>
          <button className="btn btn-primary" onClick={refresh}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <StatusHeader overall={status?.overall ?? "operational"} lastRefreshed={lastRefreshed} onRefresh={refresh} adminMode={adminMode} />

      <div className="container">
        <ComponentCards
          components={status?.components ?? []}
          adminMode={adminMode}
          adminKey={adminKey}
          onUpdate={refresh}
        />

        {adminMode && showPanel && (
          <AdminPanel
            adminKey={adminKey}
            incident={panelIncident}
            onDone={refresh}
            onClose={closePanel}
          />
        )}

        <div style={{ paddingBottom: adminMode ? "5rem" : "2rem" }}>
          <IncidentList
            incidents={incidents}
            loading={incidentsLoading}
            adminMode={adminMode}
            adminKey={adminKey}
            onUpdate={refresh}
            onEditIncident={openEdit}
          />
        </div>

        {adminMode ? (
          <AdminBar
            adminMode={adminMode}
            adminKey={adminKey}
            onToggle={handleAdminLogout}
            onKeyChange={setAdminKey}
            onCreateIncident={openCreate}
            onDataChange={refresh}
          />
        ) : (
          <>
            <button
              className="admin-lock-btn"
              onClick={() => setShowLoginPrompt(true)}
              title="Admin login"
            >
              <span className="material-icons">lock</span>
            </button>

            {showLoginPrompt && (
              <div className="admin-login-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowLoginPrompt(false); }}>
                <div className="admin-login-dialog">
                  <h3>Admin Login</h3>
                  <p>Enter the admin key to manage this status page.</p>
                  <div className="admin-key-field">
                    <input
                      type={showLoginKey ? "text" : "password"}
                      placeholder="Admin key..."
                      value={loginKey}
                      onChange={(e) => setLoginKey(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAdminLogin(); }}
                      autoFocus
                    />
                    <button type="button" className="admin-key-toggle" onClick={() => setShowLoginKey(!showLoginKey)}>
                      <span className="material-icons" style={{ fontSize: "1rem" }}>{showLoginKey ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                  {loginError && <p className="admin-login-error">{loginError}</p>}
                  <div className="admin-login-actions">
                    <button className="btn btn-primary" onClick={handleAdminLogin}>
                      Login
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowLoginPrompt(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
