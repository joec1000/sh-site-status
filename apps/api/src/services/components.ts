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

async function initializeComponents(): Promise<ComponentsFile> {
  const now = new Date().toISOString();
  const file: ComponentsFile = {
    components: DEFAULT_COMPONENTS.map((c) => ({
      ...c,
      status: "operational" as const,
      updatedAt: now,
    })),
    updatedAt: now,
  };
  await writeJson(GCS_PATHS.COMPONENTS, file, 0).catch(() => {
    // Another process may have initialized it; ignore conflict
  });
  return file;
}
