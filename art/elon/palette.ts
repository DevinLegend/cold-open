// Elon paint aliases. Locked fills come from art/palette.ts (the one-pager).
// Do not add a second accent. Blast cyan, magenta, and rocket ember stay off this fighter.

import { FIGHTERS, STAGE } from '../palette.ts';

const elon = FIGHTERS.elon;

export const ELON = {
  /** Charcoal jacket. The body mass. */
  jacket: elon.body,
  /** White tee. Carries the read when charcoal sits on rust. */
  tee: elon.cloth,
  hair: elon.hair,
  /** Acid teal. Greener than the blast cyan rim. */
  accent: elon.accent,
  /** Flat stylized skin. Not a portrait. */
  skin: '#f0c9ae',
  /** Charcoal shade of the jacket. Not a second accent. */
  pants: '#141820',
  /** Charcoal shade of the jacket. Unbranded pack. */
  pack: '#10141c',
  /** Near-black ink from the blast void, so outlines hold on ochre. */
  ink: STAGE.blast.void,
  /** Nameplate body is the same charcoal as the jacket. */
  plate: elon.body,
  streak: elon.accent,
  streakCore: '#f4fffb',
  /**
   * Darker shade of the locked teal so the blade holds on ochre.
   * Green stays above blue. This is not the blast cyan rim.
   */
  streakEdge: '#0c6e60',
  /** Landing puff stays in the ground family. The teal ring is the tell. */
  dust: STAGE.ground.mid,
  dustShadow: STAGE.ground.lip,
} as const;

/** Torso width. Sam's stub torso is 48; this stays narrower. */
export const ELON_SHOULDER_W = 30;

export const REF_SAM_SHOULDER_W = 48;
