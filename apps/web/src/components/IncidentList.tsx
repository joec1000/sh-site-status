import { useState, useEffect, useRef } from "react";
import type { Incident } from "@sh/shared";
import { IncidentCard } from "./incidents/IncidentCard.js";
import { ResolvedCard } from "./incidents/ResolvedCard.js";

interface Props {
  incidents: Incident[];
  loading: boolean;
  adminMode: boolean;
  adminKey: string;
  onUpdate: () => void;
  onEditIncident: (incident: Incident) => void;
}

export function IncidentList({ incidents, loading, adminMode, adminKey, onUpdate, onEditIncident }: Props) {
  const active = incidents.filter((i) => i.status !== "resolved");
  const resolved = incidents.filter((i) => i.status === "resolved");

  const sorted = [...active].sort((a, b) => {
    const latestA = a.updates.length ? a.updates[a.updates.length - 1].createdAt : a.updatedAt;
    const latestB = b.updates.length ? b.updates[b.updates.length - 1].createdAt : b.updatedAt;
    return new Date(latestB).getTime() - new Date(latestA).getTime();
  });

  const resolvedSorted = [...resolved].sort((a, b) => {
    return new Date(b.resolvedAt ?? b.updatedAt).getTime() - new Date(a.resolvedAt ?? a.updatedAt).getTime();
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const didAutoExpand = useRef(false);

  useEffect(() => {
    if (sorted.length === 0) return;
    if (!didAutoExpand.current) {
      didAutoExpand.current = true;
      setExpandedId(sorted[0].id);
    } else if (expandedId && !incidents.find((i) => i.id === expandedId)) {
      setExpandedId(sorted[0]?.id ?? resolvedSorted[0]?.id ?? null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidents]);

  if (loading && incidents.length === 0) {
    return (
      <section className="incidents-section">
        <h2>Incidents</h2>
        <div className="no-incidents">Loading incidents...</div>
      </section>
    );
  }

  return (
    <>
      {/* Active Incidents */}
      <section className="incidents-section">
        <h2>Active Incidents</h2>
        {sorted.length === 0 ? (
          <div className="no-incidents">
            <span className="no-incidents-icon">{"\u2705"}</span>
            No active incidents
          </div>
        ) : (
          sorted.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              expanded={expandedId === incident.id}
              onToggle={() => setExpandedId(expandedId === incident.id ? null : incident.id)}
              adminMode={adminMode}
              adminKey={adminKey}
              onUpdate={onUpdate}
              onEdit={() => onEditIncident(incident)}
            />
          ))
        )}
      </section>

      {/* Resolved Incidents — admin only */}
      {adminMode && resolvedSorted.length > 0 && (
        <section className="incidents-section resolved-section">
          <h2>Resolved Incidents</h2>
          {resolvedSorted.map((incident) => (
            <ResolvedCard
              key={incident.id}
              incident={incident}
              adminKey={adminKey}
              onUpdate={onUpdate}
              onEdit={() => onEditIncident(incident)}
            />
          ))}
        </section>
      )}
    </>
  );
}
