# Motion

**Nothing on this site moves today.** Every animation, transition and hover effect was removed in one
pass, back to the plain document: pages paint in their final state, a navigation is an ordinary full
page load, and no element responds to a pointer. This document is the record of what was there, why
each piece was built the way it was, and what it cost — kept so that rebuilding motion starts from
the measurements rather than from scratch.

**Why it went.** The five categories interlocked, and clicking a Project put three of them on screen
at once: the frame expanding, the image brightening, and content popping in and out. Rather than tune
a system whose parts were coupled that tightly, it was taken out entirely.

**This document is not the design direction.** `docs/design-direction.md` governs what the site is,
and it currently says the site has no motion. Adding any of this back is an amendment to that
document **first**, then an implementation. That order was binding before the removal and is
unchanged by it.

---

## Vocabulary

These five terms are out of `CONTEXT.md` because nothing on the site names them any more. They are
the vocabulary to return to, not synonyms to re-invent.

**Registration** — The one-time entrance of an element as it first enters the viewport. It marks the
arrival of a piece of information rather than performing for the visitor: it never repeats on scroll
back, and never applies to the first screen. Scoped hard at review to a piece of writing arriving.
The term is free because the corner registration *marks* it might have collided with were cut as
costume.
_Avoid_: reveal, fade-in, scroll animation, entrance effect

**Navigation Cross-fade** — The brief cross-fade between two pages during an ordinary navigation. The
site has no client-side router — every navigation is a full page load, and the cross-fade was the
browser's own, present where it was supported and absent where it was not.
_Avoid_: page transition, view transitions, SPA navigation, routing

**Carry** — The continuity of a single Plate's image across a Navigation Cross-fade: it holds its
position and its scale while the rest of the page fades. The one place on the site where an element
scaled.
_Avoid_: morph, shared element, hero transition, magic move

**Traverse** — The pointer-driven travel of a Plate's wide image beneath the cursor, on the index
only. The only category a visitor drove directly: Registration and the Carry happened to them, the
Traverse happened because of them. Two axes, deliberately slight — vertically through the Overscan,
horizontally through a small constant enlargement, since the Overscan is vertical only.
_Avoid_: parallax, hover effect, tilt, holographic, pan

**Overscan** — still defined in `CONTEXT.md`, because it still physically exists. The wide tier is
cut 16:9 and shown 21:9, and that slack was what the Traverse travelled through. It was kept through
the removal so that rebuilding the Traverse is a CSS-only change; see "What was kept" below.

---

## The design spec

From `docs/design-direction.md`. This is the half that says what motion on this site is *for*.

**Registration, not performance.** Line-level only. Fires once and never re-triggers on scroll back.
Nothing parallaxes, and element-level Registration never scales. At most two elements animating at a
time. (`draw rule` scales a hairline into existence, which is a draw rather than a zoom; no
Registration move changes the size of content.)

