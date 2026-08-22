#!/usr/bin/env node
/**
 * Asserts the design direction's hard refusals, and the token-layer half of the
 * accessibility bar, over the BUILT css.
 *
 *   1. zero border-radius, zero box-shadow      (docs/design-direction.md)
 *   2. --muted >= 4.5:1 and --signal >= 3:1 on the ground
 *   3. --signal never appears in a `color:` declaration
 *   4. no prefers-color-scheme: one Ground, dark    (docs/adr/0007-one-dark-ground.md)
 *   5. spacing is a token, never a raw length     (docs/adr/0008-the-index-arrangement-and-one-spacing-atom.md)
 *
 * Built output, not source, because that is the only place the question is
 * actually settled — a value can arrive from a component, a dependency, or a
 * reset. See docs/design-direction.md and issue #11.
 *
 * A universal `*{border-radius:0}` reset was rejected for this job: it loses
 * to any later component rule on specificity, so it hides violations rather
 * than surfacing them.
 *
 * (2) and (3) live HERE rather than in a sibling script (issue #35). Same input,
 * same refusal posture, same failure mode — a second script reading the same
 * dist CSS would be a seam with nothing on either side. The two instruments that
 * are genuinely different sit at different layers: this one reads tokens,
 * Lighthouse reads rendered pages. See docs/adr/0003-accessibility-bar.md.
 */
import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';

const DIST = new URL('../dist/', import.meta.url);
const ZERO = /^(0|0px|0%|0rem|0em)$/;

/** Every stylesheet in dist, plus every inline <style> block (we inline by default). */
async function collect() {
  const sources = [];
  for await (const file of glob('**/*.{css,html}', { cwd: DIST })) {
    const path = new URL(file, DIST);
    const text = readFileSync(path, 'utf8');
    if (file.endsWith('.css')) {
      sources.push({ file, css: text });
      continue;
    }
    for (const [, block] of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
      sources.push({ file, css: block });
    }
  }
  return sources;
}

/** Declarations of `prop`, with their raw values and a little context. */
function declarations(css, prop) {
  const found = [];
  const re = new RegExp(`(?<![-\\w])${prop}\\s*:\\s*([^;{}]+)`, 'gi');
  for (const m of css.matchAll(re)) {
    const start = Math.max(0, m.index - 60);
    found.push({ value: m[1].trim(), context: css.slice(start, m.index + m[0].length).trim() });
  }
  return found;
}


/* ---- the spacing ladder ---------------------------------------------------
   ONE SPACING ATOM AND FIVE STEPS UNDER IT (ADR-0008). --gap is the distance
   between two Cells and from a Cell to the screen edge; --s1..--s5 is
   everything inside a block. A page picks one of them; it does not write a
   length.

   REFUSED BY SHAPE RATHER THAN BY VALUE, for the reason every other refusal in
   this file is by name. A whitelist of blessed pixel numbers would pass
   `margin: 20px` written by hand and drift the day --s3 is tuned, and it could
   not see intent: "just this one 14px" is how the type scale reached ten sizes
   with nobody deciding to.

   SCOPED TO margin, padding AND THE GAPS, NOT TO EVERY LENGTH. A drawn mark has
   a size — the Plate index rule is 26x2 px — and a border is a width. Those are
   not spacing and turning them into tokens would be a fourth scale nobody asked
   for. What this covers is the distance between two things.

   ZERO IS ALWAYS LEGAL, in every unit, and so is `auto`: `margin: 0` and
   `margin-inline: auto` are structural rather than spatial. So are the
   keywords a shorthand can carry (`inherit`, `revert-layer`) and anything
   inside a var() or a calc(), which is where a token arrives. */
const SPACING_PROPS = ['margin', 'padding', 'gap', 'row-gap', 'column-gap'];

/** A shorthand's value split into terms, with var()/calc() groups kept whole. */
function terms(value) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (/\s/.test(ch) && depth === 0) {
      if (cur) out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur) out.push(cur);
  return out;
}

