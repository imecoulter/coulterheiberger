// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://coulterheiberger.com',
  integrations: [
    // Projects are MDX. Build-time only, zero client JS, so it costs the LCP
    // Path nothing. See docs/content-architecture.md §5.
    mdx(),
    sitemap({
      // The 404 page is not a route anyone should land on from a search result.
      filter: (page) => !page.endsWith('/404/'),
    }),
  ],
  // Static output, no adapter. See docs/adr/0001-astro-static-on-cloudflare-workers.md
  build: {
    format: 'directory',
    // Measured on issue #11: the real Datum page is 4,263 B of CSS, just over
    // Vite's 4 KB inline threshold, so 'auto' would ship it as a separate
    // render-blocking request. Inlining removes one RTT from the LCP Path.
    inlineStylesheets: 'always',
  },
});
