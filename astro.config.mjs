// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://coulterheiberger.com',
  // Static output, no adapter. See docs/adr/0001-astro-static-on-cloudflare-workers.md
  build: {
    format: 'directory',
    // Measured on issue #11: the real Datum page is 4,263 B of CSS, just over
    // Vite's 4 KB inline threshold, so 'auto' would ship it as a separate
    // render-blocking request. Inlining removes one RTT from the LCP Path.
    inlineStylesheets: 'always',
  },
});
