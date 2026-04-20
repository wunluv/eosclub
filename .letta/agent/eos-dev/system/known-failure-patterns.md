---
description: Known failure patterns and diagnostic playbooks. Append new patterns as incidents occur.
---

## Pattern 1: Keystatic Content Breaks Zod Schema → Build Failure → Site 404

**Symptoms:** Site returns 404 on all pages. `dist/` directory missing on server.

**Root cause:** Client edits content via Keystatic Cloud in ways the Zod schema doesn't tolerate. Rebuild script clears `dist/` before building. Build fails → `dist/` gone → nginx has nothing to serve.

**Diagnostic steps:**
1. `ssh mojah2 "ls /var/www/public/eosclub/dist/"` — if missing, build failed
2. Check GitHub Actions: `gh run list --limit 5` — look for failed runs
3. `cd ~/DEV/eosclub && git pull origin main` — get latest commits
4. `NODE_ENV=production pnpm build` locally — reproduce the error
5. Read the Astro error output — it names the exact file and field

**Fix pattern:**
- If client omitted a required field → make it `.optional()` in Zod schema
- If client added invalid data → fix the content OR make schema more tolerant
- Always update the component to handle missing data gracefully (no broken `<img>` tags)
- Build locally to verify → commit → push to main → CI deploys

**Historical occurrence:** 2026-04-20 — `de/studio.md` InteractiveListBlock items missing `image` field. Fixed by making `image` optional in schema + component.

---

## Pattern 2: Duplicate Content ID Warning

**Symptoms:** Build log shows `[WARN] [glob-loader] Duplicate id "de/kurse" found`.

**Root cause:** Astro's content collection loader detects duplicate slugs. Usually harmless warning but can indicate content file issues.

**Status:** Non-blocking. Monitor for escalation.

---

## Pattern 3: Nginx 403 — File Permissions

**Symptoms:** Pages return 403 Forbidden.

**Root cause:** Build runs as root inside Docker. Nginx worker (non-root) can't read files.

**Fix:** `rebuild.sh` includes `chmod -R o+rX dist/client`. If someone bypasses rebuild script, this step gets missed.

**Verify:** `ssh mojah2 "ls -la /var/www/public/eosclub/dist/client/index.html"` — should be world-readable.

---

## Pattern 4: Keystatic Branch Desync

**Symptoms:** Keystatic UI shows stale content or wrong branch.

**Root cause:** Keystatic Cloud commits to `eosclub` branch → auto-merge to `main`. If merge workflow fails, content stuck on `eosclub` branch.

**Diagnostic:** Check if `merge-keystatic-branch.yml` workflow ran successfully.

**Fix:** Manually merge: `git checkout main && git merge origin/eosclub && git push`

---

## Pattern 5: Node Server Not Running

**Symptoms:** `/keystatic` returns 502 or connection refused. Static pages work fine.

**Root cause:** Astro Node server (`dist/server/entry.mjs`) crashed or wasn't started after rebuild.

**Diagnostic:**
```bash
ssh mojah2 "docker exec eosclub_astro ps aux | grep entry.mjs"
ssh mojah2 "docker exec eosclub_astro cat /tmp/astro-node-server.pid"
```

**Fix:** Rebuild script handles restart. If manual restart needed:
```bash
ssh mojah2 "docker exec eosclub_astro sh -c 'NODE_ENV=production HOST=0.0.0.0 PORT=4322 node /app/repo/dist/server/entry.mjs &'"
```

---

## Pattern 6: Git Safe Directory Block

**Symptoms:** Rebuild fails with `fatal: detected dubious ownership in repository`.

**Root cause:** Host repo owned by `deploy` user, container runs as `root`.

**Fix:** Already handled in `rebuild.sh`: `git config --global --add safe.directory "$REPO_DIR"`. If bypassed:
```bash
docker exec eosclub_astro git config --global --add safe.directory /app/repo
```
