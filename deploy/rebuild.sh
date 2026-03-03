#!/bin/sh

set -e

# EOS CLUB — Rebuild Script
# Executed inside the eosclub_astro Docker container by GitHub Actions:
#   docker exec eosclub_astro /app/repo/deploy/rebuild.sh
#
# Volume map (docker-compose.eosclub.yml):
#   host: /var/www/public/eos.khanyi.com  →  container: /app/repo
#
# @astrojs/node adapter splits build output:
#   dist/client/  — static HTML/assets  → served by Nginx
#   dist/server/  — Keystatic API routes (not served directly by Nginx)
#
# Nginx root: /var/www/public/eos.khanyi.com/dist/client

REPO_DIR="/app/repo"

# pnpm is installed to /root/.local/share/pnpm by the container start-up script
export PATH="/root/.local/share/pnpm:$PATH"

echo "==> Rebuild started at $(date)"

cd "$REPO_DIR" || { echo "Error: Could not enter repo directory $REPO_DIR"; exit 1; }

# Discard any build-generated files that Astro/Keystatic recreate each build
# so that git pull never conflicts on them.
echo "==> Resetting build-generated files..."
git checkout -- public/keystatic/ 2>/dev/null || true

# Pull latest from GitHub
echo "==> Pulling latest changes from origin/feature/keystatic-migration..."
git pull origin feature/keystatic-migration

# Install / sync dependencies
echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

# Build the static site
echo "==> Building Astro site (NODE_ENV=production)..."
NODE_ENV=production pnpm run build

# Verify build output exists
if [ ! -d "$REPO_DIR/dist/client" ]; then
  echo "Error: dist/client/ not found after build — check Astro output config"
  exit 1
fi

# Fix permissions so Nginx can read the static files
# (Docker build runs as root; Nginx worker needs read + traverse access)
chmod -R o+rX "$REPO_DIR/dist/client"

echo "==> Rebuild and deploy successful at $(date)"