const LENGTH = /^-?[\d.]+(px|rem|em|ch|vw|vh|vmin|vmax|cm|mm|in|pt|pc|q|ex|cap|ic|lh)$/i;
const SPACING_OK = /^(auto|inherit|initial|unset|revert|revert-layer|0)$/i;

/** True if `term` is a raw length where a token belongs. */
const isRawSpacing = (term) =>
  !SPACING_OK.test(term) && !ZERO.test(term) && !/^(var|calc|clamp|min|max)\(/i.test(term) &&
  LENGTH.test(term);

/* ---- colour ---------------------------------------------------------------
   OKLab mix -> sRGB -> WCAG 2.x relative luminance. The mix has to be done in
   OKLab and not in sRGB because that is what the token declares; mixing the
   same 58% in sRGB lands somewhere else entirely.

   Deliberately NOT quantised to 8 bits before computing luminance. WCAG 2.x
   defines relative luminance over 8-bit channels, so quantising is arguably the
   more literal reading — it was tried, and it moves --muted by at most 0.02
   (5.01 -> 4.99 on the old ground) and --rule by 0.01. Nothing here turns on it, and the
   continuous form is what color-mix() actually computes. Recorded so the next
   reader knows the question was asked rather than missed.

   Matrices are Ottosson's. Do not "simplify" the round trip by interpolating
   the hex values. */
const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
}

function rgbToOklab([r, g, b]) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb([L, A, B]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => Math.min(1, Math.max(0, linearToSrgb(c))));
}

const luminance = (rgb) => {
  const [r, g, b] = rgb.map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

/* ---- the token band -------------------------------------------------------
   ONE BAND, `:root`, because the site has one Ground (ADR-0007). This function
   read two — `:root` (day) and a `.night` class — until that ADR inverted the
   ground and deleted the second. The two-band machinery is NOT kept warm for a
   future band: a second Map that never populates passes every assertion below
   silently, which is worse than not checking at all.

   THE DECLARING SCOPE IS STILL TRACKED on every token, and that is not vestigial.
   A color-mix() must resolve against the primaries of the scope that DECLARED it,
   because a custom property resolves at computed-value time on its own element
   and then inherits already-resolved — so a mix left on :root bakes in :root's
   ink/ground and does not re-derive further down. That trap is what forced the
   old `.night` block to restate --rule and --muted (verified on the built page,
   issue #11). One band has nothing below it to get this wrong; the structure
   stays so that reintroducing a scoped band cannot quietly get it wrong either.
   See docs/styling.md. */
function bands(css) {
  const root = new Map();

  // Innermost rule bodies only: `[^{}]*` cannot span a nested block, so an
  // at-rule wrapper is skipped and its inner `:root{...}` is what matches.
  for (const [, prelude, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const selectors = prelude.split(',').map((s) => s.trim());
    if (!selectors.includes(':root')) continue;
    for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)) {
      root.set(name, value.trim());
    }
  }
  return root;
}

/**
 * Resolve a token to sRGB within `band`, where `band` is a Map of
 * name -> { value, from } carrying the band that declared it.
 */
function resolve(name, band, seen = new Set()) {
  const decl = band.get(name);
  if (!decl) throw new Error(`${name} is not declared`);
  if (seen.has(name)) throw new Error(`${name} resolves in a cycle`);
  seen.add(name);

  const { value, from } = decl;

  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) return hexToRgb(value);

  // The only derivation this design uses. Anything else is a new shape and
  // should stop the build rather than be guessed at.
  const mix = value.match(
    /^color-mix\(\s*in\s+oklab\s*,\s*var\(\s*(--[\w-]+)\s*\)\s*([\d.]+)%\s*,\s*var\(\s*(--[\w-]+)\s*\)\s*\)$/i,
  );
  if (!mix) throw new Error(`${name}: unrecognised colour value \`${value}\``);

  const [, aName, pct, bName] = mix;
  // Resolve the operands in the band that declared THIS token — see bands().
  const A = rgbToOklab(resolve(aName, from, seen));
  const B = rgbToOklab(resolve(bName, from, seen));
  const t = Number(pct) / 100;
  return oklabToRgb(A.map((v, i) => v * t + B[i] * (1 - t)));
}

