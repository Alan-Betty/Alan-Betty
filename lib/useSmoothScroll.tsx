'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import Lenis from 'lenis';
import { bindPointer, clamp, damp, onTick, prefersReducedMotion, scrollState } from './motion';

type ScrollAPI = {
  lenis: Lenis | null;
  scrollTo: (target: string | number | HTMLElement, offset?: number) => void;
  stop: () => void;
  start: () => void;
};

const Ctx = createContext<ScrollAPI>({
  lenis: null,
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
});

export const useSmoothScroll = () => useContext(Ctx);

/**
 * Owns the single Lenis instance, feeds `scrollState`, and drives the shared
 * ticker. Everything else on the site reads scroll from `scrollState` rather
 * than binding its own scroll listener.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const ref = useRef<Lenis | null>(null);
  const [api, setApi] = useState<ScrollAPI>(() => ({
    lenis: null,
    scrollTo: () => {},
    stop: () => {},
    start: () => {},
  }));

  useEffect(() => {
    const reduced = prefersReducedMotion();

    const lenis = new Lenis({
      // Long duration + expo-ish easing is what gives the site its "heavy
      // glass" feel; reduced-motion users get near-native scrolling.
      duration: reduced ? 0.1 : 1.15,
      easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: !reduced,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      syncTouch: false,
      autoRaf: false,
    });

    ref.current = lenis;
    // Handy for debugging and for automated visual capture.
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    const readState = () => {
      const limit = Math.max(1, lenis.limit);
      scrollState.y = lenis.scroll;
      scrollState.progress = clamp(lenis.scroll / limit);
      scrollState.velocity = lenis.velocity;
      scrollState.direction = lenis.direction === -1 ? -1 : 1;
    };

    lenis.on('scroll', readState);
    readState();

    const stopTick = onTick((dt, elapsed) => {
      lenis.raf(elapsed * 1000);
      const target = clamp(Math.abs(scrollState.velocity) / 45);
      scrollState.energy = damp(scrollState.energy, target, 0.12, dt);
      document.documentElement.style.setProperty('--scroll-energy', scrollState.energy.toFixed(4));
      document.documentElement.style.setProperty('--scroll-progress', scrollState.progress.toFixed(5));
    });

    const stopPointer = bindPointer();

    setApi({
      lenis,
      scrollTo: (target, offset = 0) =>
        lenis.scrollTo(target, { offset, duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) }),
      stop: () => lenis.stop(),
      start: () => lenis.start(),
    });

    return () => {
      stopTick();
      stopPointer();
      lenis.destroy();
      ref.current = null;
    };
  }, []);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
