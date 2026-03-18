import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import node from '@astrojs/node';

// https://astro.build/config
// output: 'static' + node adapter = hybrid mode:
//   - Static pages  → dist/client/   (served by Nginx)
//   - Keystatic SSR → dist/server/   (served by the Astro Node server)
// Nginx proxies /keystatic/* and /api/keystatic/* to the Node process.
//
// NOTE: Keystatic admin UI CSS (keystatic-astro-page.css) is removed from
// dist/client/ HTML files by the post-build cleanup script (scripts/clean-keystatic-css.mjs).
// This prevents 8.7KB of unused admin UI CSS from loading on public pages.
// Keystatic routes in dist/server/ still have full access via server rendering.
export default defineConfig({
  output: 'static',
  adapter: node({
    mode: 'standalone'
  }),
  vite: {
    resolve: {
      dedupe: ['react', 'react-dom', '@keystar/ui', '@keystatic/core/ui', '@keystatic/core'],
    },
    optimizeDeps: {
      // Pre-bundle Keystatic deps eagerly on startup to prevent Vite from
      // discovering them lazily mid-request, which causes "optimized dependencies
      // changed. reloading" and subsequent 404s on old chunk hashes.
      // NOTE: @keystar/ui has no root "." export — do NOT include it here.
      include: [
        'react',
        'react-dom',
        '@keystatic/core',
        '@keystatic/astro',
      ],
    },
    ssr: {
      noExternal: ['@keystatic/core', '@keystatic/astro', /^@keystar\/ui/],
    },
  },
  site: process.env.PUBLIC_SITE_URL || 'https://eos-club.de',
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: {
      prefixDefaultLocale: false
    }
  },
  integrations: [react(), tailwind(), sitemap(), keystatic()]
});
