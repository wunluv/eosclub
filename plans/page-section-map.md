# EOS CLUB — Page Section Map (Pattern Language)

This document is the **canonical reference language** for every named section across all EOS CLUB pages. Use it to communicate precise design intent to any agent without ambiguity.

> **How to reference a section:**
> _"On the `home` page, in the `philosophy-intro` block, change the body text to…"_
> _"Across all `*-hero` blocks using the `cover` variant, adjust the overlay opacity to…"_

---

## Naming Convention

| Pattern | Example | Used for |
|---------|---------|----------|
| `[page]-hero` | `home-hero`, `studio-hero` | Every HeroBlock on a page |
| `[descriptor]-intro` | `philosophy-intro`, `pricing-intro` | Opening or primary ContentBlock |
| `[descriptor]-grid` | `pillars-grid`, `wellness-benefits-grid` | FeatureGridBlock |
| `[descriptor]-list` | `offerings-list`, `studio-spaces-list` | InteractiveListBlock |
| `[descriptor]-faq` | `pricing-faq`, `events-faq` | FaqBlock |
| `[descriptor]-booking-cta` | `classes-booking-cta`, `pricing-booking-cta` | BookingBlock |
| `[descriptor]-image` | `studio-image` | FullBleedBlock |

The `name` field is added directly to each block in the markdown frontmatter (see `src/content/config.ts` for schema). Agents can search for a block by name using `grep -r "name: philosophy-intro" src/content/`.

---

## home

**Files:** `src/content/pages/de/home.md` · `src/content/pages/en/home.md`
**Routes:** `/` (DE) · `/en/home` (EN)

| `name` | `_template` | Sub-component | Key content / purpose |
|--------|-------------|---------------|-----------------------|
| `home-hero` | `HeroBlock` | `HeroSplitGrid.astro` | "Practice over promise" — split layout with 2×2 image grid |
| `philosophy-intro` | `ContentBlock` | `ContentBlock.astro` | "EOS CLUB ist mehr als ein Studio – es ist ein Ort der Transformation…" |
| `pillars-grid` | `FeatureGridBlock` | `FeatureGridBlock.astro` | 3 icons: Yoga & Pilates · Infrarot-Wellness · Community |
| `offerings-list` | `InteractiveListBlock` | `InteractiveListBlock.astro` | Hover-image list: Yoga · Pilates · Kalisthenics · Infrarot-Wellness |

---

## studio

**Files:** `src/content/pages/de/studio.md` · `src/content/pages/en/studio.md`
**Routes:** `/studio` (DE) · `/en/studio` (EN)

| `name` | `_template` | Sub-component | Key content / purpose |
|--------|-------------|---------------|-----------------------|
| `studio-hero` | `HeroBlock` | `HeroCover.astro` | "Unser Studio" — full-bleed cover image |
| `studio-intro` | `ContentBlock` | `ContentBlock.astro` | "200m² Raum für Bewegung, Atmung und Entspannung…" |
| `studio-spaces-list` | `InteractiveListBlock` | `InteractiveListBlock.astro` | Hover-image list: 200m² · Natürliches Licht · Infrarot-Kabinen |

---

## kurse / classes

**Files:** `src/content/pages/de/kurse.md` · `src/content/pages/en/classes.md`
**Routes:** `/kurse` (DE) · `/en/classes` (EN)

| `name` | `_template` | Sub-component | Key content / purpose |
|--------|-------------|---------------|-----------------------|
| `classes-hero` | `HeroBlock` | `HeroCover.astro` | "Unsere Kurse" — cover image with subheadline |
| `classes-booking-cta` | `BookingBlock` | `BookingBlock.astro` | CTA button linking to bsport booking URL |
| `classes-grid` | `FeatureGridBlock` | `FeatureGridBlock.astro` | 4 icons: Vinyasa Flow · Hatha Yoga · Pilates · Barre |

---

## preise / pricing

**Files:** `src/content/pages/de/preise.md` · `src/content/pages/en/pricing.md`
**Routes:** `/preise` (DE) · `/en/pricing` (EN)

| `name` | `_template` | Sub-component | Key content / purpose |
|--------|-------------|---------------|-----------------------|
| `pricing-hero` | `HeroBlock` | `HeroCover.astro` | "Preise" — gradient background cover |
| `pricing-intro` | `ContentBlock` | `ContentBlock.astro` | Drop-in / 10er-Karte / Flatrate pricing list |
| `pricing-booking-cta` | `BookingBlock` | `BookingBlock.astro` | "Mitgliedschaft wählen" CTA |
| `pricing-faq` | `FaqBlock` | `FaqBlock.astro` | 4 FAQ items about drop-in, validity, pausing, beginner classes |

---

## events

**Files:** `src/content/pages/de/events.md` · `src/content/pages/en/events.md`
**Routes:** `/events` (DE) · `/en/events` (EN)

| `name` | `_template` | Sub-component | Key content / purpose |
|--------|-------------|---------------|-----------------------|
| `events-hero` | `HeroBlock` | `HeroCover.astro` | "Events" — pilates image cover |
| `events-intro` | `ContentBlock` | `ContentBlock.astro` | "Workshops, Retreats und besondere Veranstaltungen…" |
| `events-faq` | `FaqBlock` | `FaqBlock.astro` | 3 FAQ items: booking, suitability, group discounts |

