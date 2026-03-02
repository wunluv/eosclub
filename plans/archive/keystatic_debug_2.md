# Keystatic Debug Plan v2 — Two-Part Recovery Strategy

## Goal
Unblock Keystatic editing immediately with a low-risk config-only correction, then perform a controlled architecture upgrade via content migration.

---

## Part 1 — Config Fix + Content Load (Immediate Unblock)

### Objective
Resolve current entry-open failure:
- `YAMLException: expected a single document in the stream, but found more`

while keeping existing content files in `src/content/pages/**/*.md` unchanged.

### Scope
- File in scope: `keystatic.config.ts`
- Out of scope: bulk edits to files under `src/content/pages/`

### Working Hypothesis
Current content files are frontmatter-only markdown with opening/closing frontmatter delimiters. Keystatic indexing is restored, but the entry-open parse path is still mismatched to current file format expectations.

### Tasks
1. Confirm and apply minimal collection format/parser config in `keystatic.config.ts` for frontmatter `.md` files.
2. Keep current schema compatibility safeguards already applied:
   - `ContentBlock.body` as multiline text
   - `FaqBlock.questions[].answer` as multiline text
   - no `slugField`
3. Re-run local validation (`pnpm build`).
4. Validate in Keystatic UI:
   - entries visible
   - entries open without YAML parse exception
   - save works for a safe field (for example `seoDescription`)
   - saved change writes to `src/content/pages/...`

### Acceptance Criteria
- `/keystatic` shows all expected entries.
- Opening `de/home` and `en/home` no longer throws YAMLException.
- At least one save operation succeeds and persists to markdown.
- `pnpm build` remains successful.

### Rollback
If parse errors worsen, revert only `keystatic.config.ts` changes from this part.

---

## Part 2 — Architecture Improvement via Content Migration (Deferred)

### Objective
Migrate content and schema/storage expectations to a single canonical long-term shape to avoid parser ambiguity and enable richer editor ergonomics.

### Scope
- `src/content/pages/**/*.md`
- `keystatic.config.ts`
- Potentially `src/content/config.ts` and any route/block assumptions if required

### Tasks (High-Level)
1. Define canonical persisted shape for blocks and rich text fields.
2. Build and run migration script with backup/rollback strategy.
3. Update Keystatic schema to match migrated shape.
4. Verify Astro rendering and content validation remain correct.
5. Run full QA pass in both editor and frontend.

### Exit Criteria
- No schema/parser edge cases in Keystatic.
- Content model consistent between editor and Astro runtime.
- Editing flow stable for all page entries.

---

## Handover Note
Proceed with **Part 1 only** until manual user validation passes. Part 2 stays parked.

---

## Part 1 Postmortem — Root Cause Confirmed

### Why `0 entries` happened
The regression was caused by an extension mismatch between Keystatic `contentField` parsing and the repository file extension:

- Collection format used `contentField: 'content'`.
- Schema used `content: fields.markdoc(...)`.
- `markdoc` defaults to `.mdoc` content extension.
- Repository files are `.md` under `src/content/pages/**`.

Result: Keystatic indexed against `.mdoc` expectation and returned `0 entries`.

### Stabilizing fix applied
In `keystatic.config.ts`, set:

- `content: fields.markdoc({ label: 'Content', extension: 'md' })`

This aligns parser expectations to existing `.md` files and restores indexing/opening behavior.

---

## Decision — Part 2 is Required

Part 2 is **not optional** for long-term architecture quality. Part 1 restores operation, but Part 2 is required to reach a canonical, maintainable model for future content management.

### Part 2 execution principles
1. No ad-hoc field drift between Astro and Keystatic schemas.
2. One canonical persisted content shape for all page files.
3. Migration script is deterministic, reversible, and validated.
4. Keystatic write shape and Astro read shape are contract-tested.

### Part 2 implementation workstream
1. Define target canonical content contract in `plans/KEYSTATIC_MIGRATION_SPEC.md`.
2. Add pre-migration snapshot and rollback procedure.
3. Implement migration script to normalize all `src/content/pages/**/*.md` entries to canonical shape.
4. Update `keystatic.config.ts` and `src/content/config.ts` to the same contract.
5. Validate editor flows in `/keystatic` and frontend rendering parity.
6. Finalize with acceptance checklist and handover notes.
