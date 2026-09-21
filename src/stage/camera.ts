// Lane: stage. Follow both fighters and keep the flat slab readable.
// Rest framing still shows the whole ground, the air above it, and the pit rim.
// During a fight the view springs toward their midpoint, stays quiet inside a
// soft deadzone, leads a little along velocity, and eases outward as someone
// nears a blast line so the fall stays on screen. It does not crop the slab
// into a corridor, and it does not pull back so far that bodies turn into specks.

import type { Camera, Fighter } from '../game/types.ts';
import { clamp } from '../game/math.ts';
import { BLAST, PLATFORM, REF_FIGHTER_HEIGHT, VIEW } from './layout.ts';

const SLAB_MID_X = (PLATFORM.left + PLATFORM.right) / 2;

/**
 * Zoom 1 is the readable rest frame: y = 380 puts the view from y=20 to y=740.
 * Air above the slab is well past 1.5 fighter-heights, and the pit rim stays on screen.
 * Larger zoom shows more world (the view scales by 1/zoom). Never go below 1.
 */
export const REST_CAMERA: Camera = { x: SLAB_MID_X, y: 380, zoom: 1 };

/** World-units per screen. 1 is rest. Above 1 eases out. */
export const MIN_ZOOM = 1;
/** Far enough to show a blast approach, still large enough that fighters stay readable. */
export const MAX_ZOOM = 1.28;

const APPROACH = 150;
const THREAT_PULL = 0.52;
const LEAD_X_TIME = 0.08;
const LEAD_X_MAX = 100;
const FALL_LEAD_TIME = 0.045;
const FALL_LEAD_MAX = 70;
const X_DEAD = 88;
const Y_DEAD = 68;
const Z_DEAD = 0.02;
const POS_OMEGA = 6.1;
const POS_ZETA = 0.8;
const ZOOM_OMEGA = 3.7;
const ZOOM_ZETA = 0.96;
/** Horizon sits this far down the view at rest (slab top). */
const HORIZON_REST = 0.6916667;
/** Deepest the ground line may rise while a fall is on screen. */
const HORIZON_OPEN = 0.34;
const HORIZON_HIGH = 0.76;

interface Focus {
  x: number;
  bodyY: number;
  threat: number;
  pit: number;
}

export function desiredCamera(fighters: readonly Fighter[]): Camera {
  const visible = fighters.filter((fighter) => !fighter.out);
  if (visible.length === 0) return { ...REST_CAMERA };

  const foci = visible.map(focusOf);
  const threat = Math.max(...foci.map((focus) => focus.threat));
  const zoom = clamp(1 + threat * (MAX_ZOOM - MIN_ZOOM), MIN_ZOOM, MAX_ZOOM);

  let x = foci.reduce((sum, focus) => sum + focus.x, 0) / foci.length;
  if (foci.length >= 2) {
    let far = foci[0];
    for (const focus of foci) {
      if (focus.threat > far.threat) far = focus;
    }
    const nearThreat = foci.reduce((min, focus) => Math.min(min, focus.threat), far.threat);
    const pull = Math.min(1, far.threat - nearThreat) * THREAT_PULL;
    x += (far.x - x) * pull;
  }
  x = clampSlabX(x, zoom);

  const pit = Math.max(...foci.map((focus) => focus.pit));
  let y = REST_CAMERA.y;
  if (pit > 0) {
    const fraction = HORIZON_REST + (HORIZON_OPEN - HORIZON_REST) * pit;
    y = yForFraction(zoom, fraction);
  } else {
    const highest = Math.min(...foci.map((focus) => focus.bodyY));
    const air = PLATFORM.top - highest;
    const rise = clamp((air - REF_FIGHTER_HEIGHT * 1.35) / (REF_FIGHTER_HEIGHT * 3.2), 0, 1);
    y -= 26 * rise;
  }
  y = clampHorizon(y, zoom);

  return { x, y, zoom };
}

