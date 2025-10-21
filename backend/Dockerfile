# Backend Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Install curl for HEALTHCHECK (alpine package: curl)
RUN apk add --no-cache curl

# Copy dependencies and source code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set correct permissions
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 8888

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8888/health || exit 1

# Start the application
CMD ["npm", "start"]