// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://canopyseeds.com',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'zh-Hans', 'ja', 'pt'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [mdx()],
});
