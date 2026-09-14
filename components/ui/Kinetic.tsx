import type { CSSProperties, ElementType } from 'react';

type Props = {
  text: string;
  /** Split granularity. Chars give the finer cascade; words are cheaper. */
  by?: 'word' | 'char';
  as?: ElementType;
  className?: string;
  /** ms between successive units. */
  stagger?: number;
  /** ms before the first unit moves. */
  delay?: number;
  style?: CSSProperties;
};

/**
 * Masked type reveal, split at render time on the server.
 *
 * The markup ships pre-split so there is no flash of unsplit text and no
 * layout shift; the animation itself is CSS driven by the shared reveal
 * observer. The real string stays in an aria-label for screen readers.
 */
export default function Kinetic({
  text,
  by = 'word',
  as: Tag = 'span',
  className = '',
  stagger = 42,
  delay = 0,
  style,
}: Props) {
  const words = text.split(' ');
  let unitIndex = 0;

  return (
    <Tag className={`kinetic ${className}`.trim()} aria-label={text} style={style} data-reveal-text="">
      {words.map((word, wi) => (
        <span className="kinetic__word" key={`${word}-${wi}`} aria-hidden="true">
          {by === 'char'
            ? Array.from(word).map((ch, ci) => (
                <span className="kinetic__mask" key={ci}>
                  <span
                    className="kinetic__unit"
                    style={{ '--u': `${delay + unitIndex++ * stagger}ms` } as CSSProperties}
                  >
                    {ch}
                  </span>
                </span>
              ))
            : (
                <span className="kinetic__mask">
                  <span
                    className="kinetic__unit"
                    style={{ '--u': `${delay + unitIndex++ * stagger}ms` } as CSSProperties}
                  >
                    {word}
                  </span>
                </span>
              )}
          {wi < words.length - 1 ? <span className="kinetic__space"> </span> : null}
        </span>
      ))}
    </Tag>
  );
}
