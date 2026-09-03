---
status: accepted
date: 2026-09-02
---

# The Identity Graph has one anchor, and the Projects get the graph they were refused

**Reverses** a refusal recorded in `src/pages/index.astro` and
[`docs/content-architecture.md`](../content-architecture.md). **Constrained by**
[ADR-0005](./0005-the-site-presents-the-independent-practice.md), whose organization-edge refusal is
now enforced in CI rather than by comment. **Leaves standing**
[ADR-0011](./0011-the-masthead-is-site-furniture.md), which this decision was asked to overturn and
did not.

## Context

The site already ranks for the owner's name. The ask was to make that harder to lose.

The mechanism that does that is not keywords — it is **entity consolidation**: a search engine
merging the pages, profiles, and mentions it can prove describe one person, into one thing it has an
opinion about. What it needs to do that is an explicit, connected assertion of identity. What the
site had was a `Person` graph on `/`, one `sameAs` edge to LinkedIn, and eight other routes that
said nothing about who or what they were.

Two things stood in the way, both written down, both with reasons.

**The first was a refusal.** `index.astro` carried:

> There is deliberately no CreativeWork graph for the Projects below. No document asks for one, and
> the rule at the top of content-architecture.md cuts both ways: structured data nobody consumes is
> a second description of the page to keep in sync with the first.

That was correct when it was written, and the reason it was correct is precise: **no route rendered
a Project.** A graph would have been assembled from frontmatter fields that existed in a schema and
appeared on no screen — which is exactly the "second description" the governing rule forbids.

Six Project routes have since landed. `title`, `summary`, `year`, and the hero image are all now
rendered by the page itself. The condition the refusal tested for is no longer met.

**The second was a shape problem.** Adding a graph to six Project pages, each naming its own creator,
produces six unconnected people. That is worse than no graph: it takes an entity a crawler was
inferring correctly from one clean signal and hands it six competing ones.

## Decision

**One entity, defined once, referenced everywhere.**

`PERSON_ID` — `https://coulterheiberger.com/#person` — is a constant in `src/site.ts`. The `Person`
node stays whole on `/`, where it already was, and gains that `@id`. Every other graph on the site
references the id and restates nothing:

| Route | Graph | Edge to the anchor |
| --- | --- | --- |
| `/` | `Person` + `WebSite` in one `@graph` | defines it; `WebSite.publisher` → it |
| `/projects/<slug>/` | `CreativeWork` | `creator` → it |
| `/about/ime/` | `ProfilePage` | `mainEntity` → it |
| `/404` | none | — |

The Project graph carries `name`, `description`, `url`, `dateCreated`, `image`, and `creator`. It
carries **neither `spec` nor `credit`**, and that is a decision rather than an omission — see below.

A GitHub `sameAs` joins LinkedIn, and the Footer renders both with `rel="me"`.

`scripts/check-structured-data.mjs` asserts, over the built output, that every block parses, that
every `@id` reference resolves to a node defined somewhere in the build, and that no graph anywhere
carries `worksFor` or `affiliation`.

## Why the anchor is the load-bearing half

The `CreativeWork` graphs are the visible part of this change and the less important one. The `@id`
is what makes them worth having.

Without it, this change adds nine graphs that each independently assert a person, and a crawler's
job is to guess they are the same one — the same guess it was already making, now with more inputs
to disagree about. With it, there is one node and eight edges into it, and the guess is not required.

It also gives the site one place where a fact about the person is stated. `jobTitle` is on `/` and
nowhere else. ADR-0005 names the canonical role and calls a drift from it a defect; a design where
six pages each spell that string out is a design where five of them can be wrong.

## Why `/about/ime/` did not become the Person's home

It was considered and rejected. `/about/ime/` is the page whose prose actually describes the person,
so moving the `Person` node onto it is the intuitive arrangement.

Against it: `index.astro`'s existing comment says `url` "says which page is the practice's, and it
says this one", and that reasoning is still sound — the index is what the practice presents. Moving
the node would make that comment wrong and buy nothing, because no consumer treats a `Person`
differently for the page it was found on once it has an `@id`. `ProfilePage` with `mainEntity` says
what the About page is without claiming to be where the person is defined.

## Why `spec` and `credit` are not in the Project graph

The Specification Line is a toolchain. schema.org has no field that means that: `material` is about
physical substance, and mapping a toolchain onto it would be inventing a claim to fill a slot.

The Credit is provenance — where the work was done and for whom. Its only plausible field is
`sourceOrganization`, and that is an organization edge. ADR-0005 forbids those, and the reasoning
does not weaken because the edge hangs off a `CreativeWork` instead of the `Person`: the site
presents one independent practice, and a graph naming the studios behind individual Projects asserts
a shape of working relationship the site does not claim.

Both stay on the page, in prose, where they read correctly and commit to nothing.

## Why the Masthead `<h1>` was left alone

Every page's `<h1>` is `Coulter Heiberger` — wrapped in a link home on every route but `/` since
[#56](https://github.com/imecoulter/coulterheiberger/pull/56) — and a Project's own title is an
`<h2>`. Read as a document, `/projects/cecret/` is a page about Cecret whose top-level heading claims
to be about a person, and the conventional fix is to demote the Masthead on non-index routes.

Rejected. ADR-0011 makes the Masthead **site furniture** — one component, rendered by the shell,
identical on every route but for its eyebrow. Furniture that changes element type depending on which
page it lands on is not furniture, and the exception would have to be re-derived by every future
route.

The signal that fix is chasing — what is this page about — is now stated twice, in the two places
built for stating it. The `CreativeWork` graph says it to a machine. #56 landed the other half for a
reader while this work was in progress: the eyebrow that used to read `Project` now names the
Project, so `/projects/cecret/` says `CECRET` above the name. The heading was a proxy for both and a
poor one.

There is also a real if incidental benefit in the current arrangement: for a name query, eight pages
asserting the name as their top-level heading is not a problem to be solved.

## Consequences

- `PERSON_ID` is a contract. Four files touch it; changing the string dangles every reference, and
  in JSON-LD a dangling reference is well-formed and silently meaningless. That failure mode is the
  reason `check-structured-data.mjs` exists.
- ADR-0005's organization-edge refusal is now enforced. It was a comment saying "never add these",
  against a constraint `AGENTS.md` calls a defect to violate. `check-css.mjs` set the precedent of
  asserting refusals in CI; this follows it.
- The `sameAs` edges are only strong while they are reciprocal. Both profiles link back to the site
  today. If either profile's website field is cleared, the edge degrades to a one-way claim and
  nothing in this repo will report it.
- A seventh Project inherits all of this from the route. There is nothing per-Project to remember.
- **`og:type` is untouched.** It stays `website` everywhere, still waiting on `/log/` per
  `content-architecture.md` §6. A `CreativeWork` graph is not an argument for `article`.

## Alternatives rejected

**`VisualArtwork` instead of `CreativeWork`.** More specific, and its natural properties —
`artMedium`, `artform`, `surface` — are ones this content would leave empty or invent. No consumer
treats the subtype differently here. Precision that costs honesty and buys nothing.

**`ImageObject` per Project.** Describes the image rather than the work. Wrong subject: a Project is
a real-time system, not a picture of one.

**Nesting the full `Person` inside each `creator`.** The shape this ADR exists to avoid.

**Asserting the `Person` on both `/` and `/about/ime/`.** Two descriptions of one entity to keep in
sync — the failure `content-architecture.md`'s governing rule names.

**A `SearchAction` on the `WebSite` node.** The standard companion, and a lie: there is no site
search. A declared search endpoint is something Google will attempt to use.
