# Portfolio

The personal portfolio site of Coulter Heiberger, a technical artist. The site is itself a portfolio piece: its craft, speed, and construction are part of what it demonstrates.

**Scope.** The site is the portfolio of one independent practice. Everything presented on it is that practice's work; work done for an employer is out of scope. See [ADR-0004](./docs/adr/0004-the-site-presents-the-independent-practice.md).

## Language

### Visual work on the site

**Exhibit**:
A heavy, interactive real-time 3D piece that is itself a portfolio item — a model walkthrough, a geospatial globe. Route-scoped and loaded on explicit user action.
_Avoid_: demo, experience, viewer, scene

**Ambient Layer**:
The site-wide 3D-derived visual identity that gives the site cohesion across pages. Distinct from an Exhibit: it is decoration and atmosphere, never a portfolio item in its own right.
_Avoid_: background, hero, ambience, chrome

**Rendered Asset**:
Visual output produced offline in a 3D authoring toolchain and shipped as images or video — including multi-frame sequences driven by scroll. The Ambient Layer is built from these.
_Avoid_: static asset, image, still, pre-render

**Master**:
The source-resolution output of a 3D authoring toolchain, from which a Rendered Asset is made. Kept outside the repository; never shipped and never committed.
_Avoid_: original, raw, full-res, source image

**Gate**:
An explicit user action required before an Exhibit loads. Distinguishes a deliberate opt-in from an automatic load.
_Avoid_: trigger, lazy load, interaction

**Plate**:
One piece of work as it is presented on a page — the image or Exhibit together with the specification line that measures it. Every Plate carries the same metadata contract, so a competition still and a point-cloud viewer are the same kind of object and differ in subject rather than status. That equivalence is the site's central argument.
_Avoid_: card, tile, figure, slide

### Motion

**Registration**:
The one-time entrance of an element as it first enters the viewport — the site's only element-level
motion. It marks the arrival of a piece of information rather than performing for the visitor: it
never repeats on scroll back, and never applies to the first screen. The term is free because the
corner registration *marks* it might have collided with were cut as costume.
_Avoid_: reveal, fade-in, scroll animation, entrance effect

**Navigation Cross-fade**:
The brief cross-fade between two pages during an ordinary navigation. The site has no client-side
router — every navigation is a full page load, and the cross-fade is the browser's own, present
where it is supported and absent where it is not.
_Avoid_: page transition, view transitions, SPA navigation, routing

### Site structure

**Project**:
A single piece of work presented on the site: a real-time system, a rendered sequence, an interactive build. A Project may include Rendered Assets and may — but usually does not — include an Exhibit.
_Avoid_: work, piece, case study, entry

**Social Card**:
The image a link to the site unfurls into when it is shared. Two kinds, and they are made differently: a Project's is a build-time crop of its own hero, and the site-wide default is a typographic card authored once and built by `scripts/dev/`.
_Avoid_: OG image, preview image, thumbnail, share image

**Credit**:
A Project's provenance: where the work was done and for whom. Covers commissioned work made at a studio, work made for that studio's own client, and speculative work made for neither. Stated on every Project, without exception.
_Avoid_: client, studio, attribution, credits

**Build Log**:
Writing published on the site about the construction of the site itself. Part of the portfolio, not separate from it.
_Avoid_: blog, journal, notes, devlog

### Performance

**LCP Path**:
Everything required to paint a page's hero content. Budgeted strictly; the measure that governs whether the site feels fast. Measured as the over-the-wire bytes of every request finishing at or before observed LCP (`scripts/assert-lcp-path.mjs`).
_Avoid_: critical path, above the fold, initial load

**Post-LCP Media**:
Visual payload that streams after the LCP Path has painted. Uncapped in total size, but must never block interaction.
_Avoid_: lazy assets, deferred media
