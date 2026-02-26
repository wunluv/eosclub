# EOS CLUB — Deployment & Self-Hosted TinaCMS Plan

## Overview

Set up production deployment on an existing DigitalOcean droplet with Docker, integrating a fully self-hosted TinaCMS backend so the client's team member can edit content via a web-based CMS admin panel — no GitHub knowledge required. Content edits flow automatically from the CMS to a live site rebuild.

---

## Current State

| Aspect | Status |
|--------|--------|
| Astro SSG site | ✅ Built — Groups A–E of MVP complete |
| TinaCMS schema | ✅ Defined in `tina/config.ts` (currently TinaCloud mode) |
| Content files | ✅ 16 markdown files (8 DE + 8 EN) |
| GitHub repo | ✅ Pushed to remote origin |
| DigitalOcean droplet | ✅ Running Docker with nginx, Certbot, MariaDB, Redis |
| DNS for `eos-club.de` | ✅ Pointing to droplet |
| Staging domain | ✅ `staging.prod.khanyi.com` available |
| Self-hosted TinaCMS backend | ❌ Not yet created |
| Docker services for EOS CLUB | ❌ Not yet created |
| Nginx config for `eos-club.de` | ❌ Not yet created |
| CI/CD pipeline | ❌ Not yet created |

---

## Architecture

```
Content Editor
      │
      ▼
eos-club.de/admin/  ←── TinaCMS Admin UI, static React app
      │
      ▼ HTTPS POST /api/tina/graphql
      │
  ┌───┴───────────────────────────────────────┐
  │  nginx (existing container)               │
  │  ├── eos-club.de → static dist/ files     │
  │  ├── /admin/* → static admin UI           │
  │  └── /api/tina/* → proxy to tina-backend  │
  └───┬───────────────────────────────────────┘
      │
      ▼
  ┌───┴───────────────────────────────────────┐
  │  tina-backend (new container, port 4001)  │
  │  ├── Express.js + @tinacms/graphql        │
  │  ├── LevelDB content index                │
  │  ├── isomorphic-git for commits           │
  │  ├── Simple password + JWT auth           │
  │  └── On save: commit → push to GitHub     │
  └───┬───────────────────────────────────────┘
      │
      ▼ git push to GitHub
      │
  ┌───┴───────────────────────────────────────┐
  │  GitHub Actions (on push to main)         │
  │  ├── SSH into droplet                     │
  │  ├── git pull origin main                 │
  │  ├── pnpm install && pnpm build           │
  │  └── Copy dist/ → nginx web root          │
  └───────────────────────────────────────────┘
```

### Content Editing Flow — Step by Step

1. **Editor visits** `https://eos-club.de/admin/`
2. **Logs in** with a simple password (no GitHub account needed)
3. **Edits content** in the TinaCMS visual editor (blocks, text, images)
4. **Clicks Save** → TinaCMS admin sends a GraphQL mutation
5. **Backend writes** markdown files to disk, commits to Git, pushes to GitHub
6. **GitHub Action fires** → SSH into the droplet → `git pull && pnpm build`
7. **New `dist/` is served** by nginx — site is live with the changes

Typical latency from Save to live: ~60–90 seconds (GitHub Action build time).

---

## Phase 1 — TinaCMS Self-Hosted Backend

### 1.1 Create `tina-backend/` directory

```
tina-backend/
├── package.json
├── server.js          # Express server + TinaCMS GraphQL
├── auth.js            # Simple password + JWT authentication
├── .env.example       # Backend-specific env vars
└── Dockerfile
```

### 1.2 Backend dependencies (`tina-backend/package.json`)

Key packages:
- `@tinacms/graphql` — GraphQL schema + resolvers from TinaCMS
- `@tinacms/datalayer` — Git-backed data layer
- `level` — LevelDB adapter (lightweight file-based database for content indexing)
- `isomorphic-git` — Git operations (commit, push) from Node.js
- `express` — HTTP server
- `jsonwebtoken` — JWT for auth
- `bcryptjs` — Password hashing
- `cors` — CORS headers
- `http-proxy-middleware` (optional)

### 1.3 Server implementation (`tina-backend/server.js`)

