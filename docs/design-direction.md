# Design direction — Datum

Decided in [issue #10](https://github.com/imecoulter/coulterheiberger-com/issues/10).

> **Reconstructed.** The original working file (`design-direction-potential.md`) was never committed
> and no longer exists on disk — confirmed against every branch, worktree, stash, dangling git
> object and session scratchpad while resolving
> [#11](https://github.com/imecoulter/coulterheiberger-com/issues/11). This document is rebuilt from
> #10's resolution comment and the surviving prototype source. The **typography** section is the one
> part #10 left open; it is still open.

## The direction

**The datum is the specification line.** Not a rail, not a grid — the fixed reference every piece of
work is measured against.

Every piece of work on this site is a **plate** under an identical metadata contract. The only thing
that differs between them is what the specification line says:

```
Cycles · 3200 px · 41 min          WebGL2 · 1920 px · 60 fps
```

A competition still and a point-cloud viewer become the same kind of object, differing in **subject
rather than status**. That equivalence is the argument the site makes — made structurally, instead
of claimed in an About paragraph. It is also the one move nothing in the precedent set makes,
because every site in that set has exactly one kind of object it knows how to present.

Paper ground, inverting **once** to night, where the interactive work sits.

## What the precedent analysis actually found

Eleven sites were driven in a real browser — computed styles across every element, loaded font
faces, LCP element and timing via `PerformanceObserver`, canvas contexts, scroll mechanism, and
effective background sampled at 4–9 scroll depths. Eight more were read from screenshots.

**It corrected the proposal in three ways that changed the direction.**

1. **The gap was already occupied.** The proposed differentiator — light ground, grotesk + serif,
   mono labels — is the house style of the archviz cluster it claimed to be escaping. Recent Spaces
   runs `aktiv-grotesk` + `freight-big-pro` + `din-condensed-web` + `futura-pt` on `#FFFFFF`; MIR is
   `Nimbus Sans` + `Sabon Next`; Kilograph is `poppins` + `ivyjournal`; Beauty & The Bit is
   white-ground with serif italic. Neoscape and Lama Lama already pair mono spec labels with large
   grotesk display.

2. **The rail was borrowed, not risked.** A persistent 132 px left metadata rail was called "the one
   risk taken." Bruno Arizio already *is* a left index column beside a large plate — and carries a
   **10.6 s LCP**, no document scroll (`scrollHeight === innerHeight`, Lenis), one family, no serif.
   **The rail is cut.** Metadata belongs to the plate and travels with it: a column beside it on
   desktop, the same rows stacked above it at 390 px.

3. **Two cited precedents were factually wrong.** Lusion has **zero `<img>` elements** — a fixed
   full-viewport WebGL2 canvas from first paint, so "hero poster gating heavy work" is not what it
   does. Shopify Winter '26's ambient layer is **two live WebGL2 contexts coexisting on one route**,
   which is exactly what ADR-0002 forbids.

Also corrected: **Vibor is dark-first** (`#0C0C0C` for the top ~40%), and its serif is *display* at
43 px, not prose. **Studio Feixen** is one proprietary family with **5 px radius on 44 elements**,
7 shadows, a Locomotive container and a **video LCP**. **Luxigon**'s LCP is a **1 MB GIF**.

**ADR-0002's LCP rule is confirmed in the wild.** The fast sites are the ones whose LCP is not a
canvas — MIR `IMG` 716 ms, Kilograph `H2` 712 ms, Neoscape `H1` 1284 ms — against Arizio 10.6 s,
Shopify 6.3 s, Feixen 3.2 s.

## Hard rules

These are enforced by `npm run check:css` over the built output (see `docs/styling.md`).

- **Zero border-radius.** Shared with MIR, Luxigon, Recent Spaces, Vibor.
- **Zero box-shadow.**
- **Native scroll.** No Lenis, no Locomotive, no `ScrollSmoother`. MIR loads `ScrollSmoother` and
  never instantiates it; Luxigon, Neoscape and Kilograph are plain native scroll.
- **The LCP element is never a canvas** (ADR-0002).
- **Exactly one night band per page.** More reads as a dark site with light interruptions — which is
  the cluster this direction is trying not to join.

## Colour

Three primaries. `--rule` and `--muted` derive from the ground/ink axis; see `docs/styling.md` for
the token mechanics and the `color-mix` scoping trap.

| role | day | night |
| --- | --- | --- |
| ground | `#F2F0EC` | `#0E1114` |
| ink | `#14161A` | `#E8E6E1` |
| signal | `#E3392C` | `#E3392C` |

**Signal red survives, reduced** — plate index, focus ring, active state, and **under 1% of pixels**.
Corner registration marks were **cut as costume**.

The originally hand-picked `rule` and `muted` values (`#C9C6C0` / `#6E706B` day, `#2A2F35` /
`#8B9098` night) are now derived, landing within delta 5–11 of those originals. The one deliberate
departure is **night muted**, which derives neutral rather than the original's cool blue-grey: that
cool cast was an undocumented fourth colour decision, and it was dropped for the same reason the
registration marks were.

## Typography — OPEN

The direction commits to **three type roles**: engineering grotesk display, transitional serif body,
spec-sheet mono. The serif is **kept but demoted** — right for reading, not distinctive; its real
cost is LCP Path bytes.

**Prototype stand-ins, not decisions:** Archivo / Source Serif 4 / JetBrains Mono.

What three licensed families cost the LCP Path — and which can be dropped or served from a system
stack — is still unresolved. This is the section to close before the direction is final.

## Motion

**Registration, not performance.** Line-level only. Fires once and never re-triggers on scroll back.
Nothing scales, nothing parallaxes. At most two elements animating at a time.

| name | move | duration |
| --- | --- | --- |
| rise | opacity 0→1, `translateY(10px)`→0 | 0.48 s ease-out |
| draw rule | `scaleX(0)`→`scaleX(1)`, origin left | 0.62 s ease-out |
| wipe | `clip-path: inset(100% 0 0 0)`→`inset(0)` | 0.56 s ease-out |

Staggered in groups of four at 60 ms. Fully disabled under `prefers-reduced-motion: reduce`.

## Consequence for content production

**Every plate needs two art-directed crops** — 21:9 desktop, 4:5 at 390 px, delivered via `<picture>`
+ `media`. This is not a preference: on the prototype the one plate that was *not* art-directed
collapsed to an illegible 140 px band at 390.

`docs/asset-delivery.md` produces crops at build time from one native-aspect export, so the
mechanism exists — but Astro crops from **centre**, and centre-cropping a wide elevation to 4:5 cuts
the composition instead of recomposing it. **Framing is unresolved** and is tracked as fog on the
map; it needs an answer before the first real Project ships.
