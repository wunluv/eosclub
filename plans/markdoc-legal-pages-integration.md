# Markdoc WYSIWYG + Legal Pages Integration Plan

## Overview

This plan combines two major deliverables:
1. **Markdoc WYSIWYG upgrade** — Enables rich text editing in Keystatic CMS for `ContentBlock.body` and `FaqBlock.answer` fields
2. **Legal pages (Impressum/Datenschutz/AGB)** — Moved from static `.astro` files to Keystatic-managed content with a new `LegalPageBlock`

**Branch:** All work must be done on a dedicated feature branch, e.g.:
```bash
git checkout -b feature/markdoc-wysiwyg-legal-pages
```

---

## ⚠️ Critical Context (Read Before Executing)

### `fields.emptyContent()` — What It Does and What It Doesn't
Per [`plans/keystatic-vite-stability-notes.md`](keystatic-vite-stability-notes.md) Issue 2, `fields.emptyContent()` was introduced as the **collection-level `content` field** to enable `.md` file discovery by Keystatic (without it, the CMS shows 0 entries). It is **NOT** a crash workaround for `fields.markdoc()`.

The `assertNever` crash (Issue 1 in the stability notes) is caused by block `schema` not being wrapped in `fields.object()` — already fixed in the current config. The `fields.image()` crash (`formKind: "asset"`) applies only inside `fields.blocks()` schema items.

**`fields.markdoc()` is a first-class supported field type in `@keystatic/core@0.5.x`** and does NOT trigger the `assertNever` crash. The two are at different levels:

| Field | Level | Purpose |
|-------|-------|---------|
| `fields.emptyContent()` | Collection `content` field | Enables `.md` file discovery — MUST remain |
| `fields.markdoc()` | Inside `blocks` item schemas | Provides WYSIWYG editing for rich text |

**Both must coexist.** Do not remove `fields.emptyContent()`.

### Existing Content Format
Current `ContentBlock.body` fields contain **raw HTML strings** (not Markdown), e.g.:
```yaml
body: >-
  <p>Hot Yoga. Hot Pilates & mehr.</p>
```
The migration script must handle **HTML-to-Markdoc** conversion, not Markdown-to-Markdoc.

### Markdoc Content Rendering in Astro
`{@render body()}` is the **correct and only pattern** needed. `fields.markdoc()` from `@keystatic/core` exposes content as a callable render function via Astro content collections. No additional import or package is required — this is built into `@keystatic/core@0.5.x` + Astro v5's content layer.

### `cmsSlug` for Legal Pages
Legal pages must use `cmsSlug` slugs matching their file path relative to `src/content/pages/`. Example: `cmsSlug: de/impressum`. Without this, Keystatic will attempt a rename and may break the entry. **Do not omit `cmsSlug` from legal page content files.**

### `translationSlug` Pairing for Legal Pages
`/en/imprint` already exists as a static page (`src/pages/en/imprint.astro`) and is the correct English counterpart for `/impressum`. Add both to the content collection with the standard bidirectional `translationSlug`:
- `de/impressum.md` → `translationSlug: imprint`
- `en/imprint.md` → `translationSlug: impressum`

Same pattern applies to datenschutz/privacy and agb/terms.

### `page-section-map.md` Must Be Updated
Legal page sections must be added to [`plans/page-section-map.md`](page-section-map.md) following the existing naming convention (e.g. `impressum-content`, `datenschutz-content`, `agb-content`).

---

## Dependencies

### No additional Markdoc package required
`fields.markdoc()` from `@keystatic/core` has its own built-in rendering pipeline. When Astro reads a content collection entry, Markdoc fields are exposed as **callable render functions** — rendered in `.astro` components with `{@render field()}`. This requires no extra npm package.

- **`@astrojs/markdoc`** — Astro's official integration for `.mdoc` *page* files. NOT needed here; our content lives in YAML frontmatter blocks.
- **`@markdoc/astro`** — An older wrapper for the same purpose. Also not needed.

