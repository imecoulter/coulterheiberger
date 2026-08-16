# Design direction — Datum

Decided in [issue #10](https://github.com/imecoulter/coulterheiberger-com/issues/10).

> **Reconstructed.** The original working file (`design-direction-potential.md`) was never committed
> and no longer exists on disk — confirmed against every branch, worktree, stash, dangling git
> object and session scratchpad while resolving
> [#11](https://github.com/imecoulter/coulterheiberger-com/issues/11). This document is rebuilt from
> #10's resolution comment and the surviving prototype source. The **typography** section was the one
> part #10 left open; it closed in
> [#21](https://github.com/imecoulter/coulterheiberger-com/issues/21) and this document is now
> complete.

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

## Typography

Three roles, **two webfonts**. Closed in
[#21](https://github.com/imecoulter/coulterheiberger-com/issues/21), which priced each role against
the LCP Path instead of arguing about it. Full measurements in
[docs/research/typography-lcp-path.md](./research/typography-lcp-path.md).

| role | face | cut | on the wire |
| --- | --- | --- | ---: |
| display | **Montserrat** | static `wght=500`, site repertoire | 9,656 B |
| body | **system serif** — Georgia, Times New Roman, Nimbus Roman | — | 0 B |
| mono | **JetBrains Mono** | static `wght=500`, no ligatures | 5,228 B |

**A page may use two of the three roles.** The cap is a ceiling, not a quota — `/` is Montserrat and
mono only, because four lines with no prose on them have nothing for the serif to do. The serif is
still live on `/404`. What a fourth role would require is unchanged: an amendment here first.

**The serif is demoted all the way to a system stack.** #10 kept it but called it "right for reading,
not distinctive." #21 then found it was **73% of the type stack** — 45,340 B for 400 + 600 + italic,
against 16,712 B for both distinctive roles combined, and 24 KB of hero budget. Paying the largest
share of the budget for the least distinctive role is the trade this direction should refuse. If
Project prose ever genuinely needs a bought serif, the argument reopens with the prose in hand.

**Montserrat over Archivo is a direction call, not a byte call.** The two are 944 B apart, about
5 ms — #21 was explicit that bytes do not decide it. Recorded honestly: the argument *against*
Montserrat is that it is a geometric sans rather than an engineering grotesk, and #10's own precedent
sweep found Kilograph already running Poppins, so a geometric display face moves toward the archviz
cluster this direction is built to be distinguishable from. It was chosen anyway, on the rendered
page rather than the table. Archivo remains buildable in `scripts/dev/subset-fonts.mjs`; swapping
back is two font-family declarations.

**How the faces are cut mattered more than which faces they are** — the same families unsubsetted
cost **+1,263 ms and fail the perf gate**, the audited static cuts **+113 ms and pass**. So:

- **Static instances, never variable.** 6.5× the bytes for an axis this design never travels.
- **No ligatures on mono.** They were 74% of the file, and a specification line must never render
  `->` as an arrow.
- **No preload.** Measured *slower* on a text page (727 → 1,074 ms). `inlineStylesheets: 'always'`
  already puts `@font-face` in the document.
- **One weight per role.** `.t-spec` was given `font-weight: 500` to match `.t-label`; before that
  mono needed a second file for a weight nobody had chosen.

**The hard cap of three type roles still holds.** A fourth role is a change to this document, not a
styling decision — and it is now also a change to the font build.

## Motion

**Registration, not performance.** Line-level only. Fires once and never re-triggers on scroll back.
Nothing scales, nothing parallaxes. At most two elements animating at a time.

| name | move | duration |
| --- | --- | --- |
| rise | opacity 0→1, `translateY(10px)`→0 | 0.48 s ease-out |
| draw rule | `scaleX(0)`→`scaleX(1)`, origin left | 0.62 s ease-out |
| wipe | `clip-path: inset(100% 0 0 0)`→`inset(0)` | 0.56 s ease-out |

Staggered in groups of four at 60 ms. Fully disabled under `prefers-reduced-motion: reduce`.

**Nothing on the first screen registers.** Content above the fold paints in its final state. This
started as an LCP constraint — a hidden hero is not an LCP candidate, so it would make the paint
wait on a script — but it is also the right call for the direction: a mark that fires on content the
visitor is already looking at is performing, which is the thing this motion spec exists to refuse.

**One page-to-page move:** a brief cross-fade on ordinary navigation, present where the browser
supports it and absent where it does not. No client-side router — see
[issue #12](https://github.com/imecoulter/coulterheiberger-com/issues/12), which priced one at
5,494 B gzip against 426 B for this entire motion substrate, on a site whose page loads already
land in under 100 ms.

No animation library. Both moves are CSS plus one `IntersectionObserver`, 195 B; the mechanics, the
measured cost of every alternative, and the conditions for revisiting are in
[docs/styling.md](./styling.md). The order there is binding: **this document is amended first, then
a library is chosen to serve it.**

## Consequence for content production

**Every plate needs two art-directed crops** — 21:9 desktop, 4:5 at 390 px, delivered via `<picture>`
+ `media`. This is not a preference: on the prototype the one plate that was *not* art-directed
collapsed to an illegible 140 px band at 390.

`docs/asset-delivery.md` produces crops at build time from one native-aspect export, so the
mechanism exists — but Astro crops from **centre**, and centre-cropping a wide elevation to 4:5 cuts
the composition instead of recomposing it. **Framing is unresolved** and is tracked as fog on the
map; it needs an answer before the first real Project ships.
