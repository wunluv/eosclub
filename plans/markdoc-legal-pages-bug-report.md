# Bug Report: Markdoc WYSIWYG + Legal Pages Integration — Build Failures

**Date:** 2026-03-12
**Branch:** `feature/markdoc-wysiwyg-legal-pages`
**Investigator:** Architect Mode
**Source task:** Implementation of `plans/markdoc-legal-pages-integration.md`

---

## Executive Summary

The previous agent completed Phases 0–5 partially and stopped during Phase 7 verification. The build is currently broken or producing incorrect runtime behavior due to **5 distinct issues**, ranging from a missing content file to unexecuted migration, to a route collision. The issues are listed below from most critical to least critical.

---

## Issue 1 — CRITICAL: `de/agb.md` content file is missing

**Status:** Blocker for build
**Phase that failed:** Phase 5.1

`src/content/pages/de/agb.md` was never created by the agent. All other legal content files exist:
- ✅ `src/content/pages/de/impressum.md`
- ✅ `src/content/pages/de/datenschutz.md`
- ❌ `src/content/pages/de/agb.md` — **MISSING**
- ✅ `src/content/pages/en/imprint.md`
- ✅ `src/content/pages/en/privacy.md`
- ✅ `src/content/pages/en/terms.md`

**Impact:** `/agb` route will either 404 (because the static `src/pages/agb.astro` is still present and routes have not been cleaned up yet, this may mask the error), or will fail with an unresolvable `translationSlug` since `en/terms.md` references `translationSlug: agb` but `de/agb.md` does not exist. Also, `[...slug].astro` `getStaticPaths()` will not generate an `/agb` entry from the content collection.

**Fix required:** Create `src/content/pages/de/agb.md` with:
```yaml
---
cmsSlug: de/agb
title: AGB | EOS CLUB
seoDescription: Allgemeine Geschäftsbedingungen von EOS CLUB GmbH.
translationSlug: terms
blocks:
  - discriminant: LegalPageBlock
    value:
      name: agb-content
      sections:
        # Port content from src/pages/agb.astro
        - level: h2
          title: 1. Geltungsbereich
          content: |-
            Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen der Eos Morgenrot GmbH und ihren Kunden, soweit nicht schriftlich etwas anderes vereinbart wurde.
        - level: h2
          title: 2. Leistungsangebot
          content: |-
            Eos Morgenrot GmbH bietet Kurse, Workshops und Wellness-Dienstleistungen an. Der Umfang der Leistungen ergibt sich aus der jeweils aktuellen Kursbeschreibung auf der Website.
        - level: h2
          title: 3. Anmeldung und Buchung
          content: |-
            Die Anmeldung zu Kursen und Workshops erfolgt über die Website oder das Buchungssystem von bsport. Die Buchung ist verbindlich.
        - level: h2
          title: Kontakt
          content: |-
            Für die vollständigen AGB kontaktieren Sie uns bitte unter hello@eos-club.de.
---
```

---

## Issue 2 — CRITICAL: HTML→Markdown migration was NOT run on existing content

**Status:** Runtime crash for all pages with `ContentBlock` and `FaqBlock`
**Phase that failed:** Phase 1.3

The migration script `scripts/migrate-html-to-markdoc.cjs` exists and is well-formed, but was **never executed** (or failed silently). Evidence:

Multiple content files still contain raw HTML in `body` and `answer` fields:

- `de/home.md` line 22-28: `body: >- <p>Hot Yoga...</p>`
- `de/studio.md` line 18-22: `body: >- <h2>Das EOS Studio</h2><p>…</p>`
- `de/studio.md` line 46-50: `body: >- <h2>Die EOS Terrasse</h2><p>…</p>`
- `de/team.md` line 18-21: `body: >- <h2>Die Menschen hinter EOS</h2><p>…</p>`
- `de/preise.md` line 20: `body: <h2>Pässe und Mitgliedschaften</h2>`
- `de/preise.md` lines 37-49: Multiple `answer:` fields with plain strings (no HTML, but still a string — needs verify)

