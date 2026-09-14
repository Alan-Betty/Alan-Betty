'use client';

import { useEffect, useRef } from 'react';
import { clamp, damp, onTick, pointer, prefersReducedMotion, scrollState } from '@/lib/motion';
import { singularity } from '@/lib/singularity';

/* ══════════════════════════════════════════════════════════════
   COSMOS — a Schwarzschild black hole, ray-traced.

   Rather than fake the optics in screen space, each pixel traces a
   null geodesic backwards from the camera. Working in units of
   M = 1 (so Rs = 2), the photon path obeys

       d²r/dλ² = -3/2 · h² · r / |r|⁵ ,   h = |r × v|

   which is the exact orbit equation for light in Schwarzschild.
   Everything the eye recognises then falls out of the integration
   instead of being drawn on:

     · the shadow, at b = 3√3 M ≈ 2.6 Rs — not at the horizon
     · the photon ring hugging its edge, where rays wind repeatedly
     · the disk's far side lifted over and under the hole, because
       those rays genuinely bend around it
     · Einstein arcs in the background starfield

   Shading is relativistic too: Doppler and gravitational shift give
   a single factor g, intensity goes as g⁴, and the observed colour
   is the emitted blackbody shifted by g. That asymmetry — one limb
   blue-white and fierce, the other dim and red — is the thing that
   reads as real.
   ══════════════════════════════════════════════════════════════ */

