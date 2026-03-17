import { useState, useEffect } from "react";
import type { Incident, IncidentSeverity } from "@sh/shared";
import { DEFAULT_COMPONENTS, SEVERITY_LABELS, SEVERITY_DESCRIPTIONS } from "@sh/shared";
import { adminApi } from "../hooks/useApi.js";

const SEVERITIES: IncidentSeverity[] = ["sev1", "sev2", "sev3", "sev4", "sev5"];

interface Props {
  adminKey: string;
  incident?: Incident | null;
  onDone: () => void;
  onClose: () => void;
}

export function AdminPanel({ adminKey, incident, onDone, onClose }: Props) {
  const isEdit = !!incident;

  const [title, setTitle] = useState(incident?.title ?? "");
  const [severity, setSeverity] = useState<IncidentSeverity>(incident?.severity ?? "sev3");
  const [message, setMessage] = useState("");
  const [components, setComponents] = useState<string[]>(incident?.components ?? []);
  const [owner, setOwner] = useState(incident?.owner ?? "");
  const [commsLead, setCommsLead] = useState(incident?.commsLead ?? "");
  const [impact, setImpact] = useState(incident?.impact ?? "");
  const [systems, setSystems] = useState(incident?.systems ?? "");
  const [actions, setActions] = useState(incident?.actions ?? "");
  const [nextUpdateTime, setNextUpdateTime] = useState(incident?.nextUpdateTime ?? "");
  // Resolved-only fields (edit mode)
  const [customerImpactWindow, setCustomerImpactWindow] = useState(incident?.customerImpactWindow ?? "");
  const [rootCause, setRootCause] = useState(incident?.rootCause ?? "");
  const [followUpsText, setFollowUpsText] = useState(incident?.followUps?.join("\n") ?? "");
  const [submitting, setSubmitting] = useState(false);

  const isResolved = incident?.status === "resolved";

  useEffect(() => {
    setTitle(incident?.title ?? "");
    setSeverity(incident?.severity ?? "sev3");
    setComponents(incident?.components ?? []);
    setOwner(incident?.owner ?? "");
    setCommsLead(incident?.commsLead ?? "");
    setImpact(incident?.impact ?? "");
    setSystems(incident?.systems ?? "");
    setActions(incident?.actions ?? "");
    setNextUpdateTime(incident?.nextUpdateTime ?? "");
    setCustomerImpactWindow(incident?.customerImpactWindow ?? "");
    setRootCause(incident?.rootCause ?? "");
    setFollowUpsText(incident?.followUps?.join("\n") ?? "");
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
        const followUps = followUpsText.trim()
          ? followUpsText.split("\n").map((l) => l.trim()).filter(Boolean)
          : undefined;
        await adminApi.updateIncident(adminKey, incident.id, {
          title, severity, components, owner, commsLead, impact, systems, actions, nextUpdateTime,
          ...(isResolved ? { customerImpactWindow, rootCause, followUps } : {}),
        });
      } else {
        await adminApi.createIncident(adminKey, {
          title, severity, message, components, owner, commsLead, impact, systems, actions, nextUpdateTime,
        });
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
        <h3 style={{ margin: 0 }}>{isEdit ? "Update Incident" : "Declare Incident"}</h3>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
      </div>
      <form onSubmit={handleSubmit}>
        {/* Row 1: Title + Severity */}
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Checkout API unavailable"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{SEVERITY_LABELS[s]} - {SEVERITY_DESCRIPTIONS[s]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Owner + Comms Lead */}
        <div className="form-row">
          <div className="form-group">
            <label>Owner (IC Name)</label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Incident Commander name"
            />
          </div>
          <div className="form-group">
            <label>Comms Lead</label>
            <input
              type="text"
              value={commsLead}
              onChange={(e) => setCommsLead(e.target.value)}
              placeholder="Communications Lead name"
            />
          </div>
        </div>

        {/* Row 3: Impact + Systems */}
        <div className="form-group" style={{ marginBottom: "0.75rem" }}>
          <label>Impact (what customers/users are experiencing)</label>
          <input
            type="text"
            value={impact}
            onChange={(e) => setImpact(e.target.value)}
            placeholder="e.g. Customers unable to complete transactions"
          />
        </div>

        <div className="form-group" style={{ marginBottom: "0.75rem" }}>
          <label>Systems (what is impacted, what is not)</label>
          <input
            type="text"
            value={systems}
            onChange={(e) => setSystems(e.target.value)}
            placeholder="e.g. Checkout API down; PLP/PDP unaffected"
          />
        </div>

        {/* Affected Components */}
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

        {/* Actions + Next Update */}
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>Actions (what we are doing right now)</label>
            <input
              type="text"
              value={actions}
              onChange={(e) => setActions(e.target.value)}
              placeholder="e.g. Engineering teams investigating root cause"
            />
          </div>
          <div className="form-group">
            <label>Next Update Time</label>
            <input
              type="text"
              value={nextUpdateTime}
              onChange={(e) => setNextUpdateTime(e.target.value)}
              placeholder="e.g. 30 minutes, 2:00 PM ET"
            />
          </div>
        </div>

        {/* Initial message (create only) */}
        {!isEdit && (
          <div className="form-group" style={{ marginBottom: "0.75rem" }}>
            <label>Initial Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the incident and initial actions being taken..."
            />
          </div>
        )}

        {/* Resolved fields (edit mode, resolved incidents only) */}
        {isEdit && isResolved && (
          <div className="resolved-fields">
            <h4 className="resolved-fields-title">Resolution Details</h4>
            <div className="form-group" style={{ marginBottom: "0.75rem" }}>
              <label>Customer Impact Window (start - end)</label>
              <input
                type="text"
                value={customerImpactWindow}
                onChange={(e) => setCustomerImpactWindow(e.target.value)}
                placeholder="e.g. 10:12 AM - 11:00 AM ET"
              />
            </div>
            <div className="form-group" style={{ marginBottom: "0.75rem" }}>
              <label>Root Cause (initial, 1-2 lines or "pending PIR")</label>
              <input
                type="text"
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="e.g. Database connection pool exhaustion"
              />
            </div>
            <div className="form-group" style={{ marginBottom: "0.75rem" }}>
              <label>Follow-ups (one per line, with owners/dates)</label>
              <textarea
                value={followUpsText}
                onChange={(e) => setFollowUpsText(e.target.value)}
                placeholder={"e.g.\nIncrease connection pool limits - @jsmith by 2026-03-20\nAdd connection pool monitoring alert - @doe by 2026-03-22\nSchedule PIR meeting - @manager by 2026-03-18"}
                rows={4}
              />
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting || !title.trim() || (!isEdit && !message.trim())}
          >
            {submitting ? (isEdit ? "Saving..." : "Declaring...") : (isEdit ? "Save Changes" : "Declare Incident")}
          </button>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
