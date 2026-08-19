#!/usr/bin/env node
/**
 * Produces the site-wide Social Card committed at `src/assets/social-card.jpg`.
 *
 * Like `subset-fonts.mjs`, this is a LOCAL dev tool. `.github/workflows/deploy.yml`
 * is Node-only and never runs it; the committed JPEG is the artifact CI consumes,
 * and `Base.astro` delivers it at 1200x630 through `getImage()`. The card is
 * committed at 2x so the delivered file is a downscale rather than a same-size
 * re-encode.
 *
 * It lives in `src/assets/` rather than `public/` on purpose: Astro content-hashes
 * the emitted filename, and crawlers cache a Social Card by URL for a long time.
 * A hash is the only thing that reliably busts that cache.
 *
 * ## Setup
 *
 * The same virtualenv `subset-fonts.mjs` uses — fontTools with brotli, which is
 * what lets it READ the committed woff2:
 *
 *   python -m venv .venv-fonts
 *   .venv-fonts/Scripts/pip install fonttools brotli
 *
 * ## Run
 *
 *   PYTHON=.venv-fonts/Scripts/python.exe node scripts/dev/build-social-card.mjs
 *
 * From an agent worktree the venv lives in the MAIN checkout, so pass the
 * absolute path. No `npm run` alias, for the same reason `subset-fonts.mjs` has
 * none: a script in package.json reads as part of the build, and this is not.
 *
 * ## Why the text is outlined, and not set
 *
 * The glyphs are outlined out of the committed woff2 with fontTools rather than set
 * as `<text>`, because librsvg fails silently on a missing family and Satori cannot
 * read woff2 at all. The full probe, and the shared implementation, are in
 * `scripts/lib/outline.mjs`.
 *
 * That guard is the whole point, and it is worth more since
 * [#36](https://github.com/imecoulter/coulterheiberger-com/issues/36) added
 * lowercase to the mono cut for the home page's email address: the subset no
 * longer *enforces* mono as an uppercase face, so a lowercase spec line would
 * now render rather than break. Uppercase is the role's rule
 * (`docs/styling.md`), not the font's, and this file states it in `SPEC`.
 *
 * Kerning is read out of the subsets' own GPOS `kern` feature, which is why
 * `subset-fonts.mjs` keeps it on both faces.
 *
 * THE CARD IS BUILT FROM THE COMMITTED FONTS. Regenerate it whenever
 * `src/fonts/` changes, or the artifact stops being reproducible from the tree.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { repoRoot } from '../lib/repo.mjs';
import { outline } from '../lib/outline.mjs';

const root = repoRoot();
const OUT = join(root, 'src', 'assets', 'social-card.jpg');

// ---- what the card says ---------------------------------------------------

/**
 * The display line is the canonical role and carries no qualifier; the range of
 * the work is stated on the specification line instead. Both are ADR-0004, and
 * changing either here without changing ADR-0004 and `src/pages/index.astro` is
 * a defect — this artifact is the one place the positioning is a raster.
 *
 * The spec line is all-caps ASCII plus U+00B7, every glyph of which is inside
 * `MONO_SPEC` in `subset-fonts.mjs`. If it ever is not, this script stops.
 *
 * What is deliberately NOT on the card:
 *
 *   - **No body serif.** It is a system stack by decision (issue #21), so baking
 *     one machine's Georgia into a committed raster would make the choice the
 *     design refused to make.
 *   - **No email address.** A card is a scrapeable image; the mailto on `/` is
 *     the contact path.
 *   - **No "Portfolio in progress".** Dated copy inside an artifact crawlers
 *     cache for months is a promise to go stale.
 *   - **No signal red.** Under 1% of pixels is the rule (docs/styling.md), and
 *     there is no plate index or focus state on a card to spend it on.
 */
const NAME = 'Coulter Heiberger';
const SPEC = 'TECHNICAL ARTIST · REAL-TIME 3D · GEOSPATIAL PIPELINES';

// ---- geometry -------------------------------------------------------------

/**
 * Authored in 1200x630 design units — the ratio every consumer crops to — and
 * emitted at 2x. The viewBox does the scaling, so every number below reads at
 * the size it would have in CSS.
 */
const W = 1200;
const H = 630;
const SCALE = 2;

const MARGIN = 100;
const NAME_SIZE = 92;
const NAME_TRACK = -0.022; // `h1` in src/pages/index.astro
const RULE_GAP = 52; // name baseline -> datum rule
const RULE_WEIGHT = 1.5;
const SPEC_SIZE = 22;
const SPEC_TRACK = 0.07; // --track-spec
const SPEC_GAP = 44; // datum rule -> spec baseline
const OPTICAL_RISE = 8; // a block centred by arithmetic sits low by eye

