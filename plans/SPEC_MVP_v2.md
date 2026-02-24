# SPECIFICATION: EOS CLUB Website (MVP) — v2

**Project:** EOS CLUB Wellness Studio Website
**Stack:** Astro v4+, TinaCMS, TailwindCSS, GSAP
**Language:** German (Primary), English (Secondary)
**Deployment:** Static (SSG) — Self-hosted server via GitHub Webhook listener
**Repository Strategy:** Git-backed content (Markdown)
**Design System Source of Truth:** `design_system.html` (V7, Feb 2026)

## 1. Core Architecture

### Tech Stack

| Layer | Tool | Version |
|---|---|---|
| Framework | Astro | v4+ |
| Rendering | SSG (`output: 'static'`) | — |
| Styling | TailwindCSS | v3+ |
| Animation | GSAP | v3 (scoped — see §7) |
| CMS | TinaCMS | Latest |
| Booking / Member Services | bsport | JS SDK widget suite (see §5) |
| Image Opt | `@astrojs/image` | Latest |
| Sitemap | `@astrojs/sitemap` | Latest |

### Directory Structure

```text
/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.astro
│   │   │   ├── Footer.astro
│   │   │   └── LangSwitch.astro
│   │   ├── blocks/
│   │   │   ├── HeroBlock.astro
│   │   │   ├── ContentBlock.astro
│   │   │   ├── BookingBlock.astro
│   │   │   └── FeatureGridBlock.astro
│   │   ├── integrations/
│   │   │   ├── BsportCalendar.astro
│   │   │   ├── BsportSubscription.astro
│   │   │   ├── BsportPasses.astro
│   │   │   ├── BsportWorkshop.astro
│   │   │   ├── BsportLeadCapture.astro
│   │   │   ├── BsportLoginButton.astro
│   │   │   ├── BsportShop.astro
│   │   │   └── BsportWidget.astro
│   │   └── EmailSignup.astro
│   ├── content/
│   │   └── pages/
│   │       ├── de/
│   │       │   ├── home.md
│   │       │   ├── studio.md
│   │       │   ├── kurse.md
│   │       │   ├── preise.md
│   │       │   ├── events.md
│   │       │   ├── wellness.md
│   │       │   ├── team.md
│   │       │   └── kontakt.md
│   │       └── en/
│   │           ├── home.md
│   │           ├── studio.md
│   │           ├── classes.md
│   │           ├── pricing.md
│   │           ├── events.md
│   │           ├── wellness.md
│   │           ├── team.md
│   │           └── contact.md
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── [...slug].astro       # DE catch-all (no /de prefix)
│   │   ├── 404.astro             # DE 404
│   │   └── en/
│   │       ├── [...slug].astro   # EN catch-all
│   │       └── 404.astro         # EN 404
│   └── styles/
│       └── global.css
├── public/
│   ├── fonts/                    # Self-hosted fonts (if any)
│   └── assets/ → migrated from root /assets/
├── tina/
│   └── config.ts
├── tailwind.config.mjs
├── astro.config.mjs
├── .env.example
└── deploy/
    └── webhook-listener.js   # GitHub webhook → build + deploy trigger
```

---

## 2. Internationalization (i18n) & Routing

**Requirement:** Clean URLs. German is the root locale. No `/de` prefix.

| Language | URL Pattern | Example |
|---|---|---|
| German (default) | `/{slug}` | `https://eos-club.de/kontakt` |
| English | `/en/{slug}` | `https://eos-club.de/en/contact` |

### Astro Config (`astro.config.mjs`)

```js
i18n: {
  defaultLocale: "de",
  locales: ["de", "en"],
  routing: { prefixDefaultLocale: false }
}
```

### Content File Naming & Slug Mapping

Content files live at `src/content/pages/{lang}/{slug}.md`.
The `slug` used in the URL is the filename (without extension).

The following **DE ↔ EN slug pairs** are defined for the MVP (7 nav pages + contact):