**Conclusion: No `pnpm add` step required. No `astro.config.mjs` integration changes needed for Markdoc rendering.**

---

## Phase 0: Feature Branch Setup

### Task 0.1: Create Feature Branch
```bash
git checkout -b feature/markdoc-wysiwyg-legal-pages
```

---

## Phase 1: Markdoc Migration (Existing Content)

### Task 1.1: Audit Existing Content
- Read all files in `src/content/pages/de/` and `src/content/pages/en/`
- Identify all `ContentBlock.body` and `FaqBlock.answer` fields
- Verify content is HTML strings (confirmed in `de/home.md` — `body: >- <p>...</p>`)
- Document all migration conversion patterns needed

**Affected files confirmed via current content:**
- All pages with `ContentBlock` (home, studio, preise, events, wellness, team, kontakt)
- All pages with `FaqBlock` (preise, events)

### Task 1.2: Create Migration Script
Create `scripts/migrate-html-to-markdoc.js`:

Input (HTML in YAML frontmatter):
```
<p>text</p>        → text (paragraph, separated by blank line)
<h2>title</h2>     → ## title
<h3>title</h3>     → ### title
<a href="...">text</a> → [text](...)
<strong>text</strong>  → **text**
<em>text</em>      → *text*
<ul><li>x</li></ul>    → - x (bullet list)
<ol><li>x</li></ol>    → 1. x (numbered list)
<br />             → (line break — handle with Markdoc or double space)
```

> ⚠️ The current `ContentBlock.body` in `de/home.md` uses `>-` (YAML block scalar). The migration script must also handle `|-` and `>-` YAML scalars correctly when reading the body value.

### Task 1.3: Run Migration on Branch
- Run `node scripts/migrate-html-to-markdoc.js`
- Visually verify each affected page still renders correctly
- Commit migrated content files before proceeding to schema changes (the feature branch is the rollback point)

---

## Phase 2: Schema Updates (Keystatic + Zod)

> ⚠️ **Both schema files must be updated together.** The project rule is: never modify one without the other. Drift between [`src/content/config.ts`](../src/content/config.ts) and [`keystatic.config.ts`](../keystatic.config.ts) causes broken builds.

### Task 2.1: Update ContentBlock in Zod Schema
File: [`src/content/config.ts`](../src/content/config.ts)

```ts
// Change from:
body: z.string(),

// To (Markdoc produces a callable render function in Astro content collections):
body: z.any(),
```

### Task 2.2: Update ContentBlock in Keystatic Schema
File: [`keystatic.config.ts`](../keystatic.config.ts)

```ts
// Change from:
body: fields.text({ label: 'Body Content', multiline: true }),

// To:
body: fields.markdoc({
  label: 'Body Content',
  extension: 'md'
}),
```

### Task 2.3: Update FaqBlock answer in Both Schemas

In [`src/content/config.ts`](../src/content/config.ts):
```ts
// faqItemSchema — change from:
answer: z.string(),
// To:
answer: z.any(),
```

In [`keystatic.config.ts`](../keystatic.config.ts):
```ts
// FaqBlock.questions array item — change from:
answer: fields.text({ label: 'Answer', multiline: true }),
// To:
answer: fields.markdoc({ label: 'Answer', extension: 'md' }),
```

---

## Phase 3: Component Rendering Updates

### Task 3.1: Update ContentBlock.astro
File: [`src/components/blocks/ContentBlock.astro`](../src/components/blocks/ContentBlock.astro)

Current rendering (line 38 and line 46):
```astro
<Fragment set:html={body} />
```

Change to Markdoc render (Astro content collection markdoc field returns a callable):
```astro
---
// body is now a Markdoc render function from @keystatic/core
interface Props {
  body: () => any; // Markdoc render function
  backgroundImage?: string;
  fullBleed?: boolean;
  name?: string;
}
---
<!-- Replace <Fragment set:html={body} /> with: -->
{@render body()}
```

