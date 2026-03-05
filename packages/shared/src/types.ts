export type ComponentStatus = "operational" | "degraded" | "partial_outage" | "major_outage" | "maintenance";

export type IncidentSeverity = "minor" | "major" | "critical";

export type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";

export interface Component {
  id: string;
  name: string;
  description: string;
  status: ComponentStatus;
  order: number;
  updatedAt: string;
}

export interface ComponentsFile {
  components: Component[];
  updatedAt: string;
}

export interface IncidentUpdate {
  id: string;
  status: IncidentStatus;
  message: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  components: string[];
  updates: IncidentUpdate[];
  startedAt: string;
  resolvedAt: string | null;
  updatedAt: string;
}

export interface CurrentStatus {
  overall: ComponentStatus;
  components: Component[];
  activeIncidents: Incident[];
  updatedAt: string;
}

// --- API request/response types ---

export interface CreateIncidentRequest {
  title: string;
  severity: IncidentSeverity;
  message: string;
  components: string[];
}

export interface PostIncidentUpdateRequest {
  status: IncidentStatus;
  message: string;
}

export interface UpdateComponentStatusRequest {
  status: ComponentStatus;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
