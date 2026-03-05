# SH Site Status

Internal status page backed by Google Cloud Storage (JSON files, no database).

## Architecture

```
apps/
  api/       Express API (Cloud Run)
  web/       React + Vite (static, GCS-hosted)
packages/
  shared/    Shared types & constants
```

### GCS Bucket Layout

```
/components/components.json      Component definitions + status
/incidents/{incident-id}.json    Individual incident files
/status/current_status.json      Aggregated status (auto-regenerated)
```

## Quick Start

```bash
pnpm install
cp .env.example .env        # fill in GCS_BUCKET, ADMIN_KEY
pnpm dev                    # starts both api (:8080) and web (:5173)
```

The Vite dev server proxies `/api` requests to the local Express server.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/status` | - | Current system status |
| GET | `/api/incidents` | - | List all incidents |
| GET | `/api/incidents/:id` | - | Single incident |
| POST | `/api/incidents` | Admin | Create incident |
| POST | `/api/incidents/:id/updates` | Admin | Post incident update |
| GET | `/api/components` | - | List components |
| PATCH | `/api/components/:id` | Admin | Update component status |

Admin endpoints require `x-admin-key` header matching the `ADMIN_KEY` env var.

## Deployment

### API → Cloud Run

```bash
# Build & push container
gcloud builds submit --tag gcr.io/PROJECT_ID/sh-status-api

# Deploy
gcloud run deploy sh-status-api \
  --image gcr.io/PROJECT_ID/sh-status-api \
  --set-env-vars GCS_BUCKET=your-bucket,ADMIN_KEY=your-secret,CORS_ORIGIN=https://status.yourdomain.com \
  --allow-unauthenticated \
  --region us-central1
```

### Web → GCS Static Hosting

```bash
# Build frontend
VITE_API_URL=https://api-status.yourdomain.com pnpm build:web

# Upload to GCS
gsutil -m rsync -r apps/web/dist gs://your-frontend-bucket

# Enable static site
gsutil web set -m index.html -e index.html gs://your-frontend-bucket
```

### GCS Bucket Setup (data)

```bash
gsutil mb gs://your-status-page-bucket
# Enable object versioning for safety
gsutil versioning set on gs://your-status-page-bucket
```

## Race Condition Protection

All writes use GCS `ifGenerationMatch` preconditions. If two concurrent writes
target the same object, only the first succeeds — the second gets a 412 and
must retry.