> **Note:** Keep the existing `prose` Tailwind classes and the GSAP animation `<script>` block unchanged. Only the `<Fragment set:html={body} />` call needs to change on both occurrences (lines 38 and 46).

### Task 3.2: Update FaqBlock.astro
File: [`src/components/blocks/FaqBlock.astro`](../src/components/blocks/FaqBlock.astro)

Current rendering (line 51):
```astro
<Fragment set:html={faq.answer} />
```

Change to:
```astro
{@render faq.answer()}
```

Update the interface type:
```ts
interface Props {
  title?: string;
  questions: Array<{
    question: string;
    answer: () => any; // Markdoc render function
  }>;
}
```

---

## Phase 4: LegalPageBlock (New Block)

### Task 4.1: Add LegalPageBlock to Zod Schema
File: [`src/content/config.ts`](../src/content/config.ts)

```ts
const legalPageSectionSchema = z.object({
  level: z.enum(['h1', 'h2', 'h3']).optional().default('h2'),
  title: z.string(),
  content: z.any(), // Markdoc render function
});

const legalPageBlockSchema = z.object({
  name: z.string().optional(),
  sections: z.array(legalPageSectionSchema),
});
```

Add to the `blockSchema` discriminated union:
```ts
z.object({ discriminant: z.literal('LegalPageBlock'), value: legalPageBlockSchema }),
```

### Task 4.2: Add LegalPageBlock to Keystatic Schema
File: [`keystatic.config.ts`](../keystatic.config.ts)

Add inside `fields.blocks({...})`:
```ts
LegalPageBlock: {
  label: 'Legal Page Block',
  schema: fields.object({
    name: fields.text({ label: 'Section Name (internal reference)' }),
    sections: fields.array(
      fields.object({
        level: fields.select({
          label: 'Heading Level',
          options: [
            { value: 'h1', label: 'Heading 1' },
            { value: 'h2', label: 'Heading 2' },
            { value: 'h3', label: 'Heading 3' },
          ],
          defaultValue: 'h2',
        }),
        title: fields.text({ label: 'Section Title' }),
        content: fields.markdoc({
          label: 'Section Content',
          extension: 'md'
        }),
      }),
      {
        label: 'Sections',
        itemLabel: (props) => props.fields.title.value || 'New Section',
      }
    ),
  }),
},
```

### Task 4.3: Create LegalPageBlock Component
File: `src/components/blocks/LegalPageBlock.astro` (new file)

```astro
---
interface Props {
  name?: string;
  sections: Array<{
    level?: 'h1' | 'h2' | 'h3';
    title: string;
    content: () => any; // Markdoc render function
  }>;
}

const { name, sections = [] } = Astro.props;
const sectionId = name ? `block-${name}` : undefined;
---

<section id={sectionId} class="container mx-auto px-4 py-16 max-w-3xl">
  <div class="space-y-8 text-eos-text leading-relaxed">
    {sections.map((section) => {
      const HeadingTag = section.level ?? 'h2';
      return (
        <div>
          <HeadingTag class="text-xl font-bold mb-2 font-serif text-eos-zen">
            {section.title}
          </HeadingTag>
          <div class="prose prose-lg prose-slate prose-headings:text-eos-zen prose-a:text-eos-accent hover:prose-a:underline text-sm leading-relaxed">
            {@render section.content()}
          </div>
        </div>
      );
    })}
  </div>
</section>
```

> **Design note:** Use `font-serif` for the section headings to match the existing static legal pages (e.g. `<h1 class="text-4xl font-serif">`). Use `text-eos-zen` not `eos-accent` on legal page headings (legal content is not a brand CTA). Do NOT use raw hex values — use Tailwind tokens only.

