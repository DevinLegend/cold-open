// Lane: combat. Pure hit geometry, knockback, and blast tests.

import type { AttackKind, Fighter, FighterDef } from '../game/types.ts';
import { clamp } from '../game/math.ts';
import type { Hitbox } from './attacks.ts';
import { BLAST } from '../stage/layout.ts';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function overlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function hurtbox(f: Pick<Fighter, 'x' | 'y'>, def: Pick<FighterDef, 'width' | 'height'>): Rect {
  return {
    x: f.x - def.width / 2,
    y: f.y - def.height,
    w: def.width,
    h: def.height,
  };
}

export function attackBox(f: Pick<Fighter, 'x' | 'y' | 'facing'>, hit: Hitbox): Rect {
  const near = f.x + f.facing * hit.forward;
  const far = f.x + f.facing * (hit.forward + hit.w);
  return {
    x: Math.min(near, far),
    y: f.y - hit.up - hit.h / 2,
    w: Math.abs(far - near),
    h: hit.h,
  };
}

export function knockbackMag(
  baseKb: number,
  growth: number,
  damageAfter: number,
  weight: number,
): number {
  return (baseKb + damageAfter * growth) / Math.max(0.4, weight);
}

export function launchVector(
  angleDeg: number,
  mag: number,
  facing: 1 | -1,
): { vx: number; vy: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    vx: Math.cos(rad) * mag * facing,
    vy: -Math.sin(rad) * mag,
  };
}

export function hitstunFor(mag: number): number {
  return clamp(mag / 1450, 0.15, 0.85);
}

const REVERSE_LAUNCH: ReadonlySet<AttackKind> = new Set(['backSmash', 'backAerial', 'throwBack']);

/** Back moves keep the attacker's facing and send the defender the other way. */
export function knockFacing(kind: AttackKind, facing: 1 | -1): 1 | -1 {
  if (!REVERSE_LAUNCH.has(kind)) return facing;
  return facing === 1 ? -1 : 1;
}

/** Left, right, and below. High launches are not a ceiling KO — they have to come back down or leave a side. */
export function inBlast(x: number, y: number): boolean {
  return x < BLAST.left || x > BLAST.right || y > BLAST.bottom;
}
