# EOS CLUB — Staging Deployment Setup Guide

**Target URL:** `https://staging.prod.khanyi.com`
**Server:** DigitalOcean Droplet (same host as existing Docker stack)
**Architecture:** Astro SSG → Docker container (build) → Nginx (serve)

---

## Architecture Overview

```
GitHub push → GitHub Actions → SSH to server
                                    ↓
                          docker exec eosclub_astro
                                    ↓
                            /app/repo/deploy/rebuild.sh
                            (git pull + pnpm build + rsync)
                                    ↓
                    /var/www/public/eos.khanyi.com/dist/
                                    ↓
                    Nginx → staging.prod.khanyi.com (HTTPS)
```

Keystatic CMS in production uses **GitHub storage mode** — the admin UI runs as a client-side SPA in the browser and commits changes directly to `wunluv/eosclub` via the GitHub API. No separate CMS server is needed.

---

## Phase 1 — Server-Side Directory Setup

SSH into the droplet and run once:

```bash
# Create the directory structure
sudo mkdir -p /var/www/public/eos.khanyi.com/repo
sudo mkdir -p /var/www/public/eos.khanyi.com/dist
sudo mkdir -p /var/www/private/eosclub

# Set ownership so your deploy user can write
sudo chown -R $USER:$USER /var/www/public/eos.khanyi.com
sudo chown -R $USER:$USER /var/www/private/eosclub
```

---

## Phase 2 — Clone the Repository

The Docker container mounts `/var/www/public/eos.khanyi.com/repo` as its working directory. Clone the repo there on the host:

```bash
cd /var/www/public/eos.khanyi.com
git clone git@github.com:wunluv/eosclub.git repo
```

> **SSH key requirement:** The droplet user must have a GitHub SSH key with read access to `wunluv/eosclub`.
> Check: `ssh -T git@github.com`
> If not set up: `ssh-keygen -t ed25519 -C "deploy@khanyi"` then add the public key to your GitHub deploy keys.

---

## Phase 3 — Environment Variables

Create the production `.env` file on the server:

```bash
sudo nano /var/www/private/eosclub/.env
```

Paste the following (fill in real values — see Phase 4 for OAuth setup):

```dotenv
# GitHub OAuth App — STAGING
KEYSTATIC_GITHUB_CLIENT_ID=<from_github_oauth_app>
KEYSTATIC_GITHUB_CLIENT_SECRET=<from_github_oauth_app>
KEYSTATIC_SECRET=<run: openssl rand -hex 32>

PUBLIC_GITHUB_REPO=wunluv/eosclub
PUBLIC_SITE_URL=https://staging.prod.khanyi.com
PUBLIC_GAS_ENDPOINT=
```

Protect the file:

```bash
sudo chmod 600 /var/www/private/eosclub/.env
```

---

## Phase 4 — GitHub OAuth App (Keystatic CMS Login)

Keystatic needs a GitHub OAuth App to authenticate CMS editors.

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
2. Fill in:
   - **Application name:** `EOS CLUB Keystatic (Staging)`
   - **Homepage URL:** `https://staging.prod.khanyi.com`
   - **Authorization callback URL:** `https://staging.prod.khanyi.com/api/keystatic/github/callback`
3. Click **Register application**
4. Copy **Client ID** → `KEYSTATIC_GITHUB_CLIENT_ID` in `/var/www/private/eosclub/.env`
5. Click **Generate a new client secret** → `KEYSTATIC_GITHUB_CLIENT_SECRET`

> When you later point the production domain `eos-club.de` to the same server, create a **second** OAuth App with `https://eos-club.de` URLs. Each domain needs its own app because OAuth callback URLs are domain-specific.

---

## Phase 5 — Start the Docker Container

The EOS CLUB container is defined in `deploy/docker-compose.eosclub.yml`.
It attaches to the existing `docker_backend` network used by the main `docker-compose.yaml`.

```bash
# From /var/www/public/eos.khanyi.com/repo (or any path with the file):
docker compose -f deploy/docker-compose.eosclub.yml up -d

# Verify the container is running:
docker ps | grep eosclub_astro

# Watch startup logs (pnpm install happens on first boot):
docker logs -f eosclub_astro
```

---

## Phase 6 — First Build

Trigger the initial build manually inside the container:

```bash
docker exec eosclub_astro /app/repo/deploy/rebuild.sh
```

