import {
  GCS_PATHS,
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
  const overall = computeOverallStatus(componentsFile.components, activeIncidents);

  const status: CurrentStatus = {
    overall,
    components: componentsFile.components,
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

function computeOverallStatus(
  components: Component[],
  activeIncidents: Incident[],
): ComponentStatus {
  const hasCritical = activeIncidents.some((i) => i.severity === "critical");
  if (hasCritical) return "major_outage";

  const hasMajor = activeIncidents.some((i) => i.severity === "major");
  if (hasMajor) return "partial_outage";

  const hasMinor = activeIncidents.some((i) => i.severity === "minor");
  if (hasMinor) return "degraded";

  const worstComponent = components.reduce<ComponentStatus>((worst, c) => {
    const rank: Record<ComponentStatus, number> = {
      operational: 0,
      maintenance: 1,
      degraded: 2,
      partial_outage: 3,
      major_outage: 4,
    };
    return rank[c.status] > rank[worst] ? c.status : worst;
  }, "operational");

  return worstComponent;
}
