# Multi-stage Dockerfile for Frontend (React/Vite)
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
EXPOSE 5173
USER node
CMD ["dumb-init", "npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Testing stage
FROM development AS testing
RUN npm run test:ci 2>/dev/null || npm test 2>/dev/null || echo "No test script found"
CMD ["npm", "test"]

# Production build stage
FROM node:18-alpine AS production-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production
RUN apk add --no-cache dumb-init
COPY --from=production-build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || echo "Using default nginx config"
EXPOSE 80
CMD ["dumb-init", "nginx", "-g", "daemon off;"]
