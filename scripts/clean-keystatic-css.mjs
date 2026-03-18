#!/usr/bin/env node
/**
 * Post-build cleanup script.
 * Removes keystatic-astro-page.css references from all HTML files in dist/client/
 * This prevents unexpired admin UI CSS from loading on public pages.
 */

import fs from 'fs';
import path from 'path';

const DIST_CLIENT = './dist/client';
const CSS_PATTERN = /\s*<link[^>]*href="[^"]*keystatic-astro-page[^"]*"[^>]*>/g;

function scanDir(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath, callback);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      callback(fullPath);
    }
  }
}

console.log('[clean-keystatic-css] Starting cleanup...');

try {
  let count = 0;
  scanDir(DIST_CLIENT, (htmlFile) => {
    const content = fs.readFileSync(htmlFile, 'utf-8');
    const cleaned = content.replace(CSS_PATTERN, '');

    if (cleaned !== content) {
      fs.writeFileSync(htmlFile, cleaned, 'utf-8');
      count++;
      const relPath = path.relative(process.cwd(), htmlFile);
      console.log(`[clean-keystatic-css] ✓ ${relPath}`);
    }
  });

  console.log(`[clean-keystatic-css] Completed. Updated ${count} files.`);
} catch (err) {
  console.error('[clean-keystatic-css] ERROR:', err.message);
  process.exit(1);
}
