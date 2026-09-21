// Dario art kit. Stylized lab fighter — geometry only, no portrait, no marks.
// Colors come from art/palette.ts (the one-pager lock). Slate is the body.
// Mint is accent only: the shared nameplate, a flash on the safety wall,
// a palm ripple, and a ground ring. The wall is a plain vertical slab.

import { FIGHTERS, STAGE } from '../../art/palette.ts';
import { nameplateRects, paintNameplate } from '../../art/nameplates.ts';

const DARIO = FIGHTERS.dario;

export const DARIO_PALETTE = {
  sweater: DARIO.body,
  cream: DARIO.cloth,
  hair: DARIO.hair,
  glasses: DARIO.glasses ?? DARIO.body,
  mint: DARIO.accent,
  /** Shadow of the sweater, same hue, so the body stays slate. */
  slateShade: '#2c3546',
  skin: '#f3d0b4',
  shoe: '#171b24',
  lens: '#232a36',
  outline: '#14181f',
  /** Dark edge so mint strokes stay readable on the sky haze. Not a fill. */
  mintInk: '#0e5a3c',
} as const;

export type DarioPose =
  | 'idle'
  | 'walkA'
  | 'walkB'
  | 'jump'
  | 'smashWindup'
  | 'smashActive'
  | 'aerial'
  | 'ko'
  | 'downSmash'
  | 'upSmash';

type Hand = 'hang' | 'check' | 'down' | 'up';
type Fx = 'none' | 'ripple' | 'pulse' | 'shield';

interface Ang {
  ang: number;
  bend: number;
  hand: Hand;
  toe: number;
}

interface Kin {
  lean: number;
  ox: number;
  oy: number;
  hipY: number;
  shoulderY: number;
  headTop: number;
  thigh: number;
  shin: number;
  upper: number;
  fore: number;
  back: Ang;
  front: Ang;
  fx: Fx;
  fxPower: number;
  /** Where the forward palm sits, in body space, for the ripple. */
  palm: { x: number; y: number } | null;
}

type Edge = 'body' | 'frame' | 'mint' | 'bare' | 'line';

interface LineStamp {
  kind: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  w: number;
  fill: string;
  edge: Edge;
  mass: boolean;
}

interface PathStamp {
  kind: 'path';
  d: string;
  fill: string;
  edge: Edge;
  mass: boolean;
  alpha: number;
  sw: number;
}

interface EllStamp {
  kind: 'ell';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rot: number;
  fill: string;
  edge: Edge;
  mass: boolean;
  alpha: number;
}

type Stamp = LineStamp | PathStamp | EllStamp;

interface Fig {
  kin: Kin;
  world: Stamp[];
  body: Stamp[];
}

const P = DARIO_PALETTE;
/** Shared plate, scaled so it sits over the head without covering the slab. */
const PLATE_SCALE = 0.62;
const PLATE_LIFT = 176;

const FORWARD = Math.PI / 2;

function num(n: number): string {
  const v = Math.round(n * 10) / 10;
  return Object.is(v, -0) ? '0' : String(v);
}

function tip(x: number, y: number, ang: number, len: number): [number, number] {
  return [x + Math.sin(ang) * len, y + Math.cos(ang) * len];
}

function sweaterPath(): string {
  // Round shoulders, softer hem. Wider up top than a stuck-on circle.
  return [
    'M -14 -40',
    'C -26 -46 -30 -60 -24 -74',
    'C -18 -86 -8 -88 0 -86',
    'C 8 -88 20 -84 24 -72',
    'C 30 -58 26 -44 14 -38',
    'C 4 -32 -4 -32 -14 -40',
    'Z',
  ].join(' ');
}

function rr(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  const x2 = x + w;
  const y2 = y + h;
  return [
    `M ${num(x + radius)} ${num(y)}`,
    `H ${num(x2 - radius)}`,
    `A ${num(radius)} ${num(radius)} 0 0 1 ${num(x2)} ${num(y + radius)}`,
    `V ${num(y2 - radius)}`,
    `A ${num(radius)} ${num(radius)} 0 0 1 ${num(x2 - radius)} ${num(y2)}`,
    `H ${num(x + radius)}`,
    `A ${num(radius)} ${num(radius)} 0 0 1 ${num(x)} ${num(y2 - radius)}`,
    `V ${num(y + radius)}`,
    `A ${num(radius)} ${num(radius)} 0 0 1 ${num(x + radius)} ${num(y)}`,
    'Z',
  ].join(' ');
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const delta = a1 - a0;
  const large = Math.abs(delta) > Math.PI ? 1 : 0;
  const sweep = delta > 0 ? 1 : 0;
  return `M ${num(x0)} ${num(y0)} A ${num(r)} ${num(r)} 0 ${large} ${sweep} ${num(x1)} ${num(y1)}`;
}

