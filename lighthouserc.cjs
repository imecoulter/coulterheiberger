// Performance and accessibility gate, for the budget in
// docs/adr/0002-graphics-isolation-and-performance-budget.md and the bar in
// docs/adr/0003-accessibility-bar.md.
//
// Runs against the built ./dist over a local static server, so a regression
// blocks the deploy rather than being discovered in production.
//
// The static server discovers EVERY .html under dist/ and audits all of them
// (@lhci/cli/src/collect/fallback-server.js). 404.html is already in scope, and
// a future page enrols itself with no change here. There is deliberately no
// assertMatrix: one bar across all URLs, with no relaxation for 404.html.
//
// Mobile form factor is the condition ADR-0002 names. Do not switch it to desktop.
//
// throttlingMethod is 'devtools' — real request-level slow-4G throttling — NOT
// Lighthouse's default 'simulate'. Two reasons, in order of weight:
//
//   1. The LCP Path budget is unmeasurable under simulation. Lantern's observed
//      network timeline collapses to a few milliseconds, so every request appears
//      to finish before LCP and scripts/assert-lcp-path.mjs would just be
//      re-reporting total page weight. Measured: 42,472 B real vs 288,824 B total
//      on the same fixture, 6.8x apart (issue #5).
//   2. ADR-0002 says "throttled 4G". 'devtools' throttles the network for real;
//      'simulate' models it. The literal reading is the one we now run.
//
// The cost is meant to be variance, paid for with numberOfRuns: 3 and a real
// median. Measured on this repo's own dist, it is not even that: LCP across three
// devtools runs was 697/704/715ms (18ms spread) against 639/753/753ms under
// simulate (114ms). Do not switch it back.

module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      // Median of 3 — single runs are too noisy to gate on.
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless=new',
        throttlingMethod: 'devtools',
      },
    },
    assert: {
      // LHCI's default is 'optimistic', which for a max* assertion takes the BEST
      // of the 3 runs, not the median — so before this line the gate graded itself
      // on its most flattering run. Found by research on issue #5.
      aggregationMethod: 'median',
      assertions: {
        // ADR-0002: LCP < 2.5s on throttled 4G mobile.
        //
        // Re-baselined for devtools throttling in issue #13, and KEPT at 2500.
        // Under 'devtools' this is now the observed LCP rather than a lantern
        // estimate, so it means what the ADR says. What changed is the headroom:
        // devtools charges 562.5ms of latency per request (150ms RTT x 3.75) and
        // 1474.56 Kbps down, so LCP tracks hero bytes at ~189 B/ms off a ~1200ms
        // floor. Measured on a fixture with one parser-discovered hero:
        //
        //     hero over the wire   LCP (devtools)   LCP (simulate)
        //     100 KB               1747ms           1353ms
        //     200 KB               2293ms           1953ms
        //     300 KB               2871ms  FAIL     2405ms
        //     400 KB               3411ms  FAIL     2853ms  FAIL
        //
        // So 2.5s now binds at roughly 240 KB of hero, where under simulate it
        // bound at roughly 315 KB. This assertion, not the 500 KB one below, is
        // the constraint a hero image will actually hit first. See ADR-0002.
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],

        // ADR-0002: JS on non-Exhibit routes <= 50 KB. resource-summary rows carry
        // only transferSize, so this too is over-the-wire — the same unit the LCP
        // Path budget uses.
        //
        // BLIND SPOT, partly closed: resource-summary is built from network
        // records, so an inline <script> is not a request and does not appear here
        // at all — it is counted in the document row instead. The site's authored
        // JavaScript is inline (issue #12), so its 195 B still sits in the HTML
        // rather than in this row.
        //
        // This row read 0 — a gate passing vacuously — until the Cloudflare Web
        // Analytics beacon moved out of edge injection and into Base.astro
        // (ADR-0004). It now asserts a real ~11,340 B, 22% of the budget, on every
        // PR. The beacon counts here with no carve-out, deliberately: a future
        // React island prices itself against what the visitor already downloads,
        // not against code we happen to have written.
        //
        // PRE-COMMITMENT (ADR-0004): if this row goes red, the beacon goes. Not
        // this threshold, and not hero bytes.
        'resource-summary:script:size': ['error', { maxNumericValue: 51200 }],

        // ADR-0002's LCP Path budget is asserted by scripts/assert-lcp-path.mjs,
        // which sums only the bytes that land at or before LCP. Total page weight
        // is NOT that budget and is no longer asserted as if it were.
        //
        // It stays as a deliberately slack warn-level backstop: something the LCP
        // Path measure cannot see by construction — a below-fold payload that is
        // not streaming, a stray multi-megabyte asset — should still leave a mark.
        // Raising this number is cheap and means little; raising the two above it,
        // or the budget in assert-lcp-path.mjs, is not. See issue #13.
        'resource-summary:total:size': ['warn', { maxNumericValue: 2097152 }],

        // ---- accessibility (issue #35, ADR-0003) --------------------------
        //
        // WCAG AA is the named target. AAA was priced and REFUSED on design
        // fit, not skipped: 7:1 needs ~69% ink (day) / 70% (night) against
        // today's 58%, a visibly darker specification line. "Never considered"
        // and "considered and refused" read identically in a config file, and
        // only one is true here — the ADR says which.
        //
        // Gated at `error`, like every other check in deploy.yml. A `warn` row
        // gets read once and never again.
        //
        // Named audits AND a category score, which looks redundant and is not:
        // the named audits say WHAT broke, the score catches what nobody
        // anticipated. Several below are notApplicable today and cost nothing
        // until a form, an icon button or an image appears — which is exactly
        // when nobody is thinking about them. maxLength: 0 means zero failing
        // elements, not zero occurrences of the audit.
        //
        // A misspelled id does NOT silently pass: LHCI checks an implicit
        // `auditRan` assertion first and fails with "x is not a known audit"
        // (verified — `color-contrst` exits 1). So this list cannot rot into
        // decoration without CI saying so, which is why it is safe to name ten
        // audits rather than lean on the score alone.
        //
        // maxLength: 0 on a notApplicable audit PASSES — verified against both
        // routes, where four of these ten are notApplicable today. That is the
        // property that makes naming them cheap before the DOM has them.
        'color-contrast': ['error', { maxLength: 0 }],
        'link-in-text-block': ['error', { maxLength: 0 }],
        'heading-order': ['error', { maxLength: 0 }],
        'html-has-lang': ['error', { maxLength: 0 }],
        'document-title': ['error', { maxLength: 0 }],
        'meta-viewport': ['error', { maxLength: 0 }],
        'image-alt': ['error', { maxLength: 0 }],
        // Quoted like the rest, though it needs no quotes — these are audit ids,
        // not object keys, and one bare word in the column reads as a typo.
        'label': ['error', { maxLength: 0 }],
        'button-name': ['error', { maxLength: 0 }],
        'link-name': ['error', { maxLength: 0 }],

        // Backstop for the audits not named above. Measured at 1.0 on both
        // routes before this line was written, so it gates a property the site
        // already has rather than setting homework.
        //
        // READ THIS NUMBER HONESTLY: on these two pages a 1.0 rests on NINE
        // applicable audits out of 73 — the rest are notApplicable (54) or
        // manual (10). It catches contrast and missing names. It cannot see a
        // keyboard trap, and 10 manual audits are where one would live. A green
        // gate here is not a claim that the site is accessible. ADR-0003.
        'categories:accessibility': ['error', { minScore: 1 }],
      },
    },
  },
};
