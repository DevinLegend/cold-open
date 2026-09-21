// Lane: combat.
// forwardSmash and forwardAerial keep their original numbers so the low-percent
// onstage test and the high-percent KO test stay honest.
//
// Jules — hitbox contract (pixels, not sprite bounds):
//   forward: gap from the fighter origin (feet center) to the near edge, along facing.
//            Negative reaches behind. A back smash does not flip facing.
//   up:      height of the box center above the feet.
//   w, h:    box size.
//   Hurtbox: roster width × height, origin at the feet center, extending upward.
//            Ledge support uses the origin, not the hurtbox edge.
//   Reference silhouette for the slab only: REF_FIGHTER_WIDTH 46, REF_FIGHTER_HEIGHT 94.
//   Chest-high forward hits sit near up ≈ 0.6 FH. Up smashes sit near 1.1–1.3 FH.
//   Retune the `hit` fields. Do not resize the slab to match a swing.
//
// Feel, per fighter, without changing Jules's silhouettes:
//   Elon — longer forward hit, hang-time angle, rocket recovery (more lift than run).
//   Sam  — shortest startups, lower angles, tighter sweetspot boxes, shallower recovery.
//   Dario — slow, heavy, up smash is the tall wall, down air spikes.
//
// Elena: per-move startup / knockback / SMASH_CHARGE / RECOVERY_LAUNCH are the feel knobs.
// Do not rename kinds or the AttackProfile fields while Owen wires koLog.

import type { AttackKind, FighterId } from '../game/types.ts';

export interface Hitbox {
  /** Gap from the fighter's center to the near side of the box, along facing. Negative reaches behind. */
  forward: number;
  /** Height of the box center above the feet. */
  up: number;
  w: number;
  h: number;
}

export interface AttackProfile {
  kind: AttackKind;
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  /** Degrees above horizontal, in the direction knockFacing picks. 270 spikes downward. */
  angle: number;
  baseKb: number;
  growth: number;
  hit: Hitbox;
}

/**
 * Elena: reserved post-press charge window. Swings still start on the press at
 * multiplier 1 so a held attack key cannot eat the hit. A later pass can scale
 * by this without renaming AttackState.charge. Full multiplier is 1 + bonus
 * once a hold reaches max — a short sweetener, not a stall.
 */
export const SMASH_CHARGE = { max: 0.34, bonus: 0.32 } as const;

/**
 * Velocity applied once when up-special starts. Facing multiplies vx.
 * Elon lifts, Sam runs flatter, Dario goes almost straight up.
 */
export const RECOVERY_LAUNCH: Record<FighterId, { vy: number; vx: number }> = {
  elon: { vy: -1140, vx: 250 },
  sam: { vy: -860, vx: 400 },
  dario: { vy: -1040, vx: 80 },
};

function move(
  kind: AttackKind,
  startup: number,
  active: number,
  recovery: number,
  damage: number,
  angle: number,
  baseKb: number,
  growth: number,
  hit: Hitbox,
): AttackProfile {
  return { kind, startup, active, recovery, damage, angle, baseKb, growth, hit };
}

