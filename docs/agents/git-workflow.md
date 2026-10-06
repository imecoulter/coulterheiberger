# Git workflow

Read this before creating a branch or committing anything.

**Never work in the primary checkout on `main`.** Every branch gets its own worktree, and the primary checkout stays on a clean `main`, pullable at all times — so a half-finished change never sits on it, two agents can work at once without colliding, and "what is on `main`" is always answerable without stashing.

Worktrees live in `.claude/worktrees/<name>` and nowhere else — where Claude Code's own worktree tooling puts them, and gitignored. `<name>` is the branch's last path segment.

```sh
git worktree add .claude/worktrees/<name> -b <branch>   # new branch
git worktree add .claude/worktrees/<name> <branch>      # existing branch
```

## Every branch ends in a pull request, and dies when it merges

Code, ADRs, docs and research findings all land on `main` by PR. Nothing ever links to a branch: research lives in `docs/research/`, and the issue links to the file on `main`.

## Definition of done

Locally, in this order — the order CI runs them:

```sh
npm run check:assets && npm run check && npm run build && npm run check:css && npm run check:structured-data
```

Asset spec, `astro check`, the static build, the design rules against the built CSS, and the Identity Graph against the built HTML. A check has passed only when you've seen its results.

PRs run `.github/workflows/deploy.yml`, which repeats those and adds `npm run budget` (Lighthouse, ~6 minutes, 15 runs across 5 URLs) and a preview deploy; **green** means that job passes, on top of the local run. Run the budget locally only when a change touches the LCP path.

## Landing a branch

1. Work in the worktree. Commit there.
2. Run the definition of done.
3. `gh pr create` from the worktree.
4. **Merge on green** with `gh pr merge --merge --delete-branch` — the repo doesn't delete head branches on its own. Never merge with a failing check. The merge deploys: `deploy.yml` ships `main` to production.
5. Run the sweep below from the repo root.

`/close` does steps 2–5 at the end of a session.

## Parallel waves

Two or more independent tickets run as one workflow (`/orchestrate`), each builder in its own worktree, stopping before merge; one `/close` lands the wave.

- **Worktree setup:** `npm ci` before the definition of done will pass. The asset scripts find `.render-drop/` through git's common dir, so the asset ritual works from a worktree too.
- **Hotspots** — tickets that touch the same one go in different waves: `src/pages/index.astro`, `src/layouts/Base.astro` (the one authored `<script>`), `src/styles/base.css` and `src/styles/tokens.css`.
- **Risky areas** (reviewed by an opus reviewer before landing): the gates themselves (`scripts/check-*.mjs`, `lighthouserc.cjs`, `deploy.yml`), because a weakened gate passes every later change, and the Identity Graph (`src/site.ts`, the `Person` node on `/`).

## The sweep

Run after every merge, and at the start of any session that pulls `main`:

```sh
# from the repo root, on main
git pull --prune
git worktree prune
for wt in .claude/worktrees/*/; do
  [ -e "$wt/.git" ] || { rmdir "$wt" 2>/dev/null; continue; }
  b=$(git -C "$wt" branch --show-current)
  git branch -vv | grep -q "^[+*] $b .*: gone]" && git worktree remove "$wt"
done
git branch -vv | awk '/: gone]/ { sub(/^[+*]/, ""); print $1 }' | xargs -r git branch -d
```

It only removes what is merged or already gone from the remote. Two refusals are the point, not errors to route around:

- **`git worktree remove` refuses a worktree with uncommitted changes.** Report it; never `--force`.
- **`git branch -d` refuses a branch not merged into `main`.** Report it; never `-D`.
