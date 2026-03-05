import { useState, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface Props {
  adminMode: boolean;
  adminKey: string;
  onToggle: () => void;
  onKeyChange: (key: string) => void;
  onCreateIncident: () => void;
  onDataChange: () => void;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function exportFilename() {
  const d = new Date();
  return `export_${d.getFullYear()}${pad(d.getDate())}${pad(d.getMonth() + 1)}_${pad(d.getHours())}${pad(d.getMinutes())}.json`;
}

export function AdminBar({ adminMode, adminKey, onToggle, onKeyChange, onCreateIncident, onDataChange }: Props) {
  const [showKey, setShowKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/data/export`, {
        headers: { "x-admin-key": adminKey },
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Export failed");

      const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportFilename();
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export failed");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.components || !data.incidents) {
        throw new Error("Invalid export file: missing components or incidents");
      }
      if (!confirm(`Import ${data.incidents.length} incident(s) and overwrite current data?`)) return;

      const res = await fetch(`${API_BASE}/api/data/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ components: data.components, incidents: data.incidents }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Import failed");
      onDataChange();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Import failed");
    } finally {
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
          <>
            <span className="admin-bar-divider" />
            <button className="btn btn-primary btn-sm" onClick={onCreateIncident}>
              + Create Incident
            </button>
          </>
        )}
      </div>

      {adminMode && (
        <div className="admin-bar-right">
          <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()} title="Import data from file">
            <span className="material-icons" style={{ fontSize: "0.85rem", verticalAlign: "middle" }}>upload</span> Import
          </button>
          <span className="admin-bar-divider" />
          <button className="btn btn-primary btn-sm" onClick={handleExport} title="Export all data">
            <span className="material-icons" style={{ fontSize: "0.85rem", verticalAlign: "middle" }}>download</span> Export
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: "none" }}
          />

          <span className="admin-bar-divider" />
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
