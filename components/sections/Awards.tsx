'use client';

import { useCallback, useEffect, useState } from 'react';
import { awards } from '@/lib/data';
import Kinetic from '@/components/ui/Kinetic';

/* ══════════════════════════════════════════════════════════════
   AWARDS — the receipts.

   Three podium finishes and a newspaper clipping. The two national
   wins carry photographs and get the width; the rest are typographic.

   Every image is evidence rather than decoration, and a 400px-wide
   card is not enough to read a newsprint column, so each one opens
   into a lightbox at full size.
   ══════════════════════════════════════════════════════════════ */

type Zoom = { src: string; alt: string; caption: string };

export default function Awards() {
  const [zoom, setZoom] = useState<Zoom | null>(null);

  const close = useCallback(() => setZoom(null), []);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom, close]);

  const { press, now } = awards;

  return (
    <section className="awards section" id="awards">
      <div className="measure awards__inner">
        <header className="awards__head">
          <p className="eyebrow">
            <span className="eyebrow-num">03</span> {awards.kicker}
          </p>
          <h2 className="awards__title display">
            <Kinetic text={awards.headline[0]} by="word" stagger={70} />
            <Kinetic
              text={awards.headline[1]}
              by="word"
              stagger={70}
              delay={140}
              className="awards__title-accent"
            />
          </h2>
          <p className="prose" data-reveal="">
            {awards.lead}
          </p>
          <p
            className="awards__now hud"
            data-reveal=""
            style={{ '--reveal-delay': '120ms' } as React.CSSProperties}
          >
            <i className="pulse" />
            {now.label} — {now.value} · {now.detail}
          </p>
        </header>

        <ol className="awards__grid">
          {awards.items.map((a, i) => (
            <li
              key={a.id}
              className="award"
              data-tone={a.tone}
              data-place={a.place}
              data-shot={a.image ? '' : undefined}
              data-reveal=""
              style={{ '--reveal-delay': `${i * 90}ms` } as React.CSSProperties}
            >
              {a.image ? (
                <button
                  className="award__shot"
                  onClick={() => setZoom({ src: a.image!, alt: a.alt!, caption: `${a.event} — ${a.host}` })}
                  data-cursor="view"
                  data-cursor-label="Zoom"
                  aria-label={`View the photo: ${a.alt}`}
                >
                  <img src={a.image} alt={a.alt} loading="lazy" decoding="async" />
                  <span className="award__ribbon display" aria-hidden="true">
                    {a.rank}
                  </span>
                </button>
              ) : null}

              <div className="award__body">
                <div className="award__line">
                  {!a.image ? (
                    <span className="award__rank display" aria-hidden="true">
                      {a.rank}
                    </span>
                  ) : null}
                  <div>
                    <h3 className="award__event display">
                      <span className="sr-only">{a.rank} place — </span>
                      {a.event}
                    </h3>
                    <p className="award__host">{a.host}</p>
                  </div>
                </div>

                <p className="award__desc">{a.body}</p>

                <ul className="award__meta hud">
                  <li data-key="level">{a.level}</li>
                  <li>{a.date}</li>
                  {a.prize ? <li data-key="prize">{a.prize}</li> : null}
                </ul>
              </div>

              <span className="award__wash" aria-hidden="true" />
            </li>
          ))}

          <li
            className="award award--press"
            data-tone="bone"
            data-reveal=""
            style={{ '--reveal-delay': '270ms' } as React.CSSProperties}
          >
            <button
              className="award__clip"
              onClick={() =>
                setZoom({ src: press.image, alt: press.alt, caption: `${press.outlet} — ${press.headline}` })
              }
              data-cursor="view"
              data-cursor-label="Read"
              aria-label={`View the newspaper clipping: ${press.alt}`}
            >
              <img src={press.image} alt={press.alt} loading="lazy" decoding="async" />
            </button>

            <div className="award__body">
              <div className="award__line">
                <div>
                  <h3 className="award__event display">{press.outlet}</h3>
                  <p className="award__host" lang="ml">
                    {press.headlineMl}
                  </p>
                </div>
              </div>
              <p className="award__desc">{press.body}</p>
              <ul className="award__meta hud">
                <li data-key="level">{press.kicker}</li>
                <li>“{press.headline}”</li>
              </ul>
            </div>

            <span className="award__wash" aria-hidden="true" />
          </li>
        </ol>
      </div>

      {zoom ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={zoom.caption}
          onClick={close}
        >
          <figure className="lightbox__frame" onClick={(e) => e.stopPropagation()}>
            <img src={zoom.src} alt={zoom.alt} />
            <figcaption className="hud">{zoom.caption}</figcaption>
          </figure>
          <button className="lightbox__close hud" onClick={close} autoFocus>
            Close ✕
          </button>
        </div>
      ) : null}
    </section>
  );
}
