---
name: astro-keystatic
description: Expert guide for Astro + Keystatic CMS development. Covers block-based content architecture, i18n patterns, schema synchronization between Keystatic and Astro, and best practices for building maintainable content-driven sites with Git-based CMS.
license: MIT
metadata:
  category: web-development
  stack:
    - Astro v5
    - Keystatic CMS
    - TailwindCSS
    - TypeScript
---

# Astro + Keystatic Skill

Comprehensive guide for building content-driven websites with Astro static site generator and Keystatic Git-based CMS.

## When to Use This Skill

Use this skill when:
- Adding new content blocks or components
- Modifying Keystatic schemas or Astro content collections
- Creating new page types or content structures
- Debugging content rendering issues
- Setting up i18n (internationalization) with Astro + Keystatic
- Syncing changes between Keystatic config and Astro schemas

## Core Architecture

### Block-Based Content System

Pages are composed of a `blocks[]` array in frontmatter. Each block has a `discriminant` field that determines which component renders it.

**Data Flow:**
```
Keystatic Editor → Markdown/YAML frontmatter → Astro Content Collection → Block Dispatcher → Component Render
```

### File Structure Pattern

```
src/
  components/blocks/           # Block components (one per block type)
    HeroBlock.astro            # Dispatcher component with variants
    ContentBlock.astro
    FeatureGridBlock.astro
    hero/                      # Sub-components for variants
      HeroSplitGrid.astro
      HeroCover.astro
      HeroMinimal.astro
  content/
    config.ts                  # Zod schemas for Astro content collections
    pages/
      de/                      # German pages (default locale, no prefix)
      en/                      # English pages (/en/ prefix)
  pages/
    [...slug].astro            # Dynamic page renderer
    index.astro                # Home page
keystatic.config.ts            # Keystatic configuration and field schemas
```

## Adding a New Block (Complete Workflow)

To add a new block type, modify **four files** in this order:

### 1. Create Block Component

Create `src/components/blocks/MyBlock.astro`:

```astro
---
interface Props {
  name?: string;           // Internal reference (required field convention)
  title?: string;          // Block-specific props
  items?: Array<{
    label: string;
    value: string;
  }>;
}

const { name, title, items = [] } = Astro.props;
---

<section class="my-block" data-section={name}>
  {title && <h2>{title}</h2>}
  <ul>
    {items.map(item => (
      <li>{item.label}: {item.value}</li>
    ))}
  </ul>
</section>
```

**Block Component Conventions:**
- Always accept `name` prop (used for section identification)
- Use Tailwind classes for styling
- Keep components focused on presentation
- Handle optional props with defaults

### 2. Add Zod Schema to Astro

Edit `src/content/config.ts`:

```typescript
// Add schema definition
const myBlockSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  items: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
});

// Add to discriminated union
const blockSchema = z.discriminatedUnion('discriminant', [
  // ... existing blocks
  z.object({ discriminant: z.literal('MyBlock'), value: myBlockSchema }),
]);
```

**Schema Guidelines:**
- Match field names exactly between Zod and Keystatic schemas
- Use `.optional()` for fields that aren't required
- Provide sensible defaults with `.default(value)`
- Use discriminated union pattern for type-safe block dispatch

### 3. Add Keystatic Schema

Edit `keystatic.config.ts`:

```typescript
blocks: fields.blocks(
  {
    // ... existing block definitions
    MyBlock: {
      label: 'My Block',
      schema: fields.object({
        name: fields.text({ label: 'Section Name (internal reference)' }),
        title: fields.text({ label: 'Title' }),
        items: fields.array(
          fields.object({
            label: fields.text({ label: 'Label' }),
            value: fields.text({ label: 'Value' }),
          }),
          {
            label: 'Items',
            itemLabel: (props) => props.fields.label.value || 'New Item',
          }
        ),
      }),
    },
  },
  { label: 'Content Blocks' }
),
```

**Keystatic Field Types:**

| Field | Use For | Example |
|-------|---------|---------|
| `fields.text()` | Short strings, labels | titles, names, URLs |
| `fields.text({ multiline: true })` | Longer text | descriptions, body content |
| `fields.select()` | Fixed options | layout variants, status |
| `fields.checkbox()` | Booleans | feature flags, toggles |
| `fields.image()` | Images | backgrounds, icons |
| `fields.array()` | Lists | grid items, FAQ entries |
| `fields.object()` | Grouped fields | card data, list items |
| `fields.markdoc()` | Rich content | article body |

**Image Field Pattern:**
```typescript
backgroundImage: fields.image({
  label: 'Background Image',
  directory: 'public/assets',    // Where to store
  publicPath: '/assets/',        // URL path prefix
}),
```

### 4. Add to Page Renderers

Edit both `src/pages/[...slug].astro` and `src/pages/index.astro`:

```astro
---
// Add import
import MyBlock from '../components/blocks/MyBlock.astro';
---

{blocks?.map((block) => {
  switch (block.discriminant) {
    // ... existing cases
    case 'MyBlock':
      return <MyBlock {...block.value} />;
    default:
      return null;
  }
})}
```

