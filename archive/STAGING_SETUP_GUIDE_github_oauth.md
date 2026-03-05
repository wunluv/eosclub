# EOS CLUB — Staging Deployment Setup Guide

**Target URL:** `https://staging.prod.khanyi.com`
**Server:** DigitalOcean Droplet (shared Docker host)
**Architecture:** Astro hybrid build (`dist/client` + `dist/server`) with Nginx reverse proxy

---

## Source of Truth and Scope

This guide is the staging deployment source of truth for:

- Docker network expectations
- Repo mount/paths
- Branch strategy (`main`)
- Rebuild lifecycle
- Keystatic SSR proxy model (`/keystatic` and `/api/keystatic`)

If older notes conflict with this document, follow this file.

---

## Architecture Overview

```text
GitHub push to main
  -> GitHub Actions (deploy workflow)
  -> SSH to droplet
  -> docker exec eosclub_astro /app/repo/deploy/rebuild.sh
  -> git pull origin main + pnpm install + build
  -> static site served from /var/www/public/eos.khanyi.com/dist/client
  -> Astro Node server serves Keystatic SSR routes on :4322
  -> Nginx proxies /keystatic and /api/keystatic to eosclub-astro:4322
```

Keystatic in staging/production runs in GitHub storage mode (OAuth login + repo commits).

---

## Phase 1 — Host Directories

```bash
sudo mkdir -p /var/www/public/eos.khanyi.com
sudo mkdir -p /var/www/private/eosclub
sudo chown -R $USER:$USER /var/www/public/eos.khanyi.com
sudo chown -R $USER:$USER /var/www/private/eosclub
```

---

## Phase 2 — Clone Repository

Clone directly into `/var/www/public/eos.khanyi.com` (no `/repo` subdirectory):

```bash
cd /var/www/public
git clone git@github.com:wunluv/eosclub.git eos.khanyi.com
```

Validate access:

```bash
ssh -T git@github.com
```

---

## Phase 3 — Environment File

Create `/var/www/private/eosclub/.env`:

```dotenv
# GitHub OAuth app (staging domain)
KEYSTATIC_GITHUB_CLIENT_ID=<from_github_oauth_app>
KEYSTATIC_GITHUB_CLIENT_SECRET=<from_github_oauth_app>
KEYSTATIC_SECRET=<run: openssl rand -hex 32>

PUBLIC_GITHUB_REPO=wunluv/eosclub
PUBLIC_SITE_URL=https://staging.prod.khanyi.com
PUBLIC_GAS_ENDPOINT=

# Optional override if backend network name differs from deploy_backend
# EOS_BACKEND_NETWORK=deploy_backend
```

Protect file:

```bash
sudo chmod 600 /var/www/private/eosclub/.env
```

---

## Phase 4 — GitHub OAuth App (Required)

Create OAuth app:

- Homepage URL: `https://staging.prod.khanyi.com`
- Callback URL: `https://staging.prod.khanyi.com/api/keystatic/github/callback`

Each domain requires exact callback matching. Production must use a separate OAuth app.

---

## Phase 5 — Docker Network Validation

The EOS container and Nginx container must share the same backend network.

```bash
docker network ls | grep backend
docker inspect nginx --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
docker inspect eosclub_astro --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

Expected default network name for the main stack: `deploy_backend`.

If your server uses a different network name, set `EOS_BACKEND_NETWORK` in the env file above before starting EOS compose.

---

## Phase 6 — Start/Refresh EOS Container

From repo root on the server:

```bash
docker compose -f deploy/docker-compose.eosclub.yml up -d --force-recreate
docker ps | grep eosclub_astro
docker logs --tail 100 eosclub_astro
```

Container startup auto-starts Node server only when `/app/repo/dist/server/entry.mjs` already exists. If this is first deploy, run rebuild next.

---

## Phase 7 — First Build and Runtime Start

```bash
docker exec eosclub_astro /app/repo/deploy/rebuild.sh
```

Rebuild behavior:

1. `git pull origin main`
2. `pnpm install --frozen-lockfile`
3. `NODE_ENV=production pnpm run build`
4. `chmod -R o+rX dist/client`
5. Starts Node server with `NODE_ENV=production HOST=0.0.0.0 PORT=4322`

---

## Phase 8 — Nginx Staging Config

Copy vhost:

```bash
sudo cp /var/www/public/eos.khanyi.com/deploy/nginx/eosclub-staging.conf \
        /var/www/private/nginx/conf.d/eosclub-staging.conf
```

Reload:

```bash
docker exec nginx nginx -t && docker exec nginx nginx -s reload
```

Important: `/keystatic` and `/api/keystatic` must proxy to `http://eosclub-astro:4322` (Docker DNS), not `127.0.0.1`.

---

## Phase 9 — CI/CD Branch Alignment

Deployment branch is **`main`** end-to-end:

- GitHub Actions deploy workflow triggers on `main`
- `deploy/rebuild.sh` pulls `origin/main`
- Keystatic saves should commit to `main`

Do not deploy mixed branch state.

---

## Phase 10 — Verification Checklist (Blocking)

- [ ] `docker exec nginx wget -qO- http://eosclub-astro:4322/keystatic` returns HTML
- [ ] `https://staging.prod.khanyi.com` loads
- [ ] `https://staging.prod.khanyi.com/keystatic` loads (no blank screen)
- [ ] `https://staging.prod.khanyi.com/api/keystatic/github/callback` is reachable
- [ ] OAuth login roundtrip succeeds
- [ ] Save in Keystatic creates commit on `main`
- [ ] Restart `eosclub_astro` and confirm `/keystatic` still works without manual rebuild
- [ ] Canonical/sitemap URLs on staging point to `https://staging.prod.khanyi.com`

---

## Switch to Production (`eos-club.de`)

After staging is verified:

1. Create second OAuth app for `https://eos-club.de/api/keystatic/github/callback`
2. Update `/var/www/private/eosclub/.env` with production OAuth values
3. Set `PUBLIC_SITE_URL=https://eos-club.de`
4. Copy `deploy/nginx/eosclub.conf` into Nginx conf directory
5. Reload Nginx and rebuild:

```bash
docker exec nginx nginx -t && docker exec nginx nginx -s reload
docker exec eosclub_astro /app/repo/deploy/rebuild.sh
```

---

## Troubleshooting Quick Reference

| Symptom | Primary check |
|---|---|
| 502 on `/keystatic` | `docker exec nginx wget -qO- http://eosclub-astro:4322/keystatic` |
| OAuth redirect failure | Exact callback URL in GitHub OAuth app |
| Site 404s | Verify `dist/client/index.html` exists |
| Keystatic seems local-only | Verify Node process starts with `NODE_ENV=production` |
| Container rebuild uses wrong code | Verify server branch is `main` + `git pull origin main` succeeds |