| DE Filename / URL slug | EN Filename / URL slug | Nav Label (DE) | Nav Label (EN) |
|---|---|---|---|
| `home.md` → `/home` | `home.md` → `/en/home` | Home | Home |
| `studio.md` → `/studio` | `studio.md` → `/en/studio` | Studio | Studio |
| `kurse.md` → `/kurse` | `classes.md` → `/en/classes` | Kurse | Classes |
| `preise.md` → `/preise` | `pricing.md` → `/en/pricing` | Preise | Pricing |
| `events.md` → `/events` | `events.md` → `/en/events` | Events | Events |
| `wellness.md` → `/wellness` | `wellness.md` → `/en/wellness` | Wellness | Wellness |
| `team.md` → `/team` | `team.md` → `/en/team` | Team | Team |
| `kontakt.md` → `/kontakt` | `contact.md` → `/en/contact` | — (Footer only) | — (Footer only) |

> **Impressum:** A static German-only legal page at `/impressum`. No EN equivalent required. Create as `src/pages/impressum.astro` (not a content collection page — static Astro page is sufficient). Link in Footer only.

> **Root redirect:** `/` should redirect to `/home` (or set `home.md` slug as `''` if Astro routing supports it — evaluate at implementation time).

### Language Switcher Logic

The `LangSwitch.astro` component must use the `translationSlug` frontmatter field (§3) — **not** a naive slug swap — to navigate between language equivalents. Logic:

- If current page is DE (`/kursplan`), read `translationSlug` from frontmatter → render link to `/en/{translationSlug}`.
- If current page is EN (`/en/schedule`), read `translationSlug` → render link to `/{translationSlug}`.
- If `translationSlug` is absent, fall back to the homepage in the target language.

### `hreflang` Meta Tags

`BaseLayout.astro` must emit `hreflang` link tags for every page:

```html
<link rel="alternate" hreflang="de" href="https://eos-club.de/{deSlug}" />
<link rel="alternate" hreflang="en" href="https://eos-club.de/en/{enSlug}" />
<link rel="alternate" hreflang="x-default" href="https://eos-club.de/{deSlug}" />
```

---

## 3. Data Schema (TinaCMS)

**Collection:** `pages`
**Format:** `.md`
**Path:** `src/content/pages/{de|en}/{slug}.md`

### Frontmatter Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | ✓ | Page title (used in `<title>` tag) |
| `seoDescription` | text | ✓ | Max 160 chars. Used in `<meta name="description">`. |
| `ogImage` | image | — | Open Graph image. Falls back to site default if absent. |
| `translationSlug` | string | — | The slug of the equivalent page in the other language. See §2. |
| `blocks` | object[] | — | Stream field (see Block Types below). |

> **Removed from v1:** The `language` field has been removed. Language is determined by the file path (`de/` or `en/`). Adding it as a manually-set field creates a risk of mismatch errors.

### Block Types (Stream Field)

#### `HeroBlock`
| Field | Type | Required |
|---|---|---|
| `headline` | string | ✓ |
| `subheadline` | string | — |
| `backgroundImage` | image | — |
| `ctaLabel` | string | — |
| `ctaUrl` | string | — |

#### `ContentBlock`
| Field | Type | Required |
|---|---|---|
| `body` | rich-text (markdown) | ✓ |

#### `BookingBlock`
| Field | Type | Required | Notes |
|---|---|---|---|
| `enabled` | boolean | ✓ | Toggle visibility |
| `bookingUrl` | string | ✓ | bsport booking URL (opens in new tab) |
| `label` | string | — | Optional heading above the CTA (e.g., "Jetzt buchen") |

> **MVP Implementation:** bsport integration is a CTA link that opens in a new tab. Full iframe/API integration deferred to future phase.

> **Changed from v1:** `BookingWidget` was a single boolean. Adding `widgetSrc` allows the editor to point to different Eversports venues/widgets without a code change.

#### `FeatureGridBlock`
| Field | Type | Required |
|---|---|---|
| `items` | list | ✓ |
| `items[].icon` | string | — | Feather icon name |
| `items[].title` | string | ✓ |
| `items[].description` | text | — |

---

## 4. Design System Tokens (Explicit)

> These are to be written directly into `tailwind.config.mjs`. Source: `design_system.html` V7.

### Colors