The server will:
1. Boot the TinaCMS GraphQL layer using the project's `tina/config.ts` schema
2. Serve a GraphQL endpoint at `POST /graphql`
3. Protect all GraphQL routes with JWT authentication middleware
4. Handle media uploads to `public/assets/`
5. On content mutations: write to disk → `git add` → `git commit` → `git push`

### 1.4 Authentication (`tina-backend/auth.js`)

Simple password-based auth for a single non-technical editor:

- **Login endpoint**: `POST /api/auth/login`
  - Accepts: `{ password: "..." }`
  - Validates against hashed password stored in `TINA_ADMIN_PASSWORD_HASH` env var
  - Returns: `{ token: "jwt..." }`
- **Auth middleware**: Validates `Authorization: Bearer <token>` on all GraphQL requests
- **JWT expiry**: 7 days (configurable via `TINA_JWT_EXPIRY`)
- **No GitHub OAuth** — the editor never needs a GitHub account

### 1.5 Update `tina/config.ts` for self-hosted mode

Current config points to TinaCloud. Needs conditional logic:

```typescript
// When TINA_SELF_HOSTED=true, point to local backend
contentApiUrlOverride: process.env.TINA_SELF_HOSTED === 'true'
  ? '/api/tina/graphql'
  : undefined,
```

Also update the `branch` config and add the `search` configuration for indexed queries.

### 1.6 Update `.env.example`

Add these variables:
```bash
# TinaCMS Self-Hosted
TINA_SELF_HOSTED=true
TINA_ADMIN_PASSWORD_HASH=     # bcrypt hash of the editor's password
TINA_JWT_SECRET=              # Random secret for JWT signing
TINA_JWT_EXPIRY=7d            # Token expiry (default: 7 days)
GITHUB_PERSONAL_ACCESS_TOKEN= # For git push from backend container
GITHUB_REPO_OWNER=            # GitHub username
GITHUB_REPO_NAME=             # Repository name
```

---

## Phase 2 — Docker Configuration

### 2.1 EOS CLUB services

Add to the existing `docker-compose.yml` on the server (or create a separate `docker-compose.eosclub.yml`):

#### Service: `eosclub-tina`
- **Image**: Custom build from `tina-backend/Dockerfile`
- **Port**: 4001 (internal only, not exposed to host)
- **Volumes**:
  - The Git repo clone mounted at `/app/repo` (read-write)
  - LevelDB data at a persistent volume
- **Networks**: `backend`
- **Environment**: All `TINA_*` and `GITHUB_*` vars
- **Restart**: `unless-stopped`

#### Static site delivery
The Astro SSG output (`dist/`) will be served directly by the existing nginx container via a shared volume:
- **Build process**: Runs inside the tina-backend container (or a dedicated build container) on the cloned repo
- **Output**: `dist/` is written to `/var/www/public/eosclub/` (nginx-accessible volume)
- **No separate container** needed for serving static files — nginx handles it

### 2.2 Dockerfile for tina-backend

```dockerfile
FROM node:20-alpine

# Install git for push operations
RUN apk add --no-cache git

WORKDIR /app

# Copy backend code
COPY tina-backend/package.json tina-backend/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY tina-backend/ .

# Copy tina config for schema resolution
COPY tina/ /app/tina/

EXPOSE 4001

CMD ["node", "server.js"]
```

### 2.3 Build pipeline container/script

For rebuilding the static site after content changes:
- A `deploy/rebuild.sh` script inside the tina-backend container (or triggered externally)
- Steps: `cd /app/repo && git pull && pnpm install && pnpm build && cp -r dist/* /var/www/public/eosclub/`

### 2.4 Docker Compose service block

```yaml
eosclub-tina:
  build:
    context: .
    dockerfile: tina-backend/Dockerfile
  container_name: eosclub_tina
  restart: unless-stopped
  ports:
    - "127.0.0.1:4001:4001"
  volumes:
    - /var/www/public/eosclub/repo:/app/repo
    - /var/www/public/eosclub/dist:/app/dist
    - eosclub_leveldb:/app/data
  env_file:
    - /var/www/private/eosclub/.env
  networks:
    - backend
  logging:
    driver: journald
    options:
      tag: "eosclub-tina"
      mode: non-blocking
      max-buffer-size: "4m"
```

---

## Phase 3 — Nginx Configuration

### 3.1 Server block for `eos-club.de`

