# EOS CLUB — Project Rules

## Stack
Astro v5 SSG | Tailwind CSS v3 | GSAP v3.14.2 | Keystatic CMS | bsport SDK (CDN) | pnpm

---

## i18n

- Default locale: `de` (no URL prefix). English: `/en/` prefix.
- `prefixDefaultLocale: false` in `astro.config.mjs`
- Locale detection: `Astro.currentLocale` returns `'de'` or `'en'`
- Language is determined by **file path**, NOT frontmatter
- `LangSwitch` uses `translationSlug` frontmatter field — NOT a naive slug swap

### Slug Pair Matrix
| DE file | EN file | DE URL | EN URL |
|---------|---------|--------|--------|
| `home.md` | `home.md` | `/` | `/en` |
| `studio.md` | `studio.md` | `/studio` | `/en/studio` |
| `kurse.md` | `classes.md` | `/kurse` | `/en/classes` |
| `preise.md` | `pricing.md` | `/preise` | `/en/pricing` |
| `events.md` | `events.md` | `/events` | `/en/events` |
| `wellness.md` | `wellness.md` | `/wellness` | `/en/wellness` |
| `team.md` | `team.md` | `/team` | `/en/team` |
| `kontakt.md` | `contact.md` | `/kontakt` | `/en/contact` |
| `impressum.md` | _(none)_ | `/impressum` | — |

`translationSlug` in a DE file = the EN filename slug (without `.md`), and vice versa.

---

## Design Tokens

- Colors: `eos-base` #F9F9F7 | `eos-contrast` #2F3A40 | `eos-accent` #FF2E00 | `eos-subtle` #E6E5E0 | `eos-text` #1F2933 | `eos-zen` #09090B
- Gradients: `accent-gradient` | `heat-gradient` | `wash-gradient` — defined in `tailwind.config.mjs`
- Fonts: `font-serif` Merriweather (headings) | `font-sans` Geist Sans, Inter (body/UI)
- **NEVER** use `eos-accent` for body text. **NEVER** use pure `#000000`.
- Use Tailwind config tokens only — no magic hex values in component code.

---

## Block System

Pages use a `blocks[]` array in frontmatter. Routes iterate and dispatch via **discriminated union**:

```js
// Modern shape (all locales):
switch (block.discriminant) {
  case 'HeroBlock': return <HeroBlock {...block.value} />;
}
```

> ⚠️ The legacy `block._template` shape may appear in older EN content — the EN route handles backward compatibility. All new content uses `discriminant + value`.

### Adding a New Block (6 Touchpoints — All Required)

1. Create `src/components/blocks/MyBlock.astro`
2. Add Zod schema to `src/content/config.ts` → discriminated union
3. Add Keystatic schema to `keystatic.config.ts` → `collections.pages.schema`
4. Add import + switch case to `src/pages/[...slug].astro` (DE)
5. Add import + switch case to `src/pages/index.astro` (DE home)
6. Add import + switch case to `src/pages/en/[...slug].astro` (EN)

Skipping any of these 6 steps will cause a broken page or missing CMS field.

### Available Blocks
| Block | `discriminant` | Purpose |
|-------|---------------|---------|
| `HeroBlock` | `HeroBlock` | Hero — variants: `split-grid`, `cover`, `minimal` |
| `ContentBlock` | `ContentBlock` | Rich text / Markdown body |
| `BookingBlock` | `BookingBlock` | CTA link to bsport booking URL |
| `FeatureGridBlock` | `FeatureGridBlock` | Icon + title + description grid |
| `FullBleedBlock` | `FullBleedBlock` | Edge-to-edge background image |
| `InteractiveListBlock` | `InteractiveListBlock` | Hover-reveal image list (GSAP, desktop only) |
| `FaqBlock` | `FaqBlock` | `<details>/<summary>` accordion |
| `BsportCalendar` | `BsportCalendar` | bsport calendar widget |
| `BsportPasses` | `BsportPasses` | bsport passes widget |
| `BsportSubscription` | `BsportSubscription` | bsport subscription widget |

---

## Section Pattern Language

Every block has a `name` field for human/agent referencing. It has **no runtime effect**.

Naming conventions:
- `[page]-hero` | `[descriptor]-intro` | `[descriptor]-grid` | `[descriptor]-list` | `[descriptor]-faq` | `[descriptor]-booking-cta`

Finding a block: `grep -r "name: philosophy-intro" src/content/`

Full page × section map: `plans/page-section-map.md`

---

## Keystatic CMS

- Dev UI: `http://localhost:4321/keystatic`
- Production UI: `https://eos-club.de/keystatic`
- Storage: local filesystem in dev (`kind: 'local'`), GitHub-backed in prod (`kind: 'github'`)
- Images: store in `public/assets/`, reference as `/assets/filename.jpg` in content
- Schema file: `keystatic.config.ts` — must stay in sync with `src/content/config.ts`

---

## GSAP Rules

**Allowed uses only:**
- Hero headline/subheadline: staggered fade-in `translateY` on page load
- Feature grid: staggered fade-in on scroll via `IntersectionObserver`
- `InteractiveListBlock`: hover-image `gsap.fromTo()` opacity + translateY

**Constraints:**
- No `ScrollTrigger`, no parallax, no pinning
- All GSAP calls wrapped in `prefers-reduced-motion` check
- Use `astro:after-swap` listener for view transition compatibility
- Inline `<script>` tag only — not a React island

---

## bsport Integration

- Company ID: `5082` — hardcoded in all integration components
- CDN: `https://cdn.bsport.io/scripts/widget.js`
- `BaseLayout.astro` must have `<slot name="head" />` inside `<head>` — widgets inject the CDN loader through this slot
- Dialog modes: `3` = inline embed | `0` = popup trigger

---

## Common Breaking Changes to Avoid

| ❌ Don't | ✅ Do instead |
|---------|--------------|
| Change `translationSlug` in one file only | Always update both DE and EN files together |
| Add a block to fewer than all 3 dispatchers | Update all 6 touchpoints |
| Modify block schema in only one of the two schema files | Keep `config.ts` and `keystatic.config.ts` in sync |
| Use raw hex values in components | Use Tailwind design tokens |
| Assume EN and DE route files are identical | EN route handles legacy `_template` format too |
| Rename content files without updating routing | Update slugs and `translationSlug` references |

---

## Key Directories & Files

| Path | Purpose |
|------|---------|
| `src/components/blocks/` | Block components |
| `src/components/common/` | Header, Footer, LangSwitch |
| `src/components/integrations/` | bsport widget wrappers |
| `src/content/pages/de/` | German page content (markdown) |
| `src/content/pages/en/` | English page content (markdown) |
| `src/content/config.ts` | Zod schemas for all block types |
| `keystatic.config.ts` | Keystatic CMS UI schema |
| `tailwind.config.mjs` | Design tokens |
| `src/pages/[...slug].astro` | DE catch-all route + dispatcher |
| `src/pages/index.astro` | DE home route + dispatcher |
| `src/pages/en/[...slug].astro` | EN catch-all route + dispatcher |
| `src/components/common/LangSwitch.astro` | Language toggle component |

---

## Full Reference

- Block schemas, bsport widget details, env vars, deployment: `plans/project-context.md`
- Bilingual routing, block formats, Keystatic usage: `plans/agent-quick-reference.md`
- Page × section name map: `plans/page-section-map.md`
