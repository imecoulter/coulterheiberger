# Content architecture: routes, collections, and the Project schema

What the site's pages are, what a Project is, and how content collections are structured.

Decided in [issue #8](https://github.com/imecoulter/coulterheiberger-com/issues/8), on constraints handed
over from [#6](https://github.com/imecoulter/coulterheiberger-com/issues/6). This document is binding on
the page build and on the asset tooling ([#17](https://github.com/imecoulter/coulterheiberger-com/issues/17)),
which scaffolds the frontmatter specified here.

The governing rule, applied throughout: **if no page renders a field, the field does not exist.** Most of
§4 is the list of fields that failed that test.

---

## 1. Routes

| Route | What it is |
| --- | --- |
| `/` | **The Project index itself.** A positioning line, then every Project |
| `/projects/<slug>/` | Project detail |
| `/about/` | Bio, experience, capabilities, location, contact — one page |
| `/404` | Keeps its `noindex` |
| `/log/`, `/log/<slug>/` | Build Log. Shape decided in §3, **not built** |

`/projects/` has no page of its own. Send it to `/` via Astro's `redirects` config rather than letting it
404 — people truncate URLs.

**The vocabulary is not incidental.** `CONTEXT.md` defines **Project** and lists `work` under `_Avoid_`,
so the path segment is `projects`. URLs are the most expensive thing in this document to change — once
indexed they need 301s indefinitely — so they follow the glossary exactly.

### Why `/` is the index, and not a landing page in front of one

At the scale this site will run at (~3–8 Projects), a curated home grid and a full index render **the same
list**. Keeping them as separate routes invents a `featured` flag to serve a distinction that does not
exist, and a landing page in front of a portfolio is a doormat. The work is the first thing.

### Why `/about/` is one page

Bio, experience, capabilities, location, and contact are one document about one person. Split across five
routes they become five thin pages competing for the same visitor. Contact in particular is not a route.

**`location` is listed here and rendered nowhere yet.** Nothing in the repo states a location, and the
governing rule at the top of this file says a field nobody renders does not exist — so there is no
`location` in any schema and no `address` in the Person graph on `/`. Both land when `/about/` does.
Whoever builds that page: this is the line that says the field is wanted.

### Contact: `mailto:` and a LinkedIn link, no form

Decided in [issue #34](https://github.com/imecoulter/coulterheiberger-com/issues/34). Contact is
`src/components/Footer.astro` on every page — the address, and one text link to LinkedIn carrying
`rel="me"` to pair with the Person graph's `sameAs` on `/`. **No contact form at v1.** There are no real
Projects yet, so a form would optimise a funnel with nothing at the top of it.

Two arguments that get made for this decision are wrong, and are written down here so they are not made
again:

1. **A form would not reopen [ADR-0001](./adr/0001-astro-static-on-cloudflare-workers.md), and claiming it
   would is the weakest argument in favour of `mailto:`, not the strongest.** Verified against live
   Cloudflare docs: adding `"main": "./worker/index.ts"` and `"run_worker_first": ["/api/*"]` to the
   existing `assets` block in `wrangler.jsonc` runs a Worker on one path while every other request is
   served by static assets — **no Astro adapter, no change to `output: 'static'`**. ADR-0001 already wrote
   the clause ("Anything genuinely dynamic later becomes an explicit Worker route"), so doing this
   *executes* the ADR rather than reopening it. The honest cost of a form is spam handling, JS payload and
   maintenance. Argue it on those.
2. **`mailto:` is not "zero spam surface."** The address ships in plaintext twice per render — the
   `<a href="mailto:">` and the JSON-LD `email` field — in a public repo on an indexable page. That is
   accepted deliberately. The real argument is that **spam is handled at a mail layer that already exists,
   at zero bytes**: the address sits on Cloudflare Email Routing, so the mitigation is rotating an alias,
   not building anything.

**The revisit trigger is one inbound LinkedIn connection request or InMail from a stranger that reads as a
work enquiry.** One, not two: someone who routes around a published address onto a channel that costs them
*more* effort has demonstrated the form hypothesis rather than merely matched it.
[#33](https://github.com/imecoulter/coulterheiberger-com/issues/33) is explicitly **not** the instrument —
analytics cannot observe an enquiry that was never sent, and a tripwire that cannot fire is a permanent
decision in a temporary costume.

Also decided and deliberately absent, so none of these reads as an oversight: **no phone number** (robocall
bait, and unlike the address it cannot be rotated behind Email Routing); **no availability status** (wrong
the moment he is busy, and stale reads worse than absent); **no Instagram / ArtStation / Behance / X** (a
link list's credibility is set by its weakest entry); **GitHub deferred** until the Build Log ships and
gives it a reason to exist.

---

## 2. The Project collection

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/index.mdx' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      summary: z.string().min(1).max(200),
      credit: z.string().min(1),
      year: z.number().int(),
      order: z.number().int(),
      images: z
        .array(
          z.object({
            src: image(),
            alt: z.string().min(1),
          }),
        )
        .min(1),
    }),
});
```

Six fields. Every one is required, and every one is rendered by a page.

| Field | Rendered by | Notes |
| --- | --- | --- |
| `title` | index card, detail `<h1>`, `<title>` | |
| `summary` | index card, detail intro, `<meta name="description">` | `max(200)` is a **guard**, not a target — meta descriptions truncate around 155 |
| `credit` | detail fact block | See below. Required on purpose |
| `year` | index card, detail fact block | Display only. Not the sort key |
| `order` | index sort, ascending | Curation, not chronology |
| `images` | detail gallery; `images[0]` on the index card | `images[0]` **is** the hero — there is no separate hero field |

### `credit` is required, and it is one line

`credit` is the Project's **provenance**: where the work was done and for whom.

```yaml
credit: Made at Kilograph for Foster + Partners
credit: Made at Kilograph
credit: Speculative study
```

There is no `client` field and no `studio` field, because "client" is ambiguous here in a way that matters.
Work made as an employee of a studio, for *that studio's* client, involves three parties. A bare
`client: Foster + Partners` on such a Project reads as a direct commission — the difference between an
accurate portfolio and a misleading one, and exactly the error an art director notices.

Free text because the real cases don't fit a union: some end clients are nameable and some are not, some
studios have folded, some work was for an internal pitch.

**Required is the load-bearing part.** An optional attribution is the one you forget on the Project you were
in a hurry about, which is the Project where forgetting matters. Required means the build refuses to compile
until provenance has been stated out loud — the same instinct as `alt: z.string().min(1)` and the CI image
checks in `docs/asset-delivery.md`: put the honest answer on a rail instead of in your memory.

### `images` is an ordered list, not named roles

One entry per camera, matching the export preset — hero, grid thumbnail, and gallery are the **same file**
cropped at build time, never separate exports. Order and role live here, never in filenames. Promoting a
different image to hero is a one-line reorder.

`alt: z.string().min(1)` is not stylistic. The `assets` command scaffolds `alt: ''` stubs, so a plain
`z.string()` would let an unwritten stub ship an empty `alt`. `min(1)` turns that into a build failure.

### Entry layout and ids

```
src/content/projects/
└── riverside-tower/
    ├── index.mdx
    ├── north-dusk.jpg
    └── interior-atrium.jpg
```

The entry id is **`riverside-tower`** — Astro strips the trailing `/index` when generating ids
(`astro/dist/content/utils.js`, verified by build). No `generateId` override, no frontmatter `slug`.
Images are referenced as `./north-dusk.jpg`, relative to `index.mdx`, resolved by the `image()` helper.

---

## 3. The Build Log collection — decided, not built

Specified now so it drops in without a migration. Do not build it.

```ts
const log = defineCollection({
  loader: glob({ base: './src/content/log', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1).max(200),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
  }),
});
```

- **Flat `<slug>.mdx` files, not folders.** A Build Log post usually has no colocated images.
- **`/log/<slug>/`. No date in the URL** — a date in a permalink ages the writing and pins a mistake.
- **Sorted by `published` descending.** No `order` field: unlike Projects, chronology *is* the curation.
- The pattern `**/*.mdx` deliberately matches both `<slug>.mdx` and `<slug>/index.mdx`. Since Astro strips
  the trailing `/index`, **a post that later grows colocated images can become a folder with no URL change.**
- No `reference()` to Projects. No page renders that relation.

---

## 4. What was cut, and why

Each of these was on the table and failed the "name the page that renders it" test.

| Cut | Why |
| --- | --- |
| `featured` | `/` *is* the index. One list, so there is no second list to be featured onto |
| `client`, `studio` | Replaced by `credit` (§2) |
| `role` | Cut *because* it matters. "Full CG, six exteriors and an interior" is never a clean enum — it is a sentence, and it belongs in `summary` where it gets written well. A metadata row makes you write it badly |
| `location`, `discipline` | Interesting only when the building is famous. Writable in `summary` |
| `tags` / taxonomy | Needs a page that filters. At ~3–8 Projects on one index, there is nothing to filter |
| `related` / `reference()` | Verified to work, but "related Projects" across ~5 entries is a link to the index |
| per-image `caption` | The detail page is image-led. No page renders captions |
| frontmatter `slug` override | The folder name is the slug. Two sources of truth for a URL is one too many |
| `draft` | See §5 |

---

## 5. Conventions

**Draft handling: the branch is the mechanism.** There is no `draft` field. `docs/asset-delivery.md`'s
ritual already goes branch → PR → merge, so an unfinished Project simply is not on `main`. A `draft: true`
that ships to `main` is a redundant second mechanism whose classic failure is a draft leaking to production
because one query filtered on `import.meta.env.PROD` and another did not.

**Scaffold Projects live on `main`.** With no real Projects yet, ~3 placeholder entries belong on `main` so
that the design work, the perf gate, and preview deploys all run against realistically-shaped content
instead of an empty grid.

### Indexability — two switches, not one

This was originally written as a single switch ("replace the scaffold folders, then remove `noindex`"),
which conflated two moves that happen at different times. They are separate:

**1. Placeholder live — done.** `/` is indexable. This is safe *specifically because no route renders a
Project*: the scaffolds are unreachable, absent from the sitemap, and invisible to a crawler. What gets indexed is one honest page that says the portfolio is in progress, which is worth having
crawled and canonicalised early rather than on launch day.

**2. v1 launched — not yet.** Replacing the three scaffold folders with real Projects and shipping
`/projects/<slug>/`. **The moment a route renders a Project, indexability becomes load-bearing again** —
scaffold content would go from unreachable to crawlable in the same commit that adds the route. Whoever
builds those pages replaces the scaffolds in the same change, or gives the route a temporary `noindex`.

`noindex` is now **opt-in per page** (`Base.astro` defaults it to `false`), because a launched site whose
pages default to invisible is a trap. `/404` is the only page that sets it, permanently.

This switch had never actually worked. `Base.astro` carried an unconditional `noindex` *in addition to* the
conditional prop, so removing the prop from a page changed nothing — the mechanism
[#14](https://github.com/imecoulter/coulterheiberger-com/issues/14) documented was a no-op from the day it
was written, and both live pages served two `robots` tags. Found by audit, not by the tickets.

**MDX for Projects, `.astro` for everything else.** `@astrojs/mdx` is build-time only and adds zero client
JS, so it costs the LCP Path nothing, and the case-study Projects that arrive later will want embedded
components. One real cost: MDX parses JSX, so a bare `<` or `{` in body prose is a build error rather than a
character.

**The About page is `src/pages/about.mdx`** with a layout in frontmatter — not a collection, and not an
`.astro` page. A single non-repeating document in a collection means a loader, a schema, and a `render()`
call to serve one entry. Astro renders `.mdx` as a page directly.

**No CMS, confirmed against the real shape.** Six flat fields and one array, in three files, with one
author, no editorial workflow, and no publishing calendar. A CMS here would exist to edit six fields.

---

## Verified mechanics

Built and run against this repo's real dependency graph — astro 7.2.0, @astrojs/mdx 7.0.5 — not read from
documentation.

| Claim | Result |
| --- | --- |
| `<slug>/index.mdx` under `base: './src/content/projects'` → id `<slug>` | Confirmed. `utils.js` applies `.replace(/\/index$/, '')` |
| `image()` resolves inside `z.array(z.object({...}))` | **Confirmed** — nested image references fully resolve to `{ src, width, height, format }`. This is what makes §2's `images` shape possible |
| `image()` resolves paths relative to a content file colocated in `src/content/<collection>/<slug>/` | Confirmed |
| `reference()` self-reference resolves via `getEntry` | Confirmed (then cut — see §4) |
| `render(entry)` on MDX | Confirmed |
| MDX needs a separate integration | Confirmed. `@astrojs/mdx`, build-time only |
