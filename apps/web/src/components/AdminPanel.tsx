import { useState, useEffect } from "react";
import type { Incident, IncidentSeverity } from "@sh/shared";
import { DEFAULT_COMPONENTS, SEVERITY_LABELS } from "@sh/shared";
import { adminApi } from "../hooks/useApi.js";

const SEVERITIES: IncidentSeverity[] = ["minor", "major", "critical"];

interface Props {
  adminKey: string;
  incident?: Incident | null;
  onDone: () => void;
  onClose: () => void;
}

export function AdminPanel({ adminKey, incident, onDone, onClose }: Props) {
  const isEdit = !!incident;

  const [title, setTitle] = useState(incident?.title ?? "");
  const [severity, setSeverity] = useState<IncidentSeverity>(incident?.severity ?? "minor");
  const [message, setMessage] = useState("");
  const [components, setComponents] = useState<string[]>(incident?.components ?? []);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTitle(incident?.title ?? "");
    setSeverity(incident?.severity ?? "minor");
    setComponents(incident?.components ?? []);
    setMessage("");
  }, [incident]);

  const toggleComponent = (id: string) => {
    setComponents((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!isEdit && !message.trim()) return;
    setSubmitting(true);
    try {
      if (isEdit) {
        await adminApi.updateIncident(adminKey, incident.id, { title, severity, components });
      } else {
        await adminApi.createIncident(adminKey, { title, severity, message, components });
      }
      onDone();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${isEdit ? "update" : "create"} incident`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0 }}>{isEdit ? "Update Incident" : "Create Incident"}</h3>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Incident title"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: "0.75rem" }}>
          <label>Affected Components</label>
          <div className="multiselect-chips">
            {DEFAULT_COMPONENTS.map((c) => (
              <span
                key={c.id}
                className={`chip ${components.includes(c.id) ? "selected" : ""}`}
                onClick={() => toggleComponent(c.id)}
              >
                {c.name}
              </span>
            ))}
          </div>
        </div>

        {!isEdit && (
          <div className="form-group" style={{ marginBottom: "0.75rem" }}>
            <label>Initial Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the incident..."
            />
          </div>
        )}

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting || !title.trim() || (!isEdit && !message.trim())}
          >
            {submitting ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save Changes" : "Create Incident")}
          </button>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
