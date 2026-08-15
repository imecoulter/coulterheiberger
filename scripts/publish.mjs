#!/usr/bin/env node
/**
 * `npm run publish <slug>` — step 4 of the ritual in docs/asset-delivery.md §3.
 * Branch, commit, push, open the PR. It stops there.
 *
 * It stops there on purpose. Per-PR preview deploys (issue #9) make the PR the
 * first place a Project is visible on the real site, so `gh pr merge --auto`
 * would save one click and throw away the only proof step in the ritual.
 *
 * The pre-flight below is the other half of why `assets` and `publish` are two
 * commands rather than one: authoring happens between them, and an unfilled
 * stub is a guaranteed red build (title, summary, credit and alt are all
 * .min(1) — docs/content-architecture.md §2). Catching it here costs a second;
 * catching it in CI costs a round trip.
 *
 * See issue #17.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertSlug, frontmatter, repoRoot } from './lib/repo.mjs';

const slug = assertSlug(process.argv[2], 'publish');
const root = repoRoot();
// Forward slashes throughout: this path is passed to git and printed, and both
// want the same shape on every platform.
const dir = `src/content/projects/${slug}`;
const entry = join(root, dir, 'index.mdx');
const branch = `project/${slug}`;

function fail(message) {
  console.error(`publish — ${message}`);
  process.exit(1);
}

/** Inherits stdio so git's own progress and errors reach the operator. */
function run(cmd, args) {
  try {
    execFileSync(cmd, args, { cwd: root, stdio: 'inherit' });
  } catch {
    fail(`\`${cmd} ${args.join(' ')}\` failed. Nothing further was run.`);
  }
}

function capture(cmd, args) {
  return execFileSync(cmd, args, { cwd: root, encoding: 'utf8' }).trim();
}

// -------------------------------------------------------------------- checks
if (!existsSync(entry)) {
  fail(`no Project at ${dir}/index.mdx.\nRun \`npm run assets ${slug}\` first.`);
}

try {
  capture('gh', ['--version']);
} catch {
  fail('the `gh` CLI is not available, so the PR cannot be opened.');
}

const fm = frontmatter(readFileSync(entry, 'utf8'));
if (!fm) fail(`${dir}/index.mdx has no frontmatter block.`);

const title = fm.get('title');
const unfilled = ['title', 'summary', 'credit'].filter((f) => !fm.get(f));
const emptyAlts = fm.alts.filter((a) => !a).length;

if (unfilled.length || emptyAlts) {
  const parts = [...unfilled];
  if (emptyAlts) parts.push(`${emptyAlts} empty alt${emptyAlts > 1 ? 's' : ''}`);
  fail(
    `${dir}/index.mdx still has the stubs \`assets\` wrote: ${parts.join(', ')}.\n\n` +
      `Every one of those is .min(1) in the schema, so this would push a branch that\n` +
      `cannot build. Write them, then re-run. That gap is what the two commands are\n` +
      `for — docs/asset-delivery.md §3.`,
  );
}

if (capture('git', ['branch', '--list', branch])) {
  fail(`branch ${branch} already exists. Delete it or rename the Project.`);
}

// Everything outside the Project is reported, never swept into the commit.
const dirty = capture('git', ['status', '--porcelain', '--', '.'])
  .split('\n')
  .filter(Boolean)
  .map((l) => l.slice(3))
  .filter((f) => !f.startsWith(dir));

// --------------------------------------------------------------------- ship
run('git', ['switch', '-c', branch]);
run('git', ['add', '--', dir]);
run('git', ['commit', '-m', `Add Project: ${title} (${slug})`]);
run('git', ['push', '-u', 'origin', branch]);

const images = fm.raw.match(/^\s*- src: \.\/(.+)$/gm)?.map((l) => l.trim().replace('- src: ./', '')) ?? [];

run('gh', [
  'pr',
  'create',
  '--base',
  'main',
  '--head',
  branch,
  '--title',
  `Add Project: ${title}`,
  '--body',
  `Adds the Project \`${slug}\`.\n\n` +
    images.map((i) => `- \`${i}\``).join('\n') +
    `\n\nProduced by \`npm run assets ${slug}\`, so the images are already at the ` +
    `docs/asset-delivery.md §2 spec — CI re-checks that on \`Asset spec\`.\n\n` +
    `**Look at the preview deploy before merging.** It is the first place this ` +
    `Project appears on the real site, and it is the only proof step in the ` +
    `ritual (docs/asset-delivery.md §3, issue #9).\n`,
]);

if (dirty.length) {
  console.log(`\npublish — left uncommitted, outside the Project:\n  ${dirty.join('\n  ')}`);
}
console.log(`\npublish — ${branch} pushed and the PR is open. Nothing was merged.`);
