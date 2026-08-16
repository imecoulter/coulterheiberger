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
| `--signal` | registration red: plate index, focus ring, active state. **Under 1% of pixels.** |
| `--rule` | derived — hairline, `color-mix` 18% ink into ground |
| `--muted` | derived — secondary text, `color-mix` 58% ink into ground |

`--rule` and `--muted` are tints on the ground/ink axis, so a context that flips the two primaries
gets a coherent pair for free.

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
- **Container queries — no**, until a component actually ships at two different widths. Every plate
  today sits in the same container; media queries are the honest tool for a viewport switch.
- **`:has()` — allowed**, but do not build structure on it.
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
uppercase their text. It is there for the home page's email address, which sets `text-transform: none`
precisely because an address is data rather than a phrase. Consequence worth knowing: the subset no
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

## Motion

Two things move on this site, and neither uses a library. Decided in
[issue #12](https://github.com/imecoulter/coulterheiberger-com/issues/12) by building every
candidate and measuring it. The design they implement is the Motion section of
[docs/design-direction.md](./design-direction.md).

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

### Two rules that are invisible until something breaks

**Nothing on the first screen carries `data-anim`.** An element at `opacity: 0` or fully clipped is
not an LCP candidate — [web.dev's LCP article](https://web.dev/articles/lcp) excludes "elements with
an opacity of 0" — so animating the hero makes LCP wait for the script instead of the image decode.
Registration is for content you scroll to. The perf gate will catch a violation, but only after it
ships.

**The hidden state is declared only inside `@media (prefers-reduced-motion: no-preference)`**, for
both Registration and the cross-fade. This is the reduced-motion design, not a formatting habit:
under `reduce` the page is simply the finished document — verified in a real browser, computed
`opacity: 1`, no transform, no clip, `transition-duration: 0s`, and `pagereveal.viewTransition` null
on a real navigation. Do not rewrite either as a `reduce` block that turns things off. That form
computes the animated path first and fails *toward* motion; this one fails toward stillness.

### What each option costs

Measured on this repo's real dependency graph (astro 7.2.0 / vite 8.2.1 / rolldown, gsap 3.15.0,
motion 13.1.0), gzip level 6 — the unit `lighthouserc.cjs` asserts against 51,200 B. Kept here so
the choice can be reopened with numbers instead of re-derived from scratch:

| approach | gzip | requests | % of the 50 KB JS budget |
| --- | --- | --- | --- |
| **IntersectionObserver + CSS** (shipped) | **195 B** | **0 — inlined** | 0.4% |
| `motion/mini` (`animate`) + IO | 3,187 B | 1 | 6.2% |
| `motion` (`animate` + `inView` + `stagger`) | 21,755 B | 1 | 42.5% |
| GSAP core alone | 27,297 B | 1 | 53.3% |
| GSAP + ScrollTrigger | 44,205 B | 1 | 86.3% |
| GSAP + ScrollTrigger + SplitText | 47,104 B | 1 | 92.0% |
| Astro `ClientRouter` | 5,494 B | 1 | 10.7% |
| Native CSS scroll-driven | 0 B | 0 | — cannot fire once |

Whole substrate on the wire: **+426 B gzip on the document** (2,938 → 3,954 B raw, 1,230 → 1,656 B
gzip), zero extra requests.

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
> Nothing scales, nothing parallaxes. At most two elements animating at a time.

That is an entrance-reveal spec, and 195 B implements all of it. Sequenced timelines, scrub-linked
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
