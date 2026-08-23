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
| `/` | **The Project index itself.** Every Project. The Masthead is above it, and above every other page too — see ADR-0011 |
| `/projects/<slug>/` | Project detail |
| `/about/ime/` | Bio, experience, capabilities, location, contact — one page |
| `/404` | Keeps its `noindex` |
| `/log/`, `/log/<slug>/` | Build Log. Shape decided in §3, **not built** |

`/projects/` has no page of its own. Send it to `/` rather than letting it 404 — people truncate URLs.
`/about/` and `/about` are the same case and get the same treatment, to `/about/ime/`.

### Why the About page is at `/about/ime/` and not `/about/`

This table said `/about/` until the page was built. **Owner call**, recorded here rather than applied
silently: `ime` is the practice's own namespace and it already exists in two places a visitor can
see — the contact address `ime@coulterheiberger.com` and the `rel="me"` pair it forms with the Person
graph (`src/site.ts`). The route makes that namespace a place rather than only an address.

The cost is real and it is the reason this needs writing down: **`ime` means nothing to someone who
has not read the address**, so the guessable URL is `/about/`, and a bare `/about/` that 404s is a
worse answer than either. Hence the two 301s above, both spellings, in `public/_redirects` beside the
`/projects/` pair and for the same reason — a person truncating a URL does not reliably stop on the
slash. **Exact paths, never a wildcard**: that file's header records what a `/projects/*` splat cost
and why no local check caught it.

`/about/ime/` is the canonical URL and the only one in the sitemap. Nothing links to `/about/`.

**It is `public/_redirects`, not Astro's `redirects` config.** This document said the opposite until the
Project routes were built, and the correction is recorded here rather than applied silently.

A static Astro build **cannot emit a 301**. `redirects` compiles to an HTML page carrying
`<meta http-equiv="refresh">` (`node_modules/astro/dist/core/routing/3xx.js`), which is a 200 with a
client-side hop: it costs a round trip, it passes no link equity, and — because `@astrojs/sitemap`'s
filter excludes only `/404/` — the redirect stub would be **listed in the sitemap as a canonical URL**.
Cloudflare serves `_redirects` natively from the static-asset directory, so the file is a real edge 301
at zero bytes. `public/` is copied verbatim into `dist/`, which is exactly the behaviour this needs and
the reason the file cannot live under `src/`.

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

**`location` has landed.** This paragraph used to say it was listed here and rendered nowhere, that
the governing rule at the top of this file therefore kept it out of every schema, and that it would
arrive with the About page. It has: `/about/ime/` states `Minneapolis, Minnesota`, and the Person
graph on `/` now carries the matching `address` as a `PostalAddress`.

It is still **not a frontmatter field anywhere**, and that is the point worth keeping. One page states
one location in prose. A `location` in the Project schema would be the version this file cut in §4,
for the reason given there.

