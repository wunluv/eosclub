import type { ImageMetadata } from 'astro';

// Import all optimized WebP assets from src/assets/
import tiled_bw_yoga_closeup_1 from '../assets/tiled_bw_yoga_closeup_1.webp';
import tiled_bw_red_light_therapy1 from '../assets/tiled_bw_red_light_therapy1.webp';
import tiled_bw_theme_calisthenics from '../assets/tiled_bw_theme_calisthenics.webp';
import tiled_bw_red_light_therapy2 from '../assets/tiled_bw_red_light_therapy2.webp';
import yoga_studio from '../assets/yoga_studio.webp';
import horizontal_theme_yoga from '../assets/horizontal_theme_yoga.webp';
// Issue #67: High-traffic route images
import theme_yoga from '../assets/theme_yoga.webp';
import bg_14_gradient from '../assets/14_bg_gradient.webp';
import tiled_infrared_therapy_studio from '../assets/tiled_infrared_therapy_studio.webp';
import infrared_therapy_studio from '../assets/infrared_therapy_studio.webp';
import tiled_theme_pilates from '../assets/tiled_theme_pilates.webp';
import tiled_theme_taichi from '../assets/tiled_theme_taichi.webp';
import tiled_yoga_closeup_1 from '../assets/tiled_yoga_closeup_1.webp';
import theme_barre from '../assets/theme_barre.webp';
import theme_pilates from '../assets/theme_pilates.webp';
import horizontal_yoga_closeup_3 from '../assets/horizontal_yoga_closeup_3.webp';
import yoga_closeup_1 from '../assets/yoga_closeup_1.webp';
import yoga_closeup_2 from '../assets/yoga_closeup_2.webp';
import yoga_closeup_3 from '../assets/yoga_closeup_3.webp';
import bw_horizontal_theme_barre from '../assets/bw_horizontal_theme_barre.webp';
import tiled_theme_calisthenics from '../assets/tiled_theme_calisthenics.webp';
import theme_calisthenics from '../assets/theme_calisthenics.webp';

// Registry mapping legacy public paths to imported ImageMetadata
const IMAGE_REGISTRY: Record<string, ImageMetadata> = {
  '/assets/tiled_bw_yoga_closeup_1.png': tiled_bw_yoga_closeup_1,
  '/assets/tiled_bw_red_light_therapy1.jpeg': tiled_bw_red_light_therapy1,
  '/assets/tiled_bw_theme_calisthenics.png': tiled_bw_theme_calisthenics,
  '/assets/tiled_bw_red_light_therapy2.jpeg': tiled_bw_red_light_therapy2,
  '/assets/yoga_studio.jpg': yoga_studio,
  '/assets/horizontal_theme_yoga.png': horizontal_theme_yoga,
  // Issue #67 mappings
  '/assets/theme_yoga.png': theme_yoga,
  '/assets/14_bg_gradient.jpg': bg_14_gradient,
  '/assets/tiled_infrared_therapy_studio.png': tiled_infrared_therapy_studio,
  '/assets/infrared_therapy_studio.png': infrared_therapy_studio,
  '/assets/tiled_theme_pilates.png': tiled_theme_pilates,
  '/assets/tiled_theme_taichi.png': tiled_theme_taichi,
  '/assets/tiled_yoga_closeup_1.png': tiled_yoga_closeup_1,
  '/assets/theme_barre.png': theme_barre,
  '/assets/theme_pilates.png': theme_pilates,
  '/assets/horizontal_yoga_closeup_3.png': horizontal_yoga_closeup_3,
  '/assets/yoga_closeup_1.png': yoga_closeup_1,
  '/assets/yoga_closeup_2.png': yoga_closeup_2,
  '/assets/yoga_closeup_3.png': yoga_closeup_3,
  '/assets/bw_horizontal_theme_barre.png': bw_horizontal_theme_barre,
  '/assets/tiled_theme_calisthenics.png': tiled_theme_calisthenics,
  '/assets/theme_calisthenics.png': theme_calisthenics,
};

/**
 * Resolve a legacy image path string to an optimized ImageMetadata object.
 * Returns null if no optimized version exists (caller should fall back to original).
 */
export function resolveImage(imagePath: string): ImageMetadata | null {
  return IMAGE_REGISTRY[imagePath] ?? null;
}

/**
 * Get all registered image paths (useful for debugging/migration tracking)
 */
export function getRegisteredPaths(): string[] {
  return Object.keys(IMAGE_REGISTRY);
}
