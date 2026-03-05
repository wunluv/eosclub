# Keystatic Staging Analysis Handoff (DigitalOcean)

Date: 2026-03-03
Project: EOS CLUB (Astro + Keystatic)

## Executive Summary

Local Keystatic is working, but staging instability is primarily an **operations/deployment consistency** problem rather than a content-schema problem.

The highest-probability failure cluster is:

1. **Docker networking: Nginx proxy cannot reach the EOS Node server** — this is likely the #1 blocker.
2. Branch mismatch between CI trigger and server-side pull.
3. `NODE_ENV` not set on Node server start — Keystatic may silently use local storage mode.
4. Production Nginx config is completely wrong for the hybrid SSR architecture.
5. Keystatic SSR runtime process not lifecycle-supervised by container startup.
6. `site` URL in `astro.config.mjs` is hardcoded to production domain, not staging.
7. OAuth callback/domain strictness (exact URL match required).
8. Conflicting deployment docs causing incorrect operator actions.

---

## Server Infrastructure Context

The DigitalOcean droplet hosts multiple sites via a shared Docker stack defined in `deploy/docker-compose.yaml`:

- **Nginx** container (ports 80/443) — reverse proxy for all sites, on `web` + `backend` networks
- **astro_oneplusone** — another Astro site, bound to port `4321` (this is why EOS uses 4322)
- **Ghost, MySQL, MariaDB, Redis, PHP** — other services on `backend` network

The EOS CLUB container is defined in a **separate** compose file (`deploy/docker-compose.eosclub.yml`) and claims to join `docker_backend` as an external network.

**Final production domain:** `eos-club.de` (will be pointed to this server once staging works)
**Staging domain:** `staging.prod.khanyi.com`

---

## What Is Already Correct

- Hybrid Astro runtime model is configured in code:
  - `astro.config.mjs` uses Node adapter with `output: 'static'` (hybrid mode).
  - **Staging** Nginx serves `dist/client` and proxies Keystatic routes to Astro Node server on port 4322.
