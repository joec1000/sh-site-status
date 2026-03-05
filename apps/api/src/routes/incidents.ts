import { Router, type IRouter } from "express";
import type { IncidentStatus } from "@sh/shared";
import {
  listIncidents,
  getIncident,
  createIncident,
  postIncidentUpdate,
  updateIncident,
  deleteIncident,
  editIncidentUpdate,
  NotFoundError,
} from "../services/incidents.js";
import { requireAdmin } from "../middleware/auth.js";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  try {
    const incidents = await listIncidents();
    res.json({ ok: true, data: incidents });
  } catch (err) {
    console.error("GET /incidents error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const incident = await getIncident(req.params.id as string);
    if (!incident) {
      res.status(404).json({ ok: false, error: "Incident not found" });
      return;
    }
    res.json({ ok: true, data: incident });
  } catch (err) {
    console.error("GET /incidents/:id error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { title, severity, message, components } = req.body;
    if (!title || !severity || !message) {
      res.status(400).json({ ok: false, error: "title, severity, message required" });
      return;
    }
    const incident = await createIncident({
      title,
      severity,
      message,
      components: components || [],
    });
    res.status(201).json({ ok: true, data: incident });
  } catch (err) {
    console.error("POST /incidents error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.post("/:id/updates", requireAdmin, async (req, res) => {
  try {
    const { status, message } = req.body;
    if (!status || !message) {
      res.status(400).json({ ok: false, error: "status, message required" });
      return;
    }
    const incident = await postIncidentUpdate(req.params.id as string, { status: status as IncidentStatus, message: message as string });
    res.json({ ok: true, data: incident });
  } catch (err) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ ok: false, error: err.message });
      return;
    }
    console.error("POST /incidents/:id/updates error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const { title, severity, components } = req.body;
    const incident = await updateIncident(req.params.id as string, { title, severity, components });
    res.json({ ok: true, data: incident });
  } catch (err) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ ok: false, error: err.message });
      return;
    }
    console.error("PATCH /incidents/:id error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await deleteIncident(req.params.id as string);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ ok: false, error: err.message });
      return;
    }
    console.error("DELETE /incidents/:id error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.patch("/:id/updates/:updateId", requireAdmin, async (req, res) => {
  try {
    const { message, createdAt, status } = req.body;
    if (!message) {
      res.status(400).json({ ok: false, error: "message required" });
      return;
    }
    const incident = await editIncidentUpdate(
      req.params.id as string,
      req.params.updateId as string,
      message as string,
      createdAt as string | undefined,
      status as string | undefined,
    );
    res.json({ ok: true, data: incident });
  } catch (err) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ ok: false, error: err.message });
      return;
    }
    console.error("PATCH /incidents/:id/updates/:updateId error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

export default router;
