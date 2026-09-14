/**
 * Single source of truth for every piece of copy on the site.
 * Content mirrors alan-betty.vercel.app, restructured for the new narrative.
 */

export const identity = {
  first: 'Alan',
  last: 'Betty',
  full: 'Alan Betty',
  initials: 'AB',
  location: 'Kerala, India',
  timezone: 'Asia/Kolkata',
  role: 'Frontend Developer · UI/UX Designer · Browser Engineer',
  roles: ['Frontend Developer', 'UI/UX Designer', 'Tester', 'Browser Engineer'],
  status: 'Available for projects & collabs',
  tagline:
    'FrontEnd dev, UI/UX designer, Tester & Browser Engineer from Kerala, India. I build things that run everywhere — web, desktop, Android & iOS.',
  manifesto: 'I build things that run everywhere.',
  email: 'padayattilbettyalan@gmail.com',
  whatsapp: '+91 98470 03464',
  whatsappUrl: 'https://wa.me/919847003464',
  company: 'Pyraxis',
  school: 'Holy Grace Academy, Mala',
  grade: 'Grade 12',
  githubBio: 'Very Interested In Programming.',
  avatar: 'https://avatars.githubusercontent.com/u/137591870?v=4',
  joinedGitHub: '2023',
  footer: '© 2026 Alan Betty — Built with intent.',
} as const;

export const stats = [
  { value: '30', suffix: '+', label: 'Repositories', detail: 'personal + org' },
  { value: '4', suffix: '', label: 'Platforms', detail: 'win · mac · ios · android' },
  { value: '1', suffix: '', label: 'Browser built', detail: 'from scratch' },
  { value: '2', suffix: '', label: 'National firsts', detail: 'digital fest wins' },
] as const;

export type Social = {
  label: string;
  handle: string;
  url: string;
  kind: 'code' | 'social' | 'direct';
};

export const socials: Social[] = [
  { label: 'GitHub', handle: '@Alan-Betty', url: 'https://github.com/Alan-Betty', kind: 'code' },
  { label: 'Pyraxis Org', handle: '@PyraxisBrowser', url: 'https://github.com/PyraxisBrowser', kind: 'code' },
  { label: 'CodePen', handle: 'Alan-Betty', url: 'https://codepen.io/Alan-Betty', kind: 'code' },
  { label: 'YouTube', handle: '@alanbetty', url: 'https://youtube.com/@alanbetty', kind: 'social' },
  { label: 'Instagram', handle: '@alan__betty', url: 'https://instagram.com/alan__betty', kind: 'social' },
  { label: 'X', handle: '@AlanPBetty', url: 'https://x.com/AlanPBetty', kind: 'social' },
  {
    label: 'Discord',
    handle: 'Click to connect',
    url: 'https://discord.com/users/1229633538362703882',
    kind: 'direct',
  },
  {
    label: 'Email',
    handle: 'padayattilbettyalan@gmail.com',
    url: 'mailto:padayattilbettyalan@gmail.com',
    kind: 'direct',
  },
  { label: 'WhatsApp', handle: '+91 98470 03464', url: 'https://wa.me/919847003464', kind: 'direct' },
];

/* ── FLAGSHIP ─────────────────────────────────────────────────── */

export type FlagshipTab = {
  id: string;
  label: string;
  url: string;
  title: string;
  body: string;
  meta: { k: string; v: string }[];
};

