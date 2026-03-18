import { useState } from "react";
import type { IncidentStatus, IncidentUpdate as IncidentUpdateType } from "@sh/shared";
import { INCIDENT_STATUS_LABELS } from "@sh/shared";
import { adminApi } from "../../hooks/useApi.js";
import { INCIDENT_STATUSES, formatTime, isoToDatetimeLocal } from "./incidentUtils.js";

interface Props {
  update: IncidentUpdateType;
  incidentId: string;
  adminMode: boolean;
  adminKey: string;
  onUpdate: () => void;
}

export function TimelineEntry({ update, incidentId, adminMode, adminKey, onUpdate }: Props) {
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
