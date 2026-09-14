'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { flagship } from '@/lib/data';
import { clamp, damp, onTick, pointer, prefersReducedMotion, scrollState } from '@/lib/motion';
import Magnetic from '@/components/ui/Magnetic';
import Kinetic from '@/components/ui/Kinetic';

/* ══════════════════════════════════════════════════════════════
   PYRAXIS WINDOW
   The section's centrepiece is a working browser chrome: real tabs,
   a live omnibox that retypes on navigation, and a viewport that
   swaps panels. He built a browser — so the case study is one.
   ══════════════════════════════════════════════════════════════ */

function Omnibox({ url }: { url: string }) {
  const [typed, setTyped] = useState(url);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setTyped(url);
      return;
    }
    let frame = 0;
    let i = 0;
    setTyped('');
    const step = () => {
      i += 1;
      setTyped(url.slice(0, i));
      if (i < url.length) frame = window.setTimeout(step, 14 + Math.random() * 26);
    };
    frame = window.setTimeout(step, 90);
    return () => window.clearTimeout(frame);
  }, [url]);

  return (
    <div className="win__omni">
      <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
        <path
          d="M4.5 7V5a3.5 3.5 0 1 1 7 0v2M3.5 7h9v6.5h-9z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
      <span className="win__omni-url">
        <b>https://</b>
        {typed}
        <i className="win__caret" />
      </span>
      <span className="win__omni-right hud">beta</span>
    </div>
  );
}

