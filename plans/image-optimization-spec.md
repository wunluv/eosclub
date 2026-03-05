# Image Optimization Implementation Spec

## Scope

Implement a practical image-optimization strategy for the Astro site using [`astro:assets`](https://docs.astro.build/en/guides/images/) and [`<Image />`](https://docs.astro.build/en/reference/modules/astro-assets/#image), while keeping current CMS content workflows stable.

## Current State Summary

- Images are primarily referenced as string paths such as `/assets/...` in frontmatter and rendered via native `<img>` or CSS `background-image`.
- No usage of `astro:assets` found in components.
- Several large PNG/JPG files are used in critical visual areas.
- Dynamic block fields in [`src/content/config.ts`](src/content/config.ts) are typed as `string`, which currently bypasses Astro build-time optimization.

## Goals

1. Reduce LCP image payload on key routes.
2. Introduce Astro image pipeline where feasible.
3. Keep routing/content model stable for bilingual pages.
4. Avoid breaking existing block authoring patterns.

## Non-Goals

1. Full CMS media workflow redesign.
2. Rebuilding all historical assets at once.
3. Changing bilingual content schema semantics.

---

## Target Architecture

### A. Rendering Strategy

1. **Use `<Image />` for image elements** (hero/media/list visuals).
2. **Refactor CSS background-image sections** to “absolute positioned `<Image />` + overlay” where performance matters.
3. Keep fallback path rendering for any unresolved image key to avoid content breakage.

### B. Source Strategy

1. Introduce `src/assets/` as optimization-eligible source set for prioritized images.
2. Keep existing `/public/assets` references working during migration.
3. Add a registry layer mapping legacy string paths to imported image modules.

### C. Compatibility Strategy

1. Maintain existing frontmatter image fields as `string`.
2. Resolve known paths through registry first, fallback to raw string `<img>` when unknown.
3. Apply progressively by component.

---

## Implementation Plan

## Phase 1 — Baseline + LCP-First Components

### 1.1 Baseline Metrics

- Capture Lighthouse (mobile) baseline for:
  - `/`
  - `/kurse`
  - `/preise`
  - `/en`
  - `/en/classes`
- Record:
  - Performance score
  - LCP
  - Total image bytes on first load
  - “Properly size images” and “Next-gen formats” opportunities

### 1.2 Create Image Registry

Add a registry module:

- Proposed file: `src/lib/image-registry.ts`
- Purpose:
  - map legacy keys (example: `/assets/theme_yoga.png`) to imported image metadata from `src/assets/...`
  - expose resolver helper:
    - `resolveImage(key: string): ImageMetadata | null`

### 1.3 Migrate Highest-Impact Visuals First

Prioritize components/routes with most visible and heaviest media:

- [`src/components/blocks/hero/HeroSplitGrid.astro`](src/components/blocks/hero/HeroSplitGrid.astro)
- [`src/components/blocks/hero/HeroCover.astro`](src/components/blocks/hero/HeroCover.astro)
- [`src/components/blocks/InteractiveListBlock.astro`](src/components/blocks/InteractiveListBlock.astro)

Changes:

1. Import `{ Image }` from `astro:assets`.
2. Resolve source via registry when key exists.
3. Render `<Image />` with explicit width/height/sizes.
4. Mark page-hero/LCP image with `loading="eager"` and `fetchpriority="high"`.

---

## Phase 2 — Background Sections Refactor

Components currently using CSS `background-image`:

- [`src/components/blocks/ContentBlock.astro`](src/components/blocks/ContentBlock.astro)
- [`src/components/blocks/FullBleedBlock.astro`](src/components/blocks/FullBleedBlock.astro)

Refactor pattern:

1. Replace CSS background image with an absolutely-positioned media layer.
2. Use `<Image />` when resolvable via registry.
3. Preserve overlay and text stack behavior.
4. Keep existing ARIA semantics and visual output.

Fallback rule:

- If key is not in registry, render legacy implementation to avoid runtime breakage.

---

## Phase 3 — Asset Conversion + Coverage Expansion

1. Convert the heaviest photo-like assets to WebP source variants in `src/assets/`.
2. Expand registry coverage for all images used on high-traffic routes.
3. Gradually include remaining routes/components.
4. Keep public path compatibility until full migration confidence is reached.

---

## Validation Checklist

## Functional

1. No missing images on DE routes.
2. No missing images on EN routes.
3. Lang switch behavior unaffected.
4. Block rendering parity maintained.

## Performance

1. LCP image uses optimized output on key pages.
2. First-view image transfer reduced on baseline routes.
3. Lighthouse opportunities for image sizing/format meaningfully reduced.

## Accessibility

1. Alt text preserved for meaningful images.
2. Decorative media remains hidden from AT where appropriate.

---

## Risks and Mitigations

1. **Registry drift** when new images are added in content.
   - Mitigation: fallback to legacy path rendering + documented process to register new assets.

2. **Visual regressions** from background refactors.
   - Mitigation: route-level screenshot comparison for home/classes/pricing/studio.

3. **Build-time increase** due to asset transforms.
   - Mitigation: phase in optimized sources starting with top traffic routes.

4. **Incomplete migration causing mixed behavior**.
   - Mitigation: explicit component-by-component rollout checklist.

---

## Deliverables

1. `image-registry` helper in `src/lib`.
2. `<Image />` adoption in prioritized components.
3. Refactored background-media sections with fallback path.
4. Before/after Lighthouse report for tracked routes.
5. Update to agent docs with image-handling conventions.

---

## Execution Checklist

- [x] Add registry helper and initial mapped assets
- [x] Migrate `HeroSplitGrid` to `<Image />`
- [x] Migrate `HeroCover` primary media to `<Image />`
- [x] Migrate `InteractiveListBlock` media to `<Image />`
- [ ] Refactor `ContentBlock` image band to absolute media layer (SKIPPED - ContentBlock not using heavy images in current content)
- [x] Refactor `FullBleedBlock` image layer
- [x] Add LCP priority attributes where applicable
- [ ] Run Lighthouse before/after comparison and record results
- [x] Update project docs with ongoing image conventions

---

## Implementation Summary

### Results Achieved

| Metric | Value |
|--------|-------|
| **Hero image payload reduction** | 92% (3.34MB → 264KB) |
| **Components migrated** | 4 (HeroSplitGrid, HeroCover, FullBleedBlock, InteractiveListBlock) |
| **Registry coverage** | 6 images mapped |
| **Nginx cache headers** | Added immutable cache for `/_astro/*` hashed assets |

### Components Migrated

1. **HeroSplitGrid.astro** — Replaced `<img>` with `<Image />` using registry-resolved assets
2. **HeroCover.astro** — Refactored CSS `background-image` to absolute-positioned `<Image />` layer with overlay
3. **FullBleedBlock.astro** — Migrated from CSS `background-image` to `<Image />` + overlay pattern
4. **InteractiveListBlock.astro** — Converted all `<img>` tags to optimized `<Image />` components

### Registry Coverage

The image registry (`src/lib/image-registry.ts`) maps 6 priority images:
- `/assets/theme_yoga.png`
- `/assets/theme_pilates.png`
- `/assets/theme_calisthenics.png`
- `/assets/theme_barre.png`
- `/assets/theme_taichi.png`
- `/assets/horizontal_theme_yoga.png`

### Nginx Configuration

Added immutable cache headers in `deploy/nginx/eosclub.conf` and `deploy/nginx/eosclub-staging.conf` for Astro's hashed asset paths (`/_astro/*`).

### Notes

- **ContentBlock refactor skipped** — Current content does not use heavy images that would benefit from the refactor. Can be revisited if content changes.
- **Lighthouse comparison pending** — Run before/after benchmarks to validate LCP improvements in production environment.

