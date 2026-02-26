# EOS CLUB — Astro SSG Website

Static site for a yoga/wellness studio in Germany. Astro v5 SSG, TailwindCSS v3, GSAP v3, TinaCMS, bsport booking integration. German default locale (no URL prefix), English at `/en/`.

---

## Stack

| Technology | Version | Notes |
|------------|---------|-------|
| Astro | v5 | `output: 'static'` |
| TailwindCSS | v3 | Custom design tokens |
| GSAP | v3.14.2 | Limited scope — see GSAP Rules |
| TinaCMS | — | Local + TinaCloud |
| bsport SDK | CDN | `https://cdn.bsport.io/scripts/widget.js` |
| pnpm | — | Package manager |

---

## i18n & Routing

**Configuration:**
```js
// astro.config.mjs
i18n: {
  defaultLocale: "de",
  locales: ["de", "en"],
  routing: { prefixDefaultLocale: false }
}
```

**URL Pattern:**
- DE: `eos-club.de/kurse` (no prefix)
- EN: `eos-club.de/en/classes`

**Locale Detection:**
- `Astro.currentLocale` returns `'de'` or `'en'` in any component
- Language determined by file path (`de/` or `en/`), NOT frontmatter

**Page Slug Pairs:**

| DE slug | EN slug | Nav Label |
|---------|---------|-----------|
| `/home` | `/en/home` | Home |
| `/studio` | `/en/studio` | Studio |
| `/kurse` | `/en/classes` | Kurse / Classes |
| `/preise` | `/en/pricing` | Preise / Pricing |
| `/events` | `/en/events` | Events |
| `/wellness` | `/en/wellness` | Wellness |
| `/team` | `/en/team` | Team |
| `/kontakt` | `/en/contact` | Kontakt / Contact |
| `/impressum` | (none) | Impressum (DE-only, footer) |

**LangSwitch Logic:**
- Reads `translationSlug` frontmatter field
- DE page → links to `/en/{translationSlug}`
- EN page → links to `/{translationSlug}`
- NOT a naive slug swap

---

## Design Tokens

**Colors:**

```js
colors: {
  eos: {
    base:     '#F9F9F7',  // 60% — dominant background (Mineral White)
    contrast: '#2F3A40',  // 30% — secondary / dark elements (Deep Slate)
    accent:   '#FF2E00',  // 10% — CTA, active, headings (Infrared Red)
    subtle:   '#E6E5E0',  // secondary backgrounds (Warm Concrete)
    text:     '#1F2933',  // body text (Night Slate)
    zen:      '#09090B',  // inputs, dark surfaces (Zen Black)
  }
}
```

**Gradients:**

```js
backgroundImage: {
  'accent-gradient': 'linear-gradient(135deg, #FF2E00 0%, #FF5C00 100%)',
  'heat-gradient':   'linear-gradient(135deg, #E9B24A 0%, #E8742C 35%, #E6534A 60%, #E24676 78%, #C74A8E 100%)',
  'wash-gradient':   'linear-gradient(135deg, #F2F4C9 0%, #FBF3D6 45%, #F8E1D5 100%)',
}
```

**Typography:**

```js
fontFamily: {
  serif: ['Merriweather', 'serif'],     // headings
  sans:  ['Geist Sans', 'Inter', 'sans-serif'], // body / UI
}
```

**Constraints:**
- Never use `#FF2E00` (accent) for body text
- Never use pure `#000000`

---

## File Structure

```
src/
  components/
    blocks/
      HeroBlock.astro              # Dispatcher (variant → sub-component)
      hero/
        HeroSplitGrid.astro        # Split column + 2×2 image grid (home)
        HeroCover.astro            # Full-width bg image + gradient overlay
        HeroMinimal.astro          # Centered text only, no image
      ContentBlock.astro
      BookingBlock.astro
      FeatureGridBlock.astro
      FullBleedBlock.astro         # Edge-to-edge image (breaks max-w-7xl)
      InteractiveListBlock.astro   # GSAP hover-image list
      FaqBlock.astro               # <details>/<summary> accordion
    common/
      Header.astro
      Footer.astro
      LangSwitch.astro
    integrations/
      BsportCalendar.astro
      BsportSubscription.astro
      BsportPasses.astro
      BsportWorkshop.astro
      BsportLeadCapture.astro
      BsportLoginButton.astro
      BsportShop.astro
      BsportWidget.astro
    EmailSignup.astro
  content/
    config.ts                      # Zod schemas for all blocks
    pages/
      de/  home.md, studio.md, kurse.md, preise.md, events.md, wellness.md, team.md, kontakt.md
      en/  home.md, studio.md, classes.md, pricing.md, events.md, wellness.md, team.md, contact.md
  layouts/
    BaseLayout.astro
  pages/
    [...slug].astro                # DE catch-all
    index.astro                    # Home page (also DE)
    404.astro
    impressum.astro
tina/
  config.ts                        # TinaCMS UI schema
tailwind.config.mjs
astro.config.mjs
```