**Impact:** The `ContentBlock.astro` component was updated to call `{body()}` (expecting a callable Markdoc render function), but since `fields.markdoc()` with **plain string content in the YAML** will NOT produce a callable function — it will return the raw string. Calling a string as a function causes a **runtime TypeError** on every page that has a `ContentBlock`.

> **Important caveat to verify:** When Astro reads `fields.markdoc()` from the content collection schema, the behavior depends on how `@keystatic/core@0.5.x` stores and exposes markdoc content. If it stores as a serialized Markdoc string in YAML frontmatter (not as a callable wrapper), then `{@render body()}` will crash at runtime with `body is not a function`.

**Fix required:**
1. Run `node scripts/migrate-html-to-markdoc.cjs` to convert all HTML to Markdown
2. Manually verify output in affected files post-migration
3. Additionally verify the actual return type of `body` at runtime — it may be that `z.any()` + `fields.markdoc()` stored as a plain Markdown string in YAML frontmatter returns a **string, not a function**, meaning the rendering approach itself needs to be revisited (see Issue 5)

---

## Issue 3 — HIGH: Route collision between static `.astro` legal pages and content collection routes

**Status:** Build warning / ambiguous behavior
**Phase that failed:** Phase 6 was intentionally deferred, but now creates a conflict

The static Astro page files were NOT deleted (Phase 6 is supposed to run after Phase 7 passes). However, the DE content collection pages now have entries for `impressum`, `datenschutz` (no `agb` yet). This creates a **route collision**:

| Route | Static `.astro` file | Content collection route |
|-------|---------------------|------------------------|
| `/impressum` | `src/pages/impressum.astro` ✅ | `de/impressum.md` via `[...slug].astro` ✅ |
| `/datenschutz` | `src/pages/datenschutz.astro` ✅ | `de/datenschutz.md` via `[...slug].astro` ✅ |
| `/agb` | `src/pages/agb.astro` ✅ | `de/agb.md` — MISSING ❌ |
| `/en/imprint` | `src/pages/en/imprint.astro` ✅ | `en/imprint.md` via `en/[...slug].astro` ✅ |
| `/en/privacy` | `src/pages/en/privacy.astro` ✅ | `en/privacy.md` via `en/[...slug].astro` ✅ |
| `/en/terms` | `src/pages/en/terms.astro` ✅ | `en/terms.md` via `en/[...slug].astro` ✅ |

Astro SSG with duplicate routes will either throw a build error or favor the more specific static file over the catch-all `[...slug]` route. If the static file wins, then the CMS-driven pages are silently bypassed — neither an error nor the correct output.

**Fix required:** Delete all 6 static `.astro` legal page files (Phase 6 cleanup), but ONLY after Issues 1 and 2 are resolved and pages verified in dev. Files to delete:
- `src/pages/impressum.astro`
- `src/pages/datenschutz.astro`
- `src/pages/agb.astro`
- `src/pages/en/imprint.astro`
- `src/pages/en/privacy.astro`
- `src/pages/en/terms.astro`

---

## Issue 4 — HIGH: `LegalPageBlock` `content` field format is plain Markdown string, not a Markdoc callable

**Status:** Likely runtime crash for all legal pages
**Phase that failed:** Phase 5.1 / Phase 3 interaction

The content files `de/impressum.md`, `de/datenschutz.md`, `en/imprint.md`, `en/privacy.md`, `en/terms.md` all store their `content` fields as plain YAML multiline strings:

```yaml
content: |-
  Eos Morgenrot GmbH
  Eupener Straße 84
  50933 Köln
```

The `LegalPageBlock.astro` component calls `{@render section.content()}` (i.e., calls content as a function). Whether this works depends on how `@keystatic/core@0.5.x` + Astro content collections expose `fields.markdoc()` data.

**Key architectural question to resolve:** Does `@keystatic/core@0.5.x` with `fields.markdoc()` inside `fields.blocks()` inside a content collection entry actually return a callable Astro snippet function? Or does it store the raw Markdoc string in YAML and return it as a plain string?

