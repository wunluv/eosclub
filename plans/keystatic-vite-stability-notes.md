# Keystatic + Vite Stability Notes
## Discovered March 2026 — Agent Reference

This document captures hard-won debugging insights for `@keystatic/astro@5.x` +
`@keystatic/core@0.5.x` + `@keystar/ui@0.7.x` running under Astro v5 / Vite v6.

---

## Issue 1: Blank Screen with `assertNever` Crash

### Symptom
`/keystatic` renders a blank white screen. Browser console shows:
```
Error: Expected never to be called, but received:
{"name":{"kind":"form","formKind":"slug",...},...}
```

### Root Cause
`fields.blocks()` in `@keystatic/core@0.5.x` requires each block's `schema` property
to be a **`ComponentSchema`** value. The valid types are:
- `ObjectField` (returned by `fields.object()`)
- `ArrayField`, `ConditionalField`, `BasicFormField`, etc.

A plain object literal `schema: { name: fields.text(...) }` is NOT a `ComponentSchema`.
When the UI receives the raw object, `@keystar/ui@0.7.19`'s `assertNever()` guard throws
because it doesn't know how to render it.

Additionally, `fields.text()` returns `SlugFormField` (`formKind: "slug"`) and
`fields.image()` returns `AssetFormField` (`formKind: "asset"`). The `@keystar/ui@0.7.19`
UI layer also crashes on these `formKind` values when they appear as the **top-level**
block schema (not wrapped in `fields.object()`).

### Fix
Wrap every block's `schema` with `fields.object()`:

```typescript
// ✅ CORRECT
HeroBlock: {
  label: 'Hero Block',
  schema: fields.object({
    name: fields.text({ label: 'Section Name' }),
    headline: fields.text({ label: 'Headline', multiline: true }),
    // ...
  }),
},

// ❌ WRONG — plain object, not ComponentSchema
HeroBlock: {
  label: 'Hero Block',
  schema: {
    name: fields.text({ label: 'Section Name' }),
  },
},
```

**Important:** `fields.object()` is ALSO safe to use for `fields.array()` items —
this has always been the correct pattern for nested array objects.

### Image Fields Inside Blocks
`fields.image()` inside `fields.object()` inside `fields.blocks()` has known
persistence issues in `@keystatic/core@0.5.x` (images disappear on save).
Use `fields.text()` for image path fields inside blocks instead:

```typescript
// ✅ Use fields.text() for image paths inside blocks
backgroundImage: fields.text({
  label: 'Background Image',
  description: 'Path to public asset, e.g. /assets/yoga_studio.jpg',
}),

// ❌ Avoid fields.image() inside fields.blocks() schemas in 0.5.x
backgroundImage: fields.image({
  label: 'Background Image',
  directory: 'public/assets',
  publicPath: '/assets/',
}),
```

`fields.image()` is safe at the **top level** of the collection schema
(outside `fields.blocks()`), e.g. for `ogImage`.

---

## Issue 2: Pages Collection Shows 0 Entries / "No Results"

### Symptom
`/keystatic/collection/pages` shows "No results. No items matching '' were found."
despite `.md` content files existing in `src/content/pages/`.

### Root Cause
`format: { data: 'yaml' }` WITHOUT `contentField` tells Keystatic to discover
`.yaml` data files. The actual content lives in `.md` files. Without `contentField`,
Keystatic cannot find any entries.

### Fix
Always include `contentField` when content lives in `.md` files:

```typescript
format: {
  data: 'yaml',
  contentField: 'content',  // ← required for .md file discovery
},
```

If you don't want an editable content body (all data is in frontmatter blocks),
use `fields.emptyContent()` — it satisfies the `ContentFormField` type without
showing a WYSIWYG editor:

```typescript
schema: {
  // ...other fields...
  content: fields.emptyContent({ extension: 'md' }),
  blocks: fields.blocks({ ... }),
},
```

---

## Issue 3: Vite Chunk 404 on Cold Start After Cache Clear

### Symptom
After clearing `node_modules/.vite` and restarting `pnpm dev`, the first browser
load of `/keystatic` gets 404 errors:
```
Failed to load resource: 404 (Not Found)
chunk-X5SEGTI2.js:1
TypeError: Failed to fetch dynamically imported module: .../keystatic-page.js?v=6d441ae0
```
Console also shows:
```
[WARN] [vite] The file does not exist at ".../chunk-7RZSRYYD.js?v=6d441ae0"
which is in the optimize deps directory.
```

