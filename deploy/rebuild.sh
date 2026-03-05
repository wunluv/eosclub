#!/bin/sh

set -e

# EOS CLUB — Rebuild Script
# Executed inside the eosclub_astro Docker container by GitHub Actions:
#   docker exec eosclub_astro /app/repo/deploy/rebuild.sh
#
# Volume map (docker-compose.eosclub.yml):
#   host: /var/www/public/eos.khanyi.com  →  container: /app/repo
#
# Architecture (hybrid mode):
#   dist/client/  — static HTML/assets → served by Nginx from host fs
#   dist/server/  — Keystatic SSR routes → served by the Astro Node server
#
# The Node server runs inside the container on port 4322.
# Nginx proxies /keystatic/* and /api/keystatic/* to eosclub-astro:4322
# over the shared Docker backend network.

REPO_DIR="/app/repo"
NODE_SERVER_PID_FILE="/tmp/astro-node-server.pid"

# pnpm is installed to /root/.local/share/pnpm by the container start-up script
export PATH="/root/.local/share/pnpm:$PATH"

echo "==> Rebuild started at $(date)"

cd "$REPO_DIR" || { echo "Error: Could not enter repo directory $REPO_DIR"; exit 1; }

# Repo may be bind-mounted from host and owned by a different uid (for example
# deploy user on host while container runs as root). Mark as safe so git pull
# does not fail with "detected dubious ownership".
git config --global --add safe.directory "$REPO_DIR" 2>/dev/null || true

# Discard any build-generated files that Astro/Keystatic recreate each build
# so that git pull never conflicts on them.
echo "==> Resetting build-generated files..."
git checkout -- public/keystatic/ 2>/dev/null || true

# Pull latest from GitHub
echo "==> Pulling latest changes from origin/main..."
git pull origin main

# Install / sync dependencies
echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

# Build the static site
echo "==> Building Astro site (NODE_ENV=production)..."
NODE_ENV=production pnpm run build

# Verify build output exists
if [ ! -f "$REPO_DIR/dist/client/index.html" ]; then
  echo "Error: dist/client/index.html not found after build — check Astro output config"
  exit 1
fi

# Fix permissions so Nginx can read the static files
# (Docker build runs as root; Nginx worker needs read + traverse access)
chmod -R o+rX "$REPO_DIR/dist/client"

# (Re)start the Astro Node server for Keystatic SSR routes.
# Kill AFTER the build so the new entry.mjs always references the new manifest.
# The old server may still serve briefly during the build — that is acceptable.
echo "==> Starting Astro Node server on port 4322..."
if [ -f "$NODE_SERVER_PID_FILE" ]; then
  OLD_PID=$(cat "$NODE_SERVER_PID_FILE")
  kill "$OLD_PID" 2>/dev/null || true
  rm -f "$NODE_SERVER_PID_FILE"
fi
NODE_ENV=production HOST=0.0.0.0 PORT=4322 node "$REPO_DIR/dist/server/entry.mjs" &
echo $! > "$NODE_SERVER_PID_FILE"
echo "==> Node server started (PID: $(cat $NODE_SERVER_PID_FILE))"

echo "==> Rebuild and deploy successful at $(date)"
