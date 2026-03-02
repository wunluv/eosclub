# SPECIFICATION: EOS CLUB Website (MVP) — v3

**Project:** EOS CLUB Wellness Studio Website
**Stack:** Astro v5+, Keystatic CMS, TailwindCSS, GSAP
**Language:** German (Primary), English (Secondary)
**Deployment:** Static (SSG) — Self-hosted NGINX server
**Repository Strategy:** Git-backed content (Markdown)
**Design System Source of Truth:** `design_system.html` (V7, Feb 2026)

## 1. Core Architecture

### Tech Stack

| Layer | Tool | Version |
|---|---|---|
| Framework | Astro | v5 |
| Rendering | SSG (`output: 'static'`) | — |
| Styling | TailwindCSS | v3 |
| Animation | GSAP | v3 (scoped — see §7) |
| CMS | Keystatic | Latest (Git-based) |
| Booking / Member Services | bsport | JS SDK widget suite (see §5) |
| Image Opt | Astro Assets | Latest |
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
│   └── assets/
├── keystatic.config.ts           # Keystatic CMS configuration
├── tailwind.config.mjs
├── astro.config.mjs
├── .env.example
└── deploy/
    └── KEYSTATIC_DEPLOYMENT_GUIDE.md # Keystatic-specific deployment docs
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

> **Root redirect:** `/` redirects to `/home`.

---

## 3. Data Schema (Keystatic)

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

### Block Types (Stream Field)

All blocks include a `name` field for identification.

#### `HeroBlock`
| Field | Type | Required |
|---|---|---|
| `variant` | select | ✓ | `split-grid`, `cover`, `minimal` |
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
| `bookingUrl` | string | ✓ | bsport booking URL |
| `label` | string | — | Optional heading above CTA |

#### `FeatureGridBlock`
| Field | Type | Required |
|---|---|---|
| `items` | list | ✓ |
| `items[].icon` | string | — | Feather icon name |
| `items[].title` | string | ✓ |
| `items[].description` | text | — |

---

## 4. Design System Tokens (Explicit)

Written directly into `tailwind.config.mjs`.

### Colors

```js
colors: {
  eos: {
    base:     '#F9F9F7',  // 60% — Mineral White
    contrast: '#2F3A40',  // 30% — Deep Slate
    accent:   '#FF2E00',  // 10% — Infrared Red
    subtle:   '#E6E5E0',  // Warm Concrete
    text:     '#1F2933',  // Night Slate
    zen:      '#09090B',  // Zen Black
  }
}
```

### Gradients

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
  serif: ['Merriweather', 'serif'],
  sans:  ['Geist Sans', 'Inter', 'sans-serif'],
}
```

---

## 5. bsport Widget Integration

All bsport widgets live at `src/components/integrations/`.

**Company ID:** `5082`

| Component | `widgetType` | `dialogMode` |
|---|---|---|
| `BsportCalendar.astro` | `"calendar"` | 3 (inline) |
| `BsportSubscription.astro` | `"subscription"` | 3 (inline) |
| `BsportPasses.astro` | `"pass"` | 3 (inline) |
| `BsportWorkshop.astro` | `"workshop"` | 3 (inline) |
| `BsportLeadCapture.astro` | `"newsletterV2"` | 0 (popup) |
| `BsportLoginButton.astro` | `"loginButton"` | 0 (popup) |

---

## 6. SEO & Meta Infrastructure

SEO meta rendered in `BaseLayout.astro`, driven by frontmatter.

- `Sitemap`: `@astrojs/sitemap`.
- `robots.txt`: at `public/robots.txt`.

---

## 7. GSAP Animation Scope (Constrained)

Animations are "stable dynamics" — smooth and grounded.

| Element | Animation | Trigger |
|---|---|---|
| Hero headline | Staggered fade-in (translateY: 20px → 0) | Page load |
| Feature grid items | Staggered fade-in | Scroll |

---

## 8. Image Strategy

- Use Astro's built-in `<Image />` component.
- Source images in `src/assets/` or `public/assets/`.

---

## 9. Email Capture Strategy

- `EmailSignup.astro` posts to Google Apps Script endpoint (`PUBLIC_GAS_ENDPOINT`).

---

## 10. Environment Variables

```bash
# Keystatic (GitHub mode)
KEYSTATIC_GITHUB_CLIENT_ID=
KEYSTATIC_GITHUB_CLIENT_SECRET=
KEYSTATIC_SECRET=
PUBLIC_GITHUB_REPO=

# Email capture
PUBLIC_GAS_ENDPOINT=

# Site URL
PUBLIC_SITE_URL=https://eos-club.de
```

---

## 11. Performance & Accessibility Targets

- Lighthouse Performance ≥ 90 (mobile)
- Lighthouse Accessibility ≥ 95
- `prefers-reduced-motion` respected

---

## 12. CMS Wiring (Keystatic)

1. **Schemas:** Defined in `keystatic.config.ts`.
2. **Local Mode:** Saves directly to the filesystem (development).
3. **GitHub Mode:** Authenticates via GitHub OAuth, saves by committing to the repository (production).

---

## 13. Deployment Architecture

The site is served as static files via NGINX.

1. **Build:** `pnpm build` generates the `dist/` folder.
2. **CMS Access:** `/keystatic` path is routed by NGINX to handle CMS functionality.
3. **Storage:** All content is stored in the Git repository.

See [`deploy/KEYSTATIC_DEPLOYMENT_GUIDE.md`](../deploy/KEYSTATIC_DEPLOYMENT_GUIDE.md) for full architecture.
