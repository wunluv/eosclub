# Keystatic Stable Configuration Pattern

## The Issue (Fixed in P1)

Using `fields.object()` wrappers inside `fields.blocks()` caused image fields to disappear
on save in the Keystatic editor. The persisted value shape in markdown didn't match what
`fields.object()` expected when rehydrating existing values.

## The Solution

Use **plain field records** directly in `fields.blocks()` schema definitions:

```typescript
// ✅ CORRECT - Stable pattern
blocks: fields.blocks({
  HeroBlock: {
    label: 'Hero Block',
    schema: {  // Plain object, no fields.object()
      name: fields.text({ label: 'Section Name' }),
      backgroundImage: fields.image({...}),
      // ...
    },
  },
})
```

```typescript
// ❌ INCORRECT - Unstable pattern (causes image loss)
blocks: fields.blocks({
  HeroBlock: {
    label: 'Hero Block',
    schema: fields.object({  // DO NOT USE
      name: fields.text({ label: 'Section Name' }),
      backgroundImage: fields.image({...}),
      // ...
    }),
  },
})
```

## Exception: Nested Arrays

`fields.object()` IS correct for items inside `fields.array()`:

```typescript
// ✅ CORRECT - fields.object() inside array items
items: fields.array(
  fields.object({  // This is correct for array elements
    label: fields.text({ label: 'Label' }),
    image: fields.image({ label: 'Hover Image' }),
  }),
  { label: 'List Items' }
)
```

## Data Format

The stable pattern produces this YAML structure:

```yaml
blocks:
  - discriminant: HeroBlock
    value:
      name: home-hero
      backgroundImage: /assets/yoga_studio.jpg
```

This matches Astro's discriminated union schema:
- `discriminant`: Block type identifier
- `value`: Block-specific data

## Files Affected

- `keystatic.config.ts` - CMS schema definitions
- `src/content/config.ts` - Astro Zod validation (unchanged, already correct)
- `src/pages/[...slug].astro` - Page dispatcher (unchanged, already correct)

## When Adding New Blocks

Always use the stable pattern:
1. Add block to `fields.blocks()` with plain schema object
2. Add Zod schema to `src/content/config.ts` discriminated union
3. Add import + case to all page dispatchers (DE, EN, index)
4. Test image persistence if block has image fields
