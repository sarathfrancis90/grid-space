# Start Backend Development Environment

```bash
# Start PostgreSQL + Redis
docker compose up -d

# Wait for PostgreSQL
until docker compose exec postgres pg_isready; do sleep 1; done

# Run database migrations
cd server && npx prisma migrate dev

# Start backend dev server
npm run dev:server
```
