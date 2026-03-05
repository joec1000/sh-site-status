import { Router, type IRouter } from "express";
import type { ComponentStatus } from "@sh/shared";
import { getComponents, updateComponentStatus } from "../services/components.js";
import { requireAdmin } from "../middleware/auth.js";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  try {
    const components = await getComponents();
    res.json({ ok: true, data: components });
  } catch (err) {
    console.error("GET /components error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ ok: false, error: "status required" });
      return;
    }
    const component = await updateComponentStatus(req.params.id as string, status as ComponentStatus);
    res.json({ ok: true, data: component });
  } catch (err) {
    console.error("PATCH /components/:id error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

export default router;