### Task 4.4: Add Dispatch Cases to All 3 Route Files
Files: (6 touchpoints required per project rules)
1. [`src/pages/[...slug].astro`](../src/pages/[...slug].astro)
2. [`src/pages/index.astro`](../src/pages/index.astro)
3. [`src/pages/en/[...slug].astro`](../src/pages/en/[...slug].astro)

For each file, add import:
```js
import LegalPageBlock from '../components/blocks/LegalPageBlock.astro';
// (adjust relative path for en/[...slug].astro: '../../components/blocks/LegalPageBlock.astro')
```

Add switch case (in both the `discriminant` branch AND the legacy `_template` branch in `en/[...slug].astro`):
```js
case 'LegalPageBlock':
  return <LegalPageBlock {...block.value} />;
```

> **Note:** [`src/pages/index.astro`](../src/pages/index.astro) is the DE home route — it technically won't serve legal pages, but must still include the import + case to keep all dispatchers in sync per project rules.

---

## Phase 5: Content Files

### Task 5.1: Create German Legal Content Files
Create in `src/content/pages/de/`:

**`impressum.md`** — port content from [`src/pages/impressum.astro`](../src/pages/impressum.astro):
```yaml
---
cmsSlug: de/impressum
title: Impressum | EOS CLUB
seoDescription: Rechtliche Informationen und Impressum von EOS CLUB GmbH.
translationSlug: imprint
blocks:
  - discriminant: LegalPageBlock
    value:
      name: impressum-content
      sections:
        - level: h1
          title: Impressum
          content: |
            Eos Morgenrot GmbH
            Eupener Straße 84
            50933 Köln
        # ... (port all sections from static page)
---
```

**`datenschutz.md`** — port content from [`src/pages/datenschutz.astro`](../src/pages/datenschutz.astro)

**`agb.md`** — port content from [`src/pages/agb.astro`](../src/pages/agb.astro)

### Task 5.2: Create English Legal Content Files
Create in `src/content/pages/en/`:

**`imprint.md`** — port content from [`src/pages/en/imprint.astro`](../src/pages/en/imprint.astro)

**`privacy.md`** — port content from [`src/pages/en/privacy.astro`](../src/pages/en/privacy.astro)

**`terms.md`** — port content from [`src/pages/en/terms.astro`](../src/pages/en/terms.astro)

> **i18n pairing required:** Each DE file must have `translationSlug` pointing to the EN slug and vice versa. Example: `de/impressum.md` → `translationSlug: imprint`, `en/imprint.md` → `translationSlug: impressum`.

### Task 5.3: Update page-section-map.md
File: [`plans/page-section-map.md`](page-section-map.md)

Add entries for the three new DE pages and three new EN pages. Naming convention for legal blocks:

| `name` | Block | Page |
|--------|-------|------|
| `impressum-content` | `LegalPageBlock` | impressum/imprint |
| `datenschutz-content` | `LegalPageBlock` | datenschutz/privacy |
| `agb-content` | `LegalPageBlock` | agb/terms |

---

## Phase 6: Cleanup

### Task 6.1: Delete Static Legal Page Files
Only delete AFTER verifying the CMS-driven equivalents render correctly:
- `src/pages/impressum.astro`
- `src/pages/datenschutz.astro`
- `src/pages/agb.astro`
- `src/pages/en/imprint.astro`
- `src/pages/en/privacy.astro`
- `src/pages/en/terms.astro`

> ⚠️ Deleting these pages before the content collection routes are verified will cause 404s. Perform cleanup only after Task 7.1–7.3 pass.

---

## Phase 7: Testing

### Task 7.1: Verify Markdoc Rendering (All Existing Pages)
- Run `pnpm dev`
- Navigate to all pages that have `ContentBlock` or `FaqBlock` (home, studio, preise, events, wellness, team, kontakt)
- Verify body text and FAQ answers render correctly (no raw HTML tags visible)

