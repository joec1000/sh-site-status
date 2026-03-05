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

const webDist = resolve(process.cwd(), "apps/web/dist");
app.use(express.static(webDist));
app.get("*", (_req, res) => {
  const index = resolve(webDist, "index.html");
  res.sendFile(index, (err) => {
    if (err) {
      console.error(`Failed to serve index.html from ${index}:`, err);
      res.status(404).send("Frontend not found. Build apps/web first.");
    }
  });
});

app.listen(config.port, () => {
  console.log(`API listening on :${config.port}`);
  console.log(`Serving frontend from ${webDist}`);
});