Create `/var/www/private/nginx/conf.d/eosclub.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name eos-club.de www.eos-club.de;

    ssl_certificate     /etc/letsencrypt/live/eos-club.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/eos-club.de/privkey.pem;

    # Static site root — Astro build output
    root /var/www/public/eosclub/dist;
    index index.html;

    # TinaCMS Admin UI — served from within dist
    location /admin/ {
        try_files $uri $uri/ /admin/index.html;
    }

    # TinaCMS GraphQL API — proxy to backend
    location /api/tina/ {
        proxy_pass http://eosclub-tina:4001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets — long cache
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA-style fallback for clean URLs
    location / {
        try_files $uri $uri/ $uri.html =404;
    }

    # Custom 404
    error_page 404 /404.html;
}

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name eos-club.de www.eos-club.de;
    return 301 https://$server_name$request_uri;
}
```

### 3.2 Staging server block

Same pattern for `staging.prod.khanyi.com` but pointing to a staging dist directory or the same directory during testing.

### 3.3 SSL via Certbot

Run on the droplet:
```bash
certbot certonly --webroot -w /var/www/public -d eos-club.de -d www.eos-club.de
```

---

## Phase 4 — CI/CD Pipeline

### Option A: GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy EOS CLUB
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to DigitalOcean
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DO_HOST }}
          username: ${{ secrets.DO_USER }}
          key: ${{ secrets.DO_SSH_KEY }}
          script: |
            cd /var/www/public/eosclub/repo
            git pull origin main
            pnpm install --frozen-lockfile
            pnpm build
            rsync -a --delete dist/ /var/www/public/eosclub/dist/
            echo "Deploy complete: $(date)"
```

Secrets needed in GitHub repo settings:
- `DO_HOST` — droplet IP
- `DO_USER` — SSH username
- `DO_SSH_KEY` — SSH private key

### Option B: Webhook Listener (Alternative)

A lightweight Node.js server that listens for GitHub push events. Already specced in `plans/SPEC_MVP_v2.md`. Can co-exist with GitHub Actions.

### Post-Save Rebuild

The TinaCMS backend can also trigger a local rebuild immediately after saving (before the GitHub Action runs), providing near-instant updates:

```javascript
// In tina-backend/server.js, after git push:
exec('cd /app/repo && pnpm build && rsync -a --delete dist/ /var/www/public/eosclub/dist/', callback);
```

This gives the editor near-instant feedback while GitHub Actions serves as a safety net.

---

## Phase 5 — Environment & Security

### 5.1 Server directory structure

```
/var/www/public/eosclub/
├── repo/          # Git clone of the project
├── dist/          # Built static site (served by nginx)
└── data/          # LevelDB database for TinaCMS index

/var/www/private/eosclub/
└── .env           # Environment variables (not in Git)
```

### 5.2 GitHub Deploy Key

Set up a read-write deploy key on GitHub so the backend container can push:

```bash
ssh-keygen -t ed25519 -C "eosclub-deploy" -f /var/www/private/eosclub/deploy_key
# Add the public key to GitHub repo → Settings → Deploy Keys (Allow write access)
```

### 5.3 Environment variables (server `.env`)

```bash
# TinaCMS Self-Hosted
TINA_SELF_HOSTED=true
TINA_ADMIN_PASSWORD_HASH=$2b$10$...       # bcrypt hash
TINA_JWT_SECRET=<random-64-char-string>
TINA_JWT_EXPIRY=7d

# GitHub (for git push from backend)
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...
# OR use deploy key (SSH) configured in Git config

