'use client';

import { useEffect, useRef } from 'react';
import { identity, stats } from '@/lib/data';
import { clamp, damp, onTick, pointer, prefersReducedMotion, scrollState } from '@/lib/motion';
import { useSmoothScroll } from '@/lib/useSmoothScroll';
import Magnetic from '@/components/ui/Magnetic';

/* ══════════════════════════════════════════════════════════════
   LIVE NAME
   Each glyph reads its distance to the cursor and responds on the
   variable font's weight and width axes. The type itself becomes
   the interaction — no decorative overlay required.
   ══════════════════════════════════════════════════════════════ */

function LiveWord({ text, outline = false }: { text: string; outline?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host || prefersReducedMotion()) return;

    const glyphs = Array.from(host.querySelectorAll<HTMLElement>('[data-glyph]'));
    const state = glyphs.map(() => ({ w: 0, cx: 0 }));
    let rects: DOMRect[] = [];
    let age = 1;

    const stop = onTick((dt) => {
      age += dt;
      if (age > 0.4) {
        rects = glyphs.map((g) => g.getBoundingClientRect());
        age = 0;
      }
      if (!rects.length) return;

      for (let i = 0; i < glyphs.length; i++) {
        const r = rects[i];
        const cx = r.left + r.width / 2;
        const d = Math.abs(pointer.sx - cx);
        // Influence falls off over roughly three glyph widths
        const falloff = pointer.active ? clamp(1 - d / 260) : 0;
        const eased = falloff * falloff;

        state[i].w = damp(state[i].w, eased, 0.14, dt);
        const w = state[i].w;
        if (w < 0.002 && glyphs[i].style.fontVariationSettings === '') continue;

        glyphs[i].style.fontVariationSettings = `"wght" ${(560 + w * 240).toFixed(0)}, "wdth" ${(
          100 - w * 18
        ).toFixed(1)}, "opsz" 96`;
        glyphs[i].style.transform = `translate3d(0, ${(-w * 10).toFixed(2)}px, 0)`;
      }
    });

    return () => {
      stop();
      glyphs.forEach((g) => {
        g.style.fontVariationSettings = '';
        g.style.transform = '';
      });
    };
  }, []);

  return (
    <span ref={ref} className="hero__word" data-outline={outline || undefined} aria-hidden="true">
      {Array.from(text).map((ch, i) => (
        <span key={i} data-glyph className="hero__glyph">
          {ch}
        </span>
      ))}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════ */

export default function Hero() {
  const { scrollTo } = useSmoothScroll();
  const stageRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);

  /* Hero recedes as you leave it: content drifts up and dims while the
     backdrop stays put, so the WebGL ground reads as further away. */
  useEffect(() => {
    const plate = plateRef.current;
    if (!plate || prefersReducedMotion()) return;

    const stop = onTick(() => {
      const h = window.innerHeight;
      const p = clamp(scrollState.y / h);
      plate.style.transform = `translate3d(0, ${(p * -110).toFixed(1)}px, 0)`;
      plate.style.opacity = String(1 - clamp(p * 1.35));
    });
    return stop;
  }, []);

  return (
    <section className="hero" id="top" ref={stageRef}>
      <div className="hero__frame" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="hero__plate" ref={plateRef}>
        <div className="hero__top">
          <span className="hero__badge hud">
            <i className="pulse" />
            {identity.status}
          </span>
          <span className="hero__coords hud">
            09°58′N 76°17′E · {identity.location}
          </span>
        </div>

        <h1 className="hero__name display">
          <span className="sr-only">{identity.full} — {identity.role}</span>
          <LiveWord text="ALAN" />
          <LiveWord text="BETTY" outline />
        </h1>

        <div className="hero__lower">
          <div className="hero__pitch">
            <p className="hero__lede">
              FrontEnd dev, UI/UX designer, Tester &amp; <strong>Browser Engineer</strong> from
              Kerala, India.
            </p>
            <p className="hero__manifesto serif">I build things that run everywhere —</p>
            <ul className="hero__targets hud">
              <li>web</li>
              <li>desktop</li>
              <li>android</li>
              <li>ios</li>
            </ul>

            <div className="hero__actions">
              <Magnetic strength={0.35} radius={80} innerSelector="span">
                <button
                  className="btn btn--signal"
                  onClick={() => scrollTo('#flagship', -10)}
                  data-cursor="view"
                  data-cursor-label="Work"
                >
                  <span>See the work</span>
                </button>
              </Magnetic>
              <Magnetic strength={0.28} radius={70} innerSelector="span">
                <a
                  className="btn btn--ghost"
                  href="https://github.com/Alan-Betty"
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="link"
                  data-cursor-label="GitHub"
                >
                  <span>30+ repos ↗</span>
                </a>
              </Magnetic>
            </div>
          </div>

          <dl className="hero__stats">
            {stats.map((s) => (
              <div key={s.label} className="hero__stat">
                <dt className="hud">{s.label}</dt>
                <dd>
                  <b className="display">
                    {s.value}
                    <i>{s.suffix}</i>
                  </b>
                  <span className="hud">{s.detail}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <button
        className="hero__cue"
        onClick={() => scrollTo('#flagship', -10)}
        aria-label="Scroll to work"
        data-cursor="link"
      >
        <span className="hud">scroll</span>
        <i />
      </button>
    </section>
  );
}
