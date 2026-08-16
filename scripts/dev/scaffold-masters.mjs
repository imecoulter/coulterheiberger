#!/usr/bin/env node
/**
 * THROWAWAY. Generates placeholder masters into `.render-drop/` so the scaffold
 * Projects can be produced by actually running `npm run assets` rather than by
 * hand-placing files.
 *
 * docs/content-architecture.md §5 puts ~3 placeholder Projects on `main` behind
 * the existing noindex, so design work, the perf gate and preview deploys run
 * against realistically-shaped content instead of an empty grid. Launch (#14)
 * is "replace the scaffold folders, then remove noindex" — delete this script
 * at the same time.
 *
 * It exists rather than being a one-off because the plates have to be
 * regenerated at known compositions whenever a decision downstream needs them
 * to be — which has already happened once, when issue #30 made `framing` a
 * required per-image field and the plates all wanted the same keyword. An
 * unreproducible scaffold makes that harder than it needs to be.
 *
 * The plates are deliberately abstract — graded bands, a horizon, a soft glow
 * and fine grain. They are not imitation architecture and not derived from any
 * real render; NOTICE covers imagery copyright and there is no reason to muddy
 * it. What they DO reproduce is the thing that matters downstream: a smooth sky
 * gradient and per-pixel grain, which is what §2's 4:4:4 and quality-92 choices
 * were measured against.
 *
 *   node scripts/dev/scaffold-masters.mjs <plate-set>
 *
 * Writes 16-bit PNG at native aspect, >= 3200 px on the long edge — §1's preset.
 * Names are deliberately in the toolchain's `Hero_North_Dusk.png` shape so the
 * slugifier in scripts/assets.mjs is genuinely exercised.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { renderDropDir } from '../lib/repo.mjs';

/**
 * Every plate: name, pixel dimensions, a palette in sRGB, and where the
 * composition sits.
 *
 * The composition fields are per plate rather than module constants because of
 * issue #30: `framing` is a required, per-image field with nine legal values,
 * and plates that all put the subject in the same corner would exercise exactly
 * one of them. So the three heroes are composed to want three different
 * answers — `left top`, `centre`, `right` — and the framing keywords committed
 * in each index.mdx are read off these numbers, not guessed.
 *
 *   horizon  fraction of height where sky meets ground. Lower number = higher
 *            horizon in frame; 0.74 reads as a "low horizon" over open water.
 *   slab     subject extent as fractions of width, and its top as a fraction
 *            of the horizon.
 *   light    the warm source, as a fraction of width and of the horizon.
 *
 * Aspects are also spread deliberately. #30's model holds only while native
 * aspect sits between 4:5 (0.800) and 21:9 (2.333), and the first two heroes
 * were 2.334 and 2.332 — a hair outside, by accident, which made every scaffold
 * a warning case and none of them a normal one. Heroes now span 1.5 / 1.778 /
 * 2.0, inside the window.
 *
 * `Stair_Void_Portrait` stays at 2600x3400 (0.765) ON PURPOSE. It is the one
 * plate outside the window, so regenerating this set through the real ritual
 * fires the `npm run assets` framing warning on real content — the cheap way to
 * know that warning works and reads well.
 */
const SETS = {
  'riverside-tower': [
    // Subject left and high, light off to the right -> `left top`.
    { name: 'Hero_North_Dusk.png', w: 4096, h: 2304, sky: [28, 38, 58], ground: [16, 18, 24], glow: [212, 138, 84],
      horizon: 0.62, slab: { x0: 0.11, x1: 0.46, top: 0.14 }, light: { x: 0.72, y: 0.55 } },
    { name: 'Interior_Atrium.png', w: 3600, h: 2400, sky: [214, 208, 196], ground: [58, 54, 50], glow: [246, 238, 214],
      horizon: 0.62, slab: { x0: 0.11, x1: 0.46, top: 0.14 }, light: { x: 0.72, y: 0.55 } },
  ],
  'harbour-pavilion': [
    // Centred over a low horizon, light directly above it -> `centre`.
    { name: 'Hero_Water_Level.png', w: 4096, h: 2048, sky: [136, 168, 186], ground: [40, 58, 68], glow: [232, 240, 240],
      horizon: 0.74, slab: { x0: 0.38, x1: 0.62, top: 0.34 }, light: { x: 0.5, y: 0.42 } },
    { name: 'Roof_Study_Overcast.png', w: 3400, h: 2550, sky: [186, 190, 194], ground: [92, 96, 100], glow: [220, 222, 224],
      horizon: 0.62, slab: { x0: 0.11, x1: 0.46, top: 0.14 }, light: { x: 0.72, y: 0.55 } },
  ],
  'civic-archive': [
    // Elevation banked to the right of centre, light raking in from the left,
    // and vertically full-height -> `right`, with no vertical component.
    { name: 'Hero_Street_Elevation.png', w: 4200, h: 2800, sky: [96, 106, 124], ground: [44, 44, 48], glow: [206, 196, 176],
      horizon: 0.62, slab: { x0: 0.56, x1: 0.89, top: 0.1 }, light: { x: 0.28, y: 0.55 } },
    // Out of the framing window on purpose (0.765) — see the docblock above.
    { name: 'Stair_Void_Portrait.png', w: 2600, h: 3400, sky: [32, 30, 34], ground: [18, 17, 20], glow: [224, 190, 138],
      horizon: 0.62, slab: { x0: 0.11, x1: 0.46, top: 0.14 }, light: { x: 0.72, y: 0.55 } },
  ],
};

