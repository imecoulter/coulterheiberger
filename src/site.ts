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
