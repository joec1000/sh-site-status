import type { Incident } from "@sh/shared";
import { SEVERITY_LABELS, INCIDENT_STATUS_LABELS, DEFAULT_COMPONENTS, COMMUNICATION_MATRIX } from "@sh/shared";
import { SEVERITY_COLOR, formatTime } from "./incidentUtils.js";
import { TimelineEntry } from "./TimelineEntry.js";
import { UpdateForm } from "./UpdateForm.js";

interface Props {
  incident: Incident;
  expanded: boolean;
  onToggle: () => void;
  adminMode: boolean;
  adminKey: string;
  onUpdate: () => void;
  onEdit: () => void;
}

export function IncidentCard({ incident, expanded, onToggle, adminMode, adminKey, onUpdate, onEdit }: Props) {
  const latestUpdate = incident.updates[incident.updates.length - 1];
  const isResolved = incident.status === "resolved";
  const sevColor = SEVERITY_COLOR[incident.severity] ?? "low";
  const commInfo = COMMUNICATION_MATRIX[incident.severity];

  return (
    <div className={`incident-card ${isResolved ? "resolved" : ""}`}>
      {/* Header */}
      <div className="incident-header" style={{ cursor: "pointer" }} onClick={onToggle}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", flex: 1, minWidth: 0 }}>
          <span className="incident-expand-icon">
            {expanded ? "\u25BC" : "\u25B6"}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span className="incident-title">{incident.title}</span>
              {adminMode && (
                <button
                  className="btn-icon"
                  title="Edit incident"
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  style={{ opacity: 0.4, padding: 0, lineHeight: 1 }}
                >
                  <span className="material-icons" style={{ fontSize: "0.95rem" }}>edit</span>
                </button>
              )}
            </div>
            <div className="incident-meta-line">
              {incident.owner && (
                <span className="incident-meta-item">
                  <span className="material-icons" style={{ fontSize: "0.8rem" }}>person</span>
                  {incident.owner}
                </span>
              )}
              {incident.startedAt && (
                <span className="incident-meta-item">
                  <span className="material-icons" style={{ fontSize: "0.8rem" }}>schedule</span>
                  {formatTime(incident.startedAt)}
                </span>
              )}
              {incident.nextUpdateTime && !isResolved && (
                <span className="incident-meta-item next-update">
                  Next update: {incident.nextUpdateTime}
                </span>
              )}
            </div>
            {incident.components.length > 0 && (
              <div className="incident-components">
                {incident.components.map((id) => {
                  const name = DEFAULT_COMPONENTS.find((c) => c.id === id)?.name ?? id;
                  return <span key={id} className="incident-component-chip">{name}</span>;
                })}
              </div>
            )}
            {latestUpdate && !expanded && (
              <div className="incident-preview">
                <span className={`incident-status-badge ${incident.status}`}>
                  {INCIDENT_STATUS_LABELS[incident.status]}
                </span>
                <p className="timeline-message">{latestUpdate.message}</p>
              </div>
            )}
          </div>
        </div>
        <div className="incident-meta">
          <span className={`severity-badge ${sevColor}`}>
            {SEVERITY_LABELS[incident.severity]}
          </span>
          <span className={`incident-status-badge ${incident.status}`}>
            {INCIDENT_STATUS_LABELS[incident.status]}
          </span>
        </div>
      </div>

      {/* Expanded content */}
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
            {incident.actions && (
              <div className="detail-row">
                <span className="detail-label">Actions</span>
                <span className="detail-value">{incident.actions}</span>
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
            {isResolved && incident.customerImpactWindow && (
              <div className="detail-row">
                <span className="detail-label">Impact Window</span>
                <span className="detail-value">{incident.customerImpactWindow}</span>
              </div>
            )}
            {isResolved && incident.rootCause && (
              <div className="detail-row">
                <span className="detail-label">Root Cause</span>
                <span className="detail-value">{incident.rootCause}</span>
              </div>
            )}
            {isResolved && incident.followUps && incident.followUps.length > 0 && (
              <div className="detail-row">
                <span className="detail-label">Follow-ups</span>
                <ul className="detail-followups">
                  {incident.followUps.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="incident-timeline">
            <h4 className="timeline-title">Timeline</h4>
            {incident.updates.map((u) => (
              <TimelineEntry key={u.id} update={u} incidentId={incident.id} adminMode={adminMode} adminKey={adminKey} onUpdate={onUpdate} />
            ))}
          </div>

          {adminMode && (
            <UpdateForm incidentId={incident.id} adminKey={adminKey} onUpdate={onUpdate} />
          )}
        </div>
      )}
    </div>
  );
}