```js
colors: {
  eos: {
    base:     '#F9F9F7',  // 60% — Mineral White (dominant background)
    contrast: '#2F3A40',  // 30% — Deep Slate (secondary / dark elements)
    accent:   '#FF2E00',  // 10% — Infrared Red (CTA, active, headings)
    subtle:   '#E6E5E0',  // Warm Concrete (secondary backgrounds)
    text:     '#1F2933',  // Night Slate (body text — never pure black)
    zen:      '#09090B',  // Zen Black (inputs, dark surfaces)
  }
}
```

### Gradients (backgroundImage)

```js
backgroundImage: {
  'accent-gradient': 'linear-gradient(135deg, #FF2E00 0%, #FF5C00 100%)',
  'heat-gradient':   'linear-gradient(135deg, #E9B24A 0%, #E8742C 35%, #E6534A 60%, #E24676 78%, #C74A8E 100%)',
  'wash-gradient':   'linear-gradient(135deg, #F2F4C9 0%, #FBF3D6 45%, #F8E1D5 100%)',
}
```

### Typography

```js
fontFamily: {
  serif: ['Merriweather', 'serif'],  // Display / headings — confirmed font
  sans:  ['Geist Sans', 'Inter', 'sans-serif'],     // Body / UI
}
```

### Font Strategy

- **Merriweather**: Confirmed display/heading font (Feb 2026 decision — Capitolina dropped). Load via Google Fonts `<link>` in `BaseLayout.astro`. Weights: 300, 400, 700, 900. No self-hosted font files needed.
- **Geist Sans**: Load via `npm install geist`. Self-host for production.

## 5. bsport Widget Integration

All bsport widgets live at `src/components/integrations/`. Each component wraps the bsport JS SDK (`https://cdn.bsport.io/scripts/widget.js`) and is self-contained.

**Company ID:** `5082` (EOS CLUB / Tektonik 23) — hardcoded in each component.

**Prerequisite:** `BaseLayout.astro` must declare `<slot name="head" />` inside its `<head>` — all JS SDK widgets inject the CDN loader through this slot.

### Widget Component Reference

| Component | `widgetType` | `dialogMode` | Config Keys | Verified |
|---|---|---|---|---|
| `BsportCalendar.astro` | `"calendar"` | 3 (inline) | `coaches`, `establishments`, `metaActivities`, `levels`, `variant`, `groupSessionByPeriod` | ✓ |
| `BsportSubscription.astro` | `"subscription"` | 3 (inline) | _(none)_ | ✓ |
| `BsportPasses.astro` | `"pass"` | 3 (inline) | `paymentPackCategories[]`, `privatePassCategories[]` | ✓ |
| `BsportWorkshop.astro` | `"workshop"` | 3 (inline) | `coaches`, `establishments`, `metaActivities`, `levels` | ✓ |
| `BsportLeadCapture.astro` | `"newsletterV2"` | 0 (popup) | `fieldsType`, `showSubtitle`, `showSuccessTitle`, `showSuccessText` | ✓ |
| `BsportLoginButton.astro` | `"loginButton"` | 0 (popup) | `openMemberProfile` | ✓ |
| `BsportShop.astro` | `"shop"` | 3 (inline) | _(none — unverified)_ | ⚠ |
| `BsportWidget.astro` | prop | prop | catch-all | — |

### `dialogMode` Values

- `3` — Inline embed. Widget renders directly in the page DOM at the mount target `<div>`.
- `0` — Popup trigger. Widget renders a button; interaction opens a bsport modal overlay.

### `BsportLeadCapture.astro` — `fieldsType` Options

| Value | Fields shown |
|---|---|
| `"fullNameAndEmail"` | First name, last name, email |
| `"firstNameAndEmail"` | First name, email |
| `"emailOnly"` | Email only *(inferred — verify with bsport)* |

### BookingBlock (Legacy CTA)

`src/components/blocks/BookingBlock.astro` remains in place as a simple CTA link to bsport (opens in new tab). It is the MVP booking entry point. The widget components above are richer integrations for specific pages (Kurse, Preise, Events, etc.).

### BaseLayout Slot Requirement

Add inside `<head>` of `BaseLayout.astro`:

```astro
<slot name="head" />
```

