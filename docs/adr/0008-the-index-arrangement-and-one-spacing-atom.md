---
status: accepted
date: 2026-08-21
---

# The index, the revealed metadata, and one spacing atom

Three things were decided together and one of them was reverted. What ships:

1. **`/` is one column of Plates, all the same size**, full width, one per row.
2. **A Plate's metadata is revealed**, on `:hover` and `:focus-within`, rather than sitting in a
   persistent column beside the image.
3. **One spacing atom, `--gap`**, is the distance between two Plates, the distance from a Plate to
   the screen edge, and the unit `--rhythm` is a multiple of. Enforced by `npm run check:css`.

What was built and reverted: **the Bento**, a collage of Cells of differing size packed from a seeded
set of Bands. It is recorded in full below rather than deleted, because the thing that would bring it
back is *more Projects*, and the next person to want a collage should start from the geometry that
was already worked out rather than from scratch.

This is an amendment to Datum, like ADR-0007 before it. The datum, the specification line, the Plate
contract, the three type roles, the two art-directed crops and the greyscale-furniture argument are
all untouched.

Settled by owner review across 2026-08-21, working from MIR, Brick Visual and Luxigon as the stated
references — the same reference set ADR-0007 worked from.

## Why the index is even, and not a collage

The collage was built first, on the argument below, and cut on a simpler one: **six Projects is not
enough work for differing sizes to read as curation.** With six pieces, a Cell that is larger than
its neighbours is not making a claim about the work, it is absorbing whatever the packer had left to
place. At two or three times as many Plates the variation would carry information; at six it is
noise with an explanation attached.

The argument the collage was built on still stands and is worth keeping in view, because it is what
the *even* list has to answer for. `docs/design-direction.md` says a competition still and a
point-cloud viewer "become the same kind of object, differing in **subject** rather than in
**status**." Six identical rectangles deliver the second half of that and put the whole weight of the
first half on the images themselves. That is the trade: the frame says nothing, so the work has to.
It is the right trade at six Plates and it is worth revisiting at fifteen.

**What the collage was actually for survived it.** The spacing atom, the revealed metadata, and the
check that keeps the spacing honest were all built alongside it and none of them depended on it.

## Metadata is revealed, not persistent

At rest a Plate is its image and nothing else. Pointing at it, or focusing into it, puts the ordinal,
the title, the specification line and the year in a scrimmed band at the Plate's foot.

**The metadata is always in the DOM.** It is opacity, not `display` or `hidden`, so a screen reader
reads a complete Plate, a crawler indexes one, and the page without CSS is the list it always was.

**The block is a scrim that fades from the frame's bottom edge, and the bound is a number.**
~~It is opaque `--ground`.~~ Amended twice after owner review, and it is worth recording that the
first amendment did not go far enough. The opaque block covered the bottom 30% of the Plate, so
pointing at the work hid the work. Replacing it with a fade *above a plateau* came back as "too much
black" a second time. What ships now is a fixed-height band whose alpha falls continuously from the
bottom edge and never holds.

The original reason for refusing a gradient was that one "cannot promise 4.5:1 against arbitrary
pixels". That is true of an *arbitrary* gradient and false of a bounded one, so the rule is the bound
rather than the prohibition:

> A black scrim must hold **α ≥ 0.938** everywhere `--muted` is painted, or **α ≥ 0.595** everywhere
> `--ink` is painted. The bands carry `--ink` and reach **0.68** at the text's top edge.

Derived, not chosen. Black at α over a white pixel — the worst case a render can present — composites
to `255(1 - α)`. `--muted` sits at luminance 0.198 (the 4.96:1 `scripts/check-css.mjs` reports on the
Ground), so 4.5:1 needs a backdrop at or below `(0.198 + 0.05) / 4.5 - 0.05 = 0.0051`, a channel value
near 16, giving α ≥ 0.938. `--ink` sits at 0.792 and the same arithmetic gives α ≥ 0.595. **Both hold
over any image whatsoever**, which is the property the opaque block had and the thing that had to
survive.

