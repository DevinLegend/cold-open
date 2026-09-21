// Lane: match. Movement integration. Speeds live on the fighter roster.
// Elena: GRAVITY, hops, and dodge timings are feel. Leave the action priority
// (dodge, grab, attack, jump, then recovery) alone until koLog settles.

import type { AttackKind, Fighter, Intent, Spark } from '../game/types.ts';
import { approach, clamp } from '../game/math.ts';
import { burst } from '../game/sparks.ts';
import { chooseAttack, duration, isAerial, profileFor, RECOVERY_LAUNCH } from '../combat/attacks.ts';
import { DODGE } from '../combat/dodge.ts';
import { ROSTER } from '../fighters/roster.ts';
import { resolveSlab } from '../stage/collision.ts';

const GRAVITY = 2050;
const MAX_FALL = 1180;
const AIR_DRAG = 0.32;
const COYOTE = 0.1;

export function stepFighter(f: Fighter, intent: Intent, dt: number, sparks: Spark[]): void {
  if (f.out || f.koHold) return;

  f.anim += dt;
  f.damageFlash = Math.max(0, f.damageFlash - dt);
  f.intangible = Math.max(0, f.intangible - dt);
  f.respawnLock = Math.max(0, f.respawnLock - dt);
  f.landingLag = Math.max(0, f.landingLag - dt);
  f.hitstun = Math.max(0, f.hitstun - dt);
  f.coyote = f.grounded ? 0 : Math.max(0, f.coyote - dt);
  f.dust = Math.max(0, f.dust - dt);

  if (f.held) {
    f.vx = 0;
    f.vy = 0;
    f.attack = null;
    f.charge = null;
    f.dodge = null;
    return;
  }

  if (intent.jumpEdge) f.jumpBuffer = 0.12;
  else f.jumpBuffer = Math.max(0, f.jumpBuffer - dt);

  if (f.holding) {
    f.holdT += dt;
    f.vx = approach(f.vx, 0, 2400 * dt);
    if (f.grounded) f.vy = 0;
  }

  const def = ROSTER[f.id];
  const busy =
    f.respawnLock > 0 ||
    f.hitstun > 0 ||
    f.landingLag > 0 ||
    f.attack !== null ||
    f.charge !== null ||
    f.dodge !== null ||
    f.holding;

  if (!busy) {
    const back =
      !f.freefall &&
      intent.attackEdge &&
      intent.y === 0 &&
      intent.x !== 0 &&
      intent.x !== f.facing;
    if (intent.x !== 0) f.runTime += dt;
    else f.runTime = 0;
    if (intent.x !== 0 && !back) f.facing = intent.x;

    const mag = f.runTime > 0.14 ? def.run : def.walk;
    const accel = (f.grounded ? 3400 : 1500) * dt;
    f.vx = approach(f.vx, intent.x * mag, accel);

    if (!f.freefall && intent.dodgeEdge) {
      beginDodge(f, intent);
      f.jumpBuffer = 0;
    } else if (!f.freefall && intent.grabEdge && f.grounded) {
      if (intent.x !== 0) f.facing = intent.x;
      beginAttack(f, 'grab', 1);
      f.jumpBuffer = 0;
    } else if (!f.freefall && intent.attackEdge) {
      // Press starts the swing. Holding the button does not delay it.
      // Elena: SMASH_CHARGE in attacks.ts is the knob if a later pass adds a real charge.
      const kind = chooseAttack(f.grounded, f.facing, intent.x, intent.y);
      beginAttack(f, kind, 1);
      f.jumpBuffer = 0;
    } else if (!f.freefall && f.jumpBuffer > 0 && (f.grounded || f.coyote > 0)) {
      f.vy = -def.fullHop;
      f.grounded = false;
      f.coyote = 0;
      f.jumpBuffer = 0;
      f.jumpCut = true;
      f.jumpCutT = 0;
      f.jumpsLeft = 1;
      f.recoveryUsed = false;
    } else if (!f.freefall && f.jumpBuffer > 0 && !f.grounded && f.jumpsLeft > 0) {
      f.vy = -def.airHop;
      f.jumpsLeft -= 1;
      f.jumpBuffer = 0;
      f.jumpCut = false;
    } else if (!f.freefall && f.jumpBuffer > 0 && !f.grounded && !f.recoveryUsed) {
      beginAttack(f, 'upSpecial', 1);
      f.jumpBuffer = 0;
    }
  } else if (f.grounded && f.hitstun > 0) {
    f.vx = approach(f.vx, 0, 360 * dt);
  } else if (f.grounded && (f.attack || f.landingLag > 0 || f.charge || f.dodge?.kind === 'spot')) {
    f.vx = approach(f.vx, 0, 1600 * dt);
  }

  if (f.jumpCut) {
    f.jumpCutT += dt;
    if (!intent.jumpHeld && f.vy < 0) {
      f.vy *= 0.62;
      f.jumpCut = false;
    } else if (f.jumpCutT > 0.1) {
      f.jumpCut = false;
    }
  }

  if (f.attack && !f.holding) {
    f.attack.t += dt;
    const profile = profileFor(f.id, f.attack.kind);
    if (f.attack.t >= duration(profile)) f.attack = null;
  }

  tickDodge(f, dt);

  if (!f.grounded) {
    f.vy = Math.min(MAX_FALL, f.vy + GRAVITY * dt);
    f.vx *= Math.exp(-AIR_DRAG * dt);
  }

  const prevX = f.x;
  const prevY = f.y;
  const fallSpeed = f.vy;
  f.x += f.vx * dt;
  f.y += f.vy * dt;

  const contact = resolveSlab(f, prevX, prevY, def);
  if (contact === 'left') f.coyote = COYOTE;
  if (contact === 'landed') {
    f.jumpsLeft = 1;
    f.coyote = 0;
    f.jumpCut = false;
    f.freefall = false;
    f.recoveryUsed = false;
    if (f.dodge?.kind === 'air') {
      f.dodge = null;
      f.landingLag = 0.08;
    }
    if (f.attack && isAerial(f.attack.kind)) {
      f.attack = null;
      f.landingLag = Math.max(f.landingLag, 0.12);
    }
    if (fallSpeed > 520) burst(sparks, f.x, f.y, def.accent, 4, 140);
  }

  if (f.grounded && Math.abs(f.vx) > 250 && f.dust <= 0 && f.hitstun <= 0 && !f.attack && !f.dodge) {
    burst(sparks, f.x - f.facing * 8, f.y, '#C4896A', 1, 70);
    f.dust = 0.07;
  }

  f.vx = clamp(f.vx, -1700, 1700);
  f.vy = clamp(f.vy, -1700, MAX_FALL);
}

