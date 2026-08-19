#!/usr/bin/env node
/**
 * Produces the two woff2 committed under `src/fonts/`.
 *
 * The shipped fonts are binaries in git, so they need a reproducible build step
 * or nobody can ever regenerate them with confidence. This is that step. It is a
 * LOCAL dev tool — `.github/workflows/deploy.yml` is Node-only and never runs
 * it; the committed woff2 is the artifact CI consumes.
 *
 * Trimmed from the issue #21 measurement harness
 * (`scripts/research/subset-fonts.mjs` on branch `research/typography-lcp-path`),
 * which built a full byte ladder across four families. This builds only what
 * ships. Every number and every flag below was decided there — see
 * `docs/research/typography-lcp-path.md`.
 *
 * ## Setup
 *
 *   python -m venv .venv-fonts
 *   .venv-fonts/Scripts/pip install fonttools brotli   # brotli: --flavor=woff2
 *
 * Sources are the variable TTFs from github.com/google/fonts (`ofl/montserrat`,
 * `ofl/jetbrainsmono`). They are NOT committed — only the subsets are.
 *
 * ## Run
 *
 *   PYTHON=.venv-fonts/Scripts/python.exe FONT_SRC=<dir> node scripts/dev/subset-fonts.mjs
 *
 * ## Why each flag
 *
 * `--name-IDs+=13,14` — pyftsubset's default is [0,1,2,3,4,5,6]: it keeps the
 *   copyright (0) and DROPS the licence (13) and licence URL (14). OFL 1.1
 *   clause 2 requires every copy to carry the notice *and* the licence, so the
 *   obvious command ships a file that violates its own licence. Costs 116 B.
 *   Asserted after the fact by `verifyNames()` below, because this is exactly
 *   the kind of silent omission nobody notices for a year.
 *
 * `--instancer` — static instances, not variable. Issue #21 measured variable at
 *   6.5x the static cut for an axis this design never travels.
 *
 * `--layout-features` for mono is `kern` ONLY, which drops GSUB entirely. That
 *   is deliberate: JetBrains Mono's coding ligatures are 74% of the file, and a
 *   specification line must never turn `->` into an arrow.
 *
 * `tnum` is absent on purpose. Issue #21 §6 proved the global `tabular-nums`
 *   was a no-op across this stack, and `src/styles/base.css` no longer sets it.
 *   Do not add `+tnum` here expecting tabular figures without first verifying by
 *   RENDERING — a subset keeps the feature record and loses its substitution
 *   targets, so the font reports the feature and does nothing.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from '../lib/repo.mjs';

const PYTHON = process.env.PYTHON ?? '.venv-fonts/Scripts/python.exe';
const FONT_SRC = process.env.FONT_SRC ?? './fonts-src';
const OUT_DIR = join(repoRoot(), 'src', 'fonts');

// ---- charsets -------------------------------------------------------------

/**
 * The production repertoire for the display role.
 *
 * NOT the glyphs the site currently sets. Issue #21's audit found 14-19 of them,
 * because the site is a placeholder home and three scaffold Projects; cutting to
 * that would mean every new sentence of copy falls back mid-word. This set is
 * fixed and chosen to survive ordinary English copy. The audit decided WEIGHTS
 * and FEATURES, never the charset.
 *
 * U+00B7 is in here because the specification line is `Cycles · 3200 px · 41 min`
 * and it is the single easiest glyph on this site to subset out by accident.
 */
const SITE =
  'U+0020-007E,' + // basic latin
  'U+00A0,' + // nbsp
  'U+00A9,U+00B0,U+00B7,U+00D7,' + // © ° · ×
  'U+00E0-00FF,' + // accented lowercase, for names and place names
  'U+2010-2015,' + // hyphens and dashes
  'U+2018-201A,U+201C-201E,' + // curly quotes
  'U+2020-2021,U+2026,' + // dagger, ellipsis
  'U+2032-2033,' + // prime, double prime — feet/inches on a spec line
  'U+20AC,U+2122';

