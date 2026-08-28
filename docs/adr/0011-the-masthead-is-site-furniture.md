---
status: accepted
date: 2026-08-23
---

# The Masthead is site furniture, and the Project pages leave the image-LCP regime

**Amends** [ADR-0002](./0002-graphics-isolation-and-performance-budget.md) (its costing basis), and
[ADR-0008](./0008-the-index-arrangement-and-one-spacing-atom.md) /
[ADR-0009](./0009-the-two-reveals-are-timed.md) (the two reveals are no longer both on `/`).

## Context

The Masthead — eyebrow, name, role, positioning lede, specification line, portrait — existed twice,
hand-copied. `src/pages/index.astro` and `src/layouts/About.astro` each rendered near-identical
markup over roughly 140 lines of restated CSS, and only two strings were genuinely shared
(`PRACTICE_LEDE`, `PRACTICE_SPEC` in `src/site.ts`).

`About.astro` recorded both the duplication and the reason it had been accepted:

> The alternative is a shared `<Masthead>` component, and it was not taken for one reason: the
> revealed About block on `/` uses the Plates' own `.ordinal` / `.title` / `.spec` rules, and
> lifting the Masthead out of that file would either drag those with it or fork them. **Worth
> revisiting if a third page ever opens this way.**

The owner asked for the identity block on every page, including the six Project pages, as the thing
that will become the site's navigation. That is the third page, seven times over.

## Decision

**One `<header>`, rendered by `Base.astro`, above `<main>`, on every route.** The only per-page
variation is the eyebrow, a required `eyebrow` prop on `Base`: `Selected work`, `About`, `Project`,
`Not found`. A page cannot forget it — `astro check` fails.

