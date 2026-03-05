import type { ImageMetadata } from 'astro';

// Import all optimized WebP assets from src/assets/
import tiled_bw_yoga_closeup_1 from '../assets/tiled_bw_yoga_closeup_1.webp';
import tiled_bw_red_light_therapy1 from '../assets/tiled_bw_red_light_therapy1.webp';
import tiled_bw_theme_calisthenics from '../assets/tiled_bw_theme_calisthenics.webp';
import tiled_bw_red_light_therapy2 from '../assets/tiled_bw_red_light_therapy2.webp';
import yoga_studio from '../assets/yoga_studio.webp';
import horizontal_theme_yoga from '../assets/horizontal_theme_yoga.webp';

// Registry mapping legacy public paths to imported ImageMetadata
const IMAGE_REGISTRY: Record<string, ImageMetadata> = {
  '/assets/tiled_bw_yoga_closeup_1.png': tiled_bw_yoga_closeup_1,
  '/assets/tiled_bw_red_light_therapy1.jpeg': tiled_bw_red_light_therapy1,
  '/assets/tiled_bw_theme_calisthenics.png': tiled_bw_theme_calisthenics,
  '/assets/tiled_bw_red_light_therapy2.jpeg': tiled_bw_red_light_therapy2,
  '/assets/yoga_studio.jpg': yoga_studio,
  '/assets/horizontal_theme_yoga.png': horizontal_theme_yoga,
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
