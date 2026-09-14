/**
 * Procedural asset generator.
 *
 * Writes high-resolution raster textures and vector graphics straight into
 * public/assets. Everything here is deterministic (seeded), so re-running
 * produces byte-identical output and the repo stays clean.
 *
 *   node scripts/generate-assets.mjs
 *
 * PNGs are encoded by hand (IHDR/IDAT/IEND + CRC32 + zlib deflate) so the
 * script has zero dependencies outside Node's stdlib.
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'assets');
mkdirSync(OUT, { recursive: true });

/* ── PNG encoding ─────────────────────────────────────────────── */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/** Encode RGBA pixel data (Uint8Array, w*h*4) as a PNG buffer. */
function encodePNG(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: None
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ── Deterministic noise ──────────────────────────────────────── */

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tileable value-noise lattice with cosine interpolation. */
function makeLattice(size, seed) {
  const rng = mulberry32(seed);
  const g = new Float32Array(size * size);
  for (let i = 0; i < g.length; i++) g[i] = rng();
  return g;
}

function smooth(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function sampleLattice(lat, size, x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const i = (a, b) => lat[(((b % size) + size) % size) * size + (((a % size) + size) % size)];
  const a = i(xi, yi);
  const b = i(xi + 1, yi);
  const c = i(xi, yi + 1);
  const d = i(xi + 1, yi + 1);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}

/** Tileable fractal Brownian motion in [0,1]. */
function fbm(x, y, octaves, baseFreq, lattices, size) {
  let amp = 1;
  let sum = 0;
  let norm = 0;
  let freq = baseFreq;
  for (let o = 0; o < octaves; o++) {
    sum += sampleLattice(lattices[o % lattices.length], size, x * freq, y * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/* ── 1. Film grain ────────────────────────────────────────────── */

function grain(size = 128, seed = 0x5eed) {
  const rng = mulberry32(seed);
  const px = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    // Triangular distribution reads closer to real silver-halide grain
    const v = Math.round(((rng() + rng()) / 2) * 255);
    px[i * 4] = v;
    px[i * 4 + 1] = v;
    px[i * 4 + 2] = v;
    px[i * 4 + 3] = 255;
  }
  writeFileSync(join(OUT, 'grain.png'), encodePNG(size, size, px));
  return 'grain.png';
}

/* ── 2. Topographic contour field ─────────────────────────────── */

function topo(size = 768, seed = 0x7090) {
  const L = 64;
  const lattices = [
    makeLattice(L, seed),
    makeLattice(L, seed + 1),
    makeLattice(L, seed + 2),
    makeLattice(L, seed + 3),
    makeLattice(L, seed + 4),
  ];
  const px = new Uint8Array(size * size * 4);
  const bands = 16;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * L;
      const v = (y / size) * L;
      const h = fbm(u, v, 5, 0.09, lattices, L);

      // Distance to the nearest iso-line, in band units
      const scaled = h * bands;
      const d = Math.abs(scaled - Math.round(scaled));
      // Thin, anti-aliased contour
      const line = 1 - Math.min(1, d / 0.03);
      const alpha = Math.round(Math.pow(line, 1.6) * 255);

      // Elevation tints the line: low = azure, high = signal
      const t = Math.min(1, Math.max(0, h));
      const i = (y * size + x) * 4;
      px[i] = Math.round(95 + t * 130);
      px[i + 1] = Math.round(139 + t * 110);
      px[i + 2] = Math.round(255 - t * 190);
      px[i + 3] = alpha;
    }
  }
  writeFileSync(join(OUT, 'topo-field.png'), encodePNG(size, size, px));
  return 'topo-field.png';
}

/* ── 3. Chromatic flow field (hero underlay) ──────────────────── */

function flow(w = 1600, h = 900, seed = 0xf10) {
  const L = 48;
  const lattices = [
    makeLattice(L, seed),
    makeLattice(L, seed + 7),
    makeLattice(L, seed + 13),
    makeLattice(L, seed + 29),
  ];
  const px = new Uint8Array(w * h * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = (x / w) * L;
      const v = (y / h) * L * (h / w);

      // Domain-warped noise gives the ribbon-like flow structure
      const wx = fbm(u + 11.3, v + 3.7, 4, 0.06, lattices, L);
      const wy = fbm(u - 5.1, v + 19.2, 4, 0.06, lattices, L);
      const n = fbm(u + wx * 6, v + wy * 6, 5, 0.085, lattices, L);

      const ridge = 1 - Math.abs(n * 2 - 1);
      const e = Math.pow(ridge, 3.2);

      // Vignette toward the edges keeps it usable as a full-bleed layer
      const dx = (x / w - 0.5) * 2;
      const dy = (y / h - 0.5) * 2;
      const vig = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 0.85);

      const a = e * vig;
      const i = (y * w + x) * 4;
      px[i] = Math.round((216 * n + 255 * (1 - n) * 0.3) * a);
      px[i + 1] = Math.round((251 * n * 0.85 + 79 * (1 - n)) * a);
      px[i + 2] = Math.round((79 * n + 255 * (1 - n) * 0.55) * a);
      px[i + 3] = Math.round(a * 210);
    }
  }
  writeFileSync(join(OUT, 'flow-field.png'), encodePNG(w, h, px));
  return 'flow-field.png';
}