This will:
1. `git pull origin main`
2. `pnpm install --frozen-lockfile`
3. `NODE_ENV=production pnpm run build`
4. `rsync dist/ → /app/dist/` (i.e. host `/var/www/public/eos.khanyi.com/dist/`)

Check output — look for `Rebuild and deploy successful`.

---

## Phase 7 — Nginx Configuration

### 7a. Copy the staging vhost config

```bash
sudo cp /var/www/public/eos.khanyi.com/repo/deploy/nginx/eosclub-staging.conf \
        /var/www/private/nginx/conf.d/eosclub-staging.conf
```

### 7b. Issue SSL certificate (Let's Encrypt)

The Nginx container handles Certbot. Inside the Nginx container:

```bash
docker exec -it nginx certbot --nginx \
  -d staging.prod.khanyi.com \
  --non-interactive --agree-tos \
  -m your@email.com
```

Or if you use `certbot` on the host:

```bash
certbot certonly --webroot \
  -w /var/www/public \
  -d staging.prod.khanyi.com \
  --non-interactive --agree-tos \
  -m your@email.com
```

### 7c. Reload Nginx

```bash
docker exec nginx nginx -t && docker exec nginx nginx -s reload
```

### 7d. Test

Open `https://staging.prod.khanyi.com` — you should see the EOS CLUB home page.

---

## Phase 8 — GitHub Actions Secrets

For automated deploys on every `git push` to `main`, add these secrets to the GitHub repo:

**GitHub → Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|-------------|-------|
| `DO_HOST` | Droplet IP or hostname |
| `DO_USER` | SSH username (e.g. `root` or your deploy user) |
| `DO_SSH_KEY` | Private SSH key (the one whose public key is on the droplet) |

> Generate a dedicated deploy key if you haven't:
> ```bash
> ssh-keygen -t ed25519 -f ~/.ssh/eosclub_deploy -C "github-actions"
> # Add ~/.ssh/eosclub_deploy.pub to ~/.ssh/authorized_keys on the droplet
> # Add the contents of ~/.ssh/eosclub_deploy (private) as DO_SSH_KEY in GitHub
> ```

Push a commit to `main` and watch the **Actions** tab — it should call `docker exec eosclub_astro /app/repo/deploy/rebuild.sh`.

---

## Phase 9 — Verify Keystatic CMS

1. Visit `https://staging.prod.khanyi.com/keystatic`
2. Click **Sign in with GitHub**
3. You'll be redirected to GitHub to authorise the OAuth App
4. After redirect back, you should see the Keystatic dashboard with all Pages
5. Edit a field and click **Save** — this creates a commit on `main`
6. The GitHub Action fires, rebuilds the site, and the change is live in ~60s

---

## Switching to Production (eos-club.de)

When staging is verified:

1. Create a **second** GitHub OAuth App with `https://eos-club.de` callback URL
2. Update `/var/www/private/eosclub/.env` with the production OAuth credentials
3. Copy `deploy/nginx/eosclub.conf` to `/var/www/private/nginx/conf.d/eosclub.conf`
4. Issue SSL cert for `eos-club.de` and `www.eos-club.de`
5. Point DNS for `eos-club.de` → droplet IP
6. Reload Nginx
7. Update `PUBLIC_SITE_URL=https://eos-club.de` in the `.env` file
8. Trigger a rebuild: `docker exec eosclub_astro /app/repo/deploy/rebuild.sh`

The staging and production domains can run from the **same `dist/` directory** since it's a static site.

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Container exits immediately | `docker logs eosclub_astro` — look for pnpm install errors |
| Build fails with missing env vars | Ensure `/var/www/private/eosclub/.env` exists and `env_file` path matches in compose file |
| Nginx shows 404 for all pages | Verify `dist/index.html` exists: `ls /var/www/public/eos.khanyi.com/dist/` |
| `/keystatic` shows blank page | Check browser console — usually a CORS or OAuth misconfiguration |
| Keystatic login fails / redirect error | OAuth callback URL in GitHub App must exactly match `https://<domain>/api/keystatic/github/callback` |
| GitHub Action fails with "no such container" | Container not running — SSH to server and run `docker compose -f ... up -d` |
| `git pull` fails in rebuild.sh | Droplet SSH key not added to GitHub deploy keys |
