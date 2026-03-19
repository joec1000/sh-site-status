export type ComponentStatus = "operational" | "degraded" | "partial_outage" | "major_outage" | "maintenance";

export type IncidentSeverity = "sev1" | "sev2" | "sev3" | "sev4" | "sev5";

export type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";

export interface Component {
  id: string;
  name: string;
  description: string;
  status: ComponentStatus;
  group: string;
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
  currentImpact?: string;
  progress?: string;
  eta?: string;
  risksUnknowns?: string;
  nextUpdateTime?: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  components: string[];
  updates: IncidentUpdate[];
  owner: string;
  commsLead?: string;
  impact: string;
  systems: string;
  actions?: string;
  nextUpdateTime?: string;
  customerImpactWindow?: string;
  rootCause?: string;
  followUps?: string[];
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
  owner: string;
  commsLead?: string;
  impact: string;
  systems: string;
  actions?: string;
  nextUpdateTime?: string;
}

export interface PostIncidentUpdateRequest {
  status: IncidentStatus;
  message: string;
  currentImpact?: string;
  progress?: string;
  eta?: string;
  risksUnknowns?: string;
  nextUpdateTime?: string;
}

export interface UpdateComponentStatusRequest {
  status: ComponentStatus;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface QuickLink {
  icon: "slack" | "web";
  name: string;
  url: string;
}
