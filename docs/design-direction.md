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

Every piece of work on this site is a **Plate** under an identical metadata contract. The only thing
that differs between them is what the specification line says:

```
UNREAL ENGINE · HOUDINI          ENSCAPE · PHOTOSHOP · PHYSICAL MODEL
```

That example used to read `Cycles · 3200 px · 41 min` / `WebGL2 · 1920 px · 60 fps`, and the two
figures after the software are gone. **Resolution was cut in review**: a viewer judges an image by
how sharp it is on their screen, not by a number claiming it, and ADR-0006 records that the number
was simultaneously the one fact on the line that could not be verified against anything in the
repository. Render time was never shipped at all.

The cut costs something and it is worth naming: two of the six Projects now read `UNREAL ENGINE` and
nothing else, so the line no longer separates them. That is a content problem with a content fix —
state a second tool — rather than a reason to put a number back that nobody could check.

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
   **The rail is cut.** Metadata belongs to the Plate and travels with it: a column beside it on
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
- **At most one night band per page.** More reads as a dark site with light interruptions — which is
  the cluster this direction is trying not to join.

  **This is a ceiling, not a mandate**, on the same footing as the three-type-role cap: "exactly one"
  bounds how many a page may have, it does not require a page to have one. v1 ships **zero** night
  bands. The band's stated job is to mark where the interactive work sits, ADR-0002 ships zero Exhibits,
  and a dark band marking nothing is decoration — which is the thing this direction refuses. It returns
  with the first Exhibit.

## Colour

Three primaries. `--rule` and `--muted` derive from the ground/ink axis; see `docs/styling.md` for
the token mechanics and the `color-mix` scoping trap.

| role | day | night |
| --- | --- | --- |
| ground | `#F2F0EC` | `#0E1114` |
| ink | `#14161A` | `#E8E6E1` |
| signal | `#E3392C` | `#E3392C` |

**Signal red survives on the focus ring, and nowhere else.** That is one selector on the whole site,
`:focus-visible` in `base.css`, and it is on screen only while somebody is navigating by keyboard.
Corner registration marks were **cut as costume**; the Plate index followed them in review.

The line above used to read "Plate index, focus ring, active state, and under 1% of pixels". The
Plate index mark is now `--ink`, because **the furniture is greyscale so that the images are the only
colour on the page.** A red tick above every heading, on a document that is six photographic renders,
was the most chromatic thing on screen and it was competing with the work for the eye. Under 1% of
pixels turned out to still be too many when none of them were the work.

**The token stays, and so does its 3:1 floor in `scripts/check-css.mjs`.** A focus ring is the one
affordance that has to be unmistakable, and it is the reason `--signal` is asserted at 3:1 rather
than 4.5:1 and refused in a `color:` declaration by name. Nothing here relaxes that, and a future use
of signal on a surface is a change to this table, not a styling decision.

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

**A page may use fewer than three roles.** The cap is a ceiling, not a quota. This read "`/` is
Montserrat and mono only, because four lines with no prose on them have nothing for the serif to do" —
true while `/` was a placeholder, and no longer: the Project index carries six summaries, which is
prose, so **all three roles are now live on `/`**. That is the sentence working as intended rather than
a change to it — the serif arrives when there is reading to do, and it costs 0 B because it is a system
stack. What a fourth role would require is unchanged: an amendment here first.

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

**The site does not move.** Nothing animates, nothing transitions, and nothing responds to a pointer.
Pages paint in their final state, a navigation is an ordinary full page load, and the only state
change on the site is the focus outline.

This is the current direction, not a gap waiting to be filled. It replaced five interlocking
categories — Registration, the Navigation Cross-fade, the Carry, the Traverse, and a fade on the
Expanded View — which were removed in one pass after clicking a Project put three of them on screen
at once and the result read as artefacts rather than as craft.

**What that leaves is the argument the moves were always held to.** A mark that fires on content the
visitor is already looking at is performing; a page whose entire content is six Plates does not need
six entrances to introduce them. Every one of those refusals survives the removal, because a site
with no motion refuses all of them by construction.

