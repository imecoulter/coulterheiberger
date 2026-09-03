/* The three public contact endpoints. Here rather than inline because each is
   rendered twice, in different files:

   - the address by Footer.astro's `mailto:` and by the Person graph's `email`
   - each profile URL by Footer.astro's `rel="me"` and by that graph's `sameAs`

   A `rel="me"` / `sameAs` pair is an identity assertion, and it only asserts
   anything while the two strings match exactly. Two literals in two files is
   how that quietly stops being true.

   The LinkedIn URL is LinkedIn's own canonical form. Do not normalise it, do
   not strip the trailing slash, and never paste a copied one with `?trk=`
   params attached.

   THE GITHUB URL IS THE PROFILE, NOT THE REPOSITORY, and the distinction is the
   whole point of the field. `sameAs` means "another page about this same
   entity"; github.com/imecoulter is a page about a person and
   github.com/imecoulter/coulterheiberger is a page about a codebase. Pointing
   the identity edge at the repo would assert that the person and the repository
   are the same thing. The repo is one click from the profile, which is the right
   place for a reader to find it and the wrong place for a crawler to be told to
   look.

   IT IS RECIPROCAL TODAY AND THAT IS WHAT MAKES IT WORTH HAVING. The account's
   profile website field reads coulterheiberger.com, so the edge is asserted from
   both ends. A `sameAs` to a profile that does not link back is a claim rather
   than a corroboration, and search engines weight it accordingly — if that
   profile field is ever cleared, this line quietly degrades to the weaker kind
   and nothing here will report it. */
export const EMAIL = 'ime@coulterheiberger.com';
export const LINKEDIN = 'https://www.linkedin.com/in/coulterheiberger/';
export const GITHUB = 'https://github.com/imecoulter';

/* THE ENTITY ANCHOR. One URI naming the person the whole site is about, so that
   every graph on every route points at ONE node instead of each page asserting
   its own unconnected person.

   IT IS A FRAGMENT ON `/`, DELIBERATELY. The Person graph itself lives on the
   index (index.astro says why it stays there), and `#person` names the entity
   WITHIN that document rather than the document itself — which is what keeps it
   distinct from `url`, the page, and from the canonical, the address. A crawler
   reading /projects/cecret/ finds `creator: { '@id': ... }` and resolves it to
   the node defined on `/`; nothing is restated and there is one place to change
   a fact about the person.

   IT IS AN IDENTIFIER, NOT A LINK. Nothing fetches it, no route serves it, and
   `#person` is not an element id anywhere in the markup. Do not add one to make
   it "work" — it already does the only job it has.

   THE STRING IS A CONTRACT THE MOMENT ANYTHING REFERENCES IT, and four files do:
   this one defines it, index.astro defines the node, and [slug].astro and
   About.astro reference it. Change it and every reference dangles — which is a
   silent failure in JSON-LD, since a reference to an undefined node is
   well-formed and simply means nothing. scripts/check-structured-data.mjs exists
   to make that failure loud. */
export const PERSON_ID = 'https://coulterheiberger.com/#person';

/* THE ABOUT PAGE'S ROUTE, and it is a constant for a slightly different reason
   than the two above: both its consumers are in ONE file, Masthead.astro, where
   it is the About band's `href` and the test that suppresses that band on the
   page it points at.

   TWO LITERALS THERE WOULD FAIL SILENTLY AND ONLY IN ONE DIRECTION. Get the
   href wrong and the link 404s, which anyone notices; get the comparison wrong
   and /about/ime/ simply grows a control leading to the document it is already
   in, which looks like a design choice. One string cannot disagree with itself.

   THE TRAILING SLASH IS LOAD-BEARING. astro.config.mjs sets `build.format:
   'directory'` and no `trailingSlash`, so `/about/ime/` is the path in dev, in
   preview and in the built output, and `Astro.url.pathname` matches it exactly.
   public/_redirects sends `/about` and `/about/` here. Drop the slash and the
   suppression silently stops matching on every page.

   (This comment used to say the config sets NEITHER option and relied on
   'directory' being Astro's default. The default is the same either way, so
   nothing about the conclusion moves — but the file does set it, at
   astro.config.mjs's `build` block, and a comment that misdescribes the config
   is the kind that stops being checked.) */
export const ABOUT_PATH = '/about/ime/';

/* THE INDEX'S ROUTE, and it is a constant for exactly the reason ABOUT_PATH is:
   two consumers in one file, Masthead.astro, where it is the site name's `href`
   and the test that suppresses that link on the page it points at. Same silent
   direction, too — get the comparison wrong and `/` grows a control leading to
   the document it is already in, which looks like a design choice rather than a
   bug.

   IT IS THE BARE SLASH AND THERE IS NO SECOND SPELLING. `/about/` needed two
   301s because a visitor can truncate to it; nobody truncates to something
   shorter than this. */
export const HOME_PATH = '/';

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
