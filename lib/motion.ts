/**
 * Motion primitives shared by every animated surface on the site.
 * Deliberately dependency-free — GSAP is reserved for scroll choreography.
 */

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Frame-rate independent lerp. `speed` is the fraction closed per 60fps frame;
 * `dt` is the real frame delta in seconds.
 */
export const damp = (a: number, b: number, speed: number, dt: number) =>
  lerp(a, b, 1 - Math.pow(1 - speed, dt * 60));

export const mapRange = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
  outMin + ((clamp(v, inMin, inMax) - inMin) / (inMax - inMin)) * (outMax - outMin);

export const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export const easeInOutQuint = (t: number) =>
  t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isFinePointer() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/* ══════════════════════════════════════════════════════════════
   Shared rAF ticker — one loop for the whole document.
   Subscribing here instead of calling requestAnimationFrame per
   component keeps the frame budget predictable.
   ══════════════════════════════════════════════════════════════ */

type TickFn = (dt: number, elapsed: number) => void;

const subscribers = new Set<TickFn>();
let rafId = 0;
let last = 0;
let start = 0;

function loop(now: number) {
  rafId = requestAnimationFrame(loop);
  if (!start) start = now;
  // Cap dt so a backgrounded tab doesn't cause a physics explosion on return
  const dt = Math.min((now - last) / 1000, 1 / 20);
  last = now;
  const elapsed = (now - start) / 1000;
  for (const fn of subscribers) fn(dt, elapsed);
}

export function onTick(fn: TickFn) {
  subscribers.add(fn);
  if (!rafId) {
    last = performance.now();
    rafId = requestAnimationFrame(loop);
  }
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0 && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
      start = 0;
    }
  };
}

/* ══════════════════════════════════════════════════════════════
   Global pointer state — normalised, smoothed, read by canvases
   and cursor effects without each of them binding its own listener.
   ══════════════════════════════════════════════════════════════ */

export const pointer = {
  /** Raw viewport coordinates in px. */
  x: 0,
  y: 0,
  /** Smoothed viewport coordinates in px. */
  sx: 0,
  sy: 0,
  /** Normalised -1..1, origin at viewport centre. */
  nx: 0,
  ny: 0,
  /** Smoothed normalised. */
  snx: 0,
  sny: 0,
  /** Pointer speed in px/s, smoothed. */
  speed: 0,
  down: false,
  /** True once the user has actually moved a fine pointer. */
  active: false,
};

let pointerBound = false;

export function bindPointer() {
  if (pointerBound || typeof window === 'undefined') return () => {};
  pointerBound = true;

  pointer.x = pointer.sx = window.innerWidth / 2;
  pointer.y = pointer.sy = window.innerHeight / 2;

  let prevX = pointer.x;
  let prevY = pointer.y;

  const move = (e: PointerEvent) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ny = (e.clientY / window.innerHeight) * 2 - 1;
    pointer.active = true;
  };
  const down = () => {
    pointer.down = true;
  };
  const up = () => {
    pointer.down = false;
  };

  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerdown', down, { passive: true });
  window.addEventListener('pointerup', up, { passive: true });
  window.addEventListener('pointercancel', up, { passive: true });

  const stopTick = onTick((dt) => {
    pointer.sx = damp(pointer.sx, pointer.x, 0.14, dt);
    pointer.sy = damp(pointer.sy, pointer.y, 0.14, dt);
    pointer.snx = damp(pointer.snx, pointer.nx, 0.08, dt);
    pointer.sny = damp(pointer.sny, pointer.ny, 0.08, dt);

    const dist = Math.hypot(pointer.x - prevX, pointer.y - prevY);
    prevX = pointer.x;
    prevY = pointer.y;
    pointer.speed = damp(pointer.speed, dt > 0 ? dist / dt : 0, 0.2, dt);
  });

  return () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerdown', down);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    stopTick();
    pointerBound = false;
  };
}

/* ══════════════════════════════════════════════════════════════
   Scroll state — written by the Lenis provider, read by anyone.
   ══════════════════════════════════════════════════════════════ */

export const scrollState = {
  y: 0,
  /** 0..1 through the document. */
  progress: 0,
  /** px/frame, signed. */
  velocity: 0,
  /** Smoothed absolute velocity, normalised roughly to 0..1. */
  energy: 0,
  direction: 1 as 1 | -1,
};
