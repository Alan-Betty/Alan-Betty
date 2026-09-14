'use client';

import { useEffect, useRef } from 'react';
import { damp, onTick, pointer, prefersReducedMotion } from '@/lib/motion';

type Body = {
  el: HTMLElement;
  /** Layout anchor, in container space. */
  ax: number;
  ay: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Half-extents. Pills are wide and short, so a circle is the wrong shape:
   *  a bounding radius makes vertically adjacent rows overlap permanently. */
  hw: number;
  hh: number;
  /** Heavier tokens (core stack) resist the cursor more. */
  mass: number;
  glow: number;
};

/**
 * Soft-body physics over real DOM children.
 *
 * Tokens keep their normal flex-wrap layout — the simulation only writes
 * `transform`, so text stays selectable, focusable and reflows correctly.
 * The cursor pushes tokens out of the way; springs pull them home; a
 * pairwise separation pass stops them overlapping on the way back.
 */
export default function TokenField({ children }: { children: React.ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (prefersReducedMotion()) return;

    const bodies: Body[] = [];
    let hostRect = host.getBoundingClientRect();
    let active = false;

    const measure = () => {
      hostRect = host.getBoundingClientRect();
      const els = Array.from(host.querySelectorAll<HTMLElement>('[data-token]'));

      // Anchors must be read with transforms neutralised, or they drift.
      for (const el of els) el.style.transform = '';

      bodies.length = 0;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const cx = r.left - hostRect.left + r.width / 2;
        const cy = r.top - hostRect.top + r.height / 2;
        bodies.push({
          el,
          ax: cx,
          ay: cy,
          x: cx,
          y: cy,
          vx: 0,
          vy: 0,
          // A small inset keeps neighbours from touching at rest, where the
          // flex gap already separates them.
          hw: r.width / 2 - 1,
          hh: r.height / 2 - 1,
          mass: el.dataset.weight === 'core' ? 1.7 : el.dataset.weight === 'lang' ? 1.25 : 1,
          glow: 0,
        });
      }
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(host);
    window.addEventListener('resize', measure, { passive: true });

    const io = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting;
        if (active) measure();
      },
      { rootMargin: '20% 0px' },
    );
    io.observe(host);

    const REPEL_RADIUS = 190;
    const REPEL_FORCE = 1500;

    const stop = onTick((dt) => {
      if (!active || bodies.length === 0) return;
      const step = Math.min(dt, 1 / 45);

      const mx = pointer.x - hostRect.left;
      const my = pointer.y - hostRect.top;
      const pointerInPlay = pointer.active;

      for (const b of bodies) {
        // 1 — cursor repulsion, falling off smoothly to zero at the radius
        if (pointerInPlay) {
          const dx = b.x - mx;
          const dy = b.y - my;
          const d = Math.hypot(dx, dy) || 1;
          if (d < REPEL_RADIUS) {
            const falloff = 1 - d / REPEL_RADIUS;
            const f = (REPEL_FORCE * falloff * falloff) / (b.mass * d);
            b.vx += dx * f * step;
            b.vy += dy * f * step;
            b.glow = Math.max(b.glow, falloff);
          }
        }

        // 2 — spring home
        b.vx += (b.ax - b.x) * 26 * step;
        b.vy += (b.ay - b.y) * 26 * step;

        // 3 — viscous damping
        const drag = Math.pow(0.0025, step);
        b.vx *= drag;
        b.vy *= drag;
      }

      // 4 — separation, box against box, resolved on the axis of least
      // penetration. n is small (~40), so the naive pass is cheapest.
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];
        for (let j = i + 1; j < bodies.length; j++) {
          const c = bodies[j];
          const dx = c.x - a.x;
          const dy = c.y - a.y;
          const ox = a.hw + c.hw - Math.abs(dx);
          if (ox <= 0) continue;
          const oy = a.hh + c.hh - Math.abs(dy);
          if (oy <= 0) continue;

          const total = a.mass + c.mass;
          const aShare = c.mass / total;
          const cShare = a.mass / total;

          if (ox < oy) {
            const push = (ox * 0.5 + 0.01) * (dx < 0 ? -1 : 1);
            a.x -= push * aShare;
            c.x += push * cShare;
          } else {
            const push = (oy * 0.5 + 0.01) * (dy < 0 ? -1 : 1);
            a.y -= push * aShare;
            c.y += push * cShare;
          }
        }
      }

      for (const b of bodies) {
        b.x += b.vx * step;
        b.y += b.vy * step;
        b.glow = damp(b.glow, 0, 0.06, dt);

        const ox = b.x - b.ax;
        const oy = b.y - b.ay;
        // Sub-pixel jitter is invisible and costs a composite every frame
        if (Math.abs(ox) < 0.05 && Math.abs(oy) < 0.05 && b.glow < 0.01) {
          if (b.el.style.transform !== '') {
            b.el.style.transform = '';
            b.el.style.setProperty('--token-glow', '0');
          }
          continue;
        }
        b.el.style.transform = `translate3d(${ox.toFixed(2)}px, ${oy.toFixed(2)}px, 0)`;
        b.el.style.setProperty('--token-glow', b.glow.toFixed(3));
      }
    });

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('resize', measure);
      for (const b of bodies) {
        b.el.style.transform = '';
        b.el.style.removeProperty('--token-glow');
      }
    };
  }, []);

  return (
    <div ref={hostRef} className="token-field">
      {children}
    </div>
  );
}
