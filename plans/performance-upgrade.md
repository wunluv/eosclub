# EOS CLUB — Performance Upgrade Plan
**Date:** 2026-03-12
**Current Lighthouse Score:** 60 (staging.eos-club.de)
**Previous Score (staging.prod.khanyi.com):** 72
**Target Score:** 78–83+

---

## Context

The site was recently migrated from `staging.prod.khanyi.com` to `staging.eos-club.de`. The score dropped from 72 → 60. Analysis of the Lighthouse JSON report identifies specific, fixable bottlenecks ordered by ease of implementation and expected score impact.

---

## Score Breakdown (Current)

| Metric | Score | Value | Weight |
|--------|-------|-------|--------|
| FCP (First Contentful Paint) | 0.37 | 3.4s | 10% |
| LCP (Largest Contentful Paint) | 0.66 | 3.4s | 25% |
| TBT (Total Blocking Time) | 0.41 | 710ms | 30% |
| CLS (Cumulative Layout Shift) | 1.00 | 0.001 | 25% |
| Speed Index | 0.23 | 7.8s | 10% |
| TTI (Time to Interactive) | — | 18.7s | 0% |

**Accessibility:** 96/100 (4 pts lost to color contrast failures)

---

## Root Cause Summary

The three biggest performance bottlenecks:

1. **`cdn.bsport.io/scripts/widget.js`** — 1.46MB download, 61% unused JS. Causes a 1,069ms long task + 399ms second task. Dominates TBT (the highest-weighted metric at 30%).

2. **Google Fonts CSS is render-blocking** — The `<link rel="stylesheet">` for Google Fonts in `BaseLayout.astro` blocks first paint for ~1,686ms. Lighthouse estimates 650ms FCP savings from fixing this.

3. **`bw_horizontal_theme_barre.png` is 1.97MB PNG** — Used as a CSS background in `ContentBlock.astro`. A WebP equivalent already exists at `/public/assets/bw_horizontal_theme_barre.webp` (26KB). Lighthouse estimates 1,865 KiB savings.

**Secondary culprit:** `FeatureGridBlock.astro` imports `gsap/ScrollTrigger` — which is explicitly banned by project rules. This inflates the JS bundle to 43KB and costs 2,141ms CPU time, contributing significantly to the long task list and TBT.

---

## Task List for EOS Front End Agent

Tasks are ordered from **easiest/highest-impact first**. Each task is self-contained.

---

### TASK 1 — Remove ScrollTrigger from FeatureGridBlock

**Priority:** Critical
**Files:** `src/components/blocks/FeatureGridBlock.astro`
**Impact:** Reduces TBT by ~399ms, shrinks JS bundle, removes ScrollTrigger (banned by project rules)

**What to do:**

Remove the `gsap/ScrollTrigger` import and replace the animation with an `IntersectionObserver` pattern (identical to how `ContentBlock.astro` already handles its GSAP animation).

Current banned code to remove:
```js
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

gsap.from('.feature-item', {
  scrollTrigger: {
    trigger: '.feature-item',
    start: 'top 85%',
    toggleActions: 'play none none none'
  },
  opacity: 0,
  y: 20,
  duration: 0.4,
  stagger: 0.08,
  ease: 'power2.out'
});
```

Replace with:
```js
function initFeatureGridAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const items = document.querySelectorAll('.feature-item');
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  items.forEach((item) => {
    item.style.animationPlayState = 'paused';
    observer.observe(item);
  });
}

initFeatureGridAnimations();
document.addEventListener('astro:after-swap', initFeatureGridAnimations);
```

Also add CSS animation to `<style>` tag in the component:
```css
.feature-item {
  animation: featureItemFadeUp 0.4s ease forwards paused;
}
.feature-item:nth-child(2) { animation-delay: 0.08s; }
.feature-item:nth-child(3) { animation-delay: 0.16s; }
/* etc. */

@keyframes featureItemFadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .feature-item { animation: none; opacity: 1; transform: none; }
}
```

> **Note:** Keep the `import { gsap } from 'gsap'` only if used elsewhere in the component. If the only use was ScrollTrigger, remove the entire gsap import.

---

### TASK 2 — Make Google Fonts Non-Render-Blocking

**Priority:** Critical
**Files:** `src/layouts/BaseLayout.astro` (line 70)
**Impact:** ~650ms FCP savings

**What to do:**

Replace the blocking stylesheet link with the async-load pattern. The `preconnect` tags (lines 68–69) stay as-is.