function beginAttack(f: Fighter, kind: AttackKind, charge: number): void {
  f.attack = { kind, t: 0, hit: false, charge };
  f.jumpCut = false;
  if (kind === 'upSpecial') {
    const launch = RECOVERY_LAUNCH[f.id];
    f.vy = launch.vy;
    f.vx = f.facing * launch.vx;
    f.recoveryUsed = true;
    f.jumpsLeft = 0;
    f.grounded = false;
    f.freefall = false;
    return;
  }
  if (f.grounded) f.vx *= 0.35;
}

function beginDodge(f: Fighter, intent: Intent): void {
  if (f.grounded) {
    if (intent.x === 0 || intent.y > 0) {
      f.dodge = { kind: 'spot', t: 0, dir: 0 };
      f.vx = 0;
      return;
    }
    f.dodge = { kind: 'roll', t: 0, dir: intent.x };
    f.facing = intent.x;
    return;
  }
  const dirX = intent.x;
  const dirY = intent.y;
  f.dodge = { kind: 'air', t: 0, dir: dirX === 0 ? f.facing : dirX };
  const speed = DODGE.air.speed;
  if (dirX === 0 && dirY === 0) {
    f.vx *= 0.25;
    f.vy = Math.min(f.vy, 40);
  } else {
    const len = Math.hypot(dirX, dirY);
    f.vx = (dirX / len) * speed;
    f.vy = (dirY / len) * speed;
  }
}

function tickDodge(f: Fighter, dt: number): void {
  if (!f.dodge) return;
  f.dodge.t += dt;
  const spec = DODGE[f.dodge.kind];
  const t = f.dodge.t;
  if (t >= spec.startup && t < spec.startup + spec.active) {
    f.intangible = Math.max(f.intangible, 0.08);
  }
  if (f.dodge.kind === 'roll' && f.grounded && t < spec.startup + spec.active + spec.recovery) {
    f.vx = f.dodge.dir * spec.speed;
    f.vy = 0;
  }
  if (t >= spec.startup + spec.active + spec.recovery) {
    if (f.dodge.kind === 'air') f.freefall = true;
    f.dodge = null;
  }
}