Based on code investigation, the plan's assumption is that `fields.markdoc()` content exposed through Astro content collections is a **callable render function** (like how `render()` works for content collection entries). This is the documented pattern in the Keystatic docs. However, this ONLY works if the content is stored in a **separate `.mdoc` file referenced by the field**, not as an inline YAML string.

The content in these YAML frontmatter blocks is stored as literal strings (e.g., `content: |- ...`). There is no separate `.mdoc` file for each section's content. This means `fields.markdoc()` will likely expose this as a **plain string** at runtime, not as a callable function.

**Fix required:** One of two approaches:
1. **Change rendering to handle both cases:** Use a guard like `typeof section.content === 'function' ? section.content() : section.content` in the component (this is defensive but not ideal)
2. **Revert markdoc() to text() for inline YAML content:** `fields.markdoc()` is designed for document-level content stored in separate files. For inline YAML block content, `fields.text({ multiline: true })` with `<Fragment set:html={...}>` or Markdown-to-HTML conversion may be the correct approach.
3. **Store content as separate files:** The `fields.markdoc()` field stores content in a dedicated companion file (e.g., `impressum/section-1.md`) — but this requires a significant restructuring of the content model.

> This is the most architecturally uncertain issue and needs careful testing before and after any code change.

---

## Issue 5 — MEDIUM: `ContentBlock` and `FaqBlock` rendering calls `body()` / `answer()` but these may return strings

**Status:** Likely identical to Issue 4; affects existing pages
**Phase that failed:** Phase 3 interaction with Phase 1

Same root cause as Issue 4 — the `ContentBlock.astro` was updated to call `{body()}` expecting a callable, and `FaqBlock.astro` was updated to call `{faq.answer()}`, but:

1. The migration script was never run (HTML still in content files)
2. Even after migration to Markdown, if `fields.markdoc()` stores the value as an inline YAML string, calling it as `body()` will throw `TypeError: body is not a function`

**The `de/preise.md` FAQ answers are already plain strings** — not HTML, not HTML-converted-to-Markdown, just plain text strings like:
```yaml
answer: >-
  Ja! Unser Drop-in-Ticket ermöglicht dir, jede Klasse einmalig zu
  besuchen, ohne Verpflichtung.
```

These will definitely fail because they're plain strings being called as functions.

**Fix required:**
- Determine if `fields.markdoc()` with inline YAML content returns a callable (test in dev)
- If NOT callable: revert component rendering from `{@render body()}` back to `<Fragment set:html={marked(body)} />` using a Markdown-to-HTML library, or render using a safe markdown renderer
- If callable: ensure migration script ran successfully first

---

## Issue 6 — LOW: Migration script may have regex issues with single-line `body` values

**Status:** Edge case in migration script
**Phase:** Phase 1.2 / 1.3

The migration script `scripts/migrate-html-to-markdoc.cjs` uses regex patterns that match:
```js
const bodyPattern = /(body:\s*>-?\s*\n)([\s\S]*?)(?=\n\s*fullBleed:|...)/g;
```

But `de/preise.md` has a single-line inline body:
```yaml
body: <h2>Pässe und Mitgliedschaften</h2>
```

This single-line format (no block scalar `>-` or `|-`) will **NOT be caught** by the regex pattern `/(body:\s*>-?\s*\n)/` because there's no newline after `body:`.

**Fix required:** The migration script needs to also handle single-line `body:` values without a block scalar prefix.

---

## Issue 7 — LOW: Migration script has a typo in the bodyPattern regex

**Status:** Minor bug in script
**File:** `scripts/migrate-html-to-markdoc.cjs` line 91

```js
const bodyPattern = /(body:\s*>-?\s*\n)([\s\S]*?)(?=\n\s*fullBleed:|n\s*backgroundImage:|\n\s*[a-zA-Z-]+:|\n---)/g;
```

