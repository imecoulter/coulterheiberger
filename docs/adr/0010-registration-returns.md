---
status: accepted
date: 2026-08-23
---

# Registration returns, and the first screen registers with it

`docs/design-direction.md` said **"nothing animates on load, nothing transitions between pages, and
nothing responds to scroll."** The middle clause survives. The other two do not.

**Registration is back.** Every substantial element on a page now enters once as it first comes into
view: `opacity` 0 to 1 with a `translateY` of 8px, over 760ms `ease-out`, staggered 60ms apart in
groups of four. It fires once and never re-triggers on scroll back. On `/` that is the Masthead and
each Plate; on a Project page it is the hero, the title, the summary, the facts, the body as one
block, and each Frame in the gallery.

**And it covers the first screen**, which the historic Registration never did.

This is an amendment to Datum, like ADR-0007, ADR-0008 and ADR-0009 before it. The datum, the
specification line, the Plate contract, the three type roles, the one dark ground and `--gap` are
untouched. So is ADR-0008's scrim contrast derivation: the 8px of travel is the same 8px, chosen to
stay inside the band's padding, and nothing about the gradient changed.

## Why it came back

Registration was removed in a pass that cut five interlocking categories at once, after clicking a
Project put three of them on screen together and the result read as artefacts rather than as craft.
That pass was right about the interlocking. It was not right about all five, and the argument
recorded against this one is the reason to reopen it.

Three of the stated grounds were **performance headroom, not design fit**:

- the LCP element must not start hidden, so the first screen could never register;
- the JS budget, against a substrate measured at 195 B gzip inside a 50 KB ceiling, which is 0.4%;
- a library comparison, which priced candidates nobody proposed adding.

**Headroom is not a design constraint.** A move is ruled out because it does not fit the work, or
because it costs something *measured*, and none of those three is either. The site loads in under
100 ms and had 49.6 KB of a 50 KB budget unspent.

What is left of the original argument is real, and narrower: an entrance that fires on content the
visitor has already read is performing. That is answered by fire-once, not by removal.

## The two tiers, and why there are two

The first screen is different, and it is different for one reason worth stating precisely, because
it is the reason the old rule existed.

An element at `opacity: 0` is not an LCP candidate. If it is un-hidden **by script**, the whole
JavaScript parse lands on the LCP Path before the hero can even become a candidate. That is the real
cost, and the old rule was right to refuse it.

A **CSS keyframe** does not have that shape. The browser records LCP at an element's first *non-zero*
paint, not when the animation finishes, so a fade that starts on the first frame costs roughly one
frame. Hence two tiers:

| tier | scope | mechanism | delay |
| --- | --- | --- | --- |
| **A** | marked in the template as `data-anim="now"` | a CSS `@keyframes`, no JavaScript | hero 0ms; the rest staggered 60ms apart |
| **B** | marked `data-anim="scroll"` | one `IntersectionObserver` adds `.is-in` once, then `unobserve`s | staggered within the entering batch |

**The hero carries no stagger delay.** An `animation-delay` on the LCP element is added to LCP
directly, one for one. Everything else on the first screen staggers behind it.

## One pace for both, and it moved to 760ms

760ms in, 480ms out, 60ms of stagger, 8px of travel. **Registration and the two reveals share every
one of those**, and sharing them is the point: the entrance and the reveal are then one device seen
twice rather than two systems that happen to occupy a page.

**The pair started at 440/280 and was slowed on owner review**, after the entrance shipped and read
as too quick. The in:out ratio is carried through unchanged (440:280 and 760:480 are both 1.58), and
the stagger and the travel are untouched.

**This overturns a rejection in ADR-0009, and it should be read as one.** That document rejected
480ms for the reveals — "correct there, too slow for a pointer sweeping a column of six" — and 760ms
is half again slower than the number it refused. The rejection was written when the reveal was the
only motion on the site and a pointer crossing six Plates was the only case it had to serve. With an
entrance on the page the reveal is no longer setting the site's pace on its own, and the owner's
call is that one pace reading as deliberate beats two paces each locally optimal. **If the reveals
now feel sticky under a fast pointer, that is the cost this decision accepted**, and the fix is to
split `--register-in` from `--reveal-in` rather than to quietly retune one of them.

The historic entrance ran at 480ms and 10px, and is superseded by all of the above.

So the four custom properties moved out of `src/pages/index.astro`'s scoped block and into `:root`
in `src/styles/base.css`, where three consumers can reach them. They still do **not** go in
`src/styles/tokens.css` — ADR-0009's reasoning holds unchanged: that file is colour, type and
spacing, and none of these is any of those.

## The guard, and the direction it fails in

Registration is gated on `@media (prefers-reduced-motion: no-preference)` **and nothing else**.

**Not on `hover`.** The two reveals are, and correctly: a reveal a coarse pointer can never trigger
would hide content on a phone, which is why ADR-0008's `@media not (hover: hover)` blocks hand it
over unconditionally. An entrance has no equivalent failure, because a phone scrolls. Hover-gating it
would mean the entire mobile audience never sees the site move.

