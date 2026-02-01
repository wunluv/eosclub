---
description: Create a new color palette based on an image/screenshot
arguments:
    - ImageName
---

Create a new color palette:
Include:

- extract and design a cohesive colour palette that reflects its dominant and secondary tones
- Provide 10–14 colours total:
-- 4–6 core colours matching the most prominent hues
-- 3–5 supporting accent colours drawn from subtle transitions in the gradient
-- 3–4 very complimentary light, desaturated “background wash” hues suitable for large UI backgrounds
-- Ensure the background hues are soft, low-saturation variants that preserve the image’s mood and remain readable under typical UI text
-- For each colour, output the name, HEX, RGB, and a short note on best use example: primary, secondary, accent, background, text
-- include 2 recommended text colours (one dark, one light) that pair well with the background hues

Output as:
- clean JSON palette_[name].json
- html example of palette in use