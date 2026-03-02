# EOS CLUB – Site Routing & Block System Update Spec

> **For:** Orchestrator Agent
> **Status:** Ready for implementation
> **Locale requirement:** ALL content changes must be applied to BOTH `de/` and `en/` content directories. All new block components must respect `Astro.currentLocale` for any hardcoded strings.

---

## Overview

This spec defines four coordinated changes to the EOS CLUB Astro site:

1. **HeroBlock variant system** — extend `HeroBlock` into a dispatcher with three layout variants
2. **FullBleedBlock** — new reusable full-width image/video section block
3. **InteractiveListBlock** — new hover-image list block with GSAP animation (used on home + studio)
4. **FaqBlock** — new CMS-editable FAQ accordion block (used on pricing + events pages)

All blocks must be registered in:
- `src/content/config.ts` (Zod schema, for Astro type safety)
- `tina/config.ts` (TinaCMS UI schema, for CMS editing)
- `src/pages/[...slug].astro` (dispatcher switch statement)
- `src/pages/index.astro` (dispatcher switch statement, home page)

---

## Part 1: HeroBlock Variant System

### Goal
Replace the single hardcoded `HeroBlock` layout with a dispatcher that delegates to three focused sub-components based on a `variant` field in frontmatter.

### New file structure

```
src/components/blocks/
  HeroBlock.astro                ← thin dispatcher (MODIFY existing file)
  hero/
    HeroSplitGrid.astro          ← CREATE: extracted current layout (home page)
    HeroCover.astro              ← CREATE: full-width background image + overlay
    HeroMinimal.astro            ← CREATE: centered text only, no image
```

### `src/content/config.ts` — schema change

Add `variant` field to `heroBlockSchema`:

```ts
const heroBlockSchema = z.object({
  _template: z.literal('HeroBlock'),
  variant: z.enum(['split-grid', 'cover', 'minimal']).optional().default('split-grid'),
  headline: z.string(),
  subheadline: z.string().optional(),
  subBodyText: z.string().optional(),
  backgroundImage: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional(),
});
```

### `tina/config.ts` — add variant field to HeroBlock template

Add a `select` field after `headline`:

```ts
{
  type: 'string',
  name: 'variant',
  label: 'Hero Layout Variant',
  options: [
    { value: 'split-grid', label: 'Split + Image Grid (Home)' },
    { value: 'cover', label: 'Cover / Background Image' },
    { value: 'minimal', label: 'Minimal (Text Only)' },
  ],
},
```

### `src/components/blocks/HeroBlock.astro` — dispatcher (replace entire file)

```astro
---
import HeroSplitGrid from './hero/HeroSplitGrid.astro';
import HeroCover from './hero/HeroCover.astro';
import HeroMinimal from './hero/HeroMinimal.astro';

const { variant = 'split-grid', ...rest } = Astro.props;
---

{variant === 'split-grid' && <HeroSplitGrid {...rest} />}
{variant === 'cover'      && <HeroCover      {...rest} />}
{variant === 'minimal'    && <HeroMinimal    {...rest} />}
```

### `src/components/blocks/hero/HeroSplitGrid.astro` (CREATE — extract from current HeroBlock)

Move the entire current `HeroBlock.astro` implementation (section, styles, script) into this file. The Props interface and logic stay identical. This is the home page layout: left text column + right 2×2 tiled image grid with fade-up animation.

### `src/components/blocks/hero/HeroCover.astro` (CREATE)

Full-width section with `backgroundImage` as a CSS background. Gradient overlay from bottom. Text and optional CTA anchored in the lower-left. Minimum height `min-h-[60vh]`.

Props used: `headline`, `subheadline`, `subBodyText`, `backgroundImage`, `ctaLabel`, `ctaUrl`

Locale: use `Astro.currentLocale` for default CTA label fallback (same pattern as current HeroBlock).

Design tokens to use: `bg-eos-base`, `text-eos-zen`, `text-eos-text`, `text-eos-contrast`, `bg-eos-accent`, rounded-full CTA button.

### `src/components/blocks/hero/HeroMinimal.astro` (CREATE)

Centered headline + optional subheadline on `bg-eos-base`. No image. Compact padding `py-12 lg:py-16`. For future use — no pages currently use this variant.

### Content file updates — HeroBlock variant field

Apply `variant: split-grid` to home pages; `variant: cover` to all others.