/** Spring the live camera toward `desiredCamera`. One frame never snaps. */
export function stepCamera(camera: Camera, fighters: readonly Fighter[], dt: number): void {
  const step = Math.min(Math.max(dt, 0), 0.05);
  if (step === 0) return;

  const target = desiredCamera(fighters);
  const sprungX = spring(
    camera.x,
    finite(camera.vx),
    camera.x + softPull(target.x - camera.x, X_DEAD),
    POS_OMEGA,
    POS_ZETA,
    step,
  );
  const sprungY = spring(
    camera.y,
    finite(camera.vy),
    camera.y + softPull(target.y - camera.y, Y_DEAD),
    POS_OMEGA,
    POS_ZETA,
    step,
  );
  const sprungZ = spring(
    camera.zoom,
    finite(camera.vz),
    camera.zoom + softPull(target.zoom - camera.zoom, Z_DEAD),
    ZOOM_OMEGA,
    ZOOM_ZETA,
    step,
  );

  const zoom = clamp(sprungZ.pos, MIN_ZOOM, MAX_ZOOM);
  camera.zoom = zoom;
  camera.vz = zoom === sprungZ.pos ? sprungZ.vel : 0;

  const x = clampSlabX(sprungX.pos, zoom);
  camera.x = x;
  camera.vx = x === sprungX.pos ? sprungX.vel : 0;

  const y = clampHorizon(sprungY.pos, zoom);
  camera.y = y;
  camera.vy = y === sprungY.pos ? sprungY.vel : 0;
}

function focusOf(fighter: Fighter): Focus {
  const leadX = clamp(fighter.vx * LEAD_X_TIME, -LEAD_X_MAX, LEAD_X_MAX);
  const fallLead = clamp(Math.max(fighter.vy, 0) * FALL_LEAD_TIME, 0, FALL_LEAD_MAX);
  const side = sideThreat(fighter.x);
  const pit = Math.max(pitThreat(fighter.y), pitThreat(fighter.y + fallLead));
  return {
    x: fighter.x + leadX,
    bodyY: fighter.y,
    threat: Math.max(side, pit),
    pit,
  };
}

function sideThreat(x: number): number {
  const leftStart = PLATFORM.left + APPROACH;
  if (x < leftStart) return clamp((leftStart - x) / (leftStart - BLAST.left), 0, 1);
  const rightStart = PLATFORM.right - APPROACH;
  if (x > rightStart) return clamp((x - rightStart) / (BLAST.right - rightStart), 0, 1);
  return 0;
}

function pitThreat(y: number): number {
  if (y <= PLATFORM.top) return 0;
  return clamp((y - PLATFORM.top) / (BLAST.bottom - PLATFORM.top), 0, 1);
}

function yForFraction(zoom: number, fraction: number): number {
  const half = (VIEW.h * zoom) / 2;
  return PLATFORM.top + half - fraction * VIEW.h * zoom;
}

function clampSlabX(x: number, zoom: number): number {
  const half = (VIEW.w * zoom) / 2;
  const lo = PLATFORM.right - half;
  const hi = PLATFORM.left + half;
  if (lo > hi) return SLAB_MID_X;
  return clamp(x, lo, hi);
}

function clampHorizon(y: number, zoom: number): number {
  const half = (VIEW.h * zoom) / 2;
  const viewH = VIEW.h * zoom;
  const lookUp = PLATFORM.top + half - HORIZON_HIGH * viewH;
  const lookDown = PLATFORM.top + half - HORIZON_OPEN * viewH;
  return clamp(y, Math.min(lookUp, lookDown), Math.max(lookUp, lookDown));
}

/** Flat near zero, full chase once the error leaves the deadzone. */
function softPull(delta: number, radius: number): number {
  if (radius <= 0) return delta;
  const t = Math.abs(delta) / radius;
  const gain = 1 - Math.exp(-t * t * 1.45);
  return delta * gain;
}

function spring(
  pos: number,
  vel: number,
  target: number,
  omega: number,
  zeta: number,
  dt: number,
): { pos: number; vel: number } {
  const accel = omega * omega * (target - pos) - 2 * zeta * omega * vel;
  const nextVel = vel + accel * dt;
  const nextPos = pos + nextVel * dt;
  return { pos: nextPos, vel: nextVel };
}

function finite(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