function limb(ang: number, bend: number, hand: Hand, toe: number): Ang {
  return { ang, bend, hand, toe };
}

function baseKin(): Kin {
  return {
    lean: 0,
    ox: 0,
    oy: 0,
    hipY: -36,
    shoulderY: -74,
    headTop: -118,
    thigh: 16,
    shin: 15,
    upper: 16,
    fore: 14,
    back: limb(-0.22, 0.28, 'hang', FORWARD),
    front: limb(0.18, 0.22, 'hang', FORWARD),
    fx: 'none',
    fxPower: 0,
    palm: null,
  };
}

function kinematics(pose: DarioPose, fx: number, spin: number): Kin {
  const k = baseKin();
  const power = Math.max(0, Math.min(1, fx));
  if (pose === 'walkA') return walk(k, 'A');
  if (pose === 'walkB') return walk(k, 'B');
  if (pose === 'jump') return jumpKin(k);
  if (pose === 'smashWindup') return windup(k, power);
  if (pose === 'smashActive') return active(k, power);
  if (pose === 'aerial') return aerial(k, power);
  if (pose === 'ko') return tumble(k, spin);
  if (pose === 'downSmash') return containment(k, power);
  if (pose === 'upSmash') return lift(k, power);
  return k;
}

function walk(k: Kin, step: 'A' | 'B'): Kin {
  k.oy = step === 'A' ? -1 : -3;
  k.lean = step === 'A' ? 0.08 : 0.02;
  if (step === 'A') {
    k.back = limb(-0.75, 0.2, 'hang', FORWARD);
    k.front = limb(0.9, -0.45, 'hang', FORWARD);
  } else {
    k.back = limb(1.05, -0.5, 'hang', FORWARD);
    k.front = limb(-0.85, 0.28, 'hang', FORWARD);
  }
  return k;
}

function jumpKin(k: Kin): Kin {
  k.oy = -10;
  k.lean = -0.06;
  k.thigh = 15;
  k.shin = 13;
  k.back = limb(-1.25, 1.25, 'hang', -0.4);
  k.front = limb(1.15, -1.35, 'hang', 0.5);
  return k;
}

function windup(k: Kin, power: number): Kin {
  k.lean = -0.16;
  k.ox = -2;
  k.back = limb(-0.35, 0.15, 'hang', FORWARD);
  k.front = limb(0.45, -0.2, 'hang', FORWARD);
  k.fxPower = power;
  return k;
}

function active(k: Kin, power: number): Kin {
  k.lean = 0.1;
  k.ox = 2;
  k.upper = 17;
  k.fore = 16;
  k.back = limb(-0.4, 0.1, 'hang', FORWARD);
  k.front = limb(0.28, -0.05, 'check', FORWARD);
  k.fx = 'ripple';
  k.fxPower = power;
  return k;
}

function aerial(k: Kin, power: number): Kin {
  k.oy = -6;
  k.lean = 0.42;
  k.thigh = 15;
  k.shin = 14;
  k.upper = 16;
  k.fore = 15;
  k.back = limb(-1.35, 0.85, 'hang', -1.1);
  k.front = limb(-0.85, 0.45, 'check', -0.7);
  k.fx = 'ripple';
  k.fxPower = Math.max(0.35, power);
  return k;
}

function tumble(k: Kin, spin: number): Kin {
  const w = Math.sin(spin * 8);
  k.lean = 0.95 + w * 0.28;
  k.oy = -4;
  k.thigh = 16;
  k.shin = 15;
  k.back = limb(-1.7 + w * 0.2, 0.4, 'hang', -1.5);
  k.front = limb(1.45 - w * 0.15, -0.3, 'hang', 1.3);
  k.fx = 'none';
  return k;
}

function containment(k: Kin, power: number): Kin {
  k.oy = 12;
  k.lean = 0.04;
  k.thigh = 14;
  k.shin = 13;
  k.back = limb(-0.95, 1.05, 'down', -0.2);
  k.front = limb(0.95, -1.15, 'down', 0.2);
  k.fx = 'pulse';
  k.fxPower = power;
  return k;
}

function lift(k: Kin, power: number): Kin {
  // Planted, slightly back. The wall goes up; the body stays heavy.
  k.lean = -0.06;
  k.oy = 0;
  k.upper = 20;
  k.fore = 16;
  k.back = limb(-0.22, 0.08, 'hang', FORWARD);
  k.front = limb(0.2, -0.06, 'hang', FORWARD);
  k.fx = 'shield';
  k.fxPower = power;
  return k;
}