# Site
PUBLIC_SITE_URL=https://eos-club.de
PUBLIC_GAS_ENDPOINT=https://script.google.com/macros/s/.../exec
```

### 5.4 Security considerations

- TinaCMS admin is password-protected (JWT)
- All traffic over HTTPS (Certbot SSL)
- Backend port 4001 only exposed on localhost (not public)
- Nginx proxies `/api/tina/*` — no direct access to backend
- GitHub deploy key is scoped to this repo only
- Environment secrets stored in `/var/www/private/` (outside web root)

---

## Phase 6 — Testing & QA

### 6.1 Local testing

1. Run `TINA_SELF_HOSTED=true npx tinacms dev` — verify admin UI loads
2. Test content editing and saving
3. Verify markdown files are updated on disk
4. Run `pnpm build` — verify zero errors

### 6.2 Staging deployment

1. Deploy to `staging.prod.khanyi.com`
2. Test admin login flow
3. Test content editing → save → rebuild → live check
4. Test media uploads (images)
5. Verify all 16 pages render correctly

### 6.3 Production cutover

1. Point `eos-club.de` nginx config to the EOS CLUB dist directory
2. Verify SSL certificate is valid
3. Test full edit → save → rebuild → live flow on production domain
4. Share admin credentials with client's team member

---

## Implementation Task Breakdown

### Phase 1: TinaCMS Self-Hosted Backend
- [ ] 1.1 Create `tina-backend/package.json` with all required dependencies
- [ ] 1.2 Create `tina-backend/server.js` — Express + TinaCMS GraphQL server
- [ ] 1.3 Create `tina-backend/auth.js` — password + JWT authentication
- [ ] 1.4 Update `tina/config.ts` — add self-hosted mode conditional
- [ ] 1.5 Update `.env.example` with all new variables
- [ ] 1.6 Test locally: `npx tinacms dev` in self-hosted mode

### Phase 2: Docker Configuration
- [ ] 2.1 Create `tina-backend/Dockerfile`
- [ ] 2.2 Create `deploy/docker-compose.eosclub.yml` (EOS-specific services)
- [ ] 2.3 Create `deploy/rebuild.sh` — build script for post-push rebuild
- [ ] 2.4 Test Docker build locally

### Phase 3: Nginx Configuration
- [ ] 3.1 Create `deploy/nginx/eosclub.conf` — production server block
- [ ] 3.2 Create `deploy/nginx/eosclub-staging.conf` — staging server block
- [ ] 3.3 Document Certbot SSL setup commands

### Phase 4: CI/CD Pipeline
- [ ] 4.1 Create `.github/workflows/deploy.yml` — GitHub Actions deploy workflow
- [ ] 4.2 Document GitHub Actions secrets setup
- [ ] 4.3 Add post-save rebuild trigger in tina-backend

### Phase 5: Server Setup
- [ ] 5.1 Create server directory structure on droplet
- [ ] 5.2 Clone repo to `/var/www/public/eosclub/repo/`
- [ ] 5.3 Set up GitHub deploy key
- [ ] 5.4 Configure environment variables
- [ ] 5.5 Start services: `docker compose up -d`
- [ ] 5.6 Run initial build: `pnpm build`
- [ ] 5.7 Verify nginx serves the site

### Phase 6: Testing & Documentation
- [ ] 6.1 Test full workflow on staging
- [ ] 6.2 Test full workflow on production
- [ ] 6.3 Create `deploy/README.md` — complete server setup guide
- [ ] 6.4 Update `plans/project-context.md` with deployment details
- [ ] 6.5 Share admin credentials with client

---

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| TinaCMS mode | Self-hosted | Full control, no TinaCloud dependency |
| Database | LevelDB (file-based) | Single editor, SSG site — no need for MongoDB |
| Authentication | Simple password + JWT | Client's team member; no GitHub OAuth complexity |
| CI/CD | GitHub Actions | Already on GitHub; no need for separate webhook listener |
| Static serving | Existing nginx container | Reuse infrastructure; no additional container needed |
| Build trigger | Post-save local rebuild + GitHub Actions backup | Instant updates for editor; Actions as safety net |
| Staging | `staging.prod.khanyi.com` | Already available for testing |

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tina-backend/package.json` | Create | Backend dependencies |
| `tina-backend/server.js` | Create | Express + TinaCMS GraphQL server |
| `tina-backend/auth.js` | Create | Password + JWT auth |
| `tina-backend/Dockerfile` | Create | Backend container build |
| `tina-backend/.env.example` | Create | Backend env template |
| `tina/config.ts` | Modify | Add self-hosted mode |
| `.env.example` | Modify | Add new variables |
| `deploy/docker-compose.eosclub.yml` | Create | EOS CLUB Docker services |
| `deploy/rebuild.sh` | Create | Build + deploy script |
| `deploy/nginx/eosclub.conf` | Create | Production nginx config |
| `deploy/nginx/eosclub-staging.conf` | Create | Staging nginx config |
| `.github/workflows/deploy.yml` | Create | CI/CD pipeline |
| `deploy/README.md` | Create | Full deployment documentation |
| `plans/project-context.md` | Modify | Update deployment section |
