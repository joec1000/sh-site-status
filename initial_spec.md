You are a senior full-stack engineer. Help me scaffold a minimal internal “Site Status Page” system.

Tech constraints:
- Frontend: React + TypeScript (Vite)
- Backend: Node.js + TypeScript (Express)
- Hosting: 
  - Frontend hosted on Google Cloud Storage (static site)
  - Backend hosted on Cloud Run
- Persistence: Google Cloud Storage only (JSON file-based storage, no database)
- Auth: Simple ADMIN_KEY header for write endpoints (keep read endpoints open)

Storage model (GCS bucket structure):

/incidents/{incident-id}.json
/status/current_status.json
/components/components.json

Requirements:

1) Status Page
   - Show overall system status
   - List components and their status
   - List incidents sorted by startedAt (newest first)
   - Show incident timeline updates

2) Admin Features
   - Create incident (writes new JSON file)
   - Post update to incident (rewrite JSON file)
   - Resolve incident
   - Update component status

3) Backend Behavior
   - Use @google-cloud/storage SDK
   - Use generation preconditions to prevent overwrite race conditions
   - Regenerate /status/current_status.json after any incident change

5) Provide:
   - Monorepo structure (pnpm workspaces)
   - apps/web, apps/api, packages/shared
   - GCS storage service file
   - Example JSON structures
   - .env.example
   - Deployment steps for GCS + Cloud Run
   - Minimal but production-safe implementation

6) For the UI, create a page with the top 3 boxes summary for status of (1) Web, (2) Admin, (3) App with an icon next to it. Below a list of items with incidents where the top links to the first details of incident. Make it similar to https://www.supplyhouse.com style.

7) Add a button for "Admin" mode that shows edit buttons for the top 3 boxes summary for status of (1) Web, (2) Admin, (3) App with an icon next to it. When in admin mode, the page should show the edit buttons and the page should be editable. When not in admin mode, the page should show the read-only view.

Start by:
A) Proposing folder structure
B) Implementing GCS storage service
C) Implementing incident create
D) Implementing GET /status endpoint