// The Ang bundle above doubled as both limbs and got messy for walk arms.
// Arm angles live here so legs and arms can disagree.

interface Arms {
  backAng: number;
  backBend: number;
  frontAng: number;
  frontBend: number;
  frontHand: Hand;
  backHand: Hand;
}

function armsFor(pose: DarioPose, spin: number): Arms {
  const w = Math.sin(spin * 8);
  switch (pose) {
    case 'walkA':
      return { backAng: 0.72, backBend: 0.12, frontAng: -0.78, frontBend: 0.35, frontHand: 'hang', backHand: 'hang' };
    case 'walkB':
      return { backAng: -0.7, backBend: 0.18, frontAng: 0.74, frontBend: 0.12, frontHand: 'hang', backHand: 'hang' };
    case 'jump':
      return { backAng: -0.9, backBend: 0.3, frontAng: 0.85, frontBend: 0.25, frontHand: 'hang', backHand: 'hang' };
    case 'smashWindup':
      return { backAng: -0.85, backBend: 0.2, frontAng: 0.35, frontBend: -2.15, frontHand: 'check', backHand: 'hang' };
    case 'smashActive':
      return { backAng: -0.7, backBend: 0.15, frontAng: 1.28, frontBend: 0.12, frontHand: 'check', backHand: 'hang' };
    case 'aerial':
      return { backAng: -1.1, backBend: 0.4, frontAng: 1.12, frontBend: 0.18, frontHand: 'check', backHand: 'hang' };
    case 'ko':
      return {
        backAng: -2.2 + w * 0.3,
        backBend: 0.4,
        frontAng: 2.15 - w * 0.25,
        frontBend: -0.2,
        frontHand: 'hang',
        backHand: 'hang',
      };
    case 'downSmash':
      return { backAng: -0.28, backBend: 0.16, frontAng: 0.28, frontBend: 0.16, frontHand: 'down', backHand: 'down' };
    case 'upSmash':
      return { backAng: -2.95, backBend: 0.08, frontAng: 2.95, frontBend: 0.08, frontHand: 'up', backHand: 'up' };
    default:
      return { backAng: -0.28, backBend: 0.3, frontAng: 0.22, frontBend: 0.24, frontHand: 'hang', backHand: 'hang' };
  }
}

function bone(x: number, y: number, ang: number, len: number, bend: number, len2: number): [number, number, number, number] {
  const [mx, my] = tip(x, y, ang, len);
  const [ex, ey] = tip(mx, my, ang + bend, len2);
  return [mx, my, ex, ey];
}

function resolveFill(fill: string, flash: boolean): string {
  if (!flash) return fill;
  if (fill === P.glasses || fill === P.lens || fill === P.mint || fill === P.mintInk) return fill;
  return '#f7f3ec';
}

function lineStamp(x1: number, y1: number, x2: number, y2: number, w: number, fill: string, edge: Edge, mass: boolean): LineStamp {
  return { kind: 'line', x1, y1, x2, y2, w, fill, edge, mass };
}

function pathStamp(d: string, fill: string, edge: Edge, mass: boolean, alpha = 1, sw = 3.5): PathStamp {
  return { kind: 'path', d, fill, edge, mass, alpha, sw };
}

function ellStamp(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string,
  edge: Edge,
  mass: boolean,
  rot = 0,
  alpha = 1,
): EllStamp {
  return { kind: 'ell', cx, cy, rx, ry, rot, fill, edge, mass, alpha };
}

