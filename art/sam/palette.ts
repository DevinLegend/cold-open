// SAM paint aliases. Locked fills come from art/palette.ts (the one-pager).
// Gold is the only accent. No second brand color, no blast-rim cyan.

import { FIGHTERS, STAGE } from '../palette.ts';

const sam = FIGHTERS.sam;

export const SAM = {
  /** Navy blazer. The body mass, broader than the other two. */
  blazer: sam.body,
  /** Lighter navy panel so the taper reads. Same hue, not a new accent. */
  lite: '#2c406c',
  /** Cool shirt in the open collar. Pops on rust. */
  shirt: sam.cloth,
  /** Short dome. Outlined in ink so it holds on the ochre sky. */
  hair: sam.hair,
  /** Warm gold. Deal-close flash and the nameplate letters. */
  accent: sam.accent,
  /** Flat stylized skin. Not a portrait. */
  skin: '#f0d3b6',
  /** Navy shade for the trousers. */
  trouser: '#15233c',
  shoe: '#0d1424',
  /** Near-black from the blast void, so the dome holds on the sky. */
  ink: STAGE.blast.void,
  plate: sam.body,
  hot: '#fff3c4',
  /** Darker gold edge so the swipe holds on ochre. Still the locked gold family. */
  goldEdge: '#8a6418',
} as const;

/**
 * Shoulder width. Elon's jacket is 30. The old stub torso was 48.
 * SAM stays the broadest outline.
 */
export const SAM_SHOULDER_W = 62;
