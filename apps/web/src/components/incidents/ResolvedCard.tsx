import { useState } from "react";
import type { Incident } from "@sh/shared";
import { SEVERITY_LABELS, INCIDENT_STATUS_LABELS } from "@sh/shared";
import { adminApi } from "../../hooks/useApi.js";
import { SEVERITY_COLOR, formatTime } from "./incidentUtils.js";

interface Props {
  incident: Incident;
  adminKey: string;
  onUpdate: () => void;
  onEdit: () => void;
}

export function ResolvedCard({ incident, adminKey, onUpdate, onEdit }: Props) {
  const [reopening, setReopening] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const sevColor = SEVERITY_COLOR[incident.severity] ?? "low";

  const handleReopen = async () => {
    if (!confirm(`Reopen incident "${incident.title}"?`)) return;
    setReopening(true);
    try {
      await adminApi.postUpdate(adminKey, incident.id, {
        status: "investigating",
        message: "Incident reopened — investigating again.",
      });
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Reopen failed");
    } finally {
      setReopening(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteIncident(adminKey, incident.id);
      setShowDeleteModal(false);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="incident-card resolved">
      <div className="incident-header" style={{ alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span className="incident-title">{incident.title}</span>
            <span className={`severity-badge ${sevColor}`}>
              {SEVERITY_LABELS[incident.severity]}
            </span>
            <span className="incident-status-badge resolved">
              {INCIDENT_STATUS_LABELS["resolved"]}
            </span>
          </div>
          <div className="incident-meta-line">
            {incident.resolvedAt && (
              <span className="incident-meta-item">
                <span className="material-icons" style={{ fontSize: "0.8rem" }}>check_circle</span>
                Resolved {formatTime(incident.resolvedAt)}
              </span>
            )}
            {incident.owner && (
              <span className="incident-meta-item">
                <span className="material-icons" style={{ fontSize: "0.8rem" }}>person</span>
                {incident.owner}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
          <button className="btn btn-sm btn-secondary" onClick={handleReopen} disabled={reopening} title="Reopen this incident">
            <span className="material-icons" style={{ fontSize: "0.85rem" }}>replay</span>
            {reopening ? "Reopening..." : "Reopen"}
          </button>
          <button className="btn-icon" title="Edit incident" onClick={onEdit} style={{ opacity: 0.5 }}>
            <span className="material-icons" style={{ fontSize: "0.95rem" }}>edit</span>
          </button>
          <button className="btn-icon btn-danger" title="Delete incident" onClick={() => setShowDeleteModal(true)} style={{ opacity: 0.5 }}>
            <span className="material-icons" style={{ fontSize: "0.95rem" }}>delete</span>
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="admin-login-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}>
          <div className="admin-login-dialog">
            <h3>Delete Incident</h3>
            <p>Are you sure you want to permanently delete <strong>{incident.title}</strong>? This action cannot be undone.</p>
            <div className="admin-login-actions">
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
