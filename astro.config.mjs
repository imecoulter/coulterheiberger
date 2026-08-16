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
  vite: {
    build: {
      // Fonts are NEVER base64-inlined. Vite's assetsInlineLimit defaults to
      // 4096 B, and the mono subset was 4,020 B — 76 bytes under — so without
      // this it silently became a data: URI while the display face stayed a
      // file. That asymmetry was a threshold accident, not a decision.
      //
      // The mono subset is now 5,228 B and clears that threshold on its own, so
      // this callback no longer changes today's output. KEEP IT ANYWAY: it went
      // from 76 bytes under the line to 1,132 over on one charset edit, and the
      // failure mode is silent — nothing warns you, the bytes just move onto
      // the document's critical path. This states the rule instead of relying
      // on a file size to keep satisfying it by accident.
      //
      // It also fails in the direction issue #21 measured. On `/` the LCP
      // element is the <h1>, a text-LCP page, where font bytes cost nothing:
      // the fallback paint IS the LCP and the swap registers no later
      // candidate. Base64 in the document moves those bytes onto the critical
      // path, delaying first paint — and base64 of already-brotli-compressed
      // woff2 inflates ~33% and barely gzips, so it is the expensive way to
      // save one request.
      //
      // Returning undefined for everything else keeps Vite's default logic.
      assetsInlineLimit: (filePath) => (filePath.endsWith('.woff2') ? false : undefined),
    },
  },
  // Static output, no adapter. See docs/adr/0001-astro-static-on-cloudflare-workers.md
  build: {
    format: 'directory',
    // Measured on issue #11: the real Datum page is 4,263 B of CSS, just over
    // Vite's 4 KB inline threshold, so 'auto' would ship it as a separate
    // render-blocking request. Inlining removes one RTT from the LCP Path.
    inlineStylesheets: 'always',
  },
});
