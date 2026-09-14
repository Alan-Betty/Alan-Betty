import { identity } from '@/lib/data';
import CollapseTrigger from '@/components/chrome/CollapseTrigger';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__mega display" aria-hidden="true">
        ALAN BETTY
      </div>

      <div className="footer__bar">
        <p className="hud">{identity.footer}</p>
        <nav className="footer__links hud" aria-label="Elsewhere">
          <a href="https://github.com/Alan-Betty" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="https://pyraxisbrowser.tech" target="_blank" rel="noreferrer">
            Pyraxis
          </a>
          <a href={`mailto:${identity.email}`}>Email</a>
        </nav>
        <p className="hud footer__colophon">
          Next.js · WebGL · no templates
          <CollapseTrigger />
        </p>
      </div>
    </footer>
  );
}
