# Keystatic Debug Plan — Pages shows 0 entries

## Goal
Restore content visibility in Keystatic and make existing page entries editable without schema parse failures.

## Observed Symptom
- Keystatic UI loads at `/keystatic`
- Collection `Pages` shows `0 entries`

## Root Cause Analysis

### 1) Collection path pattern is incompatible with Keystatic slug resolution
In [`keystatic.config.ts`](../keystatic.config.ts), `path: 'src/content/pages/**/*'` is treated by Keystatic as a slug-glob path with a suffix derived from `*`. This pattern causes entry path resolution to miss real files.

### 2) Collection format does not match file extension
Current config uses `format: { data: 'yaml' }`, which makes Keystatic look for `.yaml` data files.

Actual content files are `.md` under [`src/content/pages/`](../src/content/pages), so entries are not indexed.

### 3) `slugField` is configured to a non-slug field
`slugField: 'translationSlug'` points to `fields.text(...)`, but Keystatic expects a slug form field for `slugField`.

Once indexing is fixed, this can cause runtime parse/edit failures.

### 4) Data type mismatch in block fields
In [`keystatic.config.ts`](../keystatic.config.ts), these fields use rich document types:
- `ContentBlock.body` via `fields.document(...)`
- `FaqBlock.questions[].answer` via `fields.document(...)`

Existing frontmatter data in [`src/content/pages/de/home.md`](../src/content/pages/de/home.md) and peers stores these as plain strings (HTML/text). This mismatch can break entry rendering/editing.

---

## File-by-File Patch Plan

## 1) `keystatic.config.ts` — fix indexing and compatibility

File: [`keystatic.config.ts`](../keystatic.config.ts)

### Patch A (required to resolve `0 entries`)
1. Remove `slugField: 'translationSlug'`.
2. Change collection path from:
   - `path: 'src/content/pages/**/*'`
   to:
   - `path: 'src/content/pages/**'`
3. Change collection format from:
   - `format: { data: 'yaml' }`
   to:
   - `format: 'md'`

### Patch B (required for editing existing content safely)
4. Change `ContentBlock.body` from `fields.document(...)` to `fields.text({ multiline: true, ... })`.
5. Change `FaqBlock.questions[].answer` from `fields.document(...)` to `fields.text({ multiline: true, ... })`.
6. Remove top-level schema field `content: fields.document(...)` (not used in current files and may introduce parse/write drift).

### Suggested concrete diff
```diff
--- a/keystatic.config.ts
+++ b/keystatic.config.ts
@@
   collections: {
     pages: collection({
       label: 'Pages',
-      slugField: 'translationSlug',
-      path: 'src/content/pages/**/*',
-      format: { data: 'yaml' },
+      path: 'src/content/pages/**',
+      format: 'md',
       schema: {
@@
             ContentBlock: {
               label: 'Content Block',
               schema: fields.object({
                 name: fields.text({ label: 'Section Name (internal reference)' }),
-                body: fields.document({
-                  label: 'Body Content',
-                  formatting: true,
-                  links: true,
-                  dividers: true,
-                }),
+                body: fields.text({ label: 'Body Content', multiline: true }),
                 fullBleed: fields.checkbox({ label: 'Full Bleed Layout' }),
                 backgroundImage: fields.image({
                   label: 'Background Image',
@@
                 questions: fields.array(
                   fields.object({
                     question: fields.text({ label: 'Question' }),
-                    answer: fields.document({
-                      label: 'Answer',
-                      formatting: true,
-                      links: true,
-                    }),
+                    answer: fields.text({ label: 'Answer', multiline: true }),
                   }),
@@
-        content: fields.document({
-          label: 'Content',
-          formatting: true,
-          dividers: true,
-          links: true,
-        }),
       },
     }),
   },
 })
```

---

## Verification Checklist (for Code agent)

1. Start dev server:
   - `pnpm dev`
2. Open `/keystatic`.
3. Confirm `Pages` shows entries (expected: `16`).
4. Open at least:
   - `de/home`
   - `en/home`
5. Edit a safe field (e.g., `seoDescription`) and save.
6. Confirm markdown file change is written under [`src/content/pages/`](../src/content/pages).
7. Reload `/keystatic`; verify entries still render.

---

## If Additional Errors Appear

### A) If an entry fails to open due to field parsing
Check that all rich-doc fields were converted to text in [`keystatic.config.ts`](../keystatic.config.ts).

### B) If save fails with slug-related error
Re-check that `slugField` is fully removed from [`keystatic.config.ts`](../keystatic.config.ts).

### C) If you want rich text editing later
Create a separate migration track:
- Migrate string HTML/text into Keystatic document field format.
- Reintroduce `fields.document(...)` only after content migration.

---

## Handover Notes for Orchestrator
- This is a config-only fix in [`keystatic.config.ts`](../keystatic.config.ts).
- No content rewrite is required for the primary unblock.
- Expected outcome after Patch A+B: content loads in Keystatic and existing entries are editable with current data shape.
