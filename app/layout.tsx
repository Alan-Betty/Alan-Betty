import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import { identity } from '@/lib/data';
import Providers from './providers';
import './globals.css';

/* ── Type ─────────────────────────────────────────────────────── */

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--f-display',
  display: 'swap',
  axes: ['opsz', 'wdth'],
});

const serif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--f-serif',
  display: 'swap',
  weight: '400',
  style: ['normal', 'italic'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--f-mono',
  display: 'swap',
  weight: ['300', '400', '500', '700'],
});

/* ── Metadata ─────────────────────────────────────────────────── */

const SITE = 'https://alan-betty.vercel.app';
const TITLE = `${identity.full} — Browser Engineer & Frontend Developer`;
const DESCRIPTION =
  'Frontend developer, UI/UX designer and browser engineer from Kerala, India. Built Pyraxis — a fully custom browser running natively on Windows, macOS, iOS and Android.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: TITLE,
    template: `%s — ${identity.full}`,
  },
  description: DESCRIPTION,
  applicationName: identity.full,
  authors: [{ name: identity.full, url: 'https://github.com/Alan-Betty' }],
  creator: identity.full,
  keywords: [
    'Alan Betty',
    'Pyraxis Browser',
    'frontend developer',
    'browser engineer',
    'UI UX designer',
    'React Native',
    'Kerala developer',
    'cross-platform',
  ],
  alternates: { canonical: SITE },
  openGraph: {
    type: 'website',
    url: SITE,
    siteName: identity.full,
    title: TITLE,
    description: DESCRIPTION,
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    creator: '@AlanPBetty',
  },
  icons: {
    icon: [{ url: '/assets/mark.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/assets/mark.svg' }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#060508',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/* ── Structured data ──────────────────────────────────────────── */

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: identity.full,
  url: SITE,
  image: identity.avatar,
  jobTitle: 'Frontend Developer, UI/UX Designer & Browser Engineer',
  email: `mailto:${identity.email}`,
  address: { '@type': 'PostalAddress', addressRegion: 'Kerala', addressCountry: 'IN' },
  sameAs: [
    'https://github.com/Alan-Betty',
    'https://github.com/PyraxisBrowser',
    'https://x.com/AlanPBetty',
    'https://instagram.com/alan__betty',
    'https://youtube.com/@alanbetty',
    'https://codepen.io/Alan-Betty',
    'https://pyraxisbrowser.tech',
  ],
  knowsAbout: ['React', 'Next.js', 'React Native', 'Three.js', 'Python', 'Browser engineering'],
  worksFor: { '@type': 'Organization', name: 'Pyraxis', url: 'https://pyraxisbrowser.tech' },
  alumniOf: {
    '@type': 'EducationalOrganization',
    name: 'Holy Grace Academy, Mala',
    address: { '@type': 'PostalAddress', addressRegion: 'Kerala', addressCountry: 'IN' },
  },
  award: [
    'First prize — National Digital Fest, Karunya Institute of Technology and Sciences',
    'First prize — 5th Global Indian Digital Fest, KMMHSS Kavvayi',
    'Third place — Cognito 2025, Royal College of Engineering and Technology',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          // Static, author-controlled object — safe to inline.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
