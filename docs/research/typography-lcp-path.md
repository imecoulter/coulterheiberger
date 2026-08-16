# Typography: what three families cost the LCP Path

Research for [issue #21](https://github.com/imecoulter/coulterheiberger-com/issues/21). Every number
here was produced on this repo's own build by the harness in `scripts/research/`, under the same
throttling and the same median rule the deploy gate uses — not read off a blog.

> **This is the research record, kept as written.** The harness, fixtures and font binaries it
> describes live on branch `research/typography-lcp-path` (pushed to origin), not on `main` — only
> this document was brought across. §9's *"what is taste"* was answered separately and is **not**
> edited into the findings below; the decisions live in
> [docs/design-direction.md](../design-direction.md#typography).
>
> Two of them departed from §9's recommendation, both deliberately:
> **Montserrat, not Archivo**, for the display role — §9 called this taste and 944 B, and it was
> settled on a rendered page. And `.t-spec` took `font-weight: 500` (§9 rec 5), which collapsed mono
> to one file, so the shipped stack is **13,648 B** rather than the 16,712 B two-role figure in §3.1.
>
> One thing this document could not have found, because it measured fonts and not the build: Vite
> base64-inlines any asset under 4,096 B, and the mono subset lands at 4,020 B. See
> [docs/styling.md](../styling.md#fonts).

## The answer

**The demoted role is the expensive one, by a margin that answers the question.** Subset to the
site's repertoire and cut as static instances at the weights that actually resolve, the three roles
cost **62,052 B**: display 8,736 B, mono 7,976 B, serif **45,340 B — 73% of the stack, and 2.7× the
other two roles combined.**

In hero budget, which is the unit that binds:

| stack | fonts on the wire | 2.5 s is reached at | hero budget lost |
| --- | ---: | ---: | ---: |
| system stacks only | 0 B | **~233 KB** of hero | — |
| display + mono, serif → system | 16.7 KB | **~220 KB** | 13 KB |
| all three roles | 31.3 KB | **~196 KB** | 37 KB |
| three roles, unsubsetted variable | 242 KB | fails at every hero size ≥ 60 KB | — |

**The serif alone costs 24 KB of hero budget — nearly twice what both distinctive roles cost
together.** That is the finding. What to do about it is taste, and §9 says which part is which.

The second finding is that *how the faces are cut* matters far more than *which faces*: the same
three families, self-hosted but unsubsetted, cost **+1,263 ms and fail the gate**, while the audited
static cuts cost **+113 ms and pass**. Choosing families is a design decision; choosing cuts is a
6.6× decision.

## 1. The instrument, and a correction to #13

Issue #13 recorded that `npm run perf` **cannot run locally on Windows** — `chrome-launcher` throws
`EPERM` on Chrome's temp profile — and moved all measurement to CI. That is true of `lhci collect`
as invoked, but the reason is narrower than "Lighthouse does not run here", and it changed how this
ticket could be worked.

The audit completes and the LHR is generated. The throw comes afterwards, from `destroyTmp()`:

```
Runtime error encountered: EPERM, Permission denied: ...\Temp\lighthouse.74577022
    at Launcher.destroyTmp (chrome-launcher/dist/chrome-launcher.js:367:9)
```

`destroyTmp` returns early when an explicit `userDataDir` was passed — chrome-launcher 1.2.1,
verbatim: *"Only clean up the tmp dir if we created it."* Launching Chrome with a profile directory
we own skips the `rmSync` and the numbers come back.

`scripts/research/lh-runner.mjs` does exactly that and nothing else differs from the gate: same
`throttlingMethod: 'devtools'`, Lighthouse's mobile default, median of 3, and the LCP Path cut lifted
verbatim from `scripts/assert-lcp-path.mjs`.

**Two independent checks that the harness is the same instrument:** `lighthouserc.cjs` records
697/704/715 ms for `/`; this harness measures 743 ms on the same page. And #13's hero fixture
recorded 300 KB → **2871 ms**; this harness's 300 KB row reads **2872 ms**. A local loop is
therefore viable for font work, which is what made a 93-run matrix affordable.

## 2. What the direction actually renders

`scripts/research/audit-glyphs.mjs` drives the built pages in a real browser, walks every text node,
and reads the resolved family, weight, style and transform off the browser rather than inferring
them from CSS.

| role | weights found | styles | where |
| --- | --- | --- | --- |
| display (Archivo) | **500 only** | normal | `h1–h3` and `.t-display`, `base.css` |
| mono (JetBrains Mono) | **400 and 500** | normal | `.t-label` is 500; `.t-spec` sets none and inherits body's 400 |
| serif (Source Serif 4) | 400 | normal | body default; `<em>`/`<strong>` in MDX prose add italic + a bold once real content lands |

- **The prototype's "400/500/600 for Archivo" is not what the direction renders.** Nothing reaches
  Archivo 400 or 600. The display role is one weight.
- **Mono is two weights, and nobody wrote that down.** Adding `font-weight: 500` to `.t-spec` — one
  line in `base.css` — collapses it to one file and saves 3,956 B. The two mono roles arguably should
  have matched anyway.

### A defect found on the way

`/404.html` renders **none of the three families**. It resolves `ui-sans-serif` — a fourth family, on
a page that is supposed to be inside the direction. `src/pages/404.astro` still carries pre-Datum
scoped styles: hex literals for `--bg`/`--fg`/`--muted` at `:root`, and
`font-family: ui-sans-serif, system-ui, …`.

That breaks the one rule in `docs/styling.md` — *"A component never hard-codes a value that a token
names"* — and redefines `--muted`, a derived token, from a component. #14 routed `404.astro` through
`Base.astro` for its `<head>`; the body styles were left behind. **Not fixed here** — research
branch — but it wants a small task ticket.

## 3. What the faces cost

`scripts/research/subset-fonts.mjs`, fontTools 4.63.0, sources from `google/fonts`. Bytes are woff2
file sizes, and that **is** the over-the-wire number: woff2 carries its own Brotli stream, so gzip-6
of these files comes out 56–69 B *larger* than the file. One unit holds across this document and the
LHR. Rebuilds are reproducible to within ~5 B.

| family | role | rung | bytes |
| --- | --- | --- | ---: |
| Archivo | display | source TTF, variable, unsubsetted | 658,596 |
| Archivo | display | variable · Google "latin" range | 85,712 |
| Archivo | display | variable · site repertoire | 56,680 |
| **Archivo** | **display** | **static wght=500 · site repertoire** | **8,736** |
| **Montserrat** | **display** | **static wght=500 · site repertoire** | **9,680** |
| Montserrat | display | variable · site repertoire | 22,272 |
| Source Serif 4 | serif | variable · Google "latin" range | 117,760 |
| Source Serif 4 | serif | variable · site repertoire | 90,304 |
| **Source Serif 4** | **serif** | **static wght=400 · site repertoire** | **14,672** |
| Source Serif 4 | serif | static wght=600 · site repertoire | 15,488 |
| Source Serif 4 italic | serif | static wght=400 · site repertoire | 15,180 |
| JetBrains Mono | mono | variable · Google "latin" range | 38,444 |
| JetBrains Mono | mono | static wght=400 · mono repertoire, default features | 15,120 |
| **JetBrains Mono** | **mono** | **static wght=400 · mono repertoire, no ligatures** | **3,956** |
| JetBrains Mono | mono | static wght=500 · mono repertoire, no ligatures | 4,020 |

Three things that table is actually saying:

**Variable is the wrong cut for this design, by 6.5×.** Archivo variable at the site repertoire is
56,680 B; the single static 500 the design renders is 8,736 B. A variable font prices an axis this
design never travels. Same for the serif (90,304 → 14,672) and the mono (9,300 → 3,956).

**JetBrains Mono's coding ligatures are 74% of the mono file.** 15,120 B with pyftsubset's default
feature set, 3,956 B with GSUB dropped. They ride on `calt`, they are dead weight in a label, and
worse than dead: a spec line containing `->` would silently become an arrow. Dropping them is correct
for the design, not merely cheap.

**The charset is the smallest lever, which is the opposite of how it is usually discussed.** Google's
"latin" range down to this site's repertoire saves 29 KB on Archivo; taking the static cut saves 48 KB
more.

### 3.1 Stack totals

| stack | files | bytes |
| --- | --- | ---: |
| three roles, static, audited | 6 | **62,052** |
| — serif (400 + 600 + italic) | 3 | **45,340 (73%)** |
| — display (500) | 1 | 8,736 |
| — mono (400 + 500) | 2 | 7,976 |
| three roles, `.t-spec` set to 500 so mono is one file | 5 | 58,096 |
| two roles (serif → system stack) | 3 | **16,712** |
| display only | 1 | **8,736** |

### 3.2 Montserrat

Priced because Coulter named it. **Montserrat costs 9,680 B against Archivo's 8,736 B — a 944 B
difference, about 5 ms of LCP.** On bytes this is a non-decision; pick either.

It is not a non-decision on the direction. Montserrat is a geometric sans, not an engineering
grotesk, and #10's precedent analysis found **Kilograph already running Poppins** — so a geometric
display face moves *toward* the archviz cluster the direction is trying to be distinguishable from,
rather than away. That is a taste argument, it is not settled by any number in this document, and it
belongs to the follow-up ticket.

## 4. What it costs on the LCP Path

Two regimes, because the site has both and they answer differently:

- **Regime A — text LCP.** `/` today has no image; its LCP element is the `<h1>`.
- **Regime B — image LCP.** A hero plate is the LCP element — the v1 home and every Project page.
  Fixture: `src/pages/research-plate/[size].astro`, a byte-exact hero from `public/research/` with
  all three roles exercised around it.

Median of 3, `devtools` throttling, gate settings.

### Regime A — `/`, text LCP

| variant | LCP | FCP | LCP Path | fonts fetched |
| --- | ---: | ---: | ---: | ---: |
| system stacks only | 743 ms | 743 ms | 2,152 B | 0 B |
| three, variable, Google latin | 730 ms | 730 ms | 2,277 B | 242,318 B |
| three, static, audited | 727 ms | 727 ms | 10,149 B | 31,349 B |
| **three, static, + preload** | **1,074 ms** | **1,074 ms** | 18,124 B | 31,349 B |
| serif → system | 740 ms | 740 ms | 13,990 B | 16,696 B |
| display only | 688 ms | 688 ms | 2,230 B | 8,956 B |
| three, static, `font-display: optional` | 738 ms | 738 ms | 10,153 B | 31,349 B |

**LCP equals FCP in every row.** Under `swap` the heading paints in the fallback, and that paint *is*
the LCP; the swap never registers a later candidate. On a text-LCP page, font bytes do not delay LCP
at all — not even 242 KB of them.

**Preload is the one thing that makes this page slower: 727 → 1,074 ms**, and it is *first paint*
that moves. The spreads do not overlap (721–741 against 918–1080). The `@font-face` rules are already
inside the document — `inlineStylesheets: 'always'`, #11 — so the browser discovers the URLs at parse
time anyway; preloading only promotes them ahead of a paint they were never blocking. **No face on
this site earns a `<link rel=preload>`.**

### Regime B — `/research-plate/180/`, image LCP, 180 KB hero

| variant | LCP | Δ vs system | LCP Path | fonts | verdict |
| --- | ---: | ---: | ---: | ---: | --- |
| system stacks only | 2,230 ms | — | 186,882 B | 0 B | pass |
| display only | 2,259 ms | +29 ms | 195,913 B | 8,956 B | pass |
| serif → system | 2,276 ms | +46 ms | 211,538 B | 16,696 B | pass |
| three, static, + preload | 2,326 ms | +96 ms | 226,473 B | 31,349 B | pass |
| three, static, audited | 2,343 ms | +113 ms | 226,244 B | 31,349 B | pass |
| three, static, `optional` | 2,343 ms | +113 ms | 226,245 B | 31,349 B | pass |
| three, variable, site repertoire | 3,035 ms | +805 ms | 344,057 B | 157,047 B | **FAIL** |
| three, variable, Google latin | 3,493 ms | +1,263 ms | 429,318 B | 242,318 B | **FAIL** |

Here the fonts **are** on the LCP Path — they finish well before the hero does, so every font byte is
a byte the hero waits behind. That is the structural difference between the regimes, and it is why
the answer cannot be given for "the site" without naming the page.

`optional` and `swap` are indistinguishable (2,343 ms both): the faces arrive long before any swap
deadline. **CLS was 0.000 in every cell of both tables**, because the fixture gives the hero explicit
`width`/`height` and the text below it is short. This fixture therefore does **not** exercise the
layout-shift argument for `optional` or for metric-matched fallbacks — that argument is untested
here, neither supported nor refuted.

## 5. The crossover — the number ADR-0002 is missing

#13 declined to lower the 500 KB LCP Path ceiling to its measured ~240 KB specifically because *"the
real ceiling drops again once a webfont joins the chain (#21 still open)."* This is that measurement:
hero size swept against three stacks, everything else identical.

| hero | system only | serif → system (16.7 KB) | all three (31.3 KB) |
| ---: | ---: | ---: | ---: |
| 60 KB | 1,536 ms | 1,621 ms | 1,715 ms |
| 120 KB | 1,884 ms | 1,943 ms | 2,034 ms |
| 180 KB | 2,223 ms | 2,269 ms | 2,372 ms |
| 240 KB | 2,535 ms **FAIL** | 2,619 ms **FAIL** | 2,858 ms **FAIL** |
| 300 KB | 2,872 ms **FAIL** | 2,949 ms **FAIL** | 3,022 ms **FAIL** |
| **2.5 s reached at** | **~233 KB** | **~220 KB** | **~196 KB** |

Interpolating between the 180 and 240 KB rows:

- **No webfonts: ~233 KB.** This independently reproduces ADR-0002's "roughly 240 KB", on a different
  fixture and a different machine.
- **Two roles: ~220 KB.** 16.7 KB of font costs 13 KB of hero budget.
- **Three roles: ~196 KB.** 31.3 KB of font costs **37 KB** of hero budget.

Font bytes cost slightly *more* than their weight in hero bytes (37 KB of budget for 31 KB of font)
because each face is also a request: 7 requests against 3.

**ADR-0002's structural point survives and strengthens.** At the three-role crossover the LCP Path is
about 196 + 31 + 2 ≈ 230 KB — still under half the 500 KB ceiling. The byte ceiling still never binds;
the clock always binds first. What moves is the hero budget, and **the number to design heroes
against is ~196 KB, not ~240 KB, if all three roles ship.**

## 6. Two things settled in a browser, not in a spec

`scripts/research/verify-in-browser.mjs`. Both are measured by rendered advance width against a
deliberately mismatched fallback, so the verdict does not depend on `document.fonts` reporting.

**`unicode-range` is matched against the post-`text-transform` codepoints — a narrow uppercase-only
range is SAFE.** Lowercase source text with `text-transform: uppercase` and a face restricted to
`U+0041-005A` (plus punctuation) rendered at 504.00 px, identical to the same string typed in
uppercase and to the same file with no range at all, against 525.42 px for the fallback. So the mono
subset can declare a narrow range without the lowercase copy silently falling back. This was the
trap worth checking; it is not one.

**Subsetting silently removes tabular figures from Archivo.** With a control:

| | `font-variant-numeric: normal` | `tabular-nums` | |
| --- | ---: | ---: | --- |
| unsubsetted source TTF | 131.28 px | 137.53 px | **applies** |
| subset woff2 | 131.28 px | 131.28 px | **no effect** |

`base.css:19` sets `font-variant-numeric: tabular-nums` on `body`. Per family:

- **Archivo** — defaults are proportional; `tnum` maps to `.tf` variants which have no cmap entry and
  fall outside a `--unicodes` closure. The subset keeps the **feature record** and loses its
  substitution targets, so the declaration looks present in the font and does nothing.
- **Source Serif 4** — its `tnum` lookup substitutes *toward* the default cmap glyphs
  (`glyph00439 → zero`). Its defaults are already tabular; `tnum` only undoes `pnum`. The declaration
  is a no-op regardless of subsetting.
- **JetBrains Mono** — no `tnum` feature at all. Monospaced, so tabular by construction.

So the global `tabular-nums` is doing nothing useful today and would keep doing nothing after
subsetting. Either drop it from `base.css` or retain the `.tf` glyphs deliberately; do not leave it
sitting there implying a guarantee it does not make.

## 7. Two more things that will bite whoever implements this

**pyftsubset's default `--name-IDs` is `[0,1,2,3,4,5,6]`.** It keeps the copyright string and
**drops the licence (13) and licence URL (14)** — both present in all four source fonts. OFL 1.1
clause 2 requires every copy to carry the copyright notice *and* the licence, as a stand-alone file,
a human-readable header, or a machine-readable metadata field. The obvious subsetting command
therefore ships a file that does not satisfy its own licence. `--name-IDs+=13,14` restores them and
**costs 116 B** (measured). The harness passes it; the §4 timings were taken before that fix, a
1,200 B / 2% difference on the stack, well below the 9–20 ms run spreads.

**Astro 7 ships a `fonts:` config, and it is not a substitute for this.** `astro/dist/assets/fonts/`
is a stable top-level API with a `local` provider and a `<Font>` component. It does **not** do custom
glyph subsetting — its `subsets` option selects provider-published *named* subsets — so every number
in §3 would still have to be produced by hand. And `<Font>` emits its own `<style set:html>` block per
family, a fourth home for CSS that `docs/styling.md` forbids. Recorded so it is not re-proposed;
#11's decision stands.

## 8. Licensing

**All four candidates are SIL OFL 1.1 and cost nothing**, verified by reading the licence file
shipped with each family in `google/fonts` rather than a summary.

- **None of the four declares a Reserved Font Name.** The copyright lines are plain
  (`Copyright 2020 The Archivo Project Authors (…)`). OFL clause 3 therefore does not bite: a subset
  is a Modified Version and may keep the family name.
- Clause 2 is the one with teeth, and it is the `--name-IDs` finding in §7.
- Clause 5 requires the font files to stay under OFL. The repo is MIT for code with an
  all-rights-reserved notice for imagery (#7, #15), so `src/fonts/` would be a third licence in the
  tree and belongs in `NOTICE`.

**The commercial tier is mostly unavailable under this repo's own constraints, and that is the real
licensing finding.** #11 settled that fonts are self-hosted and never a third-party `<link>`. Adobe
Fonts **cannot be self-hosted**: web fonts must be added via Adobe's embed code and served from
Adobe's CDN, and the terms do not permit downloading or self-hosting the files. That rules out
`aktiv-grotesk`, `freight-big-pro` and `ivyjournal` — three of the faces #10 found across the archviz
cluster — not on taste and not on bytes, but on a constraint this project already settled.

Independent foundries do sell self-hosted licences: Klim states all fees are **one-off with no
expiry**, tiered on pageviews/unique users; Grilli Type is **self-hosted only**, tiered on unique
monthly visitors, with unlimited tiers quoted from $10,000 per style. So commercial type is
possible — it just cannot come through Adobe. Entry tiers for a personal portfolio land in the low
hundreds per style; **treat that as a band, not a quote**, and get a real one before committing.

Sources: [Adobe web font licensing](https://helpx.adobe.com/fonts/using/webfont-licensing.html) ·
[Klim licences](https://klim.co.nz/licences/) ·
[Grilli Type information](https://www.grillitype.com/information)

## 9. Recommendation, and what is taste

**Measured, and not a matter of taste:**

1. **Static cuts, not variable.** 6.5× on every family, for an axis this design never travels.
2. **Drop JetBrains Mono's ligatures.** 74% of the mono file, and a spec line must never turn `->`
   into an arrow.
3. **No preload.** Measurably worse on the text page (+347 ms to first paint) and worth nothing on
   the image page. The rules are already in the document.
4. **`font-display: swap`.** Indistinguishable from `optional` on every measurement here, and
   `optional` risks a first visit with no webfont at all for no measured gain. Revisit only if a CLS
   case is actually demonstrated — this fixture did not produce one.
5. **Set `.t-spec` to `font-weight: 500`.** One line, −3,956 B, and it makes the two mono roles
   consistent.
6. **Pass `--name-IDs+=13,14`.** 116 B, and without it the shipped file breaks its own licence.

**Recommended, with the reasoning:** **drop the serif to a system stack; keep display and mono.**
The serif costs 45,340 B and 24 KB of hero budget — nearly twice what both distinctive roles cost
together — for the one role #10 already demoted to *"right for reading, not distinctive."* Display
and mono are what the direction is actually made of: the specification line **is** the datum, and it
is the cheapest thing on the page at 4 KB. Two webfonts, 16,712 B, hero budget preserved at ~220 KB.

**This is taste, and #21 says not to pre-slice it:**

- Whether a system serif reads acceptably as the body face under this direction. That is a look at a
  rendered page, not a number, and it is the whole substance of the decision above.
- **Archivo or Montserrat.** 944 B apart — bytes do not decide it. The direction does, and the
  argument against Montserrat (geometric, and Kilograph already runs Poppins) is exactly the kind of
  argument #10 was built to have.
- Whether the serif's italic and bold are reachable at all, which depends on Project prose that has
  not been written. If emphasis never appears, the serif is 14,672 B rather than 45,340 B and this
  recommendation weakens considerably.

That last point is the honest caveat on the headline: **the serif's 73% assumes it ships 400 + 600 +
italic.** The scaffold prose contains no emphasis today. Worth deciding what Project prose is allowed
to contain before deciding the serif is too expensive.

## Verification

Reproduce from this branch:

```
# byte ladder (needs fonttools in a venv; see the header of subset-fonts.mjs)
PYTHON=<venv>/python FONT_SRC=<dir> OUT_DIR=<dir> node scripts/research/subset-fonts.mjs

# what the direction renders
node scripts/research/audit-glyphs.mjs

# unicode-range and tabular figures, in a real browser
FONTS_OUT=<dir> FONT_SRC=<dir> node scripts/research/verify-in-browser.mjs

# the matrix (rebuilds the site once per variant)
node scripts/research/make-fixtures.mjs
FONTS_OUT=<dir> node scripts/research/measure-matrix.mjs variants
FONTS_OUT=<dir> node scripts/research/measure-matrix.mjs sweep
```

Raw medians are committed at `scripts/research/results-variants.json` and
`scripts/research/results-sweep.json`.

**What this branch changes that must not reach `main`:** the `src/styles/fonts.css` +
`src/layouts/FontPreload.astro` imports in `Base.astro`, the `src/pages/research-plate/[size].astro`
fixture, `public/research/`, and `src/fonts/`. Nothing in `docs/` or in the existing scripts was
modified.