export const flagship = {
  name: 'Pyraxis Browser',
  kicker: 'Flagship · 2024 — present',
  headline: ['I built a browser.', 'From scratch.'],
  promise: 'Fast. Private. Built for modern browsing.',
  summary:
    'Pyraxis is a fully custom browser running natively on Windows, macOS, and mobile. Not a Chromium skin — built ground-up with its own UI, tab system, and cross-platform architecture.',
  site: 'https://pyraxisbrowser.tech',
  org: 'https://github.com/PyraxisBrowser',
  shot: '/assets/pyraxis-shot.webp',
  stack: ['Python', 'PyQt', 'Node.js', 'JavaScript', 'CSS', 'React Native', 'Expo'],
  tabs: [
    {
      id: 'overview',
      label: 'Overview',
      url: 'pyraxisbrowser.tech',
      title: 'Not a Chromium skin.',
      body: 'Ground-up browser architecture with its own chrome, tab engine and settings layer. Public Beta shipping on four platforms from one design language.',
      meta: [
        { k: 'status', v: 'Public Beta' },
        { k: 'license', v: 'Open source core' },
        { k: 'platforms', v: '4' },
      ],
    },
    {
      id: 'native',
      label: 'Cross-platform',
      url: 'pyraxisbrowser.tech/download',
      title: 'Windows, macOS, iOS & Android.',
      body: 'Desktop runs on Python + PyQt with a custom tab engine. Mobile was rebuilt from zero in React Native and Expo so the UI stays identical across every screen.',
      meta: [
        { k: 'desktop', v: 'Python · PyQt' },
        { k: 'mobile', v: 'React Native · Expo' },
        { k: 'installers', v: 'signed builds' },
      ],
    },
    {
      id: 'ui',
      label: 'Custom UI',
      url: 'pyraxisbrowser.tech/design',
      title: '100% custom UI. No borrowed shell.',
      body: 'Every pixel of chrome designed from scratch — tab strip, omnibox, panels, settings. Nothing inherited from an existing browser shell.',
      meta: [
        { k: 'design', v: 'Figma to native' },
        { k: 'components', v: 'hand-built' },
        { k: 'theme', v: 'dark-first' },
      ],
    },
    {
      id: 'privacy',
      label: 'Privacy & AI',
      url: 'pyraxisbrowser.tech/privacy',
      title: 'Zero tracking. Deep AI integration.',
      body: 'Privacy-first by default with an open-source core. Ships deep AI integration alongside a working Sign Language Translator built into the browser.',
      meta: [
        { k: 'telemetry', v: 'none' },
        { k: 'ai', v: 'integrated' },
        { k: 'a11y', v: 'sign language translator' },
      ],
    },
  ] satisfies FlagshipTab[],
  features: [
    { icon: '⚡', title: 'Cross-platform native', body: 'Windows, macOS, iOS & Android' },
    { icon: '◇', title: '100% custom UI', body: 'no borrowed shell, designed from scratch' },
    { icon: '⌾', title: 'Privacy-first', body: 'zero-tracking, open-source core, Public Beta' },
    {
      icon: '⚙',
      title: 'Python + PyQt',
      body: 'deep AI integration with a working Sign Language Translator',
    },
  ],
} as const;

/* ── PROJECTS ─────────────────────────────────────────────────── */

export type Project = {
  index: string;
  title: string;
  blurb: string;
  body: string;
  tech: string[];
  lang: string;
  year: string;
  status: 'private' | 'live' | 'wip' | 'archive';
  url?: string;
  tone: 'ember' | 'signal' | 'azure' | 'bone';
};