const FONTS = {
  display: join(root, 'src', 'fonts', 'montserrat-wght500-site-trimmed.woff2'),
  mono: join(root, 'src', 'fonts', 'jetbrainsmono-wght500-mono-spec-no-liga.woff2'),
};

// ---- colour ---------------------------------------------------------------

/**
 * `--ground` and `--ink` verbatim from `src/styles/tokens.css`. `--rule` is
 * DERIVED the way the token is, rather than pasted as a hex: docs/styling.md's
 * one rule is that nothing hard-codes a value a token names, and a stale hairline
 * baked into a raster is exactly the drift that rule exists to prevent.
 */
const GROUND = '#f2f0ec';
const INK = '#14161a';

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

function hexToOklab(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => srgbToLinear(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToHex([L, A, B]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => Math.round(Math.min(1, Math.max(0, linearToSrgb(v))) * 255));
  return '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** `color-mix(in oklab, <a> <pct>%, <b>)`. */
function mixOklab(a, b, pct) {
  const [x, y] = [hexToOklab(a), hexToOklab(b)];
  return oklabToHex(x.map((v, i) => v * pct + y[i] * (1 - pct)));
}

const RULE = mixOklab(INK, GROUND, 0.18);

// ---- compose --------------------------------------------------------------

const name = outline(FONTS.display, NAME, NAME_SIZE, NAME_TRACK);
const spec = outline(FONTS.mono, SPEC, SPEC_SIZE, SPEC_TRACK);

/**
 * Assert the type fits the plate rather than trusting the numbers above. A line
 * that overruns the margin renders as a card with a word walking off the edge,
 * and the only place anyone would ever see it is in someone else's timeline.
 */
const CONTENT_WIDTH = W - MARGIN * 2;
for (const [label, run] of [
  ['display', name],
  ['spec', spec],
]) {
  if (run.width > CONTENT_WIDTH) {
    throw new Error(
      `${label} line is ${run.width.toFixed(1)} design units wide, over the ` +
        `${CONTENT_WIDTH} available between the margins. Shorten the copy or drop the size.`,
    );
  }
}

// Name cap-top to spec baseline, centred with a small optical rise.
const blockHeight = name.capHeight + RULE_GAP + SPEC_GAP;
const nameBaseline = (H - blockHeight) / 2 - OPTICAL_RISE + name.capHeight;
const ruleY = nameBaseline + RULE_GAP;
const specBaseline = ruleY + SPEC_GAP;

/**
 * Glyph outlines are Y-up in font units, so each run is a `scale(s, -s)` inside a
 * translate to its baseline. `shape-rendering` is left alone; librsvg antialiases
 * fills by default and these are fills, not strokes.
 */
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * SCALE}" height="${H * SCALE}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${GROUND}"/>
  <g transform="translate(${MARGIN} ${nameBaseline}) scale(${name.scale} ${-name.scale})">
    <path d="${name.d}" fill="${INK}"/>
  </g>
  <rect x="${MARGIN}" y="${ruleY}" width="${CONTENT_WIDTH}" height="${RULE_WEIGHT}" fill="${RULE}"/>
  <g transform="translate(${MARGIN} ${specBaseline}) scale(${spec.scale} ${-spec.scale})">
    <path d="${spec.d}" fill="${INK}"/>
  </g>
</svg>`;

mkdirSync(join(root, 'src', 'assets'), { recursive: true });

/**
 * Encoded to `docs/asset-delivery.md` §2, even though a Social Card is not a
 * Rendered Asset and never goes through `npm run assets`: it lands under `src/`,
 * so `npm run check:assets` grades it against §4 regardless.
 *
 * `pipelineColourspace('srgb')` is belt-and-braces here — an SVG rasterises to
 * 8-bit, so sharp's `RGB16 -> p3` working-space branch (§3) is not reached — but
 * stating it means the file cannot start depending on that being true.
 */
const buffer = await sharp(Buffer.from(svg))
  .pipelineColourspace('srgb')
  .jpeg({ quality: 92, chromaSubsampling: '4:4:4', mozjpeg: true })
  .toBuffer();

const meta = await sharp(buffer).metadata();
if (meta.icc) throw new Error(`emitted an ICC profile (${meta.icc.length} B); check:assets rejects it.`);
if (Math.max(meta.width, meta.height) > 3200) throw new Error(`long edge ${meta.width}x${meta.height} over 3200.`);

writeFileSync(OUT, buffer);

console.log(
  `social-card  ${meta.width}x${meta.height}  ${(buffer.length / 1024).toFixed(1)} KB  ` +
    `rule ${RULE}  ${OUT.slice(root.length + 1)}\n` +
    `  display  ${name.width.toFixed(0)}/${CONTENT_WIDTH} wide  "${NAME}"\n` +
    `  spec     ${spec.width.toFixed(0)}/${CONTENT_WIDTH} wide  "${SPEC}"`,
);