### Root Cause
Vite's dep optimizer runs in two passes on first cold start when packages are
not pre-declared:
1. Initial scan builds a partial set of optimized chunks
2. First request discovers additional Keystatic dependencies
3. Optimizer triggers a mid-request rebuild: **"optimized dependencies changed. reloading"**
4. Browser receives page HTML referencing OLD chunk URLs from pass 1
5. Old chunks are gone — 404

This is a Vite depOptimizer race condition, not a Keystatic bug.

### Fix
Add Keystatic packages to `optimizeDeps.include` in `astro.config.mjs` so Vite
pre-bundles them **eagerly on startup** (pass 1) rather than discovering them lazily:

```javascript
vite: {
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@keystatic/core',
      '@keystatic/astro',
      // NOTE: '@keystar/ui' intentionally EXCLUDED — it has no root "." export
      // and cannot be resolved as a top-level package by Vite's optimizer.
    ],
  },
  ssr: {
    noExternal: ['@keystatic/core', '@keystatic/astro', /^@keystar\/ui/],
  },
},
```

**Critical:** Do NOT add `@keystar/ui` to `optimizeDeps.include` — it has no root
`"."` export and Vite will throw:
```
Failed to resolve entry for package "@keystar/ui".
Missing "." specifier in "@keystar/ui" package
```

**Also do NOT use `optimizeDeps.exclude`** for Keystatic packages — this prevents
Vite from bundling them entirely, breaking client-side hydration with the same
`500 Error hydrating keystatic-page.js` error.

---

## Safe Restart Procedure After Config Changes

If you ever see stale chunk warnings or 404s on Keystatic chunks:

```bash
# 1. Kill any running servers
pkill -9 -f "astro|vite|pnpm dev"

# 2. Clear Vite dep cache
rm -rf node_modules/.vite

# 3. Start fresh
pnpm dev
```

Then **hard-refresh** the browser (Ctrl+Shift+R / Cmd+Shift+R) after the server
shows "ready" — before the "optimized dependencies changed. reloading" can fire
if `optimizeDeps.include` is not fully effective.

---

## Harmless Warnings to Ignore

These appear on every cold start and are NOT errors:

```
[WARN] [vite] Sourcemap for ".../superstruct/dist/index.mjs" points to missing source files
[WARN] [vite] Sourcemap for ".../urql/dist/urql.es.js" points to missing source files
```

These come from `superstruct` and `urql` (Keystatic dependencies) not shipping
their source maps. No action needed.

---

## Working Configuration Summary

### `astro.config.mjs`
```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import node from '@astrojs/node';

export default defineConfig({
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  vite: {
    resolve: {
      dedupe: ['react', 'react-dom', '@keystar/ui', '@keystatic/core/ui', '@keystatic/core'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', '@keystatic/core', '@keystatic/astro'],
      // NOT @keystar/ui — no root export
    },
    ssr: {
      noExternal: ['@keystatic/core', '@keystatic/astro', /^@keystar\/ui/],
    },
  },
  // ...
  integrations: [react(), tailwind(), sitemap(), keystatic()],
});
```

### `keystatic.config.ts` — block schema pattern
```typescript
blocks: fields.blocks(
  {
    HeroBlock: {
      label: 'Hero Block',
      schema: fields.object({           // ← fields.object() wrapper required
        name: fields.text({ ... }),     // ← fields.text() OK inside object
        variant: fields.select({ ... }),
        backgroundImage: fields.text({ // ← use text() NOT image() for paths
          description: 'e.g. /assets/yoga_studio.jpg',
        }),
      }),
    },
    // ...
  },
  { label: 'Content Blocks' }
),
```

### `keystatic.config.ts` — collection format
```typescript
collection({
  format: {
    data: 'yaml',
    contentField: 'content',  // ← required for .md file discovery
  },
  schema: {
    // ...
    content: fields.emptyContent({ extension: 'md' }),  // no WYSIWYG body
    blocks: fields.blocks({ ... }),
  },
})
```