/* Floors, each with the role it is protecting named.

   --muted: 4.5:1. It is the colour of .t-label and .t-spec, which are 11-12px —
   small text, so the 3:1 large-text exemption does not apply and was explicitly
   refused (issue #35): .t-spec is the design's most characteristic element and
   exempting it exempts the thing people squint at. 63% ink measures 4.96 on the
   Ground and the floor for 4.5:1 is 61%, so there are two points of margin.
   Moving --muted below that is a design change, not a tuning knob.

   63% IS NOT THE HISTORICAL NUMBER, AND THE DIFFERENCE IS THE GROUND (ADR-0007).
   --muted was 58% for the whole life of the paper site. On a pure black ground the
   4.5:1 floor moves from 55% to 61%, so 58% lands at 4.09 and FAILS. 63% holds the
   ratio the design has always had — 4.96 against 5.01 — with the same margin
   ADR-0003 chose 58% for. It is a percentage tuned to keep the rendered grey
   constant across a change of ground, not a relaxation of anything.

   --signal: 3:1. It is the :focus-visible outline (base.css) and nothing else —
   a non-text UI component under WCAG 2.2 SC 1.4.11. It measures 4.89 on the
   Ground and FAILS 4.5:1, which is why the `color:` refusal below exists and why
   this floor is 3 and not 4.5.

   --rule is deliberately absent. It is a ~1.5:1 hairline by design; a floor
   there would be a number with no authority behind it. Do not add one because
   the table looks incomplete. */
const FLOORS = [
  { token: '--muted', min: 4.5, role: 'small text (.t-label, .t-spec)' },
  { token: '--signal', min: 3.0, role: ':focus-visible outline (non-text)' },
];

const sources = await collect();
if (sources.length === 0) {
  console.error('check:css — no built CSS found in dist/. Run `npm run build` first.');
  process.exit(1);
}

const violations = [];

for (const { file, css } of sources) {
  for (const d of declarations(css, 'border-radius')) {
    // Shorthand can carry up to four values; all must be zero.
    const allZero = d.value.split(/[\s/]+/).filter(Boolean).every((v) => ZERO.test(v));
    if (!allZero) violations.push({ file, prop: 'border-radius', ...d });
  }
  for (const d of declarations(css, 'box-shadow')) {
    if (d.value.toLowerCase() !== 'none') violations.push({ file, prop: 'box-shadow', ...d });
  }
  // --signal is a 3.77:1 accent. It clears the non-text floor as an outline and
  // fails 4.5:1 as text, so it may never BE text. A ratio assertion alone cannot
  // see what a token is used for and would happily bless `color: var(--signal)`.
  // The lookbehind in declarations() is what keeps `background-color` and
  // `border-color` out of this.
  for (const d of declarations(css, 'color')) {
    if (/var\(\s*--signal\s*\)/.test(d.value)) {
      violations.push({ file, prop: 'color (--signal is not a text colour)', ...d });
    }
  }
  // SPACING IS A TOKEN, NEVER A LENGTH (ADR-0008). The shorthands are checked
  // term by term, because `margin: 0 auto` is fine and `margin: 0 20px` is not,
  // and a value assertion over the whole declaration cannot tell them apart.
  //
  // Longhands come free: the lookbehind in declarations() keeps `margin` from
  // matching `margin-top`, so each longhand is asked for by name below.
  for (const prop of SPACING_PROPS) {
    const longhands =
      prop === 'margin' || prop === 'padding'
        ? [prop, ...['top', 'right', 'bottom', 'left', 'inline', 'block'].map((s) => `${prop}-${s}`)]
        : [prop];
    for (const name of longhands) {
      for (const d of declarations(css, name)) {
        const raw = terms(d.value).filter(isRawSpacing);
        if (raw.length > 0) {
          violations.push({
            file,
            prop: `${name} (spacing is --gap or --s1..--s5, never a length)`,
            ...d,
          });
        }
      }
    }
  }
  // ONE GROUND, AND IT IS DARK (ADR-0007). Refused by NAME rather than by
  // asserting some property of the result, for the same reason --signal is: a
  // value assertion cannot see intent, and "just a light variant" is one media
  // query away and leaves no trace in the design docs.
  //
  // scripts/dev/build-favicons.mjs emits this query too, deliberately, and is
  // out of reach here on purpose — it writes an SVG, not site CSS, and the
  // favicon renders in the browser's tab strip rather than on this ground.
  for (const m of css.matchAll(/prefers-color-scheme\s*:\s*[\w-]+/gi)) {
    const start = Math.max(0, m.index - 60);
    violations.push({
      file,
      prop: 'prefers-color-scheme (the site has one Ground)',
      value: m[0],
      context: css.slice(start, m.index + m[0].length).trim(),
    });
  }
}

