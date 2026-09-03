# Search registration

External account state: which search properties exist, how they are verified, and how to redo it.

Everything here is **outside this repository** and cannot be asserted by any gate. That is the whole
reason the file exists — the rest of `docs/` describes things CI can check, and this describes things
only a person looking at a dashboard can confirm.

**Not in scope:** rankings, queries, impressions, Core Web Vitals field data. Those live in the
consoles, they change daily, and a document restating them is wrong within a week. This file records
*configuration*, which changes approximately never.

For what the site itself asserts about identity, see
[`content-architecture.md` §7](./content-architecture.md#7-the-identity-graph) and
[ADR-0012](./adr/0012-the-identity-graph-has-one-anchor.md).

---

## State

| Property | Kind | Verification | Status |
| --- | --- | --- | --- |
| `coulterheiberger.com` | Google, Domain | DNS `TXT` on the apex | Verified |
| `coulterjheiberger.com` | Google, Domain | DNS `TXT` on the apex | Not created |
| `coulterheiberger.com` | Bing | Imported from Google | Not imported |

The live verification record on the apex:

```
TXT  @  google-site-verification=3utZ6OK1XAow3Kd3IJQXc3xcupFwP4-RAroQpHAmGko
```

DNS for both domains is managed in **Cloudflare**, not in this repo (`AGENTS.md`).

---

## Why a Domain property and not a URL-prefix property

A Domain property is verified by DNS and covers every subdomain and both protocols at once. A
URL-prefix property covers exactly one origin string, so `https://` and `http://`, and apex and
`www`, are separate properties that each need verifying and each report separately.

This site serves one origin, so the practical difference is small today — but the Domain property
cannot be wrong about which origin it is watching, and it survives anything that changes how the site
is served. It is also the one that keeps reporting if a subdomain is ever added.

The cost is that it must be verified by DNS. There is no file or meta-tag route to a Domain property.

## Why verification is DNS and not a meta tag

Google will verify by an HTML file at the site root or a `<meta>` tag in `<head>`. Both were rejected.

A meta tag would sit in `Base.astro` and therefore ship on **every page** — bytes on the LCP Path
(ADR-0002) forever, to prove a thing once. Both file and tag also tie the property's continued
verification to the deployment: a build that drops the file silently un-verifies the property, and
the failure surfaces weeks later as missing data rather than as a broken build.

The TXT record is one line in Cloudflare, verifies the whole domain, costs the site nothing, and does
not depend on what the repo happens to emit today.

---

## Remaining steps

### 1. Submit the sitemap

Google discovers `sitemap-index.xml` from `robots.txt` on its own. Submitting it explicitly is still
worth doing once, because the Sitemaps report is the only place that tells you Google *parsed* it and
how many URLs it took — a sitemap that is silently rejected looks identical to one nobody has crawled
yet.

1. Search Console → property `coulterheiberger.com` → **Indexing → Sitemaps**
2. Enter `sitemap-index.xml` → **Submit**
3. Expect `Success` and a discovered-URL count. It should read **8**: `/`, `/about/ime/`, and six
   Projects. `/404` is filtered out in `astro.config.mjs` and must not appear.

If the count is not 8, the sitemap and the routes have diverged — check `astro.config.mjs`'s sitemap
filter before touching anything in the console.

### 2. Import into Bing

Bing Webmaster Tools imports the property and its sitemaps from Google, which is the whole
registration in one OAuth step.

1. [bing.com/webmasters](https://www.bing.com/webmasters) → sign in
2. **Import** (the Google Search Console panel on the "Add a site" screen)
3. Authorise → select `coulterheiberger.com` → **Import**

Verification and sitemaps come across with it. Nothing needs adding to this repo.

**IndexNow was considered and refused.** It is Bing's push-notification protocol and Cloudflare
offers it as a zone-wide toggle, so it looks free. It solves "content changes faster than crawlers
notice", and this is eight static URLs that change a few times a year. Cloudflare's implementation
also fires on *cache* events, which is a noisy proxy for publication.

### 3. Add the second domain

`coulterjheiberger.com` 301s to the canonical domain via a Cloudflare dynamic redirect ruleset on
that zone (`wrangler.jsonc`). The redirect already does the consolidation work — this property is
**diagnostic only**: it is how you would see whether Google has processed the move and whether
anything still links to the old domain.

1. Search Console → property switcher → **Add property** → **Domain** → `coulterjheiberger.com`
2. Google shows a `TXT` record. Copy it.
3. Cloudflare → zone `coulterjheiberger.com` → **DNS** → **Add record**
   - Type `TXT`, Name `@`, Content: the value Google gave
   - There is already an SPF `TXT` on `@`. **Add a second record; do not edit the existing one.**
     Multiple `TXT` records on one name is normal and correct.
4. Back in Search Console → **Verify**

DNS propagation is usually under a minute on Cloudflare. If verification fails, wait and retry before
assuming the record is wrong.

---

## If verification ever breaks

A Domain property un-verifies only if the TXT record is removed. Google rechecks periodically and
emails before dropping the property.

To re-verify: Search Console → **Settings → Ownership verification** → copy the record → re-add it in
Cloudflare DNS. The token is stable per property, so the record above is the one to restore for the
canonical domain.

**Do not delete the property to recreate it.** All historical performance data is attached to it and
does not survive.

## Confirm the identity edges still point back

The `sameAs` edges in the Identity Graph are only strong while they are reciprocal, and nothing in
this repository can check the far end. Worth a glance whenever either profile is edited:

- **LinkedIn** → Contact info → Website reads `coulterheiberger.com`
- **GitHub** ([`imecoulter`](https://github.com/imecoulter)) → profile Website field reads
  `coulterheiberger.com`

Both were true when this file was written. If one is cleared, the site keeps building and the graph
keeps validating; the edge just quietly stops corroborating anything.