Note: `n\s*backgroundImage:` should be `\n\s*backgroundImage:` — the `\` was dropped. This regex lookahead for `backgroundImage:` will likely never match, causing the body content to bleed into the next field on pages where `body` is followed by `backgroundImage` (like `de/studio.md`).

---

## Summary of All Issues

| # | Severity | Issue | Files Affected |
|---|----------|-------|---------------|
| 1 | 🔴 Critical | `de/agb.md` does not exist | `src/content/pages/de/` |
| 2 | 🔴 Critical | HTML migration script never run; `body`/`answer` still contain HTML | All pages with `ContentBlock` / `FaqBlock` |
| 3 | 🟠 High | Route collision: static `.astro` + content collection both serve same URLs | `src/pages/impressum.astro` etc. |
| 4 | 🟠 High | `fields.markdoc()` inline YAML may not produce callable render function | `LegalPageBlock.astro`, legal content `.md` files |
| 5 | 🟠 High | `ContentBlock`, `FaqBlock` call `body()`/`answer()` as function on strings | `ContentBlock.astro`, `FaqBlock.astro` |
| 6 | 🟡 Medium | Migration script misses single-line `body:` YAML values | `scripts/migrate-html-to-markdoc.cjs` |
| 7 | 🟡 Medium | Typo in migration regex (`n\s*` instead of `\n\s*`) | `scripts/migrate-html-to-markdoc.cjs` |

---

## Recommended Fix Order

### Step 1 — Determine `fields.markdoc()` rendering behavior (FIRST)

Before writing any fixes, run `pnpm dev` and test whether `{@render body()}` works with a page that has a `ContentBlock`. If it crashes with `TypeError: body is not a function`, then the entire rendering approach for `ContentBlock`, `FaqBlock`, and `LegalPageBlock` must be reconsidered.

**Two possible outcomes:**

**A) `fields.markdoc()` IS callable (via Keystatic internal Astro integration):**
- Proceed with running migration script (after fixing its bugs)
- Create `de/agb.md`
- Delete static `.astro` files

**B) `fields.markdoc()` is NOT callable from inline YAML content:**
- Revert `ContentBlock.astro` and `FaqBlock.astro` to use a safe renderer (e.g., `marked` or `micromark`) + `set:html` pattern
- Revert `LegalPageBlock.astro` to same
- Keep `z.any()` schema OR revert to `z.string()`
- Keep `fields.markdoc()` in Keystatic config (for the CMS editor UI) but render the output as string server-side
- Create `de/agb.md`
- Delete static `.astro` files
- Run migration script (corrected) to convert HTML → Markdown

### Step 2 — Fix migration script bugs (Issues 6 & 7)

Fix the regex typo and add single-line body handling before running.

### Step 3 — Create `de/agb.md` (Issue 1)

Port content from `src/pages/agb.astro`.

### Step 4 — Run migration script (Issue 2)

After confirming script is correct.

### Step 5 — Delete static `.astro` legal files (Issue 3)

Only after legal pages verified in dev.

### Step 6 — Final build verification

Run `pnpm build` and confirm no errors.

---

## Files Requiring Changes

| File | Change Needed |
|------|--------------|
| `scripts/migrate-html-to-markdoc.cjs` | Fix regex typo + add single-line body handling |
| `src/content/pages/de/agb.md` | Create (missing) |
| `src/components/blocks/ContentBlock.astro` | Guard rendering: `typeof body === 'function' ? body() : body` OR revert to `set:html` |
| `src/components/blocks/FaqBlock.astro` | Same guard for `answer` |
| `src/components/blocks/LegalPageBlock.astro` | Same guard for `section.content` |
| `src/pages/impressum.astro` | Delete (Phase 6) |
| `src/pages/datenschutz.astro` | Delete (Phase 6) |
| `src/pages/agb.astro` | Delete (Phase 6) |
| `src/pages/en/imprint.astro` | Delete (Phase 6) |
| `src/pages/en/privacy.astro` | Delete (Phase 6) |
| `src/pages/en/terms.astro` | Delete (Phase 6) |
