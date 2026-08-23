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

**One dark ground, for everybody.** This line read "Paper ground, inverting once to night, where the
interactive work sits" until [ADR-0007](./adr/0007-one-dark-ground.md), which inverted the ground and
cut the second band rather than flipping it. Everything else on this page survived that change
unread, which is what made it an amendment rather than a new direction.

**The index is one column of even Plates, and the frame says nothing so the work has to.**
[ADR-0008](./adr/0008-the-index-arrangement-and-one-spacing-atom.md) settled `/`: every Plate the same size, full width, one per row, with
its metadata revealed on the image rather than set in a column beside it.

**A collage was built here first and cut.** Cells of differing size, packed from a seeded set of
Bands, on the argument that six identical rectangles deliver "differing in status" while putting the
whole weight of "differing in subject" onto the images. That argument survives the cut and is what
the even list now has to answer for. What cut it is the scale: at six Projects a larger Cell is not a
claim about the work, it is whatever the packer had left to place. The ADR keeps the geometry, because
what would change the answer is more Projects.

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

   **Amended by [ADR-0008](./adr/0008-the-index-arrangement-and-one-spacing-atom.md).** On `/` the column beside it is gone too,
   and metadata is now revealed on the Plate rather than persistent next to it. The finding above is
   untouched and is in fact the reason: what was wrong with Bruno Arizio's rail was that the metadata
   was *furniture the page carried*, and a column pinned to every Plate is the same mistake at
   Plate scale. On `/projects/<slug>/` metadata is still persistent, because a detail page is where
   someone went to read it.

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
- **One spacing atom, and a five-step ladder under it.** `--gap` is the distance between two Plates,
  the distance from a Plate to the screen edge, and the unit `--rhythm` is a multiple of — one number
  answering all three, which is what makes the page read as one field rather than as blocks with
  their own margins. Everything smaller is `--s1`..`--s5`. `npm run check:css` refuses a raw length in `margin`,
  `padding` or any `gap` in built site CSS. See [ADR-0008](./adr/0008-the-index-arrangement-and-one-spacing-atom.md).
- **Native scroll.** No Lenis, no Locomotive, no `ScrollSmoother`. MIR loads `ScrollSmoother` and
  never instantiates it; Luxigon, Neoscape and Kilograph are plain native scroll.
- **The LCP element is never a canvas** (ADR-0002).
- **One ground, and it is dark.** No light alternative, no `prefers-color-scheme` fallback, no
  visitor-facing toggle. `npm run check:css` refuses `prefers-color-scheme` in site CSS by name, the
  way it refuses radius and shadow.

  **There was a "at most one night band per page" rule here**, and it is gone rather than inverted.
  The band's stated job was to mark where the interactive work sits; with one dark ground there is
  nothing to invert into, and a paper band on a dark site would be a louder gesture than the night
  band on paper ever was. It is recorded rather than deleted silently because a two-band model was
  how this site was built for its whole life until [ADR-0007](./adr/0007-one-dark-ground.md), and the
  next reader should find the trace. If a future Exhibit needs marking, that is decided with the
  Exhibit in hand.

## Colour

Three primaries. `--rule` and `--muted` derive from the ground/ink axis; see `docs/styling.md` for
the token mechanics.

| role | value |
| --- | --- |
| ground | `#000000` |
| ink | `#E8E6E1` |
| signal | `#E3392C` |

**The ground is pure black, and it moved the two derived tokens with it.** `--muted` is 63% ink and
`--rule` is 30%, against the 58% and 18% the paper site ran for its whole life. Those are not new
design decisions: they are the percentages that hold the *old* ratios on a darker ground, 4.96 against
5.01 and 1.43 against 1.44. Only the ground actually moved. At the old percentages pure black puts
`--muted` at **4.09** and fails the AA gate outright, which is why this is written down rather than
adjusted.

**What pure black costs is accepted, not solved.** The reference sites can afford `#000` because their
grids are uniformly bright photography; this asset set is tonally split, and `not-unreal`'s hero is a
greyscale collage **on pure black**, which on this ground has no boundary and reads as a hole rather
than an object. That is a judgement to make rendered, in the visual review pass, not one to argue from
a table. Full reasoning and the intermediate ground that was proposed and rejected:
[ADR-0007](./adr/0007-one-dark-ground.md).

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

`--rule` (30% ink) and `--muted` (63% ink) are derived rather than picked, at 1.43 and 4.96 on this
ground. The originally hand-picked pair for a dark band was `#2A2F35` / `#8B9098`; the derivation
stays close to it and departs deliberately on muted, which derives neutral rather than that cool
blue-grey. The cool cast was an undocumented fourth colour decision, and it was dropped for the same
reason the registration marks were.

**"The furniture is greyscale so that the images are the only colour on the page" is the sentence the
dark ground serves.** On paper, the page and the images were both bright and competed for the eye. On
this ground the six renders are the only light source on screen, which is why ADR-0007 is an
amendment to this direction rather than a departure from it.

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

**The site moves in two ways, and they are one device.** An element enters once as it first comes
into view, and two elements reveal a label under a pointer. Both are an `opacity` change and an 8px
rise, both `ease-out`, both at the same duration. There is nothing else.

### Registration

