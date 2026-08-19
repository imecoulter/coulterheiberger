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

**Registration, not performance.** Line-level only. Fires once and never re-triggers on scroll back.
Nothing parallaxes, and **element-level Registration never scales**. At most two elements animating
at a time. (`draw rule` scales a hairline into existence, which is a draw rather than a zoom; no
Registration move changes the size of content.)

That rule read a flat **"nothing scales"** until
[#31](https://github.com/imecoulter/coulterheiberger-com/issues/31) adopted the Carry, below. The
narrowing is written into the rule rather than granted as an exception beside it — a hard rule with
an undocumented exception is not a hard rule, and the cost of the Carry is precisely this sentence.

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

**Two page-to-page moves, and no client-side router** — see
[issue #12](https://github.com/imecoulter/coulterheiberger-com/issues/12), which priced one at
5,494 B gzip against 426 B for this entire motion substrate, on a site whose page loads already
land in under 100 ms.

The **Navigation Cross-fade** is a brief cross-fade on ordinary navigation, present where the browser
supports it and absent where it does not.

The **Carry** is the second of them, and the site's third motion category overall, decided in
[#31](https://github.com/imecoulter/coulterheiberger-com/issues/31): a Plate's image travels between
`/` and `/projects/<slug>/`, holding its position and its scale across the navigation while the rest
of the page cross-fades. It is a category of its own, not an extension of the Cross-fade — the
Cross-fade is a property of the document swap, the Carry is element-level continuity through it, and
collapsing the two is what would let the scaling narrowing above go unnoticed.

**Every Plate on `/` carries, not only the one that was clicked. The reason is mechanical.** With no
JavaScript, CSS cannot know which Plate was clicked — there is no `:active` state surviving a document
swap, and no selector for "the link the visitor just followed". Naming all of them is therefore the only
**stateless** way to guarantee the clicked one carries. The other five simply exit: a name with no
counterpart in the incoming document animates out and costs nothing else.

That it also reads as the equivalence thesis — naming just the first would say one piece of work is the
way into the others — is true, and it is a reading, not the reason. The distinction matters because the
two answers behave differently under pressure: if the equivalence argument were the load-bearing one, a
future "name only the clicked plate" optimisation would look like a betrayal of the direction rather
than what it actually is, which is **a second `<script>` and an amendment to this document**.

At the scale this site runs at, one click moves 3–8 plates, and that is the thing to measure. It was
measured: **+20 ms** with all six named, against the ~70 ms threshold — see `docs/styling.md`.

**It is not free, and the record said it was.** #12 priced the cross-fade at 0 bytes and shipped it
on that basis. Field RUM on cross-document view transitions reports roughly **+70 ms LCP on repeat
mobile pageviews**, correlated with CPU
([corewebvitals.io](https://www.corewebvitals.io/pagespeed/view-transition-web-performance)) — a cost
the shipped Cross-fade already pays today, before the Carry adds a single named element. The Carry is
therefore adopted on direction fit and carries a **threshold**, not a promise. Over it, the Carry is
cut back to the plain cross-fade and **never rescued with JavaScript**: a small click handler is the
tempting fix, and a second `<script>` is an amendment to this document, not an implementation
detail. The threshold, the mechanism, and what remains unverified are in
[docs/styling.md](./styling.md).

The **Traverse** is the fourth motion category, and the first one a visitor drives. Hovering a Plate
on `/` moves its wide image vertically through the Overscan its crop carries beyond the band, so the
pointer uncovers what the 21:9 cut took off the top and the bottom. Registration and the Carry happen
*to* a visitor; the Traverse happens *because of* one, and that is the distinction that makes it a
category rather than a fifth Registration move.

**"Nothing parallaxes" still holds, and this is not a quiet exception to it.** Parallax is
scroll-linked differential movement between layers: two things moving at different rates to fake
depth the page does not have. The Traverse is one element, one axis, and the input is the pointer
rather than the scroll position. Nothing is layered and nothing pretends to be behind anything. That
distinction is written here rather than assumed, for the same reason the scaling narrowing above is
written into the rule instead of granted beside it.

It is off wherever it would be a lie or a nuisance: `(hover: hover) and (pointer: fine)`, because on
touch a hover is the first half of a tap, and `reduce`, like everything else. It is on `/` only. The
detail page emits the identical file at the identical crop, which the Carry requires, and simply
rests at the Plate's own `framing` anchor.

**Its cost is bytes, not milliseconds**, and that is what makes it a different kind of decision from
the Carry. The Overscan means the wide tier is cut 16:9 and shown 21:9: about 31% more pixels on
`/`'s hero, measured at 66.6 KB for the largest at the width a 1440px desktop fetches. It does not
touch the number the performance gate grades, because that gate runs at mobile width where the 4:5
crop is served and the wide tier is never requested. Read that as a reason to keep watching the
desktop figure by hand, not as a reason it is free.

Under `prefers-reduced-motion: reduce` there is still no transition at all. The Carry does not reopen
that, and the fade is not split off to be kept without it. The Traverse's listener is not attached at
all under `reduce`, so there is no state to switch off.

No animation library, and still no second file. All four moves are CSS plus one inline script; the mechanics,
the measured cost of every alternative, and the conditions for revisiting are in
[docs/styling.md](./styling.md). The order there is binding: **this document is amended first, then
a library is chosen to serve it.**

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

**It now drives four cuts, not two**, and all four are the same decision applied in different places:
the wide file sharp cuts, the tall file sharp cuts, the Social Card's 1200x630, and — since the
Traverse — the resting `object-position` the browser cover-crops the band at. That last one was not a
new mechanism but a new *place the existing one had to reach*: with the wide file cut looser than the
band, the browser performs a second crop, and left to itself it centres. A Plate framed `left bottom`
would have had its composition honoured by sharp and then thrown away by CSS eight pixels later. The
keyword-to-`object-position` map is in `src/layout.ts`, one entry per schema enum member so the two
cannot drift apart.

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
