# Theme Upgrade Specification

This document outlines the planned, iterative changes to the EOS CLUB theme layout. Each task is defined sequentially.

## Task 1: General Layout Max-Width
**Goal:** Apply a sensible maximum width to the desktop version for all content areas (header, footer, and body content) without affecting background colors or images, which must continue to stretch 100% across the viewport.

**Implementation Details:**
- **Max-Width Definition:** Introduce a consistent max-width constraint for all main content containers. This will be achieved either by customizing the Tailwind `container` utility (e.g., setting a specific max-width like `1280px` or `1440px` instead of `1536px` on `2xl` screens) or by introducing a specific wrapper class (`max-w-7xl mx-auto`).
- **Header (`src/components/common/Header.astro`):** Keep the outer `<header>` at `w-full` to allow the `bg-white/80` backdrop-blur and bottom border to stretch fully. Ensure the inner `<div>` wrapper utilizes the max-width and `mx-auto` for centering.
- **Footer (`src/components/common/Footer.astro`):** Keep the outer `<footer>` stretching 100% with `bg-eos-contrast`. Apply the new max-width utility to the inner content grid.
- **Main Body Content:** Ensure all individual page sections or the `<main>` wrapper inside `src/layouts/BaseLayout.astro` respect this max-width for their text/content blocks, while allowing any section backgrounds (like Hero images or color strips) to stretch `w-full`.

---

## Task 2: Fix Desktop Navigation Overlap
**Goal:** Prevent the desktop top navigation items (Home, Studio, Kurse, etc.) from overlapping with the right-side actions (Book, Login, Language Switcher) when the viewport is reduced to medium sizes (e.g., tablet/laptop screens).

**Implementation Details:**
- **Adjust Breakpoints (`src/components/common/Header.astro`):** Change the visibility breakpoints for the desktop navigation and the right-side actions. Currently, they appear at the `md:` breakpoint (768px). We will delay their appearance until the `lg:` (1024px) or `xl:` (1280px) breakpoint, depending on the measured width of the navigation items.
- **Extend Mobile Menu:** Correspondingly, keep the mobile hamburger menu visible up to this new, larger breakpoint (e.g., change `md:hidden` on the hamburger button to `lg:hidden` or `xl:hidden`).
- **Layout Optimization (Optional but recommended):** Replace the strict `grid-cols-3` with a more flexible flexbox layout (`flex justify-between items-center`) for the header container. This ensures that the left, center, and right blocks naturally push against each other without rigid column constraints, allowing them to utilize available space more efficiently before hitting the breakpoint.

---

## Task 3: Hero Section Two-Column Split Layout
**Goal:** Redesign the Hero section into a two-column layout on desktop, featuring vertically stacked typography on the left and a dynamic 4-image collage on the right.

**Implementation Details:**
- **Layout Structure:** Convert the hero section container into a CSS grid (`grid-cols-1 lg:grid-cols-2` or similar) with appropriate gap spacing to separate the text content from the image collage.
- **Left Column (Typography & CTA):**
  - Implement a vertical flexbox stack (`flex flex-col items-start`).
  - Stack the Display Heading, Contrast Heading, and Sub Body Text with appropriate vertical spacing (`gap-y-4` or `gap-y-6`).
  - Add a primary CTA button ("Book Classes" / "Kurse Buchen") styled with the existing `.btn-primary` utility.
- **Right Column (Image Collage):**
  - Create a CSS grid or absolutely positioned container to arrange the 4 specified images into a visually appealing overlapping collage/masonry layout.
  - Images to include (to be used via Astro's standard `src` or standard asset paths):
    - `/assets/tiled_bw_yoga_closeup_1.png`
    - `/assets/tiled_bw_red_light_therapy1.jpeg`
    - `/assets/tiled_bw_red_light_therapy2.jpeg`
    - `/assets/tiled_bw_theme_calisthenics.png`
  - **Animations:**
    - Implement a subtle reveal/fade-in animation on load (e.g., using Tailwind's `animate-fade-in`, staggering the entrance of each image).
    - Add a subtle scroll-linked animation (e.g., a slight vertical parallax effect) as the user scrolls down the page, using either CSS scroll-driven animations or lightweight JavaScript intersection observers.

---
*(Awaiting Task 4...)*
