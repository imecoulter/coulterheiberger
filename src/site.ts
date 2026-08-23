/* The two public contact endpoints. Here rather than inline because each is
   rendered twice, in different files:

   - the address by Footer.astro's `mailto:` and by the Person graph's `email`
   - the profile URL by Footer.astro's `rel="me"` and by that graph's `sameAs`

   A `rel="me"` / `sameAs` pair is an identity assertion, and it only asserts
   anything while the two strings match exactly. Two literals in two files is
   how that quietly stops being true.

   The LinkedIn URL is LinkedIn's own canonical form. Do not normalise it, do
   not strip the trailing slash, and never paste a copied one with `?trk=`
   params attached. */
export const EMAIL = 'ime@coulterheiberger.com';
export const LINKEDIN = 'https://www.linkedin.com/in/coulterheiberger/';

/* THE ABOUT PAGE'S ROUTE, and it is a constant for a slightly different reason
   than the two above: both its consumers are in ONE file, Masthead.astro, where
   it is the About band's `href` and the test that suppresses that band on the
   page it points at.

   TWO LITERALS THERE WOULD FAIL SILENTLY AND ONLY IN ONE DIRECTION. Get the
   href wrong and the link 404s, which anyone notices; get the comparison wrong
   and /about/ime/ simply grows a control leading to the document it is already
   in, which looks like a design choice. One string cannot disagree with itself.

   THE TRAILING SLASH IS LOAD-BEARING. astro.config.mjs sets no `trailingSlash`
   and no `build.format`, so the default 'directory' gives `/about/ime/` in dev,
   in preview and in the built output, and `Astro.url.pathname` matches it
   exactly. public/_redirects sends `/about` and `/about/` here. Drop the slash
   and the suppression silently stops matching on every page. */
export const ABOUT_PATH = '/about/ime/';

/* THE PRACTICE'S OWN SPECIFICATION LINE.

   IT HAS ONE CONSUMER AGAIN, AND IT STAYS HERE ANYWAY. This was here because it
   was rendered twice in different files — the Masthead on `/` and the hero on
   /about/ime/ — and those two copies are now one Masthead.astro rendered by the
   shell, so the drift it was guarding cannot happen. What keeps it in this file
   is the other half of the job: this is the site's own copy, the same category
   as the address above it, and a page's words being findable in one place is
   why the file exists. Contrast --scrim, which went the other way when its
   consumers collapsed — that is a derived NUMBER whose 70-line derivation had to
   travel with it, and this is a sentence.

   IT DOES NOT OPEN WITH `TECHNICAL ARTIST`, and ADR-0005's example string does.
   That example is written for a page where the role is not already present;
   both pages that render this line carry the display line two rows above it in
   this exact mono, so leading with the role printed the same words twice in the
   same style within 60px. The ADR's rule is that qualifiers live on the spec
   line rather than on the display line, and it is better served by this line
   carrying only what the display line does not say.

   Same type role and same separator as every Plate's specification line,
   because it is the same line doing the same job one level up: the six on `/`
   say what a Project was made with, this says what the practice is made of. */
export const PRACTICE_SPEC = 'Real-time 3D · Geospatial pipelines · Interactive systems';

/* THE POSITIONING PARAGRAPH, and it is in this file for the reason stated on
   the specification line above: it is the site's own copy.

   IT USED TO BE TWO PARAGRAPHS, AND THEN IT WAS ONE STRING WITH TWO READERS.
   The Masthead's and the About page's opened on the SAME first sentence and then
   diverged, which read as a near-repeat rather than as one statement; this is
   the Masthead's, kept whole, and the sentence the About page had after it —
   where the practice came from — went back into that page's body under
   `## The practice`, which is where a history belongs. The two readers have
   since become one Masthead on every page, which is the same argument carried
   one step further: there is now no second hero to diverge from.

   SET IN THE SERIF AT THE BODY SIZE, and in --ink rather than --muted. It was
   --muted for the whole life of the paper site, on the argument that a lede is
   secondary to the name above it. It is not: it is the only prose on the first
   screen and it is what a visitor actually reads to find out what this is. */
export const PRACTICE_LEDE =
  'I build real-time systems for spatial environments: terrain, architecture, ' +
  'simulation, and interactive experiences. Most of the work starts with real-world ' +
  'data, processed into environments that hold up at 1:1 scale under true coordinates.';
