# TinaCMS Admin — Self-Hosted Troubleshooting Guide

**Affected version:** `tinacms@3.5.0`, `@tinacms/cli@2.x`
**Deployment mode:** Self-hosted (no TinaCloud)
**Last updated:** 2026-02-28

---

## Error: "Failed loading TinaCMS assets" / "Invalid setup"

**Symptom:** Visiting `/admin/` shows a white screen with:

```
Failed loading TinaCMS assets
Your TinaCMS configuration may be misconfigured, and we could not load the assets for this page.
```

Browser console shows:

```
Uncaught Error: Invalid setup. See https://tina.io/docs/r/what-is-tinacloud for more information.
    at index-be04abfd.js:2609
admin/:15 Failed to load assets
```

### Root Cause: Missing `isLocalClient: true`

The TinaCMS admin SPA contains a **runtime TinaCloud credential validation check** at `node_modules/tinacms/dist/index.js:~121467`:

```js
const { branch, clientId, isLocalClient } = apiURL ? parseURL(apiURL) : {
    branch: props.branch,
    clientId: props.clientId,
    isLocalClient: props?.isLocalClient   // ← read from defineConfig()
};
if (
    typeof isLocalClient === "undefined" ||   // ← SHORT-CIRCUITS here!
    !isLocalClient && (!branch || !clientId) &&
    !schema.config.contentApiUrlOverride
) {
    throw new Error("Invalid setup...");
}
```

**Critical:** Due to `||` operator precedence, if `isLocalClient` is `undefined`, the check **always throws** — even if `contentApiUrlOverride` is set. The `&&` clauses never evaluate.

### The Fix

```typescript
export default defineConfig({
  // @ts-expect-error — isLocalClient is unlisted in types but required for self-hosted;
  // bypasses the TinaCloud runtime validation check in tinacms/dist/index.js:121467
  isLocalClient: true,
  contentApiUrlOverride: '/api/tina/graphql',
  authProvider: CustomAuthProvider() as any,
  // ...
});
```

`isLocalClient: true` makes TinaCMS use `LocalClient` (instead of the cloud `Client`) and `LocalSearchClient` — exactly what a self-hosted backend needs.

### What does NOT fix it

- The `--skip-cloud-checks` flag on `tinacms build` — this only suppresses the **CLI-time** check, NOT the runtime check baked into the admin bundle.
- Setting `admin.auth.customAuth: true` — `customAuth` does not exist in the `AuthOptions` type for `tinacms@3.5.0`. It is a TypeScript error and the property is silently ignored at runtime.
- Setting `TINA_SELF_HOSTED=true` in `.env` — only relevant if the config reads `process.env.TINA_SELF_HOSTED` conditionally, and only if that env var is present during build.
- Setting `contentApiUrlOverride` alone — the `typeof isLocalClient === "undefined"` check short-circuits BEFORE the `contentApiUrlOverride` clause is evaluated.

---

## Error: "Unexpected token '<', `<html> <h`... is not valid JSON"

**Symptom:** TinaCMS admin loads but shows:

```
Unexpected error checking schema: SyntaxError: Unexpected token '<', "<html> <h"... is not valid JSON
```

### Root Cause: Backend returning HTML (Nginx 502)

The `<html>` prefix is Nginx's 502 Bad Gateway error page. The backend container is unreachable because:

1. **Stale generated schema files** — `tina/__generated__/` doesn't include templates used in content files (e.g., `BsportCalendar`, `BsportPasses`, `BsportSubscription`). When the backend's `resolve()` encounters unknown templates, it crashes the Express server.
2. **Backend crash-looping** — The `createLocalDatabase()` or module-level code throws, crashing the Node.js process. Docker restarts it, but during the restart window Nginx returns 502 HTML.
3. **Docker networking issue** — Nginx can't resolve the container name `eosclub_tina` on the `docker_backend` network.

### The Fix

1. **Keep `tina/__generated__/` in sync with `tina/config.ts`** — Run `tinacms build --skip-cloud-checks` after ANY schema change. All templates referenced in content markdown must exist in the schema.
2. **Backend robustness** — The `tina-backend/server.js` now:
   - Wraps `createLocalDatabase()` in try-catch (returns 503 JSON instead of crashing)
   - Returns JSON for ALL responses (404 catch-all, error handler, GET /graphql)
   - Exposes `GET /health` diagnostics endpoint
