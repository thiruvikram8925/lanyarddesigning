# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build client
COPY . .
RUN npx vite build

# ── Stage 2: Production Runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy package files and install production-only dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built frontend assets and server files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public

# Expose server port
EXPOSE 4000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/api/health || exit 1

# Start production server
CMD ["node", "server/index.js"]
