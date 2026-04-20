---
description: Chronological record of production incidents. Append new entries at top.
---

## 2026-04-20 — Site-wide 404 (Keystatic content broke build)

**Duration:** Unknown downtime (client edits Apr 16, discovered Apr 20)

**Symptoms:** All pages on eos-club.de returning 404. `dist/` directory missing on server.

**Root cause:** Client edited Studio page via Keystatic Cloud (commit `252451b`). Added two new `InteractiveListBlock` items ("EOS CLUB Behandlungsräume", "Umkleide & Dusche") without providing `image` field. Zod schema had `image: z.string()` (required). Build failed, rebuild script had already cleared `dist/`, nginx served 404.

**Trigger commits (Keystatic Cloud):**
- `252451b` — studio.md: added items without images (breaker)
- `1b7adf7` — studio.md: content rewrites
- `bdede50`, `3f21e88` — team.md: removed cmsSlug, content rewrites (harmless)
- `531a4eb`, `e720e2c`, `7e6e688` — home.md: content rewrites (harmless)
- `2a234fd`, `a05da43` — kurse.md: content rewrites (harmless)

**Fix:** 3 files changed (commit `6c7ffb5`):
1. `src/content/config.ts` — `image: z.string()` → `z.string().optional()`
2. `keystatic.config.ts` — label updated to indicate optional
3. `src/components/blocks/InteractiveListBlock.astro` — graceful degradation for text-only items (no broken images, desktop hover panel only cycles items with images, GSAP skips imageless items)

**Verification:** All pages returning 200 after deploy. Build time ~16s.

**Notes:**
- Also found garbled text in team.md: `Du kannst直接在` (Chinese chars in German). Flagged to San for client communication.
- Trailing spaces in some string fields (harmless).
- This is a systemic risk: Keystatic Cloud allows saves that break Zod schemas. Consider adding validation hooks or pre-build checks.