**Important:** Keep both page renderers in sync with identical switch statements.

## i18n Patterns

### Locale Detection

```astro
---
const locale = Astro.currentLocale ?? 'de';  // 'de' | 'en'
const isDE = locale.startsWith('de');
---
```

### Translation Slug Pattern

Pages reference their translation via `translationSlug`:

```yaml
# src/content/pages/de/kurse.md
title: Kurse
translationSlug: classes  # Links to /en/classes

# src/content/pages/en/classes.md
title: Classes
translationSlug: kurse    # Links to /kurse
```

### Language Switcher Logic

```astro
---
// LangSwitch.astro
const locale = Astro.currentLocale ?? 'de';
const { translationSlug } = Astro.props.page?.data || {};

const targetPath = locale === 'de'
  ? `/en/${translationSlug}`
  : `/${translationSlug}`;
---
<a href={targetPath}>
  {locale === 'de' ? 'English' : 'Deutsch'}
</a>
```

## Schema Synchronization Checklist

When modifying content structures, ensure these stay in sync:

- [ ] `src/content/config.ts` - Zod schema for Astro
- [ ] `keystatic.config.ts` - Field definitions for editor
- [ ] `src/components/blocks/*.astro` - Component props interface
- [ ] `src/pages/[...slug].astro` - Switch case for rendering
- [ ] `src/pages/index.astro` - Switch case for rendering

**Common Sync Errors:**
- Field name typos between Zod and Keystatic
- Missing discriminant in union type
- Missing switch case in page renderer
- Type mismatch (string vs number)

## Content Editing Patterns

### Section Naming Convention

Every block has a `name` field for internal reference:

```yaml
blocks:
  - discriminant: HeroBlock
    value:
      name: home-hero           # [page]-[purpose]
  - discriminant: ContentBlock
    value:
      name: philosophy-intro    # [descriptor]-[purpose]
```

**Naming Patterns:**
- `[page]-hero` - Hero blocks (e.g., `home-hero`, `studio-hero`)
- `[descriptor]-intro` - Opening content (e.g., `philosophy-intro`)
- `[descriptor]-grid` - Feature grids (e.g., `pillars-grid`)
- `[descriptor]-list` - Interactive lists (e.g., `offerings-list`)
- `[descriptor]-faq` - FAQ sections (e.g., `pricing-faq`)

### Finding Content by Section Name

```bash
grep -r "name: philosophy-intro" src/content/
```

## Keystatic Configuration

### Storage Modes

```typescript
export default config({
  storage: process.env.NODE_ENV === 'production'
    ? {
        kind: 'github',
        repo: process.env.PUBLIC_GITHUB_REPO || 'owner/repo',
      }
    : {
        kind: 'local',  // Local filesystem in development
      },
  // ... collections
});
```

### Collection Path Patterns

```typescript
collections: {
  pages: collection({
    label: 'Pages',
    slugField: 'title',
    path: 'src/content/pages/**',     // Glob pattern for file locations
    format: {
      data: 'yaml',                   // Frontmatter format
      contentField: 'content',        // Body content field name
    },
    // ... schema
  }),
}
```

## Best Practices

### Component Design

1. **Keep blocks focused** - One responsibility per block
2. **Use variant dispatchers** - For layout variations (see HeroBlock pattern)
3. **Accept `name` prop** - Always for section identification
4. **Default props safely** - Handle undefined gracefully

### Schema Design

1. **Match field names exactly** - Between Zod and Keystatic
2. **Use discriminated unions** - For type-safe block arrays
3. **Provide itemLabel functions** - For better array item naming in Keystatic
4. **Document optional fields** - With `.optional()` and defaults

### Content Organization

1. **Use descriptive section names** - Following naming conventions
2. **Keep translations in sync** - Same block structure, different content
3. **Validate before commit** - Run `astro check` before deploying
4. **Test both locales** - Verify changes in German and English

## Debugging Common Issues

### Block Not Rendering
- Check discriminant matches in schema and switch case
- Verify component import path
- Confirm block is in page's blocks array

### Type Errors
- Ensure Zod schema matches component Props interface
- Check discriminated union includes new block type
- Verify field names match exactly between Keystatic and Zod

### Keystatic Editor Issues
- Clear browser cache after schema changes
- Check browser console for JavaScript errors
- Verify storage mode configuration
- Ensure GitHub repo is accessible (production mode)

### i18n Routing Problems
- Verify `translationSlug` matches exactly
- Check `prefixDefaultLocale: false` in astro.config.mjs
- Confirm file paths match locale (de/ vs en/)

## Reference Commands

```bash
# Development with Keystatic UI
pnpm dev

# Type checking
pnpm astro check

# Build for production
pnpm build

# Find section by name
grep -r "name: section-name" src/content/

# List all German pages
ls src/content/pages/de/
```
