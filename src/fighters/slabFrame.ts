// Contrast mock. Reads Miles's slab and the one-pager scale. Does not move either.

import { SLAB } from '../../art/palette.ts';
import { PLATFORM, REF_FIGHTER_HEIGHT, VIEW } from '../stage/layout.ts';

export const READABILITY_FRAME = { w: VIEW.w, h: VIEW.h } as const;

/** One sixth of the 720px frame. The sheet uses this. The stage stays at zoom 1. */
export const SIXTH = READABILITY_FRAME.h / 6;

export function liveSlabSize(): { width: number; height: number; air: number } {
  return {
    width: PLATFORM.right - PLATFORM.left,
    height: PLATFORM.height,
    air: SLAB.restAirInFighterHeights * REF_FIGHTER_HEIGHT,
  };
}
