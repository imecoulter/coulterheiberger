# Styling

Hand-written modern CSS. **No Tailwind, no CSS framework, no preprocessor.** Decided in
[issue #11](https://github.com/imecoulter/coulterheiberger-com/issues/11) by building the design
both ways and measuring; the rejected alternative and the tripwire for revisiting it are recorded
there and summarised at the bottom of this file.

## Where things live

```
src/styles/tokens.css    custom properties only — nothing in this file paints
src/styles/base.css      reset, element defaults, type roles, Registration, cross-fade
src/styles/fonts.css     @font-face only — two faces, nothing else
src/layouts/Base.astro   imports the above once for every page; holds the only <script>
src/components/*.astro   everything else, in a scoped <style> block
```

That is the whole convention. **Do not invent a fourth location.** No `global.css`, no
`utilities.css`, no per-route stylesheet, no `<style is:global>` outside `Base.astro`.

**JavaScript gets the same rule, with one home instead of three.** The site has exactly one
*authored* `<script>`, inline in `Base.astro`. No `src/scripts/`, no per-page script, no island — see
[Motion](#motion) for why, and for what it would take to justify a second one.

The one script that is not authored here is the Cloudflare Web Analytics beacon, also in
`Base.astro`, shipped verbatim and governed by
[ADR-0004](./adr/0004-measurement-committed-beacon-no-field-cwv.md). It is committed rather
than edge-injected so that CI measures what visitors receive, and it counts against the 50 KB JS
budget with no carve-out. It is not a precedent for a second authored script.

## The one rule

**A component never hard-codes a value that a token names.** Write `var(--rule)`, not `#c9c6c0`.
Write `var(--f-mono)`, not `'JetBrains Mono', …`.

This is not tidiness — it is what makes the night band work. The band reassigns four properties and
every component inside it inverts without knowing the band exists.

## Tokens

Three primaries. Everything else derives or is a scale.

| token | role |
| --- | --- |
| `--ground` | the surface |
| `--ink` | text on the surface |
| `--signal` | registration red: the `:focus-visible` outline, and nothing else. See the design direction for what it stopped being. |
| `--rule` | derived — hairline, `color-mix` 18% ink into ground |
| `--muted` | derived — secondary text, `color-mix` 58% ink into ground |

`--rule` and `--muted` are tints on the ground/ink axis, so a context that flips the two primaries
gets a coherent pair for free.

### Layout measures, and the one place the rule is not enough

Four more tokens arrived with the Project routes. They are plain measures, but they are declared **in
px** and that is deliberate:

| token | role |
| --- | --- |
| `--measure-page` | the page shell, 1600px — was hard-coded in two components before this |
| `--plate-meta` | the metadata column beside a Plate on `/` |
| `--plate-gap` | the gutter between a Plate's image and its metadata |
| `--body-col` | the whole body column on `/projects/<slug>/`: heading, summary, prose and every Frame |

`--body-col` replaced two tokens at review, `--gallery-col` (1080px, Frames) and `--measure` (64ch,
text). They drew two different right edges down one page for no reason a reader could see, and they
are now one edge at 800px, which is `--measure-page` halved.

**Recorded because it is a real cost, not a free simplification:** 800px of Georgia at 17px runs to
roughly 78 characters a line, above the 45–75 a reading measure wants. The Project bodies are two to
four short paragraphs, which is what makes that affordable here and would not on a long piece. If the
Build Log ever ships prose at length, it wants its own measure back rather than this one widened or
narrowed underneath the Frames.

**The one rule — never hard-code a value a token names — cannot be obeyed by `sizes`.** `sizes` is an
HTML attribute, so it cannot say `var(--body-col)`. Writing the number into the markup instead is
the classic silent drift: the layout still looks correct and the browser simply fetches the wrong
width, which on `/` lands on the LCP Path and in the gallery lands on Post-LCP Media — the one tier
ADR-0002 leaves uncapped, and therefore the one nobody is watching.

So `src/layout.ts` **parses these tokens out of `tokens.css` at build time** and composes every `sizes`
string from them. One number, two consumers, and renaming a token is a build error rather than a 2×
over-fetch. The file arrives through Vite's `?raw`, not `node:fs`: this module is bundled into
`dist/.prerender/` before it runs, so `import.meta.url` resolves next to the *bundle* and the build
dies with `ENOENT`.

### The night band, and a trap

Exactly **one** night band per page (see the design direction). It is a class that reassigns tokens:

```css
.night {
  --ground: #0e1114;
  --ink: #e8e6e1;

  /* These two MUST be restated. See below. */
  --rule: color-mix(in oklab, var(--ink) 18%, var(--ground));
  --muted: color-mix(in oklab, var(--ink) 58%, var(--ground));
}
```

**Do not "simplify" this by deleting the last two lines.** A custom property is resolved at
computed-value time *on the element that declares it*, then inherits as an already-resolved value.
A `color-mix()` declared only on `:root` therefore bakes in `:root`'s ground and ink and will **not**
re-derive inside `.night`. Verified on the built page: with those lines removed, day and night both
compute `oklab(0.819525 …)` for `--rule` — the day-tinted hairline on the night ground. It looks
correct in the editor and wrong in the browser.

## Type roles

Three families, three classes. **Serif body is the element default and has no class.**

| class | family | use |
| --- | --- | --- |
| `.t-display` | grotesk | non-heading display text (`h1`–`h3` already get it from `base.css`) |
| `.t-label` | mono | section labels |
| `.t-spec` | mono | the specification line, metadata terms, captions, footer |

**Hard cap: three.** A fourth type role is a change to the design direction, not a styling decision.
Amend `docs/design-direction.md` first.

## Modern CSS baseline

Decided in #11, verified against the build:

- **Nesting — yes.** Compiles clean through Astro 7 / Vite 8; no `&` reaches the output.
- **Cascade layers — no.** The reset is element selectors and components are class-scoped with a
  hash attribute, so scoped styles already win. Layers would solve a conflict that does not exist.
- **Container queries — no**, until a component actually ships at two different widths. Every Plate
  today sits in the same container; media queries are the honest tool for a viewport switch.
- **`:has()` — allowed**, but do not build structure on it. The one shipped use is the Expanded
  View's scroll lock, `html:has(dialog.expanded[open]) { overflow: hidden }`, which is a state
  toggle: it stops something moving and lays nothing out.
- **`@starting-style` and `transition-behavior: allow-discrete` — yes**, for the Expanded View's
  fade. They are the only way an element that goes `display: none` can animate at all, and where an
  engine lacks them the dialog appears and disappears instantly, which is the correct failure. Do not
  reach for them to animate anything that is not entering or leaving the top layer.
- **`backdrop-filter` — yes, on a real element, never on `::backdrop`.** See the Expanded View below
  for why that is not a preference.
- **Reset — hand-written, six lines, in `base.css`.** No `normalize.css`, no Preflight. This design
  has already made most of those decisions differently.

## Delivery

`build.inlineStylesheets: 'always'` in `astro.config.mjs`.

Astro's default is `'auto'`, which inlines only below Vite's 4 KB threshold. The real page measured
**4,263 B** — just over — so the default would ship a separate render-blocking request. Inlining
removes one round trip from the LCP Path at no meaningful byte cost.

## Fonts

`@font-face` lives in `src/styles/fonts.css`, **self-hosted**, with the files under `src/fonts/` so
Vite hashes and cache-busts them. **Never a Google Fonts `<link>`** — the prototype used one, and it
costs two extra origins and a render-blocking external stylesheet on the LCP Path.

Two files ship, **14,884 B on the wire**:

| | file | |
| --- | --- | ---: |
| display | `montserrat-wght500-site-trimmed.woff2` | 9,656 B |
| mono | `jetbrainsmono-wght500-mono-spec-no-liga.woff2` | 5,228 B |

The body serif is a **system stack** and has no file. Why, and everything else about the faces, is in
[docs/design-direction.md](./design-direction.md#typography); the measurements are in
[docs/research/typography-lcp-path.md](./research/typography-lcp-path.md).

**Regenerating them.** The woff2 are committed binaries, so they need a reproducible build step:

```
python -m venv .venv-fonts
.venv-fonts/Scripts/pip install fonttools brotli
PYTHON=.venv-fonts/Scripts/python.exe FONT_SRC=<dir> node scripts/dev/subset-fonts.mjs
```

Sources are the variable TTFs from `github.com/google/fonts` and are **not** committed. The script
asserts that name IDs 13/14 survive subsetting — without them the file breaks OFL 1.1 clause 2, and
pyftsubset drops them by default. Licence terms are in [NOTICE](../NOTICE).

**The output is byte-reproducible**, which is the only thing that makes a committed binary auditable:
run it twice on the same sources and the hashes match. That was not true until `--no-recalc-timestamp`
was passed to `varLib.instancer`, which stamps `head.modified` with the current time by default and
compresses it into the woff2. It surfaced because a charset change to *mono* moved *Montserrat* by
4 bytes.

**The mono cut includes lowercase (`U+0061-007A`)** even though `.t-label` and `.t-spec` both
uppercase their text. It is there for the email address in
`src/components/Footer.astro`, which sets `text-transform: none` precisely because an address is data
rather than a phrase. Consequence worth knowing: the subset no
longer *enforces* mono-as-an-uppercase-face, so a stray lowercase mono line will now render instead of
falling back conspicuously and telling you.

**Three things not to undo:**

- **No `<link rel="preload">`.** Measured *slower* on a text page (727 → 1,074 ms). Stylesheets are
  inlined, so `@font-face` is already in the document; a preload only promotes fonts ahead of a paint
  they never blocked.
- **Fonts are never base64-inlined.** `astro.config.mjs` forces `assetsInlineLimit` to skip `.woff2`.
  Vite's 4,096 B default inlined the mono file when it was 4,020 B — and only that one — putting it on
  the document's critical path, where on a text-LCP page it delays the paint that *is* the LCP. At
  5,228 B it now clears the threshold unaided, which is exactly why the rule stays written down: one
  charset edit moved it from 76 B under the line to 1,132 B over, and nothing warns you either way.
- **`font-display: swap`**, not `optional`. Indistinguishable on every measurement taken, and
  `optional` risks a first visit with no webfont at all. Revisit only if a real CLS case is shown.

### The icon set, and where the glyphs come from

The site shipped **Astro's own logo** as its favicon from the first commit through the whole of v1,
which is the kind of thing that is invisible in a diff and obvious in a tab strip. It is now a **CH
monogram in Montserrat 500**, and every file is generated from one mark by
`scripts/dev/build-favicons.mjs` — dev-only, never run in CI, output committed.

| file | who reads it |
| --- | --- |
| `favicon.ico` | browsers request `/favicon.ico` whether it is declared or not. 16, 32 and 48 |
| `favicon.svg` | every modern engine, and the only one that inverts for a dark tab strip |
| `icon-192.png` | Google Search, which wants a square multiple of 48 and does not read SVG for this |
| `apple-touch-icon.png` | iOS home screen and bookmark, 180 |

**The rasters are opaque and the SVG is not.** The SVG carries a `prefers-color-scheme` swap, so it
is transparent and follows the browser's theme. A raster cannot, and a transparent near-black mark
handed to a dark search results page is an invisible mark — so every PNG and every ICO entry is
composited onto the paper ground. iOS wants that anyway; it composites a transparent touch icon onto
black.

**The glyphs are outlined, not set**, for the reason the Social Card is: an SVG favicon cannot
reference a webfont, and librsvg falls back silently on a missing family. `scripts/lib/outline.mjs`
now holds that machinery for both artifacts — extracted rather than copied, and the extraction was
proved by regenerating the card to a byte-identical file.

**The known risk, recorded rather than discovered later: two letters at 16px is the tight case.** The
monogram is set edge to edge at 88% of the artboard with −0.045em tracking so the strokes are as heavy
as the square allows, and the counters of C and H are what carry it. If it fills in on a real tab
strip the fix is a different mark, not a tweak to the script. **Judge it rendered at 16px, not in the
SVG.**

## Motion

Three things move on this site, and none of them uses a library. Two were decided in
[issue #12](https://github.com/imecoulter/coulterheiberger-com/issues/12) by building every
candidate and measuring it; the Carry was decided in
[#31](https://github.com/imecoulter/coulterheiberger-com/issues/31). The design they implement is the
Motion section of [docs/design-direction.md](./design-direction.md).

**Registration** — the one-time entrance of an element as it first enters the viewport. Three moves
(`rise`, `rule`, `wipe`) live in `base.css`; one `IntersectionObserver` in `Base.astro` adds `.is-in`
once and stops watching. The contract is three attributes and nothing else:

| | |
| --- | --- |
| `data-anim="rise\|rule\|wipe"` | opts an element in and picks its move |
| `.is-in` | added by the observer; the only thing the script does |
| `--d` | stagger delay, set per element in groups of four at 60 ms |

**Navigation Cross-fade** — `@view-transition { navigation: auto; }`, three lines of CSS in
`base.css`. Zero JavaScript, no client-side router. Chrome 126+ / Safari 18.2+; Firefox has no
support and simply navigates.

**The Carry** — a Plate's image holding its position and scale between `/` and `/projects/<slug>/`.
Zero JavaScript, and **still nothing in `base.css`**: it landed in `src/components/Plate.astro`, in that
component's scoped `<style>`, which is where this section always said it would go. The declaration sits
beside the markup that emits `--vt`, so there is no global selector reaching for an inline custom
property, and a component that does not emit `--vt` is not silently opted in.

| | |
| --- | --- |
| Named element | **The image only.** The Plate is one unit, but a group snapshot rasterizes and stretches the specification line — mono text scaled by a transform is exactly the artefact the datum cannot afford |
| Name | `plate-<slug>`, derived from the Project slug. Unique per document by construction, matches across the two documents for free, and reverses on back-navigation for free |
| Declaration | `style={\`--vt: plate-${slug}\`}` on the `<img>`; `view-transition-name: var(--vt, none)` **inside** `@media (prefers-reduced-motion: no-preference)`, in `Plate.astro`'s scoped style. The value ships inert and the declaration stays gated, which preserves the fail-safe inversion below |
| Coverage | Every Plate on `/` is named, so one click carries all 3–8. That is deliberate — see the design direction — and it is what the threshold is measured against |
| `reduce` | Unchanged. No transition at all; the fail-safe inversion is not reopened |

**"0 bytes" was the wrong meter, and #12 recorded it.** The cross-fade was priced at zero and shipped
on that basis. Field RUM on cross-document view transitions reports roughly **+70 ms LCP on repeat
mobile pageviews**, correlated with CPU
([corewebvitals.io](https://www.corewebvitals.io/pagespeed/view-transition-web-performance)). The
transfer cost genuinely is zero; the paint cost is not, and the shipped cross-fade is paying it
today. Correction recorded here rather than in #12's table, which measures transfer bytes and is
right about them.

**The threshold: the Carry's own delta must not exceed the ~70 ms the plain cross-fade already
costs.** Measured on a real `/` → `/projects/<slug>/` navigation, named minus unnamed, on the same
page and the same device class. Roughly doubling a cost the record called zero is where a decoration
stops being affordable — and 3–8 simultaneously named elements is exactly where it would show up.

It is deliberately a *relative* number. An absolute millisecond budget for a transition would be
invented here and then argued with; the cross-fade's measured cost is a figure the site is already
paying and has already accepted, so "no worse than what you already agreed to" is a threshold that
holds its meaning when the hardware changes.

**The escape hatch is the plain cross-fade, and it is the only one.** Over the threshold, delete the
`--vt` declaration and the site falls back to the Cross-fade it already has. **It is never rescued
with JavaScript.** A ~200-byte click handler that assigns the name on demand is the obvious fix and
it is out of bounds: the site has exactly one `<script>`, and adding a second is an amendment to
`docs/design-direction.md` first — not a call the session building the Project pages gets to make
under its own deadline.

**The perf gate structurally cannot see this.** `npm run perf` is `lhci collect` plus
`scripts/assert-lcp-path.mjs` over cold loads, and no browser-driving devDependency exists in this
repo. Extending CI with Playwright to police a transition was considered and rejected: the
enforcement machinery would outweigh the thing enforced. So the Carry is held by rule here, and
watched in the field by [#33](https://github.com/imecoulter/coulterheiberger-com/issues/33).

**Both previously-unverified items are now measured.** They were recorded here as "almost certainly
true, and this repo runs things rather than reading them"; the Project routes made them checkable and
they were checked. Both are in `docs/content-architecture.md`'s "Verified mechanics" table.

1. **`view-transition-name: var(--vt)` substitutes, and the unset case computes to `none`.** Confirmed
   in Chrome against the same rule in both states: `--vt: probe-name` computes `probe-name`, and the
   same declaration with `--vt` unset computes `none`. **Chrome only** — Safari was not driven, and
   saying otherwise would be the assertion this section exists to forbid.
2. **The Carry's LCP delta is +20 ms**, against the ~70 ms threshold. Median of 11 interleaved runs per
   condition, 4× CPU throttle, on a real `/` → `/projects/cecret/` navigation with **all six Plates
   named** — the 3–8 case this threshold was written for. Named median 156 ms, unnamed 136 ms, and the
   two distributions barely overlap (named min 144, unnamed max 152), so it is an effect rather than
   noise. **The Carry ships.**

   Measured by suppressing `view-transition-name` on the unnamed arm and asserting the suppression
   actually applied before trusting any number — the first attempt injected the override too early,
   `document.documentElement` was still null, and the two arms were silently identical. A delta of
   −8 ms came back and it was measuring nothing. Read a Carry measurement that reports a *negative*
   delta as a broken harness, not as a free transition.

   The number is from this Windows machine over `astro preview`, not from CI and not from a phone. It
   is a local comparison of two builds that differ in one declaration, which is what the threshold asks
   for — "the same page and the same device class" — and it is not a claim about field LCP.

**The Traverse** — the pointer moves a Plate's wide image through its Overscan on `/`. The direction
argues for it; this is how it is built.

| | |
| --- | --- |
| what moves | `object-position` on the `<img>` only. No transform, no layer, nothing composited |
| how far | the wide file is cut **16:9** and shown **21:9**, leaving 23.8% of the file's height outside the box |
| resting place | `--rest-y`, mapped from the Plate's own `framing` keyword in `src/layout.ts` |
| driven by | `--pan`, set on the `<li class="plate">` by the one authored script on `pointermove`, inheriting down to the `<img>` |
| eased | `transition: object-position 0.4s ease-out`, so it follows the pointer rather than sticking to it |
| gated | `(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)`, in the CSS **and** in the script |
| scope | `[data-reveal]` on the Plate itself, emitted by `src/pages/index.astro`. `Plate.astro` owns the geometry, not the binding |

**The hover target is the whole Plate, and it has to be — this is not a reading of the vocabulary,
it is forced.** The index gives each Plate one link whose `::after` covers the row, so a pointer over
the image targets that `<a>` in the metadata column, never the `<picture>`. `.plate` is the one
element both are inside, and events reach it by bubbling from either. That it also reads correctly —
CONTEXT.md calls a Plate "a single unit", so the unit responds — is true and is not the reason.

**The overlay needs `z-index: 1`, and finding out why cost a real bug.** Before it, the overlay
covered the image and the image still took the click: the largest and most obviously clickable thing
on the page did nothing, on desktop and on mobile, while the title and the summary worked. Confirmed
with `elementsFromPoint` over the image centre, which returned `[IMG, A, PICTURE, .plate-media,
.plate]` — the overlay present, and underneath.

The cause is **grid painting order**. Grid items paint as atomic units in document order (CSS Grid
§6), and `.plate-media` follows `.plate-meta` in the DOM, so the later item painted over the earlier
item's positioned descendant. The DOM order is deliberate — it is the screen reader's reading order,
Project name before Project picture — so the fix is the z-index, never a reorder. `.plate` also takes
`isolation: isolate` so that z-index stays local.

**This was found by clicking, not by reading.** A dispatched `pointermove` bypasses hit testing
entirely and reports success on a target no real cursor can reach. Drive the Traverse and the Plate
link with a real mouse, or the test is measuring the listener rather than the page.

**The two guards are stated twice and have to agree.** CSS cannot ask whether a listener bound, and
the script cannot ask whether a rule applied. If the script attaches where the media query does not
match, `--pan` jumps with no transition; the reverse is merely inert. Change one, change the other.

**`--pan` is removed on `pointerleave`, never set back to a value.** The CSS fallback chain is
`var(--pan, var(--rest-y, 50%))`, so deleting the property *is* the rest state and `framing` stays
the single source of it. Writing the resting number into the script would be a second copy of the
author's composition decision, in JavaScript, where nothing would ever check it.

**The cost is bytes and it lands off the gate's path.** The wide tier gains ~31% of its pixels;
measured at 66.6 KB for the largest hero at the width a 1440x900 desktop fetches. The perf gate runs
mobile, where the 4:5 crop is served and the wide tier is never requested — so **the gate's LCP number
does not move, and that is not the same as the change being free.** Watch the desktop figure by hand.

**The Expanded View** — one Frame at window size, over the page blurred back.

| | |
| --- | --- |
| the trigger | an `<a class="expand">` wrapping the Frame, `href` = a build-time 2000px webp |
| why a link | with scripting off, or on a modified click, it still opens the image. A `<button>` would be a dead control, and `lighthouserc.cjs` asserts `link-name` and `button-name` alike without telling them apart |
| the accessible name | the nested `alt`. No `aria-label`, which would override it with a worse one |
| the container | one `<dialog>` per page, `showModal()`, `src` swapped from the clicked link |
| the fetch | on click only, so it is Post-LCP Media behind a Gate, and nothing downloads for a Frame nobody opens |

**`showModal()` is carrying the accessibility, and that is why it is used rather than a div.** Focus
moves in, the rest of the document goes inert, Escape closes, focus returns to the Frame. Verified as
a round trip in a real browser, because ADR-0003 says in as many words that the Lighthouse score
cannot see a keyboard trap.

**The blur is on the dialog, not on `::backdrop`.** Custom properties only began inheriting into
`::backdrop` recently and unevenly, and where they do not, `var(--ground)` resolves to nothing and the
UA's own translucent black lands over a paper site. So the dialog is sized to the viewport, carries
the ground itself, and `::backdrop` is cleared out from under it. A real element resolves the token in
every engine.

**`showModal()` does not stop the page scrolling, and this was measured rather than assumed.** With
the dialog open, one PageDown moved the document from 3233 to 4020 while the image stayed put, so a
visitor closes the view and finds themselves somewhere else on the page. The fix is
`html:has(dialog.expanded[open]) { overflow: hidden }`, which also makes the dialog's `100vw` exact:
while the scrollbar is present, `100vw` includes it and the dialog overhangs. One rule, both problems.

**What the script now costs.** Registration alone was 195 B gzip. All three behaviours together are
**588 B gzip**, 1,145 B raw, still one inline block and still zero extra requests — 1.1% of ADR-0002's
50 KB. The rule that mattered was one authored `<script>`, not one behaviour, and it is intact.

### Two rules that are invisible until something breaks

**Nothing on the first screen carries `data-anim`.** An element at `opacity: 0` or fully clipped is
not an LCP candidate — [web.dev's LCP article](https://web.dev/articles/lcp) excludes "elements with
an opacity of 0" — so animating the hero makes LCP wait for the script instead of the image decode.
Registration is for content you scroll to. The perf gate will catch a violation, but only after it
ships.

**The hidden state is declared only inside `@media (prefers-reduced-motion: no-preference)`**, for
Registration, the cross-fade, and the Carry alike. This is the reduced-motion design, not a
formatting habit: under `reduce` the page is simply the finished document — verified in a real
browser, computed `opacity: 1`, no transform, no clip, `transition-duration: 0s`, and
`pagereveal.viewTransition` null on a real navigation. Do not rewrite any of them as a `reduce` block
that turns things off. That form
computes the animated path first and fails *toward* motion; this one fails toward stillness.

### What each option costs

Measured on this repo's real dependency graph (astro 7.2.0 / vite 8.2.1 / rolldown, gsap 3.15.0,
motion 13.1.0), gzip level 6 — the unit `lighthouserc.cjs` asserts against 51,200 B. Kept here so
the choice can be reopened with numbers instead of re-derived from scratch:

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

Whole substrate on the wire when that table was built: **+426 B gzip on the document** (2,938 →
3,954 B raw, 1,230 → 1,656 B gzip), zero extra requests.

**The 195 B row is the comparison basis, not today's shipped figure.** The same inline block now also
carries the Traverse and the Expanded View, and measures **588 B gzip / 1,145 B raw — 1.1% of the
budget**, still zero extra requests. The row is left as it was because it is what the libraries were
priced against: every one of them replaces Registration and none of them would have made the other
two smaller. Re-run the comparison against 588 B, not 195 B, if it is ever reopened.

Three things that table doesn't show:

- **An external file is a round trip.** Under the gate's `devtools` throttling every library
  candidate costs 562.5 ms of latency before anything it reveals can paint, and lands *on* the LCP
  Path — GSAP would spend ~44 KB of the ~240 KB the 2.5 s clock actually permits, for zero pixels.
- **Native scroll-driven CSS is disqualified on capability, not support.** `animation-timeline:
  view()` scrubs progress from scroll *position*, so it necessarily reverses on scroll back, and the
  design direction requires fire-once. Firefox's absence is the second reason, not the first.
- **`ClientRouter` is 13x the whole substrate** — 5,494 B against 426 B — on a site whose full page
  loads measure 67-104 ms TTFB. Its one unique capability is `transition:persist` for live state, and v1 has none. Astro's
  own docs say it "will increasingly become unnecessary" as the native API lands.

### When to revisit

Not a closed door, and not a budget ceiling to squeeze under — 50 KB of headroom is sitting unused.
What rules a library out today is that the design has nothing for it to do:

> Registration, not performance. Line-level only. Fires once and never re-triggers on scroll back.
> Nothing parallaxes, and element-level Registration never scales. At most two elements animating at
> a time.

That is an entrance-reveal spec, and 195 B implements all of it. **Neither the Carry nor the two
moves added after it change this answer.** The Traverse is one transitioned property and a
`pointermove` that writes a percentage; the Expanded View is `showModal()` and a `src` swap. A
library contributes nothing to either, and the second one is a browser primitive doing focus
management no library should be reimplementing. It is one CSS declaration and a name derived from a slug; a library has nothing to
contribute to it, and the fact that the browser does the interpolation is the whole reason it is
affordable. Sequenced timelines, scrub-linked
motion, physics, SVG morphing and line-splitting are all things GSAP does well and this design
forbids — so the order is **amend `docs/design-direction.md` first, then pick the library the new
design needs.** Never the reverse. At that point the candidate is `motion/mini` at 3.2 KB unless
SplitText specifically is the thing you need, and the cost of being wrong is one PR: everything here
is one attribute, one class and one observer.

## Enforcing the refusals

The direction is defined partly by what it refuses: zero border-radius, zero box-shadow. `npm run
check:css` asserts this over the built CSS and runs in `Verify and deploy`. A universal
`*{border-radius:0}` reset was rejected — it loses to any later component rule on specificity, so it
hides violations instead of surfacing them.

## When to revisit Tailwind

Not a closed door. Tailwind v4 was verified working on this exact dependency graph (astro 7.2.0 /
vite 8.2.1 / tailwindcss 4.3.3) and produced identical visual output. It was rejected on fit and on
the fact that **plain → Tailwind is a cheap migration and Tailwind → plain is not**: the tokens here
are already semantic custom properties and move into `@theme` near-verbatim.

Revisit if any of these happen:

- the component count passes roughly 15;
- an adapter is added (a contact form implies a Worker route), which is where the open
  `vitejs/vite#23096` `--ssr` bug would land either way;
- building v1's pages produces repeated friction where a utility would have been one word.