**`src/content/pages/de/home.md`** — add `variant: split-grid` to HeroBlock entry
**`src/content/pages/en/home.md`** — add `variant: split-grid` to HeroBlock entry

**All other `de/` and `en/` pages** — add `variant: cover` to their HeroBlock entry:
- `de/kurse.md` / `en/classes.md`
- `de/studio.md` / `en/studio.md`
- `de/wellness.md` / `en/wellness.md`
- `de/team.md` / `en/team.md`
- `de/events.md` / `en/events.md`
- `de/preise.md` / `en/pricing.md`

---

## Part 2: FullBleedBlock

### Goal
A full-width section that spans edge-to-edge (full viewport width, breaking out of the `max-w-7xl` container). Accepts a background image, optional overlay colour/opacity, and optional centred text content.

### File

```
src/components/blocks/FullBleedBlock.astro    ← CREATE
```

### Props interface

```ts
interface Props {
  image: string;           // path to background image (required)
  altText?: string;        // image alt text for accessibility
  minHeight?: string;      // tailwind class e.g. 'min-h-[50vh]', defaults to 'min-h-[40vh]'
  overlayOpacity?: string; // tailwind opacity class e.g. 'opacity-50', defaults to 'opacity-40'
  headline?: string;       // optional text overlay
  subtext?: string;        // optional body text overlay
}
```

**Important:** This block must break out of the `max-w-7xl` container set in `BaseLayout`. Use negative margins (`-mx-4 sm:-mx-6 lg:-mx-8`) or `w-screen relative left-1/2 -translate-x-1/2` technique to achieve full-bleed within the existing layout constraint.

### `src/content/config.ts` — add schema

```ts
const fullBleedBlockSchema = z.object({
  _template: z.literal('FullBleedBlock'),
  image: z.string(),
  altText: z.string().optional(),
  minHeight: z.string().optional(),
  overlayOpacity: z.string().optional(),
  headline: z.string().optional(),
  subtext: z.string().optional(),
});
```

Add to the `z.discriminatedUnion` in `blockSchema`.

### `tina/config.ts` — add template

```ts
{
  name: 'FullBleedBlock',
  label: 'Full Bleed Image Section',
  fields: [
    { type: 'image', name: 'image', label: 'Background Image', required: true },
    { type: 'string', name: 'altText', label: 'Alt Text' },
    { type: 'string', name: 'minHeight', label: 'Min Height (Tailwind class, e.g. min-h-[50vh])' },
    { type: 'string', name: 'overlayOpacity', label: 'Overlay Opacity (Tailwind class, e.g. opacity-50)' },
    { type: 'string', name: 'headline', label: 'Headline (optional overlay text)' },
    { type: 'string', name: 'subtext', label: 'Subtext (optional overlay text)' },
  ],
},
```

---

## Part 3: InteractiveListBlock

### Goal
A section displaying a list of items (label + description). As the user hovers over a list item, a related image animates into view (GSAP). Content is per-page (home and studio have different items), both locales fully supported.

### File

```
src/components/blocks/InteractiveListBlock.astro    ← CREATE
```

### Props interface

```ts
interface Props {
  title?: string;
  items: Array<{
    label: string;
    description?: string;
    image: string;       // path to image shown on hover
    imageAlt?: string;
  }>;
}
```

### Interaction behaviour
- Desktop: hovering a list item reveals the corresponding image in a fixed right-side panel or floating element. Use GSAP `gsap.to()` for opacity + slight translateY transition. Only one image visible at a time.
- Mobile: images are shown statically beneath each list item (no hover needed; `@media (hover: none)` fallback).
- Respects `prefers-reduced-motion`: if reduced motion, images appear statically with no animation.

### GSAP usage
GSAP is already installed (`gsap: ^3.14.2`). Use a `<script>` tag — no React island needed. Use `astro:after-swap` event listener for view transitions compatibility.

### `src/content/config.ts` — add schema

```ts
const interactiveListItemSchema = z.object({
  label: z.string(),
  description: z.string().optional(),
  image: z.string(),
  imageAlt: z.string().optional(),
});

const interactiveListBlockSchema = z.object({
  _template: z.literal('InteractiveListBlock'),
  title: z.string().optional(),
  items: z.array(interactiveListItemSchema),
});
```

Add to the `z.discriminatedUnion` in `blockSchema`.

