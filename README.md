# EOS CLUB Website

Bilingual (DE/EN) Astro website for EOS CLUB wellness studio in Berlin.

## Tech Stack

- **Framework:** Astro v5 (SSG)
- **CMS:** TinaCMS (self-hosted planned, local dev ready)
- **Styling:** TailwindCSS v4 + EOS design tokens
- **Animation:** GSAP (scoped, respects prefers-reduced-motion)
- **Booking / Member Services:** bsport JS SDK widget suite

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Start TinaCMS admin (separate terminal)
npx tinacms dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## URLs (Development)

| URL | Description |
|-----|-------------|
| http://localhost:4321/ | Site root (redirects to /home) |
| http://localhost:4321/home | German homepage |
| http://localhost:4321/en/home | English homepage |
| http://localhost:4321/admin/index.html | TinaCMS editor |

## Project Structure

```
src/
├── components/
│   ├── blocks/           # HeroBlock, ContentBlock, BookingBlock, FeatureGridBlock
│   ├── common/           # Header, Footer, LangSwitch
│   ├── integrations/     # bsport widget components (see §bsport below)
│   └── EmailSignup.astro # Email capture form (Google Apps Script — MVP)
├── content/pages/
│   ├── de/               # 8 German content files
│   └── en/               # 8 English content files
├── layouts/
│   └── BaseLayout.astro  # HTML shell with SEO & hreflang
├── pages/
│   ├── [...slug].astro   # German dynamic routes
│   ├── en/[...slug].astro # English dynamic routes
│   ├── impressum.astro   # German legal page
│   └── 404.astro         # Error pages
└── styles/
    └── global.css        # Tailwind + Geist Sans
```

## bsport Widget Integration

All bsport widgets live in `src/components/integrations/`. Each is a self-contained Astro component using the bsport JS SDK (`dialogMode: 3` inline, unless noted).

**Prerequisite:** `BaseLayout.astro` must declare `<slot name="head" />` inside its `<head>` element — all JS SDK widgets inject the CDN loader script through this slot.

| Component | Widget Type | Mode | Purpose |
|---|---|---|---|
| `BsportCalendar.astro` | `"calendar"` | inline | Class schedule / booking calendar |
| `BsportSubscription.astro` | `"subscription"` | inline | Membership subscriptions |
| `BsportPasses.astro` | `"pass"` | inline | Day passes & packages |
| `BsportWorkshop.astro` | `"workshop"` | inline | Workshops & special events |
| `BsportLeadCapture.astro` | `"newsletterV2"` | popup | Lead acquisition / contact form |
| `BsportLoginButton.astro` | `"loginButton"` | popup | Member login button |
| `BsportShop.astro` | `"shop"` | inline | Shop / merchandise *(unverified)* |
| `BsportWidget.astro` | configurable prop | configurable | General-purpose catch-all |

> Company ID for all widgets: `5082` (EOS CLUB / Tektonik 23).
> All widget element IDs are scoped per component — safe to use multiple widgets on the same page.

## Block System

The site uses a **dispatcher pattern** for content blocks: thin wrapper components that delegate to variant-specific sub-components based on frontmatter fields. This enables flexible page composition through TinaCMS while keeping components maintainable.

Every block has a `name` field (e.g., `name: philosophy-intro`) — a stable, language-agnostic identifier for precise agent and human referencing. See [Page Section Map](plans/page-section-map.md) for the canonical name registry.

### Architecture

- **Dispatcher blocks** (e.g., [`HeroBlock.astro`](src/components/blocks/HeroBlock.astro)) read a `variant` field from frontmatter and render the appropriate sub-component
- **Sub-components** live in subdirectories (e.g., [`src/components/blocks/hero/`](src/components/blocks/hero/)) and handle actual rendering
- All blocks are registered in **two places**:
  - [`src/content/config.ts`](src/content/config.ts) - Zod schemas for content validation
  - [`tina/config.ts`](tina/config.ts) - CMS UI templates for editors
- Blocks are dispatched in [`src/pages/[...slug].astro`](src/pages/[...slug].astro) and [`src/pages/index.astro`](src/pages/index.astro)

### Available Blocks

| Block | Description |
|-------|-------------|
| [`HeroBlock.astro`](src/components/blocks/HeroBlock.astro) | Dispatcher for hero variants (see below) |
| [`ContentBlock.astro`](src/components/blocks/ContentBlock.astro) | Simple rich-text content section |
| [`FeatureGridBlock.astro`](src/components/blocks/FeatureGridBlock.astro) | Grid of feature cards with icons |
| [`FullBleedBlock.astro`](src/components/blocks/FullBleedBlock.astro) | Edge-to-edge full-width image section (breaks out of container) |
| [`InteractiveListBlock.astro`](src/components/blocks/InteractiveListBlock.astro) | List with GSAP hover-image reveal (desktop) / static fallback (mobile) |
| [`FaqBlock.astro`](src/components/blocks/FaqBlock.astro) | Progressive-enhancement accordion using native `<details>`/`<summary>` |
| [`BookingBlock.astro`](src/components/blocks/BookingBlock.astro) | Wrapper for bsport booking widgets |

### HeroBlock Variants

| Variant | Component | Use Case |
|---------|-----------|----------|
| `split-grid` | [`HeroSplitGrid.astro`](src/components/blocks/hero/HeroSplitGrid.astro) | Left text + right 2×2 image grid (home page default) |
| `cover` | [`HeroCover.astro`](src/components/blocks/hero/HeroCover.astro) | Full-width background image with gradient overlay, CTA lower-left (interior pages) |
| `minimal` | [`HeroMinimal.astro`](src/components/blocks/hero/HeroMinimal.astro) | Centered text only, no image (reserved for future use) |

### Adding a New Block

1. Create the component in `src/components/blocks/`
2. Add Zod schema to [`src/content/config.ts`](src/content/config.ts)
3. Add TinaCMS template to [`tina/config.ts`](tina/config.ts)
4. Add dispatch logic in [`src/pages/[...slug].astro`](src/pages/[...slug].astro) and/or [`src/pages/index.astro`](src/pages/index.astro)
5. Use `Astro.currentLocale` for any hardcoded string fallbacks

### Locale Support

All blocks use `Astro.currentLocale` for hardcoded string fallbacks. Content is stored in separate locale directories:

- `src/content/pages/de/` - German content
- `src/content/pages/en/` - English content

## Documentation

- [MVP Specification](plans/SPEC_MVP_v2.md)
- [Orchestrator Task Plan](plans/ORCHESTRATOR_TASKS_MVP.md)
- [Page Section Map](plans/page-section-map.md) — Canonical pattern language for referencing page sections

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `PUBLIC_GAS_ENDPOINT` — Google Apps Script URL for email capture
- `TINA_PUBLIC_CLIENT_ID` — TinaCMS cloud client ID (optional for local dev)
- `TINA_TOKEN` — TinaCMS token (optional for local dev)

> bsport widgets require no environment variables — the company ID is hardcoded in each component (`5082`).