/**
 * Mono. `.t-label` and `.t-spec` carry `text-transform: uppercase`
 * (`src/styles/base.css`), so for those two roles lowercase is never drawn.
 *
 * Issue #21 §6 verified in a browser that `unicode-range` is matched against the
 * POST-`text-transform` codepoints, so an uppercase-only cut is safe from silent
 * fallback. That was the suspected trap; it is not one.
 *
 * LOWERCASE IS IN THE CUT ANYWAY, and #21's own note above is why. It called the
 * home page's `ime@coulterheiberger.com` "the live case" and wrote it in
 * lowercase — while shipping a subset that could not draw a single letter of it.
 * The uppercase-only decision was made for the label role and never re-checked
 * against the one line that is an address rather than a phrase. `text-transform`
 * safety is not the same as having the glyphs: with the transform switched off,
 * `@` and `.` came from JetBrains Mono and every letter fell back to Consolas.
 *
 * Costs 1,208 B (4,020 -> 5,228), which is 0.24% of the 500 KB ceiling and is
 * not what decided it. The real cost is that the subset no longer ENFORCES mono
 * as an uppercase face — that rule now lives only in the role classes, so a new
 * lowercase mono line will render happily instead of falling back and telling
 * you. Check base.css before adding one.
 *
 * THAT LINE IS GONE AND THIS RANGE NOW HAS NO CONSUMER. Owner review put the
 * footer address back into caps so that it matches the LinkedIn link beside it,
 * which returns mono to being an uppercase-only face everywhere. Nothing on the
 * site can reach a lowercase mono glyph any more.
 *
 * Drop `U+0061-007A` on the next regeneration and take the 1,208 B back off the
 * LCP Path. It is still here only because regenerating needs FONT_SRC and the
 * upstream files are deliberately not committed, so removing it is a job for
 * whoever next has them rather than a one-line edit. Doing so also restores the
 * enforcement above: a lowercase mono line would once again fall back visibly
 * instead of rendering as though it were intended.
 */
const MONO_SPEC =
  'U+0020-0040,' + // space, digits, and ASCII punctuation up to @
  'U+0041-005A,' + // A-Z
  'U+005B-0060,' +
  'U+0061-007A,' + // a-z — for the email address, not for the label roles
  'U+007B-007E,' +
  'U+00A0,U+00B0,U+00B7,U+00D7,' +
  'U+2010-2015,U+2018-2019,U+201C-201D,U+2026,U+2032-2033';

// ---- what ships -----------------------------------------------------------

/**
 * Weights are what issue #21's browser audit found actually resolves, not what
 * the prototype claimed:
 *
 *   display — 500 only. `h1-h3`; `.t-display` was deleted when the type scale
 *             was capped at six styles. Nothing reaches 400 or 600.
 *   mono    — 500 only, since `.t-spec` was given `font-weight: 500` to match
 *             `.t-label`. That one line collapsed mono from two files to one,
 *             for -3,956 B.
 *
 * Archivo is kept buildable but not shipped. It was #10's prototype stand-in and
 * the runner-up in the display decision, 944 B cheaper than Montserrat; if the
 * direction ever wants it back, add it to SHIP and change two font-family
 * declarations. Leaving the recipe here is what makes that a five-minute change.
 */
const FAMILIES = {
  montserrat: {
    role: 'display',
    src: 'Montserrat[wght].ttf',
    family: 'Montserrat',
    out: 'montserrat-wght500-site-trimmed.woff2',
    instance: 'wght=500',
    unicodes: SITE,
    layoutFeatures: 'ccmp,kern,liga,locl,mark,mkmk',
  },
  archivo: {
    role: 'display (not shipped)',
    src: 'Archivo[wdth,wght].ttf',
    family: 'Archivo',
    out: 'archivo-wght500-site-trimmed.woff2',
    instance: 'wdth=100,wght=500',
    unicodes: SITE,
    layoutFeatures: 'ccmp,kern,liga,locl,mark,mkmk',
  },
  jetbrainsmono: {
    role: 'mono',
    src: 'JetBrainsMono[wght].ttf',
    family: 'JetBrains Mono',
    out: 'jetbrainsmono-wght500-mono-spec-no-liga.woff2',
    instance: 'wght=500',
    unicodes: MONO_SPEC,
    layoutFeatures: 'kern',
  },
};

