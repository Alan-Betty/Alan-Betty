'use client';

import { useEffect, useRef, useState } from 'react';
import { clamp, onTick, prefersReducedMotion } from '@/lib/motion';
import { onPhase, singularity, setPhase, detonate, resetSingularity } from '@/lib/singularity';
import { useSmoothScroll } from '@/lib/useSmoothScroll';

/* ══════════════════════════════════════════════════════════════
   EVENT HORIZON — the easter egg.

   Every word currently on screen is measured with a Range, lifted
   into a fixed overlay, and handed to the same gravity the stars
   obey. They spiral in, stretch radially as tidal forces win, and
   are consumed at the horizon.

   Then the page is simply gone — no message, no button. The hole
   spends the next ten seconds tearing through the star swarm
   instead, swelling and flaring as it feeds, until it cannot hold
   what it has eaten. It detonates, and the shock front throws every
   word back out: they overshoot their old slots and spring into
   place, the real document fades back underneath them, and the site
   is exactly as it was. Nothing is persisted and nothing reloads.
   ══════════════════════════════════════════════════════════════ */

type Word = {
  el: HTMLSpanElement;
  /** Live position of the word's centre, viewport px. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Where the word belongs — its centre before any of this started. */
  hx: number;
  hy: number;
  delay: number;
  dead: boolean;
};

/** Gravitational parameter in pixel space. */
const MU = 2.6e8;
const SOFTEN = 90;
const MAX_WORDS = 900;
const MAX_SPEED = 2600;

/** Hard ceiling on the swallowing, in wall-clock seconds. */
const DEVOUR_CAP = 9;
/** How long the hole feeds on the swarm once the copy is gone. */
const GORGE = 11;
const GORGE_REDUCED = 2.4;
/** Flight time for the words thrown back out by the blast. */
const REFORM = 1.75;
/** Cross-fade from the overlay back to the live document, ms. */
const HANDOVER = 260;

/* Spring that catches the reassembling words. Just under critical, so
   each one overshoots its slot slightly and settles rather than gliding
   to a mechanical stop. */
const SPRING_K = 30;
const SPRING_C = 10.4;

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CANVAS', 'SVG']);

/** Collect every word box currently visible in the viewport. */
function harvest(overlay: HTMLElement): Word[] {
  const roots = ['main', '.nav', 'footer', '.rail', '.ticker']
    .map((s) => document.querySelector<HTMLElement>(s))
    .filter((el): el is HTMLElement => Boolean(el));

  const range = document.createRange();
  const words: Word[] = [];
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  for (const root of roots) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        const cs = getComputedStyle(parent);
        if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node: Node | null;
    // eslint-disable-next-line no-cond-assign
    while ((node = walker.nextNode())) {
      if (words.length >= MAX_WORDS) break;

      const text = node.nodeValue!;
      const parent = node.parentElement!;
      const cs = getComputedStyle(parent);

      // Hatched display type paints through a clipped background; there is
      // no meaningful colour to copy, so fall back to bone.
      const fill = cs.webkitTextFillColor || cs.color;
      const colour =
        fill === 'transparent' || fill === 'rgba(0, 0, 0, 0)' ? 'rgb(228, 223, 212)' : fill;

      const re = /\S+/g;
      let m: RegExpExecArray | null;
      // eslint-disable-next-line no-cond-assign
      while ((m = re.exec(text))) {
        if (words.length >= MAX_WORDS) break;

        range.setStart(node, m.index);
        range.setEnd(node, m.index + m[0].length);
        const r = range.getBoundingClientRect();

        if (r.width < 0.5 || r.height < 0.5) continue;
        if (r.bottom < -40 || r.top > vh + 40 || r.right < -40 || r.left > vw + 40) continue;

        const span = document.createElement('span');
        span.className = 'devour__word';
        span.textContent = m[0];
        span.style.left = `${r.left}px`;
        span.style.top = `${r.top}px`;
        span.style.width = `${r.width}px`;
        span.style.height = `${r.height}px`;
        span.style.color = colour;
        span.style.fontFamily = cs.fontFamily;
        span.style.fontSize = cs.fontSize;
        span.style.fontWeight = cs.fontWeight;
        span.style.fontStyle = cs.fontStyle;
        span.style.letterSpacing = cs.letterSpacing;
        span.style.textTransform = cs.textTransform;
        span.style.lineHeight = `${r.height}px`;
        if (cs.fontVariationSettings && cs.fontVariationSettings !== 'normal') {
          span.style.fontVariationSettings = cs.fontVariationSettings;
        }
        overlay.appendChild(span);

        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;

        words.push({
          el: span,
          x: cx,
          y: cy,
          vx: 0,
          vy: 0,
          hx: cx,
          hy: cy,
          delay: Math.random() * 0.45,
          dead: false,
        });
      }
    }
  }

  range.detach?.();
  return words;
}