**Remove line 70:**
```html
<link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

**Replace with:**
```html
<!-- Non-blocking font load with noscript fallback -->
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&family=Inter:wght@300;400;500;600;700&display=swap" onload="this.onload=null;this.rel='stylesheet'" />
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&family=Inter:wght@300;400;500;600;700&display=swap" /></noscript>
```

> **Note:** The `&display=swap` parameter is already present in the URL — this ensures FOUT (flash of unstyled text) while fonts load, which is preferable to blocking render. The visual impact is minimal as Geist Sans / Inter fallback fonts are very close to the loaded fonts.

---

### TASK 3 — Switch ContentBlock Background Image to WebP

**Priority:** High
**Files:** `src/content/pages/de/home.md` (line 32), `src/content/pages/en/home.md`
**Impact:** ~1,865 KiB transfer savings, faster LCP/SI

**What to do:**

The `philosophy-intro` ContentBlock renders `bw_horizontal_theme_barre.png` (1.97MB) as a CSS background image. A WebP version (26KB) already exists in `/public/assets/`.

In `src/content/pages/de/home.md`, change:
```yaml
backgroundImage: /assets/bw_horizontal_theme_barre.png
```
To:
```yaml
backgroundImage: /assets/bw_horizontal_theme_barre.webp
```

Apply identical change in the EN counterpart file `src/content/pages/en/home.md` (if it references the same image).

> **Note:** The `ContentBlock.astro` component uses this as a CSS `background-image` inline style, so no component code changes are needed — only the content value.

---

### TASK 4 — Defer bsport Widget Loading

**Priority:** High
**Files:** ALL of the following (each has the same CDN injection pattern):
- `src/components/integrations/BsportLeadCapture.astro`
- `src/components/integrations/BsportCalendar.astro`
- `src/components/integrations/BsportPasses.astro`
- `src/components/integrations/BsportSubscription.astro`

**Impact:** Defers 1,069ms long task out of TBT window, estimated +8-12 performance points

---

#### How the widgets currently work (read this first)

Every bsport component uses the same 3-part pattern:

**Part 1 — CDN injection into `<head>` via slot:**
```astro
<Fragment slot="head">
  <script id="bsport-widget-cdn" src="https://cdn.bsport.io/scripts/widget.js" defer is:inline></script>
</Fragment>
```
This injects the 1.46MB `widget.js` into `<head>` every time any bsport component is on the page. The `defer` attribute delays *execution* but the browser still **downloads** the file immediately as part of the preload scanner — it dominates network bandwidth before FCP.

**Part 2 — A mount target div:**
```html
<div id="bsport-widget-263658" class="bsport-lead-capture"></div>
```

**Part 3 — A polling mount script:**
```js
function MountBsportWidget(config, repeat) {
  repeat = repeat || 1;
  if (repeat > 50) return;
  if (!window.BsportWidget) {
    return setTimeout(function () { MountBsportWidget(config, repeat + 1); }, 100 * repeat || 1);
  }
  BsportWidget.mount(config);
}
MountBsportWidget({ parentElement: ..., companyId: 5082, ... });
```

The widget self-initialises by polling `window.BsportWidget` until the CDN script has loaded.

---

#### The problem

Even with `defer`, the browser's HTML parser discovers `widget.js` in `<head>` immediately and starts downloading it. At 1.46MB over a simulated mobile connection, this takes ~5.5 seconds of network time and then executes with a 1,069ms long task — well within the TBT measurement window.

---

#### The fix — 3 changes per component

**Change 1:** Remove the `<Fragment slot="head">` block entirely from every bsport component.

**Change 2:** Add a lazy CDN loader script at the bottom of each component that uses `IntersectionObserver` to inject `widget.js` only when the widget's container div is near the viewport.

**Change 3:** The existing mount polling function (`MountBsportWidget`, `mountBsportCalendar`, etc.) already handles the case where `window.BsportWidget` isn't defined yet — it retries up to 50 times. This means it works correctly with lazy loading — no changes needed to the mount scripts.

---

#### Template for each component

Replace the `<Fragment slot="head">` block with this lazy loader script **inside the component** (after the mount target div, before or after the mount script):

```html
<!-- Lazy bsport CDN loader — injects widget.js only when widget enters viewport -->
<script is:inline>
(function() {
  // Use a unique selector to find this component's widget container
  var mountTarget = document.getElementById('WIDGET_ELEMENT_ID_PLACEHOLDER');
  if (!mountTarget) return;

  // If the CDN is already loaded (another widget on same page loaded it first),
  // do nothing — the mount polling script handles the rest
  if (window.BsportWidget) return;

  var loaded = false;

  function loadBsportCDN() {
    if (loaded) return;
    loaded = true;
    if (document.getElementById('bsport-widget-cdn')) return; // already injected
    var s = document.createElement('script');
    s.id = 'bsport-widget-cdn';
    s.src = 'https://cdn.bsport.io/scripts/widget.js';
    s.defer = true;
    document.body.appendChild(s);
  }

  // Load when widget container is within 300px of viewport
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            loadBsportCDN();
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '300px' }
    );
    observer.observe(mountTarget);
  } else {
    // Fallback for very old browsers: load after page load event
    window.addEventListener('load', loadBsportCDN);
  }
})();
</script>
```

Replace `WIDGET_ELEMENT_ID_PLACEHOLDER` with the actual constant value for each component:
- `BsportLeadCapture.astro` → `bsport-widget-263658`
- `BsportCalendar.astro` → `bsport-widget-863381`
- `BsportPasses.astro` → `bsport-widget-533268`
- `BsportSubscription.astro` → `bsport-widget-990933`

---

#### Important: Multiple bsport widgets on one page

If a page has multiple bsport widgets (e.g. a page with both `BsportCalendar` and `BsportPasses`), each will have its own lazy loader script. The guard `if (document.getElementById('bsport-widget-cdn')) return;` prevents the CDN script from being injected twice. The mount polling scripts in each component will each retry independently once the shared CDN is loaded — this is correct behaviour.

---

#### Apply to all 4 components

Repeat the same change in all four files. The only difference per component is the `WIDGET_ELEMENT_ID`. The existing mount scripts (Part 3 from above) remain completely unchanged.

> **Note on `BsportLeadCapture`:** This component also has an additional global `MountBsportWidget` script (declared in a separate `<script id="bsport-widget-mount">` tag). This is used by the widget config script that follows — it should remain in place; it only defines a function, it doesn't call anything until the config script calls it.

---

### TASK 5 — Add Explicit Width/Height to Unsized Images

**Priority:** Medium
**Files:** `src/components/common/Footer.astro` (line 150), `src/components/common/Header.astro`
**Impact:** Minor CLS prevention, accessibility improvement

**What to do:**

**Footer logo** (`src/components/common/Footer.astro:150`):
Add `width` and `height` attributes. The image has `class="h-14 ... w-auto"` — use the natural image dimensions as the declared values:
```html
<img
  src="/assets/eos-logo-export_wb-white-optimized.webp"
  alt="EOS CLUB"
  class="h-14 md:h-20 lg:h-24 xl:h-28 w-auto object-contain"
  loading="lazy"
  decoding="async"
  width="224"
  height="56"