**Every substantial element enters once as it arrives.** Opacity 0 to 1 with a `translateY` of
`--rise` (8px), over `--reveal-in` (760ms) `ease-out`, staggered `--reveal-stagger` (60ms) apart in
groups of four. It fires once and never re-triggers on scroll back. On `/` that is the Masthead and
each Plate; on a Project page it is the hero, the title, the summary, the facts, the body as one
block, and each Frame in the gallery ([ADR-0010](./adr/0010-registration-returns.md)).

**One pace serves both, and it is 760ms.** The entrance and the two reveals use the same duration,
the same 60ms stagger and the same 8px, which is what makes this one device rather than two that
happen to coexist. The pair shipped at 440ms and was slowed on owner review; the in:out ratio is
unchanged. It is deliberately slower than ADR-0009's refused 480ms — see
[ADR-0010](./adr/0010-registration-returns.md), which overturns that rejection and records what it
costs the reveals.

**The first screen registers too, and that is the change ADR-0010 made.** It was excluded before, on
the grounds that the LCP element must not start hidden. That is true of an element un-hidden by
script and false of a CSS keyframe: the browser records LCP at an element's first *non-zero* paint,
not when its animation ends. So the first screen animates from the stylesheet with no JavaScript on
the path, and everything below the fold is un-hidden by one `IntersectionObserver`. The hero carries
no stagger delay, because a delay on the LCP element is added to LCP directly.

**It is gated on `prefers-reduced-motion: no-preference` and nothing else.** Not on `hover`. A reveal
a coarse pointer can never trigger has to degrade, which is why the two reveals are hover-gated; an
entrance has no such problem, because a phone scrolls. Under `reduce` the page paints in its final
state, and the hidden state is declared only inside the `no-preference` query so that it does.

**This section used to refuse all of this**, and the refusal was written on headroom rather than on
fit: the JS budget, the LCP rule above, and a library comparison against a page that already loads
in under 100ms. Headroom is not a design constraint. What survives is narrower and still binding: an
entrance introduces content the visitor has not seen yet, so it fires once, at the moment that
content arrives, and never again. A mark that re-fires on content already read is performing.

### The two reveals

**Two elements respond to a pointer, and they are the only two.** On `/`, a Plate reveals its
metadata and the Masthead portrait reveals its `About` label, both under `:hover` and
`:focus-within` ([ADR-0008](./adr/0008-the-index-arrangement-and-one-spacing-atom.md)). **Each is
timed** ([ADR-0009](./adr/0009-the-two-reveals-are-timed.md)): the scrim fades in over 760ms, the
text rises 8px into it 60ms behind, both `ease-out`, and leaving is quicker than arriving at 480ms.
All of it is gated on `hover: hover` and `prefers-reduced-motion: no-preference`, where the un-timed
`opacity` swap that shipped first is still what a `reduce` visitor and every coarse pointer gets.

**The boundary is the device rather than the count.** Same two objects, same two triggers, one
reveal. A third element revealing a label this way is the same decision again; an element that wants
to move for any *other* reason is a new one, and it is this section again first.

**The scrim itself never moves, and that is not a detail.** Its top edge is a gradient falloff.
Translate it and the boundary slides down the render, which reads as a black panel arriving on the
work rather than as a label surfacing out of it. Only the text travels.

**It was one reveal, and the second is an amendment rather than a drift.** The portrait was a square
with a bordered `About` link set underneath it — two objects making one offer, and the link was the
only text on `/` whose affordance was a border rather than the datum. Folding the label onto the face
makes the portrait behave like the six Plates below it: one target, one revealed label, one reveal.
Adding a *third* is this section again, and the question to answer is not "may I have another" but
"is this the same device, or a new one".

Apart from those two, Registration, and the focus outline, nothing on the site has a state.

### What is still refused

Five categories were removed in one pass after clicking a Project put three of them on screen at
once and the result read as artefacts rather than as craft. Registration is back because its removal
was argued on headroom. The other four are not, and neither is anything below.

- **Nothing parallaxes, and nothing scrubs.** `animation-timeline: view()` is disqualified on
  capability rather than support: it reads progress from scroll *position*, so it necessarily
  reverses on scroll back, and the entrance fires once.
- **No navigation transition.** A navigation is an ordinary full page load. The Navigation Cross-fade
  and the Carry stay removed.
- **No animation library and no client-side router.** [Issue #12](https://github.com/imecoulter/coulterheiberger-com/issues/12)
  priced the router alone at 5,494 B gzip and the smallest library at 3,187 B, against a hand-rolled
  substrate in the hundreds of bytes.
- **Native scroll.** No Lenis, no Locomotive, no `ScrollSmoother`.
- **One authored `<script>`.** The observer is a third behaviour inside the one that exists, not a
  second file and not an island.
- **At most two elements animating at a time**, which is what the stagger and the fire-once rule are
  for. Six Plates entering together is the failure this constrains.

**The order is binding: this document is amended first, then a mechanism is chosen to serve it.**
Never the reverse. The full spec as it shipped, every measurement behind it, and the findings that
each cost real time to discover are kept in [docs/motion.md](./motion.md). Read that before
proposing motion here — three of the traps it records fail silently, and one of them looks exactly
like a page with no animation.

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
