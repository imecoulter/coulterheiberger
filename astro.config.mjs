// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://coulterheiberger.com',
  // Static output, no adapter. See docs/adr/0001-astro-static-on-cloudflare-workers.md
  build: {
    format: 'directory',
  },
});