---

## Block System

**Architecture:** Pages use a `blocks` array in frontmatter. Page routes iterate blocks and dispatch via `switch (block._template)`.

**Adding a New Block:**

1. Create `src/components/blocks/MyBlock.astro`
2. Add Zod schema to `src/content/config.ts` → add to `z.discriminatedUnion` in `blockSchema`
3. Add TinaCMS template to `tina/config.ts` → `pages` collection templates array
4. Add import + switch case to `src/pages/[...slug].astro`
5. Add import + switch case to `src/pages/index.astro`

**Block Reference:**

| Block | `_template` | Description |
|-------|-------------|-------------|
| `HeroBlock.astro` | `HeroBlock` | Dispatcher. `variant` field selects sub-component |
| `ContentBlock.astro` | `ContentBlock` | Rich text / Markdown body |
| `BookingBlock.astro` | `BookingBlock` | CTA link to bsport booking URL |
| `FeatureGridBlock.astro` | `FeatureGridBlock` | Icon + title + description grid |
| `FullBleedBlock.astro` | `FullBleedBlock` | Edge-to-edge bg image. Breaks `max-w-7xl` via `w-screen relative left-1/2 -translate-x-1/2` |
| `InteractiveListBlock.astro` | `InteractiveListBlock` | List with GSAP hover-image reveal (desktop). Static on mobile/touch. `prefers-reduced-motion` respected. Used: home, studio |
| `FaqBlock.astro` | `FaqBlock` | `<details>/<summary>` accordion. Single-open accordion script. Used: pricing, events |

**HeroBlock Variants:**

| `variant` | Sub-component | Use |
|-----------|--------------|-----|
| `split-grid` | `hero/HeroSplitGrid.astro` | Home pages only |
| `cover` | `hero/HeroCover.astro` | All interior pages |
| `minimal` | `hero/HeroMinimal.astro` | Reserved (not yet used) |

---

## Content Schema

**Page-Level Frontmatter:**

```yaml
title: string            # <title> tag
seoDescription: string   # max 160 chars, <meta name="description">
ogImage: string          # optional, OG image path
translationSlug: string  # slug of equivalent page in other language
blocks: []               # array of block objects
```

**Block Fields (key fields — see `src/content/config.ts` for full schema):**

| Block | Key Fields |
|-------|------------|
| `HeroBlock` | `_template`, `name` *(optional)*, `variant`, `headline`, `subheadline`, `subBodyText`, `backgroundImage`, `ctaLabel`, `ctaUrl` |
| `ContentBlock` | `_template`, `name` *(optional)*, `body` |
| `BookingBlock` | `_template`, `name` *(optional)*, `enabled`, `bookingUrl`, `label` |
| `FeatureGridBlock` | `_template`, `name` *(optional)*, `items[]` {`icon`, `title`, `description`} |
| `FullBleedBlock` | `_template`, `name` *(optional)*, `image`, `altText`, `minHeight`, `overlayOpacity`, `headline`, `subtext` |
| `InteractiveListBlock` | `_template`, `name` *(optional)*, `title`, `items[]` {`label`, `description`, `image`, `imageAlt`} |
| `FaqBlock` | `_template`, `name` *(optional)*, `title`, `questions[]` {`question`, `answer`} |

