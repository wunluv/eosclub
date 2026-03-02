# Keystatic Migration Spec & Task List

## Overview
This document outlines the architectural plan and tasks for migrating from a self-hosted TinaCMS setup to Keystatic, an Astro-native Git-based CMS. The goal is a side-by-side evaluation: we will disable Tina's build process and mount Keystatic, but leave Tina's configuration and backend in the repository dormant. If Keystatic fails to meet client needs, reverting is as simple as a `git revert`.

## Core Challenge: Data Structure Incompatibility
Both CMSs use a block-based architecture (Polymorphic blocks / Discriminated Unions) stored in Markdown frontmatter, but their JSON representations differ:

**TinaCMS Format:**
```yaml
blocks:
  - _template: HeroBlock
    name: home-hero
    variant: split-grid
```

**Keystatic Format:**
```yaml
blocks:
  - discriminant: HeroBlock
    value:
      name: home-hero
      variant: split-grid
```

**Consequence:** Keystatic will not be able to read the existing Markdown files out-of-the-box, and Astro's Zod schemas (`src/content/config.ts`) will fail if Keystatic writes to the files.

**Solution:**
1. Write a one-time Node migration script to rewrite the frontmatter of all `.md` files in `src/content/pages/` from the Tina format to the Keystatic format.
2. Update the Astro Zod schema and page routers (`[...slug].astro`, `index.astro`) to expect the Keystatic format.

---

## Task List for Orchestrator / EOS Frontend Agent

### Phase 1: Setup & Dependencies
- [ ] **Create Branch:** Create and check out a new git branch: `git checkout -b feature/keystatic-migration`.
- [ ] **Install Keystatic:** Add dependencies: `pnpm add @keystatic/core @keystatic/astro @keystatic/react`.
- [ ] **Add Astro Integration:** Update `astro.config.mjs` to include the `keystatic()` integration.
- [ ] **Create Admin Route:** Create `src/pages/keystatic/[...params].astro` using the standard Keystatic Astro mount code.

### Phase 2: Configuration (`keystatic.config.ts`)
- [ ] **Create Configuration:** Create `keystatic.config.ts` in the project root.
- [ ] **Map Storage Mode:** Set storage to `local` (for dev) and `github` (for production, pointing to the repo).
- [ ] **Map Collections:** Create a `pages` collection pointing to `src/content/pages/*/*` (handling the `de/` and `en/` locale folders).
- [ ] **Map Fields:** Recreate the exact schema from `tina/config.ts`: `title`, `seoDescription`, `ogImage`, `translationSlug`.
- [ ] **Map Blocks:** Recreate the 10 block templates (HeroBlock, ContentBlock, etc.) inside a `fields.blocks` definition. Match all fields (strings, images, booleans, enums).

### Phase 3: Data Migration Script
- [ ] **Write Migration Script:** Create a temporary Node.js script (e.g., `scripts/migrate-blocks-to-keystatic.js`) using `gray-matter` to loop through all `src/content/pages/**/*.md` files.
- [ ] **Transform Data:** Convert the `blocks` array from `{ _template: "Name", ...rest }` to `{ discriminant: "Name", value: { ...rest } }`.
- [ ] **Execute Script:** Run the script to update all Markdown files in the repository.

### Phase 4: Astro Frontend Updates
- [ ] **Update Zod Schemas:** Modify `src/content/config.ts`. The `blocks` array definition needs to change from an array of `z.discriminatedUnion('_template', [...])` to an array of objects shaped like `{ discriminant: z.string(), value: blockSchema }` (or similar, depending on exact Zod implementation).
- [ ] **Update Astro Pages:** Update the mapping logic in `src/pages/[...slug].astro`, `src/pages/index.astro`, etc.
  *Change:* `switch (block._template)` → `switch (block.discriminant)`
  *Change:* `<HeroBlock {...block} />` → `<HeroBlock {...block.value} />`

### Phase 5: Completely Remove TinaCMS
- [ ] **Modify `package.json`:** Remove `tinacms build --skip-cloud-checks &&` from the `build` script and uninstall `@tinacms/cli` and `tinacms`.
- [ ] **Delete Tina Files:** Completely delete the `tina/` directory and the `tina-backend/` directory (if it exists).
- [ ] **Clean Up Admin:** Delete `public/admin` or any Astro pages explicitly serving the Tina UI.

### Phase 6: QA & Handover
- [ ] **Test Locally:** Start the dev server, visit `/keystatic`, and verify all pages load and blocks are editable. Verify images upload correctly to the designated assets directory.
- [ ] **Verify Frontend:** Check that the Astro frontend renders correctly with the new Keystatic block format.
- [ ] **Production Config:** Outline the steps for the client to create a GitHub OAuth App and add the credentials to the production environment variables (`KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`).

---
*Note to Orchestrator: This migration alters content data structures. Ensure all changes are done in a separate git branch (e.g., `feature/keystatic-migration`) so the client can easily evaluate it and revert if necessary.*