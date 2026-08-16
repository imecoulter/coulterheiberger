---
status: accepted
date: 2026-08-16
---

# Measurement: the beacon is committed, and there is no field CWV programme

[Issue #33](https://github.com/imecoulter/coulterheiberger-com/issues/33) asked whether to *add*
real-user measurement. The premise was stale. A Cloudflare Web Analytics beacon had been live on
production since **2026-08-10**, injected at the edge by an `auto_install` ruleset — 11,364 B of
third-party JavaScript on every page, invisible to the repository and to CI. The real questions were
whether to keep it and how to stop the repo from lying about what the site ships.

We **keep the beacon for visitor analytics, refuse a field Core Web Vitals programme, and move the
beacon out of edge injection into a committed snippet in `Base.astro`** so the performance gate
measures the bytes visitors actually receive.

## The standing rule

**If it's on the wire, it's in the repo.**

Anything a visitor's browser executes is committed source, gated in CI like every other byte. Edge
injection, dashboard toggles that rewrite HTML, and "it's only analytics" are not exemptions. The
site's claim is that it is fast and that its construction is part of the portfolio; both are void if
the served document and the built document differ. This is why the [Served Document](../../CONTEXT.md)
is now a named term.

## Why no field CWV programme

The obvious reading of #33 — "the lab budget is unvalidated, so validate it in the field" — is
wrong here, for three reasons that compound.

**ADR-0002's budget is a craft standard, not an empirical target.** It exists to bound what this site
is willing to spend, not to predict what visitors tolerate. So field data cannot loosen it. If RUM
showed a comfortable p75 LCP on real devices, the ~220 KB hero crossover would not move a byte —
the number is a decision about the work, not a hypothesis about the audience. A measurement that
cannot change an outcome is not worth its request.

**Nothing field CWV could show would produce a pull request.** The site is a placeholder with no
Exhibits and a single hero. The lab gate already fails the build on the regressions that are
reachable today, at the moment they are introduced, on the PR that introduces them. Field data would
arrive weeks later, aggregated, unattributable to a commit.

**CrUX is not available and will not become available.** Eligibility needs public discoverability —
which the site passes — *and* an undisclosed minimum sample count, which a personal portfolio will
not clear. So the free, zero-byte option is not on the table, and the paid-in-bytes option is
answering a question we have just established we would not act on.

**The reopen trigger is the first Exhibit.** That is the one case the lab instrument is structurally
blind to. Lighthouse under `devtools` throttling throttles the *network*; an Exhibit's risk is GPU,
thermal, and main-thread on a real mid-tier phone — none of which a throttled desktop Chrome on a CI
runner can see. When an Exhibit ships, reopen this. Because the beacon stays, CWV field data will
already have months of history by then, at no additional cost.

## Why the beacon stays anyway

Not for performance. For **visitor analytics** — referrer, path, page views. All three zones are on
the **Free Website** plan, where zone Analytics reports requests, bandwidth, unique visitors and
country, with crawlers included; page views, visits, referer host and path are Pro-and-above. The
beacon is the only source of that data on this plan. CWV rides along for free and is the raw
material for the Exhibit trigger above.

## What moving it to a committed snippet buys

`lighthouserc.cjs` asserts `resource-summary:script:size` at `error`. Because the site's only
JavaScript is inline, that row has been reading **0** — an assertion passing vacuously. The
committed beacon is a real request, so the row now asserts ~11,340 B on every PR and the gate starts
doing the job its comment claims.

Three sub-decisions, all deliberate:

- **It ships unconditionally** — no `import.meta.env.PROD` branch. Cloudflare validates the
  telemetry `POST` by postfix hostname match, so `localhost` and `*.workers.dev` previews are
  rejected at the server. CI and preview deploys therefore *measure* the script's cost without
  reporting telemetry, which is exactly the split we want: the gate sees the bytes, the analytics
  see only production.
- **It counts against the 50 KB. No carve-out.** The beacon is 22% of the JS budget and 58× the
  site's 195 B inline script ([#12](https://github.com/imecoulter/coulterheiberger-com/issues/12)).
  Exempting it would make the budget a number about code we happen to have written rather than about
  what the visitor downloads. A future React island now prices itself against a budget the beacon has
  already spent a fifth of — which is the correct pressure, not an accounting inconvenience.
- **Pre-commitment: if the gate goes red, the beacon goes.** Not the threshold, not hero bytes. This
  is recorded before the first red build precisely because the argument for raising 50 KB will be
  more persuasive in the moment than it is now.

## Considered options

**Remove the beacon; keep the site pure.** The strongest alternative, and it was close. Zero
third-party JavaScript is a defensible portfolio position, and 11 KB is real. Rejected because the
Free plan then leaves *no* referrer or path data at all, and because #33's own reopen trigger — the
first Exhibit — is much better served by field CWV history that already exists than by a beacon
installed the week the Exhibit ships. Reconsider if the site ever stops needing visitor analytics, or
if the zone moves to a plan whose own analytics cover referrer and path.

**Leave it edge-injected and exempt it from the budget.** Rejected outright. It is the state that
produced this ADR: bytes on the wire that the repository cannot see, a CI gate grading a document no
visitor receives, and a `resource-summary:script:size` row asserting nothing.

**Ship it only in production, behind `import.meta.env.PROD`.** Rejected. It would restore the exact
blindness this ADR removes — the gate would measure a build that is not the build visitors get, and
the 50 KB assertion would go back to reading 0 on every PR.

## Consequences

- **The telemetry `POST` moves from same-origin `/cdn-cgi/rum` to `cloudflareinsights.com/cdn-cgi/rum`.**
  Accepted cost of the move. It is one more cross-origin request after load, off the LCP Path, and it
  makes the third-party relationship honest rather than hidden behind a first-party path.
- **EU visitors are now measured.** The `auto_install` ruleset carried `lite: true`, which suppressed
  injection for EU visitors. A committed snippet has no such switch — it ships to everyone. Cloudflare
  Web Analytics sets no cookies and stores no cross-site identifiers, so this does not create a consent
  obligation, but it *is* a behavioural change from what production did before this ADR.
- **Edge injection is off, and turning it off took three changes, not one.** Done before this landed,
  deliberately: merging first would have double-injected the beacon and double-counted every page
  view. The site was briefly unmeasured, which on a placeholder costs nothing. Setting
  `auto_install: false` on the site — the documented switch, and what the dashboard's "manual setup"
  does — **persisted but did not stop injection**. The edge kept rewriting until the ruleset's
  wildcard rule was paused *and* `ruleset.enabled` was set `false`:

  ```
  PUT /accounts/{account}/rum/site_info/{site_tag}          { auto_install: false, enabled: false, zone_tag }
  PUT /accounts/{account}/rum/v2/{ruleset}/rule/{rule_id}   { host: "*", paths: ["*"], inclusive: true, is_paused: true }
  ```

  Verified by fetching the Served Document with browser headers until the beacon disappeared —
  roughly a minute of propagation. Note that a bare `curl` reports success immediately and falsely
  (see `scripts/check-served-document.mjs`), and that a zone cache purge does *not* help: Workers
  static assets answers from its own cache and returns `CF-Cache-Status: HIT` straight through it.
  Disabling the ruleset does not stop the site accepting telemetry — the `site_token` governs that,
  which is why manual-install sites work with no ruleset at all.
- **The site no longer has "exactly one `<script>`".** `docs/styling.md` and `AGENTS.md` are amended
  to say *one authored script*. The distinction is now load-bearing: authored behaviour still has one
  home in `Base.astro`, and a second one still requires amending `docs/design-direction.md`. A
  third-party measurement script is a different category, governed by this ADR.
- **The performance gate now depends on the public internet, and says so.** `lighthouserc.cjs`
  collects against a local static server, but the beacon is fetched from
  `static.cloudflareinsights.com`. If that host is unreachable, `resource-summary:script:size` would
  read 0 and **pass** — the vacuous gate this ADR exists to end, reintroduced by an outage and
  invisible, because `lhci assert` prints only failures. So `scripts/assert-lcp-path.mjs` asserts a
  floor: the beacon must appear in the network records of every run. LHCI 0.15 has no
  `minNumericValue`, which is why the floor cannot live in the rc file beside the ceiling it guards.
  A hard failure is the right outcome — a deploy whose JS budget nothing verified is not one worth
  shipping.
- **A post-deploy check now blocks the deploy** if the Served Document's script inventory differs from
  the built one. That is the rule at the top of this ADR turned into a gate — without it, nothing stops
  a future dashboard toggle from re-opening the exact hole this ADR closes.
