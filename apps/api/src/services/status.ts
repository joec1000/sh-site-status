import {
  GCS_PATHS,
  TOP_LEVEL_SERVICE_IDS,
  type CurrentStatus,
  type ComponentStatus,
  type Component,
  type Incident,
} from "@sh/shared";
import { readJson, writeJson } from "./storage.js";
import { getComponents } from "./components.js";
import { listIncidents } from "./incidents.js";

export async function getStatus(): Promise<CurrentStatus> {
  const cached = await readJson<CurrentStatus>(GCS_PATHS.CURRENT_STATUS);
  if (cached) return cached.data;
  return regenerateStatus();
}

export async function regenerateStatus(): Promise<CurrentStatus> {
  const [componentsFile, allIncidents] = await Promise.all([
    getComponents(),
    listIncidents(),
  ]);

  const activeIncidents = allIncidents.filter((i) => i.status !== "resolved");

  // Sync component statuses from active incidents
  const components = applyIncidentStatuses(componentsFile.components, activeIncidents);
  const overall = computeOverallStatus(components, activeIncidents);

  const status: CurrentStatus = {
    overall,
    components,
    activeIncidents,
    updatedAt: new Date().toISOString(),
  };

  // Best-effort write; read existing generation first
  const existing = await readJson<CurrentStatus>(GCS_PATHS.CURRENT_STATUS);
  const gen = existing?.generation ?? 0;
  try {
    await writeJson(GCS_PATHS.CURRENT_STATUS, status, gen);
  } catch {
    // generation conflict is non-fatal for status regeneration — another
    // request is also regenerating which is fine
    await writeJson(GCS_PATHS.CURRENT_STATUS, status, 0).catch(() => {});
  }

  return status;
}

const SEVERITY_RANK: Record<string, ComponentStatus> = {
  sev1: "major_outage",
  sev2: "partial_outage",
  sev3: "degraded",
  sev4: "degraded",
  sev5: "degraded",
};

const STATUS_RANK: Record<ComponentStatus, number> = {
  operational: 0,
  maintenance: 1,
  degraded: 2,
  partial_outage: 3,
  major_outage: 4,
};

function applyIncidentStatuses(
  components: Component[],
  activeIncidents: Incident[],
): Component[] {
  // Step 1: Build map of sub-service id → worst status from active incidents
  const worstStatus = new Map<string, ComponentStatus>();

  for (const incident of activeIncidents) {
    const incidentStatus = SEVERITY_RANK[incident.severity] || "degraded";
    for (const compId of incident.components) {
      const current = worstStatus.get(compId) || "operational";
      if (STATUS_RANK[incidentStatus] > STATUS_RANK[current]) {
        worstStatus.set(compId, incidentStatus);
      }
    }
  }

  // Step 2: Apply status to sub-services only (directly affected)
  const updated = components.map((c) => {
    const directStatus = worstStatus.get(c.id);
    return { ...c, status: directStatus || "operational" as ComponentStatus };
  });

  // Step 3: Derive parent card status from worst child status
  const topLevelIds = new Set(TOP_LEVEL_SERVICE_IDS as readonly string[]);
  for (const comp of updated) {
    if (!topLevelIds.has(comp.id)) continue;
    const children = updated.filter((c) => c.group === comp.id);
    if (children.length === 0) continue;
    const worstChild = children.reduce<ComponentStatus>((worst, child) => {
      return STATUS_RANK[child.status] > STATUS_RANK[worst] ? child.status : worst;
    }, "operational");
    comp.status = worstChild;
  }

  return updated;
}

function computeOverallStatus(
  _components: Component[],
  activeIncidents: Incident[],
): ComponentStatus {
  // Overall status is driven entirely by active incidents.
  // When all incidents are resolved, overall = operational.

  // SEV-1 (critical) → major_outage
  const hasSev1 = activeIncidents.some((i) => i.severity === "sev1");
  if (hasSev1) return "major_outage";

  // SEV-2 (major degradation) → partial_outage
  const hasSev2 = activeIncidents.some((i) => i.severity === "sev2");
  if (hasSev2) return "partial_outage";

  // SEV-3/4/5 → degraded
  if (activeIncidents.length > 0) return "degraded";

  // No active incidents → operational
  return "operational";
}
