# Tailwind CSS v3 → v4: Complete Breaking Changes Reference

This document catalogs every confirmed breaking change between Tailwind CSS v3.x and v4.x.
Reference this file when writing, auditing, or migrating Tailwind CSS code.

---

## 1. Installation & Toolchain

### Package Changes

| Purpose | v3 | v4 |
|---|---|---|
| Core package | `tailwindcss` | `tailwindcss` _(same)_ |
| PostCSS plugin | `tailwindcss` (included) | `@tailwindcss/postcss` (separate) |
| Vite integration | PostCSS plugin + Vite config | `@tailwindcss/vite` (dedicated plugin) |
| CLI | `tailwindcss` CLI (included) | `@tailwindcss/cli` (separate) |

### PostCSS Config (v3)
```js
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### PostCSS Config (v4)
```js
// postcss.config.js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    // autoprefixer is no longer needed — v4 handles vendor prefixes via Lightning CSS
  },
}
```

### Vite Config (v4 preferred)
```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default {
  plugins: [tailwindcss()],
}
```

---

## 2. CSS Entry Point: Directives Replaced

### v3 — Three separate directives required
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### v4 — Single import
```css
@import "tailwindcss";
```

For granular control (v4):
```css
@import "tailwindcss/preflight";   /* base/reset styles */
@import "tailwindcss/theme";       /* CSS variables */
@import "tailwindcss/utilities";   /* utility classes */
```

**Migration:** Replace all three `@tailwind` directives with `@import "tailwindcss";`

---

## 3. Configuration: JS File → CSS-First

### v3 — `tailwind.config.js`
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#e63946',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### v4 — CSS `@theme` block
```css
@import "tailwindcss";

