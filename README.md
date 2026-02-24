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

## Documentation

- [MVP Specification](plans/SPEC_MVP_v2.md)
- [Orchestrator Task Plan](plans/ORCHESTRATOR_TASKS_MVP.md)

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `PUBLIC_GAS_ENDPOINT` — Google Apps Script URL for email capture
- `TINA_PUBLIC_CLIENT_ID` — TinaCMS cloud client ID (optional for local dev)
- `TINA_TOKEN` — TinaCMS token (optional for local dev)

> bsport widgets require no environment variables — the company ID is hardcoded in each component (`5082`).
