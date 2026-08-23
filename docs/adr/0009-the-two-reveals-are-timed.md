---
status: accepted
date: 2026-08-22
---

# The two reveals are timed

> **Amended by [ADR-0011](./0011-the-masthead-is-site-furniture.md) (2026-08-23).** The two
> reveals are one COMPONENT now, `src/components/Meta.astro`, rendered by each Plate and by
> the Masthead portrait — the terms below are single-sourced rather than kept in step by
> hand. They are also no longer both on `/`: the Masthead is site furniture, so the
> portrait's copy is on every route except `/about/ime/`. `--scrim` and its contrast
> derivation moved into that component with it.


`docs/design-direction.md` said **"The site does not move."** It no longer does. The two elements that
reveal a label over an image on `/` — a Plate's metadata band and the Masthead portrait's `About`
label — now **fade their scrim in over 220ms and rise their text 8px into it**, instead of swapping
between two states on the frame the pointer arrives.

Nothing else moves. No entrance, no navigation transition, no scroll effect, no third element. The
list of refusals in `docs/design-direction.md` survives this document intact, and every one of them
still applies.

> **Amended by [ADR-0010](./0010-registration-returns.md) (2026-08-23).** Two things above are no
> longer true. **Registration is back** — every substantial element now enters once as it first comes
> into view, first screen included — so "no entrance, no scroll effect" describes the site as this
> document left it, not as it stands. And **the durations were doubled**, to 440ms in and 280ms out,
> before ADR-0010 was written; every "220ms" and "140ms" below is the value this ADR shipped and is
> kept as a record. The ratio, the 60ms stagger, the 8px of travel, the scrim's stillness, the
> containing-block trap and every entry in the Rejected table are unchanged and still binding.
> ADR-0010 deliberately gives the entrance and the reveal ONE pace rather than two, which is what
> makes them one device — and it then **moved that shared pace to 760ms in / 480ms out** on owner
> review, because the entrance read as too quick at 440. So the reveals are now slower than this
> document shipped them and slower than the 480ms it rejected below. **That rejection is overturned,
> not overlooked**; ADR-0010 argues it and records what it costs a pointer sweeping six Plates.

This is an amendment to Datum, like ADR-0007 and ADR-0008 before it. The datum, the specification
line, the Plate contract, the three type roles, the one dark ground, `--gap` and the
greyscale-furniture argument are all untouched. So is the scrim's contrast derivation from ADR-0008:
the band's height, padding and gradient are unchanged, and the 8px of travel was chosen to stay
inside the padding so the text never climbs into thinner scrim than that table was built for.

Settled by owner review on 2026-08-22.

## Why this is an amendment rather than a drift

ADR-0008 gave `/` its first `:hover` rule, and `docs/motion.md` was corrected to say that two of them
existed and that **neither was motion** — each was an `opacity` swap with no duration, which that
document counted as the same class of thing as `:focus-visible`. The sentence it ended on was the
boundary: *an element that wants to ease into view is a different decision, and it needs
`docs/design-direction.md` amended first.*

That is this document. The boundary was not crossed by accident and it is not being widened: **the
thing that got a duration is the same one device, on the same two objects, under the same two
triggers.** What changed is only how it arrives.

**The argument for timing it.** The instant swap was defensible as a state, and it read as a defect.
A 280px slab of gradient appearing between two frames over a photographic render does not look like a
label being offered, it looks like the image failing to load a layer. The scrim was introduced
precisely so that pointing at the work would stop hiding the work; arriving in one frame put back a
smaller version of the thing it was there to fix.

**Why the old refusals still hold anyway.** The removed motion was cut because five categories
interlocked and clicking a Project put three of them on screen at once. This is one category, on one
page, on an element the visitor is deliberately pointing at. The strongest of those refusals — *a
mark that fires on content the visitor is already looking at is performing* — does not reach it:
nothing here fires on arrival, on scroll, or on anything but a pointer or a focus ring the visitor
moved themselves.

## What ships

| | |
| --- | --- |
| **Scrim** | `opacity` only. 220ms in, 140ms out, `ease-out` |
| **Text** | `transform: translateY(8px)` to `none`, same durations, 60ms delay on the way in only |
| **Trigger** | Unchanged: `:hover` and `:focus-within`, on `.plate` and `.masthead-aside` |
| **Guard** | `@media (hover: hover) and (prefers-reduced-motion: no-preference)` |

Values are custom properties on `<main>` in `src/pages/index.astro`, beside `--scrim`, for the reason
`--scrim` is there: two consumers, one file. They are not in `src/styles/tokens.css`, which is colour,
type and spacing.

