---
description: Quick-reference command cheat sheet for EOS Club troubleshooting.
---

## Local Commands

```bash
cd ~/DEV/eosclub
git fetch origin && git log HEAD..origin/main --oneline    # check what's new on remote
git pull origin main                                       # sync local
NODE_ENV=production pnpm build                             # build and check for errors
```

## Server Commands

```bash
# SSH to server
ssh mojah2

# Check container status
ssh mojah2 "docker ps -a --filter name=eosclub"

# Check if dist/ exists (site down indicator)
ssh mojah2 "ls /var/www/public/eosclub/dist/client/index.html 2>/dev/null && echo 'OK' || echo 'MISSING'"

# Check Node server health
ssh mojah2 "docker exec eosclub_astro ps aux | grep entry.mjs"

# Check Node server from within nginx container
ssh mojah2 "docker exec nginx wget -qO- http://eosclub-astro:4322/keystatic | head"

# Run rebuild manually
ssh mojah2 "docker exec eosclub_astro /app/repo/deploy/rebuild.sh"

# Check Nginx config
ssh mojah2 "cat /var/www/public/eosclub/deploy/nginx/eosclub.conf"

# Check Docker networks
ssh mojah2 "docker inspect eosclub_astro --format '{{range \$k,\$v := .NetworkSettings.Networks}}{{\$k}} {{end}}'"
ssh mojah2 "docker inspect nginx --format '{{range \$k,\$v := .NetworkSettings.Networks}}{{\$k}} {{end}}'"
```

## GitHub Actions

```bash
cd ~/DEV/eosclub
gh run list --limit 5                                       # recent runs
gh run view <RUN_ID> --log                                  # run logs
gh run watch <RUN_ID> --exit-status                         # live watch
```

## DNS / HTTP Verification

```bash
curl -sI https://eos-club.de | head -5                      # should be 200
curl -sI https://eos-club.de/studio/ | head -5              # should be 200
curl -sI https://eos-club.de/keystatic | head -5            # should redirect to keystatic.cloud
nslookup eos-club.de 8.8.8.8                                # should resolve to 159.65.143.115
```

## Key File Locations (Quick Edit Targets)

| What | File |
|------|------|
| Zod schemas | `src/content/config.ts` |
| Keystatic schemas | `keystatic.config.ts` |
| Block components | `src/components/blocks/*.astro` |
| DE routing | `src/pages/[...slug].astro` |
| DE home | `src/pages/index.astro` |
| EN routing | `src/pages/en/[...slug].astro` |
| Astro config | `astro.config.mjs` |
| Tailwind config | `tailwind.config.mjs` |
| Deploy script | `deploy/rebuild.sh` |
| CI deploy | `.github/workflows/deploy.yml` |
| CI merge | `.github/workflows/merge-keystatic-branch.yml` |
| Nginx prod | `deploy/nginx/eosclub.conf` |
| Nginx staging | `deploy/nginx/eosclub-staging.conf` |
