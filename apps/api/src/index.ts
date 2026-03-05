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
import dataRoutes from "./routes/data.js";

validateConfig();

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/status", statusRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/components", componentRoutes);
app.use("/api/data", dataRoutes);

import fs from "fs";

const webCandidates = [
  resolve(process.cwd(), "apps/web/dist"),
  resolve(__dirname, "../../web/dist"),
  resolve(__dirname, "../../../apps/web/dist"),
];
const webDist = webCandidates.find((d) => fs.existsSync(resolve(d, "index.html"))) ?? webCandidates[0];

app.use(express.static(webDist));
app.use((_req, res, next) => {
  const index = resolve(webDist, "index.html");
  if (fs.existsSync(index)) {
    res.sendFile(index);
  } else {
    next();
  }
});

app.listen(config.port, () => {
  console.log(`API listening on :${config.port}`);
  console.log(`Serving frontend from ${webDist}`);
  console.log(`index.html exists: ${fs.existsSync(resolve(webDist, "index.html"))}`);
});
