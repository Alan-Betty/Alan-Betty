'use client';

import { useEffect } from 'react';

/**
 * One IntersectionObserver for the whole document.
 *
 * Any element carrying `data-reveal` (or `data-reveal-clip`) flips to "in"
 * when it enters the viewport. Stagger is expressed declaratively via
 * `style={{ '--reveal-delay': '120ms' }}` so no JS timing is needed.
 */
export function useRevealObserver() {
  useEffect(() => {
    const attrs = ['data-reveal', 'data-reveal-clip', 'data-reveal-text'];
    const selector = attrs.map((a) => `[${a}]`).join(',');

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          for (const a of attrs) if (el.hasAttribute(a)) el.setAttribute(a, 'in');
          io.unobserve(el);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );

    const observeAll = () => {
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        const done = attrs.some((a) => el.getAttribute(a) === 'in');
        if (!done) io.observe(el);
      });
    };

    observeAll();

    // Sections mount late (horizontal rail, tab panels) — keep picking them up.
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}
