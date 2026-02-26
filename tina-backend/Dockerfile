FROM node:20-alpine

# Install git for push operations
RUN apk add --no-cache git

WORKDIR /app

# Copy root package.json and lock file if they exist for pnpm (Astro project)
# But here we are building the backend, so we need the backend's package.json
COPY tina-backend/package.json ./tina-backend/
RUN npm install -g pnpm && cd tina-backend && pnpm install

# Copy backend code
COPY tina-backend/ ./tina-backend/

# Copy tina config for schema resolution (relative to backend)
COPY tina/ ./tina/
COPY src/content/ ./src/content/

WORKDIR /app/tina-backend

EXPOSE 4001

CMD ["node", "server.js"]
