// Elon fighter kit. Layered flat shapes for the match and the contact sheets.
// Silhouette: tall lean rectangle, one hair wedge, shoulders narrower than Sam,
// rocket-pack prop with no marks. Face is two ticks — not a portrait.

import { ELON, ELON_SHOULDER_W } from './palette.ts';

export type ElonPose =
  | 'idle'
  | 'walk'
  | 'jump'
  | 'smashWindup'
  | 'smash'
  | 'aerial'
  | 'ko'
  | 'upSmash'
  | 'downSmash';

export type ElonKind = 'body' | 'fx' | 'tell';
export type ElonLayer = 'under' | 'crest' | 'arm' | 'tell';

export interface ElonShape {
  d: string;
  fill?: string;
  stroke?: string;
  sw?: number;
  alpha?: number;
  outlined?: boolean;
  kind: ElonKind;
  layer: ElonLayer;
}

export interface ElonPicture {
  back: ElonShape[];
  body: ElonShape[];
  front: ElonShape[];
  rot: number;
  pivotX: number;
  pivotY: number;
  /** Highest idle point (negative y), outline included. */
  top: number;
}

export interface ElonPaintOpts {
  flash?: boolean;
  rim?: string;
  silhouette?: boolean;
  vapor?: number;
  dust?: number;
  streak?: number;
}

type Pt = [number, number];

interface Limb {
  a: Pt;
  b: Pt;
  c: Pt;
  r: number;
}

type Hair = 'idle' | 'back' | 'up';

interface Spec {
  rot: number;
  pivot: Pt;
  drop: number;
  torsoH: number;
  backLeg: Limb;
  frontLeg: Limb;
  backArm: Limb;
  frontArm: Limb;
  hair: Hair;
  streak: number;
  vapor: number;
  dust: number;
}

const RIM_W = 8;
const INK_W = 4;
const TORSO_W = ELON_SHOULDER_W;
const TORSO_X = -TORSO_W / 2;

