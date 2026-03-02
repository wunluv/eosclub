# EOS CLUB — Agent Quick Reference

Bilingual AstroJS + Keystatic integration guide for working with and improving this project without breaking changes.

---

## 1. Bilingual Routing

### URL Structure
| Locale | URL Pattern | Example |
|--------|-------------|---------|
| German (default) | No prefix | `/kurse` |
| English | `/en/` prefix | `/en/classes` |

### Configuration
```js
// astro.config.mjs
i18n: {
  defaultLocale: "de",
  locales: ["de", "en"],
  routing: { prefixDefaultLocale: false }
}
```

### Locale Detection
- Use `Astro.currentLocale` in any component → returns `'de'` or `'en'`
- **Language is determined by file path**, NOT frontmatter

---

## 2. Translation Linking (Critical)

### How DE↔EN Pages Are Paired

Every page has a `translationSlug` field in frontmatter, but it is **directional by locale**:

- In `de/*.md`, `translationSlug` points to the **English filename slug**
- In `en/*.md`, `translationSlug` points to the **German filename slug**

Examples from current content:

```yaml
# src/content/pages/de/kurse.md
---
title: Kurse
translationSlug: classes
---
```

```yaml
# src/content/pages/en/classes.md
---
title: Classes
translationSlug: kurse
---
```

**Key Rule:** `translationSlug` must match the counterpart page filename (without `.md`) in the **other locale**.

### Current Slug Pair Matrix

| DE file | EN file |
|---------|---------|
| `home.md` | `home.md` |
| `kurse.md` | `classes.md` |
| `preise.md` | `pricing.md` |
| `kontakt.md` | `contact.md` |
| `studio.md` | `studio.md` |
| `events.md` | `events.md` |
| `wellness.md` | `wellness.md` |
| `team.md` | `team.md` |

### LangSwitch Component
The [`LangSwitch.astro`](src/components/common/LangSwitch.astro) component:
1. Reads `translationSlug` from frontmatter props
2. DE page → links to `/en/{translationSlug}`
3. EN page → links to `/{translationSlug}`
4. Falls back to hardcoded slug map for edge cases

---

## 3. Content Storage

### File Structure
```
src/content/pages/
├── de/
│   ├── home.md       → renders at /
│   ├── kurse.md      → renders at /kurse
│   ├── studio.md     → renders at /studio
│   └── ...
└── en/
    ├── home.md        → renders at /en
    ├── classes.md     → renders at /en/classes
    └── ...
```

### Frontmatter Schema
```yaml
title: string           # <title> tag
seoDescription: string  # <meta name="description">
ogImage: string         # optional, OG image path
translationSlug: string # REQUIRED - links to counterpart page
blocks: []              # array of block objects
```

---

## 4. Routing Special Cases (Easy to Miss)

1. German home is rendered by `src/pages/index.astro` from `de/home.md`.
2. English home is rendered by `src/pages/en/[...slug].astro` from `en/home.md` with `slug === 'home'` mapped to `/en`.
3. The EN catch-all route includes backward compatibility for legacy `_template` blocks.
4. The DE routes currently dispatch only the modern `discriminant + value` shape.

---

## 5. Block System

### Architecture
Pages use a `blocks` array in frontmatter. Routes iterate blocks and dispatch via discriminated union:

```js
// { discriminant: 'HeroBlock', value: { headline: '...', ... } }
switch (block.discriminant) {
  case 'HeroBlock': return <HeroBlock {...block.value} />;
  // ...
}
```

### Available Blocks
| Block | Purpose |
|-------|---------|
| `HeroBlock` | Page hero with 3 variants: `split-grid`, `cover`, `minimal` |
| `ContentBlock` | Rich text body with optional full-bleed layout |
| `BookingBlock` | CTA linking to bsport booking |
| `FeatureGridBlock` | Icon + title + description grid |
| `FullBleedBlock` | Edge-to-edge background image |
| `InteractiveListBlock` | List with hover-reveal images (GSAP) |
| `FaqBlock` | Accordion FAQ |
| `BsportCalendar` | bsport calendar widget |
| `BsportPasses` | bsport passes widget |
| `BsportSubscription` | bsport subscription widget |

