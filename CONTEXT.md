# Portfolio

The personal portfolio site of Coulter Heiberger, a technical artist. The site is itself a portfolio piece: its craft, speed, and construction are part of what it demonstrates.

**Scope.** The site is the portfolio of one independent practice. Everything presented on it is that practice's work; work done for an employer is out of scope. See [ADR-0005](./docs/adr/0005-the-site-presents-the-independent-practice.md).

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

**Framing**:
The composition decision a Rendered Asset carries so that a crop recomposes the image rather than cutting it. Stated per asset, because it cannot be derived from the file.
_Avoid_: focal point, crop hint, gravity, anchor, art direction

**Gate**:
An explicit user action required before an Exhibit loads. Distinguishes a deliberate opt-in from an automatic load. A visitor performs a Gate; CI does not have one.
_Avoid_: trigger, lazy load, interaction, CI check, gate (for a build check)

### Motion

**Registration**:
The one-time entrance of an element as it first enters the viewport. It marks the arrival of a piece
of information rather than performing for the visitor: it never repeats on scroll back, and never
applies to the first screen. Scoped hard at review to a piece of writing arriving — the Plates on `/`
used to register and no longer do, because a page made of six Plates that announces each one is
performing whatever the marks are called. The term is free because the corner registration *marks* it
might have collided with were cut as costume.
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

**Traverse**:
The pointer-driven travel of a Plate's wide image beneath the cursor, on the index only. A fourth
motion category, and the only one a visitor drives directly: Registration and the Carry happen to
them, the Traverse happens because of them. It moves on both axes and it is deliberately slight —
vertically through the Overscan, horizontally through a small constant enlargement, since the
Overscan is vertical only. Present only where hover and a fine pointer are real, and absent under
`prefers-reduced-motion: reduce`.
_Avoid_: parallax, hover effect, tilt, holographic, pan

**Overscan**:
The part of a Plate's wide crop that falls outside the band it is shown in. It exists so the
Traverse has somewhere to go: a file cut to exactly the ratio it is displayed at hides nothing, so
the wide crop is cut looser than the band on purpose. Not a mistake in the crop, and not slack to be
tightened.
_Avoid_: bleed, margin, padding, slack, extra crop

### Site structure

**Project**:
A single piece of work presented on the site: a real-time system, a rendered sequence, an interactive build. A Project may include Rendered Assets and may — but usually does not — include an Exhibit.
_Avoid_: work, piece, case study, entry

**Plate**:
A Project as it is presented: one image and one specification line, a single unit. Every piece of work on the site is a Plate under an identical metadata contract, so plates differ in subject rather than in status. The index and the detail page show the same Plate in two presentations, not two different objects.
_Avoid_: card, tile, thumbnail, item, hero

**Expanded View**:
A single Frame shown at the size of the window, over the rest of the page blurred back. Opened by the
visitor and closed by them; it is a way of looking at one Frame, not a gallery mode, so it holds no
sequence, no next and previous, and no state the page keeps afterwards.
_Avoid_: lightbox, modal, overlay, popup, zoom

**Frame**:
A single Rendered Asset as composed into a Project page — one image among the several a Project shows. A Project has one Plate and many Frames, and the Plate's image is the first of them. Finished renders and working images alike are Frames: the difference between them is made in prose, never in status.
_Avoid_: plate (for one image), image, slide, gallery item, shot

**Specification Line**:
The line of technical facts a Plate carries: what the work was made with. Authored per Project rather than derived, because the facts worth reading are not recoverable from the files. Distinct from a Credit, which states provenance rather than construction — every Plate carries both, and they answer different questions.

It used to read "what the work was made with, at what size, at what cost". Resolution was cut in review: a viewer judges an image by how sharp it looks, not by a number claiming it, and ADR-0006 records that the number was also the one fact on the line that could not be verified from anything in the repository. Cost was never shipped. What remains is the toolchain, which is the half nothing else on the page says.
_Avoid_: caption, metadata, credits, tagline, subtitle, spec sheet

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

**Served Document**:
The document as a visitor receives it, after edge transforms. May differ from the build output.
_Avoid_: the HTML, production, dist, output