const VERT = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec2  uRes;
  uniform float uTime;
  uniform vec2  uHole;      // screen offset of the hole, uv units
  uniform float uZoom;      // FOV scale; sets the apparent size
  uniform float uFeed;      // 0..1, the easter egg feeding the disk
  uniform float uIntro;
  uniform float uDim;       // content sections pull the ground back
  uniform float uBlast;     // 0..1, the detonation at the end of the egg
  uniform float uShock;     // shock-front radius, uv units

  /* ── geometry, in units of M = 1 ─────────────────────────── */
  const float RS       = 2.0;
  const float DISK_IN  = 6.0;    // ISCO for Schwarzschild
  const float DISK_OUT = 24.0;
  const float RMAX     = 30.0;   // strong-field region; must exceed DISK_OUT
  const float CAM_D    = 84.0;
  const float INCL     = 0.32;   // ~18 degrees above the disk plane

  /* ── hashing ─────────────────────────────────────────────── */

  float h21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  vec2 h22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = h21(i);
    float b = h21(i + vec2(1.0, 0.0));
    float c = h21(i + vec2(0.0, 1.0));
    float d = h21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.62, 1.18, -1.18, 1.62);
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p = m * p;
      a *= 0.5;
    }
    return v;
  }

  /* ── blackbody ───────────────────────────────────────────── */
  /* t is a normalised temperature; the ramp walks the Planckian
     locus from a dull ember through white to the blue-white of a
     strongly blueshifted approaching limb. */
  vec3 blackbody(float t) {
    vec3 c = mix(vec3(1.00, 0.12, 0.01), vec3(1.00, 0.42, 0.06), smoothstep(0.00, 0.30, t));
    c = mix(c, vec3(1.00, 0.72, 0.30), smoothstep(0.26, 0.54, t));
    c = mix(c, vec3(1.00, 0.95, 0.84), smoothstep(0.50, 0.80, t));
    c = mix(c, vec3(0.66, 0.80, 1.00), smoothstep(0.78, 1.25, t));
    return c;
  }

  /* ══ STARFIELD ═══════════════════════════════════════════════
     Sampled by direction once a ray escapes, so the lensing that
     bent the ray also bends the sky: arcs near the shadow come for
     free. Cells live on a cube parameterisation — no pole pinch,
     and roughly equal area everywhere. */

  vec2 cubeFace(vec3 d, out float face) {
    vec3 a = abs(d);
    if (a.x >= a.y && a.x >= a.z) {
      face = d.x > 0.0 ? 0.0 : 1.0;
      return vec2(d.z, d.y) / a.x;
    } else if (a.y >= a.z) {
      face = d.y > 0.0 ? 2.0 : 3.0;
      return vec2(d.x, d.z) / a.y;
    }
    face = d.z > 0.0 ? 4.0 : 5.0;
    return vec2(d.x, d.y) / a.z;
  }

  vec3 starCells(vec3 dir, float scale, float density, float gain, float band, float spikes) {
    float face;
    vec2 uvf = cubeFace(dir, face);
    vec2 g = uvf * scale;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    vec3 acc = vec3(0.0);

    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 o = vec2(float(i), float(j));
        vec2 cid = id + o + face * 137.0;

        float sel = h21(cid);
        // The galactic plane is crowded; the halo is not
        if (sel >= density * (0.45 + band * 1.5)) continue;

        vec2 jitter = h22(cid + 19.3) - 0.5;
        vec2 rel = f - o - jitter;
        float d2 = dot(rel, rel);

        /* Apparent magnitude follows a steep power law: a sky of
           equal dots reads as noise, a few bright ones read as sky. */
        float mag = h21(cid + 7.7);
        float bright = pow(mag, 5.0) * 5.2 + 0.055;

        // Core plus a wide, faint halo — the shape of a real PSF
        float core = 1.0 / (1.0 + d2 * 11000.0);
        float halo = 1.0 / (1.0 + d2 * 520.0) * 0.16;
        float s = (core + halo) * bright * gain;

        /* Only the brightest few earn diffraction spikes. */
        if (spikes > 0.0 && mag > 0.955) {
          float sp = exp(-abs(rel.x) * 190.0) + exp(-abs(rel.y) * 190.0);
          s += sp * exp(-d2 * 120.0) * bright * 0.5 * spikes;
        }

        // Hotter stars are rarer and brighter — tie colour to magnitude
        float temp = mix(h21(cid + 3.1), mag, 0.55);
        vec3 col = mix(vec3(1.00, 0.72, 0.48), vec3(0.74, 0.83, 1.00), smoothstep(0.25, 0.95, temp));
        acc += col * s;
      }
    }
    return acc;
  }

  vec3 starField(vec3 dir) {
    vec3 pole = normalize(vec3(0.30, 0.86, -0.41));
    float gl = dot(dir, pole);
    float band = exp(-gl * gl * 13.0);

    vec3 col = vec3(0.0);

    /* The Milky Way: a diffuse lane of unresolved stars, cut by dust.
       Cheap, and it stops the sky reading as uniform static. */
    float face;
    vec2 uvf = cubeFace(dir, face);
    float dust = fbm(uvf * 5.5 + face * 13.0);
    float milk = band * (0.55 + dust * 0.75) * smoothstep(0.15, 0.95, band);
    col += mix(vec3(0.070, 0.062, 0.098), vec3(0.115, 0.098, 0.088), dust) * milk * 0.55;
    // Dark nebulae bite into the band
    col *= 1.0 - band * smoothstep(0.62, 0.95, fbm(uvf * 9.0 + 31.0)) * 0.75;

    col += starCells(dir, 24.0, 0.34, 1.55, band, 1.0);
    col += starCells(dir, 58.0, 0.30, 0.68, band, 0.0);
    col += starCells(dir, 140.0, 0.26, 0.26, band, 0.0);

    return col;
  }

  /* ══ ACCRETION DISK ══════════════════════════════════════════ */

  vec3 diskEmission(vec3 hp, float rd, vec3 kObs) {
    float phi = atan(hp.z, hp.x);

    // Keplerian rotation, and the orbital speed a local static
    // observer measures for a circular orbit at this radius
    float omega = 1.0 / (rd * sqrt(rd));
    float beta = min(sqrt(1.0 / (rd - RS)), 0.92);
    vec3 vhat = normalize(cross(vec3(0.0, 1.0, 0.0), hp));
    float gamma = inversesqrt(1.0 - beta * beta);

    // Combined Doppler and gravitational shift
    float dop = 1.0 / (gamma * (1.0 - dot(vhat * beta, kObs)));
    float grav = sqrt(max(0.0, 1.0 - RS / rd));
    float g = dop * grav;

    /* Shakura-Sunyaev thin disk with a zero-torque inner boundary:
       emission dies at the ISCO rather than stopping abruptly. */
    float f = max(0.0, 1.0 - sqrt(DISK_IN / rd));
    float tEmit = pow(f, 0.25) * pow(DISK_IN / rd, 0.75);

    /* Differential rotation shears structure into azimuthal filaments.
       Advecting noise by ωt directly would wind it up without bound —
       ∂φ/∂r grows linearly with elapsed time until the disk aliases
       into concentric wires. Real plasma is continuously restirred,
       so two half-cycle-offset layers are cross-faded: each is only
       ever advected for half a cycle, and each fades to nothing
       exactly when it resets. */
    const float CYCLE = 7.0;
    float ph = uTime / CYCLE;
    float f1 = fract(ph);
    float f2 = fract(ph + 0.5);
    float wA = 1.0 - abs(2.0 * f1 - 1.0);

    float a1 = phi + f1 * CYCLE * omega * 16.0;
    float a2 = phi + f2 * CYCLE * omega * 16.0;

    float nA = fbm(vec2(a1 * 1.15, rd * 0.9)) * 0.58
             + fbm(vec2(a1 * 3.2 + 5.0, rd * 2.7)) * 0.42;
    float nB = fbm(vec2(a2 * 1.15 + 41.0, rd * 0.9 + 17.0)) * 0.58
             + fbm(vec2(a2 * 3.2 + 63.0, rd * 2.7 + 29.0)) * 0.42;

    float dens = smoothstep(0.2, 0.86, mix(nB, nA, wA));

    float env = smoothstep(DISK_IN, DISK_IN * 1.22, rd) *
                (1.0 - smoothstep(DISK_OUT * 0.52, DISK_OUT, rd));

    // Observed intensity follows the g^4 beaming law
    float g2 = g * g;
    float inten = g2 * g2 * tEmit * env * dens * (1.0 + uFeed * 3.2);

    return blackbody(clamp(tEmit * g * 1.15, 0.0, 1.35)) * inten;
  }

  /* ══ MAIN ════════════════════════════════════════════════════ */

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    vec2 sc = uv - uHole;

    // Camera looks at the hole from just above the disk plane
    vec3 cam = vec3(0.0, sin(INCL), -cos(INCL)) * CAM_D;
    vec3 fwd = normalize(-cam);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
    vec3 up = cross(fwd, right);

    vec3 dir = normalize(fwd + (right * sc.x + up * sc.y) * uZoom);

    /* Straight-line run-in. Spacetime this far out is flat to the
       eye, so only rays that actually reach the strong-field region
       pay for integration — roughly a fifth of the screen. */
    float tca = -dot(cam, dir);
    float b2 = dot(cam, cam) - tca * tca;

    vec3 col = vec3(0.0);

    if (b2 > RMAX * RMAX || tca < 0.0) {
      col = starField(dir);
    } else {
      vec3 pos = cam + dir * (tca - sqrt(RMAX * RMAX - b2));
      vec3 vel = dir;
      vec3 hv = cross(pos, vel);
      float h2 = dot(hv, hv);

      float trans = 1.0;
      bool captured = false;

      for (int i = 0; i < 190; i++) {
        float r2 = dot(pos, pos);
        float r = sqrt(r2);

        if (r < RS * 1.01) { captured = true; break; }
        if (r > RMAX * 1.7 && dot(pos, vel) > 0.0) break;

        // Fine steps where the curvature is, coarse steps where it is not
        float dt = clamp((r - RS) * 0.115, 0.028, 1.05);

        /* Binet for a photon gives u'' + u = 3Mu², and for a central
           acceleration u'' + u = -a_r/(h²u²), so a_r = -3M·h²/r⁴.
           With M = 1 the coefficient is 3, not the 3/2 that circulates —
           that form is written in units where Rs = 1, which would halve
           the shadow and leave it detached from the ISCO. */
        vec3 acc = -3.0 * h2 * pos / (r2 * r2 * r);
        vec3 p0 = pos;
        vel += acc * dt;
        pos += vel * dt;

        // Disk crossing: sign change of y, position found by lerp
        if (p0.y * pos.y < 0.0) {
          float t = p0.y / (p0.y - pos.y);
          vec3 hp = mix(p0, pos, t);
          float rd = length(hp.xz);
          if (rd > DISK_IN && rd < DISK_OUT) {
            // The photon runs from the disk to us: opposite our march
            col += trans * diskEmission(hp, rd, -normalize(vel));
            // Optically thick enough to shade what lies behind it
            trans *= 0.3;
            if (trans < 0.02) break;
          }
        }
      }

      if (!captured) col += trans * starField(normalize(vel));
    }

    /* The g^4 law produces a genuine HDR range, so it has to be tone
       mapped rather than clipped. Map on luminance and rescale the
       chroma: per-channel Reinhard compresses the largest channel
       hardest, which bleaches saturated colour to grey exactly where
       the disk is most interesting. A little bleach is then blended
       back at the very top, because real highlights do blow to white. */
    col *= 5.6 * (1.0 + uFeed * 0.7);

    /* ── DETONATION ────────────────────────────────────────────
       No physics to appeal to here — a hole this size does not do
       this — so the target is the read: a hard core flash, a shell
       that expands and cools as it sweeps out, and a wash across
       the frame. It is added before the tone map, so the peak
       genuinely saturates to white instead of being clipped there. */
    if (uBlast > 0.001) {
      float d = length(sc);
      float b = uBlast;

      // Core: a short-lived point source where the hole used to be
      col += vec3(1.00, 0.97, 0.92) * exp(-d * d * 26.0) * b * b * 90.0;

      /* Shock shell. The front thickens and reddens as it runs out,
         the way a blast wave cools while it expands. */
      float w = 0.035 + uShock * 0.12;
      float shell = exp(-pow((d - uShock) / w, 2.0));
      float cool = clamp(uShock / 1.3, 0.0, 1.0);
      vec3 hot = mix(vec3(1.00, 0.93, 0.80), vec3(1.00, 0.30, 0.08), cool);
      col += hot * shell * b * (1.0 - cool * 0.7) * 22.0;

      // Whole-frame wash, so the flash reads as light in the room
      col += vec3(0.85, 0.80, 1.00) * b * b * 0.7 * exp(-d * 0.7);
    }

    float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
    float mapped = lum / (1.0 + lum);
    col *= mapped / max(lum, 1e-4);
    col = mix(col, vec3(mapped), smoothstep(0.72, 1.0, mapped) * 0.5);

    // Depth toward the frame edges
    float vig = 1.0 - smoothstep(0.45, 1.4, length(uv * vec2(0.88, 1.0)));
    col *= mix(0.5, 1.0, vig);

    // The hero gets the spectacle; below it the ground yields to the copy
    col *= uDim * 0.94 * uIntro;

    col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.004;

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ── Infalling stars ──────────────────────────────────────────── */

