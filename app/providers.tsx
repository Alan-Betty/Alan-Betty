'use client';

import dynamic from 'next/dynamic';
import { SmoothScrollProvider } from '@/lib/useSmoothScroll';
import { useRevealObserver } from '@/lib/useReveal';
import Nav from '@/components/chrome/Nav';
import Rail from '@/components/chrome/Rail';
import Boot from '@/components/chrome/Boot';

/* The WebGL ground and the custom cursor are decoration: never let them
   block first paint or ship in the server bundle. */
const Cosmos = dynamic(() => import('@/components/canvas/Cosmos'), { ssr: false });
const Cursor = dynamic(() => import('@/components/chrome/Cursor'), { ssr: false });
const EventHorizon = dynamic(() => import('@/components/chrome/EventHorizon'), { ssr: false });

export default function Providers({ children }: { children: React.ReactNode }) {
  useRevealObserver();

  return (
    <SmoothScrollProvider>
      <Cosmos />
      <div className="grain" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />

      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Boot />
      <Nav />
      <Rail />

      <main id="main" className="shell">
        {children}
      </main>

      <EventHorizon />
      <Cursor />
    </SmoothScrollProvider>
  );
}
