import { useState } from "react";
import type { Incident } from "@sh/shared";
import { SEVERITY_LABELS, INCIDENT_STATUS_LABELS, DEFAULT_COMPONENTS, COMMUNICATION_MATRIX } from "@sh/shared";
import { adminApi } from "../../hooks/useApi.js";
import { SEVERITY_COLOR, formatTime, buildResolutionSlackTemplate } from "./incidentUtils.js";
import { TimelineEntry } from "./TimelineEntry.js";
import { SlackMessageModal } from "./SlackMessageModal.js";

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
  const [expanded, setExpanded] = useState(false);
  const [showSlackModal, setShowSlackModal] = useState(false);
  const sevColor = SEVERITY_COLOR[incident.severity] ?? "low";
  const commInfo = COMMUNICATION_MATRIX[incident.severity];

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
        <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0, alignItems: "center" }}>
          <button className="btn btn-sm btn-secondary" onClick={handleReopen} disabled={reopening} title="Reopen this incident">
            <span className="material-icons" style={{ fontSize: "0.85rem" }}>replay</span>
            {reopening ? "Reopening..." : "Reopen"}
          </button>
          <button className="btn-icon" title="Edit incident" onClick={onEdit} style={{ opacity: 0.5 }}>
            <span className="material-icons" style={{ fontSize: "0.95rem" }}>edit</span>
          </button>
          <button className="btn-icon btn-danger" title="Delete incident" onClick={() => setShowDeleteModal(true)} style={{ opacity: 1, color: "var(--color-red)" }}>
            <span className="material-icons" style={{ fontSize: "0.95rem" }}>delete</span>
          </button>
          <button className="btn-icon" title="View details" onClick={() => setExpanded(!expanded)} style={{ opacity: 0.5 }}>
            <span className="material-icons" style={{ fontSize: "1.1rem", transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "none" }}>expand_more</span>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="incident-body">
          <div className="incident-details">
            {incident.impact && (
              <div className="detail-row">
                <span className="detail-label">Impact</span>
                <span className="detail-value">{incident.impact}</span>
              </div>
            )}
            {incident.systems && (
              <div className="detail-row">
                <span className="detail-label">Systems</span>
                <span className="detail-value">{incident.systems}</span>
              </div>
            )}
            {incident.owner && (
              <div className="detail-row">
                <span className="detail-label">Owner</span>
                <span className="detail-value">
                  {incident.owner}
                  {incident.commsLead && ` (Comms Lead: ${incident.commsLead})`}
                </span>
              </div>
            )}
            {commInfo && (
              <div className="detail-row">
                <span className="detail-label">Comms</span>
                <span className="detail-value comm-info">
                  {commInfo.channels} &middot; {commInfo.frequency}
                </span>
              </div>
            )}
            {incident.customerImpactWindow && (
              <div className="detail-row">
                <span className="detail-label">Impact Window</span>
                <span className="detail-value">{incident.customerImpactWindow}</span>
              </div>
            )}
            {incident.rootCause && (
              <div className="detail-row">
                <span className="detail-label">Root Cause</span>
                <span className="detail-value">{incident.rootCause}</span>
              </div>
            )}
            {incident.followUps && incident.followUps.length > 0 && (
              <div className="detail-row">
                <span className="detail-label">Follow-ups</span>
                <ul className="detail-followups">
                  {incident.followUps.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
            {incident.components.length > 0 && (
              <div className="detail-row">
                <span className="detail-label">Components</span>
                <div className="incident-components">
                  {incident.components.map((id) => {
                    const name = DEFAULT_COMPONENTS.find((c) => c.id === id)?.name ?? id;
                    return <span key={id} className="incident-component-chip">{name}</span>;
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="incident-timeline">
            <h4 className="timeline-title">Timeline</h4>
            {incident.updates.map((u) => (
              <TimelineEntry key={u.id} update={u} incidentId={incident.id} adminMode={true} adminKey={adminKey} onUpdate={onUpdate} />
            ))}
          </div>

          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setShowSlackModal(true)}
            style={{ marginTop: "0.75rem" }}
          >
            <span className="material-icons" style={{ fontSize: "0.85rem" }}>send</span>
            Post Resolution to Slack
          </button>
        </div>
      )}

      {showSlackModal && (
        <SlackMessageModal
          initialMessage={buildResolutionSlackTemplate(incident)}
          statusDot="green"
          onClose={() => setShowSlackModal(false)}
        />
      )}

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
