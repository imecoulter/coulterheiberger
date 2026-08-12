# Asset delivery: export preset and publish ritual

How a Rendered Asset gets from the 3D authoring toolchain onto the site.

Decided in [issue #6](https://github.com/imecoulter/coulterheiberger-com/issues/6), on evidence from
[issue #3](https://github.com/imecoulter/coulterheiberger-com/issues/3). This document is the spec renders
are produced against; it is binding on both the render preset and the tooling.

The design goal is that **nothing here is remembered per asset.** The preset is set once. Every other
setting is applied by a command or enforced by CI. If a rule in this document requires a per-asset
judgement call, that is a defect in the rule.

---

## 1. The render preset — set once, never revisited

The 3D authoring toolchain does **not** produce the file that is committed. It produces a **master**,
which never enters git (a binding constraint — see `AGENTS.md`). One command turns masters into
committed exports.

Set the render output to:

| Setting | Value |
| --- | --- |
| Format | **16-bit PNG** |
| Colour | **sRGB, display-referred, SDR** — written *through* the view transform |
| Aspect | **Native camera aspect.** Do not crop to a layout ratio |
| Long edge | **≥ 3200 px** |
| Output path | **`C:\Users\coult\Dev\coulterheiberger-com\.render-drop\`** |

"Display-referred" is the load-bearing word: the master is the image *after* your view transform, not raw
scene-linear data.

- **Blender** — save with **Save As Render** enabled, so the scene's view transform and look are applied.
- **3ds Max / Arnold** — save the frame-buffer output with the display transform applied, not a raw AOV.

**Never write a master from an HDR or wide-gamut view.** Everything downstream is 8-bit sRGB, and the
delivered image carries no colour profile (§2), so a wide-gamut master silently ships numbers the browser
will paint as sRGB.

### Proof colour in the browser, not the viewport

This machine grades on a wide-gamut HDR display. Chrome and Safari treat an untagged image as sRGB and
convert it to the display profile, so **the dev server shows you what an sRGB visitor sees**; the render
viewport does not. No extra step — check the site you were going to look at anyway.

### Aspect ratios are deliberately unspecified

There is no hero ratio and no thumbnail ratio, by design. One export per camera at native aspect; every
crop is produced at build time by Astro from that same file (`<Image>` with both `width` and `height`
resizes with `fit: 'cover'`, anchorable via `position`, and fit/position are part of the emitted filename
hash — so crops are cached, not recomputed).

The consequence that matters: **a layout change is a CSS edit, never a re-render.** Any spec that fixes
export ratios sends you back into the toolchain when the design moves.

---

## 2. The committed export — produced by tooling, not by hand

| Setting | Value | Why |
| --- | --- | --- |
| Format | **JPEG** (`.jpg`) | Astro's `<Picture>` picks its fallback tier from the source format. Only `gif`/`svg`/`jpg`/`jpeg` are in `specialFormatsFallback`; committing PNG **or WebP** silently yields a ~7× larger PNG fallback tier |
| Quality | **92** | Delivered bytes are flat above q92 — measured 86 KB delivered from a q92 source vs 86 KB from a lossless one. q98 buys 0.56 dB for 72% more repo weight |
| Chroma | **4:4:4** | 4:2:0 costs 1.25 dB on the delivered AVIF and damages exactly the sky gradients and glazing tints this work is made of. Note it makes delivered files *smaller* — smaller because worse |
| Encoder | **mozjpeg** | |
| Long edge | **3200 px**, single tier | Top delivery breakpoint is 2560, so 3200 is never served directly: it is downscale headroom. One number, no per-asset judgement |
| Colour | **sRGB**, embedded profile converted then **stripped** | Astro's sharp pipeline drops the ICC profile and does **not** convert (verified: a P3-tagged input emits byte-identical RGB with no profile). Whatever numbers are committed are what browsers paint |
| Metadata | stripped | |
| Location | `src/content/projects/<slug>/` | Beside the entry, referenced through the collection's `image()` helper |
| Name | the master's filename, slugified | |

Repo weight lands at roughly 1.2–2.0 MB per committed asset depending on render noise.

### Naming and roles

Filenames never reach the public — Astro content-hashes every emitted variant. So names serve you, in the
folder and in the MDX, and nothing else.

- The command slugifies the master's filename: `Hero_North_Dusk.png` → `hero-north-dusk.jpg`.
- **Roles and order live in frontmatter, never in filenames.** No `hero.jpg`, no `01.jpg`.
- Promoting a different image to hero is therefore a one-line MDX edit, not a rename plus a git move.
- Re-running the command overwrites a same-named export. That is correct for a re-render; git tracks it.

A Project needs a minimum of **one** committed export. The grid thumbnail is not a separate file.

---

## 3. The publish ritual

> **Status: the two commands and the CI check in §4 are specified here but not yet built.** Do not try to
> run them. Tracked in [issue #17](https://github.com/imecoulter/coulterheiberger-com/issues/17).

```
1. Render.                    Preset from §1. Masters land in .render-drop\
2. npm run assets <slug>      Convert, place, scaffold MDX. Masters move to .render-drop\.done\<slug>\
3. Write.                     Alt text for every image; body copy.
4. npm run publish <slug>     Branch, commit, push, open the PR.
5. Merge.                     After CI is green — and after looking at the preview deploy.
```

Steps 2 and 4 take no options beyond the slug. There is nothing to configure at any step.

**Why the two commands are separate:** authoring happens between them. Collapsing them would mean
committing empty `alt` stubs.

**Why step 5 is not automated:** per-PR preview deploys
([#9](https://github.com/imecoulter/coulterheiberger-com/issues/9)) make the PR the first place a Project
is visible on the real site. `gh pr merge --auto` would save one click and throw away the only proof step
in the ritual.

### What `npm run assets <slug>` does

1. Reads every image at the top level of `.render-drop\`.
2. Converts each to the §2 spec and writes it to `src/content/projects/<slug>/`.
3. Moves the masters to `.render-drop\.done\<slug>\`, so the drop folder is self-clearing and always shows
   exactly what is pending.
4. If `src/content/projects/<slug>/index.mdx` does not exist, writes it complete — frontmatter listing
   every image, `alt: ''` stubs, hero set to the first image. If it does exist, prints the YAML block for
   the new images to paste. No YAML round-tripping.

Masters are preserved in `.done\`, which is what makes §2's quality settings cheaply reversible: changing
the quality number means re-running the command over files already on disk, never a re-render.

---

## 4. Enforcement

The spec is enforced mechanically, on the PR, before anything reaches `main`. A tracked image under
`src/` fails the build if it:

- is not JPEG,
- has a long edge over 3200 px,
- carries an embedded ICC profile, or
- exceeds 3 MB.

This is what makes the preset genuinely set-and-forget: the constraint stops being something held in your
head. It matters more than a lint rule because "no masters in git" is binding and a violation is
*permanent* — scrubbing a master from history means a force-push over a protected branch.

`.render-drop\` sits outside the repository, as a sibling of the working tree, so a master cannot be
committed even by `git add -A`.

---

## Evidence

Measured on this machine against Astro 7.2.0 / sharp 0.35.3 / libvips 8.18.3, on a synthetic 3200×1800
source built to punish an encoder (uncorrelated per-pixel foliage noise, saturated glazing tints, smooth
sky gradient):

| committed | repo size | → WebP q80 @1600 | → AVIF q50 @1600 |
| --- | --- | --- | --- |
| PNG (lossless reference) | 4339 KB | 86 KB | 44 KB |
| **JPEG q92 4:4:4** | **2047 KB** | **86 KB / 39.64 dB** | **43 KB / 39.85 dB** |
| JPEG q95 4:4:4 | 2530 KB | 87 KB / 39.85 dB | 44 KB / 39.98 dB |
| JPEG q98 4:4:4 | 3513 KB | 87 KB / 40.20 dB | 45 KB / 40.10 dB |
| JPEG q92 4:2:0 | 998 KB | 82 KB / 39.24 dB | 40 KB / 38.60 dB |

Read the ratios, not the absolute bytes.

**Known limits of this evidence.** PSNR under-weights chroma error, which is the specific damage the 4:4:4
rule guards against — that rule rests on the mechanism more than on these numbers. The source is
synthetic, and no real Rendered Asset exists yet. Neither limit is worth a follow-up benchmark: delivered
size is flat across the whole quality range, and if a real render ever disagrees, the fix is one number
and a re-run over preserved masters.

Delivery-side configuration — `<Picture>` vs `<Image>`, breakpoints, `cacheDir`, per-format quality — is
**not** in this document. It lives in the findings on
[#3](https://github.com/imecoulter/coulterheiberger-com/issues/3).
