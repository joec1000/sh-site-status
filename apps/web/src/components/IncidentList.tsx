import { useState, useEffect, useRef } from "react";
import type { Incident, IncidentStatus } from "@sh/shared";
import { SEVERITY_LABELS, INCIDENT_STATUS_LABELS, DEFAULT_COMPONENTS } from "@sh/shared";
import { adminApi } from "../hooks/useApi.js";

const INCIDENT_STATUSES: IncidentStatus[] = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
];

interface Props {
  incidents: Incident[];
  loading: boolean;
  adminMode: boolean;
  adminKey: string;
  onUpdate: () => void;
  onEditIncident: (incident: Incident) => void;
}

export function IncidentList({ incidents, loading, adminMode, adminKey, onUpdate, onEditIncident }: Props) {
  const sorted = [...incidents].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const didAutoExpand = useRef(false);

  useEffect(() => {
    if (sorted.length === 0) return;
    if (!didAutoExpand.current) {
      didAutoExpand.current = true;
      setExpandedId(sorted[0].id);
    } else if (expandedId && !sorted.find((i) => i.id === expandedId)) {
      // expanded incident was deleted — fall back to first
      setExpandedId(sorted[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidents]);

  if (loading && sorted.length === 0) {
    return (
      <section className="incidents-section">
        <h2>Incidents</h2>
        <div className="no-incidents">Loading incidents...</div>
      </section>
    );
  }

  return (
    <section className="incidents-section">
      <h2>Incidents</h2>
      {sorted.length === 0 ? (
        <div className="no-incidents">No incidents reported</div>
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
    <div className="incident-card">
      <div
        className="incident-header"
        style={{ cursor: "pointer" }}
        onClick={onToggle}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", marginTop: "0.2rem", color: "#666", flexShrink: 0 }}>
            {expanded ? "▼" : "▶"}
          </span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
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
            {incident.components.length > 0 && (
              <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.3rem" }}>
                {incident.components.map((id) => {
                  const name = DEFAULT_COMPONENTS.find((c) => c.id === id)?.name ?? id;
                  return (
                    <span key={id} style={{ fontSize: "0.7rem", background: "#f0f0f0", color: "#555", borderRadius: "4px", padding: "0.1rem 0.4rem" }}>
                      {name}
                    </span>
                  );
                })}
              </div>
            )}
            {latestUpdate && !expanded && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", marginTop: "0.25rem" }}>
                <p className="timeline-message" style={{ margin: 0 }}>
                  {latestUpdate.message}
                </p>
                <span style={{ fontSize: "0.75rem", color: "#888", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {formatTime(latestUpdate.createdAt)}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="incident-meta">
          <span
            className={`severity-badge ${incident.severity}`}
            style={incident.status === "resolved" ? { opacity: 0.35, filter: "grayscale(1)" } : undefined}
          >
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

      {expanded && (
        <>
          <div className="incident-timeline">
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
        </>
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
  update: { id: string; status: IncidentStatus; message: string; createdAt: string };
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

  return (
    <div className="timeline-entry">
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
          <span className="timeline-status">
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
              {saving ? "…" : "Save"}
            </button>
            <button className="btn btn-sm" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <p className="timeline-message" style={{ margin: 0 }}>{update.message}</p>
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
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await adminApi.postUpdate(adminKey, incidentId, { status, message });
      setMessage("");
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="update-form" onSubmit={handleSubmit}>
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
