import { useState, useEffect, useRef } from "react";
import type { Incident, IncidentStatus, IncidentUpdate as IncidentUpdateType } from "@sh/shared";
import { SEVERITY_LABELS, INCIDENT_STATUS_LABELS, DEFAULT_COMPONENTS, COMMUNICATION_MATRIX } from "@sh/shared";
import { adminApi } from "../hooks/useApi.js";

const INCIDENT_STATUSES: IncidentStatus[] = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
];

const SEVERITY_COLOR: Record<string, string> = {
  sev1: "critical",
  sev2: "high",
  sev3: "medium",
  sev4: "low",
  sev5: "lowest",
};

interface Props {
  incidents: Incident[];
  loading: boolean;
  adminMode: boolean;
  adminKey: string;
  onUpdate: () => void;
  onEditIncident: (incident: Incident) => void;
}

export function IncidentList({ incidents, loading, adminMode, adminKey, onUpdate, onEditIncident }: Props) {
  const active = incidents.filter((i) => i.status !== "resolved");
  const resolved = incidents.filter((i) => i.status === "resolved");

  const sorted = [...active].sort((a, b) => {
    const latestA = a.updates.length ? a.updates[a.updates.length - 1].createdAt : a.updatedAt;
    const latestB = b.updates.length ? b.updates[b.updates.length - 1].createdAt : b.updatedAt;
    return new Date(latestB).getTime() - new Date(latestA).getTime();
  });

  const resolvedSorted = [...resolved].sort((a, b) => {
    return new Date(b.resolvedAt ?? b.updatedAt).getTime() - new Date(a.resolvedAt ?? a.updatedAt).getTime();
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const didAutoExpand = useRef(false);

  useEffect(() => {
    if (sorted.length === 0) return;
    if (!didAutoExpand.current) {
      didAutoExpand.current = true;
      setExpandedId(sorted[0].id);
    } else if (expandedId && !incidents.find((i) => i.id === expandedId)) {
      setExpandedId(sorted[0]?.id ?? resolvedSorted[0]?.id ?? null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidents]);

  if (loading && incidents.length === 0) {
    return (
      <section className="incidents-section">
        <h2>Incidents</h2>
        <div className="no-incidents">Loading incidents...</div>
      </section>
    );
  }

  return (
    <>
      {/* Active Incidents */}
      <section className="incidents-section">
        <h2>Active Incidents</h2>
        {sorted.length === 0 ? (
          <div className="no-incidents">
            <span className="no-incidents-icon">{"\u2705"}</span>
            No active incidents
          </div>
        ) : (
          sorted.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              expanded={expandedId === incident.id}
              onToggle={() =>
                setExpandedId(expandedId === incident.id ? null : incident.id)
              }
              adminMode={adminMode}
              adminKey={adminKey}
              onUpdate={onUpdate}
              onEdit={() => onEditIncident(incident)}
            />
          ))
        )}
      </section>

    </>
  );
}

function IncidentCard({
  incident,
  expanded,
  onToggle,
  adminMode,
  adminKey,
  onUpdate,
  onEdit,
}: {
  incident: Incident;
  expanded: boolean;
  onToggle: () => void;
  adminMode: boolean;
  adminKey: string;
  onUpdate: () => void;
  onEdit: () => void;
}) {
  const latestUpdate = incident.updates[incident.updates.length - 1];
  const isResolved = incident.status === "resolved";
  const sevColor = SEVERITY_COLOR[incident.severity] ?? "low";
  const commInfo = COMMUNICATION_MATRIX[incident.severity];

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete incident "${incident.title}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteIncident(adminKey, incident.id);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className={`incident-card ${isResolved ? "resolved" : ""}`}>
      {/* Header */}
      <div
        className="incident-header"
        style={{ cursor: "pointer" }}
        onClick={onToggle}
      >
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
            {/* Incident metadata line */}
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
            {/* Affected components */}
            {incident.components.length > 0 && (
              <div className="incident-components">
                {incident.components.map((id) => {
                  const name = DEFAULT_COMPONENTS.find((c) => c.id === id)?.name ?? id;
                  return (
                    <span key={id} className="incident-component-chip">
                      {name}
                    </span>
                  );
                })}
              </div>
            )}
            {/* Collapsed preview */}
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
          {adminMode && (
            <button
              className="btn-icon"
              title="Delete incident"
              onClick={handleDelete}
              style={{ opacity: 0.4, color: "#666" }}
            >
              <span className="material-icons" style={{ fontSize: "1.1rem" }}>delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="incident-body">
          {/* Incident details panel */}
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
                  {incident.followUps.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="incident-timeline">
            <h4 className="timeline-title">Timeline</h4>
            {incident.updates.map((u) => (
              <TimelineEntry
                key={u.id}
                update={u}
                incidentId={incident.id}
                adminMode={adminMode}
                adminKey={adminKey}
                onUpdate={onUpdate}
              />
            ))}
          </div>

          {adminMode && (
            <UpdateForm
              incidentId={incident.id}
              adminKey={adminKey}
              onUpdate={onUpdate}
            />
          )}
        </div>
      )}
    </div>
  );
}

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function TimelineEntry({
  update,
  incidentId,
  adminMode,
  adminKey,
  onUpdate,
}: {
  update: IncidentUpdateType;
  incidentId: string;
  adminMode: boolean;
  adminKey: string;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftMessage, setDraftMessage] = useState(update.message);
  const [draftTime, setDraftTime] = useState(isoToDatetimeLocal(update.createdAt));
  const [draftStatus, setDraftStatus] = useState<IncidentStatus>(update.status);
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setDraftMessage(update.message);
    setDraftTime(isoToDatetimeLocal(update.createdAt));
    setDraftStatus(update.status);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!draftMessage.trim()) { setEditing(false); return; }
    setSaving(true);
    try {
      const createdAt = new Date(draftTime).toISOString();
      await adminApi.editUpdate(adminKey, incidentId, update.id, draftMessage.trim(), createdAt, draftStatus);
      onUpdate();
      setEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Edit failed");
    } finally {
      setSaving(false);
    }
  };

  const isResolved = update.status === "resolved";

  return (
    <div className={`timeline-entry ${isResolved ? "resolved" : ""}`}>
      <div className="timeline-entry-header">
        {editing ? (
          <select
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value as IncidentStatus)}
            style={{ fontSize: "0.8rem" }}
          >
            {INCIDENT_STATUSES.map((s) => (
              <option key={s} value={s}>{INCIDENT_STATUS_LABELS[s]}</option>
            ))}
          </select>
        ) : (
          <span className={`timeline-status ${update.status}`}>
            {INCIDENT_STATUS_LABELS[update.status]}
          </span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <span className="timeline-time">{formatTime(update.createdAt)}</span>
          {adminMode && !editing && (
            <button
              className="btn-icon"
              title="Edit"
              onClick={startEditing}
              style={{ opacity: 0.4, padding: 0, lineHeight: 1 }}
            >
              <span className="material-icons" style={{ fontSize: "0.95rem" }}>edit</span>
            </button>
          )}
        </div>
      </div>
      {editing ? (
        <>
          <input
            type="datetime-local"
            value={draftTime}
            onChange={(e) => setDraftTime(e.target.value)}
            style={{ fontSize: "0.8rem", marginTop: "0.35rem", marginBottom: "0.25rem" }}
          />
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="text"
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
              style={{ flex: 1, fontSize: "0.875rem" }}
              autoFocus
            />
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? "\u2026" : "Save"}
            </button>
            <button className="btn btn-sm" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="timeline-message">{update.message}</p>
          {/* Show structured update fields if present */}
          {(update.currentImpact || update.progress || update.eta || update.risksUnknowns) && (
            <div className="timeline-structured">
              {update.currentImpact && (
                <div className="structured-field">
                  <span className="structured-label">Current Impact:</span> {update.currentImpact}
                </div>
              )}
              {update.progress && (
                <div className="structured-field">
                  <span className="structured-label">Progress:</span> {update.progress}
                </div>
              )}
              {update.eta && (
                <div className="structured-field">
                  <span className="structured-label">ETA:</span> {update.eta}
                </div>
              )}
              {update.risksUnknowns && (
                <div className="structured-field">
                  <span className="structured-label">Risks/Unknowns:</span> {update.risksUnknowns}
                </div>
              )}
            </div>
          )}
          {update.nextUpdateTime && (
            <div className="timeline-next-update">
              Next update: {update.nextUpdateTime}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function UpdateForm({
  incidentId,
  adminKey,
  onUpdate,
}: {
  incidentId: string;
  adminKey: string;
  onUpdate: () => void;
}) {
  const [status, setStatus] = useState<IncidentStatus>("identified");
  const [message, setMessage] = useState("");
  const [currentImpact, setCurrentImpact] = useState("");
  const [progress, setProgress] = useState("");
  const [eta, setEta] = useState("");
  const [risksUnknowns, setRisksUnknowns] = useState("");
  const [nextUpdateTime, setNextUpdateTime] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isOngoing = status !== "resolved" && status !== "investigating";
  const isResolving = status === "resolved";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await adminApi.postUpdate(adminKey, incidentId, {
        status,
        message,
        ...(currentImpact ? { currentImpact } : {}),
        ...(progress ? { progress } : {}),
        ...(eta ? { eta } : {}),
        ...(risksUnknowns ? { risksUnknowns } : {}),
        ...(nextUpdateTime ? { nextUpdateTime } : {}),
      });
      setMessage("");
      setCurrentImpact("");
      setProgress("");
      setEta("");
      setRisksUnknowns("");
      setNextUpdateTime("");
      setShowAdvanced(false);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="update-form" onSubmit={handleSubmit}>
      <h4 className="update-form-title">Post Update</h4>
      <div className="form-row">
        <div className="form-group">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as IncidentStatus)}>
            {INCIDENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {INCIDENT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label>Message</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Update message..."
          />
        </div>
      </div>

      {/* Toggle for structured fields */}
      <button
        type="button"
        className="btn btn-sm btn-secondary"
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={{ marginBottom: "0.5rem" }}
      >
        {showAdvanced ? "Hide" : "Show"} structured fields
      </button>

      {showAdvanced && (
        <div className="update-advanced-fields">
          {(isOngoing || isResolving) && (
            <div className="form-group">
              <label>Current Impact</label>
              <input
                type="text"
                value={currentImpact}
                onChange={(e) => setCurrentImpact(e.target.value)}
                placeholder="What is the current customer impact?"
              />
            </div>
          )}
          {isOngoing && (
            <>
              <div className="form-group">
                <label>Progress Since Last Update</label>
                <input
                  type="text"
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                  placeholder="What has changed since last update?"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>ETA (if known)</label>
                  <input
                    type="text"
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    placeholder="Expected resolution time"
                  />
                </div>
                <div className="form-group">
                  <label>Risks / Unknowns</label>
                  <input
                    type="text"
                    value={risksUnknowns}
                    onChange={(e) => setRisksUnknowns(e.target.value)}
                    placeholder="Any risks or unknowns?"
                  />
                </div>
              </div>
            </>
          )}
          {!isResolving && (
            <div className="form-group">
              <label>Next Update Time</label>
              <input
                type="text"
                value={nextUpdateTime}
                onChange={(e) => setNextUpdateTime(e.target.value)}
                placeholder="e.g. 30 minutes, 2:00 PM ET"
              />
            </div>
          )}
        </div>
      )}

      <button className="btn btn-primary btn-sm" type="submit" disabled={submitting || !message.trim()}>
        {submitting ? "Posting..." : "Post Update"}
      </button>
    </form>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
