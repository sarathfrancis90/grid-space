# src/server/routes/

## What's Here

Express route definitions. Each file defines routes for one domain. Pattern: router.get('/path', middleware, controller).

## Patterns to Follow

- TypeScript strict mode
- Async/await everywhere, no callbacks

## Do NOT

- Import from src/ (frontend code) — shared types go in shared/types/
- Expose raw Prisma errors to API responses
- Skip input validation on any endpoint
- Store secrets in code — use process.env
