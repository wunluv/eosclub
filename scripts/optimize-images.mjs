// Image optimization script using sharp
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const assetsDir = './public/assets';

// Large images to convert to WebP (sorted by size)
const largeImages = [
  'warm_horizontal_theme_barre.png',
  'horizontal_theme_barre.png',
  'bw_horizontal_theme_barre.png',
  'horizontal_theme_yoga.png',
  'horizontal_yoga_closeup_3.png',
  'yoga_closeup_2.png',
  'yoga_closeup_1.png',
  'yoga_closeup_3.png',
  'yoga_studio_plan.jpg',
  'tiled_infrared_therapy_studio.png',
  'tiled_yoga_closeup_1.png',
  'tiled_theme_pilates.png',
  'tiled_theme_taichi.png',
  'tiled_theme_calisthenics.png',
  'tiled_emotional_calm_pilates.png',
  'tiled_bw_yoga_closeup_1.png',
  'tiled_bw_theme_calisthenics.png',
  'verticle_yoga_closeup_2.png',
  'infrared_therapy_studio.png',
  '14_bg_gradient_large.jpg',
  'theme_yoga.png',
  'theme_pilates.png',
  'theme_calisthenics.png',
  'v5_emotional_calm_pilates.png',
  'yoga_studio.jpg',
];

// Logo images to resize and convert
const logoImages = [
  { name: 'eos-logo-export_wb-white.png', maxWidth: 300 },
  { name: 'eos-logo-export_wb-red.png', maxWidth: 300 },
  { name: 'eos-logo-export_bm-black.png', maxWidth: 300 },
  { name: 'eos-logo-export_bm-white.png', maxWidth: 300 },
  { name: 'web-app-manifest-512x512.png', maxWidth: 128 }, // for header use
];

async function convertToWebP(filename) {
  const inputPath = path.join(assetsDir, filename);
  const outputPath = path.join(assetsDir, filename.replace(/\.(png|jpg|jpeg)$/i, '.webp'));

  if (!fs.existsSync(inputPath)) {
    console.log(`❌ ${filename} not found`);
    return;
  }

  try {
    const inputStats = fs.statSync(inputPath);
    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);

    const outputStats = fs.statSync(outputPath);
    const savings = ((inputStats.size - outputStats.size) / inputStats.size * 100).toFixed(1);

    console.log(`✅ ${filename} → ${path.basename(outputPath)} (${savings}% smaller)`);
  } catch (err) {
    console.error(`❌ Error converting ${filename}:`, err.message);
  }
}

async function resizeAndConvert(filename, maxWidth) {
  const inputPath = path.join(assetsDir, filename);
  const ext = path.extname(filename);
  const basename = path.basename(filename, ext);
  const outputPath = path.join(assetsDir, `${basename}-optimized.webp`);

  if (!fs.existsSync(inputPath)) {
    console.log(`❌ ${filename} not found`);
    return;
  }

  try {
    const inputStats = fs.statSync(inputPath);
    await sharp(inputPath)
      .resize(maxWidth, null, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(outputPath);

    const outputStats = fs.statSync(outputPath);
    const savings = ((inputStats.size - outputStats.size) / inputStats.size * 100).toFixed(1);

    console.log(`✅ ${filename} → ${basename}-optimized.webp (${maxWidth}px width, ${savings}% smaller)`);
  } catch (err) {
    console.error(`❌ Error processing ${filename}:`, err.message);
  }
}

async function main() {
  console.log('🖼️  Converting large images to WebP...\n');

  for (const img of largeImages) {
    await convertToWebP(img);
  }

  console.log('\n🎨 Optimizing logos...\n');

  for (const logo of logoImages) {
    await resizeAndConvert(logo.name, logo.maxWidth);
  }

  console.log('\n✨ Done! Remember to update your content files to use the new .webp versions.');
}

main();
