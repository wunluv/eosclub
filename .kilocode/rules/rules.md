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
