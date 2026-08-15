#!/usr/bin/env node
/**
 * Asserts the design direction's two hard refusals over the BUILT css:
 * zero border-radius, zero box-shadow.
 *
 * Built output, not source, because that is the only place the question is
 * actually settled — a value can arrive from a component, a dependency, or a
 * reset. See docs/design-direction.md and issue #11.
 *
 * A universal `*{border-radius:0}` reset was rejected for this job: it loses
 * to any later component rule on specificity, so it hides violations rather
 * than surfacing them.
 */
import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { relative } from 'node:path';

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
}

if (violations.length > 0) {
  console.error(
    `check:css — ${violations.length} violation(s) of the design direction's hard rules.\n` +
      `Datum ships zero radius and zero shadow. If that is genuinely changing,\n` +
      `amend docs/design-direction.md first — do not weaken this check.\n`,
  );
  for (const v of violations) {
    console.error(`  ${v.file}\n    ${v.prop}: ${v.value}\n    …${v.context}\n`);
  }
  process.exit(1);
}

const blocks = sources.length;
console.log(`check:css — ok. ${blocks} stylesheet(s)/inline block(s), 0 radius, 0 shadow.`);
