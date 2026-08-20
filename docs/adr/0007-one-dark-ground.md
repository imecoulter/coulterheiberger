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

## The ground is `#000`, and it moved two derived tokens with it

**`#0E1114` was proposed first, priced, and rejected by the owner in favour of pure black.** The
intermediate ground is recorded here because it was genuinely the recommendation and the reasons
against pure black are real: they are now accepted costs rather than open questions.

Computed through the same OKLab mix → sRGB → WCAG path `scripts/check-css.mjs` uses:

| token | on `#0E1114` | on `#000000`, tokens unchanged | **as shipped on `#000000`** |
| --- | ---: | ---: | ---: |
| `--ink` `#E8E6E1` | 15.18 | 16.84 | **16.84** |
| `--muted` | 5.01 (58%) ✅ | **4.09** (58%) ❌ | **4.96** (63%) ✅ |
| `--rule` | 1.44 (18%) | 1.09 (18%) | **1.43** (30%) |
| `--signal` `#E3392C` | 4.41 ✅ | 4.89 ✅ | **4.89** ✅ |
| the 4.5:1 floor for `--muted` | 55% ink | 61% ink | 61% ink |

**Pure black is not a one-value change, and shipping it as one would have failed CI.** `--muted` is
the colour of `.t-spec` and `.t-label`, the specification line at 11 to 12 px, and on `#000` at its
long-standing 58% it lands at **4.09** against a 4.5 floor. [ADR-0003](./0003-accessibility-bar.md)
was explicit that this is a CI failure rather than a judgement call, and that if `--muted` genuinely
needs to move, that decision gets written down first. This is that writing down.

**`--muted` moves 58% → 63%.** 63 is chosen so the rendered grey barely moves: 4.96 against the 5.01
it has always had, while sitting two points above the new 61% floor — the same margin ADR-0003 picked
58% for on the old one. **`--rule` moves 18% → 30%**, because 18% mixed toward pure black resolves to
`#0F0F0E`, four values off the ground, which is not a hairline but an absence. 30% restores 1.43
against the old 1.44.

**So both tokens look the same as they always did.** Only the ground moved. That is the property
worth preserving and it is why the two numbers are ugly: they are the values that hold the
appearance constant across a change of ground, not round numbers someone liked.

### What pure black costs, accepted rather than solved

**The dark Plates lose their edge.** This asset set is tonally split in a way the reference sites' are
not: Luxigon and Brick can afford `#000` because every image in those grids is bright daylight
photography, so black is always the recessive value. Here `atmosphere` leads on a high-key
white-walled interior, while **`not-unreal`'s hero is a greyscale collage on pure black with stars in
it.** On `#000` that Plate has no boundary at all; it stops being an object on the page and becomes a
hole in it. `#0E1114` would have bought it an edge for free, with no border and no new furniture.

This is **accepted, not fixed.** It is exactly the kind of thing that has to be judged rendered rather
than argued, and the ground-inversion commit is followed by a visual review pass on the same branch.
If that Plate reads as a hole, the fix is a decision about that Plate — a different crop, a different
hero — or a hairline on Plates generally, which would be new furniture and a change to
`design-direction.md`. It is deliberately **not** a reason to walk the ground back up to `#0E1114`
without saying so here.

**It also inverts a trade ADR-0003 already made once.** There, AAA was declined because 69% ink would
make the specification line visibly lighter in the one place this design is most itself. 63% is a
smaller step in that same direction, taken for a different reason, and it is worth naming that the
line is now marginally lighter than the design has ever shipped it.

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
measures **4.89** on the new ground, with considerably more room than the 3.77 it had on paper.

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
- **`--rule` and `--muted` are asserted invariants at their new percentages**, the way 58% was. Both
  were tuned to hold their old ratios rather than to a round number, and both still want a look on a
  built page: a hairline behaves differently as light-diluted-toward-black than it did as
  ink-diluted-toward-white, and no ratio settles that.
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
- **`--muted` moved, and ADR-0003 said that requires a decision written down first.** This ADR is it.
  What moved is the *percentage* (58 → 63) needed to hold the same ratio on a darker ground, not the
  floor and not the bar. Its section "Contrast: the token did not move" is now historical: the token
  did move, for a reason that ADR did not have in front of it.