> **Amended 2026-08-28: on a Project route the eyebrow is the Project's name, not `Project`.** The
> rule is untouched — one thing varies per route and it is this string — and what changed is what
> the string says. See [the amendment below](#amendment-the-project-eyebrow-names-the-project).

**Outside `<main>`, deliberately.** `<header>` maps to the `banner` landmark only when it is not
scoped to a sectioning element, and a `<nav>` inside `<main>` is page content rather than site
navigation. The old placement got this wrong on two pages; site-wide it would have been wrong on
nine. Nothing in `lighthouserc.cjs` can see it — its ten named audits include no landmark audit,
which is the class of thing ADR-0003's "a green gate is not a claim that the site is accessible" was
written about.

**The revealed band is its own component, `src/components/Meta.astro`.** This is what resolves the
blocker `About.astro` named. Astro scopes CSS by attribute and appends the scope to *every compound
in a selector*, so the moment the Masthead became a component the Plates' unscoped `.ordinal` /
`.title` / `.spec` rules stopped reaching its About band. The choice was to fork the device or to
extract it; a fork is invisible and nothing in CI can detect one. The band's two ancestors —
`.plate` and `.masthead-aside` — are reached with `:global()`, which is a real debt and much the
smaller one.

A shared `band.css` was rejected: `docs/styling.md` forbids a fourth CSS location by name, and
everything imported in `Base.astro` ships to every page, including the two that render no band.

**`--scrim` moved into `Meta.astro` with its derivation**, not into `tokens.css`. Its own comment
authorised promotion "if a third route ever reveals a label on an image" — but the promotion it
anticipated assumed two consumers on one page, and componentising collapsed those into one consumer
in one file. A token exists to stop two places writing one value. Moving it was not optional: left
on index's `<main>`, `var(--scrim)` would have resolved invalid on a Project page and painted `--ink`
text over an unmodified render — a contrast failure neither `check-css.mjs` (which harvests `:root`
and compares to `--ground`) nor Lighthouse (which does not evaluate contrast over an image) can see.

**Headings resolve to the rule `tokens.css` already stated.** h1 is the site's name, h2 is a page's
own title. The Masthead carries the h1 everywhere; a Project's title and `/404`'s heading became h2.
Both already used `--t-h2`, so nothing moved except the tag.

**`/404` carries it too, and lost its centred grid.** A route that opts out is the first crack in
"the staple is on every page", and `lighthouserc.cjs` already refuses relaxation for `404.html` by
name. Centring under a left-datum header read as two pages stacked, so the centring gave way rather
than the header. The 404 now offers two ways out; that was a conscious yes.

**IT ALSO SCROLLS NOW, and that is the one consequence worth a second look.** `base.css` records
that /404 used to hold its own `min-height: 100dvh` and that it was removed precisely because "a
100dvh main plus a footer is one screen and a bit, which is a 404 page you have to scroll". With the
Masthead above it the page is 1092px at 1440x900, so it scrolls by ~190px and the footer is no
longer resting on the bottom of the viewport. A face, a name, a lede and a specification line is
most of a screen before the word "404" is reached. Reversing it means either exempting /404 from the
staple or giving it a shorter Masthead, and both are the thing this ADR decided against — so it is
recorded as a known cost rather than fixed here.

**The page shell is stated once.** `base.css` now sets the measure and centring for
`body > header, main, body > footer`, replacing four hand-kept copies. Only padding stays per
element. That rule replaces a comment that had promised exactly it: "Any other direct child of
`<body>` needs the same pair."

## Consequence: the Project pages leave the image-LCP regime on mobile

`[slug].astro` used to argue the hero must lead the document:

> It also keeps the page image-LCP, which is the regime ADR-0002 costed the ~220 KB hero crossover
> in. Three hundred pixels of heading above it would hand the LCP to an `<h1>` on mobile and quietly
> move the page into the other regime.

That is exactly what this ADR does, on purpose. The objection was to doing it *quietly*, and that is
the part answered: it was measured before it shipped, and `/` had already taken the same shift when
the Masthead landed there, so this is eight routes joining a regime one route was already in.

ADR-0002's ~220 KB crossover and the hero-bytes table in `lighthouserc.cjs` were both derived with
the hero as the LCP element. They still describe the landscape case, where it still is. The hero
keeps `priority` and `data-anim="now"` with no `--d` for that reason: on a landscape window it is
still the LCP element, and demoting it would make the LCP element `loading="lazy"` and
observer-gated, which ADR-0010 forbids.

### Measured

Mobile, `devtools` throttling, median of 3, against `./dist` — the `npm run budget` configuration.
Collected with the lighthouse CLI rather than `lhci collect`: on Windows chrome-launcher's temp
cleanup throws `EPERM` and aborts the sweep partway while still exiting 0, which is why
`.lighthouseci/` comes back empty. Point `TEMP`/`TMP` at a project-local directory and drive the CLI
per URL; it writes its JSON before the throw.

| route | before | after | LCP element after |
| --- | ---: | ---: | --- |
| `/` | 2512 | **1761** | portrait |
| `/about/ime/` | 680 | 1511 | portrait |
| `/404` | 686 | 1575 | portrait |
| `/projects/atmosphere/` | 1594 | 1952 | portrait |
| `/projects/cecret/` | 2011 | 1954 | portrait |
| `/projects/habitat/` | 2003 | 1962 | portrait |
| `/projects/not-unreal/` | 1993 | 1939 | portrait |
| `/projects/residence-one/` | 1916 | 1944 | portrait |
| `/projects/wilderness/` | 1789 | 1873 | portrait |

Every route clears the 2500ms gate, worst case 1962ms. CLS stayed 0.0000 everywhere, the
accessibility category stayed 1, and script bytes were unchanged at 9,651 B.

**`/` got faster**, by ~750ms. Before this change its LCP element was the first Plate's hero image;
now it is the portrait, which is far smaller. The Masthead did not cost the index anything — it
bought it headroom.

**The two content-light routes paid for it.** `/about/ime/` and `/404` roughly doubled off a very low
base, because they had almost nothing above the fold and now carry a face. `/404` is the honest worst
case: it has so little else that the portrait simply is the largest element on it.

**The Project pages barely moved** — within noise of their own before-figures, four of six actually
faster. The predicted regression did not materialise, because the hero they lost as an LCP element
was slower than the portrait that replaced it.

### The portrait had to go eager

The first measured pass shipped the portrait as it had always been, `loading="lazy"`. That made the
LCP element lazy on all nine routes, which ADR-0010 forbids outright:

| route | lazy | eager |
| --- | ---: | ---: |
| `/` | 2002 | 1761 |
| `/about/ime/` | 1634 | 1511 |
| `/projects/cecret/` | 1974 | 1954 |
| `/404` | 1585 | 1575 |

`loading="lazy"` was never deferring this image — it is in the first viewport, and Chrome's lazy
threshold widens as the connection slows. It was only denying the preload scanner an early start.
It is **still not `priority`**: that would add `fetchpriority="high"` and put a face in direct
competition with a Project page's hero, which is the LCP element on a landscape window and is the
work.

## Costs accepted

- **The portrait is on every page's LCP path.** `loading="lazy"` does not hold back an element in
  the first viewport, and Chrome's lazy threshold widens as the connection slows. It is a 200-320px
  square at the 640/960 rungs, and it is the first thing to look at if a route ever regresses.
- **Two ancestor class names cross a scope boundary** via `:global()` in `Meta.astro`.
- **Two 8px spacing changes, both from the same specificity collision ending.** `.masthead .spec` at
  (0,2,0) used to beat the Plates' bare `.spec` inside the header; the Masthead and the band are
  separate components now, so their scope attributes no longer see each other.
  1. The **About band's** spec margin, at aspect >= 1:1 and width < 1200px, goes `--s3` (20px) to
     `--s1` (8px) — which is what a Plate's in-flow spec line takes in the same mode. Verified in a
     browser at 1100x900.
  2. The **Masthead's own** spec line sits 8px closer to the positioning paragraph on every page.
     Measured at 1440x900: the gap was 28px and is now exactly 20px. 20px is what the rule has always
     asked for (`margin: var(--s3) 0 0`, and `getComputedStyle` reported 20px on both builds) — the
     old 28px was not produced by any rule that could be found, so this is the intended value
     arriving rather than a new one being chosen.

  Everything else on `/` is unchanged to the pixel. Verified by capturing the bounding boxes of the
  eyebrow, h1, role, lede, portrait, the Plate list, the first Plate, its image, its band and its
  title, plus document height, on both builds at 1440x900: identical in every value but the one
  above.

## Alternatives rejected

- **Keep the duplication.** What this ADR exists to end.
- **A `<slot>` for the band.** Slotted markup carries the authoring page's scope, so every existing
  rule would have kept reaching it with zero edits — genuinely tempting, and it dies because it only
  works for the one page that authors the markup. The Project pages would have had to re-author the
  device, which is the fork wearing a hat.
- **`<style is:global>` in the Masthead.** Forbidden outside `Base.astro`, and it inverts ownership:
  the Plates would be styled by a component that does not render them.
- **A condensed Masthead on Project pages.** Would have preserved image-LCP, and it makes the staple
  a different object per route, which is the thing the owner asked against.

---

## Amendment: the Project eyebrow names the Project

**2026-08-28.** Recorded here rather than applied silently, because it edits the sentence above.

The owner reported that tapping a Plate on a phone "just reloads the landing page". It does not:
all six `/projects/<slug>/` URLs serve 200 with no `location`, and the Plate's hit area
(`.title a::after`, `inset: 0` against `.plate`) hit-tests correctly at 390x844, 844x390 and
1440x900 — `elementsFromPoint` at each image's centre returns the `<a>`, and
`a.offsetParent === li.plate`.

What is true is that **a successful navigation looks like a reload**, and this ADR is what made it
so. Measured on the live `/projects/cecret/` at 390x844:

| | |
| --- | ---: |
| Masthead height | 786px of an 844px screen (93%) |
| Difference from `/`'s first screen | one 12px `--muted` eyebrow word, at y=60 |
| `<h1>` on both | `Coulter Heiberger`, 38.4px |
| First element under `<main>` | the hero — on `/`, the same file at the same crop |
| `<h2>Cecret</h2>` first paints at | y=1331, **1.58 screens down** |

"Everything else is identical on every route by construction" is the property this ADR was written
to get, and on a phone it is close to the whole screen. The eyebrow was carrying the entire
distinction in 12px of muted mono, and it was spending it on `Project` — the one fact the visitor
had just established by tapping a Plate. The name was the fact they could not get.

So `[slug].astro` passes `title` where it passed `"Project"`, and `.t-label` renders it `CECRET`.

**This is not a second varying element.** The decision above stands as written: exactly one string
differs between one route's Masthead and another's, `astro check` still enforces that a page
supplies it, and no route grows a heading, a band or a rule the others do not have.

**A condensed Masthead on Project routes is still rejected**, on the same grounds as in
*Alternatives rejected* below. It is the stronger fix for the 93% — it would take the header to
roughly 330px and put the work on the first screen — and it makes the staple a different object per
route, which is what the owner asked against. The eyebrow was taken instead, in full knowledge that
it treats the symptom at 12px. If the first screen is revisited, that alternative is the one to
re-open, and this table is the measurement to re-open it with.

### The site name links home

Taken in the same pass and for the adjacent half of the same problem: a visitor who could not tell
they had navigated also had no way back. Nothing on a Project page linked to `/` — the name was
plain text, the eyebrow was plain text, and the portrait led to `/about/ime/`.

`<h1>Coulter Heiberger</h1>` is now wrapped in `<a href={HOME_PATH}>` on every route but `/`,
suppressed there by the same derived test that suppresses the About band on `/about/ime/` and for
the same reason — a control leading to the document it is already in. `HOME_PATH` joins `ABOUT_PATH`
in `src/site.ts` so the href and the suppression cannot disagree.

The `banner` landmark gains a second link, deliberately. `Masthead.astro`'s own note parks a `<nav>`
inside this `<header>` "when the site has second-level routes to list"; the name linking home is the
first piece of it, and it needs no invented mark.

`/404` gains a third way out, and it is the one people reach for.

### Costs

- The `_redirects` splat this diagnosis re-opened was fixed in `d66eb14`, but a 301 is cached
  indefinitely by default and **nothing in this repository can expire one already held by a
  browser**. Devices that saw the bug keep bouncing to `/` until their site data is cleared.
  `scripts/check-served-document.mjs` was hardened in the same pass so a recurrence cannot reach
  them: it now asserts that a URL served the document built for it, which the script-inventory
  comparison alone did not do.
- `RESIDENCE ONE` is the longest eyebrow. Nothing in CI measures it; re-check by hand if the type
  scale, the gutters or the mono subset move.
