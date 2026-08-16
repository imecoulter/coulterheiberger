#!/usr/bin/env node
/**
 * Asserts ADR-0002's LCP Path budget over the LHRs that `lhci collect` leaves
 * in .lighthouseci/.
 *
 * LCP Path is operationalised as: the **over-the-wire** bytes of every network
 * request that FINISHED at or before the observed Largest Contentful Paint.
 * ADR-0002 fixes the unit as transfer bytes; `transferSize` is that number.
 *
 * That cut is only meaningful when the network is really throttled, so this
 * refuses to run under Lighthouse's default simulated (lantern) throttling
 * rather than emit a number that is silently equal to total page weight.
 * Measured on a fixture during research: 42,472 B real against a 288,824 B
 * page total — 6.8x apart. See issue #5.
 *
 * Built on `network-requests` + `metrics`, deliberately. Both are documented
 * LHR output and both are explicitly outside the Lighthouse 13 insights
 * migration, unlike `prioritize-lcp-image`, which also carries the LCP
 * resource but is being replaced.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

/** ADR-0002: LCP Path <= 500 KB, over the wire. */
const BUDGET_BYTES = 500 * 1024;
const LHCI_DIR = resolve(process.cwd(), '.lighthouseci');

/**
 * The scaffold annotation.
 *
 * The placeholder Projects on `main` (content-architecture.md §5) are synthetic
 * plates, and they deliver ~5 KB of AVIF at 1600 px where asset-delivery.md
 * measured 43 KB for a real Rendered Asset — a ~9x gap that
 * scripts/dev/scaffold-masters.mjs records as measured and unclosable. So the
 * moment a route renders a Project, this gate starts passing partly because the
 * content is fake.
 *
 * It stays a PASS, and gains a line saying what the route would weigh at the
 * proxy. A hard failure here would block the v1 Project pages, which have to be
 * built while the scaffolds are still the only content there is.
 *
 * Scaffolds are identified by their `credit` — the Project's provenance, which
 * says out loud that it is a placeholder — never by a hardcoded list of names.
 * That makes the annotation self-clearing: the commit that replaces a scaffold
 * with real work also rewrites its credit, and this line disappears with it.
 */
const PROXY_BYTES = 43 * 1024; // asset-delivery.md, Evidence: AVIF q50 @1600
const HERO_TARGET_BYTES = 220 * 1024; // AGENTS.md / ADR-0002: where the 2.5s clock lands
const SCAFFOLD_CREDIT = /placeholder/i;

/**
 * Every committed image belonging to a Project whose `credit` marks it a
 * scaffold, as the basename stem Astro retains in the emitted filename
 * (`hero-north-dusk.jpg` -> `/_astro/hero-north-dusk.DkllZt7p_ZqBTNd.avif`).
 * Read with a regex rather than a YAML parser: this runs after the build, and
 * pulling in a parser to read two fields from three files would be the heavier
 * dependency of the two.
 */