**The gap between those two figures is the whole design.** A fade that starts at the bottom edge means
alpha is *already falling* where the text sits, so the binding point is the **top** of the text, not
the bottom of the band. `--muted` needs 0.94 there — which is another way of writing "no fade through
the text". The plateau was never a cautious choice; it was the only shape `--muted` admits. Measured
at the text's top edge:

| α at text top | `--muted` | `--ink` |
| --- | --- | --- |
| 0.66 | 1.65 ✗ | 5.79 ✓ |
| 0.70 | 2.01 ✗ | 6.83 ✓ |
| 0.94 | 4.52 ✓ | 15.34 ✓ |

**So the bands' small text is `--ink`, and that is a real cost paid deliberately.** It is a type-role
colour override, and `src/styles/base.css` plus the `.masthead .spec` rule on `/` both refuse exactly
this move — correctly, because on the Ground a specification line that reads one way beside another
specification line is not a style. **Over an image it is not a free choice.** The text colour sets the
scrim's alpha floor, so it is the single thing deciding how much render can show through: `--muted`
buys a slab, `--ink` buys a fade. The override is confined to the two bands on `/` and stated on both
rules that carry it. The Plate title is an `h3` and was already `--ink`, so this brings the ordinal and
the specification line to the colour the title already had beside them rather than minting a new one.

**0.66 at the text's top, not the 0.595 floor.** Same reasoning [ADR-0003](./0003-accessibility-bar.md)
applies to `--muted`: pin for margin, not for the floor. Measured on the built page across the six
Plates and the portrait, against the brightest real composited pixel in each text zone: **6.29 to
12.91**, worst case the fog in `habitat`.

**The foot is opaque, and that is a join rather than a slab.** The scrim reaches α = 1 at the frame's
bottom edge over its last 10%. An earlier cut bottomed out at 0.85, which left the render faintly
visible along the frame's final pixels and then cut hard to the page beneath — a seam exactly one
Plate-edge wide. `--ground` is `#000000`, so an opaque foot *is* the page: the band stops having a
bottom edge and the frame dissolves into the ground instead of ending on it. Verified by sampling the
20 rows either side of the boundary; the last four rows inside the frame are already at 0, identical
to the ground below.

**The band's height is the length the fade falls off over, not the amount of ground painted.**
Shortening it makes the falloff steeper rather than lighter, which is the opposite of the fix that was
wanted. Above the foot there is no plateau left to shrink.

**CI cannot catch a regression here.** Lighthouse's `color-contrast` audit does not evaluate text over
an image and returns `notApplicable`, and `check:css` asserts tokens against `--ground` rather than
against a composite. The α bound above is the whole guard. To check it by hand: force the bands
visible, hide their text so only the scrim paints, screenshot each text zone and take its brightest
pixel. Hide the dev toolbar first — it paints an `rgb(66,68,72)` pill across three of the six bands
and reports 2.30, which is the toolbar and not the page.

**Coarse pointers never reveal.** There is no tap-to-disclose. The whole Plate is one link and the
first tap navigates; a two-stage tap needs a second authored script, which the one-script rule
forbids, and it would break the link for everyone who expects a tap to follow it. Under
`(hover: hover)` failing, the block is simply always visible. The stacked mode below the viewport
switch is the same list at the 4:5 crop, with the metadata under the image.

**The summary is not on the index any more**, and that is the one content cut here. It is prose, two
to four lines, and there is no width at which it can appear over a render without the block becoming
the image. It is on the Project page, which is where someone who wants to read about the work is
going. What the index carries is the datum: ordinal, name, specification line, year.

**This is the site's only `:hover` rule.** `docs/motion.md` is amended alongside this ADR. It is a
state change with no `transition`, no `transform` and no timing function — the element is in one
state or the other on the frame the pointer arrives. That is what makes it compatible with a site
that has no motion, and it is the boundary to hold: the next thing that wants to fade in is motion
and needs the amendment ADR-0007's document demands.

