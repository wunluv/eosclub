# Keystatic Deployment Guide — EOS CLUB

This document details the deployment architecture and configuration for the Keystatic CMS on the EOS CLUB website.

## 1. Overview

Keystatic is a Git-based CMS. Unlike TinaCMS, it does not require a separate backend service. It operates in two primary modes:

- **Local Mode:** Files are saved directly to the local filesystem. Used during development.
- **GitHub Mode:** Changes are saved by committing and pushing directly to the GitHub repository. Used in production.

## 2. Environment Variables

The following environment variables are required for Keystatic to operate in GitHub mode:

| Variable | Description | Source |
|---|---|---|
| `KEYSTATIC_GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | GitHub Developer Settings |
| `KEYSTATIC_GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret | GitHub Developer Settings |
| `KEYSTATIC_SECRET` | Random secret for authentication | Generated |
| `PUBLIC_GITHUB_REPO` | Repository path (e.g., `owner/repo`) | GitHub |

## 3. GitHub OAuth App Setup

To enable GitHub mode, you must create a GitHub OAuth App:

1. Go to **Settings > Developer settings > OAuth Apps > New OAuth App**.
2. **Homepage URL:** `https://eos-club.de`
3. **Authorization callback URL:** `https://eos-club.de/api/keystatic/github/callback`
4. Copy the Client ID and Client Secret into your production environment variables.

## 4. Production Deployment

The website is deployed as a static site (SSG).

1. **Build:** Run `pnpm run build` on the server or in a CI/CD pipeline. This generates the `dist/` directory.
2. **Serve:** Serve the `dist/` directory using NGINX.
3. **Routing:** NGINX must be configured to route requests correctly. Keystatic operates under the `/keystatic` path.

### NGINX Configuration Snippet

```nginx
location /keystatic {
    try_files $uri $uri/ /keystatic/index.html;
}

location /api/keystatic {
    proxy_pass http://localhost:4321; # If running Astro in SSR mode, or handle via specific function
}
```

*Note: In a pure SSG setup, Keystatic's admin UI is a single-page application (SPA) that runs entirely in the browser and communicates directly with GitHub APIs.*

## 5. Development Workflow

1. Run `pnpm dev`.
2. Access the CMS at `http://localhost:4321/keystatic`.
3. Keystatic will be in `local` mode (check `keystatic.config.ts`).
4. Saving changes will modify the `.md` files in `src/content/pages/` immediately.

## 6. Security

- Ensure `KEYSTATIC_GITHUB_CLIENT_SECRET` and `KEYSTATIC_SECRET` are never committed to version control.
- Use a strong random string for `KEYSTATIC_SECRET`.
