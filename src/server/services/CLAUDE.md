# src/server/services/

## What's Here
Business logic layer. Called by controllers. Interacts with Prisma. Checks permissions. Throws AppError on failure.

## Patterns to Follow
- All business logic lives here, not in controllers
- Always check permissions before data access
- Use Prisma transactions for multi-table writes
- Throw AppError with appropriate status codes

## Do NOT
- Import from src/ (frontend code) — shared types go in shared/types/
- Expose raw Prisma errors to API responses
- Skip input validation on any endpoint
- Store secrets in code — use process.env
