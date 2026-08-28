#!/usr/bin/env node
/**
 * Gates the standing rule in ADR-0004: **if it's on the wire, it's in the repo.**
 *
 * For every page in dist/, fetches the Served Document from the deployed origin
 * and compares its script inventory — every `src`, plus the count of inline
 * blocks — against the built file. A mismatch means the edge is serving
 * JavaScript this repository does not contain, which is the exact state ADR-0004
 * exists to prevent: a Cloudflare Web Analytics beacon was edge-injected via an
 * `auto_install` ruleset from 2026-08-10 and neither the repo nor CI could see it.
 *
 * Runs AFTER the deploy, so it cannot hold the bytes back. It blocks by failing
 * the workflow — a red main is the signal that a dashboard toggle has re-opened
 * the hole. On a static site whose transforms happen at the edge, above the
 * build, that is the strongest check available.
 *
 * PITFALL, and the reason the headers below are load-bearing: `curl`/`fetch`
 * WITHOUT browser headers DOES NOT SEE edge-injected scripts. Cloudflare skips
 * HTML rewriting when the request does not look like a browser navigation. A
 * prior session reported "no beacon on production" for exactly this reason and
 * was wrong. Strip the User-Agent or the Accept header and this check passes
 * vacuously, forever.
 *
 * IT ALSO ASSERTS PAGE IDENTITY, and that half exists because the script
 * inventory alone let a shipped bug through. `public/_redirects` once held
 * `/projects/* / 301`; the splat matched every Project page, so all six 301'd to
 * `/` and the section was unreachable in production. This check fetches with
 * `redirect: 'follow'`, so it silently graded `/`'s document against each
 * Project's built file — and since every page on this site carries the same one
 * authored inline script plus the same beacon, the inventories MATCHED and the
 * comparison passed. Nothing here asked whether a URL had served the document
 * built for it.
 *
 * Now it does, by comparing the two `<link rel="canonical">` values. Canonical
 * to canonical, NOT canonical to the requested path: `urlPathFor` yields
 * `/projects/cecret` with no trailing slash and Cloudflare's
 * `html_handling: "auto-trailing-slash"` 301s that to `/projects/cecret/`, so
 * comparing against the request would need trailing-slash arithmetic and would
 * fire on every directory route. Both canonicals come from the same generator
 * (`Base.astro`, from `Astro.url.pathname`), so they are directly comparable,
 * `/404` included.
 *
 * `redirect: 'follow'` STAYS for that same reason — `'manual'` would fail on the
 * legitimate trailing-slash 301 on every page.
 *
 * Usage: node scripts/check-served-document.mjs https://coulterheiberger.com
 */
import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';

const DIST = new URL('../dist/', import.meta.url);

/**
 * Edge transforms we have accepted, and why. Anything NOT matched here that
 * appears only in the Served Document fails the check.
 *
 * Email Obfuscation is ON at the zone and stays on (ADR-0004, issue #34). It
 * injects a ~661 B same-origin script whenever a mailto: is present, so it shows
 * up on pages carrying a contact address and not on others. Matched on the
 * stable tail: the path carries a rotating cache-busting segment,
 * `/cdn-cgi/scripts/<hash>/cloudflare-static/email-decode.min.js`.
 */
const ACCEPTED_EDGE_SCRIPTS = [
  {
    name: 'Email Obfuscation',
    test: (src) => /\/cdn-cgi\/scripts\/.+\/email-decode\.min\.js$/.test(src),
  },
];

/** A browser navigation, as far as the edge is concerned. See the pitfall above. */
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

/**
 * Every <script> in a document, split into external sources and inline blocks.
 * ADR-0004 defines the inventory as every `src` plus the inline block count —
 * inline bodies are not diffed, because Astro's own inlining varies them by
 * build and the thing worth catching is an appearance, not a rewrite.
 */
function scriptInventory(html) {
  const srcs = [];
  let inline = 0;

  for (const [, attrs] of html.matchAll(/<script\b([^>]*)>/gi)) {
    const src = attrs.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (src) srcs.push((src[1] ?? src[2] ?? src[3]).trim());
    else inline += 1;
  }

  return { srcs: srcs.sort(), inline };
}

/**
 * A document's canonical URL. Every page has one — Base.astro sets it on every
 * route — so a missing one is itself a finding rather than a reason to skip the
 * check, and is reported as such below.
 */
function canonicalOf(html) {
  const link = html.match(/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i);
  const href = link?.[0].match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  return href ? (href[1] ?? href[2] ?? href[3]).trim() : null;
}

/** index.html -> "/", 404.html -> "/404", a/index.html -> "/a" */
function urlPathFor(file) {
  return '/' + file.replace(/\.html$/, '').replace(/(^|\/)index$/, '');
}

const origin = process.argv[2]?.replace(/\/$/, '');
if (!origin) {
  console.error('usage: node scripts/check-served-document.mjs <origin>');
  process.exit(2);
}

const files = [];
for await (const file of glob('**/*.html', { cwd: DIST })) files.push(file);
files.sort();

if (files.length === 0) {
  console.error('check:served — no HTML under dist/. Run `npm run build` first.');
  process.exit(2);
}

