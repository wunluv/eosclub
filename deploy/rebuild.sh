#!/bin/sh

set -e

# EOS CLUB — Rebuild Script
# Executed inside the eosclub_astro Docker container by GitHub Actions:
#   docker exec eosclub_astro /app/repo/deploy/rebuild.sh
#
# Volume map (docker-compose.eosclub.yml):
#   host: /var/www/public/eos.khanyi.com/repo  →  container: /app/repo
#   host: /var/www/public/eos.khanyi.com/dist  →  container: /app/dist

REPO_DIR="/app/repo"
# dist/ is inside the repo, which mounts directly to /var/www/public/eos.khanyi.com
# on the host — the same path Nginx serves. No separate rsync target needed.
DIST_DIR="$REPO_DIR/dist"

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

# Sync built output to the directory Nginx serves
if [ -d "dist" ]; then
  echo "==> Syncing dist/ to $DIST_DIR ..."
  rsync -a --delete dist/ "$DIST_DIR/"
  echo "==> Rebuild and deploy successful at $(date)"
else
  echo "Error: dist/ directory not found after build"
  exit 1
fi
