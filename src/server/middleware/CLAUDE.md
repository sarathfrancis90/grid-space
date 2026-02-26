# src/server/middleware/

## What's Here
Express middleware: authenticate (JWT), authorize (roles), validate (Zod), rateLimiter, errorHandler, requestLogger.

## Patterns to Follow
- Middleware order matters — see backend-architecture.md
- authenticate: verifies JWT, sets req.user
- authorize: checks role against SpreadsheetAccess
- validate: Zod schema validation on req.body

## Do NOT
- Import from src/ (frontend code) — shared types go in shared/types/
- Expose raw Prisma errors to API responses
- Skip input validation on any endpoint
- Store secrets in code — use process.env
