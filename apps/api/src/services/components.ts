import {
  GCS_PATHS,
  DEFAULT_COMPONENTS,
  type Component,
  type ComponentsFile,
  type ComponentStatus,
} from "@sh/shared";
import { readJson, writeJson } from "./storage.js";
import { regenerateStatus } from "./status.js";

export async function getComponents(): Promise<ComponentsFile> {
  const result = await readJson<ComponentsFile>(GCS_PATHS.COMPONENTS);
  if (result) return result.data;
  return initializeComponents();
}

export async function updateComponentStatus(
  componentId: string,
  status: ComponentStatus,
): Promise<Component> {
  const result = await readJson<ComponentsFile>(GCS_PATHS.COMPONENTS);
  const file = result?.data ?? (await initializeComponents());
  const generation = result?.generation ?? 0;

  const component = file.components.find((c) => c.id === componentId);
  if (!component) throw new Error(`Component '${componentId}' not found`);

  component.status = status;
  component.updatedAt = new Date().toISOString();
  file.updatedAt = new Date().toISOString();

  await writeJson(GCS_PATHS.COMPONENTS, file, generation);
  await regenerateStatus();
  return component;
}

// Map incident severity to component status
const SEVERITY_TO_COMPONENT_STATUS: Record<string, ComponentStatus> = {
  sev1: "major_outage",
  sev2: "partial_outage",
  sev3: "degraded",
  sev4: "degraded",
  sev5: "degraded",
};

export async function setComponentsStatus(
  componentIds: string[],
  status: ComponentStatus,
): Promise<void> {
  if (componentIds.length === 0) return;
  const result = await readJson<ComponentsFile>(GCS_PATHS.COMPONENTS);
  const file = result?.data ?? (await initializeComponents());
  const generation = result?.generation ?? 0;
  const now = new Date().toISOString();

  for (const id of componentIds) {
    // Update the component itself
    const comp = file.components.find((c) => c.id === id);
    if (comp) {
      comp.status = status;
      comp.updatedAt = now;
    }
    // Also update all children (sub-services grouped under this component)
    for (const child of file.components.filter((c) => c.group === id)) {
      child.status = status;
      child.updatedAt = now;
    }
  }

  file.updatedAt = now;
  await writeJson(GCS_PATHS.COMPONENTS, file, generation);
}

export function severityToComponentStatus(severity: string): ComponentStatus {
  return SEVERITY_TO_COMPONENT_STATUS[severity] || "degraded";
}

async function initializeComponents(): Promise<ComponentsFile> {
  const now = new Date().toISOString();
  const file: ComponentsFile = {
    components: DEFAULT_COMPONENTS.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      group: c.group,
      status: "operational" as const,
      order: c.order,
      updatedAt: now,
    })),
    updatedAt: now,
  };
  await writeJson(GCS_PATHS.COMPONENTS, file, 0).catch(() => {
    // Another process may have initialized it; ignore conflict
  });
  return file;
}
