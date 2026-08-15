# Styling

Hand-written modern CSS. **No Tailwind, no CSS framework, no preprocessor.** Decided in
[issue #11](https://github.com/imecoulter/coulterheiberger-com/issues/11) by building the design
both ways and measuring; the rejected alternative and the tripwire for revisiting it are recorded
there and summarised at the bottom of this file.

## Where things live

```
src/styles/tokens.css    custom properties only — nothing in this file paints
src/styles/base.css      reset, element defaults, the three type-role classes
src/styles/fonts.css     @font-face only (does not exist yet — typography is open)
src/layouts/Base.astro   imports the above, once, for every page
src/components/*.astro   everything else, in a scoped <style> block
```

That is the whole convention. **Do not invent a fourth location.** No `global.css`, no
`utilities.css`, no per-route stylesheet, no `<style is:global>` outside `Base.astro`.

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

When typography closes, `@font-face` goes in `src/styles/fonts.css`, **self-hosted**, with the files
under `src/fonts/` so they are hashed and cached. **Never a Google Fonts `<link>`** — the prototype
used one, and it costs two extra origins and a render-blocking external stylesheet on the LCP Path.

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
