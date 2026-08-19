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
  // Astro's default is ./node_modules/.astro, and `npm ci` deletes node_modules
  // wholesale — so before this line every CI build re-encoded every variant from
  // scratch. Verified on issue #3: 44 cache files before `npm ci`, directory gone
  // after. setup-node's `cache: npm` does not help; it caches ~/.npm, not
  // node_modules. Moving the directory out is what lets actions/cache restore it
  // (see .github/workflows/deploy.yml), and the cache is content-addressed per
  // variant, so a restore-keys prefix match gives partial reuse: add a Project
  // and only that Project's variants encode.
  cacheDir: './.astro-cache',

  // Delivery configuration. The findings are in issue #3 and deliberately NOT in
  // docs/asset-delivery.md, which specifies the committed export and stops there.
  image: {
    // Astro 7 defaults `layout` to 'none', which emits NO srcset and a single
    // width — so an image-heavy site ships one size to every device unless this
    // is set. Both routes state their own layout explicitly; this is the safety
    // net for the next component that forgets to.
    layout: 'constrained',

    // Trimmed from the 8-width LIMITED_RESOLUTIONS default. The top breakpoint
    // sits below the 3200 px committed source on purpose, so 2560 is a real
    // downscale and there is headroom to raise it without re-exporting.
    //
    // Variants per image is the multiplicative lever on build cost, and the
    // count is now 679, not the ~295 this comment used to state. Two things
    // moved it: the Frames gained an AVIF tier alongside WebP, and the tall
    // ladder gained a 768 rung. A COLD build of that is 7m11s on a CI runner,
    // which is why .github/workflows/deploy.yml carries timeout-minutes: 20 and
    // why its cache key hashes this file. Changing anything here changes what
    // gets encoded, so the key has to see it — read the comment on that step
    // before editing the ladders.
    breakpoints: [640, 960, 1280, 1920, 2560],

    // Rendered Assets are styled here, not by Astro. The data-astro-image-*
    // attributes still ship as hooks.
    responsiveStyles: false,

    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        // PER-FORMAT quality, never a single `quality` prop. One number across
        // formats pushes AVIF to q80, where it is LARGER than the WebP it is
        // supposed to undercut — the tier ordering silently inverts and nothing
        // reports it. sharp's own defaults are already per-format (AVIF 50,
        // WebP 80) and these restate them rather than relying on them.
        //
        // NOTE the schema for this block is z.record(z.string(), z.any()) —
        // unvalidated. A typo like `qualtiy: 50` is accepted and ignored with no
        // build error, so changes here are confirmed by looking at emitted file
        // sizes, not by reading the config back.
        avif: { quality: 50, effort: 4 },
        webp: { quality: 80, effort: 4 },
        jpeg: { quality: 80, mozjpeg: true },
      },
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