export const projects: Project[] = [
  {
    index: '01',
    title: 'EduVote — School Elections',
    blurb: 'A whole school voted on my software.',
    body: 'Digital voting software for the student council election at Holy Grace Academy, built with two classmates. I wrote it and ran it on polling day — a faster, more transparent count than paper, and not a single hitch. Malayala Manorama covered it.',
    tech: ['JavaScript', 'Web app', 'Elections'],
    lang: 'JavaScript',
    year: '2026',
    status: 'private',
    tone: 'signal',
  },
  {
    index: '02',
    title: 'Pyraxis — Mobile Rebuild',
    blurb: 'Same browser. Pocket sized.',
    body: 'Complete rebuild of Pyraxis mobile in React Native & Expo. Unified cross-platform UI for iOS and Android.',
    tech: ['React Native', 'Expo'],
    lang: 'React Native / Expo',
    year: '2026',
    status: 'live',
    url: 'https://pyraxisbrowser.tech',
    tone: 'azure',
  },
  {
    index: '03',
    title: 'Pyraxis — Desktop',
    blurb: 'A real installable browser.',
    body: 'Full custom browser for Windows & macOS. Real installable app with custom tab engine, settings, and UI.',
    tech: ['Python', 'PyQt', 'JavaScript'],
    lang: 'Python / JS',
    year: '2025',
    status: 'live',
    url: 'https://pyraxisbrowser.tech',
    tone: 'ember',
  },
  {
    index: '04',
    title: 'AI Study App',
    blurb: 'Adaptive learning, built in the open.',
    body: 'AI-powered study assistant in active development. Smart flashcards, adaptive quizzes, personalised learning — built with React and AI APIs.',
    tech: ['React', 'JSX', 'AI APIs'],
    lang: 'React / JSX',
    year: '2026',
    status: 'wip',
    tone: 'signal',
  },
  {
    index: '05',
    title: 'TradingScraper',
    blurb: 'A watchlist that watches itself.',
    body: 'Pick the tickers you care about and it handles the rest — scrapes their prices on a schedule, alerts you when one moves past a threshold, and keeps the history and the background detail on each one in a single place.',
    tech: ['Python', 'Scraping', 'Alerts'],
    lang: 'Python',
    year: '2025',
    status: 'private',
    tone: 'bone',
  },
  {
    index: '06',
    title: 'Nexus',
    blurb: 'Built with the Inception Bros.',
    body: 'Dynamic collaborative web project with The Inception Bros. Polished front-end with smooth interactions.',
    tech: ['JavaScript', 'CSS'],
    lang: 'JavaScript',
    year: '2025',
    status: 'live',
    url: 'https://the-inception-bros.github.io/nexus.github.io/',
    tone: 'signal',
  },
  {
    index: '07',
    title: 'Site Blocker',
    blurb: 'Focus, with no B.S.',
    body: 'A Site Blocker Chrome Extension with no B.S — minimal surface, MIT licensed, does exactly one thing.',
    tech: ['JavaScript', 'Chrome APIs'],
    lang: 'JavaScript',
    year: '2024',
    status: 'live',
    url: 'https://github.com/Alan-Betty/SiteBlockerExtension',
    tone: 'ember',
  },
  {
    index: '08',
    title: 'COSMIC AI',
    blurb: 'Conversation, rethought.',
    body: 'The official repository for COSMIC AI — an experiment in conversational interfaces and response shaping.',
    tech: ['JavaScript', 'AI APIs'],
    lang: 'JavaScript',
    year: '2024',
    status: 'live',
    url: 'https://github.com/Alan-Betty/cosmic.ai',
    tone: 'bone',
  },
];

export const archive = [
  {
    name: 'PyraxisWebsite-React',
    lang: 'TypeScript',
    url: 'https://github.com/Alan-Betty/PyraxisWebsite-React',
  },
  { name: 'ActivityManager', lang: 'JavaScript', url: 'https://github.com/Alan-Betty/ActivityManager' },
  { name: '3D-Printing', lang: 'JavaScript', url: 'https://github.com/Alan-Betty/3D-Printing' },
  {
    name: 'The-Inception-Bros',
    lang: 'JavaScript',
    url: 'https://github.com/Alan-Betty/The-Inception-Bros',
  },
  {
    name: 'Aircraft-Showcase',
    lang: 'CSS',
    url: 'https://github.com/Alan-Betty/Aircraft-Showcase.github.io',
  },
  {
    name: 'aviation-weather',
    lang: 'JavaScript',
    url: 'https://github.com/Alan-Betty/aviation-weather.github.io',
  },
  { name: 'E-Commerce', lang: 'JavaScript', url: 'https://github.com/Alan-Betty/E-Commerce' },
  { name: 'Stock-Updater', lang: 'CSS', url: 'https://github.com/Alan-Betty/Stock-Updater' },
  { name: 'EzzahEnterprises', lang: 'CSS', url: 'https://github.com/Alan-Betty/EzzahEnterprises' },
  { name: 'safe-surf', lang: 'Python', url: 'https://github.com/Alan-Betty/safe-surf.github.io' },
  { name: 'Test-Taker', lang: 'JavaScript', url: 'https://github.com/Alan-Betty/Test-Taker.github.io' },
  { name: 'flappy-prank', lang: 'CSS', url: 'https://github.com/Alan-Betty/flappy-prank.github.io' },
];