export function darioFig(pose: DarioPose, fx = 1, spin = 0): Fig {
  const kin = kinematics(pose, fx, spin);
  const arms = armsFor(pose, spin);
  const body: Stamp[] = [];
  const world: Stamp[] = [];
  const hipY = kin.hipY;
  const shY = kin.shoulderY;

  const backHipX = -6;
  const frontHipX = 6;
  const [, , backFootX, backFootY] = bone(backHipX, hipY, kin.back.ang, kin.thigh, kin.back.bend, kin.shin);
  const [, , frontFootX, frontFootY] = bone(frontHipX, hipY, kin.front.ang, kin.thigh, kin.front.bend, kin.shin);
  const [backKneeX, backKneeY] = tip(backHipX, hipY, kin.back.ang, kin.thigh);
  const [frontKneeX, frontKneeY] = tip(frontHipX, hipY, kin.front.ang, kin.thigh);

  const backShX = -15;
  const frontShX = 15;
  const [backElbX, backElbY, backHandX, backHandY] = bone(backShX, shY, arms.backAng, kin.upper, arms.backBend, kin.fore);
  const [frontElbX, frontElbY, frontHandX, frontHandY] = bone(frontShX, shY, arms.frontAng, kin.upper, arms.frontBend, kin.fore);

  // Ground pulse sits in world space so a lean cannot tip it.
  if (kin.fx === 'pulse') {
    const spread = 20 + kin.fxPower * 18;
    world.push(ellStamp(0, 1, spread, 8, P.mint, 'line', false));
    world.push(ellStamp(0, 1, spread * 0.62, 5, P.mint, 'line', false));
  }

  // Back leg, back arm.
  pushLeg(body, backHipX, hipY, backKneeX, backKneeY, backFootX, backFootY, kin.back.toe);
  pushArm(body, backShX, shY, backElbX, backElbY, backHandX, backHandY, arms.backHand, false);

  // Cream hem sits under a soft-shouldered sweater. Slate is the mass.
  body.push(pathStamp(rr(-11, -44, 22, 10, 4), P.cream, 'body', true));
  body.push(pathStamp(sweaterPath(), P.sweater, 'body', true));
  body.push(pathStamp(rr(3, -62, 11, 9, 3), P.slateShade, 'body', false));
  body.push(pathStamp('M -5 -78 L 0 -66 L 5 -78 Z', P.cream, 'body', false));

  pushLeg(body, frontHipX, hipY, frontKneeX, frontKneeY, frontFootX, frontFootY, kin.front.toe);

  // Ripple behind the palm so the hand stays the readable mass.
  if (kin.fx === 'ripple') {
    const px = frontHandX + 8;
    const py = frontHandY;
    const reach = 12 + kin.fxPower * 18;
    body.push(pathStamp(arcPath(px, py, reach, -1.05, 1.05), P.mint, 'line', false, 1, 3.5));
    body.push(pathStamp(arcPath(px, py, reach + 12, -0.9, 0.9), P.mint, 'line', false, 1, 2.5));
  }

  if (kin.fx === 'shield') pushSafetyWall(body, kin.headTop, kin.fxPower);

  pushArm(body, frontShX, shY, frontElbX, frontElbY, frontHandX, frontHandY, arms.frontHand, true);

  // Tall head, hair only on the crown-back so the forehead stays a skin plane.
  const headTop = kin.headTop;
  body.push(pathStamp(rr(-14, headTop, 28, 46, 12), P.skin, 'body', true));
  body.push(pathStamp(rr(-16, headTop - 2, 16, 20, 8), P.hair, 'body', true));

  // Glasses wider than the skull. Temples are the silhouette bump.
  body.push(pathStamp(rr(-23, headTop + 24, 17, 13, 4), P.lens, 'frame', true, 1, 4));
  body.push(pathStamp(rr(6, headTop + 24, 17, 13, 4), P.lens, 'frame', true, 1, 4));
  body.push(pathStamp(rr(-6, headTop + 28, 12, 4, 2), P.glasses, 'frame', true));
  body.push(lineStamp(-23, headTop + 30, -30, headTop + 31, 4, P.glasses, 'frame', true));
  body.push(lineStamp(23, headTop + 30, 30, headTop + 31, 4, P.glasses, 'frame', true));
  body.push(pathStamp(rr(-20, headTop + 26, 4, 3, 1), P.cream, 'bare', false));
  body.push(pathStamp(rr(9, headTop + 26, 4, 3, 1), P.cream, 'bare', false));

  return { kin, world, body };
}

/** Vertical anti-air wall. Slate is the slab. Mint is a short flash along the top. */
function pushSafetyWall(body: Stamp[], headTop: number, power: number): void {
  const top = headTop - 70;
  const w = 52;
  const h = 86;
  const x = -w / 2;
  body.push(pathStamp(rr(x, top, w, h, 5), P.sweater, 'body', true));
  const flash = 0.45 + Math.max(0, Math.min(1, power)) * 0.55;
  body.push(pathStamp(rr(x + 8, top + 8, w - 16, 7, 2), P.mint, 'bare', false, flash));
}

function pushLeg(
  body: Stamp[],
  hx: number,
  hy: number,
  kx: number,
  ky: number,
  fx: number,
  fy: number,
  toe: number,
): void {
  body.push(lineStamp(hx, hy, kx, ky, 13, P.sweater, 'body', true));
  body.push(lineStamp(kx, ky, fx, fy, 11, P.sweater, 'body', true));
  const [tx, ty] = tip(fx, fy, toe, 13);
  body.push(lineStamp(fx, fy, tx, ty, 7, P.shoe, 'body', true));
}

