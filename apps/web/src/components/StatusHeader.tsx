import type { ComponentStatus } from "@sh/shared";
import { STATUS_LABELS } from "@sh/shared";

const STATUS_ICONS: Record<ComponentStatus, { icon: string; color: string }> = {
  operational: { icon: "\u2705", color: "#10b981" },       // green check
  degraded: { icon: "\u26a0\ufe0f", color: "#f59e0b" },     // yellow warning
  partial_outage: { icon: "\ud83d\udfe0", color: "#f97316" }, // orange circle
  major_outage: { icon: "\ud83d\udd34", color: "#ef4444" },   // red circle
  maintenance: { icon: "\ud83d\udd27", color: "#3b82f6" },    // wrench blue
};

interface Props {
  overall: ComponentStatus;
  lastRefreshed: Date | null;
  onRefresh: () => void;
}

export function StatusHeader({ overall, lastRefreshed, onRefresh }: Props) {
  const timeStr = lastRefreshed
    ? lastRefreshed.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" })
    : null;

  const isHealthy = overall === "operational";
  const { icon } = STATUS_ICONS[overall] ?? STATUS_ICONS.operational;

  return (
    <div className={`status-header ${overall}`} style={{ position: "relative" }}>
      <div className="container">
        <div className="status-indicator-row">
          <span className="status-header-icon">{icon}</span>
          <h1>{STATUS_LABELS[overall] ?? "Unknown"}</h1>
        </div>
        <p>
          {isHealthy
            ? "All systems are running normally"
            : "Some systems are experiencing issues"}
        </p>
      </div>
      {timeStr && (
        <div className="status-refresh">
          <span>Last Refreshed:</span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            {timeStr}
            <button className="status-refresh-btn" onClick={onRefresh} title="Refresh now">
              <span className="material-icons" style={{ fontSize: "0.95rem" }}>refresh</span>
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
