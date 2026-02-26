# src/server/controllers/

## What's Here
Request handlers. Parse request, call service, send response. Always wrap in try/catch and pass errors to next().

## Patterns to Follow
- Always use try/catch with next(error)
- Use req.user!.id for authenticated user
- Return consistent { success, data } format
- Keep controllers thin — delegate to services

## Do NOT
- Import from src/ (frontend code) — shared types go in shared/types/
- Expose raw Prisma errors to API responses
- Skip input validation on any endpoint
- Store secrets in code — use process.env