export default function EventHorizon() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<Word[]>([]);
  const [phase, setLocalPhase] = useState(singularity.phase);
  const { stop, start } = useSmoothScroll();

  useEffect(() => onPhase((p) => setLocalPhase(p)), []);

  /* ── 1. Swallow the copy ─────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'devouring') return;
    const overlay = overlayRef.current;
    if (!overlay) return;

    const reduced = prefersReducedMotion();

    document.documentElement.dataset.devouring = '1';
    stop();

    const words = harvest(overlay);
    wordsRef.current = words;

    // Hide the real document — the overlay now stands in for it
    document.body.dataset.eaten = '1';

    if (reduced || words.length === 0) {
      singularity.feed = 1;
      singularity.swell = 1.8;
      /* No physics, but the page still has to go: vanishing is the whole
         trick. A straight opacity fade carries it without moving anything. */
      for (const w of words) {
        w.el.style.transition = 'opacity 600ms linear';
        w.el.style.opacity = '0';
        w.dead = true;
      }
      const t = window.setTimeout(() => setPhase('gorging'), 760);
      return () => window.clearTimeout(t);
    }

    let elapsed = 0;
    let alive = words.length;
    const total = words.length;
    /* The shared ticker clamps dt, so simulated time runs behind wall clock
       on a slow device. Deadlines are therefore measured against the real
       clock — the collapse must never outstay its welcome. */
    const startedAt = performance.now();

    const stopTick = onTick((dt) => {
      const step = Math.min(dt, 1 / 40);
      elapsed += dt;
      const wall = (performance.now() - startedAt) / 1000;

      const hx = singularity.x;
      const hy = singularity.y;
      const eaten = Math.max(24, singularity.r * 0.85);
      const soft2 = SOFTEN * SOFTEN;

      for (const w of words) {
        if (w.dead) continue;
        if (elapsed < w.delay) continue;

        const dx = hx - w.x;
        const dy = hy - w.y;
        const r2 = dx * dx + dy * dy;
        const r = Math.sqrt(r2);

        if (r < eaten) {
          w.dead = true;
          alive--;
          w.el.style.opacity = '0';
          w.el.style.transform = 'scale(0)';
          continue;
        }

        // First touch of gravity also imparts angular momentum, so words
        // spiral in rather than dropping straight down the well.
        if (w.vx === 0 && w.vy === 0) {
          const vCirc = Math.sqrt(MU / Math.max(r, 1));
          const k = 0.3 + Math.random() * 0.24;
          const spin = Math.random() < 0.75 ? 1 : -1;
          w.vx = (-dy / r) * vCirc * k * spin;
          w.vy = (dx / r) * vCirc * k * spin;
        }

        const inv = MU / Math.pow(r2 + soft2, 1.5);
        w.vx += dx * inv * step;
        w.vy += dy * inv * step;

        // Orbits have to decay briskly: a word left in a wide stable orbit
        // reads as a bug, not as physics.
        const drag = Math.pow(0.965, step * 60);
        w.vx *= drag;
        w.vy *= drag;

        // Past the grace window, stragglers get pulled straight down the well
        if (wall > 4.5) {
          const pull = Math.min(1, (wall - 4.5) * 0.55);
          w.vx += (dx / r) * 900 * pull * step;
          w.vy += (dy / r) * 900 * pull * step;
        }

        const speed = Math.hypot(w.vx, w.vy);
        if (speed > MAX_SPEED) {
          w.vx = (w.vx / speed) * MAX_SPEED;
          w.vy = (w.vy / speed) * MAX_SPEED;
        }

        w.x += w.vx * step;
        w.y += w.vy * step;

        // Tidal stretching: align with the radius and draw out along it
        const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
        const closeness = clamp(1 - r / 900);
        const stretch = 1 + closeness * closeness * 5.5;
        const squeeze = 1 - closeness * 0.72;
        const fade = clamp((r - eaten) / 260);

        w.el.style.opacity = String(fade);
        w.el.style.transform =
          `translate3d(${(w.x - w.hx).toFixed(1)}px, ${(w.y - w.hy).toFixed(1)}px, 0) ` +
          `rotate(${ang.toFixed(1)}deg) scale(${stretch.toFixed(2)}, ${squeeze.toFixed(2)})`;
      }

      const progress = 1 - alive / total;
      singularity.feed = clamp(0.25 + progress * 0.75);
      singularity.swell = 1 + progress * 1.15;

      if (alive === 0 || wall > DEVOUR_CAP) {
        for (const w of words) {
          if (w.dead) continue;
          w.dead = true;
          w.el.style.opacity = '0';
        }
        singularity.feed = 1;
        setPhase('gorging');
      }
    });

    return stopTick;
  }, [phase, stop]);

  /* ── 2. Feed on the swarm ────────────────────────────────── */
  /* Nothing on screen now but the hole and the stars falling into it.
     Everything here escalates: more drag on the swarm, a hotter disk, a
     wider shadow — until it lets go. */
  useEffect(() => {
    if (phase !== 'gorging') return;

    const span = prefersReducedMotion() ? GORGE_REDUCED : GORGE;
    let t = 0;
    let fired = false;

    const stopTick = onTick((dt) => {
      if (fired) return;
      t += dt;
      const p = clamp(t / span);

      singularity.gorge = clamp(p * 1.5);
      /* The disk brightens superlinearly: the last seconds should look
         like something that is about to fail. */
      singularity.feed = 1 + p * p * 1.1;

      if (t >= span) {
        fired = true;
        detonate();
        setPhase('detonating');
      }
    });

    return stopTick;
  }, [phase]);

  /* ── 3. Detonate, and throw the page back out ────────────── */
  useEffect(() => {
    if (phase !== 'detonating') return;
    const words = wordsRef.current;

    singularity.gorge = 0;
    singularity.swell = 1;

    if (prefersReducedMotion() || words.length === 0) {
      for (const w of words) {
        w.el.style.transition = 'opacity 600ms linear';
        w.el.style.transform = '';
        w.el.style.opacity = '1';
        w.dead = false;
      }
      const t = window.setTimeout(() => setPhase('reforming'), 700);
      return () => window.clearTimeout(t);
    }

    /* Reborn at the horizon and thrown along the line back to where they
       belong — the shock front is doing the sorting, not the words. */
    const cx = singularity.x;
    const cy = singularity.y;
    const seed = Math.max(18, singularity.r * 0.35);

    for (const w of words) {
      const a = Math.random() * Math.PI * 2;
      const rad = seed * (0.2 + Math.random() * 0.8);
      w.x = cx + Math.cos(a) * rad;
      w.y = cy + Math.sin(a) * rad;

      const dx = w.hx - w.x;
      const dy = w.hy - w.y;
      const d = Math.hypot(dx, dy) || 1;
      const speed = 1000 + Math.random() * 1100;
      w.vx = (dx / d) * speed + (Math.random() - 0.5) * 340;
      w.vy = (dy / d) * speed + (Math.random() - 0.5) * 340;

      w.dead = false;
      // Debris does not arrive in one wave
      w.delay = Math.random() * 0.2;
      w.el.style.opacity = '0';
      w.el.style.transform =
        `translate3d(${(w.x - w.hx).toFixed(1)}px, ${(w.y - w.hy).toFixed(1)}px, 0) scale(0.4)`;
    }

    let t = 0;

    const stopTick = onTick((dt) => {
      const step = Math.min(dt, 1 / 40);
      t += dt;

      // The disk has nothing left to burn
      singularity.feed = Math.max(0, 2.4 - t * 2.2);

      for (const w of words) {
        if (t < w.delay) continue;

        const ax = (w.hx - w.x) * SPRING_K - w.vx * SPRING_C;
        const ay = (w.hy - w.y) * SPRING_K - w.vy * SPRING_C;
        w.vx += ax * step;
        w.vy += ay * step;
        w.x += w.vx * step;
        w.y += w.vy * step;

        /* Motion blur as a directional scale, applied in the frame of the
           velocity: `rotate(a) scale(s,q) rotate(-a)` collapses to the
           identity as the word comes to rest, so there is no angle left to
           unwind and nothing ends up crooked. */
        const speed = Math.hypot(w.vx, w.vy);
        const k = clamp(speed / 1100);
        const ang = (Math.atan2(w.vy, w.vx) * 180) / Math.PI;
        const stretch = 1 + k * 2.1;
        const squeeze = 1 - k * 0.44;

        w.el.style.opacity = String(clamp((t - w.delay) / 0.22));
        w.el.style.transform =
          `translate3d(${(w.x - w.hx).toFixed(1)}px, ${(w.y - w.hy).toFixed(1)}px, 0) ` +
          `rotate(${ang.toFixed(1)}deg) scale(${stretch.toFixed(3)}, ${squeeze.toFixed(3)}) ` +
          `rotate(${(-ang).toFixed(1)}deg)`;
      }

      if (t >= REFORM) {
        for (const w of words) {
          w.el.style.opacity = '1';
          w.el.style.transform = '';
        }
        setPhase('reforming');
      }
    });

    return stopTick;
  }, [phase]);

  /* ── 4. Hand back to the real document ───────────────────── */
  /* Every overlay word is sitting exactly on top of the element it was
     copied from, so this is a straight cross-fade: nothing moves. */
  useEffect(() => {
    if (phase !== 'reforming') return;

    delete document.body.dataset.eaten;

    const id = window.setTimeout(() => {
      for (const w of wordsRef.current) w.el.remove();
      wordsRef.current = [];
      delete document.documentElement.dataset.devouring;
      start();
      resetSingularity();
    }, HANDOVER);

    return () => window.clearTimeout(id);
  }, [phase, start]);

  useEffect(() => {
    return () => {
      delete document.documentElement.dataset.devouring;
      delete document.body.dataset.eaten;
      start();
    };
  }, [start]);

  return (
    <div
      ref={overlayRef}
      className="devour"
      data-active={phase !== 'idle' || undefined}
      data-handover={phase === 'reforming' || undefined}
      aria-hidden="true"
    />
  );
}
