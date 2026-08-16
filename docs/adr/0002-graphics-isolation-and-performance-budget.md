---
status: accepted
date: 2026-08-10
---

# The Ambient Layer is pre-rendered; Exhibits are isolated and gated

The site's premise is visual impact, which creates constant pressure to put live 3D everywhere. We separated the two things that pressure conflates — the site-wide **Ambient Layer** and per-project **Exhibits** — and bound each with a rule, because without them a portfolio built on visual impact reliably becomes a slow one.

## The rules

**The Ambient Layer is built from Rendered Assets.** The cohesive 3D visual identity — landing page, sub-pages, anywhere — is produced offline in a 3D authoring toolchain and shipped as images and video, including scroll-driven frame sequences. It is not live WebGL. This is not a limitation on where immersive visuals may appear or how immersive they may be; it constrains only how they are produced. Offline rendering is the strongest thing this portfolio has, and leading with real-time WebGL would compete on its weakest axis instead.

A live, hard-budgeted ambient canvas (~75 KB JS, no Drei, `prefers-reduced-motion` and mobile fallbacks required) is a deliberate future upgrade path, not a v1 option. Taking it is a decision that supersedes this ADR.

**Exhibits are isolated.** No heavy graphics runtime — Three.js, Cesium, or successor — may be imported from a shared layout, and none may load on initial page render. Each is confined to a route-scoped island, dynamically imported, behind a Gate. **Two WebGL contexts never coexist on one route.** That last clause is the one that matters: it is what prevents a future "put the globe next to the model viewer" from silently destroying the page.

**Mobile is never an afterthought.** Every Exhibit ships a poster image with tap-to-load, and runs degraded once loaded. Auto-initializing WebGL on a mid-tier phone produces a black rectangle and a bounce, and phones are how portfolio links actually get opened.

## The budget

Enforced in CI (Lighthouse CI, failing the build on regression). These are starting numbers to be tuned, not scripture — but a number that can be revised beats a number never set. The budget was deliberately restructured away from total transfer, which would have banned immersive Ambient Layers on every route:

| Tier | Budget |
| --- | --- |
| **LCP Path** — everything needed to paint hero content | ≤ 500 KB; LCP < 2.5s on throttled 4G mobile |
| **JS on non-Exhibit routes** | ≤ 50 KB |
| **Post-LCP Media** — rest of a scroll sequence, below-fold video | Uncapped total; must stream lazily, must never block interaction, must honour `prefers-reduced-motion`, and must be structurally `Save-Data`-safe (see below) |
| **Exhibits** | Uncapped; gated and route-scoped |

The LCP element is never a 3D canvas. It is a poster image or a static hero render.

**Every byte figure here is over the wire, after compression** — not uncompressed source size. Left unstated originally; settled in [issue #13](https://github.com/imecoulter/coulterheiberger-com/issues/13). Three reasons, and they agree: the budget exists to bound time-to-paint on a throttled link, and time is a function of what crosses the wire, not of what the bytes expand to; the JS row was already being enforced that way, because Lighthouse's `resource-summary` rows carry only `transferSize`, so the alternative reading would give one table two units; and it is the number the LHR actually publishes. In practice this bites hardest on HTML and CSS, which compress, and barely at all on JPEG, AVIF and WebP, which are already compressed — so the tier this defines loosest is the one whose bytes are almost entirely images anyway.

**`Save-Data` is honoured structurally, not by detection.** Settled in
[issue #12](https://github.com/imecoulter/coulterheiberger-com/issues/12), which found the original
row asked for something no code on this site can do. Static output means there is no server to vary
on the request header (ADR-0001), and the client-side signal is Chromium-only —
`navigator.connection.saveData` is Chrome 65+ / Edge 79+, `false` in both Firefox and Safari — while
Chrome removed Lite mode in Chrome 100, which was the only thing setting the header on Android. So
compliance is defined as what the page *sends*, not what it detects: below-fold imagery is
`loading="lazy"`, nothing preloads, nothing autoplays, and a visitor who scrolls nowhere fetches
nothing beyond the LCP Path. The rejected alternative was shipping JavaScript to make a page
lighter, for a signal most browsers never send. `prefers-reduced-motion` is unaffected — it is a
real, universally supported preference and is honoured as a first-class path (docs/styling.md).

**The timing half of the LCP Path row binds first, and by a wide margin.** Measured under real request-level slow-4G throttling (`throttlingMethod: 'devtools'`, the condition this ADR names), LCP tracks hero transfer bytes at ~189 B/ms off a ~1200 ms floor — one round trip for the document, another for the hero, at 562.5 ms of latency each. A single 300 KB hero lands at 2871 ms with nothing else on the page. **2.5s is reached at roughly 240 KB, less than half the 500 KB ceiling**, so a page cannot spend the byte budget without failing the timing budget first. That is not an artifact of the throttling method — under lantern simulation the crossover is ~315 KB, still well short of 500 KB. Treat 500 KB as the outer wall it is; the number to design against is the one the clock imposes. Revisit if the LCP Path ever stops being dominated by a single image.

**With the shipped webfonts on the chain, that crossover is ~220 KB.** [Issue #13](https://github.com/imecoulter/coulterheiberger-com/issues/13) declined to lower the 500 KB ceiling on the grounds that "the real ceiling drops again once a webfont joins the chain" — [#21](https://github.com/imecoulter/coulterheiberger-com/issues/21) measured where it lands. Three regimes, on the same instrument: **~233 KB** with system stacks only, **~220 KB** with the display + mono stack this site actually ships (13.6 KB of fonts), and **~196 KB** had the serif shipped too. The byte ceiling still never binds — at the crossover the whole LCP Path is ~230 KB — so 500 KB stays as the outer wall and **~220 KB is the number to design a hero against**. Two regimes answer differently and both are real here: on an **image-LCP** page (every Project page, and the v1 home) font bytes land squarely on the LCP Path; on a **text-LCP** page (the placeholder home today) they do not delay LCP at all, because the fallback paint *is* the LCP and the swap registers no later candidate. Re-measure this line if a third face is ever added.

## Consequences

- **v1 ships zero Exhibits.** There is no real-time 3D at launch and that is intentional; an Exhibit ships when a project earns one. A half-finished tech demo reads worse than none.
- **The site being genuinely fast is itself the technical-capability claim** that the WebGL was originally meant to carry — and unlike the WebGL, it is deliverable in v1.
- **Post-LCP Media being uncapped is load-bearing on a pipeline that does not exist yet.** A multi-megabyte scroll sequence is only acceptable because it streams; if the media pipeline (ADR-0001, known-open) does not deliver that, this budget is a fiction and must be revisited rather than quietly exceeded. The gate now makes that dependency visible: an unstreamed below-fold asset lands *on* the LCP Path number rather than quietly inflating a page total.
- **The LCP Path budget is enforced as its own gate, not inferred from page weight.** `scripts/assert-lcp-path.mjs` sums the transfer bytes of requests finishing at or before observed LCP. Total page weight is a warn-level backstop only — it was a proxy for this tier, and it was never a good one.