> **Note:** The `name` field is informational metadata only. It has no runtime rendering effect. It exists purely for agent/human referencing. See [Section Pattern Language](#section-pattern-language) below.

---

## Section Pattern Language

Every block in every page frontmatter has a `name` field — a stable, human-readable handle used to reference specific sections precisely.

**How to reference a section:**
> "On the `home` page, in the `philosophy-intro` block, update the body text to…"
> "Across all `*-hero` blocks using the `cover` variant, change the overlay opacity to…"

**Finding a block by name:**
```bash
grep -r "name: philosophy-intro" src/content/
```

**Canonical reference:** See `plans/page-section-map.md` for the full page × section map.

**Naming conventions:**
- `[page]-hero` — HeroBlock on a given page (e.g., `home-hero`, `studio-hero`)
- `[descriptor]-intro` — Opening ContentBlock (e.g., `philosophy-intro`, `wellness-intro`)
- `[descriptor]-grid` — FeatureGridBlock (e.g., `pillars-grid`, `classes-grid`)
- `[descriptor]-list` — InteractiveListBlock (e.g., `offerings-list`, `studio-spaces-list`)
- `[descriptor]-faq` — FaqBlock (e.g., `pricing-faq`, `events-faq`)
- `[descriptor]-booking-cta` — BookingBlock (e.g., `classes-booking-cta`)
- Global zones: `site-header` (Header.astro) · `site-footer` (Footer.astro)

---

## bsport Integration

**Company ID:** `5082` — hardcoded in all integration components.

**CDN:** `https://cdn.bsport.io/scripts/widget.js`

**Prerequisite:** `BaseLayout.astro` must have `<slot name="head" />` inside `<head>` — all SDK widgets inject the CDN loader through this slot.

**Widget Components:**

| Component | `widgetType` | `dialogMode` | Typical Page |
|-----------|-------------|--------------|--------------|
| `BsportCalendar.astro` | `"calendar"` | 3 (inline) | Kurse/Classes |
| `BsportSubscription.astro` | `"subscription"` | 3 (inline) | Preise/Pricing |
| `BsportPasses.astro` | `"pass"` | 3 (inline) | Preise/Pricing |
| `BsportWorkshop.astro` | `"workshop"` | 3 (inline) | Events |
| `BsportLeadCapture.astro` | `"newsletterV2"` | 0 (popup) | Any |
| `BsportLoginButton.astro` | `"loginButton"` | 0 (popup) | Header |
| `BsportShop.astro` | `"shop"` | 3 (inline) | — |
| `BsportWidget.astro` | prop | prop | Catch-all |

**Dialog Modes:**
- `3` = inline embed
- `0` = popup trigger button

---

## GSAP Rules

**Allowed Use Cases:**
- Hero headline / subheadline: staggered fade-in translateY on page load
- Feature grid items: staggered fade-in on scroll (IntersectionObserver)
- `InteractiveListBlock`: hover-image `gsap.fromTo()` opacity + translateY

**Constraints:**
- No ScrollTrigger
- No parallax
- No pinning
- All GSAP calls wrapped in `prefers-reduced-motion` check
- Use `astro:after-swap` listener for view transitions compatibility

**Script Pattern:**
```astro
<script>
import gsap from 'gsap';
// GSAP code here
</script>
```
(Not a React island — inline script tag)

---

## Locale Pattern for Components

Any component with hardcoded user-visible strings:

```astro
const locale = Astro.currentLocale ?? 'de';
const isDE = locale.startsWith('de');
const label = isDE ? 'Deutsch' : 'English';
```

Content strings (labels, body text) come from frontmatter — no localisation logic needed in the component.

---

## Environment Variables

```bash
# Frontend / Shared
PUBLIC_GAS_ENDPOINT=      # Google Apps Script email capture endpoint
PUBLIC_SITE_URL=https://eos-club.de

# TinaCMS Self-Hosted (Server-side)
TINA_SELF_HOSTED=true
TINA_ADMIN_PASSWORD_HASH= # bcrypt hash of CMS password
TINA_JWT_SECRET=          # Secret for JWT signing
TINA_JWT_EXPIRY=7d
GITHUB_PERSONAL_ACCESS_TOKEN= # For backend git push

# Legacy / Alternative Deploy
WEBHOOK_SECRET=           # GitHub webhook HMAC secret
DEPLOY_WEB_ROOT=/var/www/eos-club
```

---

## Deployment

| Aspect | Details |
|--------|---------|
| Build | `pnpm build` → `dist/` |
| Hosting | DigitalOcean Droplet (Docker) |
| CMS Backend | Self-hosted Express server (`tina-backend/`) |
| Trigger | GitHub Actions on push to `main` |
| Mechanism | SSH → git pull → pnpm build → rsync to nginx web root |
| Process | Docker Compose (services: `eosclub_tina`, `nginx`) |

See [`plans/deployment-tinacms-plan.md`](plans/deployment-tinacms-plan.md) for full architecture.
