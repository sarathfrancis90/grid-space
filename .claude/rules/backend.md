# Backend Rules (server/\*\*)

- Express + TypeScript — async/await everywhere
- Route → Controller → Service → Prisma pattern
- Controllers: parse request, call service, send response, handle errors with next()
- Services: business logic, permission checks, Prisma queries
- Zod validation on ALL mutation endpoints
- NEVER expose raw errors to client — use AppError class
- NEVER import from src/ — shared types in shared/types/
- Use Prisma select/include to avoid over-fetching
- Transactions for multi-table writes
- Log with structured logger (pino/winston), not console.log
- Rate limit all endpoints
- CORS configured for FRONTEND_URL only
