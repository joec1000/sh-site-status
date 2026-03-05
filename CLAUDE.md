# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies (from repo root)
pnpm install

# Development (runs both api :8080 and web :5173 concurrently)
pnpm dev

# Build shared package first if types are stale
cd packages/shared && pnpm build

# Build individual apps
pnpm build:api    # compiles apps/api with tsc
pnpm build:web    # compiles apps/web with tsc + vite

# Run API in production mode (after build)
cd apps/api && pnpm start
```

There are no tests currently in this project.

## Environment Setup

```bash
cp .env.example .env   # set GCS_BUCKET, ADMIN_KEY; CORS_ORIGIN optional for dev
```

The API reads `.env` from the repo root via `dotenv` in `apps/api/src/index.ts`. Set `STORAGE_MODE=local` in `.env` to use a local filesystem backend (no GCS needed) — data is stored in `apps/api/.data/`.

## Architecture

This is a pnpm monorepo with three packages:

- **`packages/shared`** — TypeScript types and constants shared between api and web. Must be built (`tsc`) before api or web can import from `@sh/shared`. All domain types live here (`types.ts`) and GCS path constants/default component definitions live in `constants.ts`.

- **`apps/api`** — Express API running on Node.js. Uses `tsx` for dev (no compile step). Entry point is `src/index.ts`. Routes are in `src/routes/`, business logic in `src/services/`.

- **`apps/web`** — React + Vite SPA. Vite dev server proxies `/api/*` to `localhost:8080`. Uses `VITE_API_URL` env var for production builds. No routing library — single-page app in `src/main.tsx`.

### Storage Layer (`apps/api/src/services/storage.ts`)

The storage module has two interchangeable backends selected by `STORAGE_MODE` env var:
- **`gcs`** (default) — uses `@google-cloud/storage` SDK with `ifGenerationMatch` preconditions on all writes to prevent concurrent-write races
- **`local`** — filesystem backend at `apps/api/.data/` for local development without GCS credentials

Both backends implement the same `StorageBackend` interface with `readJson`, `writeJson`, `listFiles`, and `deleteJson`. The `writeJson` call takes a `generation` parameter; pass `0` to create a new file (fails if it exists).

### Data Flow

Every write operation (create incident, post update, update component) calls `regenerateStatus()` after persisting data. This rewrites `status/current_status.json` by aggregating all incidents and components. The `GET /api/status` endpoint reads from that cached file first.

Overall status is computed from active incidents by severity (critical → major_outage, major → partial_outage, minor → degraded) with fallback to worst component status.

### GCS Bucket Layout

```
components/components.json        Component definitions + statuses
incidents/{uuid}.json             One file per incident
status/current_status.json        Aggregated cache (auto-regenerated on any write)
```

### Admin Auth

Write endpoints require `x-admin-key` header matching the `ADMIN_KEY` env var. Auth middleware is in `apps/api/src/middleware/auth.ts`. Read endpoints are public.

### Frontend Data Fetching

`apps/web/src/hooks/useApi.ts` contains all API interaction:
- `useStatus()` and `useIncidents()` — React hooks for read data
- `adminApi` — plain async functions for admin write operations (accept `adminKey` string as first arg)
