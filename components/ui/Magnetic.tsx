'use client';

import { useEffect, useRef, cloneElement, type ReactElement, type Ref } from 'react';
import { damp, onTick, pointer, prefersReducedMotion } from '@/lib/motion';

type Props = {
  children: ReactElement<{ ref?: Ref<HTMLElement> }>;
  /** How far the element travels toward the cursor, 0–1 of the offset. */
  strength?: number;
  /** Field radius in px beyond the element's own bounds. */
  radius?: number;
  /** Optional inner element that moves further than its parent. */
  innerSelector?: string;
};

/**
 * Magnetic attraction. The element leans toward the cursor while the pointer
 * is inside its field, then springs back. Purely transform-based.
 */
export default function Magnetic({
  children,
  strength = 0.32,
  radius = 90,
  innerSelector,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const inner = innerSelector ? el.querySelector<HTMLElement>(innerSelector) : null;

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let inField = false;

    // Rect is only re-read while the pointer is nearby, not every frame
    let rect = el.getBoundingClientRect();
    let rectAge = 0;

    const stop = onTick((dt) => {
      rectAge += dt;
      if (rectAge > 0.25) {
        rect = el.getBoundingClientRect();
        rectAge = 0;
      }

      const mx = pointer.x;
      const my = pointer.y;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Distance to the element's box, not its centre — wide buttons
      // otherwise have a field that feels lopsided.
      const dx = Math.max(rect.left - mx, 0, mx - rect.right);
      const dy = Math.max(rect.top - my, 0, my - rect.bottom);
      const edgeDist = Math.hypot(dx, dy);

      inField = pointer.active && edgeDist < radius;

      const targetX = inField ? (mx - centerX) * strength : 0;
      const targetY = inField ? (my - centerY) * strength : 0;

      cx = damp(cx, targetX, inField ? 0.2 : 0.12, dt);
      cy = damp(cy, targetY, inField ? 0.2 : 0.12, dt);

      if (Math.abs(cx - tx) < 0.02 && Math.abs(cy - ty) < 0.02) return;
      tx = cx;
      ty = cy;

      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
      if (inner) {
        inner.style.transform = `translate3d(${(cx * 0.4).toFixed(2)}px, ${(cy * 0.4).toFixed(2)}px, 0)`;
      }
    });

    return () => {
      stop();
      el.style.transform = '';
      if (inner) inner.style.transform = '';
    };
  }, [strength, radius, innerSelector]);

  return cloneElement(children, { ref });
}
