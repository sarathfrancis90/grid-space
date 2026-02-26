#!/bin/bash
set -e

echo "🚀 Starting GridSpace development environment..."

# Start infrastructure
docker compose up -d
echo "⏳ Waiting for PostgreSQL..."
until docker compose exec -T postgres pg_isready 2>/dev/null; do sleep 1; done
echo "✅ PostgreSQL ready"

# Run migrations
echo "📦 Running database migrations..."
npx prisma migrate dev --name init 2>/dev/null || npx prisma db push

# Start dev servers
echo "🖥️  Starting frontend (port 5173) and backend (port 3001)..."
npm run dev &
cd server && npm run dev &

# Wait and smoke test
sleep 5
if curl -s http://localhost:5173 > /dev/null; then
  echo "✅ Frontend running at http://localhost:5173"
else
  echo "⚠️  Frontend may still be starting..."
fi

if curl -s http://localhost:3001/api/health > /dev/null; then
  echo "✅ Backend running at http://localhost:3001"
else
  echo "⚠️  Backend may still be starting..."
fi

echo ""
echo "🎯 GridSpace development environment ready!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo "   Database: postgresql://localhost:5432/gridspace"
echo "   Redis:    redis://localhost:6379"
