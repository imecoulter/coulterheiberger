---
status: accepted
date: 2026-08-18
---

# The Specification Line is authored, not derived

`docs/design-direction.md` is named after the specification line: *"The datum is the specification
line — not a rail, not a grid, but the fixed reference every piece of work is measured against."* It
is the one string that makes a competition still and a point-cloud viewer the same kind of object.

It is stored as `spec: z.string().min(1)` on the Project collection — **free text, required, and typed
by hand for every Project.** Nothing computes it. This ADR exists because that is a surprising answer
to arrive at twice: once when `content-architecture.md` §4 cut `role` *for being* free text, and again
when the obvious implementation is a build step reading the files the line describes.

## Why this needed deciding at all

It clears all three bars this repo sets for an ADR.

**Hard to reverse.** Six Projects now carry hand-written lines. Deriving them later means either
re-deriving six strings that a human chose, or discovering that the derivation disagrees with them —
which is exactly what happened during the build, below.

**Genuinely surprising.** The same document that cut `role` for being unstructured keeps `spec` for
being unstructured. That looks like an inconsistency and is not: `role` was cut because a metadata row
made you write badly what `summary` lets you write well. `spec` has no such home. There is no prose
field where `UNREAL ENGINE · HOUDINI · 3840 PX` reads better.

**Real alternatives existed**, and one of them was actively proposed and applied.

## The decision

The line is authored. The two derivations were considered and both are wrong:

**Derive it from the committed export.** `docs/asset-delivery.md` §2 fixes the export preset at
**3200 px on the long edge, single tier, no per-asset judgement**. All 47 committed assets are 3200 px
by construction. A derived resolution would therefore print the same number on every Plate on the
site — a datum that never varies is not a datum, it is a watermark.

**Derive it from the master's long edge.** Better, and still wrong. Masters live in `.render-drop/`,
outside the repository (`AGENTS.md`, binding), so the derivation would depend on files that are not in
git, are not on CI, and are not on anyone else's machine. A build that cannot run without a folder
nobody else has is not a build.

It is also, on this repo's own evidence, **not the fact worth printing**. When the Project routes were
built the handoff specified `1920 PX` for Wilderness, `2160 PX` for Residence One and `2160 PX` for
Atmosphere while *also* specifying "the hero's master long edge" as the rule. Those three masters
measure 3200×1800, 3200×3200 and 3200×3200. The stated rule and the stated values disagreed on half
the Projects, and the path the rule named — `.render-drop\.done\<slug>\_source\` — does not exist.

An attempt was made to settle it by measurement rather than by asking: if those masters had been
upscaled to meet the ≥3200 px preset floor, their true render resolution would be lower and the
authored numbers would be the honest ones. Round-trip residual and pixel-scale gradient energy were
both tried, and **neither separated the real masters from a synthetic upscale well enough to conclude
anything** — resampling is not idempotent, and the statistic is dominated by how much grain a render
happens to carry. That failure is the finding: *the resolution worth stating is not recoverable from
the file.* It is a fact about how the work was made, and the only place it exists is in the memory of
whoever made it.

**The owner chose the master long edge**, and the values shipped are the measured ones — 3840 where the
master is 3840, 3200 where it is 3200. That is a choice about *which* fact to state. It does not make
the field derived: the number is still typed into frontmatter, and the next Project's line is still
written by a person.

## Consequences

- **The build refuses to compile until the line is stated out loud.** `min(1)` on a required field, the
  same instinct as `alt: z.string().min(1)` and the asset checks in `docs/asset-delivery.md` §4. An
  optional `spec` is the one you skip on the Project you were in a hurry about.
- **It can be wrong, and nothing will catch it.** This is the real cost and it is accepted rather than
  mitigated. No gate can check a claim about a toolchain against anything. The mitigation is that the
  line is short, it is written while the person is looking at the work, and it is reviewed on the PR.
- **`npm run assets` does not scaffold a value for it**, and must not learn to. A scaffolded `spec`
  would be a guess wearing the authority of a generated file — worse than the empty stub `alt` and
  `framing` get, because an empty string fails the schema loudly while a plausible wrong number does
  not.
- **The separator is U+00B7 MIDDLE DOT**, already in the mono subset for exactly this, and there are no
  version numbers: `UNREAL ENGINE`, never `UNREAL ENGINE 5`. A version dates the work in the one line
  that is supposed to measure it.
- **The upgrade path, if this ever becomes intolerable**, is not derivation — it is a second authored
  field with a union type for the part that genuinely is enumerable (the software), leaving the
  resolution authored. Nobody has asked for it. Do not build it before they do.

## Amendment, 2026-08-18: the resolution is no longer stated

**The decision above stands unchanged. What changed is which facts the line carries.** On review of
the built routes, the owner cut the resolution. The six lines now state the toolchain and nothing
else: `UNREAL ENGINE · HOUDINI`, `ENSCAPE · PHOTOSHOP · ILLUSTRATOR · PHYSICAL MODEL`.

The reason given is the right one and is worth recording in the owner's own terms: *a viewer does not
care about the pixel count, they care whether the image is sharp on their screen.* A number that
claims sharpness is a worse signal than the image itself, which is right there.

**This strengthens the ADR rather than reversing it.** Everything above about resolution was an
argument for a fact the repository could not verify:

- the committed export is 3200 px by construction, so a derived number would be identical on every
  Plate;
- a master-derived number depends on `.render-drop/`, which is not in git and not on CI;
- the handoff's stated rule and its stated values contradicted each other on half the Projects;
- and the forensic attempt to settle it — round-trip residual, pixel-scale gradient energy — was
  inconclusive.

That analysis concluded "the resolution worth stating is not recoverable from the file". The
amendment takes the next step: it was also not worth stating. The liability is retired instead of
being carried by a human typing it carefully.

**What did not change.** The field is still `spec: z.string().min(1)`. It is still authored, still
required, still never scaffolded by `npm run assets`, still separated by U+00B7, and still carries no
version numbers. Nothing computes it, and the two rejected derivations stay rejected.

**The known cost, stated rather than discovered later.** Habitat and Atmosphere now both read
`UNREAL ENGINE` and nothing else, where the resolution was previously the only thing distinguishing
them. A datum that reads identically on two of six Plates is a weaker datum. The fix is a second tool
on those two lines, which is a content edit by whoever made the work — not a schema change, and not a
number nobody could check.
