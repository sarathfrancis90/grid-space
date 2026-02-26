# ─── Stage 1: Build Client ─────────────────────────────────
FROM node:20-alpine AS client-build
WORKDIR /app
COPY package*.json ./
COPY packages/client/package*.json ./packages/client/
RUN npm ci --workspace=packages/client
COPY packages/client/ ./packages/client/
RUN npm run build --workspace=packages/client

# ─── Stage 2: Build Server ─────────────────────────────────
FROM node:20-alpine AS server-build
WORKDIR /app
COPY package*.json ./
COPY packages/server/package*.json ./packages/server/
RUN npm ci --workspace=packages/server
COPY packages/server/ ./packages/server/
RUN npm run build --workspace=packages/server
RUN npx prisma generate --schema=packages/server/prisma/schema.prisma

# ─── Stage 3: Production ───────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
COPY packages/server/package*.json ./packages/server/
RUN npm ci --workspace=packages/server --omit=dev

# Copy built server
COPY --from=server-build /app/packages/server/dist ./packages/server/dist
COPY --from=server-build /app/packages/server/prisma ./packages/server/prisma
COPY --from=server-build /app/node_modules/.prisma ./node_modules/.prisma

# Copy built client (served by Express in production)
COPY --from=client-build /app/packages/client/dist ./packages/client/dist

# Run migrations and start
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy --schema=packages/server/prisma/schema.prisma && node packages/server/dist/server.js"]
