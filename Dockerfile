# ============================================
# GridSpace — Production Dockerfile
# Multi-stage: Build client + server → single container
# ============================================

# ---- Stage 1: Install ALL dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
COPY packages/client/package.json ./packages/client/
COPY packages/server/package.json ./packages/server/

# Install all dependencies (including devDependencies for building)
RUN npm ci

# ---- Stage 2: Build the frontend ----
FROM deps AS client-build
WORKDIR /app

# Copy source code
COPY packages/client/ ./packages/client/
COPY packages/server/src/types/ ./packages/server/src/types/

# Set production API URL (relative — same origin since Express serves everything)
ENV VITE_API_URL=""
ENV VITE_WS_URL=""

# Build Vite app
RUN npm run build --workspace=packages/client

# ---- Stage 3: Build the server ----
FROM deps AS server-build
WORKDIR /app

# Copy source
COPY packages/server/ ./packages/server/

# Generate Prisma client
RUN npx prisma generate --schema=packages/server/prisma/schema.prisma

# Compile TypeScript
RUN npm run build --workspace=packages/server

# ---- Stage 4: Production image ----
FROM node:20-alpine AS production
WORKDIR /app

# Install security updates
RUN apk update && apk upgrade --no-cache && apk add --no-cache dumb-init

# Copy root package files
COPY package.json package-lock.json ./
COPY packages/server/package.json ./packages/server/

# Install production dependencies only
RUN npm ci --workspace=packages/server --omit=dev

# Copy Prisma schema + generated client
COPY packages/server/prisma ./packages/server/prisma
COPY --from=server-build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=server-build /app/node_modules/@prisma ./node_modules/@prisma

# Copy compiled server
COPY --from=server-build /app/packages/server/dist ./packages/server/dist

# Copy built frontend into server's public directory
COPY --from=client-build /app/packages/client/dist ./packages/server/dist/public

# Non-root user for security
RUN addgroup -g 1001 gridspace && \
    adduser -u 1001 -G gridspace -s /bin/sh -D gridspace && \
    chown -R gridspace:gridspace /app
USER gridspace

# Cloud Run sets PORT env var
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

# Use dumb-init to handle PID 1 signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=packages/server/prisma/schema.prisma && node packages/server/dist/server.js"]
