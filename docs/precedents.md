# Precedent sites

Quick-reference list of the 20 sites reviewed while resolving
[Design direction (#10)](https://github.com/imecoulter/coulterheiberger-com/issues/10). Facts below
are **live-verified** (computed styles, font faces, LCP via `PerformanceObserver`, canvas contexts,
scroll mechanism, ground sampled at 4–9 scroll depths) unless marked *(screenshot only)*, meaning it
was judged from a single static image and hasn't been checked against the live site.

Full analysis, corrections, and the direction they informed: `design-direction-potential.md` (private,
not in this repo — see #10's resolution comment for the reasoning in full).

---

## Dark cinematic chrome

| Site | Ground | Type | Scroll | LCP | Notes |
|---|---|---|---|---|---|
| [Luxigon](https://www.luxigon.com/) | `#000` | Helvetica Neue + **Garamond Pro** + DIN Condensed | native | **GIF, 1MB, 648ms** | Squarespace. One image on the page. |
| [Brick Visual](https://www.brickvisual.com/) | `#000` | custom "Brick" + **Playfair** (serif) + Syne + Work Sans | **Lenis** | video, 3580ms | Four families. Full-viewport autoplay hero. 3px radius. |
| [Active Theory](https://activetheory.net/) | `#000` | nbarchitekt (one face) | n/a — no doc scroll | canvas | Single full-viewport **WebGL2 canvas, zero `<img>`**. The trap: nothing to reuse structurally. |
| [Resn](https://resn.co.nz/) | dark | — | — | — | *(screenshot only)* |
| [Lama Lama](https://lamalama.com/) | dark | mono-caps labels, rounded glass panels | — | — | *(screenshot only)* |
| [Neoscape](https://neoscape.com/) | `#000` | Plus Jakarta Sans + **Fragment Mono** (40 els) + Nunito | native | **H1 text, 1284ms** | 8px/25px pill radii, 3 shadows. Mono-label + big-grotesk pairing already exists here. |
| [DBOX](https://dbox.com/) | navy (not near-black) | wide-tracked sans caps | — | — | *(screenshot only)* — "navy-and-serif" read is wrong; no serif seen. |

## Swiss editorial on light

| Site | Ground | Type | Scroll | LCP | Notes |
|---|---|---|---|---|---|
| [MIR](https://www.mir.no/) | `#FFF` | Nimbus Sans + **Sabon Next** (serif) | **native** (ScrollSmoother loaded, never instantiated) | **IMG, 716ms** | 98 images, 44 hover-videos on index. Project page: full-bleed render + floating white metadata card. |
| [Vibor](https://vibor.it/) | **`#0C0C0C`** for top ~40%, inverts to `#E5E5E5`/`#F0F0F0` | Formular + Canela (**display serif**, 43px, not prose) | native | IMG (small) | Dark-first, not light — misfiled in the original cluster read. |
| [Bruno Arizio](https://brunoarizio.com/) | `#FFF` | HelveticaNowText only, **no serif** | Lenis, `scrollHeight === innerHeight` (no doc scroll) | **10.6s** | Left thumbnail-index rail + registered plate on black. The rail precedent. |
| [Studio Feixen](https://www.studiofeixen.ch/) | `#F8F8F8` | one proprietary family | **Locomotive** | **video, 3180ms** | 5px radius on 44 elements, 7 shadows. |
| [Kilograph](https://kilograph.com/) | `#FFF`, hero band pure **`#FFEF00`** | poppins + **ivyjournal** (serif) | native | **H2, 712ms** | 100px pill radii. Yellow is a full-bleed field, not an "accent." |

## Soft render-world

| Site | Notes |
|---|---|
| [Unseen](https://unseen.co/contact/) | *(screenshot only)* |
| [Léo Parpeix](https://www.leoparpeix.com/) | *(screenshot only)* — Work/Playground split |
| [Lusion](https://lusion.co/) | **Zero `<img>` elements.** Fixed full-viewport WebGL2 canvas from first paint, custom cursor. No poster — "hero poster → gating" is not what it does. |

## Diegetic novelty

| Site | Notes |
|---|---|
| [Henry Heffernan](https://henryheffernan.com/) | *(screenshot only)* |
| [Shopify Winter '26](https://www.shopify.com/editions/winter2026) | **Two live WebGL2 contexts coexisting on one route** — Lenis, **6.3s LCP**, 54,069px document. Exactly what ADR-0002 forbids; the look is worth wanting, the method isn't. |

## Image-first archviz, thin UI

| Site | Ground | Type | LCP | Notes |
|---|---|---|---|---|
| [Recent Spaces](https://www.recentspaces.com/) | `#FFF` | aktiv-grotesk + **freight-big-pro** (serif) + DIN Condensed + Futura | DIV (image bg) | Squarespace. Already the grotesk/serif pairing later proposed as a differentiator. |
| [Beauty & The Bit](https://beautyandthebit.com/) | white | serif italic + sans | — | *(screenshot only)* |

---

## Facts worth remembering without re-reading the analysis

- **Light ground + grotesk/serif pairing is not a differentiator** — Recent Spaces, MIR, Kilograph,
  and Beauty & The Bit all already do it.
- **Mono spec-labels + big grotesk is already Neoscape's and Lama Lama's move**, not a gap.
- **The left metadata rail is Bruno Arizio's structure.** It also correlates with a 10.6s LCP and zero
  document scroll — not a look worth the coincidence.
- **ADR-0002's LCP rule holds up empirically**: every site whose LCP is a canvas or video is slow
  (Arizio 10.6s, Shopify 6.3s, Feixen 3.2s); every site whose LCP is a poster image or text is fast
  (MIR 716ms, Kilograph 712ms, Neoscape 1284ms).
- **Two WANTs in the original brief were wrong**: Lusion has no poster at all (zero `<img>`), and
  Shopify's ambient layer is live WebGL, not Rendered Assets.
- **Vibor is dark-first**, not an example of "Swiss editorial on light."