/* ── 4. Halftone ramp ─────────────────────────────────────────── */

function halftone(size = 512, seed = 0xa17) {
  const px = new Uint8Array(size * size * 4);
  const cell = 8;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = Math.floor(x / cell) * cell + cell / 2;
      const cy = Math.floor(y / cell) * cell + cell / 2;
      const d = Math.hypot(x - cx, y - cy);
      // Dot radius ramps left→right
      const r = (1 - x / size) * (cell / 2) * 1.25;
      const a = d < r ? 255 : d < r + 1 ? Math.round((1 - (d - r)) * 255) : 0;
      const i = (y * size + x) * 4;
      px[i] = 242;
      px[i + 1] = 238;
      px[i + 2] = 230;
      px[i + 3] = a;
    }
  }
  writeFileSync(join(OUT, 'halftone.png'), encodePNG(size, size, px));
  return 'halftone.png';
}

/* ── 5. Vector marks ──────────────────────────────────────────── */

function marks() {
  const files = [];

  // Monogram / favicon — an "A" cut from a browser-tab silhouette
  const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#09070D"/>
  <path d="M8 46h48" stroke="#D8FB4F" stroke-width="3" stroke-linecap="round"/>
  <path d="M32 12 14 42h7.6l3.6-6.4h13.6L42.4 42H50L32 12Z" fill="#F2EEE6"/>
  <path d="M28.4 29.6h7.2L32 23.2l-3.6 6.4Z" fill="#09070D"/>
  <circle cx="50" cy="16" r="4" fill="#FF4F1F"/>
</svg>`;
  writeFileSync(join(OUT, 'mark.svg'), mark);
  files.push('mark.svg');

  // Concentric arc grid — used as a structural overlay
  const arcs = Array.from({ length: 9 }, (_, i) => {
    const r = 60 + i * 74;
    const o = (0.14 - i * 0.013).toFixed(3);
    return `<circle cx="0" cy="540" r="${r}" stroke="#F2EEE6" stroke-opacity="${o}" stroke-width="1" fill="none"/>`;
  }).join('\n  ');
  const rays = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 0.62 - Math.PI * 0.31;
    const x = Math.cos(a) * 760;
    const y = 540 + Math.sin(a) * 760;
    return `<line x1="0" y1="540" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#F2EEE6" stroke-opacity="0.045" stroke-width="1"/>`;
  }).join('\n  ');
  writeFileSync(
    join(OUT, 'arc-grid.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1080" fill="none">\n  ${rays}\n  ${arcs}\n</svg>`,
  );
  files.push('arc-grid.svg');

  // Blueprint plot — pseudo-schematic of the browser's layer stack
  const layers = ['chrome', 'tabs', 'omnibox', 'render', 'net', 'store'];
  const plot = layers
    .map((name, i) => {
      const y = 40 + i * 58;
      const w = 300 - i * 26;
      return `<g>
    <rect x="${20 + i * 13}" y="${y}" width="${w}" height="36" rx="4" stroke="#D8FB4F" stroke-opacity="${(0.5 - i * 0.05).toFixed(2)}" fill="#D8FB4F" fill-opacity="0.03"/>
    <text x="${32 + i * 13}" y="${y + 23}" font-family="monospace" font-size="12" fill="#D8FB4F" fill-opacity="${(0.75 - i * 0.07).toFixed(2)}">${name}</text>
  </g>`;
    })
    .join('\n  ');
  writeFileSync(
    join(OUT, 'layer-stack.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">\n  ${plot}\n</svg>`,
  );
  files.push('layer-stack.svg');

  return files;
}

/* ── Run ──────────────────────────────────────────────────────── */

const written = [grain(), topo(), halftone(), ...marks()];
console.log('assets written to public/assets:');
for (const f of written) console.log('  ·', f);