function pushArm(
  body: Stamp[],
  sx: number,
  sy: number,
  ex: number,
  ey: number,
  hx: number,
  hy: number,
  hand: Hand,
  front: boolean,
): void {
  body.push(lineStamp(sx, sy, ex, ey, front ? 12 : 11, P.sweater, 'body', true));
  body.push(lineStamp(ex, ey, hx, hy, front ? 10 : 9, P.sweater, 'body', true));
  const [cx, cy] = tip(ex, ey, Math.atan2(hx - ex, hy - ey), Math.hypot(hx - ex, hy - ey) * 0.72);
  // atan2(dx, dy) matches tip()'s angle convention (0 = down).
  body.push(lineStamp(cx, cy, hx, hy, front ? 11 : 10, P.cream, 'body', false));

  if (hand === 'check') {
    body.push(pathStamp(rr(hx - 2, hy - 11, 14, 22, 5), P.skin, 'body', true));
    return;
  }
  if (hand === 'down') {
    body.push(pathStamp(rr(hx - 10, hy - 2, 20, 11, 4), P.skin, 'body', true));
    return;
  }
  if (hand === 'up') {
    body.push(ellStamp(hx, hy, 6, 6, P.skin, 'body', true));
    return;
  }
  body.push(ellStamp(hx, hy, 5, 5, P.skin, 'body', true));
}

function paintLine(
  ctx: CanvasRenderingContext2D,
  s: LineStamp,
  rim: string | null,
  silhouette: boolean,
  flash: boolean,
): void {
  const draw = (width: number, color: string) => {
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
    ctx.lineCap = 'round';
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
  };
  const fill = silhouette ? '#111318' : resolveFill(s.fill, flash);
  if (silhouette) {
    draw(s.w + 6, '#111318');
    draw(s.w, '#111318');
    return;
  }
  if (s.edge === 'body' && rim) draw(s.w + 6, rim);
  if (s.edge === 'frame') {
    draw(s.w + 2, P.outline);
    draw(s.w, P.glasses);
    return;
  }
  if (s.edge === 'bare') {
    draw(s.w, fill);
    return;
  }
  draw(s.w + 3, P.outline);
  draw(s.w, fill);
}

function paintShape(
  ctx: CanvasRenderingContext2D,
  s: PathStamp | EllStamp,
  rim: string | null,
  silhouette: boolean,
  flash: boolean,
): void {
  const run = (fn: (path: Path2D | null) => void) => {
    if (s.kind === 'ell') {
      ctx.beginPath();
      ctx.ellipse(s.cx, s.cy, s.rx, s.ry, s.rot, 0, Math.PI * 2);
      fn(null);
      return;
    }
    fn(new Path2D(s.d));
  };
  const stroke = (path: Path2D | null, width: number, color: string) => {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    if (path) ctx.stroke(path);
    else ctx.stroke();
  };
  const fillPath = (path: Path2D | null, color: string, alpha: number) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    if (path) ctx.fill(path);
    else ctx.fill();
    ctx.globalAlpha = 1;
  };

  if (s.edge === 'line') {
    run((path) => {
      stroke(path, s.kind === 'path' ? s.sw + 2.5 : 4, P.mintInk);
      stroke(path, s.kind === 'path' ? s.sw : 2.5, P.mint);
    });
    return;
  }

  const fill = silhouette ? '#111318' : resolveFill(s.fill, flash);
  if (silhouette) {
    if (!s.mass) return;
    run((path) => {
      stroke(path, 7, '#111318');
      fillPath(path, '#111318', 1);
    });
    return;
  }

  if (s.edge === 'bare') {
    run((path) => fillPath(path, fill, s.kind === 'ell' ? s.alpha : s.alpha));
    return;
  }

  if (s.edge === 'frame') {
    run((path) => {
      stroke(path, s.kind === 'path' ? s.sw + 1.5 : 4, P.outline);
      stroke(path, s.kind === 'path' ? s.sw : 3, P.glasses);
      fillPath(path, s.fill === P.glasses ? P.glasses : P.lens, 1);
    });
    return;
  }

  if (s.edge === 'mint') {
    run((path) => {
      stroke(path, 6.5, P.mintInk);
      stroke(path, 3.5, P.mint);
      fillPath(path, fill, 1);
    });
    return;
  }

  run((path) => {
    if (rim) stroke(path, 6, rim);
    stroke(path, 3.5, P.outline);
    fillPath(path, fill, 1);
  });
}

function paintStamp(
  ctx: CanvasRenderingContext2D,
  s: Stamp,
  rim: string | null,
  silhouette: boolean,
  flash: boolean,
): void {
  if (silhouette && !s.mass) return;
  if (s.kind === 'line') paintLine(ctx, s, rim, silhouette, flash);
  else paintShape(ctx, s, rim, silhouette, flash);
}

