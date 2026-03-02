# Keystatic Editor UX Audit and Implementation Plan

## Scope

This document captures the first-pass audit for Keystatic editing UX issues and a prioritized implementation plan for handoff to Orchestrator and Code agents.

In-scope files reviewed:

- `keystatic.config.ts`
- `src/content/config.ts`
- `src/pages/[...slug].astro`
- `src/pages/en/[...slug].astro`
- `src/pages/index.astro`
- Representative content files under `src/content/pages/de/` and `src/content/pages/en/`

---

## Concise Audit Report

## 1) Hero images disappear on save in Keystatic

- **Symptom**
  - Existing hero/background images are not reliably visible in editor state.
  - Saving can remove frontmatter image keys (for example `backgroundImage`) from content entries.

- **Likely root cause**
  - Image field round-trip mismatch between persisted value shape in markdown and what `fields.image()` expects when hydrating existing values.
  - Existing content stores path strings like `/assets/infrared_therapy_studio.png`; if not recognized by the field parser in all cases, save can serialize as empty and remove keys.
  - Additional architecture fragility in current blocks schema: each block schema is wrapped with `fields.object()` inside `fields.blocks()`, which is a known unstable pattern for Keystatic block editing.

- **Impact**
  - Editors can unintentionally break page visuals when performing unrelated edits.
  - High trust risk for non-technical users.

- **Affected files**
  - `keystatic.config.ts`
  - `src/content/pages/**/*.md` (both DE and EN)

---

## 2) Top-level editor Content field is disconnected from runtime rendering

- **Symptom**
  - Keystatic shows a top-level `Content` WYSIWYG/Markdoc field.
  - Text typed there is saved in markdown but does not render on site.

- **Root cause**
  - Keystatic schema defines a top-level `content` field.
  - Runtime page rendering dispatches only `blocks` and ignores top-level content.
  - Astro content schema does not include top-level `content`, reinforcing mismatch.

- **Impact**
  - Editors are given an input that appears functional but has no frontend outcome.
  - Increases confusion and accidental content debt.

- **Affected files**
  - `keystatic.config.ts`
  - `src/content/config.ts`
  - `src/pages/[...slug].astro`
  - `src/pages/en/[...slug].astro`
  - `src/pages/index.astro`

---

## 3) Block composer UX is too permissive and unclear for non-tech editors

- **Symptom**
  - Editors can add arbitrary block types with little guidance on where/why to use them.
  - It is unclear what adding a given block does to frontend output.

- **Root cause**
  - Generic `fields.blocks()` setup exposes all block types globally without page-level constraints, editorial affordances, or guardrails.
  - Descriptions/help text are minimal, and there is no explicit “safe editing” path for common tasks.

- **Impact**
  - Inconsistent page composition and accidental regressions.
  - Elevated onboarding burden for editors.

- **Affected files**
  - `keystatic.config.ts`
  - Documentation files for editorial guidance (to be added/updated)

---

## 4) Non-obvious architecture issue: schema drift risk between CMS and runtime

- **Symptom**
  - Keystatic schema and Astro Zod schema evolve independently.
  - Content can be “valid enough to save” in editor while not matching rendering expectations.

- **Root cause**
  - No contract test or schema parity check process between:
    - CMS model (`keystatic.config.ts`)
    - Runtime validation (`src/content/config.ts`)
    - Renderer assumptions (`src/pages/...` and block components)

- **Impact**
  - Silent regressions, content inconsistencies, and editor trust erosion.

- **Affected files**
  - `keystatic.config.ts`
  - `src/content/config.ts`
  - `src/pages/**/*.astro`

---

## Prioritized Implementation Plan for Code Mode

## P1. Stabilize image persistence and existing image visibility

1. Refactor block schema definitions in `keystatic.config.ts` so each `fields.blocks()` variant uses plain `schema` records (no `fields.object()` wrappers).
2. Verify and normalize image field behavior for all image-bearing block fields.
3. Add a one-time content migration/normalization pass if needed so all persisted image paths are in the exact format Keystatic rehydrates reliably.
4. Validate save/reload behavior for representative DE/EN pages with hero, content background, interactive list, full-bleed, and og image fields.

**Acceptance criteria**

- Existing image fields are visible in Keystatic before any edit.
- Saving a page without touching image fields does not remove existing image keys.
- Frontend render remains unchanged after save on tested DE/EN pages.

---

## P2. Resolve orphan top-level content field mismatch

1. Decide contract: remove top-level `content` from CMS schema or wire it intentionally into runtime rendering.
2. Align `keystatic.config.ts`, `src/content/config.ts`, and page renderers to the chosen contract.
3. If removing field, migrate/clean any existing top-level markdown content that was previously stored but unused.

**Acceptance criteria**

- No editable field in Keystatic is disconnected from frontend output.
- Editors can no longer add content that silently fails to render.

---

## P3. Improve editor guardrails for non-technical UX

1. Add actionable field descriptions and labels, especially for image requirements and intended block use.
2. Reduce accidental complexity in block insertion flow (for example constrained defaults, clear block naming, or supported block sets per page type if feasible).
3. Introduce “safe editing path” guidance (what to edit for copy vs layout changes).

**Acceptance criteria**

- Editors can identify what each field affects without code knowledge.
- Block insertion choices are clearer and less error-prone.

---

## P4. Add schema-parity quality gate and editorial QA checklist

1. Add a lightweight parity check process to detect divergence between CMS schema and Astro content schema.
2. Add a repeatable DE/EN QA checklist for Keystatic save behavior and frontend parity.
3. Document editor guardrails in project docs for handoff.

**Acceptance criteria**

- Schema drift is detectable before regressions reach editors.
- Team has a standard QA workflow for CMS changes.

---

## Execution Order

1. P1 image persistence
2. P2 content-field contract alignment
3. P3 UX guardrails
4. P4 parity checks and docs

---

## Handoff Notes for Orchestrator

- Treat P1 and P2 as mandatory stabilization work before broader UX iteration.
- Include DE and EN parity checks in definition of done for each coding subtask.
- Keep changes scoped and reversible; migration should be idempotent or backed by easy rollback.
- After stabilization, iterate P3/P4 with editor feedback cycles.