### Task 7.2: Verify Legal Pages
- Navigate to `/impressum`, `/datenschutz`, `/agb`
- Navigate to `/en/imprint`, `/en/privacy`, `/en/terms`
- Verify content matches original static `.astro` pages

### Task 7.3: Verify Keystatic CMS
- Access `http://localhost:4321/keystatic`
- Verify all pages appear in the CMS
- Verify `ContentBlock.body` shows the Markdoc WYSIWYG editor (not a plain textarea)
- Verify `FaqBlock.answer` shows the Markdoc WYSIWYG editor
- Verify `LegalPageBlock` sections are editable with WYSIWYG
- Test making an edit and confirming the rendered page updates

### Task 7.4: Verify Language Switching
- Navigate to `/impressum` and confirm the LangSwitch links to `/en/imprint`
- Navigate to `/en/imprint` and confirm the LangSwitch links back to `/impressum`

### Task 7.5: Build Verification
- Run `pnpm build`
- Verify no TypeScript errors (`@astrojs/check`)
- Verify all routes generate correctly (check `dist/` for expected static files)
- Verify no `assertNever` / `formKind: "asset"` Keystatic runtime crash

---

## File Change Summary

No new npm packages required. No `astro.config.mjs` changes required for Markdoc rendering.

| File | Action |
|------|--------|
| `scripts/migrate-html-to-markdoc.js` | Create (HTML-to-Markdoc migration tool) |
| `src/content/config.ts` | Update `body`/`answer` types to `z.any()`, add `LegalPageBlock` schema |
| `keystatic.config.ts` | Update `body`/`answer` to `fields.markdoc()`, add `LegalPageBlock` block |
| `src/components/blocks/ContentBlock.astro` | Replace `<Fragment set:html>` with `{@render body()}` (2 occurrences), update interface |
| `src/components/blocks/FaqBlock.astro` | Replace `<Fragment set:html>` with `{@render faq.answer()}`, update interface |
| `src/components/blocks/LegalPageBlock.astro` | Create new component |
| `src/pages/[...slug].astro` | Add `LegalPageBlock` import + switch case |
| `src/pages/index.astro` | Add `LegalPageBlock` import + switch case |
| `src/pages/en/[...slug].astro` | Add `LegalPageBlock` import + switch case (both `discriminant` and `_template` branches) |
| `src/content/pages/de/impressum.md` | Create |
| `src/content/pages/de/datenschutz.md` | Create |
| `src/content/pages/de/agb.md` | Create |
| `src/content/pages/en/imprint.md` | Create |
| `src/content/pages/en/privacy.md` | Create |
| `src/content/pages/en/terms.md` | Create |
| `plans/page-section-map.md` | Add legal page section entries |
| `src/pages/impressum.astro` | Delete (Phase 6 only, after testing) |
| `src/pages/datenschutz.astro` | Delete (Phase 6 only, after testing) |
| `src/pages/agb.astro` | Delete (Phase 6 only, after testing) |
| `src/pages/en/imprint.astro` | Delete (Phase 6 only, after testing) |
| `src/pages/en/privacy.astro` | Delete (Phase 6 only, after testing) |
| `src/pages/en/terms.astro` | Delete (Phase 6 only, after testing) |

---

## Prerequisites

- [ ] Feature branch created: `feature/markdoc-wysiwyg-legal-pages`
- [ ] Test on staging before merging to main

---

## References

- [`plans/KEYSTATIC_PART2_UPGRADE.md`](KEYSTATIC_PART2_UPGRADE.md) — Original Markdoc plan
- [`plans/keystatic-vite-stability-notes.md`](keystatic-vite-stability-notes.md) — Known Vite/Keystatic instability notes (fields.emptyContent, assertNever, image fields)
- [`plans/agent-quick-reference.md`](agent-quick-reference.md) — Bilingual routing and block format reference
- [Keystatic Markdoc docs](https://keystatic.com/docs/markdoc)
