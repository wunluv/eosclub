# Keystatic Deployment Guide — EOS CLUB

This guide defines the correct Keystatic deployment model for EOS CLUB on the DigitalOcean Docker host.

---

## 1) Runtime Model (Authoritative)

EOS CLUB uses Astro hybrid output:

- `dist/client/` = static pages/assets served directly by Nginx
- `dist/server/` = Astro Node runtime for Keystatic SSR routes

Keystatic is **not** served as a static `try_files` SPA fallback in production.

Correct route model:

- `/keystatic` → proxied to Astro Node server
- `/api/keystatic` → proxied to Astro Node server

---

## 2) Environment Variables

Required for GitHub mode:

| Variable | Purpose |
|---|---|
| `KEYSTATIC_GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `KEYSTATIC_GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret |
| `KEYSTATIC_SECRET` | Keystatic session/auth secret |
| `PUBLIC_GITHUB_REPO` | Repo path (e.g. `wunluv/eosclub`) |
| `PUBLIC_SITE_URL` | Canonical site base URL for build output |

Optional for server network naming differences:

| Variable | Purpose |
|---|---|
| `EOS_BACKEND_NETWORK` | Override shared backend Docker network name (default: `deploy_backend`) |

---

## 3) OAuth App Requirements (Exact Match)

GitHub OAuth callback URL must exactly match the active domain:

- Staging callback: `https://staging.prod.khanyi.com/api/keystatic/github/callback`
- Production callback: `https://eos-club.de/api/keystatic/github/callback`

Use separate OAuth apps for staging and production.

---

## 4) Docker + Nginx Networking Rules

Nginx runs in Docker and must reach EOS via shared Docker network DNS.

Use:

```nginx
proxy_pass http://eosclub-astro:4322;
```

Do **not** use `proxy_pass http://127.0.0.1:4322;` inside nginx container configs.

---

## 5) Rebuild and Runtime Lifecycle

Deployment command:

```bash
docker exec eosclub_astro /app/repo/deploy/rebuild.sh
```

`deploy/rebuild.sh` must:

1. `git pull origin main`
2. `pnpm install --frozen-lockfile`
3. `NODE_ENV=production pnpm run build`
4. `chmod -R o+rX dist/client`
5. Start Astro runtime:

```bash
NODE_ENV=production HOST=0.0.0.0 PORT=4322 node dist/server/entry.mjs
```

Container startup also attempts to start runtime automatically if `dist/server/entry.mjs` already exists.

---

## 6) Nginx Requirements (Staging + Production)

For both `deploy/nginx/eosclub-staging.conf` and `deploy/nginx/eosclub.conf`:

- `root` must be `/var/www/public/eos.khanyi.com/dist/client`
- `/keystatic` proxied to `http://eosclub-astro:4322`
- `/api/keystatic` proxied to `http://eosclub-astro:4322`
- Static route fallback remains:

```nginx
location / {
    try_files $uri $uri/ $uri.html =404;
}
```

---

## 7) Branch Strategy

Deployment branch is `main` end-to-end:

- CI workflow trigger branch: `main`
- Rebuild pull target: `main`
- Keystatic save target branch: repository default (`main`)

---

## 8) Verification Commands

Run on server:

```bash
docker inspect nginx --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
docker inspect eosclub_astro --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
docker exec nginx wget -qO- http://eosclub-astro:4322/keystatic | head
docker exec eosclub_astro sh -c 'wget -qO- http://127.0.0.1:4322/keystatic | head'
```

Expected outcomes:

- Network overlap exists between `nginx` and `eosclub_astro`
- Both internal fetch commands return HTML (not connection refused)
- Public `/keystatic` and callback route are reachable via domain

---

## 9) Deprecated Patterns (Do Not Reintroduce)

- `try_files $uri $uri/ /keystatic/index.html` for Keystatic routes
- Rooting Nginx at `dist/` for hybrid Astro output
- Proxying Keystatic from Nginx container to `127.0.0.1`
- Mixing deployment branches between CI and rebuild script

