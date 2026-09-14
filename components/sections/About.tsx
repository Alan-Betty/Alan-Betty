import { about, hire, identity, socials } from '@/lib/data';
import Kinetic from '@/components/ui/Kinetic';
import Magnetic from '@/components/ui/Magnetic';

export default function About() {
  const links = socials.filter((s) => s.kind !== 'direct');

  return (
    <section className="about section" id="about">
      <img
        className="about__texture"
        src="/assets/topo-field.png"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        width={768}
        height={768}
      />

      <div className="measure about__inner">
        <header className="about__head">
          <p className="eyebrow">
            <span className="eyebrow-num">05</span> {about.kicker}
          </p>
          <h2 className="about__title display">
            {about.headline.map((line, i) => (
              <Kinetic key={line} text={line} by="char" stagger={26} delay={i * 180} />
            ))}
          </h2>
        </header>

        <div className="about__grid">
          <aside className="about__aside">
            {/* A monogram tile rather than a photo: the GitHub avatar is a
                placeholder glyph, and a bespoke mark carries the identity
                better than a borrowed one. */}
            <figure className="monogram" data-reveal="">
              <img
                className="monogram__grid"
                src="/assets/arc-grid.svg"
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
              />
              <span className="monogram__mark display" aria-hidden="true">
                {identity.initials}
              </span>
              <span className="monogram__dot" aria-hidden="true" />
              <figcaption className="hud">
                <span>{identity.role.split(' · ')[2] ?? 'Developer'}</span>
                <span>{identity.location}</span>
              </figcaption>
            </figure>

            <dl className="about__rows" data-reveal="" style={{ '--reveal-delay': '90ms' } as React.CSSProperties}>
              {about.rows.map((r) => (
                <div key={r.k}>
                  <dt className="hud">{r.k}</dt>
                  <dd className="display">{r.v}</dd>
                </div>
              ))}
            </dl>

            <ul className="about__links" data-reveal="" style={{ '--reveal-delay': '160ms' } as React.CSSProperties}>
              {links.map((s) => (
                <li key={s.label}>
                  <a href={s.url} target="_blank" rel="noreferrer" data-cursor="link" data-cursor-label={s.label}>
                    <span>{s.label}</span>
                    <i className="hud">{s.handle}</i>
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          <div className="about__main">
            <blockquote className="about__quote serif" data-reveal="">
              “{about.pullQuote}”
            </blockquote>

            {about.paragraphs.map((p, i) => (
              <p
                key={i}
                className="prose about__para"
                data-reveal=""
                style={{ '--reveal-delay': `${80 + i * 90}ms` } as React.CSSProperties}
              >
                {p}
              </p>
            ))}

            <ol className="about__timeline">
              {about.timeline.map((t, i) => (
                <li
                  key={t.year}
                  data-reveal=""
                  style={{ '--reveal-delay': `${60 + i * 80}ms` } as React.CSSProperties}
                >
                  <span className="about__year display">{t.year}</span>
                  <div>
                    <h3>{t.title}</h3>
                    <p>{t.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="hire" data-reveal="">
              <div className="hire__glow" aria-hidden="true" />
              <h3 className="hire__title display">{hire.headline}</h3>
              <p className="hire__body">{hire.body}</p>
              <ul className="hire__tags">
                {hire.services.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <div className="hire__actions">
                <Magnetic strength={0.3} radius={72} innerSelector="span">
                  <a className="btn btn--signal" href={`mailto:${identity.email}`} data-cursor="view" data-cursor-label="Email">
                    <span>Email me →</span>
                  </a>
                </Magnetic>
                <Magnetic strength={0.24} radius={64} innerSelector="span">
                  <a className="btn btn--ghost" href={identity.whatsappUrl} target="_blank" rel="noreferrer" data-cursor="link" data-cursor-label="Chat">
                    <span>WhatsApp</span>
                  </a>
                </Magnetic>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
