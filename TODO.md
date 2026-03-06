# EOS CLUB — TODO / Known Issues

## 🔴 Active Issues

### cmsSlug Field Allows Accidental Page Renames in Keystatic

**Date:** 2026-03-06
**Status:** Not yet fixed
**Risk:** Medium — Editors can accidentally delete pages

**Problem:**
The `cmsSlug` field in Keystatic is configured as the `slugField` for the Pages collection. When editors change this field, Keystatic treats it as a file rename operation, which:
- Creates a new file with the new name
- Deletes the old file
- Results in data loss (the original page is gone)

**Incident:** Client renamed `wellness.md` → `Studioräume.md` by editing the cmsSlug field in Keystatic. The original `wellness.md` page was deleted.

**Recommended Fix:**

1. In `keystatic.config.ts`, **remove** the `slugField` configuration:
   ```typescript
   // BEFORE (line 13):
   slugField: 'cmsSlug',

   // AFTER:
   // slugField removed - Keystatic will derive slug from filename
   ```

2. Make `cmsSlug` field **read-only** as a backup:
   ```typescript
   // Line 27:
   cmsSlug: fields.text({
     label: 'CMS Slug (internal - do not change)',
     readOnly: true,
   }),
   ```

**Alternative (if field should be hidden entirely):**
   ```typescript
   cmsSlug: fields.text({
     label: 'CMS Slug (internal)',
     hidden: true,
   }),
   ```

**Why this works:**
- Without `slugField`, Keystatic uses the actual filename as the slug
- Editors cannot accidentally rename files through the UI
- The cmsSlug field (if kept visible) becomes informational only

---

### FeatureGridBlock `icon` Field Not Validated in Keystatic — Build Breaks When Left Empty

**Date:** 2026-03-06
**Status:** Partial fix applied (icons restored); schema hardening pending
**Risk:** High — Any editor can clear an icon field and the build fails immediately

**Problem:**
The `icon` field in `FeatureGridBlock` items is declared as `z.string()` (required, no default) in `src/content/config.ts`. The Keystatic `fields.text()` for this field has no `defaultValue` and no validation. When an editor saves a `FeatureGridBlock` item without filling in the icon field, the YAML is written without the `icon` key, which causes Astro's content collection sync to throw `InvalidContentEntryDataError` at build time and aborts the entire build.

**Incident:** Client edited the `de/kurse` page via Keystatic and saved the FeatureGridBlock items without icon values. All 6 items had `icon: Required` errors, breaking the production build.

**Immediate fix applied:**
Icons manually restored in `src/content/pages/de/kurse.md`:
- Vinyasa Flow → `wind`
- Pilates → `target`
- Mobility & Strength → `activity`
- Calisthenics Circuit → `layers`
- Yin Restore → `moon`
- Tai Chi → `feather`

**Recommended Prevention Fix:**

1. In `src/content/config.ts`, make `icon` optional with a fallback default so an empty value never hard-fails:
   ```typescript
   // Line 67 — BEFORE:
   icon: z.string(),

   // AFTER:
   icon: z.string().optional().default('help'),
   ```

2. In `keystatic.config.ts`, add a `defaultValue` and descriptive hint to the icon field:
   ```typescript
   // Line 101 — BEFORE:
   icon: fields.text({ label: 'Feather Icon Name' }),

   // AFTER:
   icon: fields.text({
     label: 'Feather Icon Name',
     description: 'Required. Use a Feather icon name (e.g. wind, target, activity, layers, moon, feather, zap, heart). Leave blank to show a fallback (?) icon.',
     defaultValue: 'help',
   }),
   ```

**Why this works:**
- `z.string().optional().default('help')` means a missing icon key in YAML is coerced to `'help'` before validation, so the build never fails
- `FeatureGridBlock.astro` already has a runtime fallback: `feather.icons[item.icon]?.toSvg() || feather.icons.help.toSvg()` — this is consistent
- The `defaultValue` in Keystatic pre-fills the field for new items, reducing the chance of an editor leaving it blank
- The `description` text shows inline in the CMS editor as a hint

---

## ✅ Completed Tasks

- [x] Investigate how client created "Studioräume" page via Keystatic
- [x] Identify root cause: cmsSlug field + slugField config allows renaming

---

## 📋 Backlog

- [ ] Apply the cmsSlug fix to keystatic.config.ts
- [ ] Test that page renames no longer possible via UI
- [ ] Verify existing pages still load correctly
- [ ] Consider restoring wellness.md page content (was lost in rename)
- [ ] Harden FeatureGridBlock icon field: make `icon` optional with `default('help')` in `src/content/config.ts` line 67
- [ ] Add `defaultValue: 'help'` and description hint to FeatureGridBlock icon field in `keystatic.config.ts` line 101
