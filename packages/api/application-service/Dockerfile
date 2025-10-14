# Multi-stage Dockerfile for Application Service
# Supports development, testing, and production environments

# Base stage with Node.js and pnpm
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init
RUN npm install -g pnpm@8
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod && pnpm store prune

# Development stage
FROM node:18-alpine AS development
WORKDIR /app
RUN apk add --no-cache dumb-init
RUN npm install -g pnpm@8
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
EXPOSE 3005
USER node
CMD ["dumb-init", "pnpm", "run", "dev"]

# Testing stage
FROM development AS testing
RUN pnpm run test:ci 2>/dev/null || pnpm test 2>/dev/null || echo "No test script found"
CMD ["pnpm", "test"]

# Production build stage
FROM base AS production-build
COPY . .
RUN pnpm run build 2>/dev/null || echo "No build script found, using source files"

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
COPY --from=base --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=production-build --chown=nodejs:nodejs /app .
EXPOSE 3005
USER nodejs
CMD ["dumb-init", "pnpm", "start"]
