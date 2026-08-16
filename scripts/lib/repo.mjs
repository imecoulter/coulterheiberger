/**
 * Path resolution shared by the asset delivery commands.
 *
 * The two paths resolve against different things on purpose. Content is written
 * into the CURRENT worktree, so the commands behave sensibly from an agent
 * worktree (.gitignore ignores .claude/worktrees/, so those exist). Masters live
 * in `.render-drop/`, a sibling of the MAIN working tree and outside the
 * repository — see AGENTS.md and docs/asset-delivery.md §1 — so a naive
 * `../.render-drop` would resolve wrong from anywhere but a top-level checkout.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

/** The current worktree's root. Content is written here. */
export function repoRoot() {
  return git('rev-parse', '--show-toplevel');
}

/**
 * `.render-drop/`, anchored to the main checkout regardless of which worktree
 * this runs from. `--git-common-dir` is the main `.git`, even inside a worktree.
 */
export function renderDropDir() {
  if (process.env.RENDER_DROP) return process.env.RENDER_DROP;
  const commonDir = git('rev-parse', '--path-format=absolute', '--git-common-dir');
  return join(dirname(dirname(commonDir)), '.render-drop');
}

/**
 * The slug is the public URL segment, the collection entry id, and — since
 * issue #31 — the tail of the Carry's `view-transition-name` (`plate-<slug>`).
 *
 * The LEADING LETTER is what that third use added. A CSS `<custom-ident>` may
 * not begin with a digit, and an invalid one fails as *no transition*: nothing
 * throws, nothing logs, the Carry just doesn't happen on that Project. The
 * pattern previously allowed `2024-tower`, which is a fine URL and a broken
 * ident. See docs/content-architecture.md §2 and docs/styling.md.
 */
export const SLUG_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export function assertSlug(slug, command) {
  if (!slug) {
    console.error(
      `${command} — no slug.\n\n  npm run ${command} <slug>\n\n` +
        `The slug is the Project's folder name, its collection id, and its public\n` +
        `URL segment (/projects/<slug>/). See docs/content-architecture.md §2.`,
    );
    process.exit(1);
  }
  if (!SLUG_RE.test(slug)) {
    console.error(
      `${command} — "${slug}" is not a usable slug.\n` +
        `Must start with a lowercase letter, then lowercase letters, digits and\n` +
        `single interior hyphens. It becomes a public URL and a CSS custom-ident.`,
    );
    process.exit(1);
  }
  return slug;
}

/**
 * The six-field frontmatter block, read without a YAML parser. `assets` never
 * round-trips MDX (docs/asset-delivery.md §3), so nothing here needs to write
 * YAML back — this only reads scalars and `alt:` lines.
 */
export function frontmatter(mdx) {
  const match = mdx.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const body = match[1];
  const scalar = (field) => {
    const m = body.match(new RegExp(`^${field}:[ \\t]*(.*)$`, 'm'));
    if (!m) return undefined;
    return m[1].trim().replace(/^(['"])([\s\S]*)\1$/, '$2');
  };
  return {
    raw: body,
    get: scalar,
    alts: [...body.matchAll(/^\s*alt:[ \t]*(.*)$/gm)].map((m) =>
      m[1].trim().replace(/^(['"])([\s\S]*)\1$/, '$2'),
    ),
  };
}
