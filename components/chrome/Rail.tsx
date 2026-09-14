'use client';

import { useEffect, useState } from 'react';
import { identity } from '@/lib/data';

/**
 * The left rail: a persistent vertical spine carrying the local time in
 * Kerala, a scroll readout and the wordmark. Progress itself is driven by
 * the `--scroll-progress` custom property the scroll provider writes, so
 * this component re-renders only once a minute for the clock.
 */
export default function Rail() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: identity.timezone,
    });
    const write = () => setTime(fmt.format(new Date()));
    write();
    const id = window.setInterval(write, 15_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <aside className="rail" aria-hidden="true">
      <div className="rail__track">
        <i className="rail__fill" />
      </div>
      <div className="rail__meta hud">
        <span className="rail__loc">{identity.location}</span>
        <span className="rail__time">
          {time || '--:--'} <i>IST</i>
        </span>
      </div>
      <div className="rail__brand hud">Built with intent</div>
    </aside>
  );
}
