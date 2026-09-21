// Wires the SAM art kit to match state. Reads attack timing. Does not change it.

import type { AttackKind, Fighter } from '../game/types.ts';
import { profileFor, SMASH_CHARGE } from '../combat/attacks.ts';
import { drawSamPose, type SamPose } from '../../art/sam/paint.ts';

function family(kind: AttackKind): SamPose {
  if (kind === 'upSmash' || kind === 'upAerial' || kind === 'upSpecial' || kind === 'throwUp') return 'up';
  if (kind === 'downSmash' || kind === 'downAerial' || kind === 'throwDown') return 'down';
  if (kind === 'backSmash' || kind === 'backAerial' || kind === 'throwBack') return 'back';
  if (kind === 'forwardSmash' || kind === 'throwForward') return 'smash';
  return 'aerial';
}

function attackVisual(f: Fighter): { pose: SamPose; phase: number; power: number } | null {
  if (f.charge && !f.attack) {
    const pose = family(f.charge.kind);
    const wind: SamPose = pose === 'smash' ? 'windup' : pose;
    return { pose: wind, phase: 0, power: Math.min(1, f.charge.t / SMASH_CHARGE.max) };
  }
  if (!f.attack) return null;
  const profile = profileFor(f.id, f.attack.kind);
  const t = f.attack.t;
  const pose = family(f.attack.kind);
  const wind: SamPose = pose === 'smash' ? 'windup' : pose;
  if (t < profile.startup) return { pose: wind, phase: 0, power: 0.35 };
  const activeEnd = profile.startup + profile.active;
  if (t < activeEnd) return { pose, phase: 0, power: 1 };
  const u = (t - activeEnd) / Math.max(0.001, profile.recovery);
  return { pose, phase: 0, power: Math.max(0, 1 - u) };
}

/** In-match SAM. Facing and blink stay in drawFighter. */
export function drawSamKit(
  ctx: CanvasRenderingContext2D,
  f: Fighter,
  flash: boolean,
  rim: string,
): void {
  const tumbling = f.koHold || (f.hitstun > 0 && !f.grounded);
  ctx.save();
  if (tumbling) ctx.rotate(f.koHold ? -0.7 : f.anim * 8);
  else if (f.hitstun > 0) ctx.rotate(-0.2);

  const attack = attackVisual(f);
  if (attack && f.hitstun <= 0 && !f.koHold) {
    drawSamPose(ctx, attack.pose, { rim, flash, phase: attack.phase, power: attack.power });
    ctx.restore();
    return;
  }
  if (f.hitstun > 0 || f.koHold) {
    drawSamPose(ctx, tumbling ? 'ko' : 'flinch', { rim, flash, power: 0 });
    ctx.restore();
    return;
  }
  if (!f.grounded) {
    const phase = f.vy < -60 ? 0.12 : f.vy < 140 ? 0.48 : 0.84;
    drawSamPose(ctx, 'jump', { rim, flash, phase, power: 0 });
    ctx.restore();
    return;
  }
  if (Math.abs(f.vx) > 28) {
    const hz = f.runTime > 0.14 ? 2.35 : 1.3;
    drawSamPose(ctx, 'walk', { rim, flash, phase: f.anim * hz, power: 0 });
    ctx.restore();
    return;
  }
  drawSamPose(ctx, 'idle', { rim, flash, phase: f.anim, power: 0 });
  ctx.restore();
}
