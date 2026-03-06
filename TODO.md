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

## ✅ Completed Tasks

- [x] Investigate how client created "Studioräume" page via Keystatic
- [x] Identify root cause: cmsSlug field + slugField config allows renaming

---

## 📋 Backlog

- [ ] Apply the cmsSlug fix to keystatic.config.ts
- [ ] Test that page renames no longer possible via UI
- [ ] Verify existing pages still load correctly
- [ ] Consider restoring wellness.md page content (was lost in rename)