3. **Verify via health endpoint:** `curl -s https://staging.prod.khanyi.com/api/tina/health | python3 -m json.tool`

---

## Error: "Cannot read properties of undefined (reading 'name')"

**Symptom:** After the schema check fails, attempting to edit content shows:

```
Cannot read properties of undefined (reading 'name')
```

### Root Cause: Cascading failure

The schema never loaded properly (due to Error 1 or Error 2 above), so TinaCMS internal code tries to access `undefined.name`. This is NOT a separate bug — fixing the schema check resolves it.

---

## Gotcha: Schema must include ALL content fields

**Risk:** TinaCMS **strips** any markdown frontmatter fields not defined in the schema when saving. This includes the `name` field used in the Section Pattern Language.

**Fix:** Every block template in `tina/config.ts` includes `{ type: 'string', name: 'name', label: 'Section Name (internal reference)' }`.

Other content-used fields that must be in the schema:
- `HeroBlock`: `subBodyText`, `logoOverlay`
- `ContentBlock`: `fullBleed`, `backgroundImage`

---

## Gotcha: `rebuild.sh` fails on `git pull` — dirty working tree

**Symptom:**
```
error: Your local changes to the following files would be overwritten by merge:
    tina/__generated__/_graphql.json
    ...
```

**Root Cause:** A previous `tinacms build` inside the container modified `tina/__generated__/` in the volume-mounted repo. Git pull refuses to overwrite.

**Fix:** `deploy/rebuild.sh` now runs `git checkout -- tina/__generated__/` before `git pull`.

---

## Complete Self-Hosted Config for `tinacms@3.5.0`

The minimum required `tina/config.ts` for self-hosted TinaCMS with a JWT backend:

```typescript
export default defineConfig({
  // @ts-expect-error — required for self-hosted; bypasses TinaCloud runtime check
  isLocalClient: true,
  contentApiUrlOverride: '/api/tina/graphql',
  branch: process.env.TINA_BRANCH || process.env.HEAD || 'main',
  clientId: '00000000-0000-0000-0000-000000000000',  // placeholder (not used)
  token: '0000000000000000000000000000000000000000',   // placeholder (not used)
  authProvider: CustomAuthProvider() as any,
  // ... schema, build, media config
});
```

**Three critical properties for self-hosted:**
1. `isLocalClient: true` — bypass TinaCloud runtime check
2. `contentApiUrlOverride: '/api/tina/graphql'` — point to your backend
3. `authProvider: CustomAuthProvider() as any` — handle JWT auth

The `CustomAuthProvider` implementation with JWT is in [`tina/config.ts`](../tina/config.ts).

---

## Deployment Checklist

### After ANY `tina/config.ts` schema change:

1. Run `tinacms build --skip-cloud-checks` locally to regenerate `tina/__generated__/`
2. Verify new templates appear: `grep 'YourNewTemplate' tina/__generated__/_lookup.json`
3. Commit `tina/__generated__/` along with the config change
4. Push to git

### On the production server:

```bash
# Reset stale generated files + pull
docker exec eosclub_tina sh -c "cd /app/repo && git checkout -- tina/__generated__/ && git pull origin main"

# Full rebuild (tinacms build + astro build + rsync)
docker exec eosclub_tina sh /app/repo/deploy/rebuild.sh all

# Verify backend health
curl -s https://staging.prod.khanyi.com/api/tina/health | python3 -m json.tool
```

### Health check response (expected):
```json
{
    "status": "ok",
    "tinaDir": "/app/repo/tina",
    "generatedFiles": {
        "_schema.json": true,
        "_graphql.json": true,
        "_lookup.json": true,
        "config.prebuild.jsx": true
    }
}
```

---

## References

- TinaCMS self-hosted docs: https://tina.io/docs/self-hosted/overview/
- Runtime check source: `node_modules/tinacms/dist/index.js:~121467` (search `isLocalClient`)
- `LocalClient` vs `Client`: `node_modules/tinacms/dist/index.js:~41888`
- This project's backend: [`tina-backend/server.js`](../tina-backend/server.js), [`tina-backend/auth.js`](../tina-backend/auth.js)
- Deployment plan: [`plans/deployment-tinacms-plan.md`](../plans/deployment-tinacms-plan.md)
