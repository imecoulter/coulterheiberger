---
status: accepted
date: 2026-08-19
---

# One dark ground, and no light one

`docs/design-direction.md` opened with *"Paper ground, inverting once to night, where the interactive
work sits."* **The ground inverts.** The site is dark, it is dark for everybody, and the second band
that used to invert into is gone rather than flipped.

This is an amendment to Datum, not a replacement of it. The datum itself, the Plate contract, the
three type roles, the no-motion rule and the greyscale-furniture argument are all untouched. Settled
by grilling session on 2026-08-19, working from Luxigon and Brick Visual as the stated references.

## Why this is a coherent amendment rather than a new direction

The strongest sentence in Datum's colour section is **"the furniture is greyscale so that the images
are the only colour on the page."** That sentence was the reason the Plate index mark lost its signal
red, and it is why the whole site is a greyscale frame around six photographic renders.

Inverting the ground makes that argument *more* true. On paper, the page and the images are both
bright and they compete for the eye. On a dark ground the images are the only light source on screen,
which is precisely the effect the two reference sites get and the reason they were cited.

Nothing else in Datum depends on which end of the axis the ground sits at. That is what makes this an
amendment: it changes two hex values and the argument for them, and every other decision in the
document survives the change unread.

## The ground is `#0E1114` and not `#000`

**Pure black was asked for by name and it was measured before it was refused.** Computed through the
same OKLab mix → sRGB → WCAG path `scripts/check-css.mjs` uses:

| token | on `#0E1114` | on `#000000` |
| --- | ---: | ---: |
| `--ink` `#E8E6E1` | 15.18 | 16.84 |
| `--muted` (58% ink) | **5.01** ✅ | **4.09** ❌ |
| `--rule` (18% ink) | 1.44 | 1.09 |
| `--signal` `#E3392C` | 4.41 ✅ | 4.89 ✅ |
| the 4.5:1 floor for `--muted` | 55% ink | **61% ink** |

**Pure black fails the gate that [ADR-0003](./0003-accessibility-bar.md) pinned.** `--muted` is the
colour of `.t-spec` and `.t-label` — the specification line, 11 to 12 px, the design's most
characteristic element — and on `#000` it lands at 4.09 against a 4.5 floor. ADR-0003 was explicit
that this is a CI failure and not a judgement call, and that if `--muted` genuinely needs to move,
*that ADR changes first*.

So pure black was available at a price: move `--muted` to 61 or 62% ink, amend ADR-0003, and lift
`--rule` well above 18% as well, because 18% mixed toward pure black resolves to `#0F0F0E` — four
values off the ground, which is not a hairline, it is nothing.

**It was declined, and the reason is about the images rather than the numbers.** Luxigon and Brick can
afford `#000` because every image in those grids is bright daylight photography, so black is always
the recessive value. This site's asset set is tonally split: `atmosphere` leads on a high-key
white-walled interior, and **`not-unreal`'s hero is a greyscale collage on pure black with stars in
it.** On a pure-black page that Plate stops being an object and becomes a hole in the layout. Fourteen
units of separation is what gives a black-ground image an edge for free, with no new furniture and no
border.

That is worth stating plainly because it inverts a trade ADR-0003 already made once. There, AAA was
declined because it would have made the specification line *darker* in the one place this design is
most itself. Here the same line would have gone *lighter* for the same reason, and it is declined the
same way: on design fit, having been priced.

`--rule` at 18% and `--muted` at 58% therefore **do not move**. Both were measured on the new ground
before it was chosen, and both pass unchanged.

## Dark-only, and enforced by name

**There is no light alternative and no visitor-facing switch.** Not a `prefers-color-scheme` fallback,
not a toggle.

A toggle was refused on mechanism as much as on taste: the site has exactly one authored `<script>`
(`AGENTS.md`), a static build has no server to remember a preference, and the flash of wrong ground
before a client-side toggle runs is the single most visible defect a dark site can ship. An OS-driven
fallback was refused on the plainer ground that a portfolio which renders differently depending on a
system setting is a portfolio whose author did not decide.

**`scripts/check-css.mjs` gains a fourth refusal**: `prefers-color-scheme` in site CSS, alongside
`border-radius`, `box-shadow` and `color: var(--signal)`. This is the same posture the other three
take — the check refuses the declaration by name and says why, rather than asserting a value that a
later session could satisfy while defeating the intent. Without it, "just a light variant" is one
media query away and leaves no trace.

**One exemption, deliberate.** `scripts/dev/build-favicons.mjs` emits a `prefers-color-scheme` swap
into an SVG, and it stays. The favicon does not render on the page; it renders in the browser's tab
strip, whose colour comes from the visitor's OS theme and has nothing to do with this site's ground.
A dark-only mark is invisible for every dark-OS visitor. The swap is answering a question about the
browser, not about the site, and that is why the site-wide rule does not reach it. Both variants are
re-derived from the new ink. This paragraph exists because "we went dark-only but the favicon still
has a light mode" reads as an oversight until someone says otherwise.

