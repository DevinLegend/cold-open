// Lane: combat. Dodge windows.
// Elena: retune these numbers. Do not retouch the dodge state machine in match/body.ts yet.

import type { DodgeKind } from '../game/types.ts';

export interface DodgeSpec {
  startup: number;
  /** Intangible window. Spot still covers a grounded smash's active frames. */
  active: number;
  recovery: number;
  speed: number;
}

// Post-press windows. Spot keeps a smash-slip, then a longer punish tail.
// Roll is a burst over run speed, not a third of the slab. Air drifts, then freefalls.
export const DODGE: Record<DodgeKind, DodgeSpec> = {
  spot: { startup: 0.03, active: 0.18, recovery: 0.20, speed: 0 },
  roll: { startup: 0.05, active: 0.14, recovery: 0.18, speed: 560 },
  air: { startup: 0.04, active: 0.13, recovery: 0.16, speed: 430 },
};
