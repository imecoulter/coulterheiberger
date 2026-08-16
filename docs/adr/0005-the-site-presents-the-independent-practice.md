---
status: accepted
date: 2026-08-16
---

# The site presents the independent practice; the canonical role is Technical Artist

This site is the portfolio of **one independent practice**, running since August 2022. Everything on it
— the copy, the structured data, the Social Card, the Projects — presents that practice and nothing
else. The canonical way to name the person doing the work is **Technical Artist**.

Decided while building the Social Card ([#32](https://github.com/imecoulter/coulterheiberger-com/issues/32)),
because a card is a display line with nowhere to hide: it forced the question of what the site says the
work *is*.

## The rules

**The display line is `Technical Artist`.** It is the `<h1>`'s subtitle on `/`, the `jobTitle` in the
Person graph, the `og:image:alt` on the site-wide Social Card, and the phrase any future About page
leads with. It is not qualified in place — no "Technical Artist / Architectural Visualization", no
parenthetical, no hyphenated hybrid.

**Qualifiers live on spec lines, never on the display line.** The design direction already has the
mechanism: every plate carries a specification line, and the site's argument is that the line is the
only thing that differs between one piece of work and the next
([docs/design-direction.md](../design-direction.md)). So the range of the work is stated there —
`TECHNICAL ARTIST · REAL-TIME 3D · GEOSPATIAL PIPELINES` — where it reads as scope rather than as a
job title that could not decide what it was.

**The site is not framed as architectural visualization.** Not in `AGENTS.md`, not in `CONTEXT.md`,
not in page copy, not in a meta description. Architectural work is welcome *as a Project*; it is not
the category the site belongs to. A portfolio that names a single vertical in its title inherits that
vertical's ceiling, and this practice is broader than one — terrain, architecture, simulation,
interactive systems.

**`worksFor` and `affiliation` are never added to the Person graph.** They are the obvious next
schema.org enrichment and they are wrong here: the entity this site describes is the independent
practice, and an organization edge would assert something the site does not claim. The rule is stated
in an inline comment beside the graph in `src/pages/index.astro` as well, because that is where
someone will be standing when they think of adding one.

**Employment work is out of scope for the Project collection.** `credit` stays required and unchanged
([docs/content-architecture.md](../content-architecture.md) §2) — every Project states where the work
was done and for whom. There is no tension between a required provenance field and this ADR, because
the resolution is **scope, not omission**: what goes on the site is the independent practice's work,
and that work's provenance is stated in full. Work done for an employer does not appear here at all,
so there is nothing for `credit` to be evasive about.

## Why this is an ADR and not a copy edit

The strings are four lines. The reason they need a record is that **the surrounding documents argue
against them.** `docs/design-direction.md` and `docs/research/typography-lcp-path.md` are full of
architectural-visualization precedent analysis, because that is the precedent set the design was
differentiated from — and `docs/adr/0001` opens by describing the site in those terms, correctly, as
of the day it was written.

A future agent reading those and finding `Technical Artist` beside them has every reason to conclude
it is a mistake and helpfully "correct" it. This ADR is what makes that a decision to be reopened
rather than an inconsistency to be tidied. `AGENTS.md` points at it from the binding constraints for
the same reason.

## Consequences

- **ADR-0001 line 8 is left as written.** It describes the site as an architectural visualization
  portfolio, which is what was decided on 2026-08-10. Rewriting a superseded ADR to agree with a later
  one is how ADRs stop being trustworthy; this document supersedes that framing, and the record of
  both is the point.
- **The `archviz` references in `docs/design-direction.md` and `docs/research/typography-lcp-path.md`
  are also left alone.** They describe the precedent set, not the practice.
- **`CONTEXT.md`'s definition of Project is discipline-neutral** — "a single piece of work presented
  on the site: a real-time system, a rendered sequence, an interactive build." A definition that named
  a discipline would quietly re-impose the framing this ADR removes.
- **The site-wide Social Card bakes this in.** It is a committed raster
  (`src/assets/social-card.jpg`), so changing the positioning means regenerating it with
  `scripts/dev/build-social-card.mjs`. That is deliberate friction on a line that should not drift.
