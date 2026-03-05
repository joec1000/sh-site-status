import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-admin-key"] as string | undefined;
  if (!key || key !== config.adminKey) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }
  next();
}
