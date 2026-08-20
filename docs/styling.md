# Styling

Hand-written modern CSS. **No Tailwind, no CSS framework, no preprocessor.** Decided in
[issue #11](https://github.com/imecoulter/coulterheiberger-com/issues/11) by building the design
both ways and measuring; the rejected alternative and the tripwire for revisiting it are recorded
there and summarised at the bottom of this file.

## Where things live

```
src/styles/tokens.css    custom properties only — nothing in this file paints
src/styles/base.css      reset, element defaults, type roles
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

This is not tidiness. It is what let the whole site's ground invert in [ADR-0007](./adr/0007-one-dark-ground.md)
by editing two hex values in one file: no component knew which end of the axis it was on, so none of
them had to change.

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

### One band, and the trap that came with having two

**There is one Ground and it is declared once, on `:root`.** [ADR-0007](./adr/0007-one-dark-ground.md)
inverted it and deleted the `.night` class that used to invert into it, so a second band is not
something to add: it is something that was removed on purpose.

That deletion retired a trap worth knowing about anyway, because it will return the moment anyone
reassigns `--ground` or `--ink` in a nested scope. A custom property is resolved at computed-value
time *on the element that declares it*, then inherits as an already-resolved value. A `color-mix()`
declared only on `:root` therefore bakes in `:root`'s ground and ink and does **not** re-derive
further down. `.night` had to restate `--rule` and `--muted` for that reason alone; with the two lines
removed, both bands computed `oklab(0.819525 …)` for `--rule`, putting the day-tinted hairline on the
night ground. It looked correct in the editor and wrong in the browser.

**So: if you ever scope the primaries again, restate every derived token in the same block.** The one
Ground on `:root` has nothing below it to get this wrong, which is most of why it is one.

### The ground is enforced

`npm run check:css` **refuses `prefers-color-scheme` in site CSS by name**, alongside zero radius,
zero shadow and `color: var(--signal)`. A light variant is one media query away otherwise, and it
would leave no trace. `scripts/dev/build-favicons.mjs` is the one exemption and emits that query into
an SVG deliberately: the favicon renders in the browser's tab strip, not on this site's ground.

## Type roles

Three families, two classes. **Serif body is the element default and has no class.**

| class | family | use |
| --- | --- | --- |
| `.t-label` | mono | section labels, and the role line under the name on `/` |
| `.t-spec` | mono | the specification line, metadata terms, captions, footer |

**Hard cap: three.** A fourth type role is a change to the design direction, not a styling decision.
Amend `docs/design-direction.md` first.

`.t-display` was a third class and is gone. It had one user, `/`'s "Technical Artist" line, and it
carried a font size nothing else shared. The display role is untouched: `h1`–`h3` still get it from
the element rule in `base.css`. What went is the accessor that let a page put display type on a
non-heading, which in practice meant minting a heading size without writing a heading.

### Six sizes, and the cap is the point

| token | style |
| --- | --- |
| `--t-h1` | the site's name on `/`, and nothing else |
| `--t-h2` | a page's own title: a Project, and `/404` |
| `--t-h3` | a Plate's title on `/` |
| `--t-body` | all serif prose, summaries included |
| `--t-label` | mono, uppercase, `--track-label` |
| `--t-spec` | mono, uppercase, `--track-spec` |

Owner review counted nine to ten treatments and set the cap at six, three headings and three for
everything else. The three that went were near-duplicates rather than decisions: `/404`'s heading at
`clamp(2rem, 8vw, 3.25rem)` against a Project's `clamp(2rem, 5.2vw, 3.5rem)`, `/`'s `h1` restating
`-0.02em` as `-0.022em`, and a 15px serif that existed only so a summary would fit the metadata
column — a layout problem being solved in the type scale.

**A page picks one of the six; it does not write a `font-size`.** Four of the five heading sizes used
to be declared inside a page's own scoped block, so the question "how many sizes does this site have"
could only be answered by reading every page. That is how it reached ten without anyone deciding to.

**Casing is part of the style.** Both mono styles are uppercase, both serif and display styles are
sentence case, and no page or component overrides either — there is no `text-transform` declaration
outside `base.css`. The one that existed set the footer address in lowercase at normal tracking,
which made one string its own type treatment sitting directly beside a link in the style it was
supposed to share. `text-transform` changes glyphs and never the DOM, so the `mailto:` and anything
copied off the page still carry the real lowercase address.

That reversal orphans `U+0061-007A` in `MONO_SPEC` (`scripts/dev/subset-fonts.mjs`), which was added
for that line alone: `unicode-range` is matched *post*-`text-transform`, so with every mono role
uppercase nothing on the site can reach a lowercase mono glyph. It is 1,208 B on the LCP Path, still
shipped, and should come out at the next regeneration — which needs the upstream font sources, and
those are deliberately not committed.

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

**There is none.** No `transition`, no `animation`, no `@keyframes`, no `@view-transition`, and no
`:hover` rule anywhere in `src/`. There is also **no `prefers-reduced-motion` query left**, and that
follows rather than being an omission: the substrate declared every hidden and animated state only
under `no-preference`, so that `reduce` was the plain document rather than a branch that switched
things off. Remove the animated state and the query has nothing to guard. **Do not add a bare
`reduce` block back** — it would disable something nothing declares.

The one authored `<script>` in `Base.astro` now holds two behaviours, and neither draws anything:
warming the hero (a cache warm on `pointerenter`, no visual) and the Expanded View (`showModal()` and
a `src` swap). It measures **421 B gzip / 834 B raw**, one inline block, zero extra requests — 0.8%
of ADR-0002's 50 KB. The rule was always one authored `<script>`, not one behaviour, and it is
intact.

Everything that was here — Registration, the Navigation Cross-fade, the Carry, the Traverse, the
Expanded View's fade — is in [docs/motion.md](./motion.md), with its measurements, its byte costs,
and four findings that each fail silently. **Read it before writing a `transition` into this
codebase.** One of the four is specifically about a component's `transition` shorthand replacing a
global rule at a higher specificity, which looks exactly like a page with no animation.

The design this implements is the Motion section of [docs/design-direction.md](./design-direction.md),
and the order is binding: **that document is amended first, then a mechanism is chosen to serve it.**

## The Plate link on `/`

Not motion, and it is here because the bug underneath it is silent.

**The overlay needs `z-index: 1`.** Each Plate gets one link, on the title so its accessible name is
the Project's name, with an `::after` covering the row so the whole thing is clickable without adding
a second link to the same URL for a screen reader to read twice. Before the z-index, the overlay
covered the image and **the image still took the click**: the largest and most obviously clickable
thing on the page did nothing, on desktop and on mobile, while the title and the summary worked.
Confirmed with `elementsFromPoint` over the image centre, which returned
`[IMG, A, PICTURE, .plate-media, .plate]` — the overlay present, and underneath.

The cause is **grid painting order**. Grid items paint as atomic units in document order (CSS Grid
§6), and `.plate-media` follows `.plate-meta` in the DOM, so the later item painted over the earlier
item's positioned descendant. The DOM order is deliberate — it is the screen reader's reading order,
Project name before Project picture — so the fix is the z-index, never a reorder. `.plate` also takes
`isolation: isolate` so that z-index stays local.

**This was found by clicking, not by reading.** A dispatched `pointermove` or synthetic click bypasses
hit testing entirely and reports success on a target no real cursor can reach. Drive the Plate link
with a real mouse, or the test is measuring the listener rather than the page.

**There is no hover state on it, or on any link on the site.** `text-decoration: none` plus
`base.css`'s `color: inherit`, and nothing else. On the gallery's Frame links the cursor is the
affordance.

## The Expanded View

One Frame at window size, over the page blurred back. This is a `<dialog>` and a `src` swap, not
motion — it opens and closes instantly.

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
every engine. It is a static effect, either on or off with the dialog, which is why it survived the
pass that removed the fade around it.

**`showModal()` does not stop the page scrolling, and this was measured rather than assumed.** With
the dialog open, one PageDown moved the document from 3233 to 4020 while the image stayed put, so a
visitor closes the view and finds themselves somewhere else on the page. The fix is
`html:has(dialog.expanded[open]) { overflow: hidden }`, which also makes the dialog's `100vw` exact:
while the scrollbar is present, `100vw` includes it and the dialog overhangs. One rule, both problems.

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
