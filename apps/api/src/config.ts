export function getConfig() {
  return {
    port: parseInt(process.env.PORT || "8080", 10),
    storageMode: (process.env.STORAGE_MODE || "gcs") as "gcs" | "local",
    gcsBucket: process.env.GCS_BUCKET || "",
    adminKey: process.env.ADMIN_KEY || "",
    corsOrigin: process.env.CORS_ORIGIN || "*",
  };
}

export type Config = ReturnType<typeof getConfig>;

let _config: Config | null = null;

export const config = new Proxy({} as Config, {
  get(_target, prop: string) {
    if (!_config) _config = getConfig();
    return _config[prop as keyof Config];
  },
});

export function validateConfig() {
  const c = getConfig();
  if (c.storageMode === "gcs" && !c.gcsBucket) {
    throw new Error("GCS_BUCKET env var is required when STORAGE_MODE=gcs");
  }
  if (!c.adminKey) throw new Error("ADMIN_KEY env var is required");
}