/** Compare one page's Served Document against its built file. */
async function checkPage(file) {
  const urlPath = urlPathFor(file);
  const builtHtml = readFileSync(new URL(file, DIST), 'utf8');
  const built = scriptInventory(builtHtml);
  const failures = [];
  const notes = [];

  const res = await fetch(`${origin}${urlPath}`, { headers: BROWSER_HEADERS, redirect: 'follow' });
  // 404.html is served AS the 404 response, so 404 is that page's expected status.
  if (!res.ok && res.status !== 404) {
    return { urlPath, built, status: res.status, notes, failures: [`fetch returned ${res.status} ${res.statusText}`] };
  }

  const servedHtml = await res.text();
  const served = scriptInventory(servedHtml);

  // PAGE IDENTITY, BEFORE THE SCRIPT DIFF. A page serving another page's
  // document has already failed, and its script inventory is then a comparison
  // between two unrelated pages that will usually agree on this site.
  const builtCanonical = canonicalOf(builtHtml);
  const servedCanonical = canonicalOf(servedHtml);

  if (!builtCanonical || !servedCanonical) {
    failures.push(
      `no <link rel="canonical"> in the ${builtCanonical ? 'served' : 'built'} document.\n` +
        `      Base.astro sets one on every route, so its absence is the finding.`,
    );
  } else if (builtCanonical !== servedCanonical) {
    failures.push(
      `this URL served another page's document.\n` +
        `      built canonical:  ${builtCanonical}\n` +
        `      served canonical: ${servedCanonical}\n` +
        `      A redirect is swallowing the route, or the deploy is serving stale\n` +
        `      content. Check public/_redirects for a wildcard first — its header\n` +
        `      records what a /projects/* splat cost and why no local check saw it.`,
    );
  }

  for (const src of served.srcs.filter((s) => !built.srcs.includes(s))) {
    const accepted = ACCEPTED_EDGE_SCRIPTS.find((rule) => rule.test(src));
    if (accepted) {
      notes.push(`accepted edge transform (${accepted.name}): ${src}`);
      continue;
    }
    failures.push(
      `served document loads a script the build does not:\n      ${src}\n` +
        `      Nothing in the repo puts it there. Either commit it, or turn the edge\n` +
        `      feature off. If it is a transform we are keeping, add it to\n` +
        `      ACCEPTED_EDGE_SCRIPTS in this file, with the reason.`,
    );
  }

  for (const src of built.srcs.filter((s) => !served.srcs.includes(s))) {
    failures.push(
      `built document loads a script the served one does not:\n      ${src}\n` +
        `      The deploy is stale, or the edge stripped it.`,
    );
  }

  // Injected beacons are inline as often as they are external, so the count is
  // checked too. Every accepted transform is external, so an inline delta is
  // always unaccounted.
  if (served.inline !== built.inline) {
    failures.push(`inline <script> count differs — built ${built.inline}, served ${served.inline}.`);
  }

  return { urlPath, built, status: res.status, notes, failures };
}

// Retried, because this runs seconds after a deploy and Cloudflare's asset cache
// can still be serving the previous document — a HIT on stale HTML looks exactly
// like a divergence. Only a mismatch that outlives the deadline is a real one.
// A genuinely re-injected script fails just as reliably, one deadline later.
const DEADLINE_MS = 120_000;
const RETRY_MS = 15_000;

let results = [];
const started = Date.now();

for (let attempt = 1; ; attempt++) {
  results = await Promise.all(files.map(checkPage));
  const bad = results.filter((r) => r.failures.length > 0);
  if (bad.length === 0 || Date.now() - started + RETRY_MS > DEADLINE_MS) break;
  console.log(
    `  attempt ${attempt}: ${bad.length} page(s) diverge — likely a stale edge cache, retrying in ${RETRY_MS / 1000}s`,
  );
  await new Promise((r) => setTimeout(r, RETRY_MS));
}

const failures = [];
for (const r of results) {
  for (const note of r.notes) console.log(`  ${r.urlPath} — ${note}`);
  for (const message of r.failures) failures.push({ urlPath: r.urlPath, message });
  console.log(
    `  ${r.urlPath} — ${r.status}, ${r.built.srcs.length} external + ${r.built.inline} inline — ` +
      (r.failures.length === 0 ? 'ok' : 'MISMATCH'),
  );
}

if (failures.length > 0) {
  console.error(
    `\ncheck:served — ${failures.length} divergence(s) between the Served Document and the build.\n` +
      `If it's on the wire, it's in the repo. See\n` +
      `docs/adr/0004-measurement-committed-beacon-no-field-cwv.md.\n`,
  );
  for (const f of failures) console.error(`  ${f.urlPath}\n    ${f.message}\n`);
  // exitCode rather than exit(): undici's keep-alive sockets are still open here,
  // and tearing the loop down under them aborts the process on Windows with a
  // libuv assertion instead of a clean 1. Let the handles drain.
  process.exitCode = 1;
} else {
  console.log(`\ncheck:served — ok. ${files.length} page(s) match the build.`);
}
