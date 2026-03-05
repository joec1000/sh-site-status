import { useState } from "react";
import type { Incident } from "@sh/shared";
import { useStatus, useIncidents } from "./hooks/useApi.js";
import { StatusHeader } from "./components/StatusHeader.js";
import { ComponentCards } from "./components/ComponentCards.js";
import { IncidentList } from "./components/IncidentList.js";
import { AdminBar } from "./components/AdminBar.js";
import { AdminPanel } from "./components/AdminPanel.js";
import "./styles.css";

export function App() {
  const { status, loading, error, refresh: refreshStatus, lastRefreshed } = useStatus();
  const { incidents, loading: incidentsLoading, refresh: refreshIncidents } = useIncidents();
  const [adminMode, setAdminMode] = useState(false);
  const [adminKey, setAdminKey] = useState("dev-secret-key");
  const [panelIncident, setPanelIncident] = useState<Incident | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  const refresh = () => {
    refreshStatus();
    refreshIncidents();
  };

  const openCreate = () => { setPanelIncident(null); setShowPanel(true); };
  const openEdit = (incident: Incident) => { setPanelIncident(incident); setShowPanel(true); };
  const closePanel = () => setShowPanel(false);

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
      <StatusHeader overall={status?.overall ?? "operational"} lastRefreshed={lastRefreshed} onRefresh={refresh} />

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

        <div style={{ paddingBottom: "5rem" }}>
          <IncidentList
            incidents={incidents}
            loading={incidentsLoading}
            adminMode={adminMode}
            adminKey={adminKey}
            onUpdate={refresh}
            onEditIncident={openEdit}
          />
        </div>

        <AdminBar
          adminMode={adminMode}
          adminKey={adminKey}
          onToggle={() => setAdminMode(!adminMode)}
          onKeyChange={setAdminKey}
          onCreateIncident={openCreate}
          onDataChange={refresh}
        />
      </div>
    </div>
  );
}
