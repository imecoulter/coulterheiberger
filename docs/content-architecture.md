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
| `/about/` | Bio, experience, capabilities, contact — one page |
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

Bio, experience, capabilities, and contact are one document about one person. Split across four routes they
become four thin pages competing for the same visitor. Contact in particular is not a route: it is a
`mailto:` and nothing else.

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
instead of an empty grid. Both pages already carry `noindex`; launch is therefore **replace the scaffold
folders, then remove `noindex`** ([#14](https://github.com/imecoulter/coulterheiberger-com/issues/14)) — not
a switch someone flips over an empty site.

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