/* ── AWARDS ─────────────────────────────────── */

export type Award = {
  id: string;
  /** Ordinal as displayed. */
  rank: string;
  /** 1, 2 or 3 — drives the tone as well as the label. */
  place: number;
  event: string;
  host: string;
  level: 'National' | 'Inter-school' | 'Regional';
  date: string;
  prize?: string;
  body: string;
  image?: string;
  alt?: string;
  tone: 'signal' | 'ember' | 'azure' | 'bone';
};

export const awards = {
  kicker: 'Recognition',
  headline: ['Two national', 'firsts.'],
  lead:
    'What happens when the projects leave the laptop: two first places at national digital fests, a podium at Cognito, and a morning where the school election software made the newspaper.',
  items: [
    {
      id: 'ndf',
      rank: '1st',
      place: 1,
      event: 'National Digital Fest',
      host: 'Karunya Institute of Technology and Sciences',
      level: 'National',
      date: '2026',
      prize: '₹10,000',
      body:
        'First prize at the national edition, against teams from across the country. Top of the podium and a cheque to go with it.',
      image: '/assets/NDF.jpg',
      alt: 'Alan Betty and teammate receiving the first prize cheque on stage at the National Digital Fest, Karunya Institute of Technology and Sciences',
      tone: 'signal',
    },
    {
      id: 'gdf',
      rank: '1st',
      place: 1,
      event: 'Global Indian Digital Fest',
      host: 'KMMHSS Kavvayi',
      level: 'National',
      date: '03 Jan 2026',
      prize: '₹10,000',
      body:
        'Winners of the 5th edition. Second national first place in the same season, with a second team of judges reaching the same verdict.',
      image: '/assets/GDF.jpg',
      alt: 'Alan Betty and teammate holding the winner cheque and certificates of merit at the 5th edition Global Indian Digital Fest, KMMHSS Kavvayi',
      tone: 'ember',
    },
    {
      id: 'cognito',
      rank: '3rd',
      place: 3,
      event: 'Cognito 2025',
      host: 'Royal College of Engineering and Technology',
      level: 'Regional',
      date: '2025',
      body: 'Third place at an engineering college tech fest — the first of the podium finishes.',
      tone: 'azure',
    },
  ] satisfies Award[],
  press: {
    outlet: 'Malayala Manorama',
    kicker: 'In print',
    headlineMl: 'സ്കൂളിലെ തിരഞ്ഞെടുപ്പിന് സോഫ്റ്റ്‌വെയർ',
    headline: 'Software for the school election',
    body:
      'The state daily ran the story of three plus-two students at Holy Grace Academy, Mala, who built ‘EduVote’ and ran the student council election on it — with the management confirming the vote went through on the software without a hitch.',
    image: '/assets/paper.jpg',
    alt: 'Malayala Manorama clipping about the EduVote student council election software built by students of Holy Grace Academy, Mala',
  },
  now: {
    label: 'Right now',
    value: 'Grade 12',
    detail: 'Holy Grace Academy, Mala · Kerala',
  },
} as const;

/* ── STACK ────────────────────────────────────────────────────── */

export type StackGroup = {
  label: string;
  weight: 'core' | 'lang' | 'frame' | 'tool';
  items: string[];
};

