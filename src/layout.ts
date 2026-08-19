/* The layout measures, read from the one place they are declared.

   docs/styling.md's rule is that a component never hard-codes a value a token
   names. `sizes` is the case where obeying that rule is not enough: the
   attribute is HTML, so it cannot say `var(--body-col)`, and a hand-copied
   number in the markup drifts from the CSS *silently* — the layout still looks
   correct and the browser simply fetches the wrong width. On the index that
   lands on the LCP Path; in the gallery it lands on Post-LCP Media, the one
   tier ADR-0002 leaves uncapped, which is precisely where nobody is looking.

   So the tokens are parsed out of src/styles/tokens.css at build time and every
   `sizes` string below is composed from them. Rename or re-unit a token and
   this file throws during the build instead of over-fetching in production.

   The file arrives through Vite's `?raw`, not through node:fs. Reading it off
   disk with import.meta.url fails in the real build: this module is bundled into
   dist/.prerender/ first, so the relative path resolves next to the BUNDLE and
   the build dies with ENOENT. `?raw` is resolved by Vite at transform time, so
   the string is inlined and the dependency is one Vite knows about — which also
   means editing a token re-runs this in dev instead of serving a stale number.

   This is build-time only. Nothing here reaches the client. */
import css from './styles/tokens.css?raw';

/** Every px value declared for `token`, in source order. */
function pxAll(token: string): number[] {
  const found = [...css.matchAll(new RegExp(`${token}\\s*:\\s*(-?[\\d.]+)px`, 'g'))].map((m) =>
    Number(m[1]),
  );
  if (found.length === 0) {
    throw new Error(
      `layout.ts — ${token} is not declared as a px value in src/styles/tokens.css. ` +
        `The sizes attributes are composed from these tokens; fix the token or this file, ` +
        `never by writing the number into a component.`,
    );
  }
  return found;
}

const px = (token: string) => pxAll(token)[0];

/** The viewport switch. tokens.css already turns --gutter and --rhythm over
    here; docs/design-direction.md's two art-directed crops reuse it rather than
    minting a second breakpoint that would then have to be kept in step. */
export const BREAKPOINT = 720;

/** The two art-directed crops, as SHOWN. Every Plate's native aspect sits
    between them, which is what makes one `framing` keyword a per-ratio pair —
    see the schema comment in src/content.config.ts.

    Kept as numerator/denominator rather than a computed ratio so that the pixel
    height handed to sharp and the `aspect-ratio` handed to CSS come out of the
    same pair. A crop the file is cut to and a ratio the box is drawn at that
    disagree is a stretched image, and it is the kind of disagreement that
    survives review because both numbers look right on their own line. */
export const WIDE = { w: 21, h: 9 } as const;
export const TALL = { w: 4, h: 5 } as const;

/** What the wide file is CUT at, which is deliberately NOT what it is shown at.

    The band takes the top and the bottom off a Plate, so the content it hides
    is vertical, and a file cut to the same 21:9 the box is drawn at hides
    nothing — there is simply no image outside the frame. Cutting at 16:9 and
    showing 21:9 leaves 23.8% of the file's height outside the box, and that
    excess is the overscan the Traverse travels through (CONTEXT.md).

    THIS IS THE ONE PLACE THE PAIR IS SET, and the two numbers are load-bearing
    against each other. Widening this to 4:3 buys more travel and costs LCP
    bytes on `/`'s hero linearly; narrowing it to 21:9 does not disable the
    Traverse, it makes it silently do nothing. The cost of today's pair is
    ~31% more pixels in the wide tier, priced in docs/styling.md against the
    ~240 KB of hero the LCP gate actually binds at.

    The TALL crop has no equivalent: it is cut and shown at 4:5, because the
    Traverse is gated on a fine pointer and there is no hover on a phone. */
export const WIDE_SOURCE = { w: 16, h: 9 } as const;

type Crop = { readonly w: number; readonly h: number };

/** For CSS `aspect-ratio`. */
export const cssRatio = (crop: Crop) => `${crop.w} / ${crop.h}`;

/** The `framing` keyword as a CSS `object-position`, one entry per schema enum
    member (src/content.config.ts).

    This exists because WIDE_SOURCE introduced a SECOND crop of the same image,
    and the second one is performed by the browser rather than by sharp. Without
    it `object-position` defaults to `50% 50%` and the overscan is centre-cropped
    — which would take the composition decision the author stated, apply it to
    the file, and then quietly discard it at the box. A Plate framed `left top`
    would rest dead centre.

    Only the vertical half does anything today: the file and the box are the
    same width, so there is no horizontal overflow for the first value to move
    through. Both are stated anyway, because the pair is what the keyword MEANS
    and a map that silently drops half of it is the kind of thing that is
    correct until the day the crops stop being width-matched. */
