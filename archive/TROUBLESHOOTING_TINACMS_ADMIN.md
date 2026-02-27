# TinaCMS Admin — "Failed loading TinaCMS assets" Error

**Affected version:** `tinacms@3.5.0`, `@tinacms/cli@2.x`
**Deployment mode:** Self-hosted (no TinaCloud)
**Symptom:** Visiting `/admin/` shows a white screen with the error:

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

---

## Root Cause

The TinaCMS admin is a React SPA compiled into `public/admin/` by `tinacms build`. The generated JS bundle contains a **runtime TinaCloud credential validation check** that fires when the admin app initialises. If the bundle was built without the correct self-hosted auth configuration, it detects the placeholder credentials (`clientId: '00000000-0000-0000-0000-000000000000'`) and throws this error.

The check lives at line ~121471 in `node_modules/tinacms/dist/index.js`:
```js
throw new Error("Invalid setup. See https://tina.io/docs/r/what-is-tinacloud for more information.");
```

### What does NOT fix it

- The `--skip-cloud-checks` flag on `tinacms build` — this only suppresses the **CLI-time** check, NOT the runtime check baked into the admin bundle.
- Setting `admin.auth.customAuth: true` — `customAuth` does not exist in the `AuthOptions` type for `tinacms@3.5.0`. It is a TypeScript error and the property is silently ignored at runtime.
- Setting `TINA_SELF_HOSTED=true` in `.env` — only relevant if the config reads `process.env.TINA_SELF_HOSTED` conditionally, and only if that env var is present during build. If the build runs without it set, the conditional evaluates to false.

---

## Correct Fix for `tinacms@3.5.0` Self-Hosted (with JWT Backend)

If your self-hosted backend requires a JWT (as implemented in `tina-backend/auth.js`), the built-in `LocalAuthProvider` is insufficient because it does not send the `Authorization` header. Instead, implement a custom `AuthProvider` in `tina/config.ts`:

```typescript
const CustomAuthProvider = () => {
  // SSR Safety: Return a dummy provider when running on the server (Node.js)
  if (typeof window === 'undefined') {
    return {
      authenticate: async () => null,
      getToken: async () => ({ id_token: null }),
      getUser: async () => null,
      logout: async () => {},
      authorize: async () => null,
      isAuthorized: async () => false,
      isAuthenticated: async () => false,
      fetchWithToken: async (input: any, init: any) => fetch(input, init),
      getLoginStrategy: () => "Redirect",
      getLoginScreen: () => null,
      getSessionProvider: () => (props: any) => props.children,
    };
  }

  return {
    authenticate: async () => {
      const token = localStorage.getItem('tina_jwt');
      if (token) return { id_token: token };

      const password = window.prompt('Please enter the admin password');
      if (!password) return null;

      const response = await fetch('/api/tina/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const { token } = await response.json();
        localStorage.setItem('tina_jwt', token);
        return { id_token: token };
      }
      return null;
    },
    getToken: async () => {
      const token = localStorage.getItem('tina_jwt');
      return { id_token: token };
    },
    getUser: async () => {
      return !!localStorage.getItem('tina_jwt');
    },
    logout: async () => {
      localStorage.removeItem('tina_jwt');
    },
    authorize: async (context: any) => {
      const token = localStorage.getItem('tina_jwt');
      if (token) return { id_token: token };
      return null;
    },
    isAuthorized: async (context: any) => {
      return !!localStorage.getItem('tina_jwt');
    },
    isAuthenticated: async () => {
      return !!localStorage.getItem('tina_jwt');
    },
    fetchWithToken: async (input: any, init: any) => {
      const headers = (init == null ? void 0 : init.headers) || {};
      const token = localStorage.getItem('tina_jwt');
      if (token) {
        headers["Authorization"] = "Bearer " + token;
      }
      return await fetch(input, {
        ...init || {},
        headers: new Headers(headers)
      });
    },
    getLoginStrategy: () => "Redirect",
    getLoginScreen: () => null,
    getSessionProvider: () => (props: any) => props.children,
  };
};

export default defineConfig({
  // ...
  authProvider: CustomAuthProvider() as any,
  // ...
});
```

**Why this works:** This custom provider implements the full `AuthProvider` interface required by TinaCMS. It handles the login flow against your custom backend, stores the JWT in `localStorage`, and ensures that the `Authorization: Bearer <token>` header is included in all GraphQL requests.

---

## What `LocalAuthProvider` Does (Local Dev Only)

`LocalAuthProvider` implements a minimal auth interface that:
1. Reads/writes a token from `localStorage` key `tina.local.isLogedIn`
2. Does NOT validate against TinaCloud
3. Works alongside the self-hosted Express backend (`tina-backend/`) which handles password validation and JWT issuance

The actual authentication (password check → JWT) is handled by the `tina-backend/auth.js` Express route `POST /api/auth/login`.

---

## The `admin.auth` API (Deprecated Pattern)

The `admin.auth` block with `customAuth` is a **non-standard pattern** that was referenced in older TinaCMS documentation and some beta versions. As of `tinacms@3.5.0`, the correct pattern confirmed by the TinaCMS CLI source is:

```typescript
// WRONG — customAuth does not exist in AuthOptions type
admin: {
  auth: {
    customAuth: true,
    authenticate: async () => true,
    // ...
  }
}

// CORRECT — use top-level authProvider
authProvider: new LocalAuthProvider(),
```

---

## How to Verify the Fix

1. Apply the `tina/config.ts` change above
2. Run `pnpm build` (which runs `tinacms build --skip-cloud-checks && astro build`)
3. The `public/admin/` folder will be regenerated with a bundle that uses `LocalAuthProvider`
4. Visit `/admin/` — you should see a TinaCMS login screen (not an error)
5. Enter the admin password (stored as bcrypt hash in `TINA_ADMIN_PASSWORD_HASH` env var)
6. The backend at `POST /api/tina/graphql` handles content operations

---

## Deployment Notes

- `public/admin/index.html` and `public/admin/assets/` are **gitignored** (see [`public/admin/.gitignore`](../public/admin/.gitignore))
- The admin bundle is regenerated during every `pnpm build` run on the server
- The [`deploy/rebuild.sh`](../deploy/rebuild.sh) script handles this: `git pull → pnpm install → pnpm build → rsync dist/`
- Always run the full build on the server; never rely on committed `dist/` files for the admin

---

## References

- TinaCMS self-hosted docs: https://tina.io/docs/self-hosted/overview/
- `LocalAuthProvider` source: `node_modules/tinacms/dist/index.js` (search `class LocalAuthProvider`)
- TinaCMS CLI config generation: `node_modules/@tinacms/cli/dist/index.js` (search `authProvider`)
- This project's backend: [`tina-backend/server.js`](../tina-backend/server.js), [`tina-backend/auth.js`](../tina-backend/auth.js)
- Deployment plan: [`plans/deployment-tinacms-plan.md`](deployment-tinacms-plan.md)
