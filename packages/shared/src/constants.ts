export const GCS_PATHS = {
  INCIDENTS_DIR: "incidents",
  CURRENT_STATUS: "status/current_status.json",
  COMPONENTS: "components/components.json",
  incidentFile: (id: string) => `incidents/${id}.json`,
} as const;

export const DEFAULT_COMPONENTS: { id: string; name: string; description: string; order: number }[] = [
  { id: "web", name: "Web", description: "Public marketing website", order: 0 },
  { id: "admin", name: "Admin", description: "Admin dashboard", order: 1 },
  { id: "app", name: "App", description: "Main application", order: 2 },
];

export const STATUS_LABELS: Record<string, string> = {
  operational: "Operational",
  degraded: "Degraded Performance",
  partial_outage: "Partial Outage",
  major_outage: "Major Outage",
  maintenance: "Under Maintenance",
};

export const SEVERITY_LABELS: Record<string, string> = {
  minor: "Minor",
  major: "Major",
  critical: "Critical",
};

export const INCIDENT_STATUS_LABELS: Record<string, string> = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
};
