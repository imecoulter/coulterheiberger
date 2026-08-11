// Performance gate for the budget in docs/adr/0002-graphics-isolation-and-performance-budget.md
//
// Runs against the built ./dist over a local static server, so a regression
// blocks the deploy rather than being discovered in production.
//
// LHCI's default preset is mobile with simulated slow-4G throttling, which is
// the condition ADR-0002 names. Do not switch it to desktop.

module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      // Median of 3 — single runs are too noisy to gate on.
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless=new',
      },
    },
    assert: {
      assertions: {
        // ADR-0002: LCP < 2.5s on throttled 4G mobile.
        'largest-contentful-paint': ['error', { maxNumericValue: 1 }],

        // ADR-0002: JS on non-Exhibit routes <= 50 KB.
        'resource-summary:script:size': ['error', { maxNumericValue: 51200 }],

        // ADR-0002: LCP Path <= 500 KB.
        //
        // CAVEAT: total page weight is only a valid proxy for the LCP Path
        // while the site ships no Post-LCP Media. The moment a streamed scroll
        // sequence or below-fold video lands, this assertion will fail for a
        // page that is actually within budget. At that point this must become
        // an LCP-Path-specific measure, not a total. Do not simply raise the
        // number to make it pass -- that silently deletes the budget.
        'resource-summary:total:size': ['error', { maxNumericValue: 512000 }],
      },
    },
  },
};
