'use client';

import { useEffect, useRef } from 'react';
import { contact, identity, socials } from '@/lib/data';
import { damp, onTick, pointer, prefersReducedMotion } from '@/lib/motion';
import Kinetic from '@/components/ui/Kinetic';
import Magnetic from '@/components/ui/Magnetic';

/**
 * Channel list. Hovering a row slides a marker to it and drags the row
 * toward the cursor — the list behaves like one instrument rather than a
 * stack of independent buttons.
 */
function Channels() {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || prefersReducedMotion()) return;

    const rows = Array.from(list.querySelectorAll<HTMLElement>('li'));
    const shifts = rows.map(() => 0);
    let rects: DOMRect[] = [];
    let age = 1;

    const stop = onTick((dt) => {
      age += dt;
      if (age > 0.35) {
        rects = rows.map((r) => r.getBoundingClientRect());
        age = 0;
      }
      if (!rects.length || !pointer.active) return;

      for (let i = 0; i < rows.length; i++) {
        const r = rects[i];
        const cy = r.top + r.height / 2;
        const dy = Math.abs(pointer.sy - cy);
        const inX = pointer.sx > r.left - 40 && pointer.sx < r.right + 40;
        // Neighbouring rows lean in slightly — the list reads as elastic
        const pull = inX ? Math.max(0, 1 - dy / (r.height * 1.9)) : 0;
        shifts[i] = damp(shifts[i], pull, 0.16, dt);
        if (shifts[i] < 0.003) {
          if (rows[i].style.getPropertyValue('--pull') !== '0') {
            rows[i].style.setProperty('--pull', '0');
          }
          continue;
        }
        rows[i].style.setProperty('--pull', shifts[i].toFixed(3));
      }
    });

    return () => {
      stop();
      rows.forEach((r) => r.style.removeProperty('--pull'));
    };
  }, []);

  return (
    <ul className="channels" ref={listRef}>
      {socials.map((s, i) => (
        <li key={s.label} style={{ '--i': i } as React.CSSProperties} data-kind={s.kind}>
          <a
            href={s.url}
            target={s.url.startsWith('mailto:') ? undefined : '_blank'}
            rel="noreferrer"
            data-cursor="view"
            data-cursor-label="Open"
          >
            <span className="channels__idx hud">{String(i + 1).padStart(2, '0')}</span>
            <span className="channels__name display">{s.label}</span>
            <span className="channels__handle">{s.handle}</span>
            <span className="channels__arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function Contact() {
  return (
    <section className="contact section" id="contact">
      <div className="measure contact__inner">
        <p className="eyebrow">
          <span className="eyebrow-num">06</span> {contact.kicker}
        </p>

        <h2 className="contact__title display">
          <Kinetic text={contact.headline[0]} by="char" stagger={24} />
          <Kinetic text={contact.headline[1]} by="char" stagger={24} delay={180} className="contact__title-accent" />
        </h2>

        <p className="prose contact__body" data-reveal="">
          {contact.body}
        </p>

        <div className="contact__cta" data-reveal="" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
          <Magnetic strength={0.34} radius={110} innerSelector="span">
            <a className="btn btn--big" href={`mailto:${identity.email}`} data-cursor="view" data-cursor-label="Write">
              <span>{identity.email}</span>
            </a>
          </Magnetic>
        </div>

        <Channels />
      </div>
    </section>
  );
}