`color-scheme: dark` is declared, and it is not decorative. It is what makes the UA paint the
pre-paint canvas, the scrollbars and any future form control dark, so the ground is black from the
first frame rather than from first paint. A white flash before a black site is the defect this change
is most exposed to. `<meta name="theme-color">` extends the ground into mobile browser chrome, which
is the closest thing to the references' edge-to-edge feel available for one tag.

## The night band is cut, not flipped

Datum's inversion had a stated job: *mark where the interactive work sits.* The hard rule was **"at
most one night band per page"**, and v1 shipped zero, because [ADR-0002](./0002-graphics-isolation-and-performance-budget.md)
ships zero Exhibits and a dark band marking nothing is decoration.

With one dark ground there is nothing left to invert into. Three options existed:

| | |
| --- | --- |
| **Invert the rule** to "at most one day band per page" | Tempting symmetry, refused. A paper band on a dark site marking an Exhibit is a far louder gesture than a night band on paper was, and it would be the most decorative thing on the page — the exact move Datum refuses |
| **Keep the rule as written** | Refused outright. A live rule that constrains nothing is how a document rots: it stays readable while quietly meaning nothing |
| **Cut it** | Taken |

If a future Exhibit needs marking, that is a decision to make when an Exhibit exists, with the Exhibit
in hand. `docs/design-direction.md` keeps one paragraph recording that a two-band model existed and
why it went, so the next reader finds a trace rather than a `Ground` entry with no history.

**The `.night` class is deleted**, and that removes a documented footgun with it. `tokens.css:112-126`
existed only because a `color-mix()` resolves at computed-value time against its declaring element and
does **not** re-derive in a second scope, so `--rule` and `--muted` had to be restated inside `.night`
or the night band silently shipped day-tinted greys. Issue #11 cost real time discovering that. One
band and the trap has nothing to trap.

## `--signal` is unchanged

`#E3392C` stays, on the `:focus-visible` outline and nowhere else, at its asserted 3:1 floor. It
measures **4.41** on the new ground, with more room than the 3.77 it had on paper.

Red on near-black is the signature of the cinematic-chrome cluster Datum is built to be
distinguishable from, and that objection was raised and does not apply: signal is on screen only while
somebody is navigating by keyboard, so it is never part of the site's resting appearance, and the
cluster resemblance is entirely about resting appearance.

Making the focus ring `--ink` instead — a pure-greyscale site — was considered and is worse than it
looks. A light outline on a light-on-dark page is the least distinguishable thing a focus indicator
can be, and the focus ring is the one affordance that has to be unmistakable.

## Consequences

- **`bands()` in `check-css.mjs` collapses to one band.** It currently hardcodes `:root` as day and
  `.night` as the overlay. Keeping the two-band machinery with nothing to populate the second would
  leave an empty `Map` that passes every assertion silently, which is worse than not checking.
- **The site-wide Social Card inverts.** `scripts/dev/build-social-card.mjs` hardcoded the paper
  ground, and it is the one asset a stranger sees before they see the site. Project cards are
  unaffected: `CONTEXT.md` records them as build-time crops of the Project's own hero, so they carry
  the image rather than the ground.
- **`CONTEXT.md` gains `Ground`**, which has never been a glossary entry despite being the site's
  most-used design term. *Day* and *night* retire with the two-band model; they only ever carried
  meaning as a pair.
- **The Expanded View needed no change.** `src/pages/projects/[slug].astro` tints it with
  `color-mix(in oklab, var(--ground) 82%, transparent)`, so it follows the token. Its in-file comment
  warns about the UA's own translucent black landing over a paper site, and that hazard retires here.
- **`--rule` and `--muted` get a look on a built page.** Both pass their gates and neither moves in
  this change, but a hairline at 1.44 behaves differently as light-diluted-toward-dark than it did as
  ink-diluted-toward-white, and no number settles that. Recorded as **deferred**, not as decided, so
  "18% unchanged" is not later misread as a judgement someone made.
- **The asset set gets a second look after the flip.** JPEG banding in dark gradients is invisible on
  paper and not on a dark ground, and `not-unreal`'s edge wants confirming at fourteen units rather
  than assuming. Any fix goes through `npm run assets`, never by hand.

## What this does not settle

**The ground is not the look.** Both reference sites do two separable things: a dark ground, and an
edge-to-edge image grid with hairline gutters where the dark shows only as separation. This change is
the ground alone. The index currently runs one wide 21:9 Plate over a half-width column with a
128–160 px rhythm, and on a dark ground large empty fields stop reading as page and start reading as
void.

That is the next session, deliberately separated: shipped together, a result that reads wrong could
not be attributed to either one.

## Corrections to ADR-0003

Recorded here rather than by editing that ADR, which is a dated record of what was decided then.

- **Its contrast table's `day` column now describes nothing**, and its `night` column describes the
  only ground.
- **One of its arguments for the token check no longer holds.** It says the token check earns its
  place partly because it "catches what no page scan can — a band that no shipped page currently
  exercises." With one band, that specific virtue is gone. The check still earns its place: it reads
  tokens before they render where Lighthouse reads pages after, and that difference is untouched.
- **The accessibility bar itself is unchanged.** WCAG AA, gated at `error`, `--muted` at 4.5:1,
  `--signal` at 3:1 and never a text colour, the large-text exemption still refused by name.
