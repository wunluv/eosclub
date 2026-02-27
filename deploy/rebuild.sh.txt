#!/bin/sh

# EOS CLUB - Manual Rebuild Script
# This script runs inside the droplet to pull changes and rebuild the static site.

# REPO_DIR and DIST_DIR are set relative to the container paths
REPO_DIR="/app/repo"
DIST_DIR="/app/dist"

echo "Starting rebuild inside container at $(date)"

cd "$REPO_DIR" || { echo "Error: Could not enter repo directory"; exit 1; }

# Pull latest changes
git pull origin main

# Install dependencies and build
pnpm install --frozen-lockfile
pnpm run build

# Copy build output to the web root
if [ -d "dist" ]; then
  rsync -a --delete dist/ "$DIST_DIR/"
  echo "Rebuild and deploy successful at $(date)"
else
  echo "Error: Build output directory 'dist' not found"
  exit 1
fi
