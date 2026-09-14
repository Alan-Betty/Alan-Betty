/**
 * Shared state for the black hole.
 *
 * The renderer (`components/canvas/Cosmos.tsx`) owns the simulation and
 * publishes where the hole is on screen; the devour effect
 * (`components/chrome/EventHorizon.tsx`) reads that to aim the DOM at it and
 * drives the phase timeline. Keeping both sides on one plain object avoids
 * threading context through half the tree for something that changes every
 * frame.
 *
 * The full sequence, once triggered:
 *
 *   idle → devouring → gorging → detonating → reforming → idle
 *
 * `devouring` eats the copy, `gorging` spends ten-odd seconds eating the
 * star swarm instead, `detonating` blows the whole thing apart, and
 * `reforming` flies the words back to where they came from. Nothing is
 * persisted and nothing reloads — the page puts itself back together.
 */

export type Phase = 'idle' | 'devouring' | 'gorging' | 'detonating' | 'reforming';

export const singularity = {
  /** Event-horizon centre, in viewport pixels. */
  x: 0,
  y: 0,
  /** Event-horizon radius, in pixels. */
  r: 48,
  /** 0..2 — how hard the disk is flaring. Written by the devour effect. */
  feed: 0,
  /** Target mass multiplier. 1 at rest, grows as it eats. */
  swell: 1,
  /** 0..1 — extra inward drag applied to the star swarm while gorging. */
  gorge: 0,
  /** 0..1 detonation brightness, published by the renderer as it decays. */
  blast: 0,
  /** Shock-front radius in uv units, published likewise; sweeps off-frame. */
  shock: 0,
  /**
   * Bumped once per detonation. The renderer compares it against the last
   * value it saw so the outward impulse is applied on exactly one frame,
   * however the two loops happen to interleave.
   */
  blastId: 0,
  phase: 'idle' as Phase,
  /** True once the renderer has published a real position. */
  ready: false,
};

const listeners = new Set<(phase: Phase) => void>();

export function onPhase(fn: (phase: Phase) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function setPhase(next: Phase) {
  if (singularity.phase === next) return;
  singularity.phase = next;
  for (const fn of listeners) fn(next);
}

export function collapse() {
  if (singularity.phase !== 'idle') return;
  setPhase('devouring');
}

/**
 * Fire the blast. Bumping the id is the whole signal: the renderer owns the
 * impulse and the light, and publishes `blast` / `shock` back here as they
 * run, so anything else that wants to react to the explosion can read them.
 */
export function detonate() {
  singularity.blastId++;
}

export function resetSingularity() {
  singularity.feed = 0;
  singularity.swell = 1;
  singularity.gorge = 0;
  singularity.blast = 0;
  singularity.shock = 0;
  setPhase('idle');
}
