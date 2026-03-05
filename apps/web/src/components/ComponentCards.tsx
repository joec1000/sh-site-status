import { useState } from "react";
import type { Component, ComponentStatus } from "@sh/shared";
import { STATUS_LABELS } from "@sh/shared";
import { adminApi } from "../hooks/useApi.js";

const COMPONENT_ICONS: Record<string, string> = {
  web: "\ud83c\udf10",
  admin: "\ud83d\udd12",
  app: "\ud83d\udcf1",
};

const STATUS_ICON: Record<ComponentStatus, string> = {
  operational: "\u2713",
  degraded: "\u26a0",
  partial_outage: "\u26a0",
  major_outage: "\u2716",
  maintenance: "\u2699",
};

const STATUSES: ComponentStatus[] = [
  "operational",
  "degraded",
  "partial_outage",
  "major_outage",
  "maintenance",
];

interface Props {
  components: Component[];
  adminMode: boolean;
  adminKey: string;
  onUpdate: () => void;
}

export function ComponentCards({ components, adminMode, adminKey, onUpdate }: Props) {
  return (
    <div className="component-cards">
      {components.map((c) => (
        <ComponentCard
          key={c.id}
          component={c}
          adminMode={adminMode}
          adminKey={adminKey}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}

function ComponentCard({
  component,
  adminMode,
  adminKey,
  onUpdate,
}: {
  component: Component;
  adminMode: boolean;
  adminKey: string;
  onUpdate: () => void;
}) {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (status: ComponentStatus) => {
    setUpdating(true);
    try {
      await adminApi.updateComponent(adminKey, component.id, status);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="component-card">
      <div className="component-card-header">
        <div className={`component-icon ${component.status}`}>
          {COMPONENT_ICONS[component.id] || STATUS_ICON[component.status]}
        </div>
        <div>
          <h3>{component.name}</h3>
          <span className={`component-status-badge ${component.status}`}>
            {STATUS_LABELS[component.status]}
          </span>
        </div>
      </div>

      {adminMode && (
        <div className="component-card-admin">
          <select
            value={component.status}
            disabled={updating}
            onChange={(e) => handleStatusChange(e.target.value as ComponentStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
