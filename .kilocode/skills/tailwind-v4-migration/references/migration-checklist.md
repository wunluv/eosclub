# Tailwind CSS v4 Migration Checklist

Follow these steps to migrate a project from Tailwind CSS v3 to v4.

---

## Phase 1: Preparation

- [ ] **Audit Dependencies:** Check for plugins or tools that might not yet support v4 (e.g., some older UI libraries).
- [ ] **Backup/Branch:** Create a new branch `migration/tailwind-v4`.
- [ ] **Node Version:** Ensure Node.js 20+ is installed.

---

## Phase 2: Dependency Updates

- [ ] **Uninstall v3 packages:**
  ```bash
  npm uninstall tailwindcss autoprefixer
  ```
- [ ] **Install v4 packages (PostCSS approach):**
  ```bash
  npm install tailwindcss @tailwindcss/postcss
  ```
- [ ] **Install v4 packages (Vite approach - recommended):**
  ```bash
  npm install tailwindcss @tailwindcss/vite
  ```

---

## Phase 3: Toolchain Configuration

### If using Vite:
- [ ] Update `vite.config.ts`:
  ```ts
  import tailwindcss from '@tailwindcss/vite'
  // ...
  plugins: [tailwindcss()]
  ```
- [ ] Remove `postcss.config.js` if it only contained tailwind and autoprefixer.

### If using PostCSS:
- [ ] Update `postcss.config.js`:
  ```js
  module.exports = {
    plugins: {
      '@tailwindcss/postcss': {},
    }
  }
  ```

---

## Phase 4: CSS Migration

- [ ] **Update Entry Point:**
  Replace:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
  With:
  ```css
  @import "tailwindcss";
  ```
- [ ] **Migrate Config to CSS:**
  Move values from `tailwind.config.js` into a `@theme` block in your CSS file.
  ```css
  @theme {
    --color-brand: #...;
    --font-sans: ...;
  }
  ```
- [ ] **Migrate Plugins:**
  Replace `plugins: [...]` in JS with `@plugin` in CSS.
  ```css
  @plugin "@tailwindcss/typography";
  ```
- [ ] **Migrate Dark Mode:**
  If using class-based dark mode, add:
  ```css
  @custom-variant dark (&:where(.dark, .dark *));
  ```

---

## Phase 5: Template Auditing (Breaking Changes)

- [ ] **Search & Replace Scale Shifts:**
  - `shadow-sm` → `shadow-xs`
  - `shadow` → `shadow-sm`
  - `rounded-sm` → `rounded-xs`
  - `rounded` → `rounded-sm`
  - `blur-sm` → `blur-xs`
  - `blur` → `blur-sm`
- [ ] **Search & Replace Opacity Utilities:**
  - `bg-opacity-*` → `bg-*/opacity`
  - `text-opacity-*` → `text-*/opacity`
- [ ] **Search & Replace Gradients:**
  - `bg-gradient-to-*` → `bg-linear-to-*`
- [ ] **Check Ring Widths:**
  - Standalone `ring` classes now mean 1px. If 3px was intended, change to `ring-3`.
- [ ] **Check Containers:**
  - If you relied on `container: { center: true }`, add the `@utility container` centering logic to your CSS.

---

## Phase 6: Verification

- [ ] **Run Build:** `npm run build` and check for CSS errors.
- [ ] **Visual Regression Check:** Compare key pages against the v3 version, specifically looking at shadows, borders, and spacing.
- [ ] **RTL Check:** If applicable, verify `space-x/y` behavior.
