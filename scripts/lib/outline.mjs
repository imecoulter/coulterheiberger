/**
 * Outlines a string out of a committed woff2 and returns it as SVG path data.
 *
 * Shared by `scripts/dev/build-social-card.mjs` and `scripts/dev/build-favicons.mjs`.
 * It lives here rather than in either of them because both artifacts are rasters of
 * this repo's own typeface, and two copies of the glyph-fetching Python is exactly
 * the drift that ends with a card and a favicon set in subtly different metrics.
 *
 * ## Why the type is outlined, and not set
 *
 * Two rendering paths were probed and both are unusable:
 *
 *   - **Satori** reads TTF/OTF/WOFF only; woff2 is explicitly unsupported, and it
 *     does no kerning or ligatures. `src/fonts/` holds two woff2 files and the
 *     source variable TTFs are deliberately uncommitted, so there is nothing for
 *     it to read.
 *   - **librsvg `<text>` fails SILENTLY on a missing family.** Probed on
 *     sharp 0.35.3 / libvips 8.18.3: a string set in "JetBrains Mono" and the
 *     same string set in a deliberately nonexistent family produced identical
 *     ink-pixel counts (1622 each) against Montserrat's 1194 — i.e. JetBrains
 *     Mono is not installed on that machine and fell back with no error. An
 *     artifact built that way ships in the wrong typeface and looks fine locally.
 *
 * So the glyphs are outlined out of the committed woff2 with fontTools and emitted
 * as a single `<path>`. librsvg then renders geometry, not type, and has no font to
 * miss — and any character outside the shipped subsets is a hard error here, where
 * in a `<text>` element it would be a silent per-glyph fallback nobody would catch.
 *
 * Kerning is read out of the subsets' own GPOS `kern` feature, which is why
 * `subset-fonts.mjs` keeps it on both faces.
 *
 * ## Setup
 *
 * The same virtualenv `subset-fonts.mjs` uses — fontTools with brotli, which is
 * what lets it READ the committed woff2:
 *
 *   python -m venv .venv-fonts
 *   .venv-fonts/Scripts/pip install fonttools brotli
 *
 * Callers pass PYTHON in the environment. From an agent worktree the venv lives in
 * the MAIN checkout, so pass the absolute path.
 */
import { execFileSync } from 'node:child_process';

const PYTHON = process.env.PYTHON ?? '.venv-fonts/Scripts/python.exe';

/**
 * Runs in the fontTools venv. Emits one SVG path for the whole string, in font
 * units with the font's own Y-up orientation, plus the run's advance width.
 *
 * Text arrives base64-encoded rather than as a literal argv string: the spec line
 * carries U+00B7, and a middle dot surviving a Windows command line is not a
 * thing worth trusting when the alternative is seven characters of encoding.
 *
 * `cmap.get()` returning None is a HARD ERROR. That is the whole reason this
 * script outlines instead of setting type — a missing glyph must stop the build,
 * not fall back to whatever the renderer has lying around.
 */
const OUTLINE_PY = `
import base64, json, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

font_path = sys.argv[1]
text = base64.b64decode(sys.argv[2]).decode('utf-8')
tracking = float(sys.argv[3])

font = TTFont(font_path)
upem = font['head'].unitsPerEm
cmap = font.getBestCmap()
glyph_set = font.getGlyphSet()
hmtx = font['hmtx']

names = []
for ch in text:
    name = cmap.get(ord(ch))
    if name is None:
        raise SystemExit(
            'U+%04X (%r) is not in %s. The subsets are cut to a fixed repertoire in '
            'scripts/dev/subset-fonts.mjs; widen the charset there and regenerate, or '
            'change the copy.' % (ord(ch), ch, font_path)
        )
    names.append(name)

# PairPos subtables reachable from the 'kern' feature. Both faces are subset with
# kern retained (subset-fonts.mjs), so this is normally non-empty; an absent GPOS
# degrades to zero kerning rather than failing.
pairpos = []
if 'GPOS' in font:
    gpos = font['GPOS'].table
    indices = set()
    for record in gpos.FeatureList.FeatureRecord:
        if record.FeatureTag == 'kern':
            indices.update(record.Feature.LookupListIndex)
    for i in sorted(indices):
        lookup = gpos.LookupList.Lookup[i]
        for sub in lookup.SubTable:
            if lookup.LookupType == 9:  # extension
                sub = sub.ExtSubTable
            if sub.__class__.__name__ == 'PairPos':
                pairpos.append(sub)

def kern(a, b):
    for sub in pairpos:
        try:
            if sub.Format == 1:
                index = sub.Coverage.glyphs.index(a)
                for record in sub.PairSet[index].PairValueRecord:
                    if record.SecondGlyph == b:
                        return getattr(record.Value1, 'XAdvance', 0) or 0
            elif sub.Format == 2:
                if a not in sub.Coverage.glyphs:
                    continue
                c1 = sub.ClassDef1.classDefs.get(a, 0)
                c2 = sub.ClassDef2.classDefs.get(b, 0)
                value = sub.Class1Record[c1].Class2Record[c2].Value1
                return getattr(value, 'XAdvance', 0) or 0
        except (ValueError, IndexError, AttributeError):
            continue
    return 0

track = tracking * upem
pen = SVGPathPen(glyph_set)
# BoundsPen is TRUE bounds, not control bounds: it solves the beziers rather than
# taking the extremes of the control points. That distinction is the difference
# between a round glyph fitting its box and overhanging it by its overshoot, and
# it is the whole reason a caller can set a monogram edge to edge.
bounds_pen = BoundsPen(glyph_set)
x = 0.0
for i, name in enumerate(names):
    glyph_set[name].draw(TransformPen(pen, (1, 0, 0, 1, x, 0)))
    glyph_set[name].draw(TransformPen(bounds_pen, (1, 0, 0, 1, x, 0)))
    x += hmtx[name][0]
    if i + 1 < len(names):
        x += kern(name, names[i + 1]) + track

print(json.dumps({
    'd': pen.getCommands(),
    'advance': x,
    'unitsPerEm': upem,
    'capHeight': getattr(font['OS/2'], 'sCapHeight', 0) or round(upem * 0.7),
    # None for a run that draws nothing, e.g. a single space.
    'bounds': bounds_pen.bounds,
}))
`;

/**
 * @param {string} fontPath
 * @param {string} text
 * @param {number} size    in design units
 * @param {number} tracking in em
 */
export function outline(fontPath, text, size, tracking) {
  const out = execFileSync(
    PYTHON,
    ['-c', OUTLINE_PY, fontPath, Buffer.from(text, 'utf8').toString('base64'), String(tracking)],
    { encoding: 'utf8' },
  );
  const run = JSON.parse(out);
  const scale = size / run.unitsPerEm;
  if (!run.bounds) throw new Error(`"${text}" outlined to nothing in ${fontPath}.`);
  const [xMin, yMin, xMax, yMax] = run.bounds;
  return {
    d: run.d,
    scale,
    /* ADVANCE width, which includes the sidebearings and the trailing one. It is
       what you set a line of type with. */
    width: run.advance * scale,
    capHeight: run.capHeight * scale,
    /* INK bounds, in font units and Y-up like the path itself. Different from
       `width` on purpose: this is where the marks actually are, which is what a
       caller fitting a mark to a box needs and what setting a line does not. */
    bounds: { xMin, yMin, xMax, yMax, width: xMax - xMin, height: yMax - yMin },
  };
}