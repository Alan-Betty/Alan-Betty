'use client';

import { useEffect, useRef, useState } from 'react';
import { clamp, damp, isFinePointer, onTick, pointer, prefersReducedMotion } from '@/lib/motion';

type Mode = 'idle' | 'link' | 'view' | 'drag' | 'text';

/**
 * Two-part cursor: a hard dot that tracks 1:1 and a lagging ring that
 * carries the state. Any element can drive it with
 * `data-cursor="view"` / `data-cursor-label="Open"`.
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);

  /* Capability check first. The elements only exist on the render that
     follows, so wiring them up has to wait for `enabled` to flip. */
  useEffect(() => {
    if (!isFinePointer() || prefersReducedMotion()) return;
    setEnabled(true);
    document.body.dataset.cursor = 'on';
    return () => {
      delete document.body.dataset.cursor;
    };
  }, []);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!enabled || !dot || !ring || !label) return;

    let mode: Mode = 'idle';
    let rx = pointer.x;
    let ry = pointer.y;
    let scale = 0.375;
    let targetScale = 0.375;
    let opacity = 0;

    const applyMode = (next: Mode, text: string) => {
      if (next === mode && label.textContent === text) return;
      mode = next;
      ring.dataset.mode = next;
      label.textContent = text;
      /* Fractions of the ring's 96px layout box, so these read as the
         diameter each state actually draws: 68 / 50 / 58 / 36 px. Nothing
         here may reach 1 once `stretch` is folded in — see the CSS. */
      targetScale =
        next === 'view' ? 0.71 : next === 'link' ? 0.52 : next === 'drag' ? 0.6 : 0.375;
    };

    const onOver = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.(
        '[data-cursor], a, button, input, textarea, [role="button"]',
      ) as HTMLElement | null;

      if (!target) return applyMode('idle', '');

      const explicit = target.dataset.cursor as Mode | undefined;
      const text = target.dataset.cursorLabel ?? '';
      if (explicit) return applyMode(explicit, text);

      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return applyMode('text', '');
      applyMode('link', text);
    };

    const onLeaveWindow = () => {
      opacity = 0;
    };

    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerout', (e) => {
      if (!(e as PointerEvent).relatedTarget) onLeaveWindow();
    });
    window.addEventListener('blur', onLeaveWindow);

    const stop = onTick((dt) => {
      // Dot: exact, no easing — it is the "true" pointer
      dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;

      // Ring: lags, and stretches along the direction of travel
      rx = damp(rx, pointer.x, 0.2, dt);
      ry = damp(ry, pointer.y, 0.2, dt);
      scale = damp(scale, pointer.down ? targetScale * 0.82 : targetScale, 0.16, dt);

      const dx = pointer.x - rx;
      const dy = pointer.y - ry;
      const dist = Math.hypot(dx, dy);
      const stretch = clamp(dist / 110, 0, 0.3);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      opacity = damp(opacity, pointer.active ? 1 : 0, 0.1, dt);

      ring.style.opacity = String(opacity);
      dot.style.opacity = String(opacity);
      ring.style.transform =
        `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) ` +
        `rotate(${angle}deg) scale(${(scale * (1 + stretch)).toFixed(3)}, ${(scale * (1 - stretch)).toFixed(3)})`;
      // Counter-rotate so the label stays upright inside a rotated ring
      label.style.transform = `rotate(${-angle}deg) scale(${(1 / Math.max(scale, 0.001)).toFixed(3)})`;
    });

    return () => {
      stop();
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('blur', onLeaveWindow);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="cursor-layer" aria-hidden="true">
      <div ref={ringRef} className="cursor-ring" data-mode="idle">
        <span ref={labelRef} className="cursor-label" />
      </div>
      <div ref={dotRef} className="cursor-dot" />
    </div>
  );
}
