#!/usr/bin/env node
/**
 * `npm run assets <slug>` — turns masters into committed Rendered Assets.
 *
 * The four-step contract is docs/asset-delivery.md §3: read the top level of
 * `.render-drop/`, convert each image to the §2 spec into
 * `src/content/projects/<slug>/`, move the masters to `.render-drop/.done/<slug>/`,
 * then either write `index.mdx` complete or print the YAML block for the new
 * images. No YAML round-tripping. Decided on issue #6, built on issue #17.
 *
 * THE COLOUR PIPELINE IS THE PART THAT NEEDS EXPLAINING. §2 requires the
 * embedded profile to be converted to sRGB and then stripped, and warns that
 * Astro's pipeline strips without converting. Measured here against sharp
 * 0.35.3 / libvips 8.18.3, on P3-tagged and untagged masters at both depths:
 *
 *   master              default        withIccProfile('srgb')  pipelineColourspace
 *   8-bit P3-tagged     ok             ok, but ATTACHES icc    ok
 *   16-bit P3-tagged    NOT CONVERTED  ok, but ATTACHES icc    ok
 *   16-bit untagged     ok             DOUBLE CONVERTED        ok
 *
 * The 16-bit rows are the live hazard, because §1's preset is 16-bit PNG.
 * sharp picks its working space in pipeline.cc:350 —
 *   processingProfile = interpretation == RGB16 ? "p3" : "srgb"
 * — so a 16-bit master lands in a P3 working space, and the default pipeline
 * then writes those P3 numbers out untagged. That is precisely §2's failure:
 * visibly wrong colour with nothing to catch it. `withIccProfile('srgb')` looks
 * like the fix and is worse, because it transforms an already-sRGB untagged
 * master a second time (drift 40/255 measured) and attaches a profile the CI
 * check in scripts/check-assets.mjs then rejects.
 *
 * `pipelineColourspace('srgb')` forces the working space before that line is
 * reached (pipeline.cc:81), so the automatic embedded-profile transform lands
 * in sRGB, and the default metadata handling drops the profile on write. One
 * JPEG encode, correct in all four cases. Do not "simplify" it away.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';
import { assertSlug, renderDropDir, repoRoot } from './lib/repo.mjs';

/** docs/asset-delivery.md §2. Every number here is fixed by that document. */
const JPEG = { quality: 92, chromaSubsampling: '4:4:4', mozjpeg: true };
const LONG_EDGE = 3200;

/** §1 writes 16-bit PNG. The others are accepted so a re-drop is never blocked. */
const MASTER_EXTENSIONS = new Set(['.png', '.tif', '.tiff', '.jpg', '.jpeg']);

const slug = assertSlug(process.argv[2], 'assets');
const root = repoRoot();
const drop = renderDropDir();
const done = join(drop, '.done', slug);
const outDir = join(root, 'src', 'content', 'projects', slug);
const entry = join(outDir, 'index.mdx');

/**
 * The master's filename, slugified (§2). The document's worked example is
 * `Hero_North_Dusk.png` -> `hero-north-dusk.jpg`. These names are public —
 * Astro retains the source basename in every emitted variant and every srcset
 * entry — so the transformation is deliberately lossy-but-predictable rather
 * than clever.
 */
function slugifyName(file) {
  const stem = basename(file, extname(file))
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // combining marks left by NFKD
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return stem ? `${stem}.jpg` : null;
}

