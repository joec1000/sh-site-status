import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../.env") });

import express from "express";
import cors from "cors";
import { config, validateConfig } from "./config.js";
import statusRoutes from "./routes/status.js";
import incidentRoutes from "./routes/incidents.js";
import componentRoutes from "./routes/components.js";

validateConfig();

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/status", statusRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/components", componentRoutes);

app.listen(config.port, () => {
  console.log(`API listening on :${config.port}`);
});
