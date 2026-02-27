#!/bin/sh

set -e

# EOS CLUB - Manual Rebuild Script
# This script runs inside the droplet to pull changes and rebuild the static site.

# REPO_DIR and DIST_DIR are set relative to the container paths
REPO_DIR="/app/repo"
DIST_DIR="/app/dist"

MODE=${1:-"all"}

echo "Starting rebuild ($MODE) inside container at $(date)"

cd "$REPO_DIR" || { echo "Error: Could not enter repo directory"; exit 1; }

# Pull latest changes
git pull origin main

# Install dependencies
pnpm install --frozen-lockfile

case $MODE in
  "tina")
    echo "Building TinaCMS admin only..."
    NODE_OPTIONS="--max-old-space-size=3072" pnpm exec tinacms build --skip-cloud-checks
    # If dist exists, sync the new admin files into it
    if [ -d "dist" ]; then
      echo "Syncing TinaCMS assets to dist/admin..."
      mkdir -p dist/admin
      rsync -a --delete public/admin/ dist/admin/
    fi
    ;;
  "astro")
    echo "Building Astro site only..."
    pnpm exec astro build
    ;;
  "all")
    echo "Building everything..."
    pnpm run build
    ;;
  *)
    echo "Usage: $0 [tina|astro|all]"
    exit 1
    ;;
esac

# Copy build output to the web root
if [ -d "dist" ]; then
  rsync -a --delete dist/ "$DIST_DIR/"
  echo "Rebuild and deploy ($MODE) successful at $(date)"
else
  echo "Error: Build output directory 'dist' not found"
  exit 1
fi
