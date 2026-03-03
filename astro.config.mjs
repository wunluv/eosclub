import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import node from '@astrojs/node';

// https://astro.build/config
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
  site: 'https://eos-club.de',
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: {
      prefixDefaultLocale: false
    }
  },
  integrations: [react(), tailwind(), sitemap(), keystatic()]
});