function fail(message) {
  console.error(`assets — ${message}`);
  process.exit(1);
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

// ---------------------------------------------------------------- read masters
if (!existsSync(drop)) {
  fail(
    `no drop folder at\n  ${drop}\n\n` +
      `docs/asset-delivery.md §1 puts masters in \`.render-drop\\\`, a sibling of the\n` +
      `working tree and outside the repository. Set RENDER_DROP to override.`,
  );
}

// Top level only, and dotfiles skipped so `.done/` is never re-processed.
const masters = readdirSync(drop, { withFileTypes: true })
  .filter((e) => e.isFile() && !e.name.startsWith('.'))
  .map((e) => e.name)
  .sort();

const images = masters.filter((f) => MASTER_EXTENSIONS.has(extname(f).toLowerCase()));
const ignored = masters.filter((f) => !MASTER_EXTENSIONS.has(extname(f).toLowerCase()));

if (images.length === 0) {
  fail(`no masters at the top level of\n  ${drop}\nNothing to do.`);
}

// ------------------------------------------------- resolve names before writing
// Both of these would otherwise corrupt a Project silently, and both produce
// public strings, so they are settled before a single byte is written.
const planned = [];
const byName = new Map();
for (const file of images) {
  const name = slugifyName(file);
  if (!name) fail(`"${file}" slugifies to an empty name. Rename the master.`);
  if (byName.has(name)) {
    fail(
      `"${file}" and "${byName.get(name)}" both slugify to ${name}.\n` +
        `One would silently overwrite the other. Rename one master and re-run.`,
    );
  }
  byName.set(name, file);

  const meta = await sharp(join(drop, file)).metadata();
  if (Math.max(meta.width, meta.height) < LONG_EDGE) {
    fail(
      `"${file}" is ${meta.width}x${meta.height}. docs/asset-delivery.md §1 fixes\n` +
        `the render preset at >= ${LONG_EDGE} px on the long edge, and ${LONG_EDGE} is downscale\n` +
        `headroom for the 2560 delivery tier — upscaling here would ship a soft image\n` +
        `under a name that claims otherwise. Re-render, do not resize.`,
    );
  }
  planned.push({ file, name, meta });
}

// ------------------------------------------------------------------- convert
// Nothing above this line has touched the working tree, so a run that rejects a
// master leaves no half-made Project folder behind.
mkdirSync(outDir, { recursive: true });
const written = [];

for (const item of planned) {
  const src = join(drop, item.file);
  const out = join(outDir, item.name);

  await sharp(src, { unlimited: true })
    .pipelineColourspace('srgb') // see the header — this is the ICC conversion
    .resize({ width: LONG_EDGE, height: LONG_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg(JPEG)
    .toFile(out);

  const result = await sharp(out).metadata();
  written.push({ ...item, out, ...result, bytes: statSync(out).size, from: item.meta });
}

// ----------------------------------------------- move masters, only on success
// Deliberately after every conversion: a partial run must leave the drop folder
// intact so it still shows exactly what is pending (§3).
mkdirSync(done, { recursive: true });
for (const item of planned) {
  const from = join(drop, item.file);
  const to = join(done, item.file);
  try {
    renameSync(from, to);
  } catch {
    copyFileSync(from, to); // different volume
    unlinkSync(from);
  }
}

// ------------------------------------------------------------------ report
console.log(`assets — ${slug}`);
for (const w of written) {
  console.log(
    `  ${w.file}  ->  ${w.name}   ${w.from.width}x${w.from.height} ${w.from.depth}` +
      ` -> ${w.width}x${w.height}  ${kb(w.bytes)}`,
  );
}
if (ignored.length) {
  console.log(`  skipped (not an image): ${ignored.join(', ')}`);
}
console.log(`  masters moved to ${done}`);

// ----------------------------------------------------------------- frontmatter
const yaml = (items) =>
  items.map((w) => `  - src: ./${w.name}\n    alt: ''`).join('\n');

if (existsSync(entry)) {
  // No YAML round-tripping (§3): print the block, never edit the file.
  console.log(
    `\n${entry} already exists. Paste these into its \`images:\` list:\n\n${yaml(written)}\n`,
  );
} else {
  writeFileSync(
    entry,
    `---\ntitle: ''\nsummary: ''\ncredit: ''\nyear: ${new Date().getFullYear()}\n` +
      `order: ${nextOrder()}\nimages:\n${yaml(written)}\n---\n`,
    'utf8',
  );
  console.log(
    `\n  wrote ${entry}\n\n` +
      `Fill in title, summary, credit and every alt before publishing. They are\n` +
      `.min(1) in the schema, so the build fails until they are written — that is\n` +
      `the reminder, by design. Then: npm run publish ${slug}`,
  );
}

/**
 * `order` is the one field that cannot be derived from the drop folder: it is
 * curation across the whole collection (docs/content-architecture.md §2), so
 * this reads the existing entries and takes max + 1.
 */
function nextOrder() {
  const dir = join(root, 'src', 'content', 'projects');
  let max = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name === slug) continue;
    const file = join(dir, e.name, 'index.mdx');
    if (!existsSync(file)) continue;
    const m = readFileSync(file, 'utf8').match(/^order:[ \t]*(\d+)$/m);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}