const ELON: Record<AttackKind, AttackProfile> = {
  forwardSmash: move('forwardSmash', 0.13, 0.08, 0.24, 14, 26, 260, 4.2, { forward: 12, up: 64, w: 74, h: 36 }),
  backSmash: move('backSmash', 0.14, 0.08, 0.26, 13, 38, 240, 4, { forward: -78, up: 62, w: 70, h: 36 }),
  downSmash: move('downSmash', 0.12, 0.08, 0.24, 12, 32, 210, 3.4, { forward: -36, up: 28, w: 84, h: 32 }),
  upSmash: move('upSmash', 0.14, 0.1, 0.26, 14, 84, 250, 4.4, { forward: -28, up: 118, w: 64, h: 52 }),
  forwardAerial: move('forwardAerial', 0.07, 0.1, 0.16, 9, 16, 180, 2.6, { forward: 14, up: 58, w: 70, h: 30 }),
  backAerial: move('backAerial', 0.08, 0.09, 0.16, 8, 30, 150, 2.2, { forward: -72, up: 58, w: 62, h: 30 }),
  downAerial: move('downAerial', 0.1, 0.08, 0.18, 11, 280, 160, 2.4, { forward: -20, up: 20, w: 50, h: 40 }),
  upAerial: move('upAerial', 0.07, 0.08, 0.16, 9, 80, 150, 2.2, { forward: -22, up: 112, w: 56, h: 40 }),
  grab: move('grab', 0.1, 0.08, 0.3, 0, 0, 0, 0, { forward: 10, up: 54, w: 42, h: 30 }),
  throwForward: move('throwForward', 0.01, 0.01, 0.01, 10, 38, 230, 3.6, { forward: 8, up: 50, w: 20, h: 20 }),
  throwBack: move('throwBack', 0.01, 0.01, 0.01, 10, 42, 230, 3.6, { forward: 8, up: 50, w: 20, h: 20 }),
  throwUp: move('throwUp', 0.01, 0.01, 0.01, 9, 86, 240, 3.8, { forward: 8, up: 50, w: 20, h: 20 }),
  throwDown: move('throwDown', 0.01, 0.01, 0.01, 8, 55, 180, 3, { forward: 8, up: 50, w: 20, h: 20 }),
  upSpecial: move('upSpecial', 0.06, 0.14, 0.22, 10, 78, 190, 2.6, { forward: -16, up: 100, w: 48, h: 64 }),
};

const SAM: Record<AttackKind, AttackProfile> = {
  forwardSmash: move('forwardSmash', 0.08, 0.07, 0.2, 11, 18, 220, 3.6, { forward: 10, up: 56, w: 68, h: 32 }),
  backSmash: move('backSmash', 0.09, 0.06, 0.2, 10, 22, 210, 3.4, { forward: -70, up: 54, w: 62, h: 28 }),
  downSmash: move('downSmash', 0.07, 0.06, 0.18, 9, 20, 180, 3, { forward: -34, up: 24, w: 78, h: 28 }),
  upSmash: move('upSmash', 0.08, 0.07, 0.2, 11, 86, 200, 3.3, { forward: -24, up: 108, w: 56, h: 44 }),
  forwardAerial: move('forwardAerial', 0.05, 0.08, 0.14, 8, 12, 160, 2.3, { forward: 12, up: 50, w: 64, h: 28 }),
  backAerial: move('backAerial', 0.05, 0.07, 0.12, 7, 16, 140, 2, { forward: -66, up: 50, w: 58, h: 26 }),
  downAerial: move('downAerial', 0.06, 0.07, 0.14, 8, 18, 130, 2, { forward: -18, up: 22, w: 52, h: 28 }),
  upAerial: move('upAerial', 0.05, 0.06, 0.12, 7, 82, 130, 1.9, { forward: -20, up: 104, w: 50, h: 36 }),
  grab: move('grab', 0.06, 0.06, 0.22, 0, 0, 0, 0, { forward: 12, up: 48, w: 36, h: 26 }),
  throwForward: move('throwForward', 0.01, 0.01, 0.01, 9, 28, 210, 3.2, { forward: 8, up: 46, w: 20, h: 20 }),
  throwBack: move('throwBack', 0.01, 0.01, 0.01, 9, 32, 210, 3.2, { forward: 8, up: 46, w: 20, h: 20 }),
  throwUp: move('throwUp', 0.01, 0.01, 0.01, 8, 84, 200, 3.2, { forward: 8, up: 46, w: 20, h: 20 }),
  throwDown: move('throwDown', 0.01, 0.01, 0.01, 7, 48, 160, 2.6, { forward: 8, up: 46, w: 20, h: 20 }),
  upSpecial: move('upSpecial', 0.05, 0.1, 0.16, 8, 42, 160, 2.2, { forward: 8, up: 70, w: 50, h: 36 }),
};

