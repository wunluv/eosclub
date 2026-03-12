# EOS CLUB — Staging Deployment Setup Guide (Keystatic Cloud)

**Target URL:** `https://staging.eos-club.de`
**Server:** DigitalOcean Droplet (shared Docker host)
**Architecture:** Astro hybrid build (`dist/client` + `dist/server`) with Nginx reverse proxy
**CMS:** Keystatic Cloud

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

```
GitHub push to main
  -> GitHub Actions (deploy workflow)
  -> SSH to droplet
  -> docker exec eosclub_astro /app/repo/deploy/rebuild.sh
  -> git pull origin main + pnpm install + build
  -> static pages served from /var/www/public/eosclub/dist/client
  -> Astro Node server serves Keystatic SSR routes on :4322
  -> Nginx proxies /keystatic and /api/keystatic to eosclub-astro:4322
  -> Keystatic redirects to keystatic.cloud for authentication
```

Host directory layout:
```
/var/www/public/
  eosclub/               <- git repo (actual directory)
  eosclub/dist/client/   <- Astro static output (served by Nginx)
  eosclub/dist/server/   <- Astro SSR output (Node server on :4322)
  staging.eos-club.de -> eosclub/dist   (symlink — nginx roots here for staging)
  eos-club.de         -> eosclub        (symlink — production)
```

Keystatic in staging/production runs in **Cloud storage mode** (sign in via keystatic.cloud, no GitHub OAuth).

---

## Phase 1 — Host Directories

```bash
sudo mkdir -p /var/www/public/eosclub
sudo mkdir -p /var/www/private/eosclub
sudo chown -R deploy:deploy /var/www/public/eosclub
sudo chown -R deploy:deploy /var/www/private/eosclub
```

Create the nginx symlinks (if not already present):

```bash
sudo ln -s /var/www/public/eosclub/dist       /var/www/public/staging.eos-club.de
sudo ln -s /var/www/public/eosclub            /var/www/public/eos-club.de
```

---

## Phase 2 — Clone Repository

Clone into `/var/www/public/eosclub`:

```bash
cd /var/www/public
git clone git@github.com:wunluv/eosclub.git eosclub
```

Validate access:

```bash
ssh -T git@github.com
```

---

## Phase 3 — Environment File

Create `/var/www/private/eosclub/.env`:

```dotenv
# Keystatic Cloud — no OAuth secrets needed
# Auth handled by keystatic.cloud

PUBLIC_SITE_URL=https://staging.eos-club.de
PUBLIC_GAS_ENDPOINT=

# Optional override if backend network name differs from deploy_backend
# EOS_BACKEND_NETWORK=deploy_backend
```

Protect file:

```bash
sudo chmod 600 /var/www/private/eosclub/.env
```

---

## Phase 4 — Keystatic Cloud Setup (One-Time)

1. Go to [keystatic.cloud](https://keystatic.cloud) and sign in
2. Create a team: `eos-club`
3. Create a project: `eosclub`
4. Link to GitHub repo: `wunluv/eosclub`
5. Enable **Allow local development** (for local dev at `localhost:4321/keystatic`)
6. In project settings, add **Primary URL**: `https://staging.eos-club.de`

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
sudo cp /var/www/public/eosclub/deploy/nginx/eosclub-staging.conf \
        /var/www/private/nginx/conf.d/staging.eos-club.de.conf
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

---

## Phase 10 — Verification Checklist (Blocking)

- [ ] `docker exec nginx wget -qO- http://eosclub-astro:4322/keystatic` returns HTML
- [ ] `https://staging.eos-club.de` loads
- [ ] `https://staging.eos-club.de/keystatic` redirects to keystatic.cloud
- [ ] Sign in with keystatic.cloud account succeeds
- [ ] Content saves create commits in the repo
- [ ] Restart `eosclub_astro` and confirm `/keystatic` still works without manual rebuild
- [ ] Canonical/sitemap URLs on staging point to `https://staging.eos-club.de`

---

## Switch to Production (`eos-club.de`)

After staging is verified:

1. In keystatic.cloud project settings, add Primary URL: `https://eos-club.de`
2. Update `/var/www/private/eosclub/.env` with `PUBLIC_SITE_URL=https://eos-club.de`
3. Copy `deploy/nginx/eosclub.conf` into Nginx conf directory
4. Reload Nginx and rebuild:

```bash
docker exec nginx nginx -t && docker exec nginx nginx -s reload
docker exec eosclub_astro /app/repo/deploy/rebuild.sh
```

---

## Troubleshooting Quick Reference

| Symptom | Primary check |
|---|---|
| 502 on `/keystatic` | `docker exec nginx wget -qO- http://eosclub-astro:4322/keystatic` |
| Keystatic not redirecting to cloud | Verify `keystatic.config.ts` has `storage: { kind: 'cloud' }` |
| Site 404s | Verify `dist/client/index.html` exists |
| Container rebuild uses wrong code | Verify server branch is `main` + `git pull origin main` succeeds |

---

## See Also

- [`deploy/KEYSTATIC_DEPLOYMENT_GUIDE.md`](deploy/KEYSTATIC_DEPLOYMENT_GUIDE.md) — Full deployment reference
- [`archive/STAGING_SETUP_GUIDE_github_oauth.md`](archive/STAGING_SETUP_GUIDE_github_oauth.md) — Old GitHub OAuth setup (deprecated)