**The refusals, if any of it returns.** Entrances are line-level, fire once, never re-trigger on
scroll back, and never touch the first screen. Nothing parallaxes. At most two elements animate at a
time. No animation library and no client-side router: [issue #12](https://github.com/imecoulter/coulterheiberger-com/issues/12)
priced the router alone at 5,494 B gzip against 426 B for the entire hand-rolled substrate, on a site
whose page loads already land in under 100 ms.

**The order is binding: this document is amended first, then a mechanism is chosen to serve it.**
Never the reverse. The full spec as it shipped, every measurement behind it, and four findings that
each cost real time to discover are kept in [docs/motion.md](./motion.md). Read that before
proposing motion here — three of the four traps it records fail silently, and one of them looks
exactly like a page with no animation.

## Consequence for content production

**Every Plate needs two art-directed crops** — 21:9 desktop, 4:5 at 390 px, delivered via `<picture>`
+ `media`. This is not a preference: on the prototype the one Plate that was *not* art-directed
collapsed to an illegible 140 px band at 390.

`docs/asset-delivery.md` produces crops at build time from one native-aspect export, so the
mechanism exists — but Astro crops from **centre**, and centre-cropping a wide elevation to 4:5 cuts
the composition instead of recomposing it. **Framing is the answer to that**, and it is below.

## Framing

Decided in [issue #30](https://github.com/imecoulter/coulterheiberger-com/issues/30).

**Every image carries a required `framing` keyword in frontmatter**, one of nine, passed through to
sharp unchanged. It is a Plate's composition decision, stated once by whoever looked at the image.

**It drives four cuts, not two**, and all four are the same decision applied in different places: the
wide file sharp cuts, the tall file sharp cuts, the Social Card's 1200x630, and the
`object-position` the browser cover-crops the band at. The fourth arrived with the Overscan and
outlived the Traverse it was added for: it was never a new mechanism, only a new *place the existing
one had to reach*. With the wide file cut looser than the band, the browser performs a second crop,
and left to itself it centres. A Plate framed `left bottom` would have had its composition honoured
by sharp and then thrown away by CSS eight pixels later. The keyword-to-`object-position` map is in
`src/layout.ts`, one entry per schema enum member so the two cannot drift apart.

It works because of a measured property of *these two ratios*. Every plate's native aspect sits
between 4:5 and 21:9, so reaching 21:9 is a purely **vertical** cut and reaching 4:5 a purely
**horizontal** one. The Overscan does not disturb that: 16:9 sits inside the same window, so the wide
cut is still purely vertical and is simply performed in two stages. A single two-axis keyword is therefore already a per-ratio pair — in `left top`,
`top` answers the 21:9 crop and `left` answers the 4:5 crop, and neither can disturb the other. One
field, no per-ratio structure, no arithmetic.

The keyword is horizontal-first (`left top`; `top left` throws) and British (`centre`, never
`center`). `attention` and `entropy` are refused: they are not stable across libvips versions, and a
content-derived anchor destroys the axis decomposition the model rests on. The full set and the
reasoning sit in the schema comment in `src/content.config.ts`, where the next person will be
standing when they ask.

**The window is 4:5 to 21:9, and it is checked.** Outside it both crops read the same axis and one
keyword cannot serve both. `npm run assets` warns when a master lands outside — a warning, not a
failure: the master is spec-compliant and the consequence is a harder composition call, not a
defect. If the two ratios above ever change, re-check that they still straddle native aspect.

### Rejected

| | |
| --- | --- |
| **Compose every plate for a centre crop** | The cheapest option, and the one to reject by name. It re-couples layout to re-render: moving the 4:5 breakpoint sends you back into the 3D toolchain. Breaking that coupling is the whole purpose of `asset-delivery.md` §1 |
| **A second export per plate** | Contradicts [#6](https://github.com/imecoulter/coulterheiberger-com/issues/6)'s single committed dimension, and doubles repo weight to store a decision one word can hold |
| **Accept the centre crop on mobile** | Free, and wrong for exactly the plates art direction exists for — the prototype's un-art-directed plate collapsed to a 140 px band |
| **Normalized `{x, y}` focal points** | Impossible through the stock pipeline (`"20% 40%"` throws); it needs a custom image service owning crop maths forever. Kept as the **upgrade path** — the field name survives a change of value type |
| **A per-ratio `{wide, tall}` shape** | Can express states with no effect: `{wide: 'left'}` is a silent `centre`. The one-keyword form cannot be written wrong in that way |
| **A contact-sheet proof route** | Would be the first route rendering a Project, flipping the indexability switch `content-architecture.md` §5.2 warns about. It would need excluding from the build, not merely `noindex` |