const set = process.argv[2];
if (!SETS[set]) {
  console.error(`scaffold-masters — unknown set "${set ?? ''}".\nOne of: ${Object.keys(SETS).join(', ')}`);
  process.exit(1);
}

const drop = renderDropDir();
mkdirSync(drop, { recursive: true });

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

/**
 * Grain amplitude in 8-bit units, correlated over small blocks because real
 * render noise clumps rather than being independent per pixel. It is here to
 * dither the gradient — an undithered 8-bit ramp over 1800 px bands visibly,
 * and the committed JPEG would bake that in.
 */
const GRAIN = 1.6;
const GRAIN_BLOCK = 3;

/**
 * Fine detail on the ground plane and the slab only — never the sky.
 *
 * This exists to make the plates honest about WEIGHT. A pure gradient plate
 * delivered 5 KB of AVIF at 1600 px against the 43 KB §2 measured for a real
 * Rendered Asset, and a perf gate run against content 9x lighter than anything
 * that will ever replace it is a gate that passes for the wrong reason. Real
 * renders carry their bytes in materials and foliage, with a smooth sky — so
 * the detail goes where a render's detail actually is, rather than being dusted
 * over the whole frame (which is what put an earlier attempt at 7.3 MB).
 *
 * It is fractal rather than per-pixel random so the texture survives the
 * downscale to a delivery tier instead of averaging to flat.
 *
 * KNOWN GAP, measured, not solved. The committed plates land at 200-300 KB
 * against the 1.2-2.0 MB §2 quotes for a real Rendered Asset, and — the number
 * that actually matters — they deliver ~5 KB of AVIF at 1600 px against §2's
 * measured 43 KB. Neither per-pixel noise (which reached 7.3 MB committed) nor
 * these octaves moved the delivered figure: modern AVIF is simply very good at
 * synthetic low-contrast content, and closing a 9x gap would mean generating
 * something close to a real render.
 *
 * That is acceptable TODAY only because no page renders a Project yet, so the
 * perf gate never sees these bytes. It stops being acceptable the moment the
 * Project pages land: a gate run against 5 KB heroes passes for the wrong
 * reason. Whoever builds those pages should replace these plates with real
 * Rendered Assets before trusting an LCP Path number.
 *
 * That warning no longer lives only here. `scripts/assert-lcp-path.mjs` counts
 * scaffold plates on the LCP Path and annotates the route with what it would
 * weigh at asset-delivery.md's 43 KB proxy, so the gap is stated where the
 * number is read rather than in a docblock nobody opens. It identifies
 * scaffolds by their `credit` line, which makes it self-clearing: the commit
 * that replaces these plates with real work also deletes the annotation.
 */
const DETAIL = 26;
const OCTAVES = 5;

/** Value noise at one frequency, bilinearly interpolated. */
function octave(w, h, cells) {
  const cw = Math.max(2, Math.round(cells));
  const ch = Math.max(2, Math.round((cells * h) / w));
  const grid = new Float32Array((cw + 1) * (ch + 1));
  for (let i = 0; i < grid.length; i++) grid[i] = Math.random() - 0.5;
  return (x, y) => {
    const fx = (x / w) * cw;
    const fy = (y / h) * ch;
    const x0 = fx | 0;
    const y0 = fy | 0;
    const tx = fx - x0;
    const ty = fy - y0;
    const g = (a, b) => grid[b * (cw + 1) + a];
    return (
      g(x0, y0) * (1 - tx) * (1 - ty) +
      g(x0 + 1, y0) * tx * (1 - ty) +
      g(x0, y0 + 1) * (1 - tx) * ty +
      g(x0 + 1, y0 + 1) * tx * ty
    );
  };
}

