---
name: tailwind-v4-migration
description: This skill should be used when a frontend agent needs to understand breaking changes between Tailwind CSS v3 and v4, or when performing a migration to v4.
---

# Tailwind CSS v4 Migration Skill

This skill provides comprehensive knowledge and workflows for transitioning from Tailwind CSS v3.x to v4.x. It ensures that the agent is aware of silent visual regressions (like scale shifts) and architectural changes (CSS-first configuration).

## When to Use

- When asked to "upgrade Tailwind" or "migrate to v4".
- When writing new Tailwind code in a v4 project to ensure modern patterns are used.
- When debugging visual issues in a project that recently upgraded to v4.
- When auditing a codebase for deprecated v3 patterns (like `bg-opacity-*`).

## How to Use

### 1. Consult the Breaking Changes Reference
Read [`references/breaking-changes.md`](.kilocode/skills/tailwind-v4-migration/references/breaking-changes.md) to understand the full scope of API changes, scale shifts, and removed features. This is the "source of truth" for the migration.

### 2. Follow the Migration Checklist
Use [`references/migration-checklist.md`](.kilocode/skills/tailwind-v4-migration/references/migration-checklist.md) as a step-by-step guide when performing an actual upgrade. It covers dependency updates, toolchain config, and template auditing.

### 3. Key Workflow: Auditing for Scale Shifts
One of the most critical tasks is identifying "silent" regressions.
- Search for `shadow-sm`, `shadow`, `rounded-sm`, `rounded`, `blur-sm`, and `blur`.
- Apply the mapping found in the breaking changes reference to maintain the original visual design.

### 4. Key Workflow: CSS-First Configuration
- Move theme extensions from `tailwind.config.js` to the `@theme` block in the main CSS entry point.
- Convert JS-based theme values to CSS variables (e.g., `theme('colors.blue.500')` → `var(--color-blue-500)`).

## Core Principles

- **CSS-First:** v4 prioritizes CSS over JavaScript configuration.
- **Scale Awareness:** Be vigilant about the 1-step downward shift in `shadow`, `rounded`, and `blur` scales.
- **Modern Modifiers:** Use the slash syntax (`bg-black/50`) instead of separate opacity utilities.
- **Automatic Content:** Trust the automatic content detection unless specific exclusions are required via `@source`.