- Keystatic production storage mode toggle is correct (`github` when `NODE_ENV=production`, `local` otherwise).
- Current package/version stack is internally coherent for local development.
- Staging Nginx config (`deploy/nginx/eosclub-staging.conf`) is architecturally correct **in intent** — but the proxy target address is wrong for Docker networking (see Risk #0).

---

## Confirmed Risks / Contradictions

### 0) Docker networking: Nginx proxy likely cannot reach the EOS Node server

**This is the most likely root cause of Keystatic failing on staging.**

The Nginx proxy config uses `proxy_pass http://127.0.0.1:4322`. Inside a Docker container, `127.0.0.1` refers to **the container's own loopback**, not the host machine. So when Nginx tries to proxy to `127.0.0.1:4322`, it's looking for a service on port 4322 inside the Nginx container itself — which doesn't exist.

The EOS container (`deploy/docker-compose.eosclub.yml`) maps `127.0.0.1:4322:4322` to the **host**, but the Nginx container has no way to reach the host's `127.0.0.1` from inside its own network namespace.

Additionally, there's a **network name mismatch**:

- Main compose (`deploy/docker-compose.yaml`) defines a `backend` network as a local bridge — Docker names it `deploy_backend` (or similar, based on the compose project name).
- EOS compose (`deploy/docker-compose.eosclub.yml`) references `docker_backend` as an external network.
- These may or may not be the same network depending on how the main compose was started (project name, directory name, etc.).

**Impact:** Every request to `/keystatic` and `/api/keystatic` returns 502 Bad Gateway or connection refused — Keystatic appears completely broken even though the Node server may be running fine inside the EOS container.

**Fix options (choose one):**

- **Option A (simplest):** Run Nginx on the host network instead of a Docker bridge. Then `127.0.0.1:4322` works as expected. But this changes the Nginx container's networking model for all sites.

- **Option B (recommended):** Change the Nginx proxy to use the EOS container's hostname on the shared Docker network:
  ```nginx
  proxy_pass http://eosclub-astro:4322;
  ```
  This requires both containers to be on the same Docker network. Verify the network name:
  ```bash
  docker network ls | grep backend
  docker inspect eosclub_astro --format '{{json .NetworkSettings.Networks}}' | python3 -m json.tool
  docker inspect nginx --format '{{json .NetworkSettings.Networks}}' | python3 -m json.tool
  ```
  If they're on different networks, either:
  - Add the EOS container to the same network as Nginx, or
  - Give the EOS compose the correct external network name.

- **Option C:** Use Docker's `host.docker.internal` (available on Docker Desktop, may need `extra_hosts` on Linux):
  ```nginx
  proxy_pass http://host.docker.internal:4322;
  ```
  With `extra_hosts: ["host.docker.internal:host-gateway"]` in the Nginx service.

**Diagnostic commands to run on the server:**
```bash
# 1. Check what networks each container is on
docker inspect nginx --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
docker inspect eosclub_astro --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'

# 2. Check if the EOS Node server is actually running
docker exec eosclub_astro sh -c 'wget -qO- http://127.0.0.1:4322/keystatic || echo FAILED'

# 3. Check if Nginx can reach the EOS container by hostname
docker exec nginx sh -c 'wget -qO- http://eosclub-astro:4322/keystatic || echo FAILED'

# 4. Check if Nginx can reach 127.0.0.1:4322 (this will likely fail)
docker exec nginx sh -c 'wget -qO- http://127.0.0.1:4322/keystatic || echo FAILED'
```

---

### 1) CI branch trigger != rebuild pull branch

- GitHub Actions deploy workflow (`.github/workflows/deploy.yml`) triggers on `main`.
- Rebuild script (`deploy/rebuild.sh:36`) pulls `feature/keystatic-migration`.

**Impact:** Keystatic saves commit to `main` (via GitHub storage mode), CI triggers, but the server pulls a different branch. The deployed code may be stale or divergent.

**Fix:** Align all three: workflow trigger branch, rebuild pull branch, and server checkout.

### 2) Port mismatch in rebuild.sh comments vs actual command

- `deploy/rebuild.sh:16-17` comments say "port 4321" and "Nginx proxies to 127.0.0.1:4321".
- `deploy/rebuild.sh:57` log message says "Starting Astro Node server on port 4321..."
- `deploy/rebuild.sh:63` actual command uses `PORT=4322`.

**Impact:** Misleading during debugging. If someone reads the comments and tries to diagnose connectivity, they'll look at the wrong port. Not a runtime blocker per se, but a debugging trap.

**Fix:** Update comments and log message to say 4322.

### 3) Production Nginx config is completely wrong

`deploy/nginx/eosclub.conf` has critical errors:

- **Root path is wrong:** Points to `dist/` instead of `dist/client/`. With the Node adapter, static files live in `dist/client/`.
- **Keystatic routing is wrong:** Uses `try_files $uri $uri/ /keystatic/index.html` — a static SPA fallback pattern. But Keystatic with `@keystatic/astro` registers SSR routes (`prerender = false`). There is no `dist/client/keystatic/index.html`. This will cause either 404 or infinite redirect loops (already documented in `deploy/DEPLOYMENT_WORKLOG.md` issue #11).
- **No API proxy:** Missing `location /api/keystatic` proxy block entirely. OAuth callbacks and API calls will 404.

**Impact:** When you switch from staging to production domain, Keystatic will be completely broken even if staging works perfectly.

**Fix:** Production Nginx config must mirror the staging config pattern — proxy `/keystatic` and `/api/keystatic` to the Node server, and set root to `dist/client`.

### 4) `site` URL hardcoded to production domain

`astro.config.mjs:38` has `site: 'https://eos-club.de'`. This affects:

- Canonical URLs generated during build
- Sitemap URLs
- OG image absolute URLs

When building for staging, this produces wrong canonical/sitemap URLs pointing to `eos-club.de` instead of `staging.prod.khanyi.com`.

**Impact:** SEO metadata is wrong on staging (minor for staging itself, but means the build process isn't environment-aware). More importantly, if Keystatic or Astro uses `site` internally for redirect URLs or CORS origins, it could cause subtle failures.

**Fix:** Make `site` configurable via environment variable, e.g. `site: process.env.PUBLIC_SITE_URL || 'https://eos-club.de'`.

### 5) Keystatic SSR process startup fragility

- Container startup command (`deploy/docker-compose.eosclub.yml:10-16`) keeps container alive with `tail -f /dev/null`.
- Astro Node SSR is only started when `deploy/rebuild.sh` runs.
- PID file is stored at `/tmp/astro-node-server.pid` — this is ephemeral and lost on container restart.

**Impact:** After container restarts (host reboot, Docker restart, OOM kill, crash recovery), `/keystatic` goes down until someone manually runs `docker exec eosclub_astro /app/repo/deploy/rebuild.sh`.

**Fix:** Either:
- (A) Change container command to start the Node server after initial setup (requires `dist/server/entry.mjs` to exist — so first build must happen first), or
- (B) Add a startup script that checks if `dist/server/entry.mjs` exists and starts it, or
- (C) Use a lightweight process supervisor like `s6-overlay` or a simple shell loop.

### 6) OAuth strict callback matching

Keystatic GitHub mode requires exact callback URL/domain match in GitHub OAuth app settings. The callback URL must be:
`https://<domain>/api/keystatic/github/callback`

**Impact:** Any mismatch causes login redirect failure even when app infrastructure is otherwise healthy.

**Verification needed:** Confirm the OAuth App registered in GitHub has callback URL exactly matching `https://staging.prod.khanyi.com/api/keystatic/github/callback`.

### 7) Deployment documentation drift

Multiple docs have conflicting architecture instructions:

| Doc | Issue |
|-----|-------|
| `deploy/KEYSTATIC_DEPLOYMENT_GUIDE.md` | Still shows static `try_files` pattern for `/keystatic` and proxy to port 4321 — both wrong |
| `deploy/STAGING_SETUP_GUIDE.md` | Phase 2 says clone into `/repo` subdir, but compose mounts parent path directly |
| `deploy/STAGING_SETUP_GUIDE.md` | Phase 6 describes `rsync` step that doesn't exist in current `rebuild.sh` |
| `deploy/STAGING_SETUP_GUIDE.md` | Phase 6 says `git pull origin main` but rebuild.sh pulls feature branch |

**Impact:** Team members can execute valid-looking but incompatible steps, recreating recurring failures.

### 8) `NODE_ENV` detection for Keystatic storage mode

`keystatic.config.ts:5` uses `process.env.NODE_ENV === 'production'` to switch between GitHub and local storage. The rebuild script sets `NODE_ENV=production` only for the build command (`deploy/rebuild.sh:44`). The Node server process started on line 63 does NOT explicitly set `NODE_ENV`.

**Impact:** If `NODE_ENV` is not set in the container's environment (via `.env` file or compose), the running Astro Node server may default to `local` storage mode instead of `github` mode. This would cause Keystatic to try writing to the local filesystem instead of committing to GitHub — which would appear to work but changes would be lost on next rebuild/pull.

**Fix:** Either:
- Add `NODE_ENV=production` to the `.env` file on the server, or
- Set it explicitly in the Node server start command: `NODE_ENV=production HOST=0.0.0.0 PORT=4322 node ...`

---

## Note on Keystatic Schema Pattern Conflict

Two internal notes conflict on whether block schemas should use `fields.object()` wrappers in `fields.blocks()`:

- `plans/keystatic-vite-stability-notes.md` says: use `fields.object()` — required for ComponentSchema type.
- `plans/keystatic-stable-pattern.md` says: do NOT use `fields.object()` — causes image loss.

Current `keystatic.config.ts` uses `fields.object()` wrappers with `fields.text()` for image paths (not `fields.image()`). This is a working compromise for the pinned versions (`@keystatic/core@0.5.48`, `@keystatic/astro@5.0.6`, `@keystar/ui@0.7.19`).

**Recommendation:** Keep the current implementation. Do not change schema patterns as part of the staging fix.

---

## Recommended Path Forward

### P0 — Fix Docker Networking for Nginx → EOS Proxy (CRITICAL — Do First)

**This is the most likely reason Keystatic doesn't work on staging.**

Run the diagnostic commands from Risk #0 above to confirm. Then fix:

**Recommended approach:** Change Nginx proxy to use the container service name on the shared Docker network instead of `127.0.0.1`.

1. **Verify network connectivity:**
   ```bash
   # Check what networks each container is on
   docker inspect nginx --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
   docker inspect eosclub_astro --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'

   # Check the actual network name created by the main compose
   docker network ls | grep backend
   ```

2. **Ensure both containers share a network.** The main compose backend network may be named differently than `docker_backend`. Update `deploy/docker-compose.eosclub.yml` external network name to match the actual network name on the server.

3. **Update Nginx proxy target** in `deploy/nginx/eosclub-staging.conf`:
   ```nginx
   # Change from:
   proxy_pass http://127.0.0.1:4322;
   # Change to (use service name from docker-compose.eosclub.yml):
   proxy_pass http://eosclub-astro:4322;
   ```
   Docker DNS resolves service names on shared networks. The container name `eosclub_astro` or service name `eosclub-astro` should both work.

4. **Reload Nginx:**
   ```bash
   docker exec nginx nginx -t && docker exec nginx nginx -s reload
   ```

### P1 — Branch Strategy Alignment (Immediate)

Choose one deployment branch strategy and enforce it everywhere:

- **Option A (recommended):** Merge `feature/keystatic-migration` into `main`, then deploy `main` everywhere.
- **Option B:** Change workflow trigger and rebuild script to both use the feature branch.

**Required alignment points:**

| File | Current | Must match |
|------|---------|------------|
| `.github/workflows/deploy.yml` | triggers on `main` | chosen branch |
| `deploy/rebuild.sh:36` | pulls `feature/keystatic-migration` | chosen branch |
| Server git checkout | unknown — verify | chosen branch |
| Keystatic GitHub storage | commits to repo default branch | chosen branch |

### P2 — Fix NODE_ENV for Runtime (Immediate)

Ensure the Astro Node server runs with `NODE_ENV=production` so Keystatic uses GitHub storage mode.

In `deploy/rebuild.sh:63`, change:
```sh
HOST=0.0.0.0 PORT=4322 node "$REPO_DIR/dist/server/entry.mjs" &
```
to:
```sh
NODE_ENV=production HOST=0.0.0.0 PORT=4322 node "$REPO_DIR/dist/server/entry.mjs" &
```

### P3 — Fix Production Nginx Config (Before pointing eos-club.de)

`deploy/nginx/eosclub.conf` must be updated to match the staging pattern:

- Change `root` from `dist/` to `dist/client/`
- Replace `try_files` Keystatic block with `proxy_pass` to Node server (using Docker service name, not `127.0.0.1`)
- Add `location /api/keystatic` proxy block
- Ensure port matches the one used by the Node server

### P4 — Runtime Hardening (High Priority)

Make Astro Node SSR process lifecycle-managed at container startup, not only started during rebuild.

Simplest approach: modify container command to check for and start the Node server if `dist/server/entry.mjs` exists:

```sh
command: >
  /bin/sh -c "
    apk add --no-cache git curl rsync &&
    curl -fsSL https://get.pnpm.io/install.sh | ENV=/root/.shrc SHELL=/bin/sh sh - &&
    export PATH=/root/.local/share/pnpm:$$PATH &&
    if [ -f /app/repo/dist/server/entry.mjs ]; then
      NODE_ENV=production HOST=0.0.0.0 PORT=4322 node /app/repo/dist/server/entry.mjs &
    fi &&
    tail -f /dev/null
  "
```

### P5 — Make `site` URL Environment-Aware (High Priority)

In `astro.config.mjs`, change:
```js
site: 'https://eos-club.de',
```
to:
```js
site: process.env.PUBLIC_SITE_URL || 'https://eos-club.de',
```

### P6 — Fix rebuild.sh Comments/Logs (Quick Win)

Update misleading port references in `deploy/rebuild.sh` comments (lines 16-17) and log message (line 57) from 4321 to 4322.

### P7 — Documentation Unification (High Priority)

Update deployment docs so there is one unambiguous source of truth for:

- clone/mount paths
- branch strategy
- rebuild behavior
- Keystatic route serving model (SSR proxy, not static `try_files` fallback)
- Port numbers
- Docker network names

Mark obsolete instructions as deprecated to prevent regression loops.

### P8 — Verify End-to-End (Blocking Gate)

After implementing P0–P7, complete this checklist:

- [ ] **Network:** `docker exec nginx wget -qO- http://eosclub-astro:4322/keystatic` returns HTML (not connection refused)
- [ ] **Static site:** `https://staging.prod.khanyi.com` loads the homepage
- [ ] **Keystatic UI:** `https://staging.prod.khanyi.com/keystatic` loads without blank screen
- [ ] **API routes:** `https://staging.prod.khanyi.com/api/keystatic/github/callback` is reachable (not 404)
- [ ] **OAuth:** GitHub OAuth login roundtrip succeeds (exact callback URL match)
- [ ] **Save:** Save in Keystatic creates commit in expected repo/branch
- [ ] **Branch:** CI deploy and rebuild use the same branch
- [ ] **Storage mode:** `NODE_ENV=production` is set for the running Node server — verify Keystatic shows "Sign in with GitHub" (not local file mode)
- [ ] **Restart resilience:** Restart container and confirm `/keystatic` still works without manual rebuild
- [ ] **Canonical URLs:** Page source canonical/sitemap URLs point to correct domain for the environment

---

## File Pointers Reviewed in This Analysis

| File | Key Finding |
|------|-------------|
| `astro.config.mjs` | `site` hardcoded to production domain |
| `keystatic.config.ts` | `NODE_ENV` detection for storage mode |
| `deploy/docker-compose.eosclub.yml` | `tail -f /dev/null` — no SSR auto-start; network name may not match main compose |
| `deploy/docker-compose.yaml` | Main server compose — defines `backend` network (name depends on project name) |
| `deploy/rebuild.sh` | Branch mismatch, port comment mismatch, missing `NODE_ENV` on server start |
| `deploy/nginx/eosclub-staging.conf` | Proxy model correct in intent, but `127.0.0.1` wrong for Docker networking |
| `deploy/nginx/eosclub.conf` | **Wrong** — static `try_files`, wrong root, no API proxy |
| `.github/workflows/deploy.yml` | Triggers on `main` |
| `deploy/STAGING_SETUP_GUIDE.md` | Multiple stale instructions |
| `deploy/KEYSTATIC_DEPLOYMENT_GUIDE.md` | Stale — still describes static serving model |
| `deploy/DEPLOYMENT_WORKLOG.md` | Good historical reference — documents the journey to current architecture |
| `.env.example` | Correct template |

---

## Practical Conclusion

The shortest path to a stable staging Keystatic is:

1. **Fix Docker networking** (P0) — without this, Nginx cannot proxy to the Keystatic SSR server at all. This is the most likely #1 blocker.
2. **Fix branch alignment** (P1) — without this, deploys are unreliable.
3. **Add `NODE_ENV=production` to Node server start** (P2) — without this, Keystatic may silently use local storage mode.
4. **Fix production Nginx config** (P3) — without this, production will break when you point `eos-club.de`.
5. **Ensure SSR process survives container restarts** (P4) — without this, Keystatic goes down unpredictably.
6. **Make site URL environment-aware** (P5) — prevents canonical URL mismatches.
7. **Clean up docs and comments** (P6–P7) — prevents recurring debugging traps.
8. **Run the verification checklist** (P8) — confirms everything works end-to-end.

This sequence addresses the recurring failure pattern more directly than additional schema rewrites.