const STAR_VERT = /* glsl */ `
  attribute vec3 aPos;
  attribute vec2 aMeta;   // size, temperature

  uniform vec3  uCam;
  uniform vec3  uRight;
  uniform vec3  uUp;
  uniform vec3  uFwd;
  uniform vec2  uHole;
  uniform float uZoom;
  uniform float uAspect;
  uniform float uDpr;
  uniform float uShadow;
  uniform float uDim;
  uniform float uBlast;

  varying vec3 vTint;
  varying float vAlpha;

  void main() {
    vec3 rel = aPos - uCam;
    float cz = dot(rel, uFwd);

    if (cz < 1.0) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vAlpha = 0.0;
      return;
    }

    vec2 sc = vec2(dot(rel, uRight), dot(rel, uUp)) / (cz * uZoom);
    vec2 uv = sc + uHole;

    // Anything on the far side of the shadow is simply gone
    float behind = step(0.0, dot(aPos, uFwd));
    float occl = 1.0 - smoothstep(uShadow * 0.88, uShadow * 1.04, length(sc));
    vAlpha = uDim * (1.0 - occl * behind) * (1.0 + uBlast * 2.4);

    vTint = mix(vec3(1.0, 0.74, 0.46), vec3(0.78, 0.87, 1.0), aMeta.y);
    // Debris thrown clear of the blast is lit by it
    vTint = mix(vTint, vec3(1.0, 0.98, 0.94), uBlast * 0.7);

    gl_Position = vec4(uv.x / (uAspect * 0.5), uv.y * 2.0, 0.0, 1.0);
    gl_PointSize = max(1.0, aMeta.x * uDpr * (1.0 + uBlast * 1.5));
  }
`;

