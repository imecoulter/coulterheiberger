# Portfolio

The personal portfolio site of Coulter Heiberger, an architectural visualization specialist. The site is itself a portfolio piece: its craft, speed, and construction are part of what it demonstrates.

## Language

### Visual work on the site

**Exhibit**:
A heavy, interactive real-time 3D piece that is itself a portfolio item — a model walkthrough, a geospatial globe. Route-scoped and loaded on explicit user action.
_Avoid_: demo, experience, viewer, scene

**Ambient Layer**:
The site-wide 3D-derived visual identity that gives the site cohesion across pages. Distinct from an Exhibit: it is decoration and atmosphere, never a portfolio item in its own right.
_Avoid_: background, hero (for the Ambient Layer), ambience, chrome

**Rendered Asset**:
Visual output produced offline in a 3D authoring toolchain and shipped as images or video — including multi-frame sequences driven by scroll. The Ambient Layer is built from these.
_Avoid_: static asset, image, still, pre-render

**Master**:
The source-resolution output of a 3D authoring toolchain, from which a Rendered Asset is made. Kept outside the repository; never shipped and never committed.
_Avoid_: original, raw, full-res, source image

**Gate**:
An explicit user action required before an Exhibit loads. Distinguishes a deliberate opt-in from an automatic load.
_Avoid_: trigger, lazy load, interaction

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

**Carry**:
The continuity of a single Plate's image across a Navigation Cross-fade: it holds its position and
its scale while the rest of the page fades. A third motion category alongside Registration and the
Cross-fade, and the one place on the site where an element scales. Absent under
`prefers-reduced-motion: reduce`, and absent wherever the Cross-fade itself is.
_Avoid_: morph, shared element, hero transition, magic move

### Site structure

**Project**:
A single piece of architectural visualization work presented on the site. A Project may include Rendered Assets and may — but usually does not — include an Exhibit.
_Avoid_: work, piece, case study, entry

**Plate**:
A Project as it is presented: one image and one specification line, a single unit. Every piece of work on the site is a Plate under an identical metadata contract, so plates differ in subject rather than in status. The index and the detail page show the same Plate in two presentations, not two different objects.
_Avoid_: card, tile, thumbnail, item, hero

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