export function drawDarioArt(
  ctx: CanvasRenderingContext2D,
  pose: DarioPose,
  opts: { rim: string; flash: boolean; fx: number; spin: number },
): void {
  const fig = darioFig(pose, opts.fx, opts.spin);
  const { kin } = fig;
  ctx.save();
  ctx.translate(kin.ox, kin.oy);
  for (const s of fig.world) paintStamp(ctx, s, opts.rim, false, opts.flash);
  ctx.translate(0, kin.hipY);
  ctx.rotate(kin.lean);
  ctx.translate(0, -kin.hipY);
  for (const s of fig.body) paintStamp(ctx, s, opts.rim, false, opts.flash);
  ctx.restore();
}

export function drawDarioNameplate(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y - PLATE_LIFT);
  ctx.scale(PLATE_SCALE, PLATE_SCALE);
  paintNameplate(ctx, 'dario', 0, 0);
  ctx.restore();
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function stampSvg(s: Stamp, silhouette: boolean, rim: string | null): string {
  if (silhouette && !s.mass) return '';
  if (s.kind === 'line') {
    const color = silhouette ? '#111318' : s.fill;
    const attrs = `x1="${num(s.x1)}" y1="${num(s.y1)}" x2="${num(s.x2)}" y2="${num(s.y2)}" stroke-linecap="round" fill="none"`;
    if (silhouette) {
      return `<line ${attrs} stroke="#111318" stroke-width="${num(s.w + 6)}"/><line ${attrs} stroke="#111318" stroke-width="${num(s.w)}"/>`;
    }
    if (s.edge === 'frame') {
      return `<line ${attrs} stroke="${P.outline}" stroke-width="${num(s.w + 2)}"/><line ${attrs} stroke="${P.glasses}" stroke-width="${num(s.w)}"/>`;
    }
    if (s.edge === 'bare') return `<line ${attrs} stroke="${color}" stroke-width="${num(s.w)}"/>`;
    const halo = s.edge === 'body' && rim ? `<line ${attrs} stroke="${rim}" stroke-width="${num(s.w + 6)}"/>` : '';
    return `${halo}<line ${attrs} stroke="${P.outline}" stroke-width="${num(s.w + 3)}"/><line ${attrs} stroke="${color}" stroke-width="${num(s.w)}"/>`;
  }
  if (s.edge === 'line' && s.kind === 'path') {
    return `<path d="${s.d}" fill="none" stroke="${P.mintInk}" stroke-width="${num(s.sw + 2.5)}" stroke-linecap="round"/><path d="${s.d}" fill="none" stroke="${P.mint}" stroke-width="${num(s.sw)}" stroke-linecap="round"/>`;
  }
  if (s.edge === 'line' && s.kind === 'ell') {
    const ell = `cx="${num(s.cx)}" cy="${num(s.cy)}" rx="${num(s.rx)}" ry="${num(s.ry)}"`;
    return `<ellipse ${ell} fill="none" stroke="${P.mintInk}" stroke-width="4.5"/><ellipse ${ell} fill="none" stroke="${P.mint}" stroke-width="2.5"/>`;
  }
  const geom =
    s.kind === 'ell'
      ? `<ellipse cx="${num(s.cx)}" cy="${num(s.cy)}" rx="${num(s.rx)}" ry="${num(s.ry)}" ${s.rot ? `transform="rotate(${num((s.rot * 180) / Math.PI)} ${num(s.cx)} ${num(s.cy)})"` : ''}`
      : `<path d="${s.d}"`;
  const close = s.kind === 'ell' ? '/>' : '/>';
  if (silhouette) {
    const sil =
      s.kind === 'ell'
        ? `${geom} fill="#111318" stroke="#111318" stroke-width="7"${close}`
        : `<path d="${s.d}" fill="#111318" stroke="#111318" stroke-width="7" stroke-linejoin="round"/>`;
    return sil;
  }
  if (s.edge === 'bare') {
    const opacity = s.alpha < 1 ? ` opacity="${num(s.alpha)}"` : '';
    if (s.kind === 'ell') return `${geom} fill="${s.fill}" stroke="none"${opacity}${close}`;
    return `<path d="${s.d}" fill="${s.fill}" stroke="none"${opacity}/>`;
  }
  if (s.edge === 'frame') {
    const sw = s.kind === 'path' ? s.sw : 3.5;
    if (s.kind === 'ell') {
      return `${geom} fill="${P.lens}" stroke="${P.outline}" stroke-width="${num(sw + 1.5)}"${close}${geom} fill="${P.lens}" stroke="${P.glasses}" stroke-width="${num(sw)}"${close}`;
    }
    return `<path d="${s.d}" fill="${s.fill === P.glasses ? P.glasses : P.lens}" stroke="${P.outline}" stroke-width="${num(sw + 1.5)}" stroke-linejoin="round"/><path d="${s.d}" fill="none" stroke="${P.glasses}" stroke-width="${num(sw)}" stroke-linejoin="round"/>`;
  }
  if (s.edge === 'mint') {
    if (s.kind === 'path') {
      return `<path d="${s.d}" fill="${s.fill}" stroke="${P.mintInk}" stroke-width="6.5" stroke-linejoin="round"/><path d="${s.d}" fill="none" stroke="${P.mint}" stroke-width="3.5" stroke-linejoin="round"/>`;
    }
  }
  const halo =
    rim && s.kind === 'path'
      ? `<path d="${s.d}" fill="none" stroke="${rim}" stroke-width="6" stroke-linejoin="round"/>`
      : rim && s.kind === 'ell'
        ? `${geom} fill="none" stroke="${rim}" stroke-width="6"${close}`
        : '';
  if (s.kind === 'ell') {
    return `${halo}${geom} fill="${s.fill}" stroke="${P.outline}" stroke-width="3.5"${close}`;
  }
  return `${halo}<path d="${s.d}" fill="${s.fill}" stroke="${P.outline}" stroke-width="3.5" stroke-linejoin="round"/>`;
}