function PyraxisWindow() {
  const [activeId, setActiveId] = useState(flagship.tabs[0].id);
  const shellRef = useRef<HTMLDivElement>(null);
  const tablistRef = useRef<HTMLDivElement>(null);
  const uid = useId();

  const active = flagship.tabs.find((t) => t.id === activeId) ?? flagship.tabs[0];

  /* Cursor-driven tilt + a slow scroll-linked rise. */
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || prefersReducedMotion()) return;

    let rx = 0;
    let ry = 0;
    let lift = 0;
    let inView = false;

    const io = new IntersectionObserver(([e]) => (inView = e.isIntersecting), { rootMargin: '15% 0px' });
    io.observe(shell);

    let rect = shell.getBoundingClientRect();
    let age = 1;

    const stop = onTick((dt) => {
      if (!inView) return;
      age += dt;
      if (age > 0.3) {
        rect = shell.getBoundingClientRect();
        age = 0;
      }

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clamp((pointer.sx - cx) / (rect.width || 1), -1, 1);
      const dy = clamp((pointer.sy - cy) / (rect.height || 1), -1, 1);

      const strength = pointer.active ? 1 : 0;
      ry = damp(ry, dx * 7 * strength, 0.08, dt);
      rx = damp(rx, -dy * 5 * strength, 0.08, dt);

      // Parallax rise as the section crosses the viewport
      const through = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height));
      lift = damp(lift, (through - 0.5) * -34, 0.1, dt);

      shell.style.transform = `perspective(1600px) translate3d(0, ${lift.toFixed(1)}px, 0) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      shell.style.setProperty('--sheen-x', `${(50 + dx * 40).toFixed(1)}%`);
      shell.style.setProperty('--sheen-y', `${(50 + dy * 40).toFixed(1)}%`);
    });

    return () => {
      stop();
      io.disconnect();
    };
  }, []);

  const onTabKey = (e: React.KeyboardEvent) => {
    const idx = flagship.tabs.findIndex((t) => t.id === activeId);
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % flagship.tabs.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + flagship.tabs.length) % flagship.tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = flagship.tabs.length - 1;
    else return;
    e.preventDefault();
    setActiveId(flagship.tabs[next].id);
    tablistRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <div className="win" ref={shellRef}>
      <div className="win__glow" aria-hidden="true" />

      <div className="win__bar">
        <div className="win__lights" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>

        <div className="win__tabs" role="tablist" aria-label="Pyraxis Browser" ref={tablistRef} onKeyDown={onTabKey}>
          {flagship.tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              id={`${uid}-tab-${tab.id}`}
              aria-selected={tab.id === activeId}
              aria-controls={`${uid}-panel-${tab.id}`}
              tabIndex={tab.id === activeId ? 0 : -1}
              className="win__tab"
              data-active={tab.id === activeId || undefined}
              onClick={() => setActiveId(tab.id)}
              data-cursor="link"
            >
              <i className="win__favicon" />
              <span>{tab.label}</span>
            </button>
          ))}
          <span className="win__tab win__tab--add" aria-hidden="true">
            +
          </span>
        </div>
      </div>

      <Omnibox url={active.url} />

      <div className="win__viewport">
        <img
          className="win__shot"
          src={flagship.shot}
          alt="Pyraxis Browser running on desktop"
          width={1200}
          height={750}
          loading="lazy"
          decoding="async"
        />
        <div className="win__scrim" aria-hidden="true" />

        {flagship.tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`${uid}-panel-${tab.id}`}
            aria-labelledby={`${uid}-tab-${tab.id}`}
            hidden={tab.id !== activeId}
            className="win__panel"
          >
            <h3 className="win__panel-title display">{tab.title}</h3>
            <p className="win__panel-body">{tab.body}</p>
            <dl className="win__panel-meta">
              {tab.meta.map((m) => (
                <div key={m.k}>
                  <dt className="hud">{m.k}</dt>
                  <dd>{m.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}

        <a
          className="win__open"
          href={flagship.site}
          target="_blank"
          rel="noreferrer"
          data-cursor="view"
          data-cursor-label="Visit"
        >
          <span className="sr-only">Visit pyraxisbrowser.tech</span>
        </a>
      </div>

      <div className="win__status hud">
        <span>{flagship.promise}</span>
        <span className="win__status-right">4 platforms · public beta</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */

export default function Flagship() {
  const wordRef = useRef<HTMLDivElement>(null);

  /* Oversized backdrop wordmark counter-scrolls for depth. */
  useEffect(() => {
    const el = wordRef.current;
    if (!el || prefersReducedMotion()) return;
    let y = 0;
    const stop = onTick((dt) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
      const through = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      y = damp(y, (through - 0.5) * 180, 0.1, dt);
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    });
    return stop;
  }, []);

  return (
    <section className="flagship section" id="flagship">
      <div className="flagship__word display" ref={wordRef} aria-hidden="true">
        PYRAXIS
      </div>

      <div className="measure flagship__inner">
        <header className="flagship__head">
          <p className="eyebrow">
            <span className="eyebrow-num">01</span> {flagship.kicker}
          </p>
          <h2 className="flagship__title display">
            <Kinetic text={flagship.headline[0]} by="word" stagger={60} />
            <Kinetic
              text={flagship.headline[1]}
              by="word"
              stagger={60}
              delay={160}
              className="flagship__title-accent"
            />
          </h2>

          <div className="flagship__lede">
            <p className="prose" data-reveal="" style={{ '--reveal-delay': '90ms' } as React.CSSProperties}>
              {flagship.summary}
            </p>

            <ul className="flagship__feats">
              {flagship.features.map((f, i) => (
                <li
                  key={f.title}
                  data-reveal=""
                  style={{ '--reveal-delay': `${140 + i * 70}ms` } as React.CSSProperties}
                >
                  <i aria-hidden="true">{f.icon}</i>
                  <span>
                    <b>{f.title}</b> — {f.body}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flagship__chips" data-reveal="" style={{ '--reveal-delay': '260ms' } as React.CSSProperties}>
              {flagship.stack.map((s) => (
                <span className="chip" key={s}>
                  {s}
                </span>
              ))}
            </div>

            <div
              className="flagship__cta"
              data-reveal=""
              style={{ '--reveal-delay': '320ms' } as React.CSSProperties}
            >
              <Magnetic strength={0.32} radius={80} innerSelector="span">
                <a className="btn btn--signal" href={flagship.site} target="_blank" rel="noreferrer" data-cursor="view" data-cursor-label="Visit">
                  <span>pyraxisbrowser.tech ↗</span>
                </a>
              </Magnetic>
              <Magnetic strength={0.26} radius={70} innerSelector="span">
                <a className="btn btn--ghost" href={flagship.org} target="_blank" rel="noreferrer" data-cursor="link" data-cursor-label="Source">
                  <span>Org on GitHub ↗</span>
                </a>
              </Magnetic>
            </div>
          </div>
        </header>

        <div className="flagship__stage" data-reveal="" style={{ '--reveal-delay': '60ms' } as React.CSSProperties}>
          <PyraxisWindow />
        </div>
      </div>
    </section>
  );
}
