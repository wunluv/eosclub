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
      dedupe: ['react', 'react-dom', '@keystar/ui', '@keystatic/core/ui'],
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
