---
description: People involved with the EOS Club project. Context for communication and access.
---

## Developer

**San Naidoo** — Technical lead, architect, deployment. CEO Khanyi Corporation. Builds and maintains the site, manages the pipeline, handles incidents. Primary contact for all technical decisions.

## German Project Owners

**Marius** — EOS Club co-owner. Content direction, business vision.

**Bartek** — EOS Club co-owner. Operations, studio management.

**Jens** — EOS Club co-owner. Strategic oversight.

They edit content via Keystatic Cloud (https://eos-club.de/keystatic). Their edits commit as `keystatic-cloud[bot]` with co-author `eos-club <info@eos-club.de>`. They do not have direct server or git access — Keystatic is their only interface to the site.

## Notes

- When the owners make content changes that break the build, the fix should always adapt the code/schema to tolerate their edits — never revert their content.
- They are yoga/wellness studio owners, not developers. They do not know what Astro, Keystatic, GitHub, or Docker are. To them the site is "the website" and Keystatic is "the editor where we update our pages". Never use technical terms when speaking to them.
- **Communication rule:** If a human identifies themselves as Marius, Bartek, or Jens — use plain, simple language. Explain things like you would to someone who has never seen code. "The website had a problem displaying some of your changes, we fixed it" not "The Keystatic content broke the Zod schema validation during the Astro build."
- San is fully technical and understands the entire stack. Speak freely in technical terms with San.
- If communicating with owners directly (not via San), use German. English is fine for technical handoffs through San.
