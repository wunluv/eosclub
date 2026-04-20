---
description: Core project facts — stack, deployment, access patterns. Everything needed to troubleshoot without discovery.
---

## Stack

Astro v5 hybrid (static + SSR via @astrojs/node). TailwindCSS v3. GSAP v3. Keystatic Cloud CMS. bsport booking integration. pnpm. Docker + Nginx on DigitalOcean.

## Domains & DNS

- **Production:** `eos-club.de` (159.65.143.115)
- **Staging:** `staging.eos-club.de` (same server)
- Both resolve to same IP. Nginx handles virtual hosts.

## Server Access

```
Host alias: mojah2 (in ~/.ssh/config)
IP: 159.65.143.115
User: root
Key: ~/.ssh/do
```

**Important:** Nginx runs inside Docker. Use container DNS (`eosclub-astro:4322`), not `127.0.0.1`, inside nginx configs.

## Docker

```
Container: eosclub_astro (node:20-alpine)
Mount: /var/www/public/eosclub -> /app/repo
Port: 127.0.0.1:4322 -> 4322
```

## Architecture

```
Browser → Nginx (443 ssl)
  ├─ /*                → dist/client/ (static files)
  ├─ /keystatic/*      → proxy → eosclub-astro:4322 (Astro Node SSR)
  └─ /api/keystatic/*  → proxy → eosclub-astro:4322
```

- `dist/client/` = pre-rendered HTML/assets (served by Nginx directly)
- `dist/server/entry.mjs` = Astro Node runtime for Keystatic SSR routes
- Node server runs inside container on port 4322, PID tracked in `/tmp/astro-node-server.pid`

## Deployment Pipeline

1. Keystatic Cloud → commits to `eosclub` branch
2. GitHub Action `merge-keystatic-branch.yml` → merges `eosclub` into `main`
3. Push to `main` triggers `deploy.yml`
4. `deploy.yml` SSHs to server → `docker exec eosclub_astro /app/repo/deploy/rebuild.sh`
5. Rebuild script: `git pull` → `pnpm install` → `rm -rf dist/ .astro/` → `pnpm build` → `chmod dist/client` → restart Node server

**Key:** The rebuild script **deletes dist/ before building**. If the build fails, dist/ is gone → nginx serves 404 for everything.

## Key Paths (on server)

```
/var/www/public/eosclub/          — repo root (bind-mounted into container)
/var/www/public/eosclub/dist/client/  — static output (nginx root)
/var/www/public/eosclub/deploy/       — nginx configs, rebuild script, docker-compose
```

## Key Paths (local)

```
~/DEV/eosclub/                    — local working copy
~/DEV/eosclub/src/content/config.ts   — Zod schemas
~/DEV/eosclub/keystatic.config.ts     — Keystatic CMS schemas
~/DEV/eosclub/src/components/blocks/  — Astro block components
~/DEV/eosclub/deploy/rebuild.sh       — production rebuild script
~/DEV/eosclub/plans/agent-quick-reference.md  — full architecture guide
```

## Environment Variables

Required on server (in container env or .env):
- `PUBLIC_SITE_URL=https://eos-club.de`
- `NODE_ENV=production`

## Content Model

- Pages: `src/content/pages/{de,en}/*.md`
- Bilingual: German (default, no URL prefix), English (`/en/` prefix)
- Each page has `blocks[]` in frontmatter — discriminated union dispatched by route files
- `translationSlug` links DE↔EN page pairs

## Rebuild Command

```bash
# From local (via SSH):
ssh mojah2 "docker exec eosclub_astro /app/repo/deploy/rebuild.sh"

# Or push to main and let CI handle it
```

## Verification After Deploy

```bash
curl -sI https://eos-club.de | head -3
curl -sI https://eos-club.de/studio/ | head -3
curl -sI https://eos-club.de/kurse/ | head -3
```

All should return HTTP 200. Pages redirect from `/studio` → `/studio/` (301) which is normal nginx behavior.

## Reference Documents

- [[plans/agent-quick-reference.md]] — full architecture, block system, routing, i18n
- [[deploy/KEYSTATIC_DEPLOYMENT_GUIDE.md]] — deployment model, Docker/Nginx rules, lifecycle
- [[deploy/DEPLOYMENT_WORKLOG.md]] — history of every deployment issue and fix
- [[reference/incident-log.md]] — live incident log
