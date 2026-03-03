# EOS CLUB — Staging Deployment Worklog
**Date:** 2026-03-03
**Branch:** `feature/keystatic-migration`
**Server:** `/var/www/public/eos.khanyi.com` on DigitalOcean droplet

---

## Key Issues Encountered & Lessons Learned

### 1. OAuth App vs PAT for Keystatic
**Situation:** Unclear whether GitHub OAuth App or PAT was needed.
**Answer:** OAuth App is required. Keystatic GitHub storage mode runs as a browser-side SPA that redirects users through GitHub OAuth. A PAT is a single-user server credential and cannot front a browser login flow.
**Env vars needed:** `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET` (32-byte random hex).
**One OAuth App per domain** — callback URLs are exact-match per app.

---

### 2. .env.example Had a Real OAuth Client ID
**Issue:** `KEYSTATIC_GITHUB_CLIENT_ID=Iv23liMIgc557nhlcJru` was a real credential committed to the example file.
**Fix:** Replaced with `<your_github_oauth_client_id>` placeholder.
**Also found:** Leading space on `PUBLIC_SITE_URL` line — Vite/Astro's env parser silently drops variables with a leading space.

---

### 3. Git Feature Branch on Server
**Situation:** Server was on `main`; needed to switch to `feature/keystatic-migration`.
**Commands:**
```bash
git fetch origin
git checkout feature/keystatic-migration
git pull origin feature/keystatic-migration
```
**Important:** `deploy/rebuild.sh` was hardcoded to `git pull origin main` — updated to pull from the feature branch.

---

### 4. rebuild.sh Missing Executable Bit
**Issue:** `docker exec eosclub_astro /app/repo/deploy/rebuild.sh` returned `permission denied`.
**Root cause:** The script was committed at mode `100644` (not executable).
**Fix:**
```bash
chmod +x deploy/rebuild.sh
git update-index --chmod=+x deploy/rebuild.sh
git commit -m "fix: rebuild.sh must be executable (mode 100755)"
```
**Note:** After `chmod` on the server, git tracked a local mode change that blocked `git pull`. Fix: `git checkout -- deploy/rebuild.sh && git pull`.
**Also useful:** `git config core.fileMode false` prevents git from getting blocked on file mode changes on the server.

---

### 5. Repository Cloned in Wrong Directory
**Situation:** The repo was cloned directly into `/var/www/public/eos.khanyi.com/` but `docker-compose.eosclub.yml` expected it at `.../eos.khanyi.com/repo/`.
**Fix:** Updated the volume mount in `docker-compose.eosclub.yml`:
```yaml
# Before (wrong):
- /var/www/public/eos.khanyi.com/repo:/app/repo
# After (correct for this server):
- /var/www/public/eos.khanyi.com:/app/repo
```

---

### 6. Nginx 403 — File Permissions
**Issue:** Site returned 403 after first successful build.
**Root cause:** Docker build runs as `root`; files in `dist/` are owned by `root:root` with mode `644/755`. Nginx worker process (non-root) cannot read them.
**Fix:** Add to `rebuild.sh` after build:
```sh
chmod -R o+rX "$REPO_DIR/dist/client"
```
This makes files world-readable so Nginx can serve them regardless of ownership.

---

### 7. @astrojs/node Adapter Creates dist/client/ + dist/server/ Split
**Issue:** Nginx was configured to serve from `dist/` but `index.html` didn't exist there. It was at `dist/client/index.html`.
**Root cause:** When `@astrojs/node` adapter is present (even with `output: 'static'`), Astro operates in hybrid mode:
- Static pages → `dist/client/`
- SSR routes (Keystatic) → `dist/server/`

**Fix:** Update Nginx `root` to `dist/client/`.

---

### 8. Keystatic SSR Routes Cannot Be Served Statically
**Issue:** `/keystatic` returned 404 even after pointing Nginx at `dist/client/` — because `dist/client/keystatic/` doesn't exist.
**Root cause:** Keystatic's `@keystatic/astro` integration registers `/keystatic/[...params]` with `prerender = false`. With the node adapter present, this is a server-side route that lives in `dist/server/pages/keystatic/`.
**Wrong approach:** Creating a manual `src/pages/keystatic/[...params].astro` — the integration auto-registers the route. Also, importing from `@keystatic/astro/route` doesn't exist in v5.0.6.
**Correct approach:** Run the Astro Node server (`node dist/server/entry.mjs`) as a persistent process and proxy Nginx `/keystatic` and `/api/keystatic` to it.

---

### 9. Astro Node Server Architecture (Final Correct Setup)
**Architecture:**
```
Browser
  ↓
Nginx (staging.prod.khanyi.com)
  ├─ /* static pages  →  dist/client/  (served directly)
  ├─ /keystatic/*     →  proxy → 127.0.0.1:4322 (Astro Node server)
  └─ /api/keystatic/* →  proxy → 127.0.0.1:4322 (Astro Node server)
                               ↑
                     node dist/server/entry.mjs (inside Docker container)
                     Host port 4322 mapped to container port 4322
```

**Why not port 4321:** Another container (`astro_oneplusone`) was already bound to `0.0.0.0:4321`. Use `ss -tlnp | grep 4321` or `docker ps --format "{{.Names}}\t{{.Ports}}"` to check port conflicts before choosing a port.

**Nginx proxy config:**
```nginx
location /keystatic {
    proxy_pass http://127.0.0.1:4322;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}
location /api/keystatic {
    proxy_pass http://127.0.0.1:4322;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

### 10. dist/ Was Tracked in Git
**Issue:** `dist/` build output was committed to the repo (`.gitignore` had a comment `# build output` but no actual `dist/` pattern).
**Consequence:** After adding `dist/` to `.gitignore` and pushing the "untrack" commit, the server's `git pull` failed because the tracked files still existed as untracked files.
**Fix on server:**
```bash
rm -rf dist/
git pull origin feature/keystatic-migration
```
Safe to do — the rebuild script regenerates `dist/` on every run.

---

### 11. Nginx try_files Redirect Loop
**Issue:** `rewrite or internal redirection cycle while internally redirecting to "/keystatic/index.html"` — 500 error on `/keystatic/`.
**Root cause:** `try_files $uri $uri/ /keystatic/index.html` with no `/keystatic/index.html` existing causes infinite internal redirect. The fallback keeps re-triggering the same location.
**Fix:** Replace `try_files` with a proxy_pass to the Node server (see point 9).

---

## Files Changed (Summary)

| File | Change |
|------|--------|
| `.env.example` | Removed real Client ID; fixed leading space on `PUBLIC_SITE_URL` |
| `.gitignore` | Added `dist/` |
| `deploy/rebuild.sh` | Pulls feature branch; `chmod o+rX dist/client`; starts Node server on port 4322 |
| `deploy/docker-compose.eosclub.yml` | Fixed volume mount path; added port `127.0.0.1:4322:4322` |
| `deploy/nginx/eosclub-staging.conf` | Root = `dist/client`; proxy `/keystatic` + `/api/keystatic` to port 4322 |
| `astro.config.mjs` | No code change — added comment explaining hybrid mode architecture |
