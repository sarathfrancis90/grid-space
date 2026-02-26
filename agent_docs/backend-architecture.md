# Backend Architecture Guide

> Read this before working on Sprints 9-16 (any backend code)

## Express Server Structure

```
packages/server/src/
├── app.ts                 ← Express app setup, middleware registration
├── server.ts              ← HTTP server + Socket.io bootstrap
├── config/
│   ├── env.ts             ← Environment variable loading + validation (Zod)
│   └── constants.ts       ← App-wide constants (pagination limits, etc.)
├── routes/
│   ├── index.ts           ← Root router, mounts all sub-routers
│   ├── auth.routes.ts     ← POST /login, /register, /refresh, /oauth/*
│   ├── spreadsheet.routes.ts ← CRUD /api/spreadsheets
│   ├── sheet.routes.ts    ← CRUD /api/spreadsheets/:id/sheets
│   ├── cell.routes.ts     ← GET/PUT /api/spreadsheets/:id/cells
│   ├── sharing.routes.ts  ← POST/DELETE /api/spreadsheets/:id/share
│   ├── version.routes.ts  ← GET /api/spreadsheets/:id/versions
│   └── user.routes.ts     ← GET/PUT /api/users/me
├── controllers/           ← Thin: validate input → call service → return response
├── services/              ← Fat: all business logic lives here
├── middleware/
│   ├── auth.middleware.ts  ← JWT verification, user injection
│   ├── permission.middleware.ts ← Role-based access (owner/editor/viewer)
│   ├── validate.middleware.ts   ← Zod schema validation
│   ├── rateLimit.middleware.ts  ← express-rate-limit config
│   └── error.middleware.ts      ← Global error handler
├── models/
│   └── prisma.ts          ← PrismaClient singleton
├── websocket/
│   ├── index.ts           ← Socket.io server setup
│   ├── auth.ws.ts         ← WebSocket JWT auth middleware
│   ├── rooms.ws.ts        ← Room management (join/leave spreadsheet)
│   ├── presence.ws.ts     ← User presence tracking
│   ├── sync.ws.ts         ← Yjs document sync handler
│   └── cursor.ws.ts       ← Cursor position broadcasting
├── email/
│   ├── client.ts          ← Resend/SendGrid client
│   └── templates/         ← Email HTML templates
└── utils/
    ├── apiResponse.ts     ← Standard response helpers
    └── logger.ts          ← Pino logger setup
```

## Key Patterns

### Controller-Service Pattern
Controllers are THIN — they only:
1. Extract validated input from `req`
2. Call the appropriate service method
3. Return the response

```typescript
// controllers/spreadsheet.controller.ts
export const getSpreadsheet = async (req: AuthRequest, res: Response) => {
  const spreadsheet = await spreadsheetService.getById(req.params.id, req.user.id);
  res.json(apiSuccess(spreadsheet));
};
```

Services are FAT — all business logic:
```typescript
// services/spreadsheet.service.ts
export const getById = async (id: string, userId: string) => {
  const spreadsheet = await prisma.spreadsheet.findUnique({
    where: { id },
    include: { sheets: true, access: true },
  });
  if (!spreadsheet) throw new AppError(404, 'Spreadsheet not found');
  
  const hasAccess = spreadsheet.access.some(a => a.userId === userId);
  if (!hasAccess) throw new AppError(403, 'Access denied');
  
  return spreadsheet;
};
```

### API Response Envelope
```typescript
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": 404, "message": "Not found" } }

// Paginated
{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 20, "total": 142 } }
```

### Error Handling — AppError class + global middleware
```typescript
class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

// Throw from anywhere in services:
throw new AppError(404, 'Spreadsheet not found');
throw new AppError(403, 'Access denied');
throw new AppError(422, 'Invalid cell reference');

// Global handler catches all:
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(apiError(err.statusCode, err.message));
  }
  logger.error(err);
  res.status(500).json(apiError(500, 'Internal server error'));
});
```

### Input Validation with Zod
```typescript
// Every route validates input
router.post('/', validate(createSpreadsheetSchema), controller.create);

const createSpreadsheetSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    templateId: z.string().cuid().optional(),
  }),
});
```

## Docker Development Setup

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: gridspace
      POSTGRES_PASSWORD: gridspace_dev
      POSTGRES_DB: gridspace
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  pgdata:
```

## Environment Variables (.env — NEVER commit)
```
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://gridspace:gridspace_dev@localhost:5432/gridspace
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=another-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
RESEND_API_KEY=
EMAIL_FROM=noreply@gridspace.app
```

## Middleware Registration Order (in app.ts)
1. `helmet()` — security headers
2. `cors({ origin: CLIENT_URL, credentials: true })`
3. `express.json({ limit: '10mb' })`
4. `morgan('dev')` or pino-http — request logging
5. `rateLimit()` — global rate limit
6. Routes
7. `notFound` handler
8. `errorHandler` — global error handler (must be last)

## Rules

1. **Every route has auth middleware** (except /auth/login, /auth/register, /health)
2. **Every write checks permissions server-side** — never trust client
3. **Every input validated with Zod** before controller
4. **All DB access via Prisma** — no raw SQL
5. **Services never import Express types** (req/res) — plain objects only
6. **Use `prisma.$transaction()`** for multi-table writes
7. **Log errors with context** (userId, spreadsheetId) — NEVER log passwords/tokens
8. **Rate limit all endpoints**: 100/min reads, 30/min writes, 5/min auth
