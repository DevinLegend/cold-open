// Lane: fighters. Default instance used by the match and by menu previews.

import type { Fighter, FighterId } from '../game/types.ts';
import { PLATFORM, SPAWN, STOCKS } from '../stage/layout.ts';

export function spawnFighter(
  slot: 0 | 1,
  id: FighterId,
  x: number = SPAWN[slot],
  y: number = PLATFORM.top,
): Fighter {
  return {
    slot,
    id,
    x,
    y,
    vx: 0,
    vy: 0,
    facing: slot === 0 ? 1 : -1,
    damage: 0,
    stocks: STOCKS,
    grounded: true,
    jumpsLeft: 1,
    coyote: 0,
    jumpBuffer: 0,
    jumpCut: false,
    jumpCutT: 0,
    runTime: 0,
    hitstun: 0,
    intangible: 0,
    respawnLock: 0,
    landingLag: 0,
    attack: null,
    charge: null,
    dodge: null,
    holding: false,
    holdT: 0,
    held: false,
    freefall: false,
    recoveryUsed: false,
    anim: 0,
    damageFlash: 0,
    koHold: false,
    out: false,
    dust: 0,
  };
}
