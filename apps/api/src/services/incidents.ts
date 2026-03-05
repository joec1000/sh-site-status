import { v4 as uuid } from "uuid";
import {
  GCS_PATHS,
  type Incident,
  type IncidentUpdate,
  type CreateIncidentRequest,
  type PostIncidentUpdateRequest,
} from "@sh/shared";
import { readJson, writeJson, listFiles, deleteJson } from "./storage.js";
import { regenerateStatus } from "./status.js";

export async function listIncidents(): Promise<Incident[]> {
  const files = await listFiles(GCS_PATHS.INCIDENTS_DIR + "/");
  const incidents: Incident[] = [];

  for (const path of files) {
    if (!path.endsWith(".json")) continue;
    const result = await readJson<Incident>(path);
    if (result) incidents.push(result.data);
  }

  incidents.sort((a, b) => {
    const latestA = a.updates.length ? a.updates[a.updates.length - 1].createdAt : a.updatedAt;
    const latestB = b.updates.length ? b.updates[b.updates.length - 1].createdAt : b.updatedAt;
    return new Date(latestB).getTime() - new Date(latestA).getTime();
  });
  return incidents;
}

export async function getIncident(id: string): Promise<Incident | null> {
  const result = await readJson<Incident>(GCS_PATHS.incidentFile(id));
  return result?.data ?? null;
}

export async function createIncident(req: CreateIncidentRequest): Promise<Incident> {
  const id = uuid();
  const now = new Date().toISOString();

  const update: IncidentUpdate = {
    id: uuid(),
    status: "investigating",
    message: req.message,
    createdAt: now,
  };

  const incident: Incident = {
    id,
    title: req.title,
    severity: req.severity,
    status: "investigating",
    components: req.components,
    updates: [update],
    startedAt: now,
    resolvedAt: null,
    updatedAt: now,
  };

  await writeJson(GCS_PATHS.incidentFile(id), incident, 0);
  await regenerateStatus();
  return incident;
}

export async function postIncidentUpdate(
  incidentId: string,
  req: PostIncidentUpdateRequest,
): Promise<Incident> {
  const result = await readJson<Incident>(GCS_PATHS.incidentFile(incidentId));
  if (!result) throw new NotFoundError("Incident not found");

  const { data: incident, generation } = result;
  const now = new Date().toISOString();

  const update: IncidentUpdate = {
    id: uuid(),
    status: req.status,
    message: req.message,
    createdAt: now,
  };

  incident.updates.push(update);
  incident.status = req.status;
  incident.updatedAt = now;
  if (req.status === "resolved") {
    incident.resolvedAt = now;
  }

  await writeJson(GCS_PATHS.incidentFile(incidentId), incident, generation);
  await regenerateStatus();
  return incident;
}

export async function updateIncident(
  id: string,
  fields: { title?: string; severity?: string; components?: string[] },
): Promise<Incident> {
  const result = await readJson<Incident>(GCS_PATHS.incidentFile(id));
  if (!result) throw new NotFoundError("Incident not found");

  const { data: incident, generation } = result;
  if (fields.title !== undefined) incident.title = fields.title;
  if (fields.severity !== undefined) incident.severity = fields.severity as Incident["severity"];
  if (fields.components !== undefined) incident.components = fields.components;
  incident.updatedAt = new Date().toISOString();

  await writeJson(GCS_PATHS.incidentFile(id), incident, generation);
  await regenerateStatus();
  return incident;
}

export async function deleteIncident(id: string): Promise<void> {
  const result = await readJson<Incident>(GCS_PATHS.incidentFile(id));
  if (!result) throw new NotFoundError("Incident not found");
  await deleteJson(GCS_PATHS.incidentFile(id));
  await regenerateStatus();
}

export async function editIncidentUpdate(
  incidentId: string,
  updateId: string,
  message: string,
  createdAt?: string,
  status?: string,
): Promise<Incident> {
  const result = await readJson<Incident>(GCS_PATHS.incidentFile(incidentId));
  if (!result) throw new NotFoundError("Incident not found");

  const { data: incident, generation } = result;
  const update = incident.updates.find((u) => u.id === updateId);
  if (!update) throw new NotFoundError("Update not found");

  update.message = message;
  if (createdAt) update.createdAt = createdAt;
  if (status) update.status = status as IncidentUpdate["status"];
  // Keep incident-level status in sync with the latest update's status
  const latest = incident.updates[incident.updates.length - 1];
  incident.status = latest.status;
  if (incident.status === "resolved" && !incident.resolvedAt) {
    incident.resolvedAt = latest.createdAt;
  } else if (incident.status !== "resolved") {
    incident.resolvedAt = null;
  }
  incident.updatedAt = new Date().toISOString();

  await writeJson(GCS_PATHS.incidentFile(incidentId), incident, generation);
  await regenerateStatus();
  return incident;
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