export const OBJECT_POSITION = {
  centre: '50% 50%',
  top: '50% 0%',
  bottom: '50% 100%',
  left: '0% 50%',
  right: '100% 50%',
  'left top': '0% 0%',
  'left bottom': '0% 100%',
  'right top': '100% 0%',
  'right bottom': '100% 100%',
} as const;

/** The vertical half of the above, which is the half the Traverse rests at. */
export const restY = (framing: string) =>
  (OBJECT_POSITION[framing as keyof typeof OBJECT_POSITION] ?? '50% 50%').split(' ')[1];

const PAGE = px('--measure-page');
const PLATE_META = px('--plate-meta');
const PLATE_GAP = px('--plate-gap');
const BODY_COL = px('--body-col');

/** --gutter is declared twice: the base value, then the >=720px override. */
const [GUTTER_SM, GUTTER_LG] = pxAll('--gutter');

/** Width of the page shell's content box once the gutters are removed. */
const SHELL_CAPS_AT = PAGE + GUTTER_LG * 2;

/** Below the breakpoint every image is the full content width of a small
    viewport, so all three cases share one string. */
const FULL_SM = `calc(100vw - ${GUTTER_SM * 2}px)`;

/** Full content width at and above the breakpoint, capped by the page shell. */
const FULL_LG = `(min-width: ${SHELL_CAPS_AT}px) ${PAGE}px, calc(100vw - ${GUTTER_LG * 2}px)`;

/* ---- the three places a Rendered Asset appears --------------------------- */

/** `/` — the hero sits in a grid cell with the metadata column beside it. */
const INDEX_IMAGE = PAGE - PLATE_GAP - PLATE_META;
export const indexWideSizes = `(min-width: ${SHELL_CAPS_AT}px) ${INDEX_IMAGE}px, calc(100vw - ${
  GUTTER_LG * 2 + PLATE_GAP + PLATE_META
}px)`;
export const indexTallSizes = FULL_SM;

/** `/projects/<slug>/` — the hero runs the full content width. It is the
    widest thing on the page and the datum's left edge is what it shares with
    everything below it. */
export const detailWideSizes = FULL_LG;
export const detailTallSizes = FULL_SM;

/** The body column: half the page shell, and everything below a Project's hero
    sits in it — heading, summary, prose and every Frame alike. Narrower than the
    hero on purpose: the body starts on the same datum edge and stops short of
    it, which is the only thing making a 5-Frame Project and a 12-Frame Project
    read at the same rhythm.

    Text and Frames share one measure because they are one column, not two
    things that happen to be stacked. See the token's own comment for what that
    costs the reading measure. */
export const bodyWidth = BODY_COL;
export const bodySizes =
  `(min-width: ${BODY_COL + GUTTER_LG * 2}px) ${BODY_COL}px, ` +
  `(min-width: ${BREAKPOINT}px) calc(100vw - ${GUTTER_LG * 2}px), ` +
  FULL_SM;

/** The Expanded View's source width (CONTEXT.md). Fetched only when a visitor
    opens a Frame, so it is Post-LCP Media by construction and behind a Gate —
    which is why it may be this much larger than anything the page lays out.
    One width, not a ladder: it is displayed at whatever the viewport is, and a
    second tier would be a second encode of a file most visitors never request. */
export const EXPANDED_WIDTH = 2000;

/* ---- crop ladders --------------------------------------------------------
   Widths per crop, kept off astro.config.mjs's global `breakpoints` because
   each crop is only ever shown on one side of the breakpoint. A 640 px wide
   crop would only ever be fetched by a viewport that is being served the tall
   one, and a 2560 px tall crop by a phone with a 4x pixel ratio that does not
   exist. Variants are the multiplicative term in build cost (issue #3 §7), so
   the ladders are trimmed rather than inherited. */
export const WIDE_WIDTHS = [960, 1280, 1920, 2560];
export const TALL_WIDTHS = [640, 960, 1280];

/** The JPEG tier gets ONE width, not a ladder. Issue #3's own correction found
    that tier is reached only by browsers older than Safari 14 / Firefox 65 /
    Chrome 32 — a browser fetches exactly one <source>, so a full fallback ladder
    is build cost and repo noise essentially nobody downloads. It stays a tier
    because <img> needs a src regardless; it does not stay a ladder. */
export const WIDE_FALLBACK = [1280];
export const TALL_FALLBACK = [960];

/** Pixel height for a crop at a given width. */
export const heightFor = (width: number, crop: Crop) => Math.round((width * crop.h) / crop.w);