**The hidden state is declared only inside the `no-preference` query.** Never as a `reduce` block
that turns something off. The inverted form computes the animated path first and fails *toward*
motion; this one fails toward stillness, and under `reduce` the page simply paints. `docs/motion.md`
records this as one of the two invisible rules, and it is the single easiest thing here to get
backwards.

`base.css` consequently gains a `prefers-reduced-motion` query of its own, the third on the site
after the two in `index.astro`'s scoped block. All three are `no-preference` gates. The number is not
the invariant and never was; the form is.

## The `<noscript>` block is back

Tier B elements start hidden and are un-hidden by script, which is exactly the condition
`src/layouts/Base.astro` recorded when it removed the block: *"anything added here that hides an
element until JavaScript runs needs this block back."* It is back, un-hiding `[data-anim]` so that
with scripting off every page is simply the page.

Tier A needs nothing, because a CSS animation runs without script.

## The containing-block trap applies to the entrance too

ADR-0009's trap is not a hover-only problem, and this is the part most likely to be broken later by
someone moving a `data-anim` attribute one element inward.

A `transform` on any ancestor of `.title a::after` / `.about a::after` makes that ancestor the
containing block and collapses the whole-tile hit area. A registering Plate holds a non-`none`
transform for the full 760ms, so a Plate whose `data-anim` sat between `.plate` and the anchor would
have a dead click target during its entrance, and it would come back by itself a moment later.
**Registration goes on `<li class="plate">`, and never between it and the `::after`.**

Relatedly, from `docs/motion.md`'s findings: a component's `transition` shorthand *replaces* one
inherited from `base.css`. Registration goes on wrappers, never on an `<img>` that `Plate.astro` also
styles.

## What it costs

Measured on the built site, not estimated.

| | before | after | delta |
| --- | --- | --- | --- |
| authored JS, gzip | 421 B | **637 B** | +216 B (1.3% of the 50 KB budget) |
| authored JS, raw | 834 B | **1,263 B** | +429 B |
| LCP, `/`, 1440x900 | 1,292 ms | **1,288 ms** | **−4 ms** |
| LCP, `/projects/cecret/` | 1,024 ms | **1,028 ms** | **+4 ms** |

LCP is the median of six interleaved runs per arm, 1.6 Mbps / 150 ms RTT and 4x CPU throttle, both
arms served through the same request interception and differing only in whether `data-anim` is
present. **Both deltas are inside run-to-run spread** (`/` ranged 1,220–1,292 with the attribute and
1,272–1,300 without): Tier A costs no measurable LCP, which is the prediction the two-tier design was
built on. The observer is Tier B only and never touches the LCP Path.

The budget is unchanged and nowhere near reached: LCP Path ≤ 500 KB, LCP < 2.5 s on throttled 4G, JS
on non-Exhibit routes ≤ 50 KB.

**A first measurement said +156 ms and it was the harness.** Only the stripped arm was going through
Playwright's request interception, and `route.fulfill()` serves the document from memory rather than
across the emulated network — so the control arm was paying 150 ms of throttled latency the test arm
was not, and the "cost of Registration" was the cost of not being intercepted. It was caught by
re-running at 100 ms and 1,200 ms durations and getting 1,280 and 1,276: **a delta that does not move
when the animation duration changes by 12x is not the animation.** `docs/motion.md` already carried
this lesson from the Carry's measurement, in nearly the same words. Read it before believing the next
one.

## Rejected

| | |
| --- | --- |
| **Re-playing on scroll back** | Declined by the owner. It is also what disqualifies `animation-timeline: view()`, so declining it costs the 0 B option |
| **`animation-timeline: view()`, 0 B of JavaScript** | Disqualified on **capability, not support**. It scrubs progress from scroll *position*, so it necessarily reverses on scroll back. Fire-once is not expressible in it |
| **Leaving the first screen out** | The historic rule. It is a real constraint against a script-driven entrance and not against a CSS keyframe, and keeping it would mean the page a visitor actually arrives on is the one page that does not move |
| **A stagger delay on the hero** | Adds to LCP one for one, buying 60ms of rhythm on the single element nothing is staggering against |
| **A slower entrance than the reveals, around 600ms** | A scroll entrance does have more room than a pointer sweeping a column of six. It is still a second timing pair in a codebase whose whole motion argument is that there is one device |
| **Restoring `draw rule` and `wipe` alongside `rise`** | The other two historic moves. Three moves at once is the interlocking that got all five cut; one is an amendment |
| **An animation library** | Priced in [issue #12](https://github.com/imecoulter/coulterheiberger-com/issues/12): 3,187 B gzip for the smallest candidate against a hand-rolled substrate in the hundreds, plus an `_astro/*.js` request on the LCP Path where the inlined script has none |
| **A second authored `<script>`, or an island** | The observer is a third behaviour inside the one script that exists. The rule is one authored `<script>`, not one behaviour |
| **Registering `.prose`'s children individually** | The MDX body would have to be walked at runtime, and it is one block of writing arriving. Same argument ADR-0009 used for not staggering the three metadata lines against each other |
| **Motion tokens in `tokens.css`** | Rejected in ADR-0009 and rejected again. Three consumers is still not a reason to put durations in the colour, type and spacing file; `:root` in `base.css`, beside the rules that use them, is |