// The plate is composed at 8 bits and emitted as a 16-bit PNG, because
// sharp 0.35.3 silently ignores `raw.depth: 'ushort'` on input and reads the
// buffer back as bytes — which produces incompressible garbage, not a 16-bit
// image. (Measured: it put a 3200 px plate at 7.3 MB, past §4's 3 MB ceiling,
// and the same plate composed this way lands under 1 MB.) toColourspace does
// the widening, and it is verified: `metadata()` on the output reports
// ushort/rgb16, which is what §1's preset calls for.
for (const plate of SETS[set]) {
  const { w, h } = plate;
  const px = Buffer.alloc(w * h * 3);
  const horizon = Math.round(h * plate.horizon);
  // The warm source, placed per plate. On every plate but the centred one it is
  // off to one side, so the 21:9 crop and the 4:5 crop see genuinely different
  // compositions — which is what makes these plates worth framing at all.
  const glowX = w * plate.light.x;
  const glowY = horizon * plate.light.y;
  const glowR = Math.min(w, h) * 0.45;

  // The subject. Its placement is per plate (see SETS) so that the three heroes
  // want three different `framing` keywords rather than all wanting `left top`.
  // Wherever it sits, a centre crop should visibly lose it — that is what makes
  // framing a real decision on these plates rather than a formality.
  const slab = {
    x0: Math.round(w * plate.slab.x0),
    x1: Math.round(w * plate.slab.x1),
    y0: Math.round(horizon * plate.slab.top),
    mullion: (Math.PI * 2) / Math.max(6, Math.round(w / 150)),
    floor: (Math.PI * 2) / Math.max(6, Math.round(h / 26)),
  };

  // Octaves from coarse to fine, amplitude halving. The finest sits near the
  // pixel grid; the coarsest is what survives the downscale to a delivery tier.
  const layers = [];
  for (let o = 0; o < OCTAVES; o++) layers.push([octave(w, h, 24 * 2 ** o), 1 / 2 ** o]);
  const norm = layers.reduce((s, [, a]) => s + a, 0);
  const fractal = (x, y) => layers.reduce((s, [n, a]) => s + n(x, y) * a, 0) / norm;

  const blocksX = Math.ceil(w / GRAIN_BLOCK);
  const grainField = new Float32Array(blocksX * Math.ceil(h / GRAIN_BLOCK));
  for (let i = 0; i < grainField.length; i++) grainField[i] = (Math.random() - 0.5) * GRAIN;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const above = y < horizon;
      const t = above ? y / horizon : (y - horizon) / (h - horizon);
      const base = above ? plate.sky : plate.ground;
      const other = above ? plate.glow : plate.sky;
      // Sky grades toward the light; ground grades away from it.
      const mix = above ? Math.pow(1 - t, 2.2) * 0.55 : Math.pow(1 - t, 3) * 0.25;

      const d = Math.hypot(x - glowX, y - glowY) / glowR;
      const glow = above ? Math.max(0, 1 - d) ** 3 * 0.6 : 0;

      // Abstract structure: a slab standing against the horizon, with a mullion
      // rhythm and floor lines. Not imitation architecture — it is a rectangle
      // and two sine waves. It is here because a pure gradient delivers far
      // fewer bytes than a real Rendered Asset, which would make the perf gate
      // pass against content lighter than anything that will ever replace it.
      let mass = 0;
      if (x > slab.x0 && x < slab.x1 && y > slab.y0 && y < horizon) {
        const mull = 0.5 + 0.5 * Math.cos((x - slab.x0) * slab.mullion);
        const floor = 0.5 + 0.5 * Math.cos((y - slab.y0) * slab.floor);
        // Glazing catches the light source; spandrel does not.
        const facing = 1 - (x - slab.x0) / (slab.x1 - slab.x0);
        mass = -0.42 + mull * 0.26 + floor * 0.1 + facing * 0.14;
      }

      // Fine grain — the thing 4:2:0 damages and 4:4:4 protects.
      const grain =
        grainField[((y / GRAIN_BLOCK) | 0) * blocksX + ((x / GRAIN_BLOCK) | 0)];

      // Ground falls off with distance, so detail does too; the slab keeps a
      // constant, weaker material texture.
      const weight = above ? (mass !== 0 ? 0.5 : 0) : 0.35 + 0.65 * t;
      const detail = weight === 0 ? 0 : fractal(x, y) * DETAIL * weight;

      const o = (y * w + x) * 3;
      for (let c = 0; c < 3; c++) {
        px[o + c] = clamp(lerp(base[c], other[c], mix + glow) * (1 + mass) + grain + detail);
      }
    }
  }

  const out = join(drop, plate.name);
  const info = await sharp(px, { raw: { width: w, height: h, channels: 3 } })
    .toColourspace('rgb16')
    .png({ compressionLevel: 6 })
    .toFile(out);
  const meta = await sharp(out).metadata();
  console.log(`  ${plate.name}  ${w}x${h}  ${meta.depth}/${meta.space}  ${(info.size / 1024 / 1024).toFixed(1)} MB`);
}

console.log(`scaffold-masters — ${SETS[set].length} master(s) in ${drop}`);
