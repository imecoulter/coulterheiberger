---
status: accepted
date: 2026-09-02
---

# The sitemap carries no `lastmod`

**Related to** [ADR-0012](./0012-the-identity-graph-has-one-anchor.md), decided in the same pass.

## Context

`@astrojs/sitemap` emits eight bare `<loc>` entries and no dates. `lastmod` is the conventional next
addition, it is a real crawl-scheduling signal, and its absence is the first thing any SEO audit
flags.

Google's stated position is the part that matters: it uses `lastmod` **when a site's values are
consistently accurate**, and discounts or ignores the signal for sites where they are not. It is not
a field that is free to be approximately right.

The Project schema has `year` — an int, display-only, and explicitly never the sort key
(`content-architecture.md` §2). It is not a modification date.

## Decision

No `lastmod`. The sitemap continues to emit `<loc>` only.

## Why the two ways of getting one are both worse than not having it

**Author it — an `updated` field on the Project schema.** This adds a frontmatter field that no page
renders, which the governing rule in `content-architecture.md` forbids outright, and the same rule
ADR-0012 took seriously enough to reopen a refusal over. It is also a field a human must remember to
bump on every edit. The failure is silent and one-directional: forget it once and the sitemap
asserts a date that is wrong, and it stays wrong. A date nobody maintains is not a weaker signal
than no date; it is the "inconsistently accurate" case Google says it discounts.

**Derive it — git commit time per content file.** Superficially the better answer, because it cannot
be forgotten. It is worse, because it cannot be *withheld*. Fixing a typo in a Project's prose would
stamp a new modification date and tell a crawler the work changed. The signal exists to answer "is
there something new here worth recrawling", and a derivation that cannot distinguish a corrected
comma from a new Frame answers it wrongly on every commit. The high-frequency edit on this site is
prose polish, so the derived value would be wrong more often than right.

Nothing available produces an accurate date, and an inaccurate one is worth less than none.

## Consequences

- Eight static URLs on a site that publishes a few times a year are discovered and recrawled without
  it. There is no problem here that `lastmod` solves.
- If the Build Log ships (`content-architecture.md` §3), reopen this. A log has genuine publication
  and revision dates that a page renders, which is the condition that fails today — and the entries
  would be numerous and dated enough for the signal to do work.
- **Do not "fix" this by adding a build-time `new Date()`.** It would mark all eight URLs as modified
  on every deploy, including deploys that changed only CSS. That is the inaccurate case at its worst:
  maximally confident, uniformly wrong.
