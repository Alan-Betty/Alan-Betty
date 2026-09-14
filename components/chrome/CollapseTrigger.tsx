'use client';

import { collapse } from '@/lib/singularity';

/**
 * The easter egg's trigger. It sits at the end of the footer colophon as a
 * small dark disc with a faint ring — legible if you are looking at it,
 * invisible if you are not. Keyboard reachable and properly labelled, so
 * nobody hits it by accident but anybody can find it.
 */
export default function CollapseTrigger() {
  return (
    <button
      className="collapse-trigger"
      onClick={collapse}
      aria-label="Collapse the page into the singularity"
      title="?"
      data-cursor="view"
      data-cursor-label="Feed"
    >
      <span className="collapse-trigger__core" aria-hidden="true" />
      <span className="collapse-trigger__ring" aria-hidden="true" />
    </button>
  );
}