**In is slower than out.** Arriving is the thing being read. Leaving is a pointer already on its way
somewhere else, and a column of six Plates swept across at 220ms each feels like the page is holding
on to every one of them.

**The 60ms is the site's own stagger unit**, the one the removed entrances used between lines. It is
spent separating the text from the ground it rises out of, not between the three metadata lines: the
band is one datum arriving, not three.

## The scrim does not move, and that is the whole design

`--scrim`'s top edge is a falloff, not an edge. Translate the band and that soft boundary slides down
the image, which reads as **a black panel arriving on the render** rather than as a label surfacing
out of it. Fading it in place keeps the boundary where it is and lets it resolve out of the image.

There is exactly **one `opacity`, not two.** The band's own opacity fades the scrim and the text
together, because the text is inside it. Giving the lines a second opacity multiplies two curves for
no visible gain. The stagger is what separates the text from its ground.

## The trap this is arranged around

Both reveals make the **whole tile** clickable with a stretched pseudo-element on the anchor —
`.title a::after` and `.about a::after`, each `position: absolute; inset: 0` against the tile.

**A `transform` on any ancestor of that pseudo-element makes the ancestor its containing block**, so
`inset: 0` collapses out of the image and onto the band. The Plate goes on revealing perfectly and
stops being clickable above its metadata. It is the same class of failure as the `position: absolute`
bug recorded in `src/pages/index.astro`, and it fails the same way: silently, only under a pointer,
and only in the part of the tile nobody thinks to re-test.

Setting the hovered state to `transform: none` is **not** sufficient on its own. Mid-transition the
computed transform is not `none`, which leaves a 220ms dead zone over the render on every pointer
entry — long enough for a fast click to land in it.

**So the anchor is never transformed.** One `<span>` inside each of the two anchors carries the rise;
the anchor stays outside the transformed subtree and the hit area is byte-for-byte the one that
shipped. That span needs `display: inline-block`, because `transform` does not apply to a
non-replaced inline box — without it the two `<p>` lines rise and the title silently does not.

Verified in a browser rather than by reading: `elementFromPoint` at the top of a Plate's render, at
its middle, just above the band and inside it, all resolve to the Project's anchor, hovered and not.

## The motion is a branch, never a rewrite

The untimed `opacity` declarations from ADR-0008 are still in the file, unchanged, and they are still
the entire reveal for a coarse pointer and under `prefers-reduced-motion: reduce`. The timed rules sit
beside them in a guarded block and restate no endpoints.

**Move the endpoints into the guard and `reduce` loses the reveal itself**, not just its timing. That
is the failure mode to watch, and it is why the two `@media not (hover: hover)` blocks were left
untouched by this change.

`src/styles/base.css` still declares no transition and no animation. This is the only motion on the
site and it lives entirely in the scoped block of `/`. (ADR-0010 changed both halves of that
sentence: `base.css` now carries Registration and the four custom properties moved there with it.)

## Rejected

| | |
| --- | --- |
| **Translating the whole band, scrim included** | One element, one transition, much simpler CSS. Cut on sight: the gradient's falloff slides with it and the reveal reads as a panel sliding in, which is the thing the scrim replaced |
| **Leaving it instant** | The state ADR-0008 shipped. Defensible as a state, and it reads as a layer failing to load |
| **480ms, the historic `rise` duration** | `docs/motion.md`'s number, for a one-time scroll entrance. Correct there, too slow for a pointer sweeping a column of six *(Superseded twice: the reveals went to 440ms, and ADR-0010 then took the shared pace to 760ms — half again slower than the number this row refused. The distinction it drew, that an entrance may be slow where a hover may not, was abandoned in favour of a single pace.)* |
| **A second `opacity` on the text lines** | Multiplies two curves inside an element that is already fading. The stagger does the same job and can be read off the file |
| **`@starting-style` / `transition-behavior: allow-discrete`** | In the baseline, and in the removed Expanded View's fade. Both elements always exist and never change `display`, so neither is needed. Reaching for them here is how a reveal becomes an animation without anyone deciding it should be |
| **Staggering the three metadata lines against each other** | The removed `rise` entrance rebuilt inside a hover. The band is one datum arriving, not three, and 60ms x 3 is a performance on content the pointer is already on |
| **Motion tokens in `src/styles/tokens.css`** | That file is colour, type and spacing, and it is the site's shared vocabulary. Four values used by one file's two rules are custom properties in that file, exactly as `--scrim` is |
| **A `transform` on `.title` or on `.about a` directly** | The obvious implementation, and it silently breaks the whole-tile hit area. See above |
