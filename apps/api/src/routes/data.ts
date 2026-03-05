import { Router, type IRouter } from "express";
import type { ComponentsFile, Incident } from "@sh/shared";
import { GCS_PATHS } from "@sh/shared";
import { requireAdmin } from "../middleware/auth.js";
import { getComponents } from "../services/components.js";
import { listIncidents } from "../services/incidents.js";
import { readJson, writeJson, deleteJson, listFiles } from "../services/storage.js";
import { regenerateStatus } from "../services/status.js";

const router: IRouter = Router();

// Export all data as a single JSON bundle
router.get("/export", requireAdmin, async (_req, res) => {
  try {
    const [componentsFile, incidents] = await Promise.all([
      getComponents(),
      listIncidents(),
    ]);

    const bundle = {
      exportedAt: new Date().toISOString(),
      components: componentsFile,
      incidents,
    };

    res.json({ ok: true, data: bundle });
  } catch (err) {
    console.error("GET /data/export error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// Import a previously exported bundle, replacing all data
router.post("/import", requireAdmin, async (req, res) => {
  try {
    const { components, incidents } = req.body;
    if (!components || !incidents) {
      res.status(400).json({ ok: false, error: "components and incidents required" });
      return;
    }

    // Delete existing incidents
    const existingFiles = await listFiles(GCS_PATHS.INCIDENTS_DIR + "/");
    for (const path of existingFiles) {
      if (path.endsWith(".json")) await deleteJson(path);
    }

    // Write components
    const existingComponents = await readJson<ComponentsFile>(GCS_PATHS.COMPONENTS);
    const compGen = existingComponents?.generation ?? 0;
    try {
      await writeJson(GCS_PATHS.COMPONENTS, components, compGen);
    } catch {
      // generation conflict — force write
      await writeJson(GCS_PATHS.COMPONENTS, components, 0).catch(() => {});
    }

    // Write each incident
    for (const incident of incidents as Incident[]) {
      await writeJson(GCS_PATHS.incidentFile(incident.id), incident, 0).catch(async () => {
        // File may already exist from a partial import; read gen and retry
        const existing = await readJson<Incident>(GCS_PATHS.incidentFile(incident.id));
        if (existing) await writeJson(GCS_PATHS.incidentFile(incident.id), incident, existing.generation);
      });
    }

    await regenerateStatus();
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /data/import error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

export default router;