@theme {
  --color-brand: #e63946;
  --font-sans: 'Inter', sans-serif;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

**Key points:**
- `tailwind.config.js` is no longer required or supported as the primary config mechanism.
- All theme values become CSS custom properties prefixed appropriately (e.g., `--color-*`, `--font-*`, `--spacing-*`).
- A compatibility shim (`@config "tailwind.config.js"`) exists but is considered a transitional tool only.

---

## 4. Content / Purge Configuration Removed

### v3 — Required explicit content paths
```js
content: ['./src/**/*.{html,js,ts,jsx,tsx,vue,svelte}']
```

### v4 — Automatic content detection
- No `content` array is needed.
- v4 scans all non-ignored project files automatically using heuristics.
- To explicitly exclude paths, use `.gitignore` or add `@source` directives:
  ```css
  @source "./src";                     /* explicitly include a path */
  @source not "./src/legacy/**/*.html"; /* explicitly exclude */
  ```

---

## 5. Utility Class Renames (Scale Shifts)

Many utility scales were shifted down to allow room for smaller named sizes. **This is the most common source of silent visual regressions.**

### Box Shadow

| v3 class | v4 class |
|---|---|
| `shadow-sm` | `shadow-xs` |
| `shadow` | `shadow-sm` |
| `shadow-md` | `shadow-md` _(unchanged)_ |
| `shadow-lg` | `shadow-lg` _(unchanged)_ |
| `shadow-xl` | `shadow-xl` _(unchanged)_ |
| `shadow-2xl` | `shadow-2xl` _(unchanged)_ |
| `shadow-inner` | `shadow-inner` _(unchanged)_ |
| `shadow-none` | `shadow-none` _(unchanged)_ |

### Drop Shadow (filter)

| v3 class | v4 class |
|---|---|
| `drop-shadow-sm` | `drop-shadow-xs` |
| `drop-shadow` | `drop-shadow-sm` |
| `drop-shadow-md` | `drop-shadow-md` _(unchanged)_ |
| `drop-shadow-lg` | `drop-shadow-lg` _(unchanged)_ |
| `drop-shadow-xl` | `drop-shadow-xl` _(unchanged)_ |
| `drop-shadow-2xl` | `drop-shadow-2xl` _(unchanged)_ |

### Blur (filter)

| v3 class | v4 class |
|---|---|
| `blur-sm` | `blur-xs` |
| `blur` | `blur-sm` |
| `blur-md` | `blur-md` _(unchanged)_ |
| `blur-lg` | `blur-lg` _(unchanged)_ |
| `blur-xl` | `blur-xl` _(unchanged)_ |
| `blur-2xl` | `blur-2xl` _(unchanged)_ |
| `blur-3xl" | `blur-3xl` _(unchanged)_ |

### Border Radius

| v3 class | v4 class |
|---|---|
| `rounded-sm` | `rounded-xs` |
| `rounded` | `rounded-sm` |
| `rounded-md` | `rounded-md` _(unchanged)_ |
| `rounded-lg` | `rounded-lg` _(unchanged)_ |
| `rounded-xl` | `rounded-xl` _(unchanged)_ |
| `rounded-2xl` | `rounded-2xl` _(unchanged)_ |
| `rounded-3xl` | `rounded-3xl` _(unchanged)_ |
| `rounded-full` | `rounded-full" | `rounded-full` _(unchanged)_ |
| `rounded-none` | `rounded-none` _(unchanged)_ |

> **Note:** The same directional variants (`rounded-t-sm` → `rounded-t-xs`, etc.) follow the same renaming pattern.

---

## 6. Ring Width Default Changed

| | v3 | v4 |
|---|---|---|
| `ring` (no suffix) | 3px ring | 1px ring |
| Equivalent to old `ring` | — | `ring-3` |

**Migration:** Replace standalone `ring` with `ring-3` where a 3px ring was intended.

---

## 7. Opacity Utility Classes Removed

These deprecated v3 utilities are **fully removed** in v4:

- `bg-opacity-*`
- `text-opacity-*`
- `border-opacity-*`
- `divide-opacity-*`
- `ring-opacity-*`
- `placeholder-opacity-*`

### v3 Pattern
```html
<div class="bg-blue-500 bg-opacity-50 text-black text-opacity-75">
```

### v4 Pattern — Use slash modifier syntax
```html
<div class="bg-blue-500/50 text-black/75">
```

---

## 8. Dark Mode Configuration

### v3 — `tailwind.config.js`
```js
module.exports = {
  darkMode: 'class',  // or 'media'
}
```

### v4 — CSS `@custom-variant` (class-based)
```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

### v4 — Media-query dark mode (still default if no custom variant is set)
- `prefers-color-scheme: dark` media query is the built-in default.
- For class-based dark mode, the `@custom-variant` declaration is required.
- The `dark:` variant in markup (`dark:bg-gray-900`) works the same way in templates.

---

## 9. `ring-offset-*` Utilities

- `ring-offset-width` and `ring-offset-color` utilities are **removed**.
- Ring offsets are now achieved by layering box shadows manually or using CSS variables.

### v3
```html
<div class="focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-500">
```

### v4 — Use explicit box-shadow or custom CSS
```css
/* v4 approach — simulate ring offset with shadow layers */
.ring-offset-simulation {
  box-shadow: 0 0 0 2px white, 0 0 0 4px theme(--color-blue-500);
}
```

---

## 10. `theme()` Function → CSS Variables

### v3 — `theme()` function in CSS
```css
.custom {
  color: theme('colors.blue.500');
  padding: theme('spacing.4');
}
```

### v4 — CSS Custom Properties (preferred)
```css
.custom {
  color: var(--color-blue-500);
  padding: var(--spacing-4);
}
```

- The `theme()` function still works in v4 as a compatibility shim but is deprecated.
- Prefer CSS variables throughout new v4 code.
- CSS variable naming convention: `--{category}-{scale}` (e.g., `--color-red-500`, `--spacing-8`, `--font-size-lg`).

---

## 11. `@layer` Custom Components

### v3
```css
@layer components {
  .btn {
    @apply py-2 px-4 bg-blue-500 text-white rounded;
  }
}
```

### v4 — Still supported, but use `@utility` for single-class utilities
```css
/* @layer components still works for component-like patterns */
@layer components {
  .btn {
    @apply py-2 px-4 bg-blue-500 text-white rounded-md;
  }
}

/* New: @utility for custom utility classes that participate in variants */
@utility flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## 12. Plugin API

### v3
```js
const plugin = require('tailwindcss/plugin')

module.exports = {
  plugins: [
    plugin(function({ addUtilities, addComponents, theme }) {
      addUtilities({
        '.rotate-15': { transform: 'rotate(15deg)' },
      })
    }),
  ],
}
```

### v4 — Plugins registered in CSS
```css
@import "tailwindcss";
@plugin "./my-plugin.js";
```

```js
// my-plugin.js
import plugin from 'tailwindcss/plugin'

export default plugin(function({ addUtilities }) {
  addUtilities({
    '.rotate-15': { transform: 'rotate(15deg)' },
  })
})
```

- Plugins are now explicitly imported in CSS with `@plugin`.
- First-party plugins (`@tailwindcss/typography`, `@tailwindcss/forms`) are now imported as `@plugin "@tailwindcss/typography"` in the CSS file.

---

## 13. Container Utility Changes

### v3 — Container with responsive centering
```js
// tailwind.config.js - common v3 container customization
theme: {
  container: {
    center: true,
    padding: '1rem',
  },
}
```

### v4 — Container is unstyled; configure with `@utility`
```css
/* v4 — container only sets max-width to current breakpoint */
/* To replicate v3's centered container with padding: */
@utility container {
  margin-inline: auto;
  padding-inline: 1rem;
}
```

---

## 14. `space-x-*` / `space-y-*` Internals Changed

- In v3, `space-x-4` used the `* + *` CSS selector pattern.
- In v4, `space-x-4` uses `margin-inline-start` (logical properties).
- **Visual behavior is the same** for LTR layouts, but RTL layouts may behave differently.
- Verify spacing utilities in RTL contexts after migration.

---

## 15. Gradient Utilities

### New in v4 (no v3 equivalent)
```html
<!-- Linear gradients now have directional utilities -->
<div class="bg-linear-to-r from-blue-500 to-purple-500">

<!-- Radial gradients -->
<div class="bg-radial from-blue-500 to-transparent">

<!-- Conic gradients -->
<div class="bg-conic from-blue-500 to-purple-500">
```

- `bg-gradient-to-*` from v3 is replaced by `bg-linear-to-*` in v4.
- **Migration:** Replace `bg-gradient-to-r` with `bg-linear-to-r`, etc.

| v3 | v4 |
|---|---|
| `bg-gradient-to-t` | `bg-linear-to-t` |
| `bg-gradient-to-tr` | `bg-linear-to-tr` |
| `bg-gradient-to-r` | `bg-linear-to-r` |
| `bg-gradient-to-br` | `bg-linear-to-br` |
| `bg-gradient-to-b` | `bg-linear-to-b` |
| `bg-gradient-to-bl` | `bg-linear-to-bl` |
| `bg-gradient-to-l" | `bg-linear-to-l` |
| `bg-gradient-to-tl` | `bg-linear-to-tl` |

---

## 16. Prefix Configuration

### v3 — `tailwind.config.js`
```js
module.exports = { prefix: 'tw-' }
```

### v4 — Import option
```css
@import "tailwindcss" prefix(tw-);
```

---

## 17. Breakpoints / Screen Configuration

### v3 — `tailwind.config.js`
```js
theme: {
  screens: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
  },
}
```

### v4 — CSS `@theme`
```css
@theme {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
}
```

---

## 18. Arbitrary Value Syntax Changes

### Arbitrary Properties (unchanged)
```html
<div class="[color:var(--my-color)]">
```

### Arbitrary Variants — new CSS variable syntax
```html
<!-- v3 — spacing as a CSS variable was possible but awkward -->
<!-- v4 — spacing scale accepts arbitrary values naturally -->
<div class="p-[var(--my-padding)]">
```

---

## 19. CSS Nesting Support

- v4 uses **Lightning CSS** (instead of PostCSS-nested) for CSS processing.
- Native CSS nesting is supported without additional plugins.
- `@apply` inside nested rules behaves as expected.

---

## 20. Autoprefixer No Longer Needed

- v3 required `autoprefixer` for full cross-browser support.
- v4 uses Lightning CSS which handles vendor prefixes automatically.
- **Migration:** Remove `autoprefixer` from PostCSS config.

---

## 21. Preflight (Base Styles) Changes

Some base reset styles in Preflight were updated in v4:
- `::placeholder` color is now `currentColor` with reduced opacity (same behavior, cleaner implementation).
- `body` font smoothing is included by default.
- Button cursor behavior adjusted (buttons now have `cursor: default` reset).

---

## 22. Typography Plugin (`@tailwindcss/typography`)

- Import changes: Add `@plugin "@tailwindcss/typography";` in CSS instead of listing in `plugins: []` in config.
- Class names for prose are unchanged (`prose`, `prose-lg`, etc.).
- Theme customization uses CSS variables in `@theme` rather than `theme.extend.typography` in config.

---

## 23. Forms Plugin (`@tailwindcss/forms`)

- Import via `@plugin "@tailwindcss/forms";` in CSS.
- Strategy configuration (class vs. base) is passed as a plugin option if using the class strategy.

---

## 24. Quick Reference: Removed / Changed Patterns

| Pattern | v3 | v4 |
|---|---|---|
| Entry CSS | `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| Config | `tailwind.config.js` | `@theme {}` in CSS |
| Content paths | Required in config | Auto-detected |
| Dark mode | `darkMode: 'class'` in config | `@custom-variant dark` in CSS |
| Opacity modifiers | `bg-opacity-50` | `bg-black/50` |
| Theme values in CSS | `theme('colors.blue.500')` | `var(--color-blue-500)` |
| PostCSS plugin | `tailwindcss` | `@tailwindcss/postcss` |
| Vite plugin | PostCSS via vite | `@tailwindcss/vite` |
| Gradients | `bg-gradient-to-r` | `bg-linear-to-r` |
| Ring default | `ring` = 3px | `ring` = 1px (`ring-3` for old default) |
| Plugins in config | `plugins: [typography()]` | `@plugin "@tailwindcss/typography"` in CSS |
| Custom utilities | `addUtilities()` in plugin | `@utility` in CSS |
| Prefix | `prefix: 'tw-'` in config | `@import "tailwindcss" prefix(tw-)` |