That rule read a flat **"nothing scales"** until
[#31](https://github.com/imecoulter/coulterheiberger-com/issues/31) adopted the Carry. The narrowing
was written into the rule rather than granted as an exception beside it — a hard rule with an
undocumented exception is not a hard rule.

| name | move | duration |
| --- | --- | --- |
| rise | opacity 0→1, `translateY(10px)`→0 | 0.48 s ease-out |
| draw rule | `scaleX(0)`→`scaleX(1)`, origin left | 0.62 s ease-out |
| wipe | `clip-path: inset(100% 0 0 0)`→`inset(0)` | 0.56 s ease-out |

Staggered in groups of four at 60 ms. Fully disabled under `prefers-reduced-motion: reduce`.

**`/` registered nothing, as of owner review.** Every Plate used to arrive on scroll, the metadata on
`rise` and the image on `wipe`. On a page whose entire content *is* six Plates, six entrances meant
the work announced itself before it showed itself. The last surviving user of Registration anywhere
on the site was the body prose on `/projects/<slug>/`, which is a paragraph arriving under a heading
and is what the mark was described for.

**Nothing on the first screen registers.** Content above the fold paints in its final state. This
started as an LCP constraint — a hidden hero is not an LCP candidate, so it would make the paint wait
on a script — but it is also the right call for the direction: a mark that fires on content the
visitor is already looking at is performing, which is the thing the spec exists to refuse.

**Two page-to-page moves, and no client-side router** — see
[issue #12](https://github.com/imecoulter/coulterheiberger-com/issues/12), which priced one at
5,494 B gzip against 426 B for the entire motion substrate, on a site whose page loads already land
in under 100 ms.

**Every Plate on `/` carried, not only the one that was clicked, and the reason was mechanical.** With
no JavaScript, CSS cannot know which Plate was clicked — there is no `:active` state surviving a
document swap, and no selector for "the link the visitor just followed". Naming all of them was the
only **stateless** way to guarantee the clicked one carried. The other five simply exited: a name
with no counterpart in the incoming document animates out and costs nothing else.

That it also read as the equivalence thesis — naming just the first would say one piece of work is
the way into the others — was true, and it was a reading, not the reason. The distinction matters
because the two answers behave differently under pressure: if the equivalence argument were the
load-bearing one, a future "name only the clicked plate" optimisation would look like a betrayal of
the direction rather than what it is, which is **a second `<script>` and an amendment to the design
direction**.

**The Traverse happened because of a visitor, not to them**, and that is what made it a category
rather than a fifth Registration move. It was off wherever it would be a lie or a nuisance:
`(hover: hover) and (pointer: fine)`, because on touch a hover is the first half of a tap, and
`reduce`, like everything else. It was on `/` only.

**"Nothing parallaxes" held, and the Traverse was not a quiet exception to it.** Parallax is
scroll-linked differential movement between layers: two things moving at different rates to fake
depth the page does not have. The Traverse was one element and the input was the pointer rather than
the scroll position. Nothing was layered and nothing pretended to be behind anything.

**"Never scales" was narrowed a second time for it.** The rule is about Registration, and about
*animating* size: no move changes the size of content while it plays. The Traverse's 5% was a
constant — the image was laid out enlarged and stayed that way, hovered or not, on `/` and on
`/projects/<slug>/` alike, which is also what kept the Carry's two ends identical.

---

## How it was built

From `docs/styling.md`. This is the implementation record.

### Registration

Three moves (`rise`, `rule`, `wipe`) in `base.css`; one `IntersectionObserver` in `Base.astro` added
`.is-in` once and stopped watching. The contract was three attributes and nothing else:

| | |
| --- | --- |
| `data-anim="rise\|rule\|wipe"` | opts an element in and picks its move |
| `.is-in` | added by the observer; the only thing that part of the script did |
| `--d` | stagger delay, set per element in groups of four at 60 ms |

A `<noscript>` block in `Base.astro` un-hid `[data-anim]` elements, `:root`-qualified to outrank
`base.css`'s equal-specificity rules. **Anything reintroduced that starts hidden needs that block
back**, or the page is blank to a visitor with scripting off.

### Navigation Cross-fade

`@view-transition { navigation: auto; }`, three lines of CSS in `base.css`. Zero JavaScript, no
client-side router. Chrome 126+ / Safari 18.2+; Firefox has no support and simply navigates.

### The Carry

Zero JavaScript, and nothing in `base.css` except the handoff rule: it lived in
`src/components/Plate.astro`'s scoped `<style>`, beside the markup that emitted `--vt`, so there was
no global selector reaching for an inline custom property.

| | |
| --- | --- |
| Named element | **The `<picture>`, which is the clip box** — see the measured bug below |
| Name | `plate-<slug>`, from the Project slug. Unique per document by construction, matched across the two documents for free, and reversed on back-navigation for free |
| Declaration | `--vt: plate-<slug>` in the `<picture>`'s inline vars; `view-transition-name: var(--vt, none)` **inside** `@media (prefers-reduced-motion: no-preference)` |
| Grouping | `view-transition-class: plate`, declared in `Plate.astro` and consumed by `::view-transition-old(.plate)` in `base.css`. The pseudo-elements are on the **root**, and Astro's scoping rewrites a selector against the component's own elements — a scoped `::view-transition-old(.plate)` compiles to something that matches nothing, silently |
| Coverage | Every Plate on `/` was named, so one click carried all 3–8 |
| Handoff | `::view-transition-old(.plate) { animation: none; opacity: 1 }` held the outgoing snapshot instead of cross-fading it, so the incoming hero faded in over a picture rather than over a hole |
| `reduce` | No transition at all; the fail-safe inversion was not reopened |

### The Traverse

| | |
| --- | --- |
| vertical | `object-position` on the `<img>`, travelling the real Overscan: the wide file is cut **16:9** and shown **21:9**, leaving 23.8% of its height outside the box. No upscale |
| horizontal | `transform: translate3d()` with a constant `scale(1.05)`. There is no sideways Overscan — `cover` fits the file to the box by width — so the enlargement created the slack and the translate spent it |
| how far | `--reach: 25%` either side of the anchor, and `--sweep`, **derived** as `(--zoom - 1) * 50%`. Halved at review from a full sweep and a 10% zoom. The zoom came down with the sweep rather than staying put: the enlargement exists only to create the sideways travel, so holding it while spending half of it would pay the whole quality cost for half the movement |
| resting place | `--rest-y`, mapped from the Plate's own `framing` keyword in `src/layout.ts`. The travel was **relative to it** and `clamp()`ed to the file, so a Plate framed `bottom` moved up from its anchor and was never pushed past it |
| driven by | `--py` and `--tx`, both **unitless −1..1**, set on the `<li class="plate">` on `pointermove` and inheriting down. The script carried no amplitude: halving the move did not touch it |
| measured against | the `<picture>`. Not the `<img>`, whose rect is the transformed one, so the mapping would feed its output back into its input; and not the Plate, which on desktop is the image *plus* the 320px metadata column |
| eased | `transition: object-position 0.4s ease-out, transform 0.4s ease-out`, so it followed the pointer rather than sticking to it |
| gated | `(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine) and (min-aspect-ratio: 1 / 1)` in the CSS; the first three in the script. The shape was not mirrored because in the mobile mode the image exactly fills its box and both properties are inert rather than wrong |
| scope | `[data-reveal]` on the Plate itself, emitted by `src/pages/index.astro`. `Plate.astro` owned the geometry, not the binding |

The two signs were opposite on purpose. `object-position` names the part of the picture the box
shows, so it rose with the pointer; `translate` moves the picture itself, so it fell against it. Both
mean "point at a thing and it comes to you", which is the only way the two axes read as one.

`--py` and `--tx` were **removed** on `pointerleave`, never set back to a value: both CSS fallback
chains ended at 0, which resolves to the author's `framing` anchor and an untranslated image, so
deleting the properties *was* the rest state. Writing the resting number into the script would be a
second copy of the author's composition decision, in JavaScript, where nothing would ever check it.

**The hover target was the whole Plate, and it had to be.** The index gives each Plate one link whose
`::after` covers the row, so a pointer over the image targets that `<a>` in the metadata column,
never the `<picture>`. `.plate` is the one element both are inside, and events reach it by bubbling
from either. That it also read correctly — `CONTEXT.md` calls a Plate "a single unit", so the unit
responds — was true and was not the reason.

### The Expanded View's fade

The dialog itself is not motion and still ships; `docs/styling.md` keeps it. Only the fade came out:

```css
@media (prefers-reduced-motion: no-preference) {
  dialog.expanded {
    opacity: 0;
    transition:
      opacity 0.24s ease-out,
      display 0.24s ease-out allow-discrete,
      overlay 0.24s ease-out allow-discrete;
  }
  dialog.expanded[open] { opacity: 1; }
  @starting-style {
    dialog.expanded[open] { opacity: 0; }
  }
}
```

`allow-discrete` on `display` and `overlay`, plus `@starting-style`, are what let an element that
goes `display: none` animate at all. Where they are unsupported the dialog simply appeared and
disappeared, which is the correct failure — and is what it does now.

---

## Four findings that cost real time

Each of these was found by running something, not by reading it. All four fail silently.

**1. A component's `transition` shorthand replaces an entrance declared in `base.css`.** `wipe` was
put on the Plate's `<img>`, which `Plate.astro` also gave `transition: object-position, transform`
for the Traverse. `transition` is a shorthand, and the scoped rule compiles to `img.astro-<hash>` at
(0,1,1) against `[data-anim='wipe']` at (0,1,0) — so it did not merge, it **replaced**. Every Plate
that should have wiped in snapped instead: `transitionProperty` read `object-position` on five images
sitting at `clip-path: inset(100% 0 0 0)`. Silent both ways — nothing warns, and the page looks like
a page with no animation rather than a broken one. **If `wipe` is rebuilt, it goes on a wrapper,
never on an `<img>` a component also styles.**

**2. Naming the `<img>` instead of the `<picture>` popped the Carry ~28px per side.** The `<img>` was
laid out 5% larger than its box at all times (`--zoom`, which created the Traverse's sideways travel)
and the `overflow: hidden` hiding that bleed lived on the `<picture>` **above** it. A named element
is lifted into the top layer, where its own clip still applies and its ancestors' do not — so the 5%
became the visible edge for the length of the transition and snapped back at the end. Measured at
1600×900: the group's left edge sat at **x=17 against a 48px gutter**, which is `1121 × 0.05 / 2`.
**Anything that clips a Plate belongs on the `<picture>`.**

**3. A vertical-only Traverse is unreachable.** It shipped that way, resting at the midpoint — and a
cursor crosses a 21:9 band *along* it, not down it. A full-width horizontal sweep on the built page
returned six samples of `50% 50%`, and a 40px vertical nudge moved the image 12px on a 961px-wide
photograph. The review that reported "no hover effect" was reading the page correctly. **The lesson
is about where an effect is reachable, not whether it is present:** every unit-level check passed the
whole time, because each one drove the axis that worked.

**4. `blocking="render"` is not honoured on `<link rel="preload" as="image">`.** Probed in Chrome:
with the image stalled 2500 ms the page still painted at 36 ms. `rel="expect"` waits for an element
to be parsed, not for bytes. **There is no way to make a document wait for an image**, which is why
the Carry needed both the held snapshot and the warming prefetch rather than either alone.

---

## Two rules that are invisible until something breaks

**Nothing on the first screen carries `data-anim`.** An element at `opacity: 0` or fully clipped is
not an LCP candidate — [web.dev's LCP article](https://web.dev/articles/lcp) excludes "elements with
an opacity of 0" — so animating the hero makes LCP wait for the script instead of the image decode.
The perf gate will catch a violation, but only after it ships.

**The hidden state is declared only inside `@media (prefers-reduced-motion: no-preference)`**, for
Registration, the Cross-fade and the Carry alike. This is the reduced-motion design, not a formatting
habit: under `reduce` the page is simply the finished document — verified in a real browser, computed
`opacity: 1`, no transform, no clip, `transition-duration: 0s`, and `pagereveal.viewTransition` null
on a real navigation. **Do not rewrite any of them as a `reduce` block that turns things off.** That
form computes the animated path first and fails *toward* motion; this one fails toward stillness.

That inversion is also why there is no `prefers-reduced-motion` query left in the codebase at all:
remove the animated state and the query has nothing to guard.

---

## What it cost

### The threshold the Carry was held to

**"0 bytes" was the wrong meter, and #12 recorded it.** The cross-fade was priced at zero and shipped
on that basis. Field RUM on cross-document view transitions reports roughly **+70 ms LCP on repeat
mobile pageviews**, correlated with CPU
([corewebvitals.io](https://www.corewebvitals.io/pagespeed/view-transition-web-performance)). The
transfer cost genuinely is zero; the paint cost is not.

**The threshold was relative on purpose:** the Carry's own delta must not exceed the ~70 ms the plain
cross-fade already costs. An absolute millisecond budget would be invented and then argued with; a
figure the site already pays and has already accepted holds its meaning when the hardware changes.

**The perf gate structurally cannot see any of this.** `npm run budget` is `lhci collect` plus
`scripts/assert-lcp-path.mjs` over cold loads, and no browser-driving devDependency exists in this
repo. Extending CI with Playwright to police a transition was considered and rejected: the
enforcement machinery would outweigh the thing enforced.

### Measured mechanics

Moved out of `docs/content-architecture.md`'s "Verified mechanics" table, where they described a
shipped behaviour.

| Claim | Result |
| --- | --- |
| `view-transition-name: var(--vt)` substitutes, and the unset case computes to `none` | **Confirmed in Chrome.** `--vt: probe-name` computes `probe-name`; the same rule with `--vt` unset computes `none`. Chrome only — Safari was never driven |
| The Carry's LCP delta on real plates | **+20 ms**, median of 11 interleaved runs, 4× CPU throttle, real `/` → `/projects/cecret/` navigation with all six Plates named. Named median 156 ms, unnamed 136 ms, distributions barely overlapping (named min 144, unnamed max 152) — an effect rather than noise. Under the ~70 ms threshold |
| Under `prefers-reduced-motion: reduce` the Plate is the plain document | Confirmed on a real navigation: `view-transition-name: none`, `clip-path: none`, `opacity: 1`, `transition-duration: 0s` |

The delta was measured by suppressing `view-transition-name` on the unnamed arm and **asserting the
suppression actually applied** before trusting any number. The first attempt injected the override
too early, `document.documentElement` was still null, and the two arms were silently identical — a
delta of −8 ms came back and it was measuring nothing. **Read a Carry measurement that reports a
negative delta as a broken harness, not as a free transition.**

### What the script cost

Registration alone was **195 B gzip**, zero extra requests. Registration plus the Traverse plus the
Expanded View was **641 B gzip / 1,315 B raw**, 1.1% of ADR-0002's 50 KB budget, still one inline
block and still zero extra requests. The whole substrate on the wire was **+426 B gzip on the
document**.

**After the removal it is 421 B gzip / 834 B raw** — warming plus the Expanded View, measured off
`dist/index.html`. So the two motion behaviours were 220 B gzip of the 641, and what is left is the
half that never drew anything.

### What each library option costs

Measured on this repo's real dependency graph (astro 7.2.0 / vite 8.2.1 / rolldown, gsap 3.15.0,
motion 13.1.0), gzip level 6 — the unit `lighthouserc.cjs` asserts against 51,200 B. Kept so the
choice can be reopened with numbers instead of re-derived from scratch:

| approach | gzip | requests | % of the 50 KB JS budget |
| --- | --- | --- | --- |
| **IntersectionObserver + CSS** (Registration alone) | **195 B** | **0 — inlined** | 0.4% |
| `motion/mini` (`animate`) + IO | 3,187 B | 1 | 6.2% |
| `motion` (`animate` + `inView` + `stagger`) | 21,755 B | 1 | 42.5% |
| GSAP core alone | 27,297 B | 1 | 53.3% |
| GSAP + ScrollTrigger | 44,205 B | 1 | 86.3% |
| GSAP + ScrollTrigger + SplitText | 47,104 B | 1 | 92.0% |
| Astro `ClientRouter` | 5,494 B | 1 | 10.7% |
| Native CSS scroll-driven | 0 B | 0 | — cannot fire once |

Three things that table doesn't show:

- **An external file is a round trip.** Under the gate's `devtools` throttling every library
  candidate costs 562.5 ms of latency before anything it reveals can paint, and lands *on* the LCP
  Path — GSAP would spend ~44 KB of the ~240 KB the 2.5 s clock actually permits, for zero pixels.
- **Native scroll-driven CSS is disqualified on capability, not support.** `animation-timeline:
  view()` scrubs progress from scroll *position*, so it necessarily reverses on scroll back, and the
  design direction required fire-once. Firefox's absence is the second reason, not the first.
- **`ClientRouter` is 13x the whole substrate** — 5,494 B against 426 B — on a site whose full page
  loads measure 67–104 ms TTFB. Its one unique capability is `transition:persist` for live state, and
  v1 has none. Astro's own docs say it "will increasingly become unnecessary" as the native API
  lands.

---

## What was kept, and why

**The Overscan.** The wide tier is still cut 16:9 and shown 21:9, which is ~31% more pixels than the
band needs — measured at 66.6 KB for the largest hero at the width a 1440×900 desktop fetches.
Re-cutting it at 21:9 would reclaim that, but rebuilding the Traverse would then mean editing
`src/layout.ts` and re-encoding every wide variant, which also invalidates CI's processed-image
cache. Kept, the Traverse is a CSS-only change.

Note the cost does not appear in the perf gate: it runs at mobile width, where the 4:5 crop is served
and the wide tier is never requested. **The gate's LCP number not moving is not the same as the slack
being free.** Watch the desktop figure by hand.

**`overflow: hidden` on the `<picture>`.** Inert today — nothing overflows it — and kept because it
is the clip box, and finding #2 above is what happens when a clip lands on the `<img>` instead.

**`--rest-y` and the `framing` keyword.** Not motion. The file is larger than its box, so without an
anchor the browser centre-crops the Overscan and discards the composition decision sharp honoured.

**`SLUG_RE`'s leading-letter rule** in `scripts/lib/repo.mjs`. A slug that starts with a digit is a
fine URL and a broken `<custom-ident>`, which is what `plate-<slug>` was. Nothing consumes the ident
today; the rule stays so that rebuilding the Carry does not need a round of 301s.

**The warming prefetch** in `Base.astro`. `/` and `/projects/<slug>/` resolve different rungs of one
ladder (~1136px against ~1504px at a 1600px window), so the Project page opens on a hero that is a
real network fetch. Warming on `pointerenter` and `pointerdown` buys it the width of a deliberate
movement toward the link. It is a cache warm with no visual — not a hover effect, despite the
trigger.

---

## Rebuilding any of this

1. **Amend `docs/design-direction.md` first.** It currently states the site has no motion. Changing
   what the site does starts there, then a mechanism is chosen to serve it. Never the reverse.
2. **Drive it with a real pointer.** A dispatched `pointermove` bypasses hit testing entirely and
   reports success on a target no real cursor can reach. Finding #3 above passed every unit-level
   check while being invisible on the page. On `/` the Plate's link overlay owns the pointer over
   the image, so a driver that targets the `<img>` will be refused — that refusal is correct, and
   `elementsFromPoint` at the image centre should return the `<a>` **first**.
3. **Verify against `dist` or a restarted server, never a dev server that predates the edits.** A
   stale `astro dev` reported `scale(1.05)` and a live 0.4s transition on a tree containing neither,
   which looks exactly like a change that did not apply. Removing motion is the dangerous direction
   here: the stale reading is the one that says the work failed, so it invites re-doing an edit that
   was already correct. Confirm the served bytes, not the process.
4. **Re-run the library comparison against 641 B, not 195 B**, if it is reopened. Every candidate in
   the table replaces Registration, and none of them would have made the Traverse or the Expanded
   View smaller. At that point the candidate is `motion/mini` at 3.2 KB unless SplitText specifically
   is what you need.
5. **One authored `<script>` is the rule, not one behaviour.** A second file, an island, or a library
   is an amendment to the design direction, not an implementation detail. The Carry was explicitly
   never to be rescued with JavaScript for this reason: a ~200-byte click handler naming only the
   clicked Plate is the obvious fix and it is out of bounds.
6. **Keep the fail-safe inversion.** Declare the hidden and animated states only under
   `no-preference`, so `reduce` is the plain document rather than a branch that switches motion off.
7. **Restore the `<noscript>` block** in `Base.astro` if anything starts hidden and is revealed by
   script. Without it, scripting-off visitors get an element at `opacity: 0` and no way back.