/* Contrast is a property of the token set, not of each file, so it is computed
   once over all built CSS concatenated rather than per source. */
const allCss = sources.map((s) => s.css).join('\n');
const root = bands(allCss);

if (root.size === 0) {
  console.error('check:css — no `:root` custom properties found in built CSS. Refusing to pass.');
  process.exit(1);
}

// Attach the declaring scope to every token — see bands() for why resolve()
// needs it even with a single band.
const band = new Map();
for (const [k, v] of root) band.set(k, { value: v, from: band });

let ground;
try {
  ground = resolve('--ground', band);
} catch (err) {
  console.error(`check:css — cannot resolve --ground: ${err.message}`);
  process.exit(1);
}

const ratios = [];
for (const { token, min, role } of FLOORS) {
  let ratio;
  try {
    ratio = contrast(resolve(token, band), ground);
  } catch (err) {
    console.error(`check:css — cannot resolve ${token}: ${err.message}`);
    process.exit(1);
  }
  ratios.push({ token, ratio, min, role });
}

const failed = ratios.filter((r) => r.ratio < r.min);

if (violations.length > 0 || failed.length > 0) {
  if (violations.length > 0) {
    console.error(
      `check:css — ${violations.length} violation(s) of the design direction's hard rules.\n` +
        `Datum ships zero radius and zero shadow, --signal is never text, the\n` +
        `site has ONE Ground with no light alternative, and spacing is a token.\n` +
        `If that is genuinely changing, amend docs/design-direction.md first —\n` +
        `do not weaken this check.\n`,
    );
    for (const v of violations) {
      console.error(`  ${v.file}\n    ${v.prop}: ${v.value}\n    …${v.context}\n`);
    }
  }
  if (failed.length > 0) {
    console.error(
      `check:css — ${failed.length} token contrast failure(s). WCAG AA is the named\n` +
        `target (docs/adr/0003-accessibility-bar.md). Fix the token, do not lower\n` +
        `the floor — and do not reach for the large-text exemption, which that ADR\n` +
        `refuses by name.\n`,
    );
    for (const f of failed) {
      console.error(
        `  ${f.token} on --ground\n` +
          `    ${f.ratio.toFixed(2)}:1, needs ${f.min}:1 — ${f.role}\n`,
      );
    }
  }
  process.exit(1);
}

const blocks = sources.length;
const table = ratios.map((r) => `${r.token} ${r.ratio.toFixed(2)}`).join(', ');
console.log(
  `check:css — ok. ${blocks} stylesheet(s)/inline block(s), 0 radius, 0 shadow, one Ground, spacing on the ladder.`,
);
console.log(`check:css — contrast ok. ${table}.`);