function scaffoldStems() {
  const dir = resolve(process.cwd(), 'src', 'content', 'projects');
  const stems = new Set();
  if (!existsSync(dir)) return stems;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = join(dir, entry.name, 'index.mdx');
    if (!existsSync(file)) continue;
    const frontmatter = readFileSync(file, 'utf8').split(/^---\s*$/m)[1] ?? '';
    const credit = frontmatter.match(/^credit:[ \t]*['"]?(.*?)['"]?[ \t]*$/m)?.[1] ?? '';
    if (!SCAFFOLD_CREDIT.test(credit)) continue;
    for (const [, src] of frontmatter.matchAll(/^[ \t]*-[ \t]*src:[ \t]*['"]?(\S+?)['"]?[ \t]*$/gm)) {
      stems.add(basename(src).replace(/\.[^.]+$/, ''));
    }
  }
  return stems;
}

/** Requests on the LCP Path that are a variant of a scaffold plate. */
function scaffoldsOn(counted, stems) {
  return counted.filter((item) => {
    const name = basename(new URL(item.url).pathname);
    return [...stems].some((stem) => name.startsWith(`${stem}.`));
  });
}

function loadLhrs(dir) {
  if (!existsSync(dir)) throw new Error(`No ${dir}. Run \`lhci collect\` first.`);
  const files = readdirSync(dir).filter((f) => /^lhr-\d+\.json$/.test(f));
  if (!files.length) throw new Error(`No lhr-*.json in ${dir}. Run \`lhci collect\` first.`);
  return files.map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
}

function lcpPathBytes(lhr) {
  const method = lhr.configSettings?.throttlingMethod;
  if (method !== 'devtools') {
    throw new Error(
      `throttlingMethod is "${method}", expected "devtools".\n` +
        `Under simulated throttling the observed timeline collapses to a few ms, so every\n` +
        `request finishes before LCP and "the LCP Path" degrades to "the whole page".\n` +
        `Set ci.collect.settings.throttlingMethod = 'devtools' in lighthouserc.cjs.`,
    );
  }

  const metrics = lhr.audits?.metrics?.details?.items?.[0];
  const network = lhr.audits?.['network-requests'];
  if (!metrics || !network?.details?.items) {
    throw new Error('LHR is missing the `metrics` or `network-requests` audit.');
  }

  const lcpMs = metrics.observedLargestContentfulPaint;
  if (typeof lcpMs !== 'number') throw new Error('No observedLargestContentfulPaint in LHR.');

  // The two audits publish times against different origins: network-requests
  // normalises to the earliest renderer start, metrics to navigation start.
  // Rebase the former onto the latter. Measured gap is 0.7-1.2ms — small, but
  // the whole assertion is a comparison of these two clocks.
  const offsetMs =
    (network.details.debugData.networkStartTimeTs - metrics.observedNavigationStartTs) / 1000;

  let bytes = 0;
  const counted = [];
  for (const request of network.details.items) {
    if (!request.finished || typeof request.networkEndTime !== 'number') continue;
    const endMs = request.networkEndTime + offsetMs;
    if (endMs > lcpMs) continue;
    bytes += request.transferSize || 0;
    counted.push({ url: request.url, transferSize: request.transferSize || 0, endMs });
  }

  // Group on pathname, not the full URL: `lhci collect` serves staticDistDir on
  // a fresh port per invocation, and grouping on origin would silently turn the
  // median of N runs into N medians of one.
  const url = lhr.finalDisplayedUrl || lhr.requestedUrl;
  return { bytes, counted, lcpMs, route: new URL(url).pathname };
}

/**
 * ADR-0004's floor: the Web Analytics beacon must actually be on the wire.
 *
 * `resource-summary:script:size` in lighthouserc.cjs is what prices the beacon
 * against ADR-0002's 50 KB. That row is built from network records, so if the
 * beacon fails to load — CDN outage, a lost `is:inline`, someone reintroducing a
 * PROD-only branch — the row reads 0 and PASSES. That is precisely the vacuous
 * gate ADR-0004 was written to end, and it is indistinguishable from a healthy
 * build in the LHCI output, because `lhci assert` only prints failures.
 *
 * So the presence of the beacon is asserted here, where the raw LHR is in hand.
 * LHCI 0.15 has no `minNumericValue`, which is why this cannot live in the
 * rc file next to the ceiling it guards.
 *
 * Deliberately a hard failure rather than a warning: a red build on a
 * cloudflareinsights.com outage is the correct outcome, because the deploy it
 * would gate is one whose JS budget nothing verified.
 */
const BEACON_URL = 'https://static.cloudflareinsights.com/beacon.min.js';

function beaconBytes(lhr) {
  const items = lhr.audits?.['network-requests']?.details?.items ?? [];
  const request = items.find((r) => (r.url || '').startsWith(BEACON_URL));
  return request ? request.transferSize || 0 : null;
}

/** Same rule LHCI's own `aggregationMethod: 'median'` uses, so the two gates agree. */
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

try {
  /** One budget for every route. Split this once Exhibit routes exist — ADR-0002
   *  gives Exhibits their own uncapped tier, so a single budget will be wrong. */
  const byRoute = new Map();
  const beaconRuns = [];
  for (const lhr of loadLhrs(LHCI_DIR)) {
    const result = lcpPathBytes(lhr);
    if (!byRoute.has(result.route)) byRoute.set(result.route, []);
    byRoute.get(result.route).push(result);
    beaconRuns.push({ route: result.route, bytes: beaconBytes(lhr) });
  }

  const stems = scaffoldStems();
  let lcpFailed = false;
  for (const [route, runs] of [...byRoute].sort()) {
    const value = median(runs.map((r) => r.bytes));
    const worst = runs.reduce((a, b) => (a.bytes >= b.bytes ? a : b));
    const ok = value <= BUDGET_BYTES;
    if (!ok) lcpFailed = true;

    console.log(`\n${ok ? 'PASS' : 'FAIL'}  LCP Path  ${kb(value)} / ${kb(BUDGET_BYTES)}  ${route}`);
    console.log(
      `      median of ${runs.length} run(s): [${runs.map((r) => kb(r.bytes)).join(', ')}]`,
    );

    // What this route would weigh if its scaffold plates were real work.
    const median_ = runs.find((r) => r.bytes === value) ?? worst;
    const plates = scaffoldsOn(median_.counted, stems);
    if (plates.length) {
      const synthetic = plates.reduce((sum, p) => sum + p.transferSize, 0);
      const projected = value - synthetic + plates.length * PROXY_BYTES;
      console.log(
        `      ${plates.length} scaffold plate(s) counted, delivering ${kb(synthetic)}; at` +
          ` asset-delivery.md's ${kb(PROXY_BYTES)} proxy\n` +
          `      this route is ~${kb(projected)}, against a ~${kb(HERO_TARGET_BYTES)} hero design` +
          ` target. The number above is\n` +
          `      not yet trustworthy — it clears itself when the scaffolds are replaced.`,
      );
    }
    if (!ok) {
      console.log(`      LCP at ${worst.lcpMs.toFixed(0)}ms; requests counted on the worst run:`);
      for (const item of [...worst.counted].sort((a, b) => b.transferSize - a.transferSize)) {
        console.log(
          `        ${kb(item.transferSize).padStart(10)}  ${item.endMs.toFixed(0)}ms  ${item.url}`,
        );
      }
    }
  }

  const missing = beaconRuns.filter((r) => !r.bytes);
  if (missing.length > 0) {
    console.error(
      `\nFAIL  Beacon  absent from ${missing.length}/${beaconRuns.length} run(s)  ` +
        `[${[...new Set(missing.map((r) => r.route))].sort().join(', ')}]\n\n` +
        `The Cloudflare Web Analytics beacon did not load, so\n` +
        `\`resource-summary:script:size\` is grading a page without it — it reads 0 and\n` +
        `passes, which is the vacuous gate ADR-0004 exists to end.\n\n` +
        `Check, in order: is the snippet still in src/layouts/Base.astro with is:inline;\n` +
        `has someone put it behind import.meta.env.PROD (ADR-0004 forbids it); is\n` +
        `static.cloudflareinsights.com reachable from the runner.\n\n` +
        `Do NOT delete this assertion to get green. If the beacon is genuinely going\n` +
        `away, it goes away from Base.astro and from ADR-0004 first.`,
    );
  } else {
    const value = median(beaconRuns.map((r) => r.bytes));
    console.log(`\nPASS  Beacon  ${kb(value)} on the wire, all ${beaconRuns.length} run(s)`);
    console.log(`      Priced against ADR-0002's 50 KB JS budget by lighthouserc.cjs.`);
  }

  if (lcpFailed) {
    console.error(
      `\nLCP Path budget exceeded (ADR-0002: <= ${kb(BUDGET_BYTES)} over the wire).\n` +
        `Move bytes off the LCP Path — make them Post-LCP Media that streams lazily.\n` +
        `Do NOT raise this threshold to make the build pass; that silently deletes the\n` +
        `budget while leaving the appearance of one. If the number itself is wrong,\n` +
        `change it in docs/adr/0002-graphics-isolation-and-performance-budget.md first,\n` +
        `with a reason.`,
    );
  }

  if (lcpFailed || missing.length > 0) process.exit(1);
  console.log('\nLCP Path budget ok. Beacon on the wire.');
} catch (err) {
  console.error(`\nCould not evaluate the LCP Path budget.\n${err.message}`);
  process.exit(1);
}