const STAR_FRAG = /* glsl */ `
  precision mediump float;
  varying vec3 vTint;
  varying float vAlpha;

  void main() {
    if (vAlpha <= 0.002) discard;
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    // Bright core, wide faint halo
    float a = exp(-d * d * 19.0) + exp(-d * d * 2.6) * 0.22;
    gl_FragColor = vec4(vTint * a * vAlpha, a * vAlpha);
  }
`;

const TRAIL_VERT = /* glsl */ `
  attribute vec3 aPos;
  attribute vec2 aMeta;   // alpha, temperature

  uniform vec3  uCam;
  uniform vec3  uRight;
  uniform vec3  uUp;
  uniform vec3  uFwd;
  uniform vec2  uHole;
  uniform float uZoom;
  uniform float uAspect;
  uniform float uShadow;
  uniform float uDim;
  uniform float uBlast;

  varying vec3 vTint;
  varying float vAlpha;

  void main() {
    vec3 rel = aPos - uCam;
    float cz = dot(rel, uFwd);
    if (cz < 1.0) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      vAlpha = 0.0;
      return;
    }
    vec2 sc = vec2(dot(rel, uRight), dot(rel, uUp)) / (cz * uZoom);
    float behind = step(0.0, dot(aPos, uFwd));
    float occl = 1.0 - smoothstep(uShadow * 0.88, uShadow * 1.04, length(sc));
    vAlpha = aMeta.x * uDim * (1.0 - occl * behind) * (1.0 + uBlast * 2.4);
    vTint = mix(vec3(1.0, 0.66, 0.36), vec3(0.82, 0.89, 1.0), aMeta.y);
    vTint = mix(vTint, vec3(1.0, 0.98, 0.94), uBlast * 0.7);
    gl_Position = vec4((sc.x + uHole.x) / (uAspect * 0.5), (sc.y + uHole.y) * 2.0, 0.0, 1.0);
  }
`;

