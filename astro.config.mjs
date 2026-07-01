// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://canopyseeds.com',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'zh-hans', 'ja', 'pt'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', es: 'es', 'zh-hans': 'zh-hans', ja: 'ja', pt: 'pt' },
      },
    }),
  ],
});
