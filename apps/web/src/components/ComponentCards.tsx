import { useState } from "react";
import type { Component, ComponentStatus } from "@sh/shared";
import { STATUS_LABELS, TOP_LEVEL_SERVICE_IDS } from "@sh/shared";
import { adminApi } from "../hooks/useApi.js";

const STATUS_DOT_COLOR: Record<ComponentStatus, string> = {
  operational: "#10b981",
  degraded: "#f59e0b",
  partial_outage: "#f97316",
  major_outage: "#ef4444",
  maintenance: "#3b82f6",
};

const STATUSES: ComponentStatus[] = [
  "operational",
  "degraded",
  "partial_outage",
  "major_outage",
  "maintenance",
];

const COMPONENT_ICONS: Record<string, string> = {
  website: "language",
  "admin-portal": "admin_panel_settings",
  "mobile-app": "phone_iphone",
  infrastructure: "cloud",
  database: "storage",
  networking: "hub",
};

interface Props {
  components: Component[];
  adminMode: boolean;
  adminKey: string;
  onUpdate: () => void;
}

export function ComponentCards({ components, adminMode, adminKey, onUpdate }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const topLevel = components.filter((c) =>
    (TOP_LEVEL_SERVICE_IDS as readonly string[]).includes(c.id)
  );

  const getChildren = (parentId: string) =>
    components.filter((c) => c.group === parentId).sort((a, b) => a.order - b.order);

  return (
    <div className="component-section">
      <div className="component-section-header">
        <h2>Service Status</h2>
        <div className="status-legend">
          <span className="legend-item"><span className="legend-dot" style={{ background: "#10b981" }} /> Operational</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: "#f59e0b" }} /> Issues</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: "#ef4444" }} /> Down</span>
        </div>
      </div>

      <div className="component-cards-grid">
        {topLevel.map((c) => {
          const children = getChildren(c.id);
          const isExpanded = expandedId === c.id;
          return (
            <div key={c.id} className={`component-card component-card--${c.status}${isExpanded ? " expanded" : ""}`}>
              <div
                className="component-card-top"
                onClick={() => children.length > 0 ? setExpandedId(isExpanded ? null : c.id) : null}
                style={{ cursor: children.length > 0 ? "pointer" : "default" }}
              >
                <span className={`component-card-icon component-card-icon--${c.status}`}>
                  <span className="material-icons">{COMPONENT_ICONS[c.id] || "dns"}</span>
                </span>
                <span className="component-card-name">{c.name}</span>
                <div className="component-card-right">
                  <span className="component-card-dot" style={{ background: STATUS_DOT_COLOR[c.status] }} />
                  {adminMode ? (
                    <StatusSelect status={c.status} adminKey={adminKey} componentId={c.id} onUpdate={onUpdate} />
                  ) : (
                    <span className={`component-status-badge ${c.status}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  )}
                  {children.length > 0 && (
                    <span className={`component-card-chevron material-icons${isExpanded ? " open" : ""}`}>
                      expand_more
                    </span>
                  )}
                </div>
              </div>

              {isExpanded && children.length > 0 && (
                <div className="component-card-children">
                  {children.map((child) => (
                    <div key={child.id} className="component-child-row">
                      <div className="component-child-left">
                        <span className="component-card-dot" style={{ background: STATUS_DOT_COLOR[child.status] }} />
                        <span className="component-child-name">{child.name}</span>
                      </div>
                      <div className="component-child-right">
                        {adminMode ? (
                          <StatusSelect status={child.status} adminKey={adminKey} componentId={child.id} onUpdate={onUpdate} />
                        ) : (
                          <span className={`component-status-badge ${child.status}`}>
                            {STATUS_LABELS[child.status]}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusSelect({
  status,
  adminKey,
  componentId,
  onUpdate,
}: {
  status: ComponentStatus;
  adminKey: string;
  componentId: string;
  onUpdate: () => void;
}) {
  const [updating, setUpdating] = useState(false);

  const handleChange = async (newStatus: ComponentStatus) => {
    setUpdating(true);
    try {
      await adminApi.updateComponent(adminKey, componentId, newStatus);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <select
      className="component-admin-select"
      value={status}
      disabled={updating}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => handleChange(e.target.value as ComponentStatus)}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
      ))}
    </select>
  );
}
