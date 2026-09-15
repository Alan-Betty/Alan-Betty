'use client';

import { collapse } from '@/lib/singularity';

/**
 * The easter egg's trigger. It used to be an unlabelled 14px disc at half
 * opacity, which nobody found. It is now a labelled pill with a core that
 * keeps accreting — still the quietest thing in the footer, but it reads as
 * a control on sight instead of on the second look.
 */
export default function CollapseTrigger() {
  return (
    <button
      className="collapse-trigger"
      onClick={collapse}
      aria-label="Collapse the page into the singularity"
      data-cursor="view"
      data-cursor-label="Feed"
    >
      <span className="collapse-trigger__orb" aria-hidden="true">
        <i className="collapse-trigger__core" />
        <i className="collapse-trigger__ring" />
        <i className="collapse-trigger__ring collapse-trigger__ring--late" />
      </span>
      <span className="collapse-trigger__label">feed the hole</span>
    </button>
  );
}
