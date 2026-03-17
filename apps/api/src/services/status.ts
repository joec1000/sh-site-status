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

  // SEV-3 (minor) → degraded
  const hasSev3 = activeIncidents.some((i) => i.severity === "sev3");
  if (hasSev3) return "degraded";

  // No active incidents (or only sev4) → operational
  return "operational";
}
