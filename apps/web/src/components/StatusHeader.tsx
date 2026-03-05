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
}

export function StatusHeader({ overall }: Props) {
  return (
    <div className={`status-header ${overall}`}>
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
    </div>
  );
}
