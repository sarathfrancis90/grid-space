# Deployment Guide — Cloud Run Auto-Deploy

> Read this before working on Sprint 16 (API & Production) or any deployment-related work.
> Also relevant for ANY teammate: every `git push origin main` triggers auto-deploy.

## How Auto-Deploy Works

```
git push origin main
        │
        ▼ (Cloud Build trigger fires)
        │
   ┌────▼────────────────────────┐
   │  1. Docker build            │
   │     - Build Vite frontend   │
   │     - Compile TS server     │
   │     - Generate Prisma       │
   │  2. Push image to registry  │
   │  3. Deploy to Cloud Run     │
   │  4. Run prisma migrate      │
   └────┬────────────────────────┘
        │
        ▼
   https://gridspace-XXXXX-uc.a.run.app
```

**Every push = live deploy.** Features appear on the live URL within ~3 minutes of pushing.

## Architecture on GCP

| Component             | GCP Service       | Connection          |
| --------------------- | ----------------- | ------------------- |
| App (Express + React) | Cloud Run         | Public HTTPS        |
| PostgreSQL            | Cloud SQL         | VPC (private IP)    |
| Redis                 | Memorystore       | VPC (private IP)    |
| Docker images         | Artifact Registry | Internal            |
| Secrets               | Secret Manager    | Mounted as env vars |

## What This Means for You (Teammates)

### Environment Variables Available in Production

These are automatically injected by Cloud Run via Secret Manager:

```
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://...   (Cloud SQL private IP)
REDIS_URL=redis://...           (Memorystore private IP)
JWT_SECRET=...                  (from Secret Manager)
JWT_REFRESH_SECRET=...          (from Secret Manager)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=https://gridspace-XXXXX-uc.a.run.app
SERVER_URL=https://gridspace-XXXXX-uc.a.run.app
```

### Rules for Production Compatibility

1. **NEVER hardcode URLs** — always use `process.env.CLIENT_URL`, `process.env.DATABASE_URL`, etc.
2. **NEVER use localhost** in any config that might reach production
3. **API URL in frontend**: Use relative paths (`/api/spreadsheets`, not `http://localhost:3001/api/spreadsheets`)
   - Vite config proxies `/api/*` to Express in dev
   - In production, Express serves everything on same origin
4. **WebSocket URL in frontend**: Connect to same origin

   ```typescript
   // CORRECT
   const socket = io(window.location.origin, { ... });
   // or just
   const socket = io({ ... });  // defaults to same origin

   // WRONG
   const socket = io('http://localhost:3001', { ... });
   ```

5. **Port**: Cloud Run sets `PORT=8080` — server MUST use `process.env.PORT`
6. **No file system writes**: Cloud Run is ephemeral — don't write temp files. Use `/tmp` only.
7. **Prisma migrations**: Run automatically on deploy via Dockerfile CMD
8. **Static files**: Express serves `packages/server/dist/public/` in production (built Vite output)

### Frontend API Client Pattern

```typescript
// services/api.ts — works in both dev and production
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "", // empty = same origin
  withCredentials: true,
});
```

### WebSocket Client Pattern

```typescript
// services/socket.ts — works in both dev and production
import { io } from "socket.io-client";

const socket = io({
  // No URL = connects to same origin (works in dev proxy + production)
  auth: { token: authStore.getState().accessToken },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
  transports: ["websocket", "polling"], // WebSocket first, polling fallback
});
```

### Server Startup Pattern

```typescript
// packages/server/src/server.ts
import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "./app";
import { env } from "./config/env";

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_URL || true,
    credentials: true,
  },
  // Cloud Run has a 60-min timeout — set ping accordingly
  pingTimeout: 30000,
  pingInterval: 25000,
});

// ... setup socket handlers ...

const PORT = parseInt(process.env.PORT || "3001", 10);
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`GridSpace server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
```

### Cloud Run Session Affinity

Cloud Run has session affinity enabled for this service. This means:

- WebSocket connections stick to the same container instance
- Socket.io clients maintain their connection to one container
- BUT: when scaling up, new clients may hit different instances
- **Redis adapter is required** for cross-instance message broadcasting

### Health Check

Cloud Run pings `/health` to check if the container is alive. This route MUST:

- Return 200 status
- Respond within 5 seconds
- NOT require authentication

```typescript
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});
```

## Docker Build Notes

The Dockerfile uses multi-stage builds:

1. **deps** — Installs all npm dependencies
2. **client-build** — Builds Vite frontend → `packages/client/dist/`
3. **server-build** — Compiles TypeScript server + Prisma generate
4. **production** — Copies only production artifacts, runs as non-root user

Build command runs automatically via Cloud Build, but for local testing:

```bash
docker build -t gridspace .
docker run -p 8080:8080 --env-file .env gridspace
```

## Debugging Production

```bash
# View live logs
gcloud run services logs tail gridspace --region=us-central1

# Check service status
gcloud run services describe gridspace --region=us-central1

# Check recent builds
gcloud builds list --limit=5 --region=us-central1
```

## Rules

1. **Every endpoint must work behind HTTPS** — Cloud Run terminates TLS
2. **Use `process.env.PORT`** — never hardcode port
3. **Use relative API URLs on frontend** — no absolute localhost URLs
4. **WebSocket: connect to same origin** — `io()` with no URL argument
5. **Never store state in the container** — use PostgreSQL/Redis
6. **Prisma migrations auto-run** — but test locally first with `npx prisma migrate dev`
7. **Health check must always respond** — don't put it behind auth middleware