function figureSvg(pose: DarioPose, x: number, y: number, mode: 'color' | 'silhouette', fx = 1, spin = 0): string {
  const fig = darioFig(pose, fx, spin);
  const rim = mode === 'color' ? '#F6E7D4' : null;
  const lean = (fig.kin.lean * 180) / Math.PI;
  const parts = [
    ...fig.world.map((s) => stampSvg(s, mode === 'silhouette', rim)),
    `<g transform="translate(0 ${num(fig.kin.hipY)}) rotate(${num(lean)}) translate(0 ${num(-fig.kin.hipY)})">`,
    ...fig.body.map((s) => stampSvg(s, mode === 'silhouette', rim)),
    '</g>',
  ];
  return `<g transform="translate(${num(x + fig.kin.ox)} ${num(y + fig.kin.oy)})">${parts.join('')}</g>`;
}

function label(x: number, y: number, text: string, fill: string, size = 14): string {
  const safe = escapeText(text);
  return `<text x="${num(x)}" y="${num(y)}" text-anchor="middle" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="${size}" font-weight="700" fill="${fill}" stroke="#14181f" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${safe}</text>`;
}

function nameplateSvg(x: number, y: number, scale = 1): string {
  const plate = nameplateRects('dario');
  const rects = plate.rects
    .map(
      (rect) =>
        `<rect x="${num(x + rect.x * scale)}" y="${num(y + rect.y * scale)}" width="${num(rect.w * scale)}" height="${num(rect.h * scale)}" fill="${rect.fill}"/>`,
    )
    .join('');
  return `<g shape-rendering="crispEdges">${rects}</g>`;
}

const SHEET: { pose: DarioPose; label: string; fx: number; spin: number }[] = [
  { pose: 'idle', label: 'idle', fx: 0, spin: 0 },
  { pose: 'walkA', label: 'walk', fx: 0, spin: 0 },
  { pose: 'walkB', label: 'walk', fx: 0, spin: 0 },
  { pose: 'jump', label: 'jump', fx: 0, spin: 0 },
  { pose: 'aerial', label: 'aerial', fx: 1, spin: 0 },
  { pose: 'smashWindup', label: 'palm wind-up', fx: 1, spin: 0 },
  { pose: 'smashActive', label: 'palm-check', fx: 1, spin: 0 },
  { pose: 'downSmash', label: 'containment', fx: 1, spin: 0 },
  { pose: 'upSmash', label: 'safety wall', fx: 1, spin: 0 },
  { pose: 'ko', label: 'tumble', fx: 0, spin: 0.7 },
];

function swatches(x: number, y: number): string {
  const items: [string, string][] = [
    ['sweater', P.sweater],
    ['cream', P.cream],
    ['hair', P.hair],
    ['glasses', P.glasses],
    ['mint', P.mint],
  ];
  return items
    .map(([name, color], i) => {
      const cx = x + i * 118;
      return `<rect x="${cx}" y="${y}" width="28" height="28" rx="4" fill="${color}" stroke="#14181f" stroke-width="2"/><text x="${cx + 36}" y="${y + 19}" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="13" font-weight="700" fill="#14181f">${name} ${color}</text>`;
    })
    .join('');
}