Without this, the bsport CDN loader script will not inject into the document and all JS SDK widgets will silently fail to mount.

---

## 6. SEO & Meta Infrastructure

All SEO meta is rendered in `BaseLayout.astro` and driven by frontmatter.

### Required Meta Per Page

```html
<title>{title} | EOS CLUB</title>
<meta name="description" content={seoDescription} />
<meta property="og:title" content={title} />
<meta property="og:description" content={seoDescription} />
<meta property="og:image" content={ogImage or defaultOgImage} />
<meta property="og:type" content="website" />
<link rel="canonical" href={canonicalUrl} />
<link rel="alternate" hreflang="de" href={deUrl} />
<link rel="alternate" hreflang="en" href={enUrl} />
<link rel="alternate" hreflang="x-default" href={deUrl} />
```

### Sitemap

- Install `@astrojs/sitemap`.
- Configure `site: 'https://eos-club.de'` in `astro.config.mjs`.
- Auto-generated at build time.

### robots.txt

Place at `public/robots.txt`:

```
User-agent: *
Allow: /
Sitemap: https://eos-club.de/sitemap-index.xml
```

---

## 7. GSAP Animation Scope (Constrained)

**Principle:** Animations must feel like "stable dynamics" — smooth, unhurried, grounded. (See style_guide.md §5.)

GSAP is **only** used for the following explicitly scoped cases:

| Element | Animation | Duration | Trigger |
|---|---|---|---|
| Hero headline | Staggered fade-in (translateY: 20px → 0, opacity 0 → 1) | 600ms | On page load |
| Hero subheadline | Same, delayed 150ms after headline | 600ms | On page load |
| Feature grid items | Staggered fade-in, 80ms stagger per item | 400ms | On scroll (IntersectionObserver) |
| Navigation links | Color shift on hover (handled by Tailwind `transition-colors`) | 300ms | CSS only |

> **No GSAP ScrollTrigger, no parallax, no pinning.** CSS `transition` handles all hover states. If in doubt, omit animation rather than add.
> Respect `prefers-reduced-motion`: Wrap all GSAP calls in a media query check.

---

## 8. Image Strategy

- Use Astro's built-in `<Image />` component from `astro:assets` for all images.
- Source images live in `src/assets/` (migrated from root `/assets/`).
- All images used in TinaCMS (hero backgrounds, OG images) may be uploaded to TinaCMS Media → stored in `public/uploads/`.
- Apply `loading="lazy"` to all below-the-fold images; `loading="eager"` for hero images only.

---

## 9. Email Capture Strategy

The pre-launch `index.html` uses Google Apps Script for email collection. For the Astro MVP:

**Option A (Recommended for MVP):** Keep the Google Sheets endpoint. Create a lightweight `EmailSignup.astro` island component that POSTs to the existing Web App URL (stored in `.env` as `PUBLIC_GAS_ENDPOINT`). Reuse the existing `google-apps-script.js` backend.

> **Implementation note:** The Web App URL must be stored in `.env.local` and accessed as `import.meta.env.PUBLIC_GAS_ENDPOINT`. Never hard-coded.

---

## 10. Environment Variables

Create `.env.example` at project root:

```bash
# TinaCMS (required for TinaCloud production mode)
TINA_PUBLIC_CLIENT_ID=
TINA_TOKEN=

# Email capture (Google Apps Script endpoint)
PUBLIC_GAS_ENDPOINT=

# Site URL (for canonical/OG tags)
PUBLIC_SITE_URL=https://eos-club.de

# GitHub Webhook (server-side only — do not expose in frontend)
WEBHOOK_SECRET=

# Build output web root (server-side only)
DEPLOY_WEB_ROOT=/var/www/eos-club
```

---

## 11. Performance & Accessibility Targets

| Metric | Target |
|---|---|
| Lighthouse Performance | ≥ 90 (mobile) |
| Lighthouse Accessibility | ≥ 95 |
| LCP | < 2.5s |
| CLS | < 0.1 |
| WCAG Compliance | 2.1 AA |
| `prefers-reduced-motion` | Respected in all animations |
| Keyboard Navigation | Full site navigable by keyboard |

---

