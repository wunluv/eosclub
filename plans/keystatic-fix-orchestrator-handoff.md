# Keystatic Editor Fix — Orchestrator Handoff

## Problem Summary

The Keystatic editor at `/keystatic` shows a blank screen with console error:
```
Uncaught Error: Expected never to be called, but received: {"name":{"kind":"form","formKind":"slug",...},...}
```

**Root Cause:** `@keystar/ui@0.7.19` (the React UI layer) has an `assertNever()` guard that doesn't handle `formKind: "asset"` (from `fields.image()`) or `formKind: "slug"` (from `fields.text()`) when used inside `fields.blocks()` schemas in `@keystatic/core@0.5.48`. The UI crashes before rendering any fields.

Additionally: the `content: fields.markdoc()` field + `contentField: 'content'` in format defines a top-level WYSIWYG field that renders in the editor but is never consumed by any page route (P2 audit issue).

---

## Implementation Plan

### Step 1: Remove orphan content field (P2 fix)

**File:** `keystatic.config.ts`

**Changes:**
1. Remove `contentField: 'content'` from the `format` object (keep `data: 'yaml'`)
2. Remove the entire `content: fields.markdoc({ label: 'Content', extension: 'md' })` field

**Before:**
```typescript
format: {
  data: 'yaml',
  contentField: 'content',
},
schema: {
  title: fields.slug({...}),
  seoDescription: fields.text({...}),
  ogImage: fields.image({...}),
  translationSlug: fields.text({...}),
  content: fields.markdoc({ label: 'Content', extension: 'md' }),
  blocks: fields.blocks({...}),
}
```

**After:**
```typescript
format: {
  data: 'yaml',
},
schema: {
  title: fields.slug({...}),
  seoDescription: fields.text({...}),
  ogImage: fields.image({...}),
  translationSlug: fields.text({...}),
  blocks: fields.blocks({...}),
}
```

---

### Step 2: Replace `fields.image()` with `fields.text()` inside all `fields.blocks()` schemas

**Rationale:** `fields.image()` produces `formKind: "asset"` which triggers the `assertNever` crash. `fields.text()` produces `formKind: "slug"` which the blocks renderer CAN handle. Existing content already stores image values as plain path strings (e.g. `/assets/yoga_studio.jpg`), so there's zero content migration — `fields.text()` reads these identically.

**File:** `keystatic.config.ts`

| Block | Field | Current | Replace With |
|-------|-------|---------|--------------|
| `HeroBlock` | `backgroundImage` | `fields.image({ label: 'Background Image', directory: 'public/assets', publicPath: '/assets/' })` | `fields.text({ label: 'Background Image', description: 'Path to public asset, e.g. /assets/yoga_studio.jpg' })` |
| `HeroBlock` | `logoOverlay` | `fields.image({ label: 'Logo Overlay (Centered)', directory: 'public/assets', publicPath: '/assets/' })` | `fields.text({ label: 'Logo Overlay (Centered)', description: 'Path to public asset, e.g. /assets/eos-logo.png' })` |
| `ContentBlock` | `backgroundImage` | `fields.image({ label: 'Background Image', directory: 'public/assets', publicPath: '/assets/' })` | `fields.text({ label: 'Background Image', description: 'Path to public asset, e.g. /assets/...' })` |
| `FullBleedBlock` | `image` | `fields.image({ label: 'Background Image', directory: 'public/assets', publicPath: '/assets/' })` | `fields.text({ label: 'Background Image', description: 'Path to public asset, e.g. /assets/...' })` |
| `InteractiveListBlock.items[]` | `image` | `fields.image({ label: 'Hover Image', directory: 'public/assets', publicPath: '/assets/' })` | `fields.text({ label: 'Hover Image', description: 'Path to public asset, e.g. /assets/...' })` |

**KEEP UNCHANGED:** `ogImage: fields.image({...})` at the top level (outside `fields.blocks()`) — this works correctly in the non-blocks context.

---

### Step 3: Verification

**Check 1: Dev server loads without crash**
- Run `pnpm dev`
- Navigate to `http://localhost:4321/keystatic`
- Click into any page (e.g., `de/home`)
- **Pass:** Editor loads, no `assertNever` error in console

**Check 2: Image path fields save and reload correctly**
- Open a page with image fields (e.g., `de/home` with `HeroBlock`)
- Verify existing `backgroundImage` value is visible (as a text string like `/assets/yoga_studio.jpg`)
- Change the path to a different valid asset (e.g., `/assets/theme_yoga.png`)
- Save the page
- Reload the editor
- **Pass:** The new path value persists and displays correctly

**Check 3: Frontend renders correctly**
- Visit `http://localhost:4321/` (DE home)
- Visit `http://localhost:4321/en` (EN home)
- Visit other routes with image blocks: `/studio`, `/kurse`, `/wellness`
- **Pass:** All images render correctly; no broken image links

**Check 4: Build succeeds**
- Run `pnpm build`
- **Pass:** Build completes without errors

---

## Why This Is Safe

1. **Zero content migration** — existing YAML frontmatter stores all image values as path strings; `fields.text()` reads them identically to how `fields.image()` did
2. **Zero frontend change** — all block components consume image values as strings; the field type change is invisible to the renderer
3. **Also resolves P2** — removes the disconnected `content` field that editors could see but never affected the site
4. **Targeted minimal diff** — only ~10 lines change in one file

---

## Single File to Modify

- `keystatic.config.ts` — configuration only, no content or component changes needed