> **Amended by [ADR-0009](./0009-the-two-reveals-are-timed.md) (2026-08-22).** The reveal is timed
> now: the scrim fades over 220ms and the text rises 8px into it, gated on
> `prefers-reduced-motion: no-preference`. The paragraph above is kept as written because its
> reasoning is what ADR-0009 had to answer, and it was answered on its own terms — the direction was
> amended first, and what got a duration is this same device rather than a new one. The untimed
> declarations it describes are still in the file and are still the whole reveal under `reduce` and
> on a coarse pointer.

## What it costs the desktop LCP Path, measured

The index hero used to be laid out at 1232 px: the shell minus the 320 px metadata column and the
48 px gap. With the metadata column gone a Plate spans the whole shell, so it is now laid out at
**1600 px** at the cap, and the browser takes a higher rung off the same ladder.

Measured on the built files, cecret's hero, AVIF: **66.6 KB at the 1280 rung, 150.7 KB at 1920.**
About **+84 KB** on the desktop LCP Path. It stays well under ADR-0002's 500 KB, and it is under the
~220 KB of hero that the 2.5 s clock actually binds at, but it is a real number and this is the
document that has to hold it.

**The mobile gate does not see any of this**, which is exactly the trap `WIDE_SOURCE` already
carries a note about in `src/layout.ts`. `npm run budget` runs at mobile width, where the 4:5 crop is
served, the wide tier is never requested, and the LCP element is still the positioning paragraph —
verified unchanged after this change. The desktop figure is watched by hand or not at all.

## One spacing atom

`--gap` is the gutter between Cells, the padding from the screen edge, the gap between the Masthead's
columns, and the unit `--rhythm` is a multiple of. 20 px stacked, 48 px wide. Everything smaller sits
on a five-step ladder, `--s1` through `--s5`.

Before this the site had nine spacing values in use and four of them were written inside a page's own
scoped block, which is exactly how the type scale reached ten sizes before the six-style cap. So the
ladder is **enforced**: `npm run check:css` refuses a raw length in `margin`, `padding`, `gap`,
`row-gap` or `column-gap` in built site CSS unless it is zero or a `var(--...)`. The refusal is by
shape rather than by value, for the reason every other refusal in that script is: a value assertion
cannot see intent, and "just this one 14 px" leaves no trace in the design docs.

`--gutter` and `--plate-gap` are gone. `--gutter` became `--gap` because it is no longer only a
gutter, and `--plate-gap` was 48 px sitting beside a 48 px gutter — two names for one number, which
is the drift the token layer exists to prevent. `src/layout.ts` parses these names out of
`tokens.css`, so both renames were build errors until every consumer moved.

## The collage, as it was built

Kept because reviving it is a content decision rather than a design one, and the geometry below took
two passes to get right.

**Twelve columns, and a Unit derived from the band ratio.** Rows a fixed Unit tall, every Cell two
Units tall, a row holding one Cell or two. The Unit was defined so a Cell spanning all twelve columns
and two Units is exactly 21:9, the WIDE crop the site already has:

```
unit = (containerWidth * 9 / 21 - gap) / 2
```

Deriving it from the crop rather than picking a round number kept the full-width Cell the same band
the hero has always been, at every viewport, with no second ratio to keep in step. It also made the
Unit track the gap: a Unit defined as a plain multiple of column width drifts nine percent across the
wide mode's range as the gap becomes proportionally larger, against under half a percent this way.

**Every Cell aspect had to land between 4:5 and 21:9**, asserted at build time across four shell
widths. That window is the one `docs/design-direction.md` "Framing" rests on, the property that makes
a single `framing` keyword a per-ratio pair. A Cell outside it is cropped on both axes at once and
one keyword cannot serve it.

