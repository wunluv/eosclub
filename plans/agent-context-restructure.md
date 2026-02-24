# Agent Context Restructuring Plan

## Problem

`agent_context.md` is manually attached to every coding request, costing ~3,000 tokens per request regardless of relevance. The `.kilocode/rules/rules.md` file (auto-injected into every mode) is empty. The `eos-front-end` mode incorrectly states Tailwind v4+.

## Solution: Three-tier context delivery

### Tier 1 — `.kilocode/rules/rules.md` (auto-injected, every mode, every request)

Only universal invariants that are always relevant. Target: ~800 tokens.

```markdown
# EOS CLUB — Project Rules

## Stack
Astro v5 SSG | Tailwind CSS v3 | GSAP v3.14.2 | TinaCMS | bsport SDK (CDN) | pnpm

## i18n
- Default locale: `de` (no URL prefix). English: `/en/` prefix.
- `prefixDefaultLocale: false` in astro.config.mjs
- Locale detection: `Astro.currentLocale` returns `de` or `en`
- Language determined by file path, NOT frontmatter
- LangSwitch uses `translationSlug` frontmatter field (not naive slug swap)

## Design Tokens
- Colors: `eos-base` #F9F9F7 | `eos-contrast` #2F3A40 | `eos-accent` #FF2E00 | `eos-subtle` #E6E5E0 | `eos-text` #1F2933 | `eos-zen` #09090B
- Fonts: `font-serif` Merriweather (headings) | `font-sans` Geist Sans, Inter (body/UI)
- NEVER use `eos-accent` for body text. NEVER use pure `#000000`.
- Use Tailwind config tokens only — no magic hex values.

## Block System
Pages use a `blocks[]` array in frontmatter. Routes iterate and dispatch via `switch (block._template)`.

Adding a new block:
1. Create `src/components/blocks/MyBlock.astro`
2. Add Zod schema to `src/content/config.ts` discriminated union
3. Add TinaCMS template to `tina/config.ts` pages collection
4. Add import + switch case to `src/pages/[...slug].astro`
5. Add import + switch case to `src/pages/index.astro`

## Section Pattern Language
Every block has a `name` field for precise referencing. Conventions:
- `[page]-hero` | `[descriptor]-intro` | `[descriptor]-grid` | `[descriptor]-list` | `[descriptor]-faq` | `[descriptor]-booking-cta`
- Find: `grep -r "name: philosophy-intro" src/content/`
- Full map: `plans/page-section-map.md`

## Key Directories
- `src/components/blocks/` — block components
- `src/components/common/` — Header, Footer, LangSwitch
- `src/components/integrations/` — bsport widget wrappers
- `src/content/pages/de/` and `en/` — page content markdown
- `src/content/config.ts` — Zod schemas
- `tina/config.ts` — TinaCMS UI schema

## Full Reference
For complete block schemas, bsport widget details, env vars, and deployment info: see `plans/project-context.md`
```

---

### Tier 2 — Mode `customInstructions` (injected only in that mode)

#### `eos-front-end` mode — add to customInstructions:

```yaml
customInstructions: |
  ## GSAP Constraints
  - Allowed: hero headline staggered fade-in, feature grid scroll fade-in, InteractiveListBlock hover-image
  - Forbidden: ScrollTrigger, parallax, pinning
  - All GSAP wrapped in prefers-reduced-motion check
  - Use astro:after-swap for view transitions compatibility
  - Inline <script> tags, not React islands

  ## bsport Integration
  - Company ID: 5082 (hardcoded in all integration components)
  - CDN: https://cdn.bsport.io/scripts/widget.js
  - BaseLayout.astro must have <slot name="head" /> in <head>
  - Dialog mode 3 = inline embed, 0 = popup trigger

  ## Locale Pattern for Components
  ```astro
  const locale = Astro.currentLocale ?? 'de';
  const isDE = locale.startsWith('de');
  const label = isDE ? 'Deutsch' : 'English';
  ```
  Content strings come from frontmatter — no localisation logic in components.
```

#### `eos-front-end` mode — fix roleDefinition:

Change `Tailwind CSS v4+` → `Tailwind CSS v3` in the roleDefinition.

---

### Tier 3 — `plans/project-context.md` (on-demand, read when needed)

Rename `agent_context.md` → `plans/project-context.md`. Keep full content as-is (with Tailwind version corrected to v3). Agent reads this file only when a task requires deep context.

---

## Changes Summary

| File | Action |
|------|--------|
| `.kilocode/rules/rules.md` | Populate with Tier 1 content |
| `.kilocodemodes` | Fix `eos-front-end` roleDefinition Tailwind version; add GSAP/bsport/locale customInstructions |
| `agent_context.md` | Rename to `plans/project-context.md`, correct Tailwind to v3 |

## Token Budget

| Layer | Estimated tokens | Injection |
|-------|-----------------|-----------|
| rules.md | ~600-800 | Every request, every mode (automatic) |
| eos-front-end customInstructions | ~300-400 | Only in eos-front-end mode (automatic) |
| plans/project-context.md | ~3,000 | On-demand via read_file (manual/agent-initiated) |
