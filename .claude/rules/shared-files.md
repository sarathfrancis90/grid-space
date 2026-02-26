# Shared Files Rules
- stores/ — Zustand stores with Immer. Shallow selectors. No cross-store subscriptions.
- types/ — Interfaces only. No implementation. No imports from other modules.
- shared/types/ — Types shared between frontend AND backend.
- config/ — Environment config. Never hardcode values that differ per environment.
- .env — NEVER commit. Use .env.example as template.
- prisma/schema.prisma — Run 'npx prisma migrate dev' after every change.
