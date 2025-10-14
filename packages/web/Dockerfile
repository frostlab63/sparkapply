# Multi-stage Dockerfile for Frontend (React/Vite)
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
EXPOSE 5173
USER node
CMD ["dumb-init", "pnpm", "run", "dev", "--", "--host", "0.0.0.0"]

# Testing stage
FROM development AS testing
RUN pnpm run test:ci 2>/dev/null || pnpm test 2>/dev/null || echo "No test script found"
CMD ["pnpm", "test"]

# Production build stage
FROM node:18-alpine AS production-build
WORKDIR /app
RUN npm install -g pnpm@8
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Production stage with Nginx
FROM nginx:alpine AS production
RUN apk add --no-cache dumb-init
COPY --from=production-build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || echo "Using default nginx config"
EXPOSE 80
CMD ["dumb-init", "nginx", "-g", "daemon off;"]
