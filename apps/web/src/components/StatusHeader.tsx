import type { ComponentStatus } from "@sh/shared";
import { STATUS_LABELS } from "@sh/shared";

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

  return (
    <header className="sh-header">
      <div className="sh-header-top">
        <img src="/supplyhouse-white-logo.svg" alt="SupplyHouse.com" className="sh-logo" />
        <span className="sh-header-title">System Status</span>
        {timeStr && (
          <div className="sh-header-refresh">
            <span>Updated: {timeStr}</span>
            <button className="status-refresh-btn" onClick={onRefresh} title="Refresh now">
              <span className="material-icons" style={{ fontSize: "0.95rem" }}>refresh</span>
            </button>
          </div>
        )}
      </div>
      <div className={`status-banner ${overall}`}>
        <div className="status-banner-content">
          <span className="status-banner-dot" />
          <span className="status-banner-label">{STATUS_LABELS[overall] ?? "Unknown"}</span>
          <span className="status-banner-msg">
            {isHealthy
              ? "All systems are running normally"
              : "Some systems are experiencing issues"}
          </span>
        </div>
      </div>
    </header>
  );
}