---

## 6. Adding a New Block (6 Touchpoints)

**⚠️ CRITICAL:** A new block type requires 6 coordinated updates:

### Step 1: Create Component
`src/components/blocks/MyBlock.astro`

### Step 2: Add Zod Schema
`src/content/config.ts`
```js
const myBlockSchema = z.object({
  name: z.string().optional(),
  // ... fields
});

// Add to discriminated union:
z.object({ discriminant: z.literal('MyBlock'), value: myBlockSchema }),
```

### Step 3: Add Keystatic Schema
`keystatic.config.ts`
```js
MyBlock: {
  label: 'My Block',
  schema: fields.object({
    name: fields.text({ label: 'Section Name' }),
    // ... fields (must match Zod)
  }),
},
```

### Step 4: Add to DE Dispatcher
`src/pages/[...slug].astro` - add import + switch case

### Step 5: Add to EN Dispatcher
`src/pages/en/[...slug].astro` - add import + switch case

### Step 6: Add to Home Dispatcher
`src/pages/index.astro` - add import + switch case

---

## 7. Block Name Field

Every block has a `name` field for human reference only:

```yaml
blocks:
  - discriminant: ContentBlock
    value:
      name: philosophy-intro  # ← For referencing, NOT rendered
      body: "..."
```

**Important:** The `name` field has NO runtime effect. It's purely for documentation/debugging. Use grep to find blocks:
```bash
grep -r "name: philosophy-intro" src/content/
```

---

## 8. Keystatic CMS

### Access
- Dev: `http://localhost:4321/keystatic`
- Production: `https://eos-club.de/keystatic`

### Storage Mode
- **Development**: Local filesystem (`keystatic.config.ts` → `kind: 'local'`)
- **Production**: GitHub-backed (`kind: 'github'`)

### Content Path
`src/content/pages/**` - all markdown files under this path are editable

### Image Handling
- Store images in `public/assets/`
- Path format in content: `/assets/filename.jpg`
- Keystatic config: `directory: 'public/assets'`, `publicPath: '/assets/'`

---

## 9. Common Breaking Changes to Avoid

### ❌ Don't Do This
1. **Change `translationSlug`** without updating both language files
2. **Rename content files** without updating routing
3. **Modify block schema** without updating BOTH `config.ts` AND `keystatic.config.ts`
4. **Add new block** without adding to all 3 dispatcher files
5. **Assume EN and DE routes handle block formats identically**
6. **Use raw hex colors** - use Tailwind tokens (`eos-accent`, `eos-base`, etc.)

### ✅ Do This Instead
1. Always update DE and EN files together
2. Use design tokens from `tailwind.config.mjs`
3. Test both language versions after any change
4. Keep block data in `discriminant + value` shape for all locales
5. Use the `name` field to document block purposes

---

## 10. Quick Commands

```bash
# Find a specific block across all pages
grep -r "name: philosophy-intro" src/content/

# List all pages
ls src/content/pages/de/
ls src/content/pages/en/

# Development
pnpm dev

# Build
pnpm build
```

---

## 11. Key Files Reference

| File | Purpose |
|------|---------|
| [`astro.config.mjs`](astro.config.mjs) | Astro config including i18n |
| [`keystatic.config.ts`](keystatic.config.ts) | CMS schema |
| [`src/content/config.ts`](src/content/config.ts) | Zod schemas |
| [`src/pages/[...slug].astro`](src/pages/[...slug].astro) | DE routing |
| [`src/pages/index.astro`](src/pages/index.astro) | DE home |
| [`src/pages/en/[...slug].astro`](src/pages/en/[...slug].astro) | EN routing |
| [`src/components/common/LangSwitch.astro`](src/components/common/LangSwitch.astro) | Language toggle |
| [`tailwind.config.mjs`](tailwind.config.mjs) | Design tokens |
