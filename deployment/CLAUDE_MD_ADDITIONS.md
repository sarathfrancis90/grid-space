## ─── ADD THIS SECTION TO CLAUDE.md (after "CI/CD" in Tech Stack table) ───

## Deployment (Cloud Run Auto-Deploy)

Every `git push origin main` automatically deploys to Google Cloud Run.

| Component                   | GCP Service                      |
| --------------------------- | -------------------------------- |
| App (Express + Vite static) | Cloud Run (`us-central1`)        |
| PostgreSQL                  | Cloud SQL (private IP via VPC)   |
| Redis                       | Memorystore (private IP via VPC) |
| Docker images               | Artifact Registry                |
| Secrets                     | Secret Manager                   |

**Live URL**: `https://gridspace-XXXXX-uc.a.run.app` (available after first deploy)

### Production Rules (ALL teammates MUST follow)

1. **API URLs**: Use relative paths on frontend (`/api/...`, never `http://localhost:3001/api/...`)
2. **WebSocket**: Connect with `io()` (no URL = same origin)
3. **Port**: Use `process.env.PORT` — Cloud Run sets it to 8080
4. **No hardcoded URLs**: All URLs come from environment variables
5. **Health check**: `GET /health` must return 200 without auth
6. **No filesystem state**: Container is ephemeral — use PostgreSQL/Redis

### Updated Progressive Disclosure Table Row

| If working on...                  | Read this first                |
| --------------------------------- | ------------------------------ |
| **Deployment, Docker, Cloud Run** | **`agent_docs/deployment.md`** |