`worksFor` and `affiliation` are unaffected by this and are still never added — see ADR-0005 and the
comment beside the graph in `src/pages/index.astro`. `address` says where the practice is; an
organization edge would say whose it is, which the site does not claim.

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
      spec: z.string().min(1),
      year: z.number().int(),
      order: z.number().int(),
      images: z
        .array(
          z.object({
            src: image(),
            alt: z.string().min(1),
            framing: z.enum([
              'centre', 'top', 'bottom', 'left', 'right',
              'left top', 'left bottom', 'right top', 'right bottom',
            ]),
          }),
        )
        .min(1),
    }),
});
```

(Abridged: the schema in `src/content.config.ts` carries a long comment on `framing` that is not
reproduced here.)

Seven fields. Every one is required, and every one is rendered by a page.

| Field | Rendered by | Notes |
| --- | --- | --- |
| `title` | index card, detail `<h1>`, `<title>` | |
| `summary` | index card, detail intro, `<meta name="description">` | `max(200)` is a **guard**, not a target — meta descriptions truncate around 155 |
| `credit` | detail fact block | See below. Required on purpose |
| `spec` | index metadata, detail fact block | The Specification Line. Free text, required, **authored not derived** — [ADR-0006](./adr/0006-the-specification-line-is-authored.md) |
| `year` | index card, detail fact block | Display only. Not the sort key |
| `order` | index sort, ascending | Curation, not chronology |
| `images` | detail gallery; `images[0]` on the index card | `images[0]` **is** the hero — there is no separate hero field, and it appears twice on the detail page: cropped at the top, then uncropped as the last Frame |
| `images[].framing` | every build-time crop, as sharp's `position` — **once the Project page lands** | Nine keywords, required per image. Knowingly the one field ahead of its page (issue #30): it cannot be derived from the file, so it is collected while someone is looking at the image. See `design-direction.md`, "Framing" |

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

### `spec` is the Specification Line, and it is not on the index by accident

`credit` and `spec` are the pair `CONTEXT.md` defines against each other — **provenance** and
**construction**. Both are required on every Project and they answer different questions.

They are not rendered in the same places. `spec` appears on **both** presentations, because
`docs/design-direction.md` is named after it: the specification line is the datum every piece of work is
measured against, and an index that showed it on only some Plates would have no datum. `credit` appears
**only** on the detail page. An index that states where every piece was made is an index about
employment, and the equivalence thesis is about the work.

Free text for `credit`'s exact reason: the real cases do not fit a union. The toolchains differ per
Project, one Project's honest answer is that it was made in everything *except* the engine, and the
set is open — a physical model is on one of these lines.

**It states the toolchain and stops there.** Resolution was on it and was cut in review: a viewer
judges an image by how sharp it looks, not by a number claiming it, and the number was a fact about a
master that never ships and that nothing could check. See the amendment on
[ADR-0006](./adr/0006-the-specification-line-is-authored.md), which the cut strengthens rather than
overturns. The known cost is that two Projects now read `UNREAL ENGINE` and nothing else; the fix for
that is a second tool on the line, not a number nobody can verify.

**Required is the load-bearing part**, again for `credit`'s reason — and see
[ADR-0006](./adr/0006-the-specification-line-is-authored.md) for why the build never computes it.

### `images` is an ordered list, not named roles

One entry per camera, matching the export preset — hero, grid thumbnail, and gallery are the **same file**
cropped at build time, never separate exports. Order and role live here, never in filenames. Promoting a
different image to hero is a one-line reorder.

**The hero is shown twice on the detail page, and the second one is the point.** The band at the top
is a 21:9 crop; the sequence closes with the whole image it was cut from. Last rather than first,
because first puts it directly under its own crop with only the prose between, which reads as the
image failing to load rather than as a sequence. So a Project with *n* images renders *n* Frames, not
*n − 1*, and a one-image Project is exactly its hero shown uncropped.

The `alt` string therefore appears twice on the page. That is accurate — it is the same picture, so
it is the same description — and `image-alt` checks presence, not uniqueness. Do not invent a second
alt for the uncropped one; a description that changes between two views of one image is a description
of the crop, which is not what alt text is for.

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

### The slug's shape is a contract, not a convention

`SLUG_RE` in `scripts/lib/repo.mjs` is the one definition: **a lowercase letter, then lowercase
letters, digits and single interior hyphens.** It is asserted by `npm run assets` and `npm run
publish` when they scaffold, and by `npm run check:assets` in CI over what is actually on disk — the
second gate exists because the first only sees folders the ritual created. A folder added by hand, or
renamed after scaffolding, reaches `main` otherwise unexamined.

Three separate things ride on that one string, which is why it is worth a gate:

- **The public URL segment.** This document already calls URLs the most expensive thing here to
  change: once indexed they need 301s indefinitely.
- **The collection entry id**, since the folder name *is* the id.
- **A CSS `<custom-ident>`**, which is the reason the pattern requires a **leading letter** rather
  than merely a leading alphanumeric: an ident may not begin with a digit. This use is **not shipped
  today** — it was `plate-<slug>`, the Carry's `view-transition-name`, and the Carry went with the
  rest of the motion substrate (`docs/motion.md`). The constraint is kept anyway, because it costs
  nothing now and relaxing it would mean a round of 301s the day that behaviour returns. It is also
  the failure mode worth remembering: an invalid ident is not an error, it is *no transition at
  all*, silently, on that one Project.

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
| per-image `kind` (process / finished) | Considered when the Project routes were built, and rejected. ~15 of the 47 Frames are working images rather than finished camera renders — 7 Cecret terrain masks, 3 Wilderness axonometrics, 3 Residence One lookdev passes, 2 Not Unreal model photographs. **They render identically.** This is `role`'s cut applied one level down: the distinction is a sentence, and the body prose already makes it better than a badge would — *"they are the actual project"*, *"how the finished images were arrived at"*. A label would also re-introduce the status difference the Plate contract exists to remove. `alt` stays alt text |

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

**The About page is `src/pages/about/ime.mdx`** with a layout in frontmatter — not a collection, and not
an `.astro` page. A single non-repeating document in a collection means a loader, a schema, and a
`render()` call to serve one entry. Astro renders `.mdx` as a page directly.

**Its layout is `src/layouts/About.astro`, and that is not a second layout mechanism.** It wraps
`Base.astro` and adds exactly what MDX cannot carry: the `<main>` shell and a scoped `<style>` block.
The page's own content stays markdown, which is what MDX is for and why this file chose it. A page that
put its structure in the `.mdx` would be JSX with prose in it, and the reason for the format would be
gone.

**No CMS, confirmed against the real shape.** Six flat fields and one array, in three files, with one
author, no editorial workflow, and no publishing calendar. A CMS here would exist to edit six fields.

---

## 6. Social Cards

Decided in [issue #32](https://github.com/imecoulter/coulterheiberger-com/issues/32).
[#14](https://github.com/imecoulter/coulterheiberger-com/issues/14) built the Open Graph and Twitter
metadata deliberately without an image, waiting on the typeface decision; this is the other half of it,
and it is why the metadata substrate lives here rather than in a document of its own.

**Every page has a Social Card. There are no carve-outs, `/404` included.** A route that unfurls as a
bare link is not a saving.

### The page says which image. The layout says how.

`Base.astro` takes one optional prop:

```ts
image?: { src: ImageMetadata; alt: string; framing?: string }
```

and does everything else itself — `getImage({ width: 1200, height: 630, format: 'jpeg' })`, then
`og:image`, `og:image:width`, `og:image:height`, `og:image:alt`, and `twitter:card`. A page that could
also specify the crop is a page that will eventually specify a *different* crop, and then there are two
card mechanisms drifting apart.

A Project passes `images[0]` — its hero, and per §2 there is no separate hero field, so there is nothing
to choose and no new frontmatter. **No page passes it yet**, because no route renders a Project. The prop
is the mechanism those pages will use; §2's schema is unchanged.

### A Project's card is a crop of its hero, not a generated card

The alternative was a generated card setting `title`, `credit` and the specification line over the image
— the caption contract [#10](https://github.com/imecoulter/coulterheiberger-com/issues/10) already
defines, in the faces [#21](https://github.com/imecoulter/coulterheiberger-com/issues/21) already chose.
**It is rejected permanently, not deferred.** Two reasons, and the second is the real one:

- It builds a second typographic system that has to be kept in sync with the page it advertises, for an
  artifact nobody sees at more than thumbnail scale in a timeline.
- **The work is the argument.** A card that puts a caption between the reader and the image makes the
  metadata the headline. That inverts the direction: the specification line exists to *measure* a plate,
  not to stand in for one.

The site-wide default below is typographic precisely because it has no plate to stand in front of.

### The framing was provisional. It is now settled, and it is the same mechanism

Astro crops from **centre**, and a centre crop recomposes nothing — the same defect
[#30](https://github.com/imecoulter/coulterheiberger-com/issues/30) tracks for the 21:9 desktop and 4:5
at 390 px crops named in `docs/design-direction.md`. 1200×630 was **that issue's third ratio**, and it
closed when the Project routes landed and there was finally a page with a `framing` keyword to pass.

`Base.astro` now hands `card.framing` to the same `getImage` call as `position`. This is deliberately
**not** a second mechanism: the page still says only *which* image and states its composition, the
layout still owns the ratio, and there is still exactly one place a Social Card is cropped. A Project's
card recomposes on the axis its author chose; the site-wide default passes `centre`, which takes nothing
off any edge because the card is authored at 2400×1260 — already 1200×630's ratio.

One trap worth keeping written down. `astro.config.mjs` sets a global `image.layout: 'constrained'`
so no component ships a single-width image by oversight, and **that default applies to `getImage` too**:
the moment it was added, this one card became a six-width `srcset` while only `.src` is ever read. The
call passes `layout: 'none'` for that reason. Deleting it costs five orphan encodes per build and
nothing will report it.

### The site-wide default card

`src/assets/social-card.jpg`, committed at 2400×1260 and delivered at 1200×630, so the delivered file is
a downscale and never a same-size re-encode. Built by `scripts/dev/build-social-card.mjs`, a **local dev
tool on the `subset-fonts.mjs` pattern**: CI never runs it and consumes the committed artifact. That
file's header carries the reasoning that does not belong here — why the text is outlined out of the
committed woff2 instead of set as live SVG `<text>`, and what is deliberately *not* on the card.

`src/assets/` rather than `public/` is load-bearing. Astro content-hashes the emitted filename, and
crawlers cache a Social Card by URL for a long time; a hash is the only thing that reliably busts that.

Its `og:image:alt` — `Coulter Heiberger — Technical Artist` — is a constant in `Base.astro`, and is
**the one alt string on the site not enforced by a schema.** Every other one arrives through
`alt: z.string().min(1)` (§2).

The card is not a Rendered Asset and never goes through `npm run assets` — see
`docs/asset-delivery.md` §2.

### `og:type` stays `website` everywhere

Not an oversight. `article` is the only alternative worth having and it belongs to the Build Log, which
is decided (§3) and not built. Revisit when `/log/` ships. Deciding now what a Project is in Open
Graph's vocabulary would mean deciding it with no page to check the answer against.

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
| `getImage` with explicit `width` + `height` + a `widths` ladder crops **every** srcset entry | Confirmed. cecret's hero emitted 2.333 at 960/1280/1920/2560 |
| `getImage` with `aspectRatio` + a `widths` ladder **does not crop** | Confirmed, and it fails silently: the same hero emitted the source's 1.778 at every width while *reporting* `aspectRatio: 2.333` in the attributes. This is why `src/components/Plate.astro` passes both dimensions |
| `position` reaches sharp and changes the output | Confirmed. `top` and `left bottom` emit different content hashes — `position` is one of `DEFAULT_HASH_PROPS` |
| Astro's static `redirects` emits `<meta http-equiv="refresh">`, not a 301 | Confirmed by source (`core/routing/3xx.js`). See §1 |

Three rows about the Carry's view transitions were verified here and have moved to
`docs/motion.md` with the behaviour they described. They are still measurements, not readings — the
site simply no longer does the thing they measure.