/>
```

**Header logos** (`src/components/common/Header.astro`): Find the two `<img>` tags with `src="/assets/eos-logo-export_bm-red.svg"` and add:
```html
width="32" height="32"
```
(They already have `class="h-8 w-auto"` — the natural dimensions of the SVG should be declared.)

---

### TASK 6 — Fix Color Contrast (Accessibility 96 → 100)

**Priority:** Medium
**Files:** `src/components/blocks/hero/HeroSplitGrid.astro`, `src/components/common/Footer.astro`
**Impact:** +4 accessibility points (96 → 100), may also affect best-practices scoring

**Contrast failures identified:**

| Element | Location | Current ratio | Required | Fix |
|---------|----------|---------------|----------|-----|
| H1 heading `eos-accent` on `eos-base` | `HeroSplitGrid.astro:47` | 3.96 | 4.5:1 | Change `text-eos-accent` to `text-[#DC0000]` on this element |
| H2 subheadline same issue | `HeroSplitGrid.astro:52` | 3.96 | 4.5:1 | Same fix |
| CTA button `text-white` on `bg-eos-accent` | `HeroSplitGrid.astro:64` | 4.18 | 4.5:1 | Change button bg to `bg-[#DC0000]` |
| Footer nav section headings `text-white/40` | `Footer.astro:67,92,111` | 3.74 | 4.5:1 | Change to `text-white/55` |
| Footer bottom copyright/address text `text-white/40` | `Footer.astro:164,170` | 3.74 | 4.5:1 | Change to `text-white/55` |
| Footer phone link `text-white/40` | `Footer.astro:192` | 3.74 | 4.5:1 | Change to `text-white/55` |

**Note on the accent color:** `#DC0000` achieves a 4.53:1 ratio against `eos-base` (#F9F9F7) and 4.75:1 against white — both pass WCAG AA. This is a targeted override using Tailwind's arbitrary value syntax `text-[#DC0000]`/`bg-[#DC0000]` rather than changing the global design token, to minimize side-effects.

**The bsport "SUBMIT" button** also fails contrast — this is third-party and cannot be controlled.

---

### TASK 7 — Investigate keystatic-astro-page.css on Public Routes

**Priority:** Medium
**Files:** Build output, `src/layouts/BaseLayout.astro`, Astro/Keystatic config
**Impact:** Removes 8.7KB render-blocking stylesheet from all public pages

**What to investigate:**

The Lighthouse network waterfall shows `keystatic-astro-page.C6TniOPf.css` loading on the public homepage. This is a Keystatic admin UI stylesheet that should only load under `/keystatic` routes.

1. Search for where this CSS is imported: `grep -r "keystatic-astro-page" src/` and `grep -r "keystatic" src/layouts/`
2. Check if `BaseLayout.astro` or any shared layout imports Keystatic styles
3. Ensure Keystatic CSS is scoped to the Keystatic admin layout only

If the CSS import is in a component that's shared between public and admin routes, split it so it's only in the admin-specific layout.

---

### TASK 8 — Add Responsive Sizes to Hero Grid Images

**Priority:** Low
**Files:** `src/components/blocks/hero/HeroSplitGrid.astro` (lines 83–94)
**Impact:** ~46KB transfer savings per mobile pageload

**What to do:**

The 4 hero grid images are generated at 600×600px but displayed at ~184×184px on mobile. Update the Astro `<Image>` component calls to use smaller dimensions for the actual use case:

```astro
<Image
  src={img.optimized}
  alt={img.alt}
  width={400}
  height={400}
  format="webp"
  class="h-full w-full object-cover img-greyscale"
  loading={(i === 0 || i === 1) ? 'eager' : 'lazy'}
  decoding="async"
  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 300px"
  {...(i === 0 || i === 1 ? { fetchpriority: 'high' } : {})}
/>
```

This tells the browser to request an appropriately-sized image variant for the current viewport.

---

### TASK 9 — Add HSTS Header (nginx)

**Priority:** Low
**Files:** `deploy/nginx/eosclub-staging.conf`
**Impact:** Security improvement (flagged by Lighthouse best-practices)

**What to do:**

Add to the `# Security headers` section in `eosclub-staging.conf`:
```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
```

Apply the same change to `deploy/nginx/eosclub.conf` for production.

> **Note:** `max-age=63072000` = 2 years, which is the recommended HSTS preload value.

---

### TASK 10 — Investigate High TTFB (740ms) — optional / infrastructure

**Priority:** Low (may resolve spontaneously with server warm-up)
**Files:** `deploy/nginx/eosclub-staging.conf`, Docker setup
**Impact:** If the HTML is hitting the Node proxy instead of static file serving, fixing could save 500ms+ FCP/LCP

**What to investigate:**

The homepage is an Astro SSG page. Nginx serves it via `try_files $uri $uri.html =404`. TTFB should be <100ms for a static file. The observed 740ms TTFB suggests the request may be hitting the Docker Node proxy.

Diagnose by running:
```bash
curl -v -o /dev/null https://staging.eos-club.de/ 2>&1 | grep -E "< (Server|X-|Content-Type|Cache)"
```

If the response headers show `X-Powered-By: Astro` or similar Node.js headers, the SSG static file routing has an issue. The static build output should be served directly by nginx from `/var/www/public/eosclub/dist/client/index.html`.

---

## Expected Score Impact

| Task | Metric | Est. Score Change |
|------|--------|-------------------|
| Task 1 (Remove ScrollTrigger) | TBT −399ms | +5–8 pts |
| Task 2 (Non-blocking fonts) | FCP −650ms | +4–6 pts |
| Task 3 (WebP background) | SI/LCP improvement | +2–3 pts |
| Task 4 (Defer bsport) | TBT −1069ms | +8–12 pts |
| Task 5 (Image dimensions) | Minor CLS | +0–1 pts |
| Task 6 (Color contrast) | Accessibility +4pts | accessibility only |
| Task 7 (Keystatic CSS) | FCP marginal | +1–2 pts |
| Task 8 (Responsive images) | SI improvement | +1–2 pts |
| Task 10 (TTFB) | FCP/LCP −500ms+ | +6–10 pts |

**Conservative estimate after Tasks 1–4:** performance score moves from **60 → ~78–83**
**With all tasks:** estimated **83–88**, potential 90+ if TTFB is resolved

---

## Files to Be Modified

| File | Tasks |
|------|-------|
| `src/components/blocks/FeatureGridBlock.astro` | Task 1 |
| `src/layouts/BaseLayout.astro` | Task 2, Task 7 |
| `src/content/pages/de/home.md` | Task 3 |
| `src/content/pages/en/home.md` | Task 3 |
| `src/components/integrations/BsportLeadCapture.astro` | Task 4 |
| `src/components/integrations/BsportCalendar.astro` | Task 4 (if applicable) |
| `src/components/integrations/BsportPasses.astro` | Task 4 (if applicable) |
| `src/components/integrations/BsportSubscription.astro` | Task 4 (if applicable) |
| `src/components/common/Footer.astro` | Task 5, Task 6 |
| `src/components/common/Header.astro` | Task 5 |
| `src/components/blocks/hero/HeroSplitGrid.astro` | Task 6, Task 8 |
| `deploy/nginx/eosclub-staging.conf` | Task 9, Task 10 |
| `deploy/nginx/eosclub.conf` | Task 9 |
