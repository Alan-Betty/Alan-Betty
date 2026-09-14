'use client';

import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '@/lib/motion';

const LINES = ['resolving host', 'painting layers', 'compositing', 'ready'];

/**
 * Boot sequence. Short by design — a preloader that outstays its welcome is
 * the fastest way to lose a visitor. Shown once per session.
 */
export default function Boot() {
  const [phase, setPhase] = useState<'hidden' | 'running' | 'out'>('hidden');
  const [pct, setPct] = useState(0);
  const [line, setLine] = useState(0);
  const timers = useRef<number[]>([]);
  const ran = useRef(false);

  useEffect(() => {
    // Strict Mode double-invokes effects; the sequence must only play once.
    if (ran.current) return;
    ran.current = true;

    let seen = false;
    try {
      seen = sessionStorage.getItem('ab:booted') === '1';
    } catch {
      /* storage can be blocked; treat as first visit */
    }

    if (seen || prefersReducedMotion()) {
      document.documentElement.dataset.booted = '1';
      return;
    }

    setPhase('running');
    // Scroll is locked in CSS off this attribute rather than through Lenis:
    // child effects run before the provider's, so its API is not ready yet.
    document.documentElement.dataset.booting = '1';

    const DURATION = 1500;
    const t0 = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / DURATION);
      // Ease so the counter sprints then settles, like a real load
      const eased = 1 - Math.pow(1 - t, 3);
      setPct(Math.round(eased * 100));
      setLine(Math.min(LINES.length - 1, Math.floor(eased * LINES.length)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    timers.current.push(
      window.setTimeout(() => {
        setPhase('out');
        document.documentElement.dataset.booted = '1';
        delete document.documentElement.dataset.booting;
        try {
          sessionStorage.setItem('ab:booted', '1');
        } catch {
          /* ignore */
        }
      }, DURATION + 120),
      window.setTimeout(() => setPhase('hidden'), DURATION + 1200),
    );

    return () => {
      cancelAnimationFrame(raf);
      timers.current.forEach(clearTimeout);
      timers.current = [];
      delete document.documentElement.dataset.booting;
    };
  }, []);

  if (phase === 'hidden') return null;

  return (
    <div className="boot" data-phase={phase} aria-hidden="true">
      <div className="boot__panels">
        <span style={{ '--i': 0 } as React.CSSProperties} />
        <span style={{ '--i': 1 } as React.CSSProperties} />
        <span style={{ '--i': 2 } as React.CSSProperties} />
        <span style={{ '--i': 3 } as React.CSSProperties} />
        <span style={{ '--i': 4 } as React.CSSProperties} />
      </div>

      <div className="boot__body">
        <div className="boot__word display">
          <span style={{ transform: `translateY(${(1 - pct / 100) * 100}%)` }}>ALAN</span>
        </div>
        <div className="boot__meta">
          <span className="hud">{LINES[line]}</span>
          <span className="boot__pct display">{String(pct).padStart(3, '0')}</span>
        </div>
        <div className="boot__bar">
          <i style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
      </div>
    </div>
  );
}
