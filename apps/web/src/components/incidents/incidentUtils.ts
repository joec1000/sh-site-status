import type { Incident, IncidentStatus, IncidentUpdate } from "@sh/shared";
import { DEFAULT_COMPONENTS } from "@sh/shared";

export const INCIDENT_STATUSES: IncidentStatus[] = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
];

export const SEVERITY_COLOR: Record<string, string> = {
  sev1: "critical",
  sev2: "high",
  sev3: "medium",
  sev4: "low",
  sev5: "lowest",
};

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function compNames(ids: string[]): string {
  return ids.map((id) => DEFAULT_COMPONENTS.find((c) => c.id === id)?.name ?? id).join(" and ");
}

// Simple one-liner format: 🟡 Team is responding to an issue with X affecting Y
export function buildIncidentSlackTemplate(incident: Incident): string {
  const components = incident.components.length > 0 ? compNames(incident.components) : "services";
  const latest = incident.updates[incident.updates.length - 1];
  if (latest) return latest.message;
  return `Team is responding to an issue with ${components}`;
}

// 🟢 Resolution message
export function buildResolutionSlackTemplate(incident: Incident): string {
  const components = incident.components.length > 0 ? compNames(incident.components) : "services";
  if (incident.rootCause) {
    return `System should be stable now. ${incident.rootCause}`;
  }
  return `System should be stable now. The issue affecting ${components} has been resolved.`;
}

// 🔴 Update message
export function buildUpdateSlackTemplate(_incident: Incident, update: IncidentUpdate): string {
  return update.message;
}

export function statusToDot(status: IncidentStatus, severity?: string): "red" | "yellow" | "green" {
  if (status === "resolved") return "green";
  // Based on severity: sev1/sev2 = red, sev3/sev4/sev5 = yellow
  if (severity === "sev1" || severity === "sev2") return "red";
  return "yellow";
}
