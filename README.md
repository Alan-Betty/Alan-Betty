# Alan Betty - Portfolio

hey, I'm Alan. frontend dev, UI/UX designer and the guy who built a whole browser ([Pyraxis](https://pyraxisbrowser.tech)) from Kerala, India 🇮🇳

this is my portfolio. it's live at **[alan-betty.vercel.app](https://alan-betty.vercel.app)** so go check it out before reading all this lol.

I didn't use any template, component library or CSS framework for this. everything is hand built, which ngl took way longer than it should have. worth it tho.

---

## Running it locally

you need Node 18+ (I use 22).

```bash
git clone https://github.com/Alan-Betty/Alan-Betty.git
cd Alan-Betty
npm install
npm run dev
```

then open http://localhost:3000

other scripts:

| command | what it does |
| --- | --- |
| `npm run build` | production build |
| `npm run start` | serves the production build |
| `npm run gen:assets` | regenerates the textures in `public/assets` |

---

## Tech Stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript**
- **Three.js** for the black hole in the background
- **Lenis** for smooth scrolling
- **GSAP** for a few animations
- plain CSS, split into `styles/tokens.css`, `base.css`, `chrome.css`, `ui.css`, `sections.css`

fonts are Bricolage Grotesque (headings), Instrument Serif Italic (the quote-y bits) and JetBrains Mono (labels and all the HUD stuff).

---

## The black hole (yes it's real physics)

ok so this is the part I'm most proud of fr.

the background isn't a video or a png. it's a Schwarzschild black hole that's actually ray traced in a shader. every pixel traces a light ray backwards from the camera and bends it using the real equation for how light moves near a black hole:

```
d²r/dλ² = -3·h²·r / |r|⁵        h = |r × v|
```

( dw i didnt know any of this before i reasearched abt this. AI Did the complex part.)
because of that, all the stuff you'd expect just shows up on its own:

- **the shadow** is way bigger than the actual event horizon (~2.6x), which is what real black holes look like and what most fake ones get wrong
- **the photon ring** around the edge
- **the back of the disk shows up above and below the hole** because the light literally bends around it
- **the stars behind it get warped** into arcs

one side of the disk is bright and blue, the other is dim and red. that's Doppler shifting + gravitational redshift, and honestly that's the thing that makes it look real.

some other stuff I did:

- the starfield has a proper brightness curve so a few stars are bright and most are faint (a sky full of equal dots just looks like noise)
- there's a Milky Way band with dust lanes cutting through it
- on top of all that there's **900 stars** simulated as an N-body layer, falling in, stretching into streams and getting eaten, then respawning
- the hole drifts with scroll and slowly leans toward your cursor. it's heavily damped so it feels heavy af, not like dragging a sprite
- it dims once you scroll past the hero so it doesn't distract from the actual content


---

## Easter egg 👀

there's a tiny dark circle at the very bottom of the footer. click it.

---

## Contact

if you wanna collab, hire me, or just say hi, hmu:

- 📧 **padayattilbettyalan@gmail.com**
- GitHub: [@Alan-Betty](https://github.com/Alan-Betty) · Pyraxis: [@PyraxisBrowser](https://github.com/PyraxisBrowser)
- X: [@AlanPBetty](https://x.com/AlanPBetty) · Instagram: [@alan__betty](https://instagram.com/alan__betty) · YouTube: [@alanbetty](https://youtube.com/@alanbetty)
- [Discord](https://discord.com/users/1229633538362703882)

if you liked it, drop a ⭐ on the repo, it lowkey means a lot.

feel free to take inspo from the code but pls don't just copy paste the whole site and call it yours 🙏

\- Alan