### `tina/config.ts` — add template

```ts
{
  name: 'InteractiveListBlock',
  label: 'Interactive List with Image Hover',
  fields: [
    { type: 'string', name: 'title', label: 'Section Title' },
    {
      type: 'object',
      name: 'items',
      label: 'List Items',
      list: true,
      fields: [
        { type: 'string', name: 'label', label: 'Label', required: true },
        { type: 'string', name: 'description', label: 'Description' },
        { type: 'image', name: 'image', label: 'Hover Image', required: true },
        { type: 'string', name: 'imageAlt', label: 'Image Alt Text' },
      ],
    },
  ],
},
```

### Content to add to content files

**`src/content/pages/de/home.md`** — append new block to `blocks` array:

```yaml
  - _template: InteractiveListBlock
    title: "Was wir anbieten"
    items:
      - label: "Yoga"
        description: "Vinyasa, Hatha und Yin für alle Level"
        image: "/assets/tiled_yoga_closeup_1.png"
        imageAlt: "Yoga Praxis"
      - label: "Pilates"
        description: "Körpermitte, Kraft und Kontrolle"
        image: "/assets/tiled_theme_pilates.png"
        imageAlt: "Pilates Stunde"
      - label: "Kalisthenics"
        description: "Funktionale Kraft mit dem eigenen Körpergewicht"
        image: "/assets/tiled_theme_calisthenics.png"
        imageAlt: "Kalisthenics Training"
      - label: "Infrarot-Wellness"
        description: "Tiefenwärme und Regeneration"
        image: "/assets/tiled_infrared_therapy_studio.png"
        imageAlt: "Infrarot Therapie Studio"
```

**`src/content/pages/en/home.md`** — append equivalent English block:

```yaml
  - _template: InteractiveListBlock
    title: "What we offer"
    items:
      - label: "Yoga"
        description: "Vinyasa, Hatha and Yin for all levels"
        image: "/assets/tiled_yoga_closeup_1.png"
        imageAlt: "Yoga practice"
      - label: "Pilates"
        description: "Core, strength and control"
        image: "/assets/tiled_theme_pilates.png"
        imageAlt: "Pilates class"
      - label: "Calisthenics"
        description: "Functional strength using your own bodyweight"
        image: "/assets/tiled_theme_calisthenics.png"
        imageAlt: "Calisthenics training"
      - label: "Infrared Wellness"
        description: "Deep heat and regeneration"
        image: "/assets/tiled_infrared_therapy_studio.png"
        imageAlt: "Infrared therapy studio"
```

**`src/content/pages/de/studio.md`** — append new block to `blocks` array:

```yaml
  - _template: InteractiveListBlock
    title: "Unser Raum"
    items:
      - label: "200m² Studiofläche"
        description: "Großzügiger Raum für ungestörte Bewegung"
        image: "/assets/yoga_studio.jpg"
        imageAlt: "Yoga Studio Fläche"
      - label: "Natürliches Licht"
        description: "Große Fenster für eine helle, einladende Atmosphäre"
        image: "/assets/horizontal_yoga_closeup_3.png"
        imageAlt: "Studio Licht"
      - label: "Infrarot-Kabinen"
        description: "Private Wellness-Einheit direkt im Studio"
        image: "/assets/tiled_infrared_therapy_studio.png"
        imageAlt: "Infrarot Kabine"
```

**`src/content/pages/en/studio.md`** — append equivalent English block:

```yaml
  - _template: InteractiveListBlock
    title: "Our Space"
    items:
      - label: "200m² Studio Floor"
        description: "Generous space for undisturbed movement"
        image: "/assets/yoga_studio.jpg"
        imageAlt: "Yoga studio floor"
      - label: "Natural Light"
        description: "Large windows for a bright, inviting atmosphere"
        image: "/assets/horizontal_yoga_closeup_3.png"
        imageAlt: "Studio light"
      - label: "Infrared Cabins"
        description: "Private wellness session directly in the studio"
        image: "/assets/tiled_infrared_therapy_studio.png"
        imageAlt: "Infrared cabin"
```

---

## Part 4: FaqBlock

### Goal
An accordion-style FAQ section. User clicks a question to reveal/hide the answer. Content is fully CMS-editable. Used on Pricing and Events pages (both locales).

### File