## 12. Phase 1 Tasks (Agent Execution Order)

> Time estimates removed. Tasks are ordered by dependency.

### Group A — Project Scaffold

- [ ] Initialize new Astro project in repo root using empty template.
- [ ] Install dependencies: `@astrojs/tailwind`, `@astrojs/sitemap`, `@astrojs/image`, `tinacms`, `@tinacms/cli`, `gsap`.
- [ ] Configure `astro.config.mjs`: i18n settings, sitemap integration, image integration, `site` URL.
- [ ] Create `tailwind.config.mjs` with all EOS design tokens from §4 (colors, gradients, fontFamily).
- [ ] Create `.env.example` with all variables from §10.
- [ ] Create `public/robots.txt`.
- [ ] Migrate root `assets/` directory to `public/assets/` in the Astro project.

### Group B — Layout & Common Components

- [ ] Create `src/styles/global.css`: base body/heading styles per §4. Geist Sans loaded via `@import "geist/sans"`. Merriweather loaded via Google Fonts `<link>` in `BaseLayout.astro`.
- [ ] Create `src/layouts/BaseLayout.astro`: HTML shell with full SEO meta block from §6, `hreflang` tags, font links.
- [ ] Create `src/components/common/Header.astro`: Logo, navigation links (7 pages: Home, Studio, Kurse, Preise, Events, Wellness, Team), mobile hamburger menu (CSS-driven, no JS framework). Nav links must use `Astro.currentLocale` to generate correct language-prefixed URLs.
- [ ] Create `src/components/common/Footer.astro`: Studio address, social links, Impressum link, Privacy/Terms links, Copyright, language strip.
- [ ] Create `src/pages/impressum.astro`: Static German-only legal page. Linked from Footer. No TinaCMS collection needed — hardcoded or inline Markdown.
- [ ] Create `src/components/common/LangSwitch.astro`: Reads `translationSlug` from page frontmatter, outputs links to DE/EN equivalents per §2 logic.

### Group C — Block Components

- [ ] Create `src/components/blocks/HeroBlock.astro`: Renders HeroBlock fields. GSAP entry animation per §7.
- [ ] Create `src/components/blocks/ContentBlock.astro`: Renders rich text / Markdown body.
- [ ] Create `src/components/blocks/BookingBlock.astro`: CTA link to bsport booking URL (MVP). Toggles visibility from `enabled` field.
- [ ] Create `src/components/blocks/FeatureGridBlock.astro`: Renders icon/title/description grid. GSAP scroll animation per §7.
- [ ] ~~`EversportsWidget.astro`~~ — replaced by bsport widget suite in `src/components/integrations/` (see §5).

### Group D — Routing

- [ ] Create `src/pages/[...slug].astro`: `getStaticPaths` reads collection, filters by `de/` path prefix, maps slug from filename.
- [ ] Create `src/pages/en/[...slug].astro`: Same pattern, filters by `en/` path prefix.
- [ ] Create `src/pages/impressum.astro`: Static Impressum page (DE only, no i18n routing needed).
- [ ] Create `src/pages/404.astro`: German 404 page with navigation back to home.
- [ ] Create `src/pages/en/404.astro`: English 404 page.

### Group E — CMS Wiring

- [ ] Define TinaCMS schema in `tina/config.ts` per §3 (all fields, all block types).
- [ ] Create placeholder content for all 16 pages (8 DE + 8 EN) per the slug mapping table in §2.
- [ ] Set `translationSlug` correctly in each file linking DE ↔ EN pairs.
- [ ] Verify local editing: run `npx tinacms dev` and confirm changes persist to `.md` files.

### Group F — Deployment Infrastructure

- [ ] Set up GitHub webhook on the repository (push event to `main` branch).
- [ ] Create `deploy/webhook-listener.js`: a lightweight Node.js HTTP server that:
  - Verifies the GitHub HMAC signature (`X-Hub-Signature-256`).
  - On verified push to `main`: runs `git pull && npm run build`.
  - Copies/serves the built `dist/` directory to the web root.
- [ ] Configure the webhook listener as a persistent process on the server (systemd service or PM2).
- [ ] Add `WEBHOOK_SECRET` to `.env.example` and server environment.
- [ ] Document the server setup steps in `deploy/README.md`.

