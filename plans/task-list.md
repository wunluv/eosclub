# Task Plan: EOS CLUB Updates

## 1. Navigation Enhancements
- [ ] **Desktop Menu Sliding Underline**:
  - Add a shared underline element in `src/components/common/Header.astro`.
  - Use GSAP to animate its position and width based on `mouseenter` events on nav links.
  - Ensure it returns to the active link position on `mouseleave`.
- [ ] **Fix Home Link Active State**:
  - Update `isActive` logic in `src/components/common/Header.astro` to ensure the Home link only shows active when the path is exactly `/` or `/en/`.

## 2. Mobile Menu Improvements
- [ ] **Keep Branding Visible**:
  - Modify `src/components/common/Header.astro` to ensure the "EOS CLUB" text/logo remains visible or is correctly positioned when the mobile menu is open.
- [ ] **Full Screen Overlay & Style Update**:
  - Update `mobile-overlay` and `mobile-sidebar` classes in `src/components/common/Header.astro`.
  - Remove `backdrop-blur-sm` and `bg-eos-contrast/20`.
  - Ensure the sidebar/overlay covers the full screen.

## 3. UI Refinements
- [ ] **User Login Button Styling**:
  - Update the user login link in `src/components/common/Header.astro` to have a red background (`bg-eos-accent`) and white text/icon, similar to the "Book" button.
- [ ] **Greyscale Image Class**:
  - Add `.img-greyscale` class to `src/styles/global.css` using `filter: grayscale(100%)`.
  - Apply this class to Hero images and other relevant image components.

## 4. Interactive List Updates (`src/components/blocks/InteractiveListBlock.astro`)
- [ ] **Update Content**: Add "Tai Chi" and "Barre" to the items list (likely in `src/content/pages/de/home.md`).
- [ ] **Styling**:
  - Force images to be square and greyscale.
  - Update "What we offer" (title) to uppercase and `text-eos-accent`.
- [ ] **Hover Interactions**:
  - Background change to `heat-gradient`.
  - Text color change to mineral white (`text-eos-base`).
  - Slide/expand effect for descriptions (initially hidden).

## 5. Bsport Integrations
- [ ] **Footer Subscription**: Add `BsportLeadCapture.astro` to `src/components/common/Footer.astro` with `fieldsType="firstNameAndEmail"`.
- [ ] **Pricing Page**: Add `BsportPasses.astro` and `BsportSubscription.astro` to `src/content/pages/de/preise.md` (and English equivalent).
- [ ] **Events Page**: Add `BsportCalendar.astro` to `src/content/pages/de/events.md` (and English equivalent).

---

## GitHub Issues to Create

1. `feat: implement sliding underline animation for desktop menu`
2. `fix: home link active state logic in navigation`
3. `ui: improve mobile menu visibility and overlay styling`
4. `ui: style user login button to match booking button`
5. `feat: add global greyscale image class and apply to heroes`
6. `feat: update InteractiveListBlock with new styles and hover effects`
7. `content: add Tai Chi and Barre to home page offerings`
8. `integration: add Bsport lead capture to footer`
9. `integration: add Bsport passes and subscriptions to pricing page`
10. `integration: add Bsport calendar to events page`
