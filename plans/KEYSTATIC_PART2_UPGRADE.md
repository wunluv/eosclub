# Keystatic Part 2 — Architecture Upgrade Plan

## Context

Part 1 is complete: Keystatic loads all 16 entries and editing works. This document covers the deferred architecture improvements for **image management**, **rich text editing**, and **extensible block architecture**.

### Files in scope

- [`keystatic.config.ts`](../keystatic.config.ts) — Keystatic CMS schema
- [`src/content/config.ts`](../src/content/config.ts) — Astro Zod validation schema
- `src/content/pages/**/*.md` — Content files
- `src/components/blocks/` — Block rendering components
- `src/pages/[...slug].astro` and `src/pages/index.astro` — Route dispatchers

---

## 1. Image Management

### Current State

Image fields in [`keystatic.config.ts`](../keystatic.config.ts) already use `fields.image()` with correct config:

```ts
backgroundImage: fields.image({
  label: 'Background Image',
  directory: 'public/assets',
  publicPath: '/assets/',
}),
```

Existing content files store image paths as plain strings — e.g. `/assets/yoga_studio.jpg`. Keystatic reads these correctly and allows replacement via upload. **No migration is needed for basic image editing to work.**

### Recommendations

#### A. Organize images by subdirectory

Avoid a flat dump of hundreds of files in `public/assets/`. Change `directory` per field context:

| Field context | Suggested directory |
|---|---|
| Hero backgrounds | `public/assets/heroes/` |
| Interactive list items | `public/assets/offerings/` |
| Full bleed sections | `public/assets/fullbleed/` |
| Team photos | `public/assets/team/` |
| OG images | `public/assets/og/` |

This is a config-only change per `fields.image()` call. Existing image paths in content files would need updating to match.

#### B. Add guidance descriptions

Keystatic does not enforce image dimensions or file size, but you can guide the client with `description`:

```ts
backgroundImage: fields.image({
  label: 'Background Image',
  description: 'Recommended: 1920×1080 JPG, max 500KB',
  directory: 'public/assets/heroes',
  publicPath: '/assets/heroes/',
}),
```

#### C. No migration needed for existing images

Keystatic's `fields.image()` reads string paths from YAML frontmatter and renders them in the editor with an upload/replace UI. The current content files are already compatible.

---

## 2. Rich Text Editing

### Current State

[`ContentBlock.body`](../keystatic.config.ts) and [`FaqBlock.answer`](../keystatic.config.ts) are `fields.text({ multiline: true })`. The actual content contains raw HTML:

```yaml
body: >-
  <p>EOS CLUB is more than a studio – it's a place of transformation.
  Here, traditional practices meet modern wellness for your holistic
  well-being.</p>
```

The client sees a plain textarea with HTML tags visible. Not ideal.

### Recommended Approach: `fields.markdoc()`

Use Keystatic's `fields.markdoc()` for rich text fields. This provides:
- WYSIWYG toolbar — bold, italic, links, headings, lists
- Clean Markdoc storage format — renders to HTML at build time
- Compatible with Astro's content pipeline

#### Migration steps

1. **Write a migration script** that converts HTML strings in `body` and `answer` fields to equivalent Markdoc syntax:
   - `<p>text</p>` → `text` with paragraph breaks
   - `<h2>title</h2>` → `## title`
   - `<a href="...">text</a>` → `[text](...)` etc.
2. **Update [`keystatic.config.ts`](../keystatic.config.ts):**
   - `ContentBlock.body`: change from `fields.text({ multiline: true })` to `fields.markdoc({ label: 'Body Content', extension: 'md' })`
   - `FaqBlock.answer`: change from `fields.text({ multiline: true })` to `fields.markdoc({ label: 'Answer', extension: 'md' })`
3. **Update [`src/content/config.ts`](../src/content/config.ts):**
   - Change `body: z.string()` and `answer: z.string()` to accept the Markdoc output format
4. **Update rendering components** to handle Markdoc output instead of raw HTML strings

#### Alternative: `fields.document()`

Keystatic also offers `fields.document()` — a structured JSON document editor. More powerful but requires a bigger migration and different rendering pipeline. **Recommended only if you need embedded components inside rich text.**

### Risk mitigation

- Run migration script on a branch
- Snapshot all `.md` files before migration with `git stash` or a backup directory
- Validate each page renders identically before and after

---

## 3. Extensible Block Architecture

### Current State — Well Designed

The block system follows a clean pattern:
- [`fields.blocks()`](../keystatic.config.ts) with `discriminant`/`value` in Keystatic
- [`z.discriminatedUnion('discriminant', [...])`](../src/content/config.ts:89) in Astro Zod schema
- `switch` dispatch in page routes
- One `.astro` component per block type

### Adding a New Block — 5-Step Pattern

1. Create `src/components/blocks/NewBlock.astro`
2. Add Zod schema to [`src/content/config.ts`](../src/content/config.ts) discriminated union
3. Add Keystatic block to [`keystatic.config.ts`](../keystatic.config.ts) inside `fields.blocks()`
4. Add `import` + `switch` case to [`src/pages/[...slug].astro`](../src/pages/[...slug].astro)
5. Add `import` + `switch` case to [`src/pages/index.astro`](../src/pages/index.astro)

### Candidate New Block Types

| Block | Key Fields | Notes |
|---|---|---|
| `TestimonialBlock` | `name`, `quote` markdoc, `author`, `role`, `image` | Social proof section |
| `TeamMemberBlock` | `name`, `role`, `bio` markdoc, `photo`, `socialLinks[]` | Team page content |
| `GalleryBlock` | `name`, `title`, `images[]` with `image`, `caption`, `alt` | Image gallery/grid |
| `CTABannerBlock` | `name`, `headline`, `body`, `ctaLabel`, `ctaUrl`, `backgroundImage` | Reusable call-to-action |

### Best Practices for Block Maintenance

1. **Use `itemLabel` callbacks** — Already done for arrays. Makes the editor list show meaningful names instead of "Item 1".
2. **Keep schemas in sync** — The biggest maintenance risk is drift between Keystatic and Zod schemas. Add a comment header in both files cross-referencing each other.
3. **One block at a time** — Each new block is self-contained. Add, test, ship individually.
4. **Consider a schema sync test** — A simple Node script that validates a sample block payload against both the Keystatic schema shape and the Zod schema. Catches drift early.

---

## Execution Order

| Priority | Task | Impact | Risk |
|---|---|---|---|
| 1 | Rich text migration — body + answer fields | Highest — transforms client editing UX | Medium — requires content migration script |
| 2 | Image directory reorganization | Medium — better asset organization | Low — config + path updates only |
| 3 | New block types | Medium — extends content capabilities | Low — additive, no migration |
| 4 | Schema sync validation | Low — developer safety net | Very low — tooling only |

---

## Dependencies

- Rich text migration depends on choosing between `fields.markdoc()` and `fields.document()`
- Image reorganization can happen independently at any time
- New block types can be added independently at any time
- Schema sync validation is a developer tool, no user impact

---

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-03-02 | Part 1 complete — editing works | Config fixes in keystatic.config.ts + React dedupe in astro.config.mjs |
| 2026-03-02 | Recommend `fields.markdoc()` over `fields.document()` for rich text | Lighter migration path, content already markdown-adjacent |
| 2026-03-02 | Part 2 deferred until client needs are confirmed | No code changes until scope is approved |
