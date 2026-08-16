# v1 build runbook

Execution order for the wayfinder map, [**v1 Build Plan**](https://github.com/imecoulter/coulterheiberger-com/issues/2).

This file holds only what the map does not: **what order to run sessions in, what to paste into each one, and which model and effort to use.** Every decision lives in its ticket. When the two disagree, the tickets win.

## Rules that apply to every session

- **One ticket per session.** Wayfinder's rule, and it is the one that keeps sessions inside their context budget. Research tickets are the only exception, and those are already resolved by background agents.
- **Start each session fresh** (`/clear`). These sessions are sized to fill a window on their own.
- The session claims its ticket by assigning it before doing any work, and resolves it by commenting, closing, and appending a pointer to the map's Decisions-so-far. `/wayfinder` does this; don't do it by hand.
- `AGENTS.md`, `CONTEXT.md`, ADR-0001 and ADR-0002 are binding. A session that thinks it must break one **says so** rather than routing around it.

## Order

| # | Session | Ticket | Type | Model | Effort |
| --- | --- | --- | --- | --- | --- |
| — | Research (running as background agents) | [#3](https://github.com/imecoulter/coulterheiberger-com/issues/3) [#4](https://github.com/imecoulter/coulterheiberger-com/issues/4) [#5](https://github.com/imecoulter/coulterheiberger-com/issues/5) | research | — | — |
| 1 | Repo visibility | [#7](https://github.com/imecoulter/coulterheiberger-com/issues/7) | task | Sonnet 5 | high |
| 2 | Asset delivery spec | [#6](https://github.com/imecoulter/coulterheiberger-com/issues/6) | grilling | Opus 5 | xhigh |
| 3 | Content architecture | [#8](https://github.com/imecoulter/coulterheiberger-com/issues/8) | grilling | Opus 5 | xhigh |
| 4 | Preview deploys | [#9](https://github.com/imecoulter/coulterheiberger-com/issues/9) | task | Sonnet 5 | high |
| 5 | Design direction | [#10](https://github.com/imecoulter/coulterheiberger-com/issues/10) | prototype | Opus 5 | xhigh |
| 6 | Styling ✅ | [#11](https://github.com/imecoulter/coulterheiberger-com/issues/11) | grilling | Opus 5 | high |
| — | Typography ✅ (background agent) | [#21](https://github.com/imecoulter/coulterheiberger-com/issues/21) | research | — | — |
| 7 | Perf gate ✅ | [#13](https://github.com/imecoulter/coulterheiberger-com/issues/13) | task | Opus 5 | high |
| 8 | Motion strategy ✅ | [#12](https://github.com/imecoulter/coulterheiberger-com/issues/12) | grilling | Opus 5 | xhigh |
| 9 | Launch checklist ✅ | [#14](https://github.com/imecoulter/coulterheiberger-com/issues/14) | task | Sonnet 5 | medium |

**Sessions 1–9 are done — the numbered order is complete.** **Perf gate and Motion strategy were swapped** — see session 7 for the reasoning. Everything else ran strictly sequentially.

**The map ([#2](https://github.com/imecoulter/coulterheiberger-com/issues/2)) is closed and this runbook is history.** Every decision on it is made and every piece of substrate is built. Keep the file for the reasoning behind the order, not as a list of things to do.

[#24](https://github.com/imecoulter/coulterheiberger-com/pull/24) (session 8, motion substrate) and [#25](https://github.com/imecoulter/coulterheiberger-com/pull/25) (session 9, launch checklist) are both merged. The ✅ on a session marks the *decision* as resolved and the ticket closed — not the merge. Per [#9](https://github.com/imecoulter/coulterheiberger-com/issues/9), merging stays a deliberate, manually-reviewed step.

[#21](https://github.com/imecoulter/coulterheiberger-com/issues/21) graduated out of the map's fog when [#11](https://github.com/imecoulter/coulterheiberger-com/issues/11) closed and the question became precisely stateable. It ran as a background agent alongside the numbered sessions rather than taking a slot, and it was the last thing standing between the map and closing — it gated the *choice* of typefaces, which gated the OG/social image question and the last open section of `docs/design-direction.md`. [#14](https://github.com/imecoulter/coulterheiberger-com/issues/14) built the OG/Twitter metadata substrate without an image for exactly this reason.

**Closed.** Three roles, two webfonts — Montserrat display, JetBrains Mono spec, body serif demoted to a system stack because it was 73% of the type stack for the least distinctive role. Shipped at 13,648 B. The research left the *taste* deliberately un-pre-sliced, and it was settled on a rendered page rather than the byte table: Montserrat over Archivo, 944 B apart. OG image strategy is now unblocked and is filed as its own issue.

[#17](https://github.com/imecoulter/coulterheiberger-com/issues/17) (asset delivery tooling) **is done**, having run off the numbered order — it was never on the critical path to the map's destination, being the tooling you need to publish real Projects. It landed `npm run assets`, `npm run publish`, the `Asset spec` CI gate, the Project collection, and three scaffold Projects on `main` behind the existing `noindex`.

Two things it deliberately did not settle, both for whoever builds the Project pages. The **framing question** from [#10](https://github.com/imecoulter/coulterheiberger-com/issues/10) — 21:9 and 4:5 art-directed crops against Astro's centre crop — is still fog; `assets` scaffolds the six fields and no focal-point field, because no page renders one yet. And the scaffold plates are synthetic, so they deliver roughly **5 KB of AVIF at 1600 px against the 43 KB §2 measured for a real Rendered Asset**. That costs nothing today, since no route renders a Project. It stops being free the moment one does: an LCP Path number measured against 5 KB heroes passes for the wrong reason.

---

## 1 — Repo visibility · [#7](https://github.com/imecoulter/coulterheiberger-com/issues/7)

**Sonnet 5 · high**

**Why first:** it is a one-way door, and the history is clean *right now* — 19 files, no assets, no secrets. Every commit that adds a Rendered Asset makes flipping public marginally more work to reason about. It is also the only unblocked ticket that gates another (#9).

**Before you start:** this ticket carries a decision that has not been made. Make it in the session.

```
/wayfinder https://github.com/imecoulter/coulterheiberger-com/issues/2 #7

Start with the go/no-go: public repo, or private on GitHub Pro. The facts are
already in the ticket — don't re-research them, put the recommendation to me and
let me answer. Then execute whichever way I decide, including the LICENSE, the
copyright notice on imagery, the branch ruleset on main, and the AGENTS.md
constraint that source-resolution Rendered Assets never enter git.
```

---

## 2 — Asset delivery spec · [#6](https://github.com/imecoulter/coulterheiberger-com/issues/6)

**Opus 5 · xhigh**

**Why here:** it is the first real decision and everything content inherits from it. It is also the ticket that tells you what to go render this week, so it converts planning into work you can do offline while later sessions wait.

**Blocked by** research #3, which must be closed first.

```
/wayfinder https://github.com/imecoulter/coulterheiberger-com/issues/2 #6

Read the findings on #3 before asking me anything. I want an export preset I can
set once in my 3D toolchain and stop thinking about — max dimension, format,
colour profile, naming, folder layout — plus the publish ritual written as steps.
Cadence: numbered rounds, one at a time, each question with your recommended
answer, then wait. Push back on anything that adds a step I'd have to remember.
```

---

## 3 — Content architecture · [#8](https://github.com/imecoulter/coulterheiberger-com/issues/8)

**Opus 5 · xhigh**

**Why here:** the Project schema is the hardest thing to change later — it is baked into every MDX file the moment content exists. Design direction is blocked on this because you cannot art-direct a page whose fields are undecided.

```
/wayfinder https://github.com/imecoulter/coulterheiberger-com/issues/2 #8

The non-Project content is the kind that goes on a public professional profile —
bio, experience, capabilities, contact. Design the Project schema like it's
expensive to change, because it is. Cut every speculative field: if I can't name
a page that renders it, it doesn't ship. Decide the Build Log's collection shape
too, but do not build it.
```

---

## 4 — Preview deploys · [#9](https://github.com/imecoulter/coulterheiberger-com/issues/9)

**Sonnet 5 · high**

**Why here:** low cognitive load, and it is genuinely useful from the moment design direction starts producing pages worth looking at on a phone. Slot it before session 5 for exactly that reason.

**Note:** Cloudflare's docs do not cover preview URLs for an assets-only Worker with no script. This is a prove-it-by-doing-it session, not a reading session.

**Known limitation — a preview deploy emits PRODUCTION `og:image` URLs.** Found while building the Social Card ([#32](https://github.com/imecoulter/coulterheiberger-com/issues/32)). `astro.config.mjs` hardcodes `site: 'https://coulterheiberger.com'`, and `Base.astro` resolves the card against it, so a preview's `og:image` points at production. **This is accepted, not a bug to fix.** Making `site` env-aware would also move the canonical URL and every sitemap entry onto the preview origin, which is a real SEO hazard in exchange for a cosmetic one.

To check a card on a preview deploy, skip the unfurl and open the file directly:

```
<preview-origin>/_astro/<hashed-filename>
```

The hashed filename is in the preview's own `og:image` tag — take the path, keep the preview origin. Third-party unfurl debuggers will show you production's card no matter what you paste, so they are not a check.

```
/wayfinder https://github.com/imecoulter/coulterheiberger-com/issues/2 #9

Prove it works before wiring it. Upload a version, open the preview URL, confirm
it serves the real site with the same trailing-slash and 404 behaviour as
production, and confirm it did NOT touch the production custom domain. Only then
wire the PR workflow. If assets-only previews turn out not to work, tell me and
record the fallback — don't leave it half-wired.
```

---

## 5 — Design direction · [#10](https://github.com/imecoulter/coulterheiberger-com/issues/10)

**Opus 5 · xhigh**

**Why here:** it unblocks both remaining decision tickets, and neither is answerable without it. This is the session where you bring precedent sites.

**Bring:** 3–6 precedent URLs, and for each, one sentence on what you want from it and one on what you don't.

```
/wayfinder https://github.com/imecoulter/coulterheiberger-com/issues/2 #10

Precedents: <paste URLs, with a line each on what you want and don't want>

Scope is one direction plus tokens, and a single throwaway page I can react to.
Not a design system. If you find yourself producing component inventories, stop.
Build the prototype early in the session so we're arguing about something real
instead of adjectives.
```

---

## 6 — Styling · [#11](https://github.com/imecoulter/coulterheiberger-com/issues/11) ✅ done

**Opus 5 · high**

**Outcome:** hand-written modern CSS, no Tailwind — decided by building the design both ways rather than from #4's minimal page, which turned out to be the wrong instrument. Spec at `docs/styling.md`; `docs/design-direction.md` reconstructed and committed with typography left open; `npm run check:css` added to `Verify and deploy`. Two corrections landed on the map, and #21 graduated out of the fog.

**Why here:** research #4 has already settled feasibility and cost; design direction has settled what the CSS actually has to do. What is left is a bounded judgement call, which is why this is `high` rather than `xhigh`.

```
/wayfinder https://github.com/imecoulter/coulterheiberger-com/issues/2 #11

Findings are on #4 and the tokens are on #10 — read both before asking me
anything. Argue it from what this specific design needs, not from general
Tailwind-vs-CSS positions. If Tailwind isn't earning its weight here, say so.
Either way, decide where the tokens live and how they're consumed.
```

---

## 7 — Perf gate · [#13](https://github.com/imecoulter/coulterheiberger-com/issues/13)

**Opus 5 · high**

**Outcome:** the gate is now LCP-Path-specific — `scripts/assert-lcp-path.mjs` sums transfer bytes finishing at or before observed LCP, `throttlingMethod` is `devtools`, `aggregationMethod` is `median`, and total page weight is demoted to a warn-level backstop. `npm run perf` is now three steps so the primary budget reports before the loose one. (**Renamed `npm run budget` in [#35](https://github.com/imecoulter/coulterheiberger-com/issues/35)**, which added the accessibility bar to the same Lighthouse run — the step gates two things now, and the old name mentioned one. Read `npm run perf` as `npm run budget` throughout this file.) **Both judgement calls landed in ADR-0002:** byte figures are over the wire, and the 2.5s clock binds at ~240 KB — less than half the 500 KB ceiling — so the timing assertion, not the byte budget, is what a hero image hits first. No threshold was raised.

**Note for later sessions — ~~`npm run budget` cannot run locally on Windows~~. Corrected by [#21](https://github.com/imecoulter/coulterheiberger-com/issues/21).** `npm run budget` as invoked does fail here, but the reason is narrower than "Lighthouse does not run on this machine", and the difference matters: **the audit completes and the LHR is generated**, then `chrome-launcher`'s `destroyTmp()` throws `EPERM` on Chrome's temp profile during teardown and `lhci collect` exits 1 having discarded good results.

`destroyTmp` returns early when it is given an explicit `userDataDir` — chrome-launcher only cleans up a temp dir it created itself. Launching with a profile directory you own skips the `rmSync` and the numbers come back. `scripts/research/lh-runner.mjs` on branch `research/typography-lcp-path` does exactly that and is otherwise identical to the gate (same `devtools` throttling, same median-of-3, LCP Path cut lifted verbatim from `scripts/assert-lcp-path.mjs`); it reproduced #13's own 300 KB fixture to **1 ms** (2872 vs 2871), which is what made a 93-run matrix affordable locally.

CI remains the source of truth, but local measurement is available and was wrongly written off here for two sessions.

**To assert locally as well as collect** ([#35](https://github.com/imecoulter/coulterheiberger-com/issues/35)): the same `userDataDir` launch produces an LHR you can feed to the real assertion config, which is how the accessibility bar was verified before it shipped. Write each LHR into `<repo>/.lighthouseci` named to match `/^lhr-\d+\.json$/`, then run `npx lhci assert --config=lighthouserc.cjs`. Both halves of that are load-bearing: `loadSavedLHRs()` filters on that exact filename pattern, and it reads from `<cwd>/.lighthouseci` **regardless of what `--lhr` points at** (`@lhci/utils/src/saved-reports.js:40`) — so `--lhr=<some other dir>` silently asserts against nothing and exits 0. Check the run count in the output; "0 URL(s), 0 total run(s)" means it found no LHRs, not that everything passed.

**Pulled forward, ahead of motion strategy.** This was scheduled late on the reasoning that a gate rewritten against a holding page gets rewritten again. Research #5 undercut that: it delivered verified working code rather than a direction, and it found **two live defects in the current config** — `aggregationMethod` defaulting to `optimistic`, so the gate passes on the best of three runs rather than the median, and the near-fold lazy-loading leak at Chrome's 1250 px threshold. Neither depends on design direction, and #12 is a bundle-cost decision against a hard budget, so it should not be taken against a gate that grades on its best run.

No blocking edge to drop — #10 closing cleared it. Verify with:

```
gh api repos/imecoulter/coulterheiberger-com/issues/13 \
  --jq .issue_dependencies_summary.blocked_by
```

**Note:** `npm run check:css` was added to `Verify and deploy` by session 6 and sits immediately before `npm run budget`. Leave it where it is; it is a separate gate on the design's hard rules, not part of the budget. ([#35](https://github.com/imecoulter/coulterheiberger-com/issues/35) gave it the token-contrast assertions as well, on the same reasoning — same input, same refusal posture.)

```
/wayfinder https://github.com/imecoulter/coulterheiberger-com/issues/2 #13

Findings are on #5 — the config block and the script are written and verified,
so apply them rather than re-deriving them. Two things need your judgement, not
transcription: re-baseline the LCP timing assertion, because devtools throttling
changes what it measures, and settle whether ADR-0002's 500 KB is over-the-wire
or uncompressed. Do not raise a threshold to make something pass — if a number
genuinely needs to move, it moves in ADR-0002 first, with a reason.
```

---

## 8 — Motion strategy · [#12](https://github.com/imecoulter/coulterheiberger-com/issues/12) ✅ done

**Opus 5 · xhigh**

**Outcome:** no animation library, no `ClientRouter` — each candidate built as its own site and measured against the 50 KB non-Exhibit budget, not quoted from vendor numbers. IntersectionObserver + CSS costs 195 B, inlined, zero extra requests; every library candidate (`motion/mini`, `motion`, GSAP, GSAP+ScrollTrigger+SplitText) loses on **requests, not bytes** — each ships a separate `_astro/*.js`, and 562.5 ms of throttled latency before it can even run lands squarely on the LCP Path. New hard rule: nothing on the first screen carries `data-anim`, since an off-screen/opacity-0 element isn't an LCP candidate and animating the hero would make LCP wait on script. The cross-fade shipped for 0 bytes via `@view-transition`. `prefers-reduced-motion` is the baseline, not a fallback — the animated path is the one that has to opt in. `ClientRouter` rejected: 5,494 B for one capability (`transition:persist`) v1 doesn't use. `Save-Data` compliance in ADR-0002 amended to be about what the page sends, since there's no server to vary on the header. Substrate landed on [PR #24](https://github.com/imecoulter/coulterheiberger-com/pull/24).

**Why here:** the hardest remaining decision, because it is a three-way trade against a hard 50 KB budget with a genuine platform-support cliff — Firefox stable does not ship `animation-timeline` at all. It also carries the `ClientRouter` question, where the honest answer may be "no router".

**Moved after the perf gate.** This is the ticket that most needs a trustworthy budget, and until session 7 lands the gate grades on the best of three runs. `docs/design-direction.md` now carries the motion vocabulary — rise, draw rule, wipe, with durations and the reduced-motion rule — so this session picks the tool for a decided vocabulary rather than inventing one.

```
/wayfinder https://github.com/imecoulter/coulterheiberger-com/issues/2 #12

Measure the real bundle cost of each candidate against the 50 KB non-Exhibit
budget — GSAP core is not the whole story once plugins land. Treat
prefers-reduced-motion as a first-class path, not a fallback. And give me a
straight answer on ClientRouter: the site is already ~80ms on full page loads,
so a router has to earn its place rather than be assumed.
```

---

## 9 — Launch checklist · [#14](https://github.com/imecoulter/coulterheiberger-com/issues/14) ✅ done

**Sonnet 5 · medium**

**Outcome:** infrastructure built, launch switch deliberately left unflipped. `noindex` stays on both pages — `/404` permanently per `docs/content-architecture.md`, `/` because it's still the placeholder page, not the launched site. Shipped: hand-written `public/robots.txt` referencing the sitemap (production had been serving Cloudflare's synthetic content-signals default in its absence); `@astrojs/sitemap`, filtered to exclude `/404/`; canonical URLs; Open Graph and Twitter card metadata with no image, since #21 hasn't resolved; Person JSON-LD on the homepage, CreativeWork per Project deferred until Project pages exist. `404.astro` previously hand-rolled its own `<head>` independently of `index.astro`; both now route through `Base.astro`, the one shared head component. Verified against the deployed preview on [PR #25](https://github.com/imecoulter/coulterheiberger-com/pull/25).

**Why last:** it is the ticket that stops launch being something you forget. Mechanical breadth, no judgement calls — which is what `medium` is for.

```
/wayfinder https://github.com/imecoulter/coulterheiberger-com/issues/2 #14

Work the whole list, don't stop at the noindex. Factor the duplicated <head> in
index.astro and 404.astro into one component while you're in there. Decide
deliberately whether the 404 keeps its noindex. Verify against the deployed site
before you call it done.
```

---

## After the map closes

The map's destination is a locked decision set and a working substrate — not a shipped site. Building v1's pages, writing its content, and producing the Rendered Assets are downstream and start here, with every architectural question already answered.

The items in the map's **Out of scope** section return only if the destination is redrawn — as a fresh effort, not a resumption of this one.

### Where it actually ended

The map closed after a final audit pass that verified every ticket's deliverables against `main` rather than against its own resolution comments. Twelve of thirteen checked out. What did not:

- **The launch switch had never worked.** `Base.astro` carried an unconditional `noindex` *in addition to* the conditional prop, so the documented switch — remove `noindex` from the page — would have changed nothing. Shipped by session 9 and live in production for both pages.
- **#21's findings had never reached `main`.** Every other closed ticket landed its doc; that one existed only on its research branch, and with it the only record of Montserrat's pricing.
- **This file claimed #21 was still open**, and carried a note about local perf measurement that #21 had disproved.
- **`404.astro` was outside the design** — pre-Datum scoped styles overriding a derived token and setting a fourth font family, on a live page.

None of these were visible from the tickets, which is the point: **a ticket's resolution comment records what a session decided, not what is true of `main` today.** The two drift, and they drifted here in the direction of "closed" being more optimistic than "shipped". If this repo grows another map, audit against the tree.

**The placeholder went live at the end of it** — `/` indexable, `/404` permanently not, one honest page saying the portfolio is in progress.
