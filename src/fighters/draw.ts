// Lane: fighters. Stylized geometry only — rectangles, coats, visors. No portraits, no logos.

import type { Fighter } from '../game/types.ts';
import { isActive, profileFor } from '../combat/attacks.ts';
import { drawDarioArt, type DarioPose } from './dario-art.ts';
import { drawElonKit } from './elon-art.ts';
import { drawSamKit } from './sam-art.ts';
import { ROSTER } from './roster.ts';

export function drawShadow(ctx: CanvasRenderingContext2D, f: Fighter): void {
  const def = ROSTER[f.id];
  ctx.save();
  ctx.fillStyle = 'rgba(20, 6, 4, 0.4)';
  ctx.beginPath();
  ctx.ellipse(f.x, f.y + 2, def.width * 0.55, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawFighter(ctx: CanvasRenderingContext2D, f: Fighter): void {
  const blink = f.intangible > 0 && Math.floor(f.anim * 22) % 2 === 0;
  const flash = f.damageFlash > 0.08;
  const rim = f.slot === 0 ? '#F6E7D4' : '#D5F3EA';
  const sam = f.id === 'sam';

  const idle = !f.attack && f.hitstun <= 0 && f.grounded && Math.abs(f.vx) < 12;
  const bob = idle && !sam ? Math.sin(f.anim * 2.2) * 1.4 : 0;

  ctx.save();
  ctx.translate(f.x, f.y + bob);
  ctx.scale(f.facing, 1);

  if (!blink) {
    if (f.id === 'elon') drawElonKit(ctx, f, flash, rim);
    else if (sam) drawSamKit(ctx, f, flash, rim);
    else drawDarioArt(ctx, darioPose(f), { ...darioFx(f), rim, flash });
  }

  ctx.restore();
}

function darioPose(f: Fighter): DarioPose {
  if (f.hitstun > 0 || f.koHold) return 'ko';
  const kind = f.attack?.kind;
  if (kind === 'upSmash' || kind === 'upAerial' || kind === 'upSpecial' || kind === 'throwUp') return 'upSmash';
  if (kind === 'downSmash' || kind === 'downAerial' || kind === 'throwDown') return 'downSmash';
  if (
    kind === 'forwardAerial' ||
    kind === 'backAerial' ||
    kind === 'grab'
  ) {
    return 'aerial';
  }
  if (kind === 'forwardSmash' || kind === 'backSmash' || kind === 'throwForward' || kind === 'throwBack') {
    const profile = profileFor(f.id, kind);
    if (f.attack && isActive(profile, f.attack.t)) return 'smashActive';
    return 'smashWindup';
  }
  if (!f.grounded) return 'jump';
  if (Math.abs(f.vx) > 28) {
    const step = Math.sin(f.anim * (f.runTime > 0.14 ? 14 : 8)) > 0;
    return step ? 'walkA' : 'walkB';
  }
  return 'idle';
}

function darioFx(f: Fighter): { flash: boolean; fx: number; spin: number } {
  const flash = f.damageFlash > 0.08;
  const spin = f.anim;
  if (!f.attack || f.hitstun > 0) return { flash, fx: f.hitstun > 0 ? 1 : 0, spin };
  const profile = profileFor(f.id, f.attack.kind);
  const active = isActive(profile, f.attack.t);
  return { flash, fx: active ? 1 : 0.35, spin };
}


