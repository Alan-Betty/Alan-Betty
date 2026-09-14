'use client';

import { useEffect, useRef, useState } from 'react';
import { nav as navItems, identity } from '@/lib/data';
import { useSmoothScroll } from '@/lib/useSmoothScroll';
import { onTick, scrollState } from '@/lib/motion';
import Magnetic from '@/components/ui/Magnetic';

export default function Nav() {
  const { scrollTo, stop, start } = useSmoothScroll();
  const [open, setOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const [active, setActive] = useState<string>('');
  const barRef = useRef<HTMLElement>(null);

  /* Condense the bar once past the hero, and hide it on downward scroll
     deep in the page so the work never fights with the chrome. */
  useEffect(() => {
    let hidden = false;
    const stopTick = onTick(() => {
      const next = scrollState.y > 90;
      setCondensed((c) => (c === next ? c : next));

      const shouldHide =
        scrollState.y > 600 && scrollState.direction === 1 && Math.abs(scrollState.velocity) > 1.4;
      const shouldShow = scrollState.direction === -1 || scrollState.y < 600;
      if (shouldHide && !hidden) {
        hidden = true;
        barRef.current?.setAttribute('data-hidden', '');
      } else if (shouldShow && hidden) {
        hidden = false;
        barRef.current?.removeAttribute('data-hidden');
      }
    });
    return stopTick;
  }, []);

  /* Active section */
  useEffect(() => {
    const sections = navItems
      .map((n) => document.getElementById(n.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  /* Menu locks the page and closes on Escape */
  useEffect(() => {
    if (open) stop();
    else start();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, stop, start]);

  const go = (id: string) => {
    setOpen(false);
    // Let the menu start closing before the scroll takes over
    window.setTimeout(() => scrollTo(`#${id}`, -10), open ? 220 : 0);
  };

  return (
    <>
      <header ref={barRef} className="nav" data-condensed={condensed || undefined}>
        <button className="nav__mark" onClick={() => scrollTo(0)} data-cursor="link" data-cursor-label="Top">
          <span className="nav__mark-glyph display">AB</span>
          <span className="nav__mark-meta hud">
            <span>{identity.first}</span>
            <span>{identity.last}</span>
          </span>
        </button>

        <nav className="nav__links" aria-label="Sections">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              data-active={active === item.id || undefined}
              data-cursor="link"
            >
              <i className="hud">{item.num}</i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="nav__right">
          <span className="nav__status hud">
            <i className="pulse" />
            Open to work
          </span>
          <Magnetic strength={0.4} radius={70}>
            <a className="btn btn--signal nav__cta" href={`mailto:${identity.email}`} data-cursor="view" data-cursor-label="Hire">
              <span>Hire me</span>
            </a>
          </Magnetic>
          <button
            className="nav__burger"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            data-open={open || undefined}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <div className="menu" data-open={open || undefined} aria-hidden={!open}>
        <div className="menu__inner">
          <ul>
            {navItems.map((item, i) => (
              <li key={item.id} style={{ '--i': i } as React.CSSProperties}>
                <button onClick={() => go(item.id)}>
                  <i className="hud">{item.num}</i>
                  <span className="display">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="menu__foot">
            <a href={`mailto:${identity.email}`}>{identity.email}</a>
            <a href={identity.whatsappUrl} target="_blank" rel="noreferrer">
              {identity.whatsapp}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
