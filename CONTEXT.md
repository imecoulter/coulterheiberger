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

**The site moves in two ways and they are one device**: an element enters once as it arrives, and two
elements reveal a label under a pointer. Both are an `opacity` change and an 8px rise, `ease-out`, at
the same duration. Nothing transitions between pages, nothing parallaxes, and nothing scrubs with
scroll position.

**Registration**:
The one-time entrance of an element as it first comes into view: `opacity` 0 to 1 with an 8px
`translateY`, 760ms `ease-out`, staggered 60ms apart in groups of four. It fires once, never
re-triggers on scroll back, and covers the first screen as well as everything below it
([ADR-0010](./docs/adr/0010-registration-returns.md)). Gated on `prefers-reduced-motion:
no-preference` only, never on `hover` — a phone scrolls. The first screen registers from a CSS
keyframe with no script on the path; below the fold, one `IntersectionObserver` adds the class once
and stops watching.
_Avoid_: reveal (that is the pointer device below), fade-in, scroll animation, entrance effect,
scroll reveal, AOS

**The reveal** is the other one: on `/`, a Plate reveals its metadata and the Masthead portrait
reveals its `About` label, on `:hover` and `:focus-within`. Each fades its scrim in over 760ms and
rises its text 8px into it 60ms behind, out at 480ms, gated on `hover: hover` and
`prefers-reduced-motion: no-preference`
([ADR-0008](./docs/adr/0008-the-index-arrangement-and-one-spacing-atom.md),
[ADR-0009](./docs/adr/0009-the-two-reveals-are-timed.md)). **The reveal is the device and the device
is the boundary** — a third element revealing a label this way is the same decision again; anything
that moves for another reason is a new one and needs the direction amended first.

Registration was one of five terms removed in one pass and is the only one that came back; its
removal was argued on performance headroom rather than on fit. **Navigation Cross-fade**, **Carry**,
**Traverse** and the Expanded View's fade name behaviours that are still removed, and they are kept
with their specs and measurements in `docs/motion.md`. Use those three if any of it is rebuilt; do
not use them to describe the site as it stands.

**Overscan**:
The part of a Plate's wide crop that falls outside the band it is shown in: the wide tier is cut 16:9
and shown 21:9, so the crop is looser than the band on purpose. It exists because the Traverse
travelled through it, and it currently has no consumer — kept deliberately, so that rebuilding that
move is a CSS change rather than a re-encode of every wide variant. Not a mistake in the crop, and
not slack to be tightened.
_Avoid_: bleed, margin, padding, slack, extra crop

### Colour

**Ground**:
The colour the site is on, and the reference the ink, the rule and the muted tint are all derived from. There is one, it is dark, and the site ships no light alternative and no visitor-facing switch. Two grounds and a band that inverted between them were how the site was built until [ADR-0007](./docs/adr/0007-one-dark-ground.md); the terms *day* and *night* belong to that model and are not used.
_Avoid_: background, theme, mode, dark mode, night, day, palette

### Site structure

**Project**:
A single piece of work presented on the site: a real-time system, a rendered sequence, an interactive build. A Project may include Rendered Assets and may — but usually does not — include an Exhibit.
_Avoid_: work, piece, case study, entry

**Masthead**:
The site's own identity block, at the head of the index and above the first Plate: who the practice is, what it does, and the practice's own specification line. Deliberately **not** a Plate — it holds no Project and enters no metadata contract — but it is measured against the same datum, because a specification line is what the datum is. It is two columns, text then face, sharing the Plates' left datum edge without being the same kind of object.
_Avoid_: about card, bio, hero, intro, banner, plate

**Plate**:
A Project as it is presented: one image and one specification line, a single unit. Every piece of work on the site is a Plate under an identical metadata contract, so plates differ in subject rather than in status. On the index every Plate is the same size, one per row, and the metadata is revealed on the image rather than set beside it; a collage of differing sizes was built and reverted, and [ADR-0008](./docs/adr/0008-the-index-arrangement-and-one-spacing-atom.md) holds it. The index and the detail page show the same Plate in two presentations, not two different objects.
_Avoid_: card, tile, thumbnail, item, hero, cell, bento

**Expanded View**:
A single Frame shown at the size of the window, over the rest of the page blurred back. Opened by the
visitor and closed by them; it is a way of looking at one Frame, not a gallery mode, so it holds no
sequence, no next and previous, and no state the page keeps afterwards. It appears and disappears
instantly — the blur is a static effect, not a move.
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
