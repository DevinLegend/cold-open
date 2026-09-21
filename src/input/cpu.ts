// Lane: input. A small decision loop. It is not a trained opponent.
// It can smash, grab, dodge, and spend the recovery jump when it leaves the slab.

import type { Fighter, Intent } from '../game/types.ts';
import { EMPTY_INTENT } from '../game/types.ts';
import { PLATFORM } from '../stage/layout.ts';

function cpuIntent(partial: Partial<Intent> = {}): Intent {
  return { ...EMPTY_INTENT, ...partial };
}

export function planCpu(self: Fighter, foe: Fighter, rng: () => number): Intent {
  if (self.out || self.koHold || self.held) return EMPTY_INTENT;

  const mid = (PLATFORM.left + PLATFORM.right) / 2;
  const outside =
    self.x < PLATFORM.left + 4 ||
    self.x > PLATFORM.right - 4 ||
    (!self.grounded && self.y > PLATFORM.top + 20);

  if (outside) {
    const toward: -1 | 1 = self.x < mid ? 1 : -1;
    return cpuIntent({ x: toward, jumpHeld: true, jumpEdge: true });
  }

  const dx = foe.x - self.x;
  const dir: -1 | 1 = dx >= 0 ? 1 : -1;
  const adx = Math.abs(dx);
  const nearLeft = self.x < PLATFORM.left + 80;
  const nearRight = self.x > PLATFORM.right - 80;
  let move: -1 | 0 | 1 = adx > 100 ? dir : 0;
  if (self.grounded && ((nearLeft && move < 0) || (nearRight && move > 0))) move = 0;

  // A short approach before the first swing, so the opening exchange is readable.
  if (self.anim < 0.7 && self.hitstun <= 0) {
    return cpuIntent({ x: move === 0 ? dir : move });
  }

  if (self.hitstun <= 0 && foe.attack && adx < 88 && self.grounded && rng() < 0.16) {
    const away: -1 | 0 | 1 = rng() < 0.45 ? (dir === 1 ? -1 : 1) : 0;
    return cpuIntent({ dodgeEdge: true, x: away });
  }
  if (self.hitstun <= 0 && adx < 78 && self.grounded && rng() < 0.14) {
    return cpuIntent({ grabEdge: true, x: dir });
  }
  if (self.hitstun <= 0 && adx < 112 && self.grounded && rng() < 0.58) {
    const roll = rng();
    const y: -1 | 0 | 1 = roll < 0.16 ? -1 : roll < 0.28 ? 1 : 0;
    const x: -1 | 0 | 1 = y === 0 ? dir : 0;
    return cpuIntent({ x, y, attackEdge: true });
  }
  if (self.hitstun <= 0 && adx < 110 && !self.grounded && rng() < 0.5) {
    const y: -1 | 0 | 1 = foe.y < self.y - 36 ? -1 : foe.y > self.y + 28 ? 1 : 0;
    return cpuIntent({ x: dir, y, attackEdge: true });
  }
  if (foe.y < self.y - 80 && self.grounded && rng() < 0.4) {
    return cpuIntent({
      x: move === 0 ? dir : move,
      y: -1,
      jumpHeld: true,
      jumpEdge: true,
    });
  }
  if (adx < 70 && rng() < 0.3) {
    const back: -1 | 1 = dir === 1 ? -1 : 1;
    return cpuIntent({ x: back });
  }
  return cpuIntent({ x: move });
}
