#!/usr/bin/env node
/**
 * Asserts docs/asset-delivery.md §4 over every tracked image under src/:
 * JPEG, long edge <= 3200 px, no embedded ICC profile, <= 3 MB.
 *
 * This gate matters more than a lint rule because the mistake it catches is
 * permanent. "Source-resolution Rendered Assets never enter git" is binding
 * (AGENTS.md), and scrubbing a master out of history means a force-push over a
 * protected branch. Catching it on the PR is the only cheap moment.
 *
 * Images are identified by MAGIC BYTES, not by extension. An extension list
 * reads the filename, which is exactly the thing an accidental commit gets
 * wrong — a 60 MB master saved as `.jpg`, or dragged in as `plate.txt`, is
 * still a master in git. Reading twelve bytes per tracked file is cheap;
 * src/ holds a few dozen text files.
 *
 * SVG is deliberately not sniffed: it is vector, so it has no pixel long edge
 * and no ICC profile, and it is not the thing §4 guards. public/ is out of
 * scope for the same reason §4 scopes itself to src/ — the favicons live there.
 *
 * See issue #17.
 */
import { execFileSync } from 'node:child_process';
import { openSync, readSync, closeSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { repoRoot } from './lib/repo.mjs';

/** docs/asset-delivery.md §2 and §4. */
const LONG_EDGE = 3200;
const MAX_BYTES = 3 * 1024 * 1024;

const root = repoRoot();

/** Raster formats by signature. Order matters: check the longest prefixes first. */
function sniff(head, length) {
  const at = (offset, ...bytes) =>
    offset + bytes.length <= length && bytes.every((b, i) => head[offset + i] === b);

  if (at(0, 0xff, 0xd8, 0xff)) return 'JPEG';
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'PNG';
  if (at(0, 0x47, 0x49, 0x46, 0x38)) return 'GIF';
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return 'WebP';
  // ISO-BMFF. The brand at offset 8 matters: `ftyp` alone also matches MP4 and
  // MOV, and ADR-0002 expects video in the Ambient Layer — flagging a scroll
  // sequence as "not JPEG" would be a confusing way to block legitimate work.
  if (at(4, 0x66, 0x74, 0x79, 0x70) && length >= 12) {
    const brand = head.toString('latin1', 8, 12);
    if (['avif', 'avis', 'heic', 'heix', 'heim', 'heis', 'mif1', 'msf1'].includes(brand)) {
      return 'AVIF/HEIF';
    }
    return null;
  }
  if (at(0, 0x49, 0x49, 0x2a, 0x00) || at(0, 0x4d, 0x4d, 0x00, 0x2a)) return 'TIFF';
  if (at(0, 0x42, 0x4d)) return 'BMP';
  return null;
}

function head(path) {
  const fd = openSync(path, 'r');
  try {
    const buf = Buffer.alloc(12);
    return { buf, length: readSync(fd, buf, 0, 12, 0) };
  } finally {
    closeSync(fd);
  }
}

const tracked = execFileSync('git', ['ls-files', '-z', '--', 'src'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 32,
})
  .split('\0')
  .filter(Boolean);

const violations = [];
let checked = 0;

for (const file of tracked) {
  const path = join(root, file);
  let stat;
  try {
    stat = statSync(path);
  } catch {
    continue; // tracked but not in the working tree
  }
  if (!stat.isFile() || stat.size < 12) continue;

  const { buf, length } = head(path);
  const format = sniff(buf, length);
  if (!format) continue;
  checked++;

  if (format !== 'JPEG') {
    violations.push({
      file,
      rule: 'not JPEG',
      detail: `${format}. §2: Astro picks a <Picture> fallback tier from the source format, and anything outside gif/svg/jpg/jpeg silently yields a ~7x larger PNG tier.`,
    });
    continue;
  }

  if (stat.size > MAX_BYTES) {
    violations.push({
      file,
      rule: 'over 3 MB',
      detail: `${(stat.size / 1024 / 1024).toFixed(2)} MB.`,
    });
  }

  let meta;
  try {
    meta = await sharp(path).metadata();
  } catch (err) {
    violations.push({ file, rule: 'unreadable', detail: err.message.split('\n')[0] });
    continue;
  }

  const longEdge = Math.max(meta.width, meta.height);
  if (longEdge > LONG_EDGE) {
    violations.push({
      file,
      rule: `long edge over ${LONG_EDGE} px`,
      detail: `${meta.width}x${meta.height}.`,
    });
  }
  if (meta.icc) {
    violations.push({
      file,
      rule: 'embedded ICC profile',
      detail: `${meta.icc.length} bytes. §2 converts to sRGB and strips; whatever numbers are committed are what browsers paint.`,
    });
  }
}

if (violations.length > 0) {
  console.error(
    `check:assets — ${violations.length} violation(s) of docs/asset-delivery.md §4.\n` +
      `Committed Rendered Assets are JPEG, sRGB with no embedded profile, <= ${LONG_EDGE} px\n` +
      `on the long edge and <= 3 MB. \`npm run assets <slug>\` produces conforming files\n` +
      `from a master; it is the only thing that should be writing images into src/.\n` +
      `Do not weaken this check to make the build pass — it is the only guard on a\n` +
      `mistake that is permanent once it is in history. If a number is genuinely\n` +
      `wrong, change it in docs/asset-delivery.md first, with a reason.\n`,
  );
  for (const v of violations) {
    console.error(`  ${v.file}\n    ${v.rule}: ${v.detail}\n`);
  }
  process.exit(1);
}

console.log(
  `check:assets — ok. ${checked} tracked image(s) under src/, all JPEG, <= ${LONG_EDGE} px, no ICC, <= 3 MB.`,
);
