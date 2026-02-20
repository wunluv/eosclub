# EOS CLUB Website

Bilingual (DE/EN) Astro website for EOS CLUB wellness studio in Berlin.

## Tech Stack

- **Framework:** Astro v5 (SSG)
- **CMS:** TinaCMS (self-hosted planned, local dev ready)
- **Styling:** TailwindCSS v4 + EOS design tokens
- **Animation:** GSAP (scoped, respects prefers-reduced-motion)
- **Booking:** bsport (CTA link integration)

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
│   └── EmailSignup.astro # Email capture form
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

## Documentation

- [MVP Specification](plans/SPEC_MVP_v2.md)
- [Orchestrator Task Plan](plans/ORCHESTRATOR_TASKS_MVP.md)

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `PUBLIC_GAS_ENDPOINT` — Google Apps Script URL for email capture
- `TINA_PUBLIC_CLIENT_ID` — TinaCMS cloud client ID (optional for local dev)
- `TINA_TOKEN` — TinaCMS token (optional for local dev)
