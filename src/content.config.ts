import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Seven fields, every one required and every one rendered by a page. The schema
// and the reasoning behind each cut field are in docs/content-architecture.md
// §2 and §4 — do not add a field without a page that renders it.
//
// The .min(1)s are load-bearing, not stylistic: `npm run assets` scaffolds
// title, summary, credit and alt as empty stubs, so a bare z.string() would let
// an unwritten stub ship. min(1) turns that into a build failure, which is the
// reminder.
const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/index.mdx' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      summary: z.string().min(1).max(200),
      credit: z.string().min(1),
      // The Specification Line: what the work was made with, at what size. It
      // sits next to `credit` because the two are the pair CONTEXT.md defines
      // against each other — provenance and construction, both on every Plate,
      // answering different questions.
      //
      // Free text on credit's exact reasoning. The real cases do not fit a
      // union: the toolchains differ per Project, one Project's honest answer
      // is that it was made in everything EXCEPT the engine, and the set is
      // open — one of these lines ends in PHYSICAL MODEL. Required for credit's
      // reason too: an optional spec is the one you skip on the Project you
      // were in a hurry about, and the build refusing to compile is the
      // reminder.
      //
      // IT STATES THE TOOLCHAIN AND STOPS. Resolution was on this line and was
      // cut in review: a viewer judges an image by how sharp it looks, not by a
      // number claiming it — and the number was a fact about a master that
      // never ships, which nothing in this repository could check. See the
      // amendment on ADR-0006. Do not put it back, and do not add render time.
      //
      // It is AUTHORED, never derived. That is a decision with an ADR behind
      // it — docs/adr/0006-the-specification-line-is-authored.md — because it
      // reads as the thing a build step should compute, and the two obvious
      // derivations are both wrong: the committed export is identical on every
      // asset, and the master's long edge is a property of a file that does not
      // ship. Whoever adds the next Project types this line by hand.
      //
      // Separator is U+00B7 MIDDLE DOT, already in the mono subset for exactly
      // this. No version numbers: `UNREAL ENGINE`, never `UNREAL ENGINE 5`.
      spec: z.string().min(1),
      year: z.number().int(),
      order: z.number().int(),
      // images[0] is the hero. There is no separate hero or thumbnail field:
      // one export per camera, every crop produced at build time from it.
      images: z
        .array(
          z.object({
            src: image(),
            alt: z.string().min(1),
            // Framing: the composition decision the plate carries, so a crop
            // recomposes the image instead of cutting it (issue #30). Astro
            // passes this verbatim into sharp's resize({ position }), so the
            // legal set is sharp's, and sharp's is horizontal-first only —
            // `left top` resizes, `top left` throws, as does the `center top`
            // Astro's own docs print. Nine values, no aliases:
            //   - `center` is excluded because the repo writes British;
            //   - the compass aliases (`north`...) are library vocabulary;
            //   - `attention`/`entropy` are excluded because they are not
            //     deterministic across libvips versions, and because they
            //     destroy the property this field rests on.
            //
            // It reaches FOUR cuts, not two: the wide file, the tall file, the
            // Social Card, and — since the Traverse — the resting
            // `object-position` the browser cover-crops the band at. The wide
            // file is now cut looser than it is shown (16:9 in a 21:9 box), so
            // the browser performs a second crop and would centre it left to
            // itself, honouring this keyword in sharp and discarding it eight
            // pixels later. src/layout.ts maps the nine values below to nine
            // object-positions for exactly that.
            //
            // That property: design-direction.md's two crops are 21:9 and 4:5,
            // and every plate's native aspect sits between them, so cropping to
            // 21:9 is a purely VERTICAL cut and to 4:5 a purely HORIZONTAL one.
            // 16:9 sits inside the same window, so the wide cut is still purely
            // vertical and is simply performed in two stages.
            // One two-axis keyword is therefore already a per-ratio pair —
            // `top` answers the wide crop, `left` the tall one, with no
            // cross-contamination. `npm run assets` warns when a master's
            // aspect leaves the 0.800–2.333 window, where that stops holding.
            //
            // Why not just compose every plate for a centre crop, and drop the
            // field? Because that re-couples layout to re-render: moving the
            // 4:5 breakpoint would send you back into the 3D toolchain. Breaking
            // exactly that coupling is what docs/asset-delivery.md §1 is for.
            // The other rejected shapes are in design-direction.md, "Framing".
            //
            // Known, deliberate (issue #30): this is required before any page
            // renders it — the v1 Project page is the next thing in the
            // milestone. Until then it is the one field that breaks the rule at
            // the top of this file, and it is written down rather than waived.
            framing: z.enum([
              'centre',
              'top',
              'bottom',
              'left',
              'right',
              'left top',
              'left bottom',
              'right top',
              'right bottom',
            ]),
          }),
        )
        .min(1),
    }),
});

export const collections = { projects };
