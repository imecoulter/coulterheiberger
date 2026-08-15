# Portfolio

The personal portfolio site of Coulter Heiberger, an architectural visualization specialist. The site is itself a portfolio piece: its craft, speed, and construction are part of what it demonstrates.

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

### Site structure

**Project**:
A single piece of architectural visualization work presented on the site. A Project may include Rendered Assets and may — but usually does not — include an Exhibit.
_Avoid_: work, piece, case study, entry

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
