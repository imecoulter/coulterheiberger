# coulterheiberger.com

Personal portfolio site for Coulter Heiberger, architectural visualization specialist. The site is itself a portfolio piece — its craft and speed are part of what it demonstrates.

Read `CONTEXT.md` for the project's vocabulary before writing anything that names a domain concept. Use those terms; don't drift to the synonyms listed under `_Avoid_`.

## Stack

Astro 6, static output, deployed to Cloudflare Workers static assets. No SSR, no adapter. See [ADR-0001](./docs/adr/0001-astro-static-on-cloudflare-workers.md) — including the rejected alternatives, so they don't get re-proposed.

- Canonical domain `coulterheiberger.com`; `coulterjheiberger.com` 301s to it. Domains, DNS, and email routing are managed in Cloudflare, not in this repo.
- Public contact address: `ime@coulterheiberger.com`.
- **React is declared but not installed.** It is the island framework of record — when interactivity is needed, use React, not Vue or Svelte. Run `astro add react` at that point. Do not add it speculatively.

## Binding constraints

These are not style preferences. Violating one is a defect. Full rationale in [ADR-0002](./docs/adr/0002-graphics-isolation-and-performance-budget.md).

- No heavy graphics runtime (Three.js, Cesium, or successor) may be imported from a shared layout, and none may load on initial page render. Each lives in a route-scoped, dynamically imported island behind an explicit user Gate.
- Two WebGL contexts never coexist on one route.
- The Ambient Layer is built from Rendered Assets, not live WebGL.
- The LCP element is never a 3D canvas.
- Every Exhibit ships a mobile poster with tap-to-load. Consider mobile and desktop on every visual decision.
- Performance budget: LCP Path ≤ 500 KB and LCP < 2.5s on throttled 4G; JS on non-Exhibit routes ≤ 50 KB. Post-LCP Media is uncapped but must stream and must never block interaction.

If a task appears to require breaking one of these, stop and say so rather than working around it.

## Agent skills

### Issue tracker

Issues live as GitHub issues on `imecoulter/coulterheiberger-com`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
