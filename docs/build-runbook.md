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
| — | Typography (background agent) | [#21](https://github.com/imecoulter/coulterheiberger-com/issues/21) | research | — | — |
| 7 | Perf gate ✅ | [#13](https://github.com/imecoulter/coulterheiberger-com/issues/13) | task | Opus 5 | high |
| 8 | Motion strategy | [#12](https://github.com/imecoulter/coulterheiberger-com/issues/12) | grilling | Opus 5 | xhigh |
| 9 | Launch checklist | [#14](https://github.com/imecoulter/coulterheiberger-com/issues/14) | task | Sonnet 5 | medium |

Sessions 1–7 are done. **Perf gate and Motion strategy were swapped** — see session 7 for the reasoning. Everything else is strictly sequential.

[#21](https://github.com/imecoulter/coulterheiberger-com/issues/21) graduated out of the map's fog when [#11](https://github.com/imecoulter/coulterheiberger-com/issues/11) closed and the question became precisely stateable. It is a research ticket, so it runs as a background agent alongside the numbered sessions rather than taking a slot — but it gates the *choice* of typefaces, which in turn gates the OG/social image question and the last open section of `docs/design-direction.md`. Fire it early.

[#17](https://github.com/imecoulter/coulterheiberger-com/issues/17) (asset delivery tooling) is unblocked and unscheduled. It is not on the critical path to the map's destination — it is the tooling you need to publish real Projects, which is downstream work — so it is deliberately left out of the order above.

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

**Outcome:** the gate is now LCP-Path-specific — `scripts/assert-lcp-path.mjs` sums transfer bytes finishing at or before observed LCP, `throttlingMethod` is `devtools`, `aggregationMethod` is `median`, and total page weight is demoted to a warn-level backstop. `npm run perf` is now three steps so the primary budget reports before the loose one. **Both judgement calls landed in ADR-0002:** byte figures are over the wire, and the 2.5s clock binds at ~240 KB — less than half the 500 KB ceiling — so the timing assertion, not the byte budget, is what a hero image hits first. No threshold was raised.

**Note for later sessions:** `npm run perf` cannot run locally on Windows. `chrome-launcher` throws `EPERM` removing Chrome's temp profile after every Lighthouse run, so `lhci collect` exits 1 with no LHRs written. CI is `ubuntu-latest` and unaffected; this is the machine, not the config. To measure locally, run the `lighthouse` CLI directly with `--output-path` — results are saved before the failing cleanup.

**Pulled forward, ahead of motion strategy.** This was scheduled late on the reasoning that a gate rewritten against a holding page gets rewritten again. Research #5 undercut that: it delivered verified working code rather than a direction, and it found **two live defects in the current config** — `aggregationMethod` defaulting to `optimistic`, so the gate passes on the best of three runs rather than the median, and the near-fold lazy-loading leak at Chrome's 1250 px threshold. Neither depends on design direction, and #12 is a bundle-cost decision against a hard budget, so it should not be taken against a gate that grades on its best run.

No blocking edge to drop — #10 closing cleared it. Verify with:

```
gh api repos/imecoulter/coulterheiberger-com/issues/13 \
  --jq .issue_dependencies_summary.blocked_by
```

**Note:** `npm run check:css` was added to `Verify and deploy` by session 6 and sits immediately before `npm run perf`. Leave it where it is; it is a separate gate on the design's hard rules, not part of the budget.

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

## 8 — Motion strategy · [#12](https://github.com/imecoulter/coulterheiberger-com/issues/12)

**Opus 5 · xhigh**

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

## 9 — Launch checklist · [#14](https://github.com/imecoulter/coulterheiberger-com/issues/14)

**Sonnet 5 · medium**

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
