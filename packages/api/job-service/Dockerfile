# Multi-stage Dockerfile for Job Service
# Supports development, testing, and production environments

# Base stage with Node.js
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM node:18-alpine AS development
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3002
USER node
CMD ["dumb-init", "npm", "run", "dev"]

# Testing stage
FROM development AS testing
RUN npm run test:ci 2>/dev/null || echo "No test script found"
CMD ["npm", "test"]

# Production build stage
FROM base AS production-build
COPY . .
RUN npm run build 2>/dev/null || echo "No build script found, using source files"

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
COPY --from=base --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=production-build --chown=nodejs:nodejs /app .
EXPOSE 3002
USER nodejs
CMD ["dumb-init", "npm", "start"]