```
src/components/blocks/FaqBlock.astro    ← CREATE
```

### Props interface

```ts
interface Props {
  title?: string;
  questions: Array<{
    question: string;
    answer: string;   // HTML string (rich-text rendered from TinaCMS)
  }>;
}
```

### Implementation guidance
Use the native HTML `<details>` / `<summary>` elements for zero-JS progressive enhancement. Style with custom CSS or Tailwind to match the EOS design system. Add a CSS `transition` on the content area for a smooth open/close. Optionally enhance with a small `<script>` for smooth height animation using `max-height` transition.

Design: `bg-eos-base`, `border-eos-subtle`, `text-eos-zen` for question text, `text-eos-text` for answer text. Chevron icon (use feather-icons `chevron-down`) that rotates on open.

### `src/content/config.ts` — add schema

```ts
const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const faqBlockSchema = z.object({
  _template: z.literal('FaqBlock'),
  title: z.string().optional(),
  questions: z.array(faqItemSchema),
});
```

Add to the `z.discriminatedUnion` in `blockSchema`.

### `tina/config.ts` — add template

```ts
{
  name: 'FaqBlock',
  label: 'FAQ Accordion',
  fields: [
    { type: 'string', name: 'title', label: 'Section Title' },
    {
      type: 'object',
      name: 'questions',
      label: 'Questions',
      list: true,
      fields: [
        { type: 'string', name: 'question', label: 'Question', required: true },
        { type: 'rich-text', name: 'answer', label: 'Answer', required: true },
      ],
    },
  ],
},
```

### Content to add to content files

**`src/content/pages/de/preise.md`** — append new block:

```yaml
  - _template: FaqBlock
    title: "Häufige Fragen"
    questions:
      - question: "Kann ich eine Klasse ausprobieren, bevor ich eine Mitgliedschaft abschließe?"
        answer: "Ja! Unser Drop-in-Ticket ermöglicht dir, jede Klasse einmalig zu besuchen, ohne Verpflichtung."
      - question: "Wie lange ist die 10er-Karte gültig?"
        answer: "Die 10er-Karte ist 3 Monate ab Kaufdatum gültig."
      - question: "Kann ich meine Flatrate pausieren?"
        answer: "Ja, du kannst deine Mitgliedschaft einmal im Jahr für bis zu 4 Wochen pausieren."
      - question: "Gibt es eine Einführungsklasse für Anfänger?"
        answer: "Alle unsere Kursangebote beinhalten Level-Hinweise. Schreib uns, wenn du Empfehlungen für den Einstieg benötigst."
```

**`src/content/pages/en/pricing.md`** — append equivalent English block:

```yaml
  - _template: FaqBlock
    title: "Frequently Asked Questions"
    questions:
      - question: "Can I try a class before committing to a membership?"
        answer: "Yes! Our drop-in ticket lets you visit any class once, with no commitment."
      - question: "How long is the 10-class pass valid?"
        answer: "The 10-class pass is valid for 3 months from the date of purchase."
      - question: "Can I pause my flat-rate membership?"
        answer: "Yes, you can pause your membership once a year for up to 4 weeks."
      - question: "Is there an introductory class for beginners?"
        answer: "All our classes include level guidance. Write to us if you need recommendations for getting started."
```

**`src/content/pages/de/events.md`** — append new block:

```yaml
  - _template: FaqBlock
    title: "Häufige Fragen"
    questions:
      - question: "Wie buche ich einen Workshop?"
        answer: "Workshops können direkt über unser Buchungssystem reserviert werden. Früh buchen empfohlen – Plätze sind begrenzt."
      - question: "Sind die Workshops für Anfänger geeignet?"
        answer: "Jeder Workshop gibt Hinweise zum empfohlenen Level. Viele unserer Events begrüßen alle Erfahrungsstufen."
      - question: "Gibt es Gruppenrabatte für Workshops?"
        answer: "Ab 3 Personen aus einer Gruppe kontaktiere uns für ein individuelles Angebot."
```

**`src/content/pages/en/events.md`** — append equivalent English block:

```yaml
  - _template: FaqBlock
    title: "Frequently Asked Questions"
    questions:
      - question: "How do I book a workshop?"
        answer: "Workshops can be reserved directly through our booking system. Book early — spots are limited."
      - question: "Are the workshops suitable for beginners?"
        answer: "Each workshop provides guidance on the recommended level. Many of our events welcome all experience levels."
      - question: "Are there group discounts for workshops?"
        answer: "For groups of 3 or more, contact us for an individual offer."
```

