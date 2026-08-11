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
| **Post-LCP Media** — rest of a scroll sequence, below-fold video | Uncapped total; must stream lazily, must never block interaction, must honour `prefers-reduced-motion` and `Save-Data` |
| **Exhibits** | Uncapped; gated and route-scoped |

The LCP element is never a 3D canvas. It is a poster image or a static hero render.

## Consequences

- **v1 ships zero Exhibits.** There is no real-time 3D at launch and that is intentional; an Exhibit ships when a project earns one. A half-finished tech demo reads worse than none.
- **The site being genuinely fast is itself the technical-capability claim** that the WebGL was originally meant to carry — and unlike the WebGL, it is deliverable in v1.
- **Post-LCP Media being uncapped is load-bearing on a pipeline that does not exist yet.** A multi-megabyte scroll sequence is only acceptable because it streams; if the media pipeline (ADR-0001, known-open) does not deliver that, this budget is a fiction and must be revisited rather than quietly exceeded.
