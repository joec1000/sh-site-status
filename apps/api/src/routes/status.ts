import { Router, type IRouter } from "express";
import { getStatus } from "../services/status.js";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  try {
    const status = await getStatus();
    res.json({ ok: true, data: status });
  } catch (err) {
    console.error("GET /status error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

export default router;
