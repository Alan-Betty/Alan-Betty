import { stack } from '@/lib/data';
import TokenField from '@/components/canvas/TokenField';
import Kinetic from '@/components/ui/Kinetic';

export default function Stack() {
  return (
    <section className="stack section" id="stack">
      <div className="measure stack__inner">
        <header className="stack__head">
          <p className="eyebrow">
            <span className="eyebrow-num">04</span> Expertise
          </p>
          <h2 className="stack__title display">
            <Kinetic text="What I" by="word" stagger={70} />
            <Kinetic text="work with" by="word" stagger={70} delay={140} className="stack__title-accent" />
          </h2>
          <p className="prose" data-reveal="">
            Self-taught, wide-stack. Pixel-perfect UIs through to cross-platform native apps — and
            the browser underneath them.
          </p>
          <p className="stack__nudge hud" data-reveal="" style={{ '--reveal-delay': '140ms' } as React.CSSProperties}>
            ↳ push them around
          </p>
        </header>

        <div className="stack__field">
          <TokenField>
            {stack.map((group) => (
              <div className="stack__group" key={group.label}>
                <h3 className="stack__label hud">{group.label}</h3>
                <div className="stack__row">
                  {group.items.map((item) => (
                    <span className="token" key={item} data-token="" data-weight={group.weight}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </TokenField>
        </div>
      </div>
    </section>
  );
}
