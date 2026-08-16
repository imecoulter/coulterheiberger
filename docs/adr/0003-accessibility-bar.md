---
status: accepted
date: 2026-08-16
---

# WCAG AA, gated at error, measured at two layers

Lighthouse CI has been computing an accessibility score on every run since the perf gate landed ([ADR-0002](./0002-graphics-isolation-and-performance-budget.md)) and throwing it away. Turning it into a gate was a config change, not new infrastructure — which made the threshold, not the plumbing, the whole decision. Settled in [issue #35](https://github.com/imecoulter/coulterheiberger-com/issues/35).

**The target is WCAG AA.** It is asserted at `error` in `lighthouserc.cjs` over every page in `dist/`, and at the token layer in `scripts/check-css.mjs` over the built CSS. Both run in the `Performance and accessibility budget` step.

## What the score is actually worth

The issue framed this correctly and the measurement confirmed it: **a Lighthouse score is a weak instrument.** It is worth writing down how weak, because the number is about to look authoritative in CI output.

Measured against the built `dist/`, both routes score **1.0** — and that 1.0 rests on **nine applicable audits out of seventy-three**:

| | count |
| --- | --- |
| applicable, and passing | 9 |
| notApplicable | 54 |
| manual-only | 10 |

The nine are `aria-hidden-body`, `color-contrast`, `document-title`, `heading-order`, `html-has-lang`, `html-lang-valid`, `link-name`, `meta-viewport`, `target-size`. Fifty-four are inapplicable because the DOM has no forms, no tables, no ARIA, no images and no video yet. Ten are never automated at all — and a **keyboard trap lives in those ten**.

So: **a green gate here means nine things are fine.** It is not a claim that the site is accessible. It is worth having anyway, because the nine include the two failure modes this design is actually exposed to — contrast on small type, and unnamed links — and because a gate that exists gets tightened while one that was never added gets forgotten. Read the number as a regression alarm, not as a grade.

## Contrast: the token did not move

The issue's suspicion was that the honest outcome might be "the token moves, not the gate is loose" — `--muted` is a `color-mix()` at 58% ink used for `.t-label` and `.t-spec`, both 11–12 px with wide tracking, which is the combination most likely to fail. It was measured before a threshold was picked. It passes.

Computed from `src/styles/tokens.css` via OKLab mix → sRGB → WCAG 2.x, in both bands:

| | day | night |
| --- | --- | --- |
| `--ink` on `--ground` | 15.91 | 15.18 |
| `--muted` (58% ink) | **4.90** ✅ AA | **5.01** ✅ AA |
| `--rule` (18% ink) | 1.54 | 1.44 |
| `--signal` on `--ground` | 3.77 | 4.41 |

The floor for 4.5:1 is **56% ink (day) / 55% (night)**. 58% sits two points above it in the tighter band. `--muted` **stays at 58%**, and 4.5:1 is now pinned as an asserted invariant rather than a property it happened to have.

**The large-text 3:1 exemption is refused by name.** It was available — `.t-spec` could have been argued into it — and it is declined because `.t-spec` is the design's most characteristic element. Exempting it exempts the thing people squint at. This is recorded so the exemption is not rediscovered later as a cheap way to pass.

**`--rule` is deliberately not asserted.** It is a ~1.5:1 hairline and it is supposed to be; it separates, it does not inform. A floor there would be a number with no authority behind it, and an assertion nobody can justify is one that gets weakened the first time it fires.

**`--signal` is asserted at 3:1, and forbidden as a text colour.** It is the `:focus-visible` outline (`base.css:32-35`) and nothing else — a non-text UI component under WCAG 2.2 SC 1.4.11, which it clears at 3.77 / 4.41. It **fails** 4.5:1 as text. A ratio assertion alone cannot see what a token is *used for* and would silently bless `color: var(--signal)`, so `check-css.mjs` refuses that declaration outright alongside the existing radius and shadow refusals.

### AAA was priced and declined

AAA (7:1) would need roughly **69% ink (day) / 70% (night)** against today's 58% — a visibly darker specification line, in the one place this design is most itself. It is declined **on design fit**, not on cost or difficulty, and not because it was never considered.

That distinction is the reason this paragraph exists: *never considered* and *considered and refused* read identically in a config file, and only one of them is true here.

## Two instruments, at two layers — not two scanners

Lighthouse over rendered pages, plus a token-layer contrast check in `check-css.mjs`. **No `axe` and no `pa11y`.**

Lighthouse's accessibility category **is** axe-core. Adding a second DOM scanner over the same two static pages would add *rules*, not *reach* — more audits against the same handful of elements, when the gap in coverage is states the DOM never enters, not rules the scanner never ran. The two instruments that earn their place are the ones looking at different things: one reads the tokens before they render, the other reads the pages after. The token check also catches what no page scan can — a band that no shipped page currently exercises.

Revisit when the first Exhibit or interactive component makes a non-default DOM state real. That is when a second instrument would have somewhere new to look.

The token check lives **inside `check-css.mjs`** rather than beside it: same input (built CSS), same refusal posture, same failure mode. A sibling script reading the same `dist` CSS would be a seam with nothing on either side.

## The assertions

Named audits **and** a category score. The redundancy is deliberate, and it will look like an oversight to a fast reader:

- **The named audits say what broke.** `color-contrast`, `link-in-text-block`, `heading-order`, `html-has-lang`, `document-title`, `meta-viewport`, `image-alt`, `label`, `button-name`, `link-name`, each at `maxLength: 0`.
- **The score catches what nobody anticipated.** `categories:accessibility` at `minScore: 1`.

Four of the ten are `notApplicable` today. Asserting them costs nothing until a form, an icon button or an image appears — **which is precisely when nobody is thinking about them.** Verified: `maxLength: 0` on a `notApplicable` audit passes, and a misspelled audit id does *not* silently pass — LHCI fails it with "is not a known audit", so the list cannot rot into decoration unnoticed.

**Gated at `error`, not `warn`.** Every other check in `deploy.yml` is `error`. An advisory row gets read once and never again.

**One bar across all URLs — no `assertMatrix`.** `404.html` is held to the same standard as `index.html`. LHCI's static server discovers every `.html` under `dist/`, so future pages enrol themselves with no config change and no opportunity to quietly carve out an exception.

## Exhibits

**An Exhibit ships with a keyboard path and a text alternative.** No exemption, no per-URL relaxation.

This is decided now, while **no Exhibit exists** and it costs one paragraph. Decided later, with a WebGL canvas already built and a deadline attached, the same question costs either the Exhibit or the bar. ADR-0002 already requires every Exhibit to ship a poster image and a Gate; the text alternative is a small extension of a commitment already made.

**A manual keyboard pass is owed before the first Exhibit ships.** Not per-release — that is a cadence nobody keeps on an irregular ship schedule, and a ritual that gets skipped is worse than one never promised. The ten manual-only audits are where a keyboard trap would live, and a canvas is when that risk actually arrives.

## Consequences

- **`npm run perf` is now `npm run budget`**, and the CI step is `Performance and accessibility budget`. The step gates two things and the old name mentioned one. `npm run check:css` still runs immediately before it, unchanged in position — it is a separate gate on the design's hard rules.
- **Moving `--muted` is now a CI failure, not a judgement call.** That is the intent. If it genuinely needs to move, this ADR changes first.
- **`check-css.mjs` resolves each `color-mix()` against the primaries of the band that declared it**, not the band being evaluated. That is what makes it catch the regression `tokens.css:54-61` warns about: delete the two restated lines from `.night` and night's `--muted` becomes a day-tinted grey on a near-black ground, which measures 3.40:1 and fails. Modelled any other way, the check would compute the value we *want* and bless the bug.
- **The 404's link was changed on design merits**, not to satisfy this gate. It inherited `--muted` from its parent paragraph and was distinguished only by a `--rule` underline at 1.54:1; it is now `--ink` with a `--muted` underline. CI never would have forced it — axe fires `link-in-text-block` only when a link is distinguished from surrounding text *by colour*, and this link was not distinguished at all, so the audit was `notApplicable` both before and after.
- **`CONTEXT.md` narrows `Gate`.** The word was doing two jobs — the Exhibit opt-in, and any CI check — so `CI check` and `gate` joined its *Avoid* list. `Check` was deliberately **not** added as a glossary entry: it stays a naming convention in `deploy.yml` and the npm scripts. The glossary holds things a visitor could perceive, and build tooling in it is the first crack in what makes it useful.
- **This ADR is the only prose home for the reasoning.** No `docs/accessibility.md`. `check-css.mjs` and `lighthouserc.cjs` already carry their reasoning in-file — this repo's habit — and a third location is a place for the three to disagree.

## Corrections to the working notes

Recorded because they were believed during the session that settled this, and both are the kind of thing that gets re-derived wrongly:

- **The 404 link would not have failed the gate.** An earlier claim that it would was wrong; see the consequence above.
- **`npm run budget` does run locally on Windows**, contrary to a note that stood for two sessions. The workaround and the local-assert technique are in [docs/build-runbook.md](../build-runbook.md) §7.
- **AAA needs ~69–70% ink, not ~76%.** The working notes carried the higher figure. At 76% the ratio is already 8.75 (day) / 8.37 (night), well past 7:1. The conclusion is unaffected — 69% is still a large move from 58%, and the refusal is on design fit either way.
