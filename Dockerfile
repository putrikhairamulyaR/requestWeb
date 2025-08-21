# syntax=docker/dockerfile:1

# --- Base image ---
FROM node:20-alpine AS base

WORKDIR /app

# Only copy package files first to leverage Docker layer cache
COPY package*.json ./

# Install production deps only
RUN npm ci --omit=dev

# --- Runtime image ---
FROM node:20-alpine AS runtime
WORKDIR /app

# Set environment defaults (can be overridden at runtime)
ENV NODE_ENV=production \
    PORT=3000 \
    DB_HOST=localhost \
    DB_USER=root \
    DB_PASSWORD= \
    DB_NAME=web \
    DB_PORT=3306

# Copy node_modules from base build and app source
COPY --from=base /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]


