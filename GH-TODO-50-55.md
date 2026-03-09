# GitHub Issues #50-55

---

## Issue #50

**Title:** Logo wordmark: use Geist Sans Bold uppercase for EOS CLUB everywhere

**Description:**

## Summary
Change the logo wordmark typography everywhere `EOS CLUB` appears to **Geist Sans, Bold, UPPERCASE**.

## Scope
- Header logo text (desktop + mobile)
- Footer logo text
- Any additional components/pages where `EOS CLUB` appears as text (not image asset)
- Keep existing logo icon/image usage intact unless text styling is currently coupled

## Implementation notes
- Use project font token (`font-sans`) with bold weight
- Ensure uppercase styling is applied consistently
- Avoid hardcoded font stacks if token/class exists

## Acceptance criteria
- [ ] All `EOS CLUB` text logos use Geist Sans Bold uppercase
- [ ] No remaining serif logo text in header/footer/mobile
- [ ] Visual consistency across DE + EN routes

---

## Issue #51

**Title:** Brand accent update: switch highlight/red color to #F70D0D

**Description:**

## Summary
Update the highlight/red accent color to **`#F70D0D`**.

## Scope
- Replace prior accent/red highlight usages where brand accent is intended
- Update design token source of truth (Tailwind/config tokens)
- Keep color usage rules consistent (accent for highlights/interactive emphasis, not body text)

## Implementation notes
- Prefer updating token definitions so components inherit automatically
- Update gradient definitions if they depend on the old accent
- Validate contrast/accessibility for key interactive states

## Acceptance criteria
- [ ] Accent token value is `#F70D0D`
- [ ] UI highlights/buttons/links using accent reflect new color
- [ ] No stale primary accent value remains where brand accent should apply

---

## Issue #52

**Title:** Update design references for new logo font + #F70D0D accent

**Description:**

## Summary
Update documentation references to reflect:
1) logo wordmark typography = Geist Sans Bold uppercase
2) highlight/red accent color = `#F70D0D`

## Files to update
- `references/design_system.html`
- `references/style_guide.md`

## Required updates
- Revise any typography guidance/examples for EOS CLUB wordmark
- Revise accent color values and related references/labels
- Keep docs internally consistent with implementation tokens

## Acceptance criteria
- [ ] Both files updated with new logo font guidance
- [ ] Both files updated with `#F70D0D` as highlight/red
- [ ] No contradictions between docs and current design tokens

---

## Issue #53

**Title:** Move bsport calendar from Events to Kurse/Classes

**Description:**

## Summary
Move the **bsport calendar** from **Events** to **Kurse/Classes**.

## Scope
- Remove calendar block/widget from Events page
- Add calendar block/widget to Kurse (DE) / Classes (EN)
- Preserve existing widget config/company ID/integration behavior

## Implementation notes
- Keep bilingual routing/content mapping aligned (`kurse.md` ↔ `classes.md`)
- Ensure block dispatchers and content schemas remain valid
- Verify no orphaned references in Events content

## Acceptance criteria
- [ ] Events page no longer shows bsport calendar
- [ ] Kurse/Classes page shows bsport calendar correctly
- [ ] Works in both DE and EN

---

## Issue #54

**Title:** Events page: add more existing blocks with dummy content

**Description:**

## Summary
Add more content flexibility to the **Events** page by inserting additional existing blocks with dummy content.

## Scope
- Use already-supported block types (no brand-new block needed)
- Add several meaningful sections (e.g., intro content, feature grid, FAQ, CTA)
- Populate with placeholder/dummy copy that matches tone

## Implementation notes
- Reuse existing discriminated block schema shape
- Keep CMS schema compatibility and route rendering intact
- Prefer section names consistent with project naming conventions

## Acceptance criteria
- [ ] Events page includes multiple additional existing blocks
- [ ] Dummy content is present and renderable
- [ ] Content editable via existing CMS flow

---

## Issue #55

**Title:** Rename Wellness to B2B in nav + add DE/EN dummy B2B content

**Description:**

## Summary
Rename navigation label **Wellness** → **B2B** (header, footer, mobile), and create dummy bilingual B2B page content based on pitch doc.

## Source doc
- `plans/b2b-room-rental-pitch.md`

## Scope
- Update nav labels/links where Wellness currently appears
- Create/replace page content for DE + EN B2B page variant
- Base dummy copy on room-rental B2B offer messaging in the pitch

## Implementation notes
- Maintain DE/EN i18n slug pairing correctness
- Ensure `translationSlug` mapping remains valid both directions
- Include core sections: summary, target segments, offer model, CTA

## Acceptance criteria
- [ ] Wellness label replaced by B2B in header/footer/mobile
- [ ] DE + EN B2B content exists with coherent dummy copy
- [ ] Routing and language switch continue to work correctly
