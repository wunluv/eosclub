# Keystatic Debug Plan v3 — Fix "Cannot read properties of undefined (reading 'kind')"

## Symptom
- `/keystatic` loads, `Pages` collection lists all 16 entries correctly.
- Clicking any entry (e.g. `de/home`) throws:
  ```
  TypeError: Cannot read properties of undefined (reading 'kind')
  ```
  inside the `<LocalItemPage>` React component.

## Root Cause

### `fields.blocks()` schema expects a plain field record, not `fields.object()`

In [`keystatic.config.ts:31-181`](../keystatic.config.ts:31), every block variant wraps its schema in `fields.object()`:

```ts
HeroBlock: {
  label: 'Hero Block',
  schema: fields.object({        // ← WRONG
    name: fields.text({ ... }),
    headline: fields.text({ ... }),
    ...
  }),
},
```

The Keystatic `fields.blocks()` API expects each block's `schema` to be a **plain object of field definitions** (`Record<string, ComponentSchema>`), not a single `ObjectField`:

```ts
HeroBlock: {
  label: 'Hero Block',
  schema: {                       // ← CORRECT: plain record
    name: fields.text({ ... }),
    headline: fields.text({ ... }),
    ...
  },
},
```

### Why this causes the error

When Keystatic renders the edit form, it iterates over the block's `schema` expecting each property to be a field with a `.kind` property (e.g. `{ kind: 'form', ... }`). But `fields.object()` returns a **single field** with structure `{ kind: 'object', fields: { ... } }`. Keystatic tries to access `schema[fieldName]` which returns `undefined`, then `undefined.kind` throws the TypeError.

## Fix

### Single change in `keystatic.config.ts`

Remove `fields.object()` wrapper from every block's `schema` property inside the `fields.blocks()` call. There are **10 blocks** that need this change:

1. `HeroBlock` (line 35)
2. `ContentBlock` (line 65)
3. `BookingBlock` (line 78)
4. `FeatureGridBlock` (line 87)
5. `FullBleedBlock` (line 104)
6. `InteractiveListBlock` (line 121)
7. `FaqBlock` (line 143)
8. `BsportCalendar` (line 161)
9. `BsportPasses` (line 168)
10. `BsportSubscription` (line 175)

### Before (example — HeroBlock)

```ts
HeroBlock: {
  label: 'Hero Block',
  schema: fields.object({
    name: fields.text({ label: 'Section Name (internal reference)' }),
    headline: fields.text({ label: 'Headline' }),
    // ...
  }),
},
```

### After (example — HeroBlock)

```ts
HeroBlock: {
  label: 'Hero Block',
  schema: {
    name: fields.text({ label: 'Section Name (internal reference)' }),
    headline: fields.text({ label: 'Headline' }),
    // ...
  },
},
```

### Pattern

For each block, change:
```
schema: fields.object({
```
to:
```
schema: {
```

And the matching closing:
```
}),  // end of fields.object
```
to:
```
},  // end of schema
```

## No content file changes needed

The existing content files already store blocks in the correct discriminated union format:
```yaml
blocks:
  - discriminant: HeroBlock
    value:
      name: home-hero
      headline: Practice over promise
```

This format is compatible with `fields.blocks()` — the issue is purely in the config schema definition.

## Verification Checklist

1. Start dev server (`pnpm dev`)
2. Navigate to `/keystatic`
3. Click into `de/home` — should render the edit form without errors
4. Verify all block fields are editable
5. Test opening `en/home`, `de/preise`, `de/kurse` (these use different block types)
6. Edit a safe field (e.g. `seoDescription`) and save — confirm write to disk
7. Confirm `pnpm build` still succeeds