export const stack: StackGroup[] = [
  {
    label: 'Core stack',
    weight: 'core',
    items: ['React.js', 'Next.js', 'React Native', 'Node.js', 'Expo', 'Three.js', 'Electron'],
  },
  {
    label: 'Languages',
    weight: 'lang',
    items: ['JavaScript', 'TypeScript', 'Python', 'HTML5', 'CSS3', 'JSX'],
  },
  {
    label: 'Frameworks',
    weight: 'frame',
    items: ['Vue.js', 'Flask', 'Vite', 'Bootstrap', 'shadcn/ui', 'PyQt'],
  },
  {
    label: 'Tools & platforms',
    weight: 'tool',
    items: ['Firebase', 'Azure', 'Figma', 'VS Code', 'Cloudflare', 'Adobe CC', 'Blender', 'Krita', 'Git', 'npm'],
  },
];

export const marquee = [
  'React.js',
  'Next.js',
  'React Native',
  'Node.js',
  'Expo',
  'Three.js',
  'Electron',
  'TypeScript',
  'Python',
  'Firebase',
  'Vue.js',
  'shadcn/ui',
  'Vite',
  'Flask',
  'Figma',
  'Blender',
];

/* ── ABOUT ────────────────────────────────────────────────────── */

export const about = {
  kicker: 'About',
  headline: ['Student.', 'Builder.', 'Tinkerer.'],
  paragraphs: [
    "I'm Alan Betty, a Grade 12 student at Holy Grace Academy in Mala, Kerala, with an obsession for building things that actually work across platforms. Pyraxis — a full custom browser for Windows, macOS, and mobile — is proof that stubbornness and curiosity can ship real products.",
    "Right now I'm building an AI-powered study app and going deeper into back-end. I collaborate freely, help where I can, and always hunt the next interesting problem.",
    'Off-screen: YouTube videos, Blender renders, and an unhealthy addiction to learning new tools.',
  ],
  pullQuote: 'Talk philosophy? Easy. Live it? Next level.',
  rows: [
    { k: 'Currently', v: 'Grade 12' },
    { k: 'School', v: 'Holy Grace Academy' },
    { k: 'Personal repos', v: '30+' },
    { k: 'Platforms shipped', v: '4' },
    { k: 'Competitions won', v: '2 national' },
    { k: 'Based in', v: 'Kerala, IN' },
  ],
  timeline: [
    {
      year: '2023',
      title: 'First commit',
      body: 'Started shipping publicly on GitHub. Small tools, aviation sites, browser extensions.',
    },
    {
      year: '2024',
      title: 'Pyraxis begins',
      body: 'Set out to build a browser that was not a Chromium wrapper. Python + PyQt, custom chrome.',
    },
    {
      year: '2025',
      title: 'Desktop ships',
      body: 'Real installable Windows & macOS builds. Third place at Cognito, the first podium finish.',
    },
    {
      year: '2026',
      title: 'Four platforms, two firsts',
      body: 'Mobile rebuilt in React Native. First place at two national digital fests. The school elected its council on software we wrote.',
    },
  ],
} as const;

export const hire = {
  headline: 'Looking to hire?',
  body: 'Available for freelance, internships, and collabs. I move fast, communicate clearly, and care about the details.',
  services: ['Front-end dev', 'UI/UX design', 'Mobile apps', 'Cross-platform'],
} as const;

export const contact = {
  kicker: 'Contact',
  headline: ["Let's build", 'something.'],
  body: 'Open to projects, collabs, and conversations. Pick whatever channel works for you.',
} as const;

export const nav = [
  { id: 'flagship', label: 'Flagship', num: '01' },
  { id: 'work', label: 'Work', num: '02' },
  { id: 'awards', label: 'Awards', num: '03' },
  { id: 'stack', label: 'Stack', num: '04' },
  { id: 'about', label: 'About', num: '05' },
  { id: 'contact', label: 'Contact', num: '06' },
] as const;
