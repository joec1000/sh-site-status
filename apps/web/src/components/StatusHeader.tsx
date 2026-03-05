import type { ComponentStatus } from "@sh/shared";
import { STATUS_LABELS } from "@sh/shared";

const ICONS: Record<ComponentStatus, string> = {
  operational: "\u2713",
  degraded: "\u26a0",
  partial_outage: "\u26a0",
  major_outage: "\u2716",
  maintenance: "\u2699",
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

  return (
    <div className={`status-header ${overall}`} style={{ position: "relative" }}>
      <div className="container">
        <h1>
          {ICONS[overall]} {STATUS_LABELS[overall] ?? "Unknown"}
        </h1>
        <p>
          {overall === "operational"
            ? "All systems are operational"
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
