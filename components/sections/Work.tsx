'use client';

import { useEffect, useRef, useState } from 'react';
import { projects, archive } from '@/lib/data';
import { clamp, damp, onTick, prefersReducedMotion } from '@/lib/motion';

const STATUS_LABEL: Record<string, string> = {
  private: 'Private',
  live: 'Live',
  wip: 'In progress',
  archive: 'Archived',
};

/**
 * Horizontally-scrolled work rail.
 *
 * The section is made tall enough that one page-scroll equals one
 * track-pixel, then pinned with `position: sticky`. Driving it from the
 * shared ticker (rather than a scroll listener) keeps it locked to Lenis's
 * interpolated position, so the horizontal motion is as smooth as the
 * vertical.
 *
 * Below the desktop breakpoint the whole mechanism switches off and the
 * slabs stack — horizontal scroll-jacking on touch is a usability tax.
 */
export default function Work() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLElement>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const mq = window.matchMedia('(min-width: 900px)');
    let distance = 0;
    let current = 0;
    let stopTick: (() => void) | undefined;

    const layout = () => {
      const enable = mq.matches && !prefersReducedMotion();
      setPinned(enable);

      // Measure with the transform cleared, or the rail's own offset skews it.
      // `current` is deliberately preserved so a resize mid-section doesn't
      // animate the whole rail back from zero.
      track.style.transform = '';

      if (!enable) {
        section.style.height = '';
        distance = 0;
        return;
      }

      // Measure against the real last slab rather than scrollWidth: the track
      // is a stretched flex child whose children overflow it, so scrollWidth
      // under-reports and the final slab never fully arrives.
      const last = track.lastElementChild as HTMLElement | null;
      const endPad = parseFloat(getComputedStyle(track).paddingRight) || 0;
      const contentRight = last
        ? last.getBoundingClientRect().right + endPad
        : track.getBoundingClientRect().right;

      distance = Math.max(0, contentRight - window.innerWidth);

      // Section height = one viewport to pin against + the travel itself,
      // which keeps page-scroll and track-scroll at 1:1.
      section.style.height = `${window.innerHeight + distance}px`;
    };

    layout();

    const ro = new ResizeObserver(layout);
    ro.observe(track);
    window.addEventListener('resize', layout, { passive: true });
    mq.addEventListener('change', layout);

    stopTick = onTick((dt) => {
      if (distance <= 0) return;
      const rect = section.getBoundingClientRect();
      // 0 when the section's top hits the viewport top, 1 at its end
      const raw = clamp(-rect.top / distance);
      current = damp(current, raw, 0.22, dt);

      track.style.transform = `translate3d(${(-current * distance).toFixed(2)}px, 0, 0)`;
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${current.toFixed(4)})`;
    });

    return () => {
      stopTick?.();
      ro.disconnect();
      window.removeEventListener('resize', layout);
      mq.removeEventListener('change', layout);
      section.style.height = '';
      track.style.transform = '';
    };
  }, []);

  return (
    <section className="work" id="work" ref={sectionRef} data-pinned={pinned || undefined}>
      <div className="work__sticky">
        <div className="work__chrome">
          <p className="eyebrow">
            <span className="eyebrow-num">02</span> Selected work
          </p>
          <div className="work__progress" aria-hidden="true">
            <i ref={fillRef} />
          </div>
          <span className="work__count hud">
            {String(projects.length).padStart(2, '0')} projects
          </span>
        </div>

        <div className="work__track" ref={trackRef}>
          <div className="work__intro slab">
            <h2 className="work__intro-title display">
              Things I
              <br />
              shipped.
            </h2>
            <p className="prose">
              Browsers, election software, scrapers and extensions. Open source unless a client
              — or a ballot — said otherwise.
            </p>
            <span className="work__hint hud" aria-hidden="true">
              keep scrolling →
            </span>
          </div>

          {projects.map((p, i) => {
            const Tag = p.url ? 'a' : 'div';
            return (
              <Tag
                key={p.index}
                className="slab card"
                data-tone={p.tone}
                data-status={p.status}
                style={{ '--i': i } as React.CSSProperties}
                {...(p.url
                  ? {
                      href: p.url,
                      target: '_blank',
                      rel: 'noreferrer',
                      'data-cursor': 'view',
                      'data-cursor-label': p.status === 'private' ? 'Info' : 'Open',
                    }
                  : {})}
              >
                <div className="card__top">
                  <span className="card__index display">{p.index}</span>
                  <span className="card__status hud" data-status={p.status}>
                    <i />
                    {STATUS_LABEL[p.status]}
                  </span>
                </div>

                <div className="card__body">
                  <h3 className="card__title display">{p.title}</h3>
                  <p className="card__blurb serif">{p.blurb}</p>
                  <p className="card__desc">{p.body}</p>
                </div>

                <div className="card__foot">
                  <ul className="card__tech">
                    {p.tech.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <div className="card__meta hud">
                    <span>{p.year}</span>
                    <span className="card__arrow" aria-hidden="true">
                      ↗
                    </span>
                  </div>
                </div>

                <span className="card__wash" aria-hidden="true" />
              </Tag>
            );
          })}

          <div className="slab work__archive">
            <h3 className="work__archive-title display">+{archive.length} more</h3>
            <p className="prose">
              30 personal repos and 6 in the PyraxisBrowser org. The rest of the shelf:
            </p>
            <ul className="work__archive-list">
              {archive.map((a) => (
                <li key={a.name}>
                  <a href={a.url} target="_blank" rel="noreferrer" data-cursor="link">
                    <span>{a.name}</span>
                    <i className="hud">{a.lang}</i>
                  </a>
                </li>
              ))}
            </ul>
            <a
              className="btn btn--signal work__archive-cta"
              href="https://github.com/Alan-Betty"
              target="_blank"
              rel="noreferrer"
              data-cursor="view"
              data-cursor-label="GitHub"
            >
              <span>Browse everything ↗</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
