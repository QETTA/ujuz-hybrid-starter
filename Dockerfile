# ─── Build stage ───────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Cache layer: copy package manifests first
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/worker-alerts/package*.json ./apps/worker-alerts/
COPY apps/worker-ai/package*.json ./apps/worker-ai/
COPY packages/config/package*.json ./packages/config/
COPY packages/db/package*.json ./packages/db/
COPY packages/shared/package*.json ./packages/shared/

RUN npm ci --production=false

# Copy all source and build
COPY tsconfig.base.json ./
COPY apps/ ./apps/
COPY packages/ ./packages/

RUN npm run build

# ─── Runtime stage ─────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy package manifests for production install
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/worker-alerts/package*.json ./apps/worker-alerts/
COPY apps/worker-ai/package*.json ./apps/worker-ai/
COPY packages/config/package*.json ./packages/config/
COPY packages/db/package*.json ./packages/db/
COPY packages/shared/package*.json ./packages/shared/

RUN npm ci --production

# Copy built artifacts
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/worker-alerts/dist ./apps/worker-alerts/dist
COPY --from=builder /app/apps/worker-ai/dist ./apps/worker-ai/dist
COPY --from=builder /app/packages/config/dist ./packages/config/dist
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy static assets (OpenAPI spec, well-known)
COPY --from=builder /app/apps/api/public ./apps/api/public

# Entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
