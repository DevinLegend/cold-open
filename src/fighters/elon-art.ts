// Wires the Elon art kit to match state. Reads attack timing; does not change it.

import { profileFor } from '../combat/attacks.ts';
import type { AttackKind, Fighter } from '../game/types.ts';
import { drawElonPose, type ElonPose } from '../../art/elon/paint.ts';

const feet = new WeakMap<Fighter, { grounded: boolean; until: number }>();
const koSpin = new WeakMap<Fighter, number>();

function landingAmount(f: Fighter): number {
  const prev = feet.get(f);
  let until = prev?.until ?? -1;
  if (prev && !prev.grounded && f.grounded) until = f.anim + 0.34;
  feet.set(f, { grounded: f.grounded, until });
  if (until < 0 || f.anim >= until) return 0;
  return (until - f.anim) / 0.34;
}

function koAngle(f: Fighter): number {
  if (f.koHold) {
    const angle = (koSpin.get(f) ?? 0.4) + 0.28;
    koSpin.set(f, angle);
    return angle;
  }
  return f.anim * 9;
}

/** Existing kit poses only. New move kinds reuse smash, up, down, or aerial. */
function elonAttackPose(kind: AttackKind): ElonPose {
  if (kind === 'upSmash' || kind === 'upAerial' || kind === 'upSpecial' || kind === 'throwUp') return 'upSmash';
  if (kind === 'downSmash' || kind === 'downAerial' || kind === 'throwDown') return 'downSmash';
  if (kind === 'forwardSmash' || kind === 'backSmash' || kind === 'throwForward' || kind === 'throwBack') {
    return 'smash';
  }
  return 'aerial';
}

function attackVisual(f: Fighter): { pose: ElonPose; t: number; streak: number } | null {
  if (!f.attack) return null;
  const profile = profileFor(f.id, f.attack.kind);
  const t = f.attack.t;
  const start = Math.max(0.001, profile.startup);
  const active = Math.max(0.001, profile.active);
  const recovery = Math.max(0.001, profile.recovery);
  const pose = elonAttackPose(f.attack.kind);
  if (pose === 'smash' || pose === 'upSmash' || pose === 'downSmash') {
    const windup = pose === 'smash' ? 'smashWindup' : pose;
    if (t < profile.startup) return { pose: windup, t: t / start, streak: 0 };
    if (t < profile.startup + profile.active) {
      const u = (t - profile.startup) / active;
      return { pose, t: u, streak: 0.35 + u * 0.65 };
    }
    const u = (t - profile.startup - profile.active) / recovery;
    return { pose, t: Math.max(0, 1 - u), streak: Math.max(0, 1 - u) };
  }
  const wind = profile.startup + profile.active;
  const u = Math.min(1, t / Math.max(0.001, wind));
  const streak =
    t < profile.startup ? 0 : t < wind ? 0.4 + u * 0.6 : Math.max(0, 1 - (t - wind) / recovery);
  return { pose: 'aerial', t: u, streak };
}

export function drawElonKit(
  ctx: CanvasRenderingContext2D,
  f: Fighter,
  flash: boolean,
  rim: string,
): void {
  const landed = landingAmount(f);
  const attack = attackVisual(f);
  let pose: ElonPose = 'idle';
  let t = 0;
  let streak: number | undefined;
  let vapor: number | undefined;
  let dust: number | undefined;

  if (f.koHold || (f.hitstun > 0 && !f.grounded)) {
    pose = 'ko';
    t = koAngle(f);
  } else if (attack) {
    pose = attack.pose;
    t = attack.t;
    streak = attack.streak;
  } else if (!f.grounded) {
    if (f.jumpsLeft <= 0 && f.vy < -40) {
      pose = 'upSmash';
      vapor = 1;
    } else {
      pose = 'jump';
      t = f.vy < 0 ? 0.18 : 0.82;
      vapor = f.vy < -30 ? 0.9 : 0;
    }
  } else if (landed > 0.35 && Math.abs(f.vx) < 90 && f.hitstun <= 0) {
    pose = 'downSmash';
    t = 0.4 + landed * 0.6;
    dust = landed;
  } else if (Math.abs(f.vx) > 28) {
    const rate = f.runTime > 0.14 ? 14 : 8;
    pose = 'walk';
    t = Math.sin(f.anim * rate);
  } else if (f.hitstun > 0) {
    pose = 'smashWindup';
    t = 0.5;
  }

  if (landed > 0 && pose !== 'ko' && pose !== 'smash' && pose !== 'smashWindup') {
    dust = Math.max(dust ?? 0, landed * 0.85);
  }

  drawElonPose(ctx, pose, t, { flash, rim, streak, vapor, dust });
}