### Group G — QA Checks

- [ ] Verify all 16 pages render without console errors.
- [ ] Verify language switcher navigates correctly between all 8 DE/EN pairs.
- [ ] Verify Impressum page renders at `/impressum` and is linked from Footer.
- [ ] Verify `hreflang` tags are output correctly on all pages.
- [ ] Run Lighthouse audit on homepage (mobile) — confirm Performance ≥ 90, Accessibility ≥ 95.
- [ ] Verify `prefers-reduced-motion` disables GSAP animations.
- [ ] Validate sitemap is generated at `/sitemap-index.xml`.
- [ ] Trigger a test push to `main` and confirm webhook listener builds and deploys successfully.

> **Note:** The deployment architecture has been updated to use Docker with self-hosted TinaCMS. See `plans/ORCHESTRATOR_TASKS_MVP.md` Group G for current implementation plan.

---

## 13. Deployment Architecture (Self-Hosted)

The site is deployed to a self-hosted server. There is no Vercel or Netlify involved.

### Flow

```
Developer / Letta Agent
        │
        ▼
  git push → GitHub (main branch)
        │
        ▼ (GitHub Webhook — push event)
        │
        ▼
  Server: webhook-listener.js
  (Node.js HTTP server, port configurable)
        │
        ├─ Verify HMAC signature
        ├─ git pull origin main
        ├─ npm run build
        └─ Serve dist/ from web root
```

### Webhook Listener Requirements

- Language: Node.js (no framework dependency).
- Listens on a configurable port (default: 9000).
- Validates `X-Hub-Signature-256` header using `WEBHOOK_SECRET` env var.
- Runs `git pull && npm ci && npm run build` as a child process.
- Logs output to a file for debugging.
- Runs as a persistent process via **PM2** or **systemd**.

### Environment Variables (Server-side additions)

```bash
# GitHub Webhook
WEBHOOK_SECRET=          # Set in GitHub repo → Settings → Webhooks

# Build output path (where dist/ is served from)
DEPLOY_WEB_ROOT=/var/www/eos-club
```

---

## 14. Future AI Agent Context (Letta)

*Persistent notes for the Letta agent operating on this repo:*

- **Content files:** All website content is Markdown at `src/content/pages/{lang}/{slug}.md`. Edit the correct language file based on user intent.
- **Update mechanism:** Commit changed `.md` files to GitHub main branch → webhook listener on the server auto-builds and deploys.
- **Slug mapping awareness:** When editing a DE page, the paired EN page is identified by the `translationSlug` field in frontmatter. Always check if a paired page needs a parallel update.
- **Design constraints:** Never use `#FF2E00` (Infrared Red) for body text — only for accents, headings, and interactive elements. Never use pure black `#000000`. See §4 for full token reference.
- **Navigation pages:** There are 7 nav pages (Home, Studio, Kurse/Classes, Preise/Pricing, Events, Wellness, Team) plus Kontakt/Contact in the footer. Impressum is a static DE-only page — do not create an EN equivalent.
- **Block structure:** Each page's `blocks` array drives the page layout. To add a section, append a new block object. Block types are: `HeroBlock`, `ContentBlock`, `BookingBlock`, `FeatureGridBlock`.
- **Language identifier:** Language is determined by the file path (`de/` or `en/`) NOT a frontmatter field.
- **Booking (MVP):** The bsport booking URL is configured via the `bookingUrl` field in BookingBlock. For MVP, this renders a CTA link. Do not modify the BookingBlock component code.
- **bsport widgets:** Full widget components are in `src/components/integrations/`. Use `BsportCalendar` on the Kurse page, `BsportPasses`/`BsportSubscription` on the Preise page, `BsportWorkshop` on the Events page, `BsportLoginButton` in the Header. `BsportLeadCapture` can replace `EmailSignup.astro` once bsport is confirmed as CRM. All require `<slot name="head" />` in `BaseLayout.astro`. Company ID is `5082`.
- **Deployment:** Push to `main` triggers the server webhook listener. Do not reference Vercel or Netlify anywhere.