const TRAIL_FRAG = /* glsl */ `
  precision mediump float;
  varying vec3 vTint;
  varying float vAlpha;
  void main() {
    if (vAlpha <= 0.002) discard;
    gl_FragColor = vec4(vTint * vAlpha, vAlpha);
  }
`;

const STAR_COUNT = 900;
/** Angular radius of the shadow: b = 3√3 M, in units of M. */
const B_SHADOW = 5.19615;
const CAM_D = 84;
const INCL = 0.32;
/** Simulated time per real second. */
const TIMESCALE = 62;

export default function Cosmos() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    import('three').then((THREE) => {
      if (disposed || !host) return;

      let renderer: import('three').WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
        });
      } catch {
        host.dataset.state = 'unsupported';
        return;
      }

      const reduced = prefersReducedMotion();
      // Ray-marched: a softer raster is the right trade for a background
      let quality = Math.min(window.devicePixelRatio || 1, 1.0);

      renderer.setPixelRatio(quality);
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      renderer.setClearColor(0x03030a, 1);
      renderer.autoClear = false;

      const canvas = renderer.domElement;
      canvas.setAttribute('aria-hidden', 'true');
      host.appendChild(canvas);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const aspect = () => window.innerWidth / window.innerHeight;

      /* Camera basis, shared by the shader and the particle layer so the
         two always agree about where things are. */
      const camPos = new THREE.Vector3(0, Math.sin(INCL), -Math.cos(INCL)).multiplyScalar(CAM_D);
      const fwd = camPos.clone().negate().normalize();
      const right = new THREE.Vector3(0, 1, 0).cross(fwd).normalize();
      const up = fwd.clone().cross(right);

      /** Screen radius (uv units) we want the shadow to occupy. */
      const shadowTarget = () => (window.innerWidth < 760 ? 0.078 : 0.058);
      /** FOV scale that puts the shadow at that radius. */
      const zoomFor = (target: number) => B_SHADOW / CAM_D / target;

      const uniforms = {
        uRes: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uHole: { value: new THREE.Vector2(0.26, 0.04) },
        uZoom: { value: zoomFor(0.058) },
        uFeed: { value: 0 },
        uIntro: { value: 0 },
        uDim: { value: 1 },
        uBlast: { value: 0 },
        uShock: { value: 0 },
      };

      const skyMat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms,
        depthWrite: false,
        depthTest: false,
      });
      const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMat);
      sky.frustumCulled = false;
      scene.add(sky);

      /* ── N-body layer, integrated in the same world units ────── */

      const P = new Float32Array(STAR_COUNT * 3);
      const V = new Float32Array(STAR_COUNT * 3);
      const temp = new Float32Array(STAR_COUNT);

      const starPos = new Float32Array(STAR_COUNT * 3);
      const starMeta = new Float32Array(STAR_COUNT * 2);
      const trailPos = new Float32Array(STAR_COUNT * 2 * 3);
      const trailMeta = new Float32Array(STAR_COUNT * 2 * 2);

      /** 0..1, mirrored from the easter egg each frame so `spawn` can read it. */
      let gorge = 0;

      function spawn(i: number, initial: boolean) {
        const o = i * 3;
        const ang = Math.random() * Math.PI * 2;
        /* While it is gorging, replacements arrive close in and arrive
           hungry — the swarm has to read as a stream being eaten, not as a
           steady state that happens to be brighter. */
        const born = gorge > 0.02 ? 26 + Math.random() * 26 : 46 + Math.random() * 30;
        const rad = initial ? 9 + Math.random() * 62 : born;
        // A swarm, not a ring: orbits are inclined to the disk plane
        const tilt = (Math.random() - 0.5) * 0.85;

        P[o] = Math.cos(ang) * rad;
        P[o + 1] = Math.sin(tilt) * rad * 0.5;
        P[o + 2] = Math.sin(ang) * rad;

        const r = Math.hypot(P[o], P[o + 1], P[o + 2]);
        const vCirc = Math.sqrt(1 / r); // GM = M = 1
        const k = 0.52 + Math.random() * 0.4;
        const spin = Math.random() < 0.85 ? 1 : -1;

        // Tangential launch, slightly sub-circular so the orbit decays
        V[o] = (-P[o + 2] / r) * vCirc * k * spin;
        V[o + 1] = (Math.random() - 0.5) * vCirc * 0.25;
        V[o + 2] = (P[o] / r) * vCirc * k * spin;

        temp[i] = Math.random();
      }
      for (let i = 0; i < STAR_COUNT; i++) spawn(i, true);

      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('aPos', new THREE.BufferAttribute(starPos, 3));
      starGeo.setAttribute('aMeta', new THREE.BufferAttribute(starMeta, 2));
      starGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);

      const shared = {
        uCam: { value: camPos },
        uRight: { value: right },
        uUp: { value: up },
        uFwd: { value: fwd },
        uHole: { value: uniforms.uHole.value },
        uZoom: { value: uniforms.uZoom.value },
        uAspect: { value: 1 },
        uDpr: { value: quality },
        uShadow: { value: 0.058 },
        uDim: { value: 1 },
        uBlast: { value: 0 },
      };

      const starMat = new THREE.ShaderMaterial({
        vertexShader: STAR_VERT,
        fragmentShader: STAR_FRAG,
        uniforms: shared,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      });
      const stars = new THREE.Points(starGeo, starMat);
      stars.frustumCulled = false;
      scene.add(stars);

      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute('aPos', new THREE.BufferAttribute(trailPos, 3));
      trailGeo.setAttribute('aMeta', new THREE.BufferAttribute(trailMeta, 2));
      trailGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);

      const trailMat = new THREE.ShaderMaterial({
        vertexShader: TRAIL_VERT,
        fragmentShader: TRAIL_FRAG,
        uniforms: shared,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      });
      const trails = new THREE.LineSegments(trailGeo, trailMat);
      trails.frustumCulled = false;
      scene.add(trails);

      /* ── viewport ────────────────────────────────────────────── */

      const resize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h, false);
        uniforms.uRes.value.set(w * quality, h * quality);
        const target = shadowTarget();
        uniforms.uZoom.value = zoomFor(target);
        shared.uZoom.value = uniforms.uZoom.value;
        shared.uShadow.value = target;
        shared.uAspect.value = aspect();
        shared.uDpr.value = quality;
      };
      resize();
      window.addEventListener('resize', resize, { passive: true });

      let visible = !document.hidden;
      const onVis = () => {
        visible = !document.hidden;
      };
      document.addEventListener('visibilitychange', onVis);

      const onLost = (e: Event) => {
        e.preventDefault();
        host.dataset.state = 'lost';
      };
      const onRestored = () => {
        host.dataset.state = 'live';
        resize();
      };
      canvas.addEventListener('webglcontextlost', onLost);
      canvas.addEventListener('webglcontextrestored', onRestored);
      host.dataset.state = 'live';

      /* ── frame ───────────────────────────────────────────────── */

      let holeX = 0.26;
      let holeY = 0.04;
      let feed = 0;
      let dim = 1;
      let shadowNow = shadowTarget();
      /** Detonation brightness, and how far its shock front has swept. */
      let blast = 0;
      let shock = 0;
      let lastBlast = singularity.blastId;
      let slowFrames = 0;

      /** Everything the hole was holding, thrown straight back out. */
      function detonateSwarm() {
        for (let i = 0; i < STAR_COUNT; i++) {
          const o = i * 3;
          const r = Math.hypot(P[o], P[o + 1], P[o + 2]) || 1;
          // Comfortably past escape, and the closest material carries most
          const v = 1.35 * Math.sqrt(2 / Math.max(r, 2.5)) + 0.12;
          V[o] = (P[o] / r) * v + (Math.random() - 0.5) * 0.05;
          V[o + 1] = (P[o + 1] / r) * v + (Math.random() - 0.5) * 0.05;
          V[o + 2] = (P[o + 2] / r) * v + (Math.random() - 0.5) * 0.05;
          temp[i] = 0.55 + temp[i] * 0.45;
        }
      }

      const stop = onTick((dt, elapsed) => {
        if (!visible) return;
        const asp = aspect();

        /* A background that costs frames is a bad background: lower the
           raster rather than drop the effect. */
        if (dt > 0.036) {
          slowFrames++;
          if (slowFrames > 40 && quality > 0.5) {
            quality = Math.max(0.5, quality - 0.2);
            renderer.setPixelRatio(quality);
            resize();
            slowFrames = 0;
          }
        } else if (slowFrames > 0) {
          slowFrames--;
        }

        uniforms.uTime.value = reduced ? 9 : elapsed;
        uniforms.uIntro.value = damp(uniforms.uIntro.value, 1, 0.028, dt);

        /* ── the easter egg ──────────────────────────────────────
           The DOM side fires the trigger and owns the copy; the blast
           itself is animated here, where the hole lives. */
        const egg = singularity.phase !== 'idle';
        gorge = singularity.gorge;

        if (singularity.blastId !== lastBlast) {
          lastBlast = singularity.blastId;
          detonateSwarm();
          // A full-frame white flash is exactly what reduced motion is for
          blast = reduced ? 0.18 : 1;
          shock = 0;
        }
        if (blast > 0) {
          // Hard flash, long afterglow
          blast = blast * Math.pow(0.18, dt);
          shock += dt * 1.1;
          if (blast < 0.002) blast = 0;
        }
        uniforms.uBlast.value = blast;
        uniforms.uShock.value = shock;
        shared.uBlast.value = blast;
        singularity.blast = blast;
        singularity.shock = shock;

        /* The hero earns the full exposure. Past it the ground drops hard —
           it is 4x brighter than it used to be, and copy has to win. The
           egg is the one time the hole is the subject rather than the
           ground, so the exposure comes all the way back up. */
        const dimTarget = egg ? 1 : 1 - 0.76 * clamp((scrollState.progress - 0.04) / 0.26);
        dim = damp(dim, dimTarget, 0.03, dt);
        uniforms.uDim.value = dim;
        shared.uDim.value = dim;

        // Feeding swells the shadow; the blast throws it wider still
        const grown = shadowTarget() * (1 + gorge * 0.5 + blast * 0.25);
        shadowNow = damp(shadowNow, grown, 0.05, dt);
        uniforms.uZoom.value = zoomFor(shadowNow);
        shared.uZoom.value = uniforms.uZoom.value;
        shared.uShadow.value = shadowNow;

        const homeX = asp * 0.27;
        const homeY = 0.05 - scrollState.progress * 0.16;
        let targetX = homeX;
        let targetY = homeY;
        if (egg) {
          // Centre stage for the collapse
          targetX = 0;
          targetY = 0;
        } else if (pointer.active && !reduced) {
          const pxUv = pointer.snx * 0.5 * asp;
          const pyUv = -pointer.sny * 0.5;
          targetX = homeX + (pxUv - homeX) * 0.3;
          targetY = homeY + (pyUv - homeY) * 0.3;
        }
        // Heavy damping: it should feel like moving something enormous
        holeX = damp(holeX, targetX, 0.022, dt);
        holeY = damp(holeY, targetY, 0.022, dt);
        uniforms.uHole.value.set(holeX, holeY);

        // The disk has to answer the blast on the same frame, not a second later
        feed = damp(feed, singularity.feed, blast > 0.01 ? 0.25 : 0.06, dt);
        uniforms.uFeed.value = feed;

        const H = window.innerHeight;
        singularity.x = holeX * H + window.innerWidth / 2;
        singularity.y = H / 2 - holeY * H;
        singularity.r = shared.uShadow.value * singularity.swell * H;
        singularity.ready = true;

        /* ── integrate ─────────────────────────────────────────── */
        const sdt = Math.min(dt, 1 / 30) * TIMESCALE * (reduced ? 0 : 1);
        /* Feeding is modelled as drag, which is the honest way to collapse
           an orbit: bleed the angular momentum and the swarm spirals in of
           its own accord rather than being teleported inward. */
        const drag = Math.pow(0.9988 - gorge * 0.0042, sdt);
        // A heavier well while it gorges; barely a well at all mid-blast
        const gmul = (1 + gorge * 2.4) * (1 - blast * 0.92);

        for (let i = 0; i < STAR_COUNT; i++) {
          const o = i * 3;
          const x = P[o];
          const y = P[o + 1];
          const z = P[o + 2];

          const r2 = x * x + y * y + z * z;
          const r = Math.sqrt(r2);

          // Consumed just inside the shadow, or lost to infinity
          if (r < 3.0 || r > 260) {
            spawn(i, false);
            continue;
          }

          /* Newtonian is honest at these radii; the relativistic part of
             the story is told by the shader, not by the swarm. */
          const a = -gmul / (r2 * r);
          V[o] += x * a * sdt;
          V[o + 1] += y * a * sdt;
          V[o + 2] += z * a * sdt;

          V[o] *= drag;
          V[o + 1] *= drag * 0.9994; // settle toward the disk plane
          V[o + 2] *= drag;

          P[o] += V[o] * sdt;
          P[o + 1] += V[o + 1] * sdt;
          P[o + 2] += V[o + 2] * sdt;

          const speed = Math.hypot(V[o], V[o + 1], V[o + 2]);
          const heat = clamp((12 - r) / 9);

          starPos[o] = P[o];
          starPos[o + 1] = P[o + 1];
          starPos[o + 2] = P[o + 2];

          const m = i * 2;
          // Power-law sizes: a crowd of identical dots reads as noise
          starMeta[m] = (0.9 + Math.pow(temp[i], 3) * 3.4) * (1 + heat * 2.6);
          starMeta[m + 1] = clamp(temp[i] * 0.55 + heat * 0.7);

          /* Tidal stream: the closer in, the longer the streak. This is
             where the swarm gets to show some drama of its own. */
          const tail = (0.5 + heat * heat * 9.0) * Math.min(1, speed * 5);
          const t0 = i * 6;
          trailPos[t0] = P[o] - V[o] * tail;
          trailPos[t0 + 1] = P[o + 1] - V[o + 1] * tail;
          trailPos[t0 + 2] = P[o + 2] - V[o + 2] * tail;
          trailPos[t0 + 3] = P[o];
          trailPos[t0 + 4] = P[o + 1];
          trailPos[t0 + 5] = P[o + 2];

          const tm = i * 4;
          trailMeta[tm] = 0; // tail fades out
          trailMeta[tm + 1] = starMeta[m + 1];
          trailMeta[tm + 2] = Math.min(0.55, 0.05 + heat * 0.7);
          trailMeta[tm + 3] = starMeta[m + 1];
        }

        starGeo.attributes.aPos.needsUpdate = true;
        starGeo.attributes.aMeta.needsUpdate = true;
        trailGeo.attributes.aPos.needsUpdate = true;
        trailGeo.attributes.aMeta.needsUpdate = true;
        shared.uAspect.value = asp;

        renderer.clear();
        renderer.render(scene, camera);
      });

      cleanup = () => {
        stop();
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', onVis);
        canvas.removeEventListener('webglcontextlost', onLost);
        canvas.removeEventListener('webglcontextrestored', onRestored);
        sky.geometry.dispose();
        skyMat.dispose();
        starGeo.dispose();
        starMat.dispose();
        trailGeo.dispose();
        trailMat.dispose();
        renderer.dispose();
        canvas.remove();
        singularity.ready = false;
      };
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return <div ref={hostRef} className="cosmos" data-state="boot" aria-hidden="true" />;
}