const DARIO: Record<AttackKind, AttackProfile> = {
  forwardSmash: move('forwardSmash', 0.17, 0.09, 0.28, 16, 48, 250, 4.8, { forward: 8, up: 70, w: 78, h: 42 }),
  backSmash: move('backSmash', 0.18, 0.1, 0.3, 15, 55, 240, 4.6, { forward: -80, up: 68, w: 72, h: 40 }),
  downSmash: move('downSmash', 0.16, 0.1, 0.28, 14, 70, 220, 4.2, { forward: -40, up: 30, w: 90, h: 36 }),
  upSmash: move('upSmash', 0.15, 0.12, 0.28, 17, 90, 280, 5.2, { forward: -34, up: 124, w: 78, h: 58 }),
  forwardAerial: move('forwardAerial', 0.09, 0.1, 0.2, 11, 58, 170, 3.1, { forward: 6, up: 62, w: 66, h: 46 }),
  backAerial: move('backAerial', 0.1, 0.1, 0.2, 11, 50, 160, 2.8, { forward: -74, up: 64, w: 64, h: 40 }),
  downAerial: move('downAerial', 0.12, 0.1, 0.22, 13, 270, 180, 3.2, { forward: -24, up: 18, w: 58, h: 48 }),
  upAerial: move('upAerial', 0.09, 0.1, 0.18, 12, 88, 170, 3, { forward: -28, up: 120, w: 66, h: 48 }),
  grab: move('grab', 0.12, 0.09, 0.32, 0, 0, 0, 0, { forward: 6, up: 58, w: 40, h: 34 }),
  throwForward: move('throwForward', 0.01, 0.01, 0.01, 12, 48, 250, 4.2, { forward: 8, up: 56, w: 20, h: 20 }),
  throwBack: move('throwBack', 0.01, 0.01, 0.01, 12, 52, 250, 4.2, { forward: 8, up: 56, w: 20, h: 20 }),
  throwUp: move('throwUp', 0.01, 0.01, 0.01, 11, 88, 270, 4.6, { forward: 8, up: 56, w: 20, h: 20 }),
  throwDown: move('throwDown', 0.01, 0.01, 0.01, 10, 62, 200, 3.4, { forward: 8, up: 56, w: 20, h: 20 }),
  upSpecial: move('upSpecial', 0.1, 0.16, 0.26, 12, 88, 180, 2.8, { forward: -30, up: 116, w: 70, h: 56 }),
};

const TABLE: Record<FighterId, Record<AttackKind, AttackProfile>> = {
  elon: ELON,
  sam: SAM,
  dario: DARIO,
};

export function profileFor(id: FighterId, kind: AttackKind): AttackProfile {
  return TABLE[id][kind];
}

export function duration(profile: AttackProfile): number {
  return profile.startup + profile.active + profile.recovery;
}

export function isActive(profile: AttackProfile, t: number): boolean {
  return t >= profile.startup && t < profile.startup + profile.active;
}

export function isSmash(kind: AttackKind): boolean {
  return (
    kind === 'forwardSmash' || kind === 'backSmash' || kind === 'downSmash' || kind === 'upSmash'
  );
}

export function isAerial(kind: AttackKind): boolean {
  return (
    kind === 'forwardAerial' ||
    kind === 'backAerial' ||
    kind === 'downAerial' ||
    kind === 'upAerial' ||
    kind === 'upSpecial'
  );
}

/** Direction + grounded picks the swing. Up-special is not on this path. */
export function chooseAttack(
  grounded: boolean,
  facing: 1 | -1,
  x: -1 | 0 | 1,
  y: -1 | 0 | 1,
): AttackKind {
  if (y < 0) return grounded ? 'upSmash' : 'upAerial';
  if (y > 0) return grounded ? 'downSmash' : 'downAerial';
  if (x !== 0 && x !== facing) return grounded ? 'backSmash' : 'backAerial';
  return grounded ? 'forwardSmash' : 'forwardAerial';
}

export function chooseThrow(facing: 1 | -1, x: -1 | 0 | 1, y: -1 | 0 | 1): AttackKind {
  if (y < 0) return 'throwUp';
  if (y > 0) return 'throwDown';
  if (x !== 0 && x !== facing) return 'throwBack';
  return 'throwForward';
}
