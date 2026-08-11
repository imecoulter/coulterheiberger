---
status: accepted
date: 2026-08-10
---

# Astro 6 static output, deployed to Cloudflare Workers static assets

The site is an image-heavy architectural visualization portfolio, built agentically with Claude Code, hosted on Cloudflare where the domains, DNS, and email routing already live. We chose **Astro 6 with static output**, deployed to **Cloudflare Workers static assets**, with **React declared as the island framework of record but not installed until an [Exhibit](../../CONTEXT.md) requires it**. Astro wins on the three things that actually matter for this site — native build-time image optimization, Vite-native tooling for heavy 3D libraries, and near-zero JavaScript on content routes — and it is now maintained by our host.

## Considered Options

**Next.js (App Router) with static export** — rejected. The handoff carried Next on two premises, both of which failed verification:

- *"Deepest 3D ecosystem."* R3F, Drei, and Resium are React libraries, not Next libraries. Astro's React islands run them unchanged. There is no privileged access.
- *"Natural home for a canvas persisting across route transitions."* Astro's `<ClientRouter />` with `transition:persist` keeps a hydrated island instance and its state alive across navigations. The claim that Astro's full page loads fight a persistent canvas is stale. (Caveat recorded: Astro documents this for component state, not specifically for a live WebGL context on a relocated DOM node. Prototype before relying on it.)

What decided against Next was the cost of static export. Per the Next 16.3 docs, `output: 'export'` does not support **Image Optimization with the default loader**, along with rewrites, redirects, headers, cookies, ISR, server actions, draft mode, intercepting routes, and dynamic routes without `generateStaticParams()`. Responsive AVIF/WebP would require a custom loader pointing at a third-party service. Astro's `astro:assets` does this at build time with no third party — and this site is almost entirely images.

There is a second, agentic cost. Next's static export is a subset mode of a framework whose documentation and training corpus are overwhelmingly about its server mode. Agents reliably emit server actions, middleware, dynamic route handlers, and default-loader `next/image` — each failing at build time or degrading silently. Astro's static output has no server-mode twin to be confused with, so that failure class does not arise. Raw training-data volume favours Next; *rate of configuration-inappropriate output* favours Astro, and that is the metric that costs us time.

**SvelteKit + Threlte** — rejected. Trades a maintained Cesium React wrapper for nothing this site needs, and Svelte 5 runes are recent enough to raise agentic correction load.

**Cloudflare Pages** — rejected as the deployment target despite being named a fixed constraint in the handoff. Pages is in maintenance mode; Cloudflare routes new projects to Workers with static assets, which serves static assets on the same terms and leaves the door open to add a server-side endpoint in place rather than migrating. Astro static output needs **no adapter** for this: `astro build`, then a `wrangler.json` with an `assets` block pointing at `./dist`.

**Nuxt/TresJS, bare Vite + React, Hugo, plain HTML** — ruled out in prior exploration; not reopened.

## Consequences

- **Cesium, if it ever ships, is cheap to integrate.** The maintained plugins that copy `Assets/`, `Workers/`, `ThirdParty/`, `Widgets/` and set `CESIUM_BASE_URL` are Vite plugins, which Astro inherits. Realistic dist footprint with Cesium included is ~11 MB — which is why it is confined to a gated Exhibit under ADR-0002, not a library-level choice.
- **Astro was acquired by Cloudflare on 16 January 2026** and remains MIT-licensed, open source, and platform-agnostic. Framework and host being one vendor is an alignment benefit here, and a concentration risk worth naming: if Cloudflare's stewardship degrades the project, both halves of this decision are affected at once.
- **React is a declared commitment, not an installed dependency.** The ADR designates React as the island framework so R3F, Drei, and Resium stay available and no future agent introduces Vue or Svelte islands ad hoc. `astro add react` when the first Exhibit lands.
- **No SSR, no adapter, no server.** Anything genuinely dynamic later becomes an explicit Worker route, decided on its own merits.

## Known open — deferred to build planning

Recorded here so they are visibly parked, not missed:

- **Media pipeline** — off-host video (Stream/Mux/Bunny) and the responsive AVIF/WebP pipeline. Non-trivial: ADR-0002's Post-LCP Media tier assumes it exists.
- **Motion and asset strategy** — GSAP vs. Motion vs. native scroll-driven animation; draco/meshopt compression, texture budgets, LOD.
- **Content architecture** — sections, Project entry shape, CMS vs. git-committed MDX, and where the Build Log sits.
- **Styling approach** — Tailwind vs. plain modern CSS.
- **`transition:persist` with a live WebGL context** — unverified; prototype before any design depends on it.
