import fs from "fs";
import nodePath from "path";
import { fileURLToPath } from "url";
import { config } from "../config.js";

export interface ReadResult<T> {
  data: T;
  generation: number;
}

export async function readJson<T>(path: string): Promise<ReadResult<T> | null> {
  return getBackend().readJson<T>(path);
}

export async function writeJson<T>(path: string, data: T, generation: number): Promise<number> {
  return getBackend().writeJson(path, data, generation);
}

export async function listFiles(prefix: string): Promise<string[]> {
  return getBackend().listFiles(prefix);
}

export async function deleteJson(path: string): Promise<void> {
  return getBackend().deleteJson(path);
}

interface StorageBackend {
  readJson<T>(path: string): Promise<ReadResult<T> | null>;
  writeJson<T>(path: string, data: T, generation: number): Promise<number>;
  listFiles(prefix: string): Promise<string[]>;
  deleteJson(path: string): Promise<void>;
}

let _backend: StorageBackend | null = null;

function getBackend(): StorageBackend {
  if (!_backend) {
    _backend = config.storageMode === "local" ? createLocalBackend() : createGcsBackend();
  }
  return _backend;
}

// ── GCS backend ──

function createGcsBackend(): StorageBackend {
  let _storage: InstanceType<typeof import("@google-cloud/storage").Storage> | null = null;

  async function getStorage() {
    if (!_storage) {
      const { Storage } = await import("@google-cloud/storage");
      _storage = new Storage();
    }
    return _storage;
  }

  const bucket = async () => (await getStorage()).bucket(config.gcsBucket);

  return {
    async readJson<T>(path: string): Promise<ReadResult<T> | null> {
      const file = (await bucket()).file(path);
      try {
        const [metadata] = await file.getMetadata();
        const [content] = await file.download();
        return {
          data: JSON.parse(content.toString("utf-8")) as T,
          generation: parseInt(String(metadata.generation), 10),
        };
      } catch (err: unknown) {
        if (isNotFoundError(err)) return null;
        throw err;
      }
    },

    async writeJson<T>(path: string, data: T, generation: number): Promise<number> {
      const file = (await bucket()).file(path);
      await file.save(JSON.stringify(data, null, 2), {
        contentType: "application/json",
        preconditionOpts: { ifGenerationMatch: generation },
      });
      const [metadata] = await file.getMetadata();
      return parseInt(String(metadata.generation), 10);
    },

    async listFiles(prefix: string): Promise<string[]> {
      const [files] = await (await bucket()).getFiles({ prefix });
      return files.map((f) => f.name);
    },

    async deleteJson(path: string): Promise<void> {
      try {
        await (await bucket()).file(path).delete();
      } catch (err: unknown) {
        if (!isNotFoundError(err)) throw err;
      }
    },
  };
}

function isNotFoundError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: number }).code === 404
  );
}

// ── Local filesystem backend ──

function createLocalBackend(): StorageBackend {
  const __dirname = nodePath.dirname(fileURLToPath(import.meta.url));
  const dataDir = nodePath.resolve(__dirname, "../../.data");

  const generations = new Map<string, number>();
  let genCounter = 1;

  function fullPath(p: string) {
    return nodePath.join(dataDir, p);
  }

  return {
    async readJson<T>(path: string): Promise<ReadResult<T> | null> {
      const fp = fullPath(path);
      try {
        const content = fs.readFileSync(fp, "utf-8");
        const gen = generations.get(path) ?? 1;
        return { data: JSON.parse(content) as T, generation: gen };
      } catch {
        return null;
      }
    },

    async writeJson<T>(path: string, data: T, _generation: number): Promise<number> {
      const fp = fullPath(path);
      fs.mkdirSync(nodePath.dirname(fp), { recursive: true });
      fs.writeFileSync(fp, JSON.stringify(data, null, 2));
      const newGen = ++genCounter;
      generations.set(path, newGen);
      return newGen;
    },

    async listFiles(prefix: string): Promise<string[]> {
      const dir = fullPath(prefix);
      try {
        const entries = fs.readdirSync(dir);
        return entries.map((e) => prefix + e);
      } catch {
        return [];
      }
    },

    async deleteJson(path: string): Promise<void> {
      try {
        fs.unlinkSync(fullPath(path));
        generations.delete(path);
      } catch {
        // ignore
      }
    },
  };
}