const SHIP = ['montserrat', 'jetbrainsmono'];

// ---- build ----------------------------------------------------------------

/**
 * Two steps, deliberately: pin the axes with `fontTools.varLib.instancer`, then
 * subset the resulting static TTF.
 *
 * `fontTools.subset` has no `--instancer` option — verified against 4.63.0,
 * which rejects it outright ("Unknown option"). Several write-ups claim
 * otherwise. Doing it in two passes works on every version and makes the pin
 * explicit, so this is the only path rather than a fallback.
 */
function subset({ input, output, unicodes, layoutFeatures, instance }) {
  const pinned = `${output}.instance.ttf`;
  try {
    execFileSync(
      PYTHON,
      [
        '-m',
        'fontTools.varLib.instancer',
        input,
        ...instance.split(','),
        // Without this the pinned file keeps the variable font's DEFAULT
        // instance name — Montserrat's default is wght=100, so a wght=500 pin
        // ships a file whose name table reads "Montserrat Thin" while its
        // usWeightClass reads 500. Nothing matches on the internal name (the
        // @font-face `font-family` does that), so it renders correctly either
        // way; it just lies to whoever opens the file next.
        '--update-name-table',
        // Without this the build is NOT REPRODUCIBLE, which is the entire
        // reason this script exists next to a committed binary. `instancer`
        // stamps head.modified with the current time by default; that value is
        // compressed into the woff2, so two runs on identical inputs differ by
        // a few bytes and there is no way to check the committed file came from
        // the committed script. Caught by regenerating for the lowercase change
        // and watching Montserrat move 9,628 -> 9,632 B on an unchanged charset.
        // `fontTools.subset` already defaults to no-recalc; only this step does.
        '--no-recalc-timestamp',
        '-o',
        pinned,
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    );
    execFileSync(
      PYTHON,
      [
        '-m',
        'fontTools.subset',
        pinned,
        `--output-file=${output}`,
        `--unicodes=${unicodes}`,
        `--layout-features=${layoutFeatures}`,
        '--flavor=woff2',
        '--no-hinting',
        '--desubroutinize',
        '--name-IDs+=13,14',
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    );
  } finally {
    rmSync(pinned, { force: true });
  }
  return statSync(output).size;
}

/**
 * OFL clause 2 is satisfied by the licence travelling in the font's own name
 * table. Assert it rather than trust the flag: this is the one defect in this
 * file that would be both invisible and a licence violation.
 */
function verifyNames(output) {
  const script = [
    'import sys',
    'from fontTools.ttLib import TTFont',
    'f = TTFont(sys.argv[1])',
    'ids = {r.nameID for r in f["name"].names}',
    'missing = {0, 13, 14} - ids',
    'print("MISSING:" + ",".join(str(i) for i in sorted(missing)) if missing else "OK")',
  ].join('\n');
  const out = execFileSync(PYTHON, ['-c', script, output], { encoding: 'utf8' }).trim();
  if (out !== 'OK') {
    throw new Error(
      `${output}: name table is ${out}. IDs 0/13/14 are the copyright, licence and\n` +
        `licence URL. Without them the file breaks OFL 1.1 clause 2 — do not commit it.`,
    );
  }
}

mkdirSync(OUT_DIR, { recursive: true });

let total = 0;
for (const name of SHIP) {
  const f = FAMILIES[name];
  const input = join(FONT_SRC, f.src);
  const output = join(OUT_DIR, f.out);
  rmSync(output, { force: true });

  const size = subset({ input, output, ...f });
  verifyNames(output);
  total += size;

  const from = statSync(input).size;
  console.log(
    `${f.family.padEnd(16)} ${f.role.padEnd(8)} ${String(size).padStart(6)} B  ` +
      `(from ${(from / 1024).toFixed(0)} KB source, ${(from / size).toFixed(0)}x)  ${f.out}`,
  );
}

console.log(`\n${SHIP.length} files, ${total} B on the wire. Licence name records verified.`);
