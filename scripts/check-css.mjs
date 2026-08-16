#!/usr/bin/env node
/**
 * Asserts the design direction's hard refusals, and the token-layer half of the
 * accessibility bar, over the BUILT css.
 *
 *   1. zero border-radius, zero box-shadow      (docs/design-direction.md)
 *   2. --muted >= 4.5:1 and --signal >= 3:1 on the ground, in BOTH bands
 *   3. --signal never appears in a `color:` declaration
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

/* ---- colour ---------------------------------------------------------------
   OKLab mix -> sRGB -> WCAG 2.x relative luminance. The mix has to be done in
   OKLab and not in sRGB because that is what the token declares; mixing the
   same 58% in sRGB lands somewhere else entirely.

   Deliberately NOT quantised to 8 bits before computing luminance. WCAG 2.x
   defines relative luminance over 8-bit channels, so quantising is arguably the
   more literal reading — it was tried, and it moves --muted by at most 0.02
   (night 5.01 -> 4.99) and --rule by 0.01. Nothing here turns on it, and the
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

/* ---- token bands ----------------------------------------------------------
   Two bands: `:root` (day) and `.night`. Night is day overlaid with .night's
   own declarations, which is the cascade the page actually gets.

   WHICH BAND DECLARED A TOKEN IS TRACKED, and a color-mix() resolves against
   the primaries of ITS OWN declaring band — not the band being evaluated. That
   is not pedantry, it is the whole point: a custom property resolves at
   computed-value time on the element that declares it, so a color-mix() left
   only on :root bakes in :root's ink/ground and does NOT re-derive under
   .night (tokens.css:54-61, verified on the built page in issue #11). Modelling
   it any other way would compute the value we WANT and bless the exact
   regression tokens.css warns about — deleting the two restated lines would
   sail through. Modelled this way, deleting them drops night --muted onto the
   night ground as a day-tinted grey and this check fails, which is correct. */
function bands(css) {
  const day = new Map();
  const night = new Map();

  // Innermost rule bodies only: `[^{}]*` cannot span a nested block, so an
  // at-rule wrapper is skipped and its inner `:root{...}` is what matches.
  for (const [, prelude, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const selectors = prelude.split(',').map((s) => s.trim());
    const target = selectors.includes(':root') ? day : selectors.includes('.night') ? night : null;
    if (!target) continue;
    for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)) {
      target.set(name, value.trim());
    }
  }
  return { day, night };
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
   exempting it exempts the thing people squint at. 58% ink measures 4.90 (day) /
   5.01 (night); the floor for 4.5:1 is 56% / 55%, so there are two points of
   margin. Moving --muted below that is a design change, not a tuning knob.

   --signal: 3:1. It is the :focus-visible outline (base.css:32-35) and nothing
   else — a non-text UI component under WCAG 2.2 SC 1.4.11. It measures 3.77
   (day) / 4.41 (night) and FAILS 4.5:1, which is why the `color:` refusal below
   exists and why this floor is 3 and not 4.5.

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
}

/* Contrast is a property of the token set, not of each file, so it is computed
   once over all built CSS concatenated rather than per source. */
const allCss = sources.map((s) => s.css).join('\n');
const { day, night } = bands(allCss);

if (day.size === 0) {
  console.error('check:css — no `:root` custom properties found in built CSS. Refusing to pass.');
  process.exit(1);
}

// Attach the declaring band to every token, then build night as day overlaid.
const dayBand = new Map();
for (const [k, v] of day) dayBand.set(k, { value: v, from: dayBand });
const nightBand = new Map(dayBand);
for (const [k, v] of night) nightBand.set(k, { value: v, from: nightBand });

const ratios = [];
for (const [bandName, band] of [
  ['day', dayBand],
  ['night', nightBand],
]) {
  let ground;
  try {
    ground = resolve('--ground', band);
  } catch (err) {
    console.error(`check:css — cannot resolve --ground in the ${bandName} band: ${err.message}`);
    process.exit(1);
  }
  for (const { token, min, role } of FLOORS) {
    let ratio;
    try {
      ratio = contrast(resolve(token, band), ground);
    } catch (err) {
      console.error(`check:css — cannot resolve ${token} in the ${bandName} band: ${err.message}`);
      process.exit(1);
    }
    ratios.push({ bandName, token, ratio, min, role });
  }
}

const failed = ratios.filter((r) => r.ratio < r.min);

if (violations.length > 0 || failed.length > 0) {
  if (violations.length > 0) {
    console.error(
      `check:css — ${violations.length} violation(s) of the design direction's hard rules.\n` +
        `Datum ships zero radius and zero shadow, and --signal is never text.\n` +
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
        `  ${f.token} on --ground (${f.bandName})\n` +
          `    ${f.ratio.toFixed(2)}:1, needs ${f.min}:1 — ${f.role}\n`,
      );
    }
  }
  process.exit(1);
}

const blocks = sources.length;
const table = ratios.map((r) => `${r.token}/${r.bandName} ${r.ratio.toFixed(2)}`).join(', ');
console.log(`check:css — ok. ${blocks} stylesheet(s)/inline block(s), 0 radius, 0 shadow.`);
console.log(`check:css — contrast ok. ${table}.`);