**The first version was six columns and it was wrong.** Its Cells ran **6.9x apart in area** and
owner review sent it back as "three really small and one really big". The cause is worth keeping,
because it is not obvious: two Cells sharing a row share a height, so their aspects stand in the same
ratio as their widths, and the window is only 2.9x wide. On six columns a row of three forced every
Cell to 2 columns, which at two Units is 0.73 and outside the window — so those rows had to drop to
one Unit. Short *and* narrow is small.

**Twelve columns fixed it by granularity.** Both parts of a split had to be at least 5 columns, since
a 4-column Cell at two Units is 0.73 again, leaving exactly three splits.

| Cell | Aspect | Area at the 1600px shell |
| --- | --- | --- |
| 5 of 12 | 0.93 | 438k |
| 6 of 12 | 1.13 | 532k |
| 7 of 12 | 1.33 | 626k |
| 12 of 12 | 2.33 | 1,097k |

The four Bands were `full` `(12,2)`, `pair` `(6,2)(6,2)`, `lead-left` `(7,2)(5,2)` and `lead-right`
`(5,2)(7,2)`. Cells were placed with explicit `grid-column` and `grid-row`, never auto-flow. The
five non-hero Cells landed within **1.43x** of each other, measured on the built page.

**The packing was seeded from the content** — an FNV-1a hash of the joined project ids driving an
xorshift PRNG — so the same Projects produced the same layout on every build and every machine.
`Math.random()` was rejected because a layout that differs per build is one nobody can reproduce: the
`sizes` attribute describes a geometry the next build will not have, and a Lighthouse run measures a
page that no longer exists. Bands were drawn from a bag rather than picked independently, so every
Band was used before any was reused. Two `full` Bands never sat together, and row one was always
`full` so the LCP element had a size the budget could be asserted against.

**Two things it needed that the even list does not.** The row Unit was `cqi`-derived, which made
`container-type: inline-size` necessary on `<main>` — and *not* on the grid, because a `cqi` inside a
container's own declarations resolves against an ancestor, not itself, and silently fell back to the
viewport. And a Cell narrower than 4:3 was better served by the 4:5 file than the 16:9 one, chosen at
the geometric mean of the two crops, since cropping is a ratio operation and the arithmetic midpoint
sends a 1.33 Cell on a 66% deeper cut than it needs.

**None of it required a new encode.** Both crops already ship for every Plate; a Cell's own ratio was
reached by `object-fit: cover` at the box, the same two-stage mechanism the Overscan uses.

## Rejected

| | |
| --- | --- |
| **Masonry (`grid-template-rows: masonry`)** | Not interoperable, and it solves the wrong problem: it packs items of intrinsic height, and these Cells have authored heights |
| **The collage itself** | Built, measured, and cut: six Projects is not enough work for differing sizes to read as curation rather than as noise. Kept above rather than deleted, because more Projects is what would change the answer |
| **Keeping the metadata column beside each image** | The arrangement this replaced. It is a persistent rail at Plate scale, and the precedent analysis had already cut the page-level version of exactly that |
| **Per-Cell re-encode at the Cell's exact ratio** | Six ratios x six Plates x two formats x a width ladder, for a crop `object-fit: cover` already performs from files that exist. It also invalidates CI's processed-image cache on every layout tweak |
| **A gradient scrim under the revealed metadata** | ~~Cannot promise 4.5:1 over arbitrary pixels, and it is the atmospheric effect a zero-shadow design spent its refusals avoiding.~~ **Adopted on amendment, bounded at α ≥ 0.595 where `--ink` is painted (0.938 for `--muted`)** — see "Metadata is revealed, not persistent" above for the derivation. The refusal was right about an unbounded gradient and wrong to generalise from it |
| **Metadata always visible under each Cell** | Safe, needs no amendment, and it was the owner's rejected option: it makes every Cell a card and reinstates the six identical rectangles a column at a time |
| **A caption strip reserved but empty at rest** | Avoids the overlay and avoids layout shift, and it leaves a band of empty ground under every image that reads as a mistake rather than as space |