export function buildDarioSheets(): Record<string, string> {
  const cols = 5;
  const cellW = 210;
  const cellH = 250;
  const header = 118;
  const sheetW = cols * cellW + 40;
  const sheetH = header + 2 * cellH + 36;
  const cells = SHEET.map((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 30 + col * cellW + cellW / 2;
    const foot = header + row * cellH + 188;
    return [
      figureSvg(item.pose, x, foot, 'color', item.fx, item.spin),
      label(x, foot + 28, item.label, '#efe8dc', 15),
    ].join('');
  }).join('');

  const poses = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}" height="${sheetH}" viewBox="0 0 ${sheetW} ${sheetH}">
  <rect width="100%" height="100%" fill="${STAGE.ground.mid}"/>
  <text x="28" y="36" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="22" font-weight="700" fill="${STAGE.blast.void}">DARIO</text>
  <text x="118" y="36" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="16" font-weight="700" fill="${P.cream}">slate body · mint accent only</text>
  ${swatches(28, 52)}
  ${nameplateSvg(sheetW - 290, 22)}
  ${cells}
</svg>`;

  const silW = cols * cellW + 40;
  const silH = 78 + 2 * cellH + 2 * 210;
  const silCells = SHEET.map((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 30 + col * cellW + cellW / 2;
    const footCream = 70 + row * cellH + 188;
    const footRust = 70 + 2 * cellH + 40 + row * 200 + 150;
    return [
      figureSvg(item.pose, x, footCream, 'silhouette', item.fx, item.spin),
      label(x, footCream + 26, item.label, '#14181f', 14),
      figureSvg(item.pose, x, footRust, 'silhouette', item.fx, item.spin),
    ].join('');
  }).join('');
  const rustTop = 70 + 2 * cellH + 24;
  const silhouette = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${silW}" height="${silH}" viewBox="0 0 ${silW} ${silH}">
  <rect width="100%" height="${rustTop}" fill="${P.cream}"/>
  <rect y="${rustTop}" width="100%" height="${silH - rustTop}" fill="${STAGE.ground.mid}"/>
  <rect y="${rustTop}" width="100%" height="10" fill="${STAGE.ground.top}"/>
  <text x="28" y="40" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="22" font-weight="700" fill="#14181f">DARIO silhouette · game size, about 1/6 of 720</text>
  <text x="28" y="64" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="14" font-weight="700" fill="#3a4558">Tall forehead, glasses wider than the skull, round shoulders, short legs. Bottom row sits on rust.</text>
  ${silCells}
</svg>`;

  const marsW = 1280;
  const marsH = 720;
  const row1 = SHEET.slice(0, 5);
  const row2 = SHEET.slice(5);
  const marsFigs = [
    ...row1.map((item, i) => {
      const x = 140 + i * 240;
      return [
        figureSvg(item.pose, x, 318, 'color', item.fx, item.spin),
        label(x, 348, item.label, '#efe8dc', 14),
      ].join('');
    }),
    ...row2.map((item, i) => {
      const x = 180 + i * 220;
      return [
        figureSvg(item.pose, x, 640, 'color', item.fx, item.spin),
        label(x, 688, item.label, '#efe8dc', 14),
      ].join('');
    }),
  ].join('');

  const mars = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${marsW}" height="${marsH}" viewBox="0 0 ${marsW} ${marsH}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${STAGE.sky.top}"/>
      <stop offset="0.62" stop-color="${STAGE.sky.bottom}"/>
      <stop offset="1" stop-color="${STAGE.sky.horizon}"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#sky)"/>
  <rect x="0" y="250" width="1280" height="18" fill="${STAGE.sky.horizon}"/>
  <rect x="40" y="318" width="1200" height="14" fill="${STAGE.ground.lip}"/>
  <rect x="40" y="332" width="1200" height="46" fill="${STAGE.ground.mid}"/>
  <rect x="40" y="332" width="1200" height="8" fill="${STAGE.ground.top}"/>
  <rect x="0" y="640" width="1280" height="12" fill="${STAGE.ground.lip}"/>
  <rect x="0" y="652" width="1280" height="68" fill="${STAGE.ground.top}"/>
  <rect x="0" y="652" width="1280" height="8" fill="${STAGE.ground.mid}"/>
  <text x="48" y="48" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="22" font-weight="700" fill="${STAGE.blast.void}">DARIO on the flat slab</text>
  <text x="48" y="74" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="15" font-weight="700" fill="${STAGE.blast.void}">Slate body stays the mass. Mint is the nameplate and a flash on the safety wall.</text>
  ${nameplateSvg(980, 16)}
  ${marsFigs}
</svg>`;

  return {
    'dario-poses.svg': poses,
    'dario-silhouette.svg': silhouette,
    'dario-mars-read.svg': mars,
  };
}