function n(v: number): string {
  const r = Math.round(v * 10) / 10;
  return Object.is(r, -0) ? '0' : String(r);
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpPt(a: Pt, b: Pt, t: number): Pt {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

function ease(t: number): number {
  const u = clamp01(t);
  return u * u * (3 - 2 * u);
}

function limb(a: Pt, b: Pt, c: Pt, r: number): Limb {
  return { a, b, c, r };
}

function lerpLimb(a: Limb, b: Limb, t: number): Limb {
  return {
    a: lerpPt(a.a, b.a, t),
    b: lerpPt(a.b, b.b, t),
    c: lerpPt(a.c, b.c, t),
    r: lerp(a.r, b.r, t),
  };
}

function mixSpec(a: Spec, b: Spec, t: number): Spec {
  const u = ease(t);
  return {
    rot: lerp(a.rot, b.rot, u),
    pivot: lerpPt(a.pivot, b.pivot, u),
    drop: lerp(a.drop, b.drop, u),
    torsoH: lerp(a.torsoH, b.torsoH, u),
    backLeg: lerpLimb(a.backLeg, b.backLeg, u),
    frontLeg: lerpLimb(a.frontLeg, b.frontLeg, u),
    backArm: lerpLimb(a.backArm, b.backArm, u),
    frontArm: lerpLimb(a.frontArm, b.frontArm, u),
    hair: u < 0.55 ? a.hair : b.hair,
    streak: lerp(a.streak, b.streak, u),
    vapor: lerp(a.vapor, b.vapor, u),
    dust: lerp(a.dust, b.dust, u),
  };
}

function rrect(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(Math.abs(r), Math.abs(w) / 2, Math.abs(h) / 2);
  const x2 = x + w;
  const y2 = y + h;
  return [
    `M ${n(x + rr)} ${n(y)}`,
    `H ${n(x2 - rr)}`,
    `A ${n(rr)} ${n(rr)} 0 0 1 ${n(x2)} ${n(y + rr)}`,
    `V ${n(y2 - rr)}`,
    `A ${n(rr)} ${n(rr)} 0 0 1 ${n(x2 - rr)} ${n(y2)}`,
    `H ${n(x + rr)}`,
    `A ${n(rr)} ${n(rr)} 0 0 1 ${n(x)} ${n(y2 - rr)}`,
    `V ${n(y + rr)}`,
    `A ${n(rr)} ${n(rr)} 0 0 1 ${n(x + rr)} ${n(y)}`,
    'Z',
  ].join(' ');
}

function circle(cx: number, cy: number, r: number): string {
  return `M ${n(cx - r)} ${n(cy)} A ${n(r)} ${n(r)} 0 1 0 ${n(cx + r)} ${n(cy)} A ${n(r)} ${n(r)} 0 1 0 ${n(cx - r)} ${n(cy)} Z`;
}

function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${n(cx - rx)} ${n(cy)} A ${n(rx)} ${n(ry)} 0 1 0 ${n(cx + rx)} ${n(cy)} A ${n(rx)} ${n(ry)} 0 1 0 ${n(cx - rx)} ${n(cy)} Z`;
}

function poly(pts: Pt[]): string {
  const head = pts[0];
  const rest = pts.slice(1).map((p) => `L ${n(p[0])} ${n(p[1])}`).join(' ');
  return `M ${n(head[0])} ${n(head[1])} ${rest} Z`;
}

function capsule(x1: number, y1: number, x2: number, y2: number, r: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * r;
  const ny = (dx / len) * r;
  return [
    `M ${n(x1 + nx)} ${n(y1 + ny)}`,
    `L ${n(x2 + nx)} ${n(y2 + ny)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(x2 - nx)} ${n(y2 - ny)}`,
    `L ${n(x1 - nx)} ${n(y1 - ny)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(x1 + nx)} ${n(y1 + ny)}`,
    'Z',
  ].join(' ');
}

function shape(
  d: string,
  fill: string,
  layer: ElonLayer,
  kind: ElonKind = 'body',
  outlined = true,
): ElonShape {
  return { d, fill, layer, kind, outlined };
}

function idleSpec(): Spec {
  return {
    rot: 0,
    pivot: [0, 0],
    drop: 0,
    torsoH: 50,
    backLeg: limb([-3, -40], [-7, -20], [-5, 0], 7),
    frontLeg: limb([3, -40], [8, -20], [6, 0], 7),
    backArm: limb([-11, -76], [-17, -62], [-15, -48], 6),
    frontArm: limb([11, -76], [17, -62], [15, -48], 6),
    hair: 'idle',
    streak: 0,
    vapor: 0,
    dust: 0,
  };
}

function chamberSpec(): Spec {
  return {
    rot: -0.3,
    pivot: [0, 0],
    drop: 1,
    torsoH: 50,
    backLeg: limb([-3, -40], [-12, -20], [-14, 0], 7),
    frontLeg: limb([4, -40], [12, -20], [14, 0], 7),
    backArm: limb([-8, -76], [4, -64], [14, -50], 6),
    frontArm: limb([6, -78], [-12, -72], [-28, -92], 6.5),
    hair: 'back',
    streak: 0,
    vapor: 0,
    dust: 0,
  };
}

function extendSpec(): Spec {
  return {
    rot: 0.12,
    pivot: [0, 0],
    drop: 2,
    torsoH: 50,
    backLeg: limb([-2, -40], [-14, -18], [-16, 0], 7),
    frontLeg: limb([4, -40], [12, -18], [16, 0], 7),
    backArm: limb([-10, -76], [-24, -64], [-30, -50], 6),
    frontArm: limb([10, -72], [38, -68], [66, -62], 7),
    hair: 'back',
    streak: 1,
    vapor: 0,
    dust: 0,
  };
}

function walkSpec(swing: number): Spec {
  const spec = idleSpec();
  const s = Math.max(-1, Math.min(1, swing));
  const moveLeg = (base: Limb, forward: boolean): Limb => {
    const dir = forward ? 1 : -1;
    const kick = s * dir;
    const dx = kick * 15;
    const lift = Math.max(0, kick) * 9;
    return limb(base.a, [base.b[0] + dx * 0.65, base.b[1] - lift * 0.3], [base.c[0] + dx, base.c[1] - lift], base.r);
  };
  const moveArm = (base: Limb, forward: boolean): Limb => {
    const dir = forward ? 1 : -1;
    const dx = -s * dir * 12;
    return limb(base.a, [base.b[0] + dx, base.b[1]], [base.c[0] + dx, base.c[1] - Math.abs(dx) * 0.15], base.r);
  };
  spec.backLeg = moveLeg(spec.backLeg, false);
  spec.frontLeg = moveLeg(spec.frontLeg, true);
  spec.backArm = moveArm(spec.backArm, false);
  spec.frontArm = moveArm(spec.frontArm, true);
  spec.hair = Math.abs(s) > 0.45 ? 'back' : 'idle';
  return spec;
}

function jumpSpec(t: number): Spec {
  const u = clamp01(t);
  const tuck = 1 - u;
  return {
    rot: lerp(-0.14, 0.18, u),
    pivot: [0, -52],
    drop: lerp(-2, 2, u),
    torsoH: 48,
    backLeg: limb([-2, -42], [-14, -26 - tuck * 4], [-16, -6 - tuck * 16], 7),
    frontLeg: limb([3, -42], [14, -24 - tuck * 3], [18, -4 - tuck * 14], 7),
    backArm: limb([-10, -74], [-22, -66], [-26, -52 - tuck * 10], 6),
    frontArm: limb([10, -74], [22, -64], [26, -50 - tuck * 8], 6),
    hair: tuck > 0.4 ? 'up' : 'back',
    streak: 0,
    vapor: 1,
    dust: 0,
  };
}

function aerialSpec(t: number): Spec {
  const u = ease(t);
  const wind = limb([8, -74], [0, -66], [-14, -84], 6.5);
  const hit = limb([10, -70], [32, -54], [54, -38], 7);
  return {
    rot: lerp(-0.16, -0.4, u),
    pivot: [0, -54],
    drop: 0,
    torsoH: 48,
    backLeg: limb([-2, -42], [-18, -26], [-30, -12], 7),
    frontLeg: limb([3, -42], [16, -32], [26, -18], 7),
    backArm: limb([-8, -76], [-16, -94], [-8, -108], 6),
    frontArm: lerpLimb(wind, hit, u),
    hair: 'back',
    streak: u,
    vapor: 0,
    dust: 0,
  };
}

function upSpec(): Spec {
  return {
    rot: -0.04,
    pivot: [0, 0],
    drop: -6,
    torsoH: 54,
    backLeg: limb([-2, -46], [-3, -24], [-2, 0], 6.5),
    frontLeg: limb([3, -46], [4, -24], [4, 0], 6.5),
    backArm: limb([-8, -86], [-12, -108], [-6, -126], 6),
    frontArm: limb([8, -84], [18, -112], [24, -134], 6.5),
    hair: 'up',
    streak: 0,
    vapor: 1,
    dust: 0,
  };
}

function downSpec(t: number): Spec {
  const crouched: Spec = {
    rot: 0.04,
    pivot: [0, 0],
    drop: 14,
    torsoH: 40,
    backLeg: limb([-4, -28], [-16, -14], [-14, 0], 7),
    frontLeg: limb([4, -28], [14, -14], [18, 0], 7.5),
    backArm: limb([-8, -58], [-20, -44], [-26, -32], 6),
    frontArm: limb([8, -58], [18, -36], [20, -18], 6),
    hair: 'idle',
    streak: 0,
    vapor: 0,
    dust: 1,
  };
  return mixSpec(idleSpec(), crouched, t);
}

function koSpec(angle: number): Spec {
  return {
    rot: angle,
    pivot: [0, -64],
    drop: 0,
    torsoH: 48,
    backLeg: limb([-2, -40], [-14, -22], [-24, -6], 7),
    frontLeg: limb([3, -40], [14, -18], [24, 2], 7),
    backArm: limb([-8, -74], [-20, -86], [-30, -74], 6),
    frontArm: limb([8, -72], [22, -56], [32, -42], 6.5),
    hair: 'up',
    streak: 0,
    vapor: 0,
    dust: 0,
  };
}

function specFor(pose: ElonPose, t: number): Spec {
  switch (pose) {
    case 'idle':
      return idleSpec();
    case 'walk':
      return walkSpec(t);
    case 'jump':
      return jumpSpec(t);
    case 'smashWindup':
      return mixSpec(idleSpec(), chamberSpec(), t);
    case 'smash':
      return mixSpec(chamberSpec(), extendSpec(), t);
    case 'aerial':
      return aerialSpec(t);
    case 'ko':
      return koSpec(t);
    case 'upSmash':
      return upSpec();
    case 'downSmash':
      return downSpec(t);
    default:
      return idleSpec();
  }
}

function hairPoints(hx: number, hy: number, style: Hair): Pt[] {
  if (style === 'back') {
    return [
      [hx - 8, hy],
      [hx - 28, hy - 8],
      [hx - 12, hy - 16],
      [hx - 4, hy - 30],
      [hx + 10, hy - 6],
      [hx + 4, hy + 4],
    ];
  }
  if (style === 'up') {
    return [
      [hx - 8, hy - 2],
      [hx - 16, hy - 16],
      [hx - 4, hy - 36],
      [hx + 6, hy - 38],
      [hx + 12, hy - 10],
      [hx + 4, hy + 3],
    ];
  }
  return [
    [hx - 8, hy + 1],
    [hx - 16, hy - 12],
    [hx - 6, hy - 10],
    [hx + 1, hy - 32],
    [hx + 11, hy - 6],
    [hx + 4, hy + 4],
  ];
}

function streakBlade(arm: Limb, amount: number): ElonShape[] {
  if (amount <= 0.04) return [];
  const [ex, ey] = arm.b;
  const [hx, hy] = arm.c;
  const dx = hx - ex;
  const dy = hy - ey;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const reach = 18 + amount * 32;
  const tip: Pt = [hx + ux * reach, hy + uy * reach];
  const tail: Pt = [hx - ux * 4, hy - uy * 4];
  const blade = (tipW: number, tailW: number): string =>
    poly([
      [tip[0] + px * tipW, tip[1] + py * tipW],
      [tip[0] - px * tipW, tip[1] - py * tipW],
      [tail[0] - px * tailW, tail[1] - py * tailW],
      [tail[0] + px * tailW, tail[1] + py * tailW],
    ]);
  return [
    shape(blade(2.4, 11 + amount * 4), ELON.streakEdge, 'tell', 'tell', false),
    shape(blade(1.3, 6.5), ELON.streak, 'tell', 'tell', false),
    shape(blade(0.45, 2.2), ELON.streakCore, 'tell', 'tell', false),
  ];
}

function vaporShapes(amount: number): ElonShape[] {
  if (amount <= 0.04) return [];
  const shapes: ElonShape[] = [];
  for (let i = 0; i < 4; i++) {
    const y = 10 + i * 16;
    const w = 12 + i * 8;
    const fade = (1 - i / 4.2) * amount;
    shapes.push({
      d: poly([
        [-w, y + 14],
        [0, y],
        [w, y + 14],
        [w * 0.55, y + 14],
        [0, y + 6],
        [-w * 0.55, y + 14],
      ]),
      fill: ELON.accent,
      alpha: Math.min(1, fade),
      kind: 'fx',
      layer: 'under',
      outlined: false,
    });
  }
  return shapes;
}

function dustShapes(amount: number): { back: ElonShape[]; front: ElonShape[] } {
  if (amount <= 0.04) return { back: [], front: [] };
  const rx = 18 + amount * 28;
  const ry = 5.5 + amount * 3.5;
  const back: ElonShape[] = [
    {
      d: ellipse(0, 5, rx, ry),
      fill: ELON.dustShadow,
      alpha: 0.4 * amount,
      kind: 'fx',
      layer: 'under',
      outlined: false,
    },
    {
      d: ellipse(0, 3, rx * 0.7, ry * 0.65),
      fill: ELON.dust,
      alpha: 0.7 * amount,
      kind: 'fx',
      layer: 'under',
      outlined: false,
    },
  ];
  const front: ElonShape[] = [
    {
      d: ellipse(0, 3, rx * 1.08, ry),
      stroke: ELON.accent,
      sw: 4,
      alpha: 0.95 * amount,
      kind: 'fx',
      layer: 'under',
      outlined: false,
    },
  ];
  return { back, front };
}

function pushLimb(out: ElonShape[], part: Limb, fill: string, hand: 'fist' | 'shoe', layer: ElonLayer): void {
  out.push(shape(capsule(part.a[0], part.a[1], part.b[0], part.b[1], part.r), fill, layer));
  out.push(shape(capsule(part.b[0], part.b[1], part.c[0], part.c[1], part.r), fill, layer));
  out.push(shape(circle(part.b[0], part.b[1], part.r * 0.9), fill, layer));
  if (hand === 'shoe') out.push(shape(rrect(part.c[0] - 3, part.c[1] - 4, 13, 7, 3), ELON.pack, layer));
  else out.push(shape(circle(part.c[0], part.c[1], part.r + 2), ELON.skin, layer));
}

function pictureFrom(spec: Spec, opts: ElonPaintOpts): ElonPicture {
  const flash = opts.flash === true && opts.silhouette !== true;
  const fillOf = (hex: string, hold = false): string => (flash && !hold ? '#FFF6EE' : hex);
  const bottom = -40 + spec.drop;
  const top = bottom - spec.torsoH;
  const hx = 4;
  const hy = top - 11;
  const headR = 13;
  const hair = hairPoints(hx, hy, spec.hair);
  let peak = hy - headR;
  for (const p of hair) peak = Math.min(peak, p[1]);

  const under: ElonShape[] = [];
  const packX = TORSO_X - 8;
  const packY = top + 12;
  under.push(shape(rrect(packX, packY, 12, 26, 4), fillOf(ELON.pack), 'under'));
  under.push(shape(rrect(packX + 8, packY + 6, 12, 4, 2), fillOf(ELON.jacket), 'under', 'body', false));
  pushLimb(under, spec.backLeg, fillOf(ELON.pants), 'shoe', 'under');
  pushLimb(under, spec.frontLeg, fillOf(ELON.pants), 'shoe', 'under');
  pushLimb(under, spec.backArm, fillOf(ELON.jacket), 'fist', 'under');
  under.push(shape(rrect(TORSO_X, top, TORSO_W, spec.torsoH, 6), fillOf(ELON.jacket), 'under'));
  under.push(shape(rrect(-3, top - 1, 8, 8, 2), fillOf(ELON.skin), 'under'));
  under.push(shape(circle(hx, hy, headR), fillOf(ELON.skin), 'under'));
  under.push({
    d: rrect(hx - 5, hy + 4, 4, 2.2, 1),
    fill: ELON.ink,
    kind: 'fx',
    layer: 'under',
    outlined: false,
  });
  under.push({
    d: rrect(hx + 1.5, hy + 4, 5.5, 2.4, 1),
    fill: ELON.ink,
    kind: 'fx',
    layer: 'under',
    outlined: false,
  });

  const crest: ElonShape[] = [];
  crest.push(shape(poly(hair), fillOf(ELON.hair), 'crest'));
  crest.push(shape(rrect(-7, top + 7, 14, 26, 3), fillOf(ELON.tee, true), 'crest'));
  crest.push({
    d: ellipse(packX + 4, packY + 30, 10, 6),
    fill: ELON.accent,
    alpha: 0.55,
    kind: 'fx',
    layer: 'crest',
    outlined: false,
  });
  crest.push(shape(circle(packX + 2, packY + 28, 4.2), fillOf(ELON.accent, true), 'crest'));
  crest.push(shape(circle(packX + 9, packY + 28, 4.2), fillOf(ELON.accent, true), 'crest'));

  const arm: ElonShape[] = [];
  pushLimb(arm, spec.frontArm, fillOf(ELON.jacket), 'fist', 'arm');

  const streak = opts.streak !== undefined ? opts.streak : spec.streak;
  const vapor = opts.vapor !== undefined ? opts.vapor : spec.vapor;
  const dust = opts.dust !== undefined ? opts.dust : spec.dust;
  const tells = streakBlade(spec.frontArm, streak);
  const rings = dustShapes(dust);
  const back = [...vaporShapes(vapor), ...rings.back];
  const front = rings.front;
  const body = [...under, ...crest, ...arm, ...tells];

  const finish = (groups: ElonShape[]): ElonShape[] => {
    if (!opts.silhouette) return groups;
    return groups
      .filter((s) => s.kind !== 'fx')
      .map((s) => ({ ...s, fill: '#140c0a', outlined: false, alpha: 1, stroke: undefined, sw: undefined }));
  };

  return {
    back: opts.silhouette ? [] : back,
    body: finish(body),
    front: opts.silhouette ? [] : front,
    rot: spec.rot,
    pivotX: spec.pivot[0],
    pivotY: spec.pivot[1],
    top: peak - 6,
  };
}

export function elonPicture(pose: ElonPose, t: number, opts: ElonPaintOpts = {}): ElonPicture {
  return pictureFrom(specFor(pose, t), opts);
}

let cachedTop: number | null = null;

export function elonIdleTop(): number {
  if (cachedTop === null) cachedTop = elonPicture('idle', 0).top;
  return cachedTop;
}

function paintFx(ctx: CanvasRenderingContext2D, shapes: readonly ElonShape[]): void {
  for (const shape of shapes) {
    const path = new Path2D(shape.d);
    ctx.save();
    ctx.globalAlpha = shape.alpha ?? 1;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (shape.fill) {
      ctx.fillStyle = shape.fill;
      ctx.fill(path);
    }
    if (shape.stroke && shape.sw) {
      ctx.strokeStyle = shape.stroke;
      ctx.lineWidth = shape.sw;
      ctx.stroke(path);
    }
    ctx.restore();
  }
}

function paintGroup(ctx: CanvasRenderingContext2D, shapes: readonly ElonShape[], rim: string, halo: boolean): void {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (halo) {
    ctx.strokeStyle = rim;
    ctx.lineWidth = RIM_W;
    for (const shape of shapes) {
      if (!shape.outlined) continue;
      ctx.globalAlpha = shape.alpha ?? 1;
      ctx.stroke(new Path2D(shape.d));
    }
  }
  for (const shape of shapes) {
    if (!shape.fill) continue;
    ctx.globalAlpha = shape.alpha ?? 1;
    ctx.fillStyle = shape.fill;
    ctx.fill(new Path2D(shape.d));
  }
  ctx.strokeStyle = ELON.ink;
  ctx.lineWidth = INK_W;
  for (const shape of shapes) {
    if (!shape.outlined) continue;
    ctx.globalAlpha = shape.alpha ?? 1;
    ctx.stroke(new Path2D(shape.d));
  }
  ctx.restore();
}

export function drawElonPose(
  ctx: CanvasRenderingContext2D,
  pose: ElonPose,
  t: number,
  opts: ElonPaintOpts = {},
): void {
  const pic = elonPicture(pose, t, opts);
  const rim = opts.rim ?? '#F6E7D4';
  const of = (layer: ElonLayer) => pic.body.filter((s) => s.layer === layer);
  ctx.save();
  paintFx(ctx, pic.back);
  ctx.save();
  ctx.translate(pic.pivotX, pic.pivotY);
  ctx.rotate(pic.rot);
  ctx.translate(-pic.pivotX, -pic.pivotY);
  paintGroup(ctx, of('under'), rim, true);
  paintGroup(ctx, of('crest'), rim, true);
  paintGroup(ctx, of('arm'), rim, false);
  paintFx(ctx, of('tell'));
  ctx.restore();
  paintFx(ctx, pic.front);
  ctx.restore();
}

function svgPath(shape: ElonShape, extra: string): string {
  const opacity = (shape.alpha ?? 1) < 0.999 ? ` opacity="${(shape.alpha ?? 1).toFixed(3)}"` : '';
  return `<path d="${shape.d}"${extra}${opacity}/>`;
}

function groupMarkup(shapes: readonly ElonShape[], rim: string, halo: boolean): string {
  const rimStrokes = halo
    ? shapes
        .filter((s) => s.outlined)
        .map((s) =>
          svgPath(
            s,
            ` fill="none" stroke="${rim}" stroke-width="${RIM_W}" stroke-linejoin="round" stroke-linecap="round"`,
          ),
        )
        .join('')
    : '';
  const fills = shapes
    .filter((s) => s.fill)
    .map((s) => svgPath(s, ` fill="${s.fill}" stroke="none"`))
    .join('');
  const ink = shapes
    .filter((s) => s.outlined)
    .map((s) =>
      svgPath(
        s,
        ` fill="none" stroke="${ELON.ink}" stroke-width="${INK_W}" stroke-linejoin="round" stroke-linecap="round"`,
      ),
    )
    .join('');
  return rimStrokes + fills + ink;
}

function fxMarkup(shapes: readonly ElonShape[]): string {
  return shapes
    .map((s) => {
      const fill = s.fill ? ` fill="${s.fill}"` : ' fill="none"';
      const stroke = s.stroke
        ? ` stroke="${s.stroke}" stroke-width="${s.sw ?? 2}" stroke-linejoin="round" stroke-linecap="round"`
        : '';
      return svgPath(s, `${fill}${stroke}`);
    })
    .join('');
}

/** Same stack order as drawElonPose, for the contact sheets. */
export function elonMarkup(pic: ElonPicture, rim: string): string {
  const deg = (pic.rot * 180) / Math.PI;
  const of = (layer: ElonLayer) => pic.body.filter((s) => s.layer === layer);
  const rot =
    Math.abs(deg) < 0.05
      ? ''
      : ` transform="rotate(${deg.toFixed(2)} ${pic.pivotX.toFixed(1)} ${pic.pivotY.toFixed(1)})"`;
  const inner =
    groupMarkup(of('under'), rim, true) +
    groupMarkup(of('crest'), rim, true) +
    groupMarkup(of('arm'), rim, false) +
    fxMarkup(of('tell'));
  return `${fxMarkup(pic.back)}<g${rot}>${inner}</g>${fxMarkup(pic.front)}`;
}
