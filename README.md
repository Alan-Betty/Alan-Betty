# Alan Betty — Portfolio

A bespoke portfolio and interactive display site for Alan Betty: frontend developer,
UI/UX designer and browser engineer from Kerala, India.

No component library, no CSS framework, no template. Every surface is hand-built.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm run gen:assets   # regenerate procedural textures into public/assets
```

---

## Design system — "Phosphor Ink"

A committed dark object. There is no light mode, and that is a decision rather than
an omission: the whole palette, the WebGL ground and the grain are tuned to one
register.

| Role | Token | Value |
| --- | --- | --- |
| Ground | `--ink-900 … --ink-300` | violet-shifted blacks, `#060508` up |
| Type | `--bone-100 … --bone-600` | warm bone, `#f2eee6` down |
| Signal | `--signal` | `#d8fb4f` acid — one accent, used sparingly |
| Heat | `--ember` | `#ff4f1f` — accretion disk, in-progress state |
| Depth | `--azure` | `#5f8bff` — WebGL filaments, secondary tags |

**Type.** Three families, each with one job.

- **Bricolage Grotesque** (variable, `opsz` + `wdth` axes) — display. The hero name
  reads pointer distance per glyph and responds on the weight and width axes, so the
  typography *is* the interaction rather than carrying a decoration on top of it.
- **Instrument Serif Italic** — the human voice: pull quotes, project one-liners.
- **JetBrains Mono** — every label, metric and piece of chrome. The site's HUD.

**Engraved display type.** Bricolage ships glyphs with overlapping contours, so
`-webkit-text-stroke` draws every internal edge and capitals render as broken boxes.
Ghosted headings therefore use a hatch clipped to the glyph
(`--hatch-bone` / `--hatch-signal` + `background-clip: text`). The stripe period is
`em`-relative with a pixel floor, so density stays constant across the type scale.
The hatch is applied to the painted leaf — the glyph or kinetic unit — because a
transformed descendant paints in its own context and would otherwise lose the clip.

---

## Motion architecture

Everything animated shares **one `requestAnimationFrame` loop** (`lib/motion.ts`).
Components subscribe with `onTick(fn)` instead of starting their own loops, which
keeps the frame budget predictable and means scroll, pointer and physics all read
from the same instant.

- `scrollState` — position, progress, velocity and a smoothed `energy` value, written
  once per frame by the Lenis provider and read by everyone else. No component binds
  its own scroll listener.
- `pointer` — raw, smoothed and normalised pointer coordinates plus speed, bound once.
- `damp(a, b, speed, dt)` — frame-rate independent easing. Used everywhere a value
  chases a target, so behaviour is identical at 60Hz and 120Hz.

Reveals are declarative: any element with `data-reveal` is picked up by a single
`IntersectionObserver`, and stagger is expressed as `--reveal-delay` in the style
attribute. No timing logic in JavaScript.

`prefers-reduced-motion` is honoured throughout — Lenis drops to near-native
scrolling, the horizontal rail unpins, physics and the custom cursor switch off, and
the shader renders a fixed frame.

---

## The pieces

| Surface | What it is |
| --- | --- |
| `components/canvas/Cosmos.tsx` | The persistent ground: a lensed black hole. See below. Three.js is dynamically imported so it never blocks first paint. |
| `components/chrome/EventHorizon.tsx` | The easter egg. See below. |
| `components/canvas/TokenField.tsx` | Soft-body physics over real DOM. Stack tokens keep their normal flex-wrap layout and only `transform` is written, so text stays selectable and focusable. Cursor repulsion, springs home, pairwise separation. |
| `components/sections/Flagship.tsx` | Pyraxis presented as a working browser window — real tabs, an omnibox that retypes on navigation, cursor-driven tilt. He built a browser, so the case study is one. |
| `components/sections/Work.tsx` | Horizontal rail. The section is made tall enough that one page-scroll equals one track-pixel, then pinned with `position: sticky` and driven from the shared ticker so it stays locked to Lenis's interpolated position. Unpins below 900px — horizontal scroll-jacking on touch is a usability tax. |
| `components/chrome/Cursor.tsx` | Two-part cursor: a hard dot tracking 1:1 and a lagging ring that stretches along the direction of travel and carries state. Any element drives it with `data-cursor` / `data-cursor-label`. |
| `components/ui/Kinetic.tsx` | Masked type reveal, split on the server so there is no flash of unsplit text and no layout shift. The real string stays in `aria-label`. |

---

## The cosmos

The background is a Schwarzschild black hole, ray-traced. Each pixel integrates a
null geodesic backwards from the camera rather than faking the optics in screen
space. Working in units of M = 1 (so Rs = 2), the photon path obeys

```
d²r/dλ² = -3·h²·r / |r|⁵        h = |r × v|
```

which follows from the Binet equation for light, `u'' + u = 3Mu²`. (The `-3/2`
coefficient that circulates in shader demos is written in units where Rs = 1;
using it with M = 1 constants halves the shadow and detaches it from the ISCO.)

Everything the eye recognises then falls out of the integration instead of being
drawn on:

