import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Six fields, every one required and every one rendered by a page. The schema
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
      year: z.number().int(),
      order: z.number().int(),
      // images[0] is the hero. There is no separate hero or thumbnail field:
      // one export per camera, every crop produced at build time from it.
      images: z
        .array(
          z.object({
            src: image(),
            alt: z.string().min(1),
          }),
        )
        .min(1),
    }),
});

export const collections = { projects };
