'use client';

import { useEffect, useRef } from 'react';
import { marquee } from '@/lib/data';
import { clamp, damp, onTick, prefersReducedMotion, scrollState } from '@/lib/motion';

/**
 * Velocity-coupled ticker.
 *
 * It drifts on its own, accelerates with scroll, and reverses when you
 * scroll back up — so the band reads as physically connected to the page
 * rather than a looping GIF.
 */
export default function Ticker() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (prefersReducedMotion()) return;

    let offset = 0;
    let speed = 0;
    let half = track.scrollWidth / 2;

    const remeasure = () => {
      half = track.scrollWidth / 2 || 1;
    };
    remeasure();
    const ro = new ResizeObserver(remeasure);
    ro.observe(track);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), {
      rootMargin: '30% 0px',
    });
    io.observe(track);

    const stop = onTick((dt) => {
      if (!visible) return;

      const drift = 46; // px/s at rest
      const boost = clamp(Math.abs(scrollState.velocity) / 30) * 520;
      const dir = scrollState.direction;
      speed = damp(speed, drift + boost, 0.1, dt);

      offset += speed * dir * dt;
      // Wrap without ever letting the value grow unbounded
      offset = ((offset % half) + half) % half;

      const skew = clamp(scrollState.velocity / 90, -0.5, 0.5) * 7;
      track.style.transform = `translate3d(${-offset.toFixed(2)}px, 0, 0) skewX(${skew.toFixed(2)}deg)`;
    });

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  const row = [...marquee, ...marquee];

  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__track" ref={trackRef}>
        {row.map((item, i) => (
          <span className="ticker__item" key={i}>
            <i className="ticker__dot" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