---

## wellness

**Files:** `src/content/pages/de/wellness.md` · `src/content/pages/en/wellness.md`
**Routes:** `/wellness` (DE) · `/en/wellness` (EN)

| `name` | `_template` | Sub-component | Key content / purpose |
|--------|-------------|---------------|-----------------------|
| `wellness-hero` | `HeroBlock` | `HeroCover.astro` | "Wellness" — infrared therapy studio image |
| `wellness-intro` | `ContentBlock` | `ContentBlock.astro` | "Infrarot-Kabinen bieten tiefenwirksame Wärme…" |
| `wellness-benefits-grid` | `FeatureGridBlock` | `FeatureGridBlock.astro` | 3 icons: Tiefenwärme · Detox · Regeneration |

---

## team

**Files:** `src/content/pages/de/team.md` · `src/content/pages/en/team.md`
**Routes:** `/team` (DE) · `/en/team` (EN)

| `name` | `_template` | Sub-component | Key content / purpose |
|--------|-------------|---------------|-----------------------|
| `team-hero` | `HeroBlock` | `HeroCover.astro` | "Unser Team" — yoga image cover |
| `team-intro` | `ContentBlock` | `ContentBlock.astro` | "Die Menschen hinter EOS — zertifizierte Lehrer…" |

---

## kontakt / contact

**Files:** `src/content/pages/de/kontakt.md` · `src/content/pages/en/contact.md`
**Routes:** `/kontakt` (DE) · `/en/contact` (EN)

| `name` | `_template` | Sub-component | Key content / purpose |
|--------|-------------|---------------|-----------------------|
| `contact-hero` | `HeroBlock` | `HeroCover.astro` | "Kontakt" — gradient background |
| `contact-info` | `ContentBlock` | `ContentBlock.astro` | Address, email, phone, opening hours |

---

## Shared / Global Zones

These zones appear on every page and are referenced by their component names directly (they are not part of the `blocks[]` array):

| Reference name | Component file | Purpose |
|----------------|----------------|---------|
| `site-header` | `src/components/common/Header.astro` | Navigation, logo, lang switch, bsport login button |
| `site-footer` | `src/components/common/Footer.astro` | Links, legal, social, newsletter signup |

---

## Quick Lookup: Blocks by Type

### All `HeroBlock` sections

| Page | `name` | `variant` | Background |
|------|--------|-----------|------------|
| home | `home-hero` | `split-grid` | 2×2 image grid (hardcoded in component) |
| studio | `studio-hero` | `cover` | `/assets/yoga_studio.jpg` |
| kurse/classes | `classes-hero` | `cover` | `/assets/theme_yoga.png` |
| preise/pricing | `pricing-hero` | `cover` | `/assets/14_bg_gradient.jpg` |
| events | `events-hero` | `cover` | `/assets/theme_pilates.png` |
| wellness | `wellness-hero` | `cover` | `/assets/infrared_therapy_studio.png` |
| team | `team-hero` | `cover` | `/assets/theme_yoga.png` |
| kontakt/contact | `contact-hero` | `cover` | `/assets/14_bg_gradient.jpg` |

### All `ContentBlock` sections

| Page | `name` | Opening words |
|------|--------|---------------|
| home | `philosophy-intro` | "EOS CLUB ist mehr als ein Studio…" |
| studio | `studio-intro` | "200m² Raum für Bewegung…" |
| preise/pricing | `pricing-intro` | "Ob Drop-in, 10er-Karte oder…" |
| events | `events-intro` | "Workshops, Retreats und besondere…" |
| wellness | `wellness-intro` | "Infrarot-Kabinen bieten tiefenwirksame…" |
| team | `team-intro` | "Die Menschen hinter EOS…" |
| kontakt/contact | `contact-info` | "EOS CLUB, Musterstraße 1…" |

### All `FeatureGridBlock` sections

| Page | `name` | Items |
|------|--------|-------|
| home | `pillars-grid` | Yoga & Pilates · Infrarot-Wellness · Community |
| kurse/classes | `classes-grid` | Vinyasa Flow · Hatha Yoga · Pilates · Barre |
| wellness | `wellness-benefits-grid` | Tiefenwärme · Detox · Regeneration |

### All `InteractiveListBlock` sections

| Page | `name` | Items |
|------|--------|-------|
| home | `offerings-list` | Yoga · Pilates · Kalisthenics · Infrarot-Wellness |
| studio | `studio-spaces-list` | 200m² · Natürliches Licht · Infrarot-Kabinen |

### All `FaqBlock` sections

| Page | `name` | # of questions |
|------|--------|----------------|
| preise/pricing | `pricing-faq` | 4 |
| events | `events-faq` | 3 |

### All `BookingBlock` sections

| Page | `name` | Label |
|------|--------|-------|
| kurse/classes | `classes-booking-cta` | "Jetzt buchen" |
| preise/pricing | `pricing-booking-cta` | "Mitgliedschaft wählen" |
