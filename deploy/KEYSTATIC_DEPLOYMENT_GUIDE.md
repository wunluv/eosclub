# Keystatic Deployment Guide — EOS CLUB (Keystatic Cloud)

This guide defines the deployment model for EOS CLUB using **Keystatic Cloud** on the DigitalOcean Docker host.

---

## 1) Storage Mode

EOS CLUB uses **Keystatic Cloud** for content storage:

- Authentication and session management handled by Keystatic Cloud (sign in via keystatic.cloud)
- No GitHub OAuth app required
- No `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, or `PUBLIC_GITHUB_REPO` env vars needed
- Content syncs between keystatic.cloud and your local repo via git

---

## 2) Runtime Model

EOS CLUB uses Astro hybrid output:

- `dist/client/` = static pages/assets served directly by Nginx
- `dist/server/` = Astro Node runtime for Keystatic SSR routes

Correct route model:

- `/keystatic` → proxied to Astro Node server
- `/api/keystatic` → proxied to Astro Node server

---

## 3) Environment Variables

Required:

| Variable | Purpose |
|---|---|
| `PUBLIC_SITE_URL` | Canonical site base URL for build output |
| `NODE_ENV=production` | Required for production builds |

Optional:

| Variable | Purpose |
|---|---|
| `EOS_BACKEND_NETWORK` | Override shared backend Docker network name (default: `deploy_backend`) |
| `PUBLIC_GAS_ENDPOINT` | Google Apps Script endpoint for email capture |

---

## 4) Keystatic Cloud Setup (One-Time)

1. Create an account at [keystatic.cloud](https://keystatic.cloud)
2. Create a team (e.g., `eos-club`)
3. Create a project (e.g., `eosclub`)
4. Link the project to your GitHub repo: `wunluv/eosclub`
5. Enable "Allow local development" if you want local dev at `localhost:4321/keystatic`
6. Add your deployment domains as **Primary URLs** in the project settings:
   - Staging: `https://staging.eos-club.de`
   - Production: `https://eos-club.de`

---

## 5) Keystatic Config

In `keystatic.config.ts`, storage is configured as:

```ts
export default config({
  storage: {
    kind: 'cloud',
  },
  cloud: {
    project: 'eos-club/eosclub',
  },
  // ... collections
});
```

---

## 6) Docker + Nginx Networking Rules

Nginx runs in Docker and must reach EOS via shared Docker network DNS.

Use:

```nginx
proxy_pass http://eosclub-astro:4322;
```

Do **not** use `proxy_pass http://127.0.0.1:4322;` inside nginx container configs.

---

## 7) Rebuild and Runtime Lifecycle

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

## 8) Nginx Requirements (Staging + Production)

For both `deploy/nginx/eosclub-staging.conf` and `deploy/nginx/eosclub.conf`:

- Both staging and production `root`: `/var/www/public/eosclub/dist/client`
- Repo lives at `/var/www/public/eosclub` (actual directory)
- `staging.eos-club.de` and `eos-club.de` are symlinks on the host — nginx configs use the resolved real path
- `/keystatic` proxied to `http://eosclub-astro:4322`
- `/api/keystatic` proxied to `http://eosclub-astro:4322`
- Static route fallback remains:

```nginx
location / {
    try_files $uri $uri/ $uri.html =404;
}
```

---

## 9) Branch Strategy

Deployment branch is `main` end-to-end:

- CI workflow trigger branch: `main`
- Rebuild pull target: `main`

---

## 10) Verification Commands

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
- Public `/keystatic` redirects to keystatic.cloud for authentication

---

## 11) Local Development

With "Allow local development" enabled in keystatic.cloud:

```bash
pnpm dev
# Visit http://localhost:4321/keystatic
```

Authentication happens via your keystatic.cloud account (no local OAuth setup needed).

---

## 12) Deprecated Patterns (Do Not Use)

- GitHub OAuth storage mode (`kind: 'github'`)
- Local storage mode (`kind: 'local'`) in production
- `try_files $uri $uri/ /keystatic/index.html` for Keystatic routes
- Rooting Nginx at `dist/` for hybrid Astro output
- Proxying Keystatic from Nginx container to `127.0.0.1`

See `archive/KEYSTATIC_DEPLOYMENT_GUIDE_github_oauth.md` for the old GitHub OAuth setup (deprecated).
