// Performance gate for the budget in docs/adr/0002-graphics-isolation-and-performance-budget.md
//
// Runs against the built ./dist over a local static server, so a regression
// blocks the deploy rather than being discovered in production.
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
      },
    },
  },
};
