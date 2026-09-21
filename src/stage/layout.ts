// Lane: stage. One flat slab. Blast zones sit past the side edges and below the pit.
// Iris lock: docs/design/01-design-one-pager.md
// Width is 20 reference fighter-widths (inside 18–22). Thickness is 1.2 reference
// fighter-heights. One AABB, no soft platforms. Playable top Y stays 518.
// Rockets are parallax in stage/draw.ts and are not part of this collision set.

export const VIEW = { w: 1280, h: 720 } as const;

export const STAGE_NAME = 'Red Horizon';

/**
 * Jules: reference silhouette the slab is sized against.
 * Mean of the roster today — Elon 40×98, Sam 48×86, Dario 46×96.
 * Hurtboxes use each fighter's own width and height in fighters/roster.ts.
 * Hitboxes are explicit pixels in combat/attacks.ts, not this reference.
 * If a silhouette changes a lot, retune those hitboxes before asking the slab to move.
 */
export const REF_FIGHTER_WIDTH = 46;
export const REF_FIGHTER_HEIGHT = 94;

/** Iris lock: how many reference widths and heights the slab occupies. */
export const SLAB_FIGHTER_WIDTHS = 20;
export const SLAB_THICKNESS_FH = 1.2;

/** Fixed from the stub so spawns, HUD, and the rest camera stay anchored. */
export const PLAYABLE_TOP = 518;

const SLAB_WIDTH = REF_FIGHTER_WIDTH * SLAB_FIGHTER_WIDTHS;
const SLAB_HEIGHT = Math.round(REF_FIGHTER_HEIGHT * SLAB_THICKNESS_FH);
const SLAB_LEFT = (VIEW.w - SLAB_WIDTH) / 2;

export const PLATFORM = {
  left: SLAB_LEFT,
  right: SLAB_LEFT + SLAB_WIDTH,
  top: PLAYABLE_TOP,
  height: SLAB_HEIGHT,
} as const;

/**
 * Left, right, and below only. There is no ceiling blast.
 * The KO lines stay at the stub's tuned distances from center so a low-percent
 * hit still lands on the slab and a very high-percent hit can leave from mid-stage.
 * The lips moved outward with the Iris width, so the recovery gap past each lip is
 * the distance from the new edge to these lines.
 */
export const BLAST = {
  left: -80,
  right: 1360,
  bottom: PLAYABLE_TOP + 602,
} as const;

export const SPAWN: readonly [number, number] = [430, 850];

export const STOCKS = 3;
