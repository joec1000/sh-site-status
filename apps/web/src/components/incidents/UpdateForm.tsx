import { useState } from "react";
import type { IncidentStatus } from "@sh/shared";
import { INCIDENT_STATUS_LABELS } from "@sh/shared";
import { adminApi } from "../../hooks/useApi.js";
import { INCIDENT_STATUSES } from "./incidentUtils.js";

interface Props {
  incidentId: string;
  adminKey: string;
  onUpdate: () => void;
}

export function UpdateForm({ incidentId, adminKey, onUpdate }: Props) {
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
              <option key={s} value={s}>{INCIDENT_STATUS_LABELS[s]}</option>
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

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", margin: "0.75rem 0" }}>
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? "Hide" : "Show"} structured fields
        </button>
        <button className="btn btn-primary btn-sm" type="submit" disabled={submitting || !message.trim()}>
          {submitting ? "Posting..." : "Post Update"}
        </button>
      </div>

      {showAdvanced && (
        <div className="update-advanced-fields">
          {(isOngoing || isResolving) && (
            <div className="form-group">
              <label>Current Impact</label>
              <input type="text" value={currentImpact} onChange={(e) => setCurrentImpact(e.target.value)} placeholder="What is the current customer impact?" />
            </div>
          )}
          {isOngoing && (
            <>
              <div className="form-group">
                <label>Progress Since Last Update</label>
                <input type="text" value={progress} onChange={(e) => setProgress(e.target.value)} placeholder="What has changed since last update?" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>ETA (if known)</label>
                  <input type="text" value={eta} onChange={(e) => setEta(e.target.value)} placeholder="Expected resolution time" />
                </div>
                <div className="form-group">
                  <label>Risks / Unknowns</label>
                  <input type="text" value={risksUnknowns} onChange={(e) => setRisksUnknowns(e.target.value)} placeholder="Any risks or unknowns?" />
                </div>
              </div>
            </>
          )}
          {!isResolving && (
            <div className="form-group">
              <label>Next Update Time</label>
              <input type="text" value={nextUpdateTime} onChange={(e) => setNextUpdateTime(e.target.value)} placeholder="e.g. 30 minutes, 2:00 PM ET" />
            </div>
          )}
        </div>
      )}
    </form>
  );
}
