# coulterheiberger.com

Personal portfolio site for Coulter Heiberger, architectural visualization specialist. The site is itself a portfolio piece — its craft and speed are part of what it demonstrates.

Read `CONTEXT.md` for the project's vocabulary before writing anything that names a domain concept. Use those terms; don't drift to the synonyms listed under `_Avoid_`.

## Stack

Astro 7, static output, deployed to Cloudflare Workers static assets. No SSR, no adapter. See [ADR-0001](./docs/adr/0001-astro-static-on-cloudflare-workers.md) — including the rejected alternatives, so they don't get re-proposed.

- Canonical domain `coulterheiberger.com`; `coulterjheiberger.com` 301s to it. Domains, DNS, and email routing are managed in Cloudflare, not in this repo.
- Public contact address: `ime@coulterheiberger.com`.
- **React is declared but not installed.** It is the island framework of record — when interactivity is needed, use React, not Vue or Svelte. Run `astro add react` at that point. Do not add it speculatively.

## Binding constraints

These are not style preferences. Violating one is a defect. Full rationale in [ADR-0002](./docs/adr/0002-graphics-isolation-and-performance-budget.md), and for the last two, [ADR-0003](./docs/adr/0003-accessibility-bar.md).

- No heavy graphics runtime (Three.js, Cesium, or successor) may be imported from a shared layout, and none may load on initial page render. Each lives in a route-scoped, dynamically imported island behind an explicit user Gate.
- Two WebGL contexts never coexist on one route.
- The Ambient Layer is built from Rendered Assets, not live WebGL.
- The LCP element is never a 3D canvas.
- Every Exhibit ships a mobile poster with tap-to-load. Consider mobile and desktop on every visual decision.
- Performance budget, all figures **over the wire**: LCP Path ≤ 500 KB and LCP < 2.5s on throttled 4G; JS on non-Exhibit routes ≤ 50 KB. Post-LCP Media is uncapped but must stream and must never block interaction. The 2.5s clock binds long before 500 KB does — with the two shipped webfonts on the chain it is reached at roughly **220 KB of hero** — so design against the timing, not the ceiling.
- Source-resolution Rendered Assets never enter git. Only the web-resolution exports committed under `src`/`public` are tracked. This is what makes the repo's image bytes identical to the site's image bytes — the property that keeps repo visibility a non-issue for IP (see [issue #7](https://github.com/imecoulter/coulterheiberger-com/issues/7)). Masters live in `.render-drop/`, a sibling of the working tree and outside the repository.
- Committed Rendered Assets are JPEG, sRGB with no embedded profile, 3200 px on the long edge. Never PNG or WebP: Astro picks a `<Picture>` fallback tier from the source format, and anything outside `gif`/`svg`/`jpg`/`jpeg` silently yields a ~7× larger PNG tier. Full spec in [docs/asset-delivery.md](./docs/asset-delivery.md).
- **WCAG AA**, gated in CI on every page. `--muted` holds ≥ 4.5:1 on `--ground` in both bands — it is the colour of 11–12 px text, so the large-text 3:1 exemption does not apply and is refused by name. `--signal` holds ≥ 3:1 and **is never a text colour**: it is the focus outline, and it fails 4.5:1. Both are asserted by `npm run check:css` against the built CSS.
- **An Exhibit ships with a keyboard path and a text alternative.** No per-URL relaxation, no exemption — decided before the first Exhibit exists, because the cost of deciding it afterwards is losing either the Exhibit or the bar.

If a task appears to require breaking one of these, stop and say so rather than working around it.

## Development

- Routes, the Project schema, and collection structure are specified in [docs/content-architecture.md](./docs/content-architecture.md). Do not add a frontmatter field without a page that renders it.
- Styling is hand-written modern CSS — **no Tailwind, no framework, no preprocessor**. The token model, the file layout, and the modern-CSS baseline are in [docs/styling.md](./docs/styling.md); read it before writing a style block, and do not invent a fourth place for CSS to live. The design it implements is [docs/design-direction.md](./docs/design-direction.md).
- Typography is **three roles, two webfonts** — Montserrat display and JetBrains Mono spec, self-hosted static subsets committed under `src/fonts/`; the body serif is a system stack. Decided in [issue #21](https://github.com/imecoulter/coulterheiberger-com/issues/21). Regenerate the subsets with `scripts/dev/subset-fonts.mjs`, never by hand or from a font site — the script asserts the OFL licence records survive. Do not add a preload, do not let a `.woff2` be base64-inlined, and do not add a fourth family: all three are measured decisions recorded in [docs/styling.md](./docs/styling.md).
- Motion is CSS plus one inline `IntersectionObserver` — **no animation library and no client-side router**, decided by measuring every candidate in [issue #12](https://github.com/imecoulter/coulterheiberger-com/issues/12). The site has exactly one `<script>`; adding a second, or a library, means amending [docs/design-direction.md](./docs/design-direction.md) first. Costs and conditions are in [docs/styling.md](./docs/styling.md).
- Rendered Assets reach the site through one ritual, never by hand: `npm run assets <slug>` converts masters out of `.render-drop/` and scaffolds the entry, you write the alt text, `npm run publish <slug>` opens the PR. `npm run check:assets` is the CI gate on the result. Steps and reasoning in [docs/asset-delivery.md](./docs/asset-delivery.md) §3.
- `npm run build` — static build to `dist/`. `npm run deploy` — build then `wrangler deploy`.
- Start the dev server in background mode: `astro dev --background`. Manage it with `astro dev stop`, `astro dev status`, `astro dev logs`. Do not run `astro dev` in the foreground; it will block.

Astro docs: https://docs.astro.build — consult before working on [routing](https://docs.astro.build/en/guides/routing/), [components](https://docs.astro.build/en/basics/astro-components/), [framework components](https://docs.astro.build/en/guides/framework-components/), [content collections](https://docs.astro.build/en/guides/content-collections/), or [styling](https://docs.astro.build/en/guides/styling/).

## Agent skills

### Issue tracker

Issues live as GitHub issues on `imecoulter/coulterheiberger-com`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