| Feature | Where it comes from |
| --- | --- |
| The shadow | Rays with `b < 3√3 M` are captured. It is ~2.6 Rs across — much larger than the horizon, which is the detail most fakes get wrong |
| Photon ring | Rays just outside that impact parameter wind around repeatedly and pick the disk up several times |
| Far side over the top | Those rays genuinely bend around the hole, so the underside and far side arrive above and below the shadow |
| Einstein arcs | The escaped ray direction samples the starfield, so whatever bent the ray bends the sky too |

Shading is relativistic. Doppler and gravitational shift combine into one factor
`g`; observed intensity goes as `g⁴` and the observed colour is the emitted
blackbody shifted by `g`. The resulting asymmetry — one limb blue-white and
fierce, the other dim and red — is what actually reads as "real". Emission
follows a Shakura–Sunyaev thin disk with a zero-torque inner boundary, so it
fades out at the ISCO instead of stopping at a hard edge.

Two details that matter more than they sound:

- **The disk is tone mapped on luminance, not per channel.** Per-channel Reinhard
  compresses the largest channel hardest, bleaching saturated colour to grey
  exactly where the disk is most interesting.
- **Turbulence is advected on a cyclic flow map.** Advecting noise by `ωt`
  directly winds it up without bound — `∂φ/∂r` grows linearly with elapsed time
  until the disk aliases into concentric wires. Real plasma is continuously
  restirred, so two half-cycle-offset layers cross-fade, each advected for only
  half a cycle and each fading to nothing exactly when it resets.

### The starfield

Cells live on a cube parameterisation — no pole pinch, roughly equal area
everywhere. Magnitudes follow a steep power law, because a sky of equal dots
reads as noise while a few bright ones read as sky. Each star is a bright core
plus a wide faint halo (the shape of a real PSF), colour tied to magnitude since
hot stars are both rarer and brighter, and only the top few percent earn
diffraction spikes. A Milky Way band raises density near the galactic plane and
dust lanes cut into it.

### The swarm

On top of the trace sits an N-body layer: 900 stars integrated in the same world
coordinates, launched sub-circular on inclined orbits so they decay into the disk
plane. They brighten and blue-shift as they fall, stretch into tidal streams, are
occluded when they pass behind the shadow, and respawn at the rim once consumed.
They share the camera basis with the shader, so the two always agree about where
things are.

The hole has **mass**. It sits in the right-hand margin, drifts with scroll, and
leans toward the cursor — heavily damped, so dragging it feels like moving
something enormous rather than sliding a sprite. It dims once the reader is past
the hero: the spectacle belongs to the first screen.

Cost is managed rather than hoped for. Rays whose impact parameter never reaches
the strong-field region skip integration entirely and sample the sky directly —
about four fifths of the screen. The layer caps its own pixel ratio and, if
frames run long, lowers its own resolution instead of dropping the effect.

### The collapse

At the very end of the footer colophon there is a small dark disc. Clicking it
lets the hole eat the page.

Every word currently on screen is measured with a `Range`, lifted into a fixed
overlay as an absolutely-positioned span carrying its own copied typography,
and handed to the same gravity the stars obey. Words spiral in, rotate to
align with the radius, and stretch along it as tidal forces win. The disk
flares and the horizon swells in proportion to how much has been consumed.

Only the visible viewport is harvested — you cannot eat what you cannot see —
which keeps the word count bounded and the effect at full frame rate. The rest
of the document hides behind it.

Nothing is persisted. A reload brings the page back, and the aftermath offers
a button that does exactly that. Deadlines inside the simulation are measured
against the wall clock rather than simulated time, because the shared ticker
clamps `dt`: on a slow device the collapse must still finish on schedule.
Under `prefers-reduced-motion` the physics is skipped entirely.

---

## Assets

`scripts/generate-assets.mjs` writes every texture in `public/assets` procedurally —
seeded, so re-running produces identical output. PNGs are encoded by hand (IHDR /
IDAT / IEND + CRC32 + zlib) with no dependencies outside Node's standard library.

- `grain.png` — triangular-distribution film grain
- `topo-field.png` — fBm contour field, elevation-tinted
- `halftone.png` — dot-ramp
- `mark.svg`, `arc-grid.svg`, `layer-stack.svg` — vector marks

`pyraxis-shot.webp` is a real screenshot of Pyraxis Browser.

---

## Content

All copy lives in `lib/data.ts` — one file, no strings scattered through components.
Edit there and the whole site follows.

## Structure

```
app/          layout, page, providers, 404
components/
  canvas/     WebGL ground, DOM physics
  chrome/     nav, rail, cursor, boot
  sections/   hero, ticker, flagship, work, stack, about, contact, footer
  ui/         magnetic, kinetic
lib/          data, motion primitives, scroll provider, reveal observer
styles/       tokens, base, chrome, ui, sections
scripts/      procedural asset generator
```

## Browser support

Modern evergreen browsers. `color-mix()`, `background-clip: text`, `aspect-ratio`
and `100svh` are used without fallbacks other than where noted. If WebGL is
unavailable the ground falls back to a layered CSS gradient and nothing else
changes.