---

## Part 5: Dispatcher updates

### `src/pages/[...slug].astro` and `src/pages/index.astro`

Add imports and switch cases for the three new block types. The existing pattern is:

```astro
---
import FullBleedBlock from '../components/blocks/FullBleedBlock.astro';
import InteractiveListBlock from '../components/blocks/InteractiveListBlock.astro';
import FaqBlock from '../components/blocks/FaqBlock.astro';
---

// In the switch statement:
case 'FullBleedBlock':
  return <FullBleedBlock {...block} />;
case 'InteractiveListBlock':
  return <InteractiveListBlock {...block} />;
case 'FaqBlock':
  return <FaqBlock {...block} />;
```

---

## Part 6: Locale / Language switching compatibility

### How locale currently works
- Default locale is `de` (no path prefix): `eos-club.de/kurse`
- English locale uses `/en/` prefix: `eos-club.de/en/classes`
- `Astro.currentLocale` returns `'de'` or `'en'` in any component
- Content is separate files per locale: `src/content/pages/de/*.md` and `src/content/pages/en/*.md`
- `LangSwitch` component in the Header reads `deSlug` / `enSlug` props passed through `BaseLayout`

### Locale requirements for all new components

**All new `.astro` components** that contain ANY hardcoded user-visible strings must use `Astro.currentLocale` to branch:

```astro
const locale = Astro.currentLocale ?? 'de';
const isDE = locale.startsWith('de');
```

Examples of strings that need localisation inside components:
- Default section titles if not provided via props
- ARIA labels on interactive elements (e.g., `aria-label` on `<summary>` in FaqBlock)
- Screen-reader-only text

**Content strings** (labels, questions, answers, list items) are locale-managed via the separate `de/` and `en/` frontmatter files — no special handling needed in the component beyond accepting them as props.

### No routing changes needed
The existing `[...slug].astro` + `src/pages/index.astro` routing handles all locales correctly. English pages are served by the `en/[...slug].astro` equivalent (Astro i18n handles this via the `i18n` config in `astro.config.mjs`). All new blocks follow the same content authoring pattern as existing blocks.

---

## Summary checklist for orchestrator

```
[ ] src/content/config.ts — add variant to heroBlockSchema; add new block schemas
[ ] tina/config.ts — add variant select to HeroBlock; add 3 new block templates
[ ] src/components/blocks/hero/ — create subdirectory
[ ] src/components/blocks/hero/HeroSplitGrid.astro — extract from current HeroBlock
[ ] src/components/blocks/hero/HeroCover.astro — new cover layout
[ ] src/components/blocks/hero/HeroMinimal.astro — new minimal layout
[ ] src/components/blocks/HeroBlock.astro — replace with dispatcher
[ ] src/components/blocks/FullBleedBlock.astro — new block
[ ] src/components/blocks/InteractiveListBlock.astro — new block with GSAP hover
[ ] src/components/blocks/FaqBlock.astro — new accordion block
[ ] src/pages/[...slug].astro — add 3 new block imports + switch cases
[ ] src/pages/index.astro — add 3 new block imports + switch cases
[ ] src/content/pages/de/home.md — add variant: split-grid; add InteractiveListBlock
[ ] src/content/pages/en/home.md — add variant: split-grid; add InteractiveListBlock
[ ] src/content/pages/de/studio.md — add variant: cover; add InteractiveListBlock
[ ] src/content/pages/en/studio.md — add variant: cover; add InteractiveListBlock
[ ] src/content/pages/de/kurse.md — add variant: cover
[ ] src/content/pages/en/classes.md — add variant: cover
[ ] src/content/pages/de/wellness.md — add variant: cover
[ ] src/content/pages/en/wellness.md — add variant: cover
[ ] src/content/pages/de/team.md — add variant: cover
[ ] src/content/pages/en/team.md — add variant: cover
[ ] src/content/pages/de/events.md — add variant: cover; add FaqBlock
[ ] src/content/pages/en/events.md — add variant: cover; add FaqBlock
[ ] src/content/pages/de/preise.md — add variant: cover; add FaqBlock
[ ] src/content/pages/en/pricing.md — add variant: cover; add FaqBlock
```
