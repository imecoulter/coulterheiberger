#!/usr/bin/env node
/**
 * Asserts the Identity Graph's integrity over the BUILT html.
 *
 *   1. every application/ld+json block parses as JSON
 *   2. every `@id` REFERENCE resolves to a node defined somewhere in the build
 *   3. no graph anywhere asserts `worksFor` or `affiliation`
 *      (docs/adr/0005-the-site-presents-the-independent-practice.md)
 *
 * Built output, not source, for the reason check-css.mjs gives about CSS: the
 * source is several files deciding fragments of an answer, and the built page is
 * where the answer actually is. A graph assembled from three constants across
 * two modules is only a graph once it has been serialised into a document.
 *
 * WHY (2) IS THE ONE THAT EARNS THIS SCRIPT. The design in ADR-0012 defines the
 * Person exactly once, on `/`, and has eight other graphs point at it by `@id`.
 * That is the right shape and it creates a failure mode nothing else here can
 * see: in JSON-LD a reference to a node that does not exist is perfectly
 * well-formed and simply means nothing. Rename the constant, drop the node,
 * change the domain, and every page still builds, still validates, still passes
 * every other gate — and the graph has quietly become nine disconnected
 * fragments, which is the precise condition the whole design exists to avoid.
 * A person cannot eyeball this: the definition and its references are in
 * different files and land in different documents.
 *
 * WHY (3) IS HERE AT ALL. It was a comment in index.astro saying "never add
 * these", and AGENTS.md calls violating it a defect rather than a style
 * disagreement. check-css.mjs already established that this repo asserts its
 * refusals in CI instead of trusting a sentence near the code. This is that,
 * for the constraint ADR-0005 cares most about. It walks every node on every
 * route, not just the Person, because the tempting place to add an employer is
 * a Project's `sourceOrganization`-shaped hole, not the Person.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO: validate against schema.org's vocabulary.
 * That means a network fetch, or a vendored copy of the vocabulary to keep in
 * step with it, in exchange for catching typos in field names that Google's
 * Rich Results Test already reports on demand. The checks above are the ones
 * that are cheap here and impossible there.
 */
import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';

const DIST = new URL('../dist/', import.meta.url);

/** ADR-0005. The site presents one independent practice; an organization edge
 *  asserts something it does not claim. */
const FORBIDDEN = ['worksFor', 'affiliation'];

/* Non-greedy, and `[^>]*` on the open tag because the attribute order Astro
   emits is not this script's business. `is:inline` means the block is verbatim
   in the document, so there is nothing to resolve or follow. */
const SCRIPT = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g;

const parsed = [];
const malformed = [];

for await (const file of glob('**/*.html', { cwd: DIST })) {
  const text = readFileSync(new URL(file, DIST), 'utf8');
  for (const [, block] of text.matchAll(SCRIPT)) {
    try {
      parsed.push({ file, data: JSON.parse(block) });
    } catch (err) {
      malformed.push({ file, message: err.message });
    }
  }
}

/* Walk every node of every graph once, collecting three things at each step.
   One traversal rather than three, because the shapes are nested arbitrarily —
   `@graph` arrays, nested objects, arrays of references — and each pass would
   have to rediscover that shape.

   THE DEFINED / REFERENCED DISTINCTION IS THE WHOLE TRICK. A node that carries
   `@id` alongside any other key is DEFINING that id. A node whose only key is
   `@id` is REFERRING to one. `{ '@id': X }` and `{ '@type': 'Person', '@id': X,
   name: ... }` are the same syntax doing opposite jobs, and telling them apart
   is what makes a dangling reference detectable. */
const defined = new Set();
const referenced = [];
const forbidden = [];

function walk(node, file) {
  if (Array.isArray(node)) {
    for (const item of node) walk(item, file);
    return;
  }
  if (node === null || typeof node !== 'object') return;

  const keys = Object.keys(node);
  const id = node['@id'];

  if (typeof id === 'string') {
    /* `@context` rides along on the outermost object and says nothing about
       whether that object defines an entity, so it does not count as substance.
       Without this, the top-level wrapper on a Project page —
       { '@context', '@type', '@id', ... } — is fine either way, but a
       hypothetical { '@context', '@id' } wrapper would be misread as a
       definition and mask a dangling reference. */
    const substantive = keys.filter((k) => k !== '@id' && k !== '@context');
    if (substantive.length > 0) defined.add(id);
    else referenced.push({ id, file });
  }

  for (const key of keys) {
    if (FORBIDDEN.includes(key)) forbidden.push({ file, key });
    walk(node[key], file);
  }
}

for (const { file, data } of parsed) walk(data, file);

/* Deduplicated by id AND file: the same dangling reference on six Project pages
   is one mistake, but which routes carry it is the thing that tells you whether
   a page or the constant is at fault. */
const dangling = referenced.filter((r) => !defined.has(r.id));

if (malformed.length > 0 || dangling.length > 0 || forbidden.length > 0) {
  if (malformed.length > 0) {
    console.error(
      `\ncheck:structured-data — ${malformed.length} block(s) did not parse as JSON.\n` +
        `A structured data block that does not parse is invisible rather than\n` +
        `broken: nothing renders differently and no other gate can see it.\n`,
    );
    for (const m of malformed) console.error(`  ${m.file}\n    ${m.message}\n`);
  }

  if (dangling.length > 0) {
    console.error(
      `\ncheck:structured-data — ${dangling.length} @id reference(s) resolve to nothing.\n` +
        `Each of these is a node pointed at by a graph and defined by no page in\n` +
        `the build. JSON-LD treats that as well-formed and meaningless, so the\n` +
        `pages still work and the Identity Graph is silently in pieces.\n` +
        `PERSON_ID is in src/site.ts; the node it names is defined in\n` +
        `src/pages/index.astro. See ADR-0012.\n`,
    );
    for (const d of dangling) console.error(`  ${d.file}\n    -> ${d.id}\n`);
  }

  if (forbidden.length > 0) {
    console.error(
      `\ncheck:structured-data — ${forbidden.length} forbidden key(s).\n` +
        `The site presents ONE INDEPENDENT PRACTICE. An organization edge asserts\n` +
        `something it does not claim, and AGENTS.md calls this a defect rather\n` +
        `than a preference. If the practice itself has genuinely changed, amend\n` +
        `docs/adr/0005-the-site-presents-the-independent-practice.md first — do\n` +
        `not weaken this check.\n`,
    );
    for (const f of forbidden) console.error(`  ${f.file}\n    ${f.key}\n`);
  }

  process.exit(1);
}

console.log(
  `check:structured-data — ok. ${parsed.length} block(s), ` +
    `${defined.size} node(s) defined, ${referenced.length} reference(s) resolved, ` +
    `no organization edge.`,
);
