#!/usr/bin/env node
/**
 * Produces the portrait committed at `src/assets/portrait.jpg`.
 *
 * A LOCAL dev tool on `build-social-card.mjs`'s pattern. `.github/workflows/deploy.yml`
 * never runs it; the committed JPEG is the artifact CI consumes, and the Masthead on `/`
 * and `/about/ime/` deliver it through `<Image>`.
 *
 * ## Why this is not `npm run assets`
 *
 * The portrait is NOT a Rendered Asset. `CONTEXT.md` defines one as "visual output
 * produced offline in a 3D authoring toolchain", and this is a photograph — so
 * `docs/asset-delivery.md` §1 (the render preset) and §3 (the publish ritual) do not
 * apply to it, exactly as they do not apply to the Social Card. §4 still does, because
 * `check-assets.mjs` grades every tracked image under `src/` by magic bytes, and this
 * file conforms to §2's format, colour and size rules by construction.
 *
 * `npm run assets` would also put it in `src/content/projects/<slug>/`, which would
 * make the person a Project.
 *
 * ## Run
 *
 *   node scripts/dev/build-portrait.mjs [master]
 *
 * The master is not committed and is not in `.render-drop/` either — it has no render
 * preset behind it. Its default path is below; pass a different one as argv[2] when it
 * moves. No `npm run` alias, for the reason `subset-fonts.mjs` has none: a script in
 * package.json reads as part of the build, and this is not.
 *
 * ## The colour call is the same trap `asset-delivery.md` §3 documents
 *
 * `pipelineColourspace('srgb')`, never `withIccProfile('srgb')`. sharp picks its working
 * space from the input's bit depth — a 16-bit input is transformed into a *P3* working
 * space and then written untagged. `withIccProfile` is the intuitive fix and is worse:
 * it converts an already-sRGB untagged image a second time and attaches a profile that
 * §4 then rejects. Forcing the pipeline space before that branch is reached is the
 * correct one, and it costs one JPEG encode.
 *
 * ## Size
 *
 * 1600 px square. The portrait is never laid out above `--plate-meta` (320 px), so this
 * is generous downscale headroom at 2x DPR and less than half §4's 3200 px ceiling.
 * Square because both presentations show it square; a `cover` crop from centre is
 * correct for a master that is already square and is what keeps this reproducible if a
 * differently-shaped master ever replaces it.
 */
import { statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { repoRoot } from '../lib/repo.mjs';

const root = repoRoot();
const OUT = join(root, 'src', 'assets', 'portrait.jpg');

const MASTER =
  process.argv[2] ??
  'C:/Users/coult/GoogleDrive/My Drive/Ime/250000_CJH_Portrait_Color_4096.jpg';

/** docs/asset-delivery.md §2. The encode is the Rendered Asset encode, deliberately:
    the file is graded by §4 alongside them, so it is produced to the same spec. */
const EDGE = 1600;

let master;
try {
  master = await sharp(MASTER).metadata();
} catch (err) {
  console.error(`build-portrait — cannot read the master at\n  ${MASTER}\n  ${err.message.split('\n')[0]}`);
  process.exit(1);
}

console.log(
  `  master  ${master.width}x${master.height} ${master.format}, ` +
    `${master.depth}, icc ${master.icc ? `${master.icc.length} B` : 'none'}`,
);

await sharp(MASTER)
  .pipelineColourspace('srgb')
  .resize({ width: EDGE, height: EDGE, fit: 'cover', position: 'centre' })
  .jpeg({ quality: 92, chromaSubsampling: '4:4:4', mozjpeg: true })
  .toFile(OUT);

const out = await sharp(OUT).metadata();
const { size } = statSync(OUT);

// The three things check-assets.mjs will ask, asked here first so a bad encode is
// caught at the moment it is produced rather than on the PR.
if (out.format !== 'jpeg' || Math.max(out.width, out.height) > 3200 || out.icc) {
  console.error(
    `build-portrait — the output violates docs/asset-delivery.md §4:\n` +
      `  ${out.format}, ${out.width}x${out.height}, icc ${out.icc ? `${out.icc.length} B` : 'none'}`,
  );
  process.exit(1);
}

console.log(
  `  written ${out.width}x${out.height} ${out.format}, ` +
    `icc none, ${(size / 1024).toFixed(1)} KB\n` +
    `  src/assets/portrait.jpg`,
);
