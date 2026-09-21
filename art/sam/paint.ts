// SAM fighter kit. Broad blazer, short hair dome, open collar.
// Flat geometry only — no portrait, no wordmarks, no product chrome.
// Fills come from art/palette.ts. This module does not import combat.

import { STAGE } from '../palette.ts';
import { nameplateRects } from '../nameplates.ts';
import { BILLBOARD_SCALE } from '../../src/render/nameplate.ts';
import { SAM, SAM_SHOULDER_W } from './palette.ts';

export type SamPose =
  | 'idle'
  | 'walk'
  | 'jump'
  | 'windup'
  | 'smash'
  | 'back'
  | 'up'
  | 'down'
  | 'aerial'
  | 'ko'
  | 'flinch';

export interface SamPaintOpts {
  rim?: string;
  flash?: boolean;
  silhouette?: boolean;
  /** 0–1 strength of the gold tell on smash poses. */
  power?: number;
  phase?: number;
}

interface PoseSpec {
  lean: number;
  bob: number;
  thighF: number;
  kneeF: number;
  thighB: number;
  kneeB: number;
  armF: number;
  armB: number;
  armFLen: number;
  head: number;
  shrug: number;
  swipe: number;
  swipeY: number;
  wave: number;
  gavel: number;
  glint: number;
}

interface Pen {
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(rad: number): void;
  shape(d: string, fill: string, stroke: string, sw: number, alpha?: number): void;
  stroke(d: string, color: string, sw: number, alpha?: number): void;
}

const HIP_Y = -36;
const SHOULDER_Y = -70;
const HEAD_Y = -90;

/** Highest idle point, outline included. Matches the shared billboard head top. */
export function samIdleTop(): number {
  return -112;
}

export function drawSamPose(
  ctx: CanvasRenderingContext2D,
  pose: SamPose,
  opts: SamPaintOpts = {},
): void {
  renderPose(canvasPen(ctx), pose, opts);
}

export function samPoseMarkup(pose: SamPose, opts: SamPaintOpts = {}): string {
  const pen = svgPen();
  renderPose(pen, pose, opts);
  return pen.markup();
}

function num(n: number): string {
  return (Math.round(n * 100) / 100).toString();
}

function rr(x: number, y: number, w: number, h: number, r: number): string {
  const x2 = x + w;
  const y2 = y + h;
  return `M ${num(x + r)} ${num(y)} H ${num(x2 - r)} A ${num(r)} ${num(r)} 0 0 1 ${num(x2)} ${num(y + r)} V ${num(y2 - r)} A ${num(r)} ${num(r)} 0 0 1 ${num(x2 - r)} ${num(y2)} H ${num(x + r)} A ${num(r)} ${num(r)} 0 0 1 ${num(x)} ${num(y2 - r)} V ${num(y + r)} A ${num(r)} ${num(r)} 0 0 1 ${num(x + r)} ${num(y)} Z`;
}

function circle(cx: number, cy: number, r: number): string {
  return `M ${num(cx - r)} ${num(cy)} A ${num(r)} ${num(r)} 0 1 0 ${num(cx + r)} ${num(cy)} A ${num(r)} ${num(r)} 0 1 0 ${num(cx - r)} ${num(cy)} Z`;
}

function canvasPen(ctx: CanvasRenderingContext2D): Pen {
  return {
    save: () => ctx.save(),
    restore: () => ctx.restore(),
    translate: (x, y) => ctx.translate(x, y),
    rotate: (rad) => ctx.rotate(rad),
    shape: (d, fill, stroke, sw, alpha = 1) => {
      const path = new Path2D(d);
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      if (sw >= 4 && stroke !== fill) {
        ctx.lineWidth = sw + 3.5;
        ctx.strokeStyle = SAM.ink;
        ctx.stroke(path);
      }
      ctx.lineWidth = sw;
      ctx.strokeStyle = stroke;
      ctx.stroke(path);
      ctx.fillStyle = fill;
      ctx.fill(path);
      ctx.restore();
    },
    stroke: (d, color, sw, alpha = 1) => {
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = sw + 2;
      ctx.strokeStyle = SAM.ink;
      ctx.stroke(new Path2D(d));
      ctx.lineWidth = sw;
      ctx.strokeStyle = color;
      ctx.stroke(new Path2D(d));
      ctx.restore();
    },
  };
}

function svgPen(): Pen & { markup(): string } {
  const chunks: string[] = [];
  const marks: number[] = [];
  let opens = 0;
  return {
    save: () => marks.push(opens),
    restore: () => {
      const mark = marks.pop() ?? 0;
      while (opens > mark) {
        chunks.push('</g>');
        opens -= 1;
      }
    },
    translate: (x, y) => {
      chunks.push(`<g transform="translate(${num(x)} ${num(y)})">`);
      opens += 1;
    },
    rotate: (rad) => {
      chunks.push(`<g transform="rotate(${num((rad * 180) / Math.PI)})">`);
      opens += 1;
    },
    shape: (d, fill, stroke, sw, alpha = 1) => {
      const opacity = alpha < 1 ? ` opacity="${num(alpha)}"` : '';
      const halo =
        sw >= 4 && stroke !== fill
          ? `<path d="${d}" fill="none" stroke="${SAM.ink}" stroke-width="${num(sw + 3.5)}" stroke-linejoin="round"${opacity}/>`
          : '';
      chunks.push(
        `${halo}<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${num(sw)}" stroke-linejoin="round"${opacity}/>`,
      );
    },
    stroke: (d, color, sw, alpha = 1) => {
      const opacity = alpha < 1 ? ` opacity="${num(alpha)}"` : '';
      chunks.push(
        `<path d="${d}" fill="none" stroke="${SAM.ink}" stroke-width="${num(sw + 2)}" stroke-linecap="round"${opacity}/>` +
          `<path d="${d}" fill="none" stroke="${color}" stroke-width="${num(sw)}" stroke-linecap="round"${opacity}/>`,
      );
    },
    markup: () => chunks.join(''),
  };
}

function colors(opts: SamPaintOpts): {
  blazer: string;
  lite: string;
  shirt: string;
  hair: string;
  skin: string;
  trouser: string;
  shoe: string;
  gold: string;
  hot: string;
  rim: string;
  flat: boolean;
} {
  const rim = opts.rim ?? '#F6E7D4';
  if (opts.silhouette) {
    const ink = '#140c10';
    return {
      blazer: ink,
      lite: ink,
      shirt: ink,
      hair: ink,
      skin: ink,
      trouser: ink,
      shoe: ink,
      gold: ink,
      hot: ink,
      rim: ink,
      flat: true,
    };
  }
  if (opts.flash) {
    const wash = '#FFF6EE';
    return {
      blazer: wash,
      lite: wash,
      shirt: wash,
      hair: wash,
      skin: wash,
      trouser: wash,
      shoe: wash,
      gold: SAM.accent,
      hot: '#ffffff',
      rim,
      flat: false,
    };
  }
  return {
    blazer: SAM.blazer,
    lite: SAM.lite,
    shirt: SAM.shirt,
    hair: SAM.hair,
    skin: SAM.skin,
    trouser: SAM.trouser,
    shoe: SAM.shoe,
    gold: SAM.accent,
    hot: SAM.hot,
    rim,
    flat: false,
  };
}

function specFor(pose: SamPose, phase: number, power: number): PoseSpec {
  const breath = Math.sin(phase * 2.2);
  const idle: PoseSpec = {
    lean: 0.04,
    bob: breath * 1.1,
    thighF: 0.05,
    kneeF: 0.04,
    thighB: -0.07,
    kneeB: 0.02,
    armF: -0.22,
    armB: 0.2,
    armFLen: 32,
    head: breath * 0.02,
    shrug: 0,
    swipe: 0,
    swipeY: -58,
    wave: 0,
    gavel: 0,
    glint: 0,
  };
  if (pose === 'idle' || pose === 'flinch') {
    if (pose === 'flinch') {
      return { ...idle, lean: -0.22, bob: 2, shrug: 5, armF: -0.7, armB: 0.85, head: -0.18, kneeF: 0.45 };
    }
    return idle;
  }
  if (pose === 'walk') {
    const s = Math.sin(phase * Math.PI * 2);
    return {
      ...idle,
      lean: s * 0.05,
      bob: -Math.abs(s) * 2.4,
      thighF: -s * 0.74,
      kneeF: Math.max(0, s) * 1.05,
      thighB: s * 0.74,
      kneeB: Math.max(0, -s) * 1.05,
      armF: s * 0.7,
      armB: -s * 0.7,
      head: -s * 0.04,
    };
  }
  if (pose === 'jump') {
    const fall = Math.min(1, Math.max(0, phase));
    return {
      ...idle,
      lean: -0.14 + fall * 0.28,
      bob: -3,
      thighF: -1.05 + fall * 0.45,
      kneeF: 1.25 - fall * 0.7,
      thighB: 0.7 - fall * 0.25,
      kneeB: 0.55 - fall * 0.3,
      armF: -2.45 + fall * 0.7,
      armB: 2.2 - fall * 0.55,
      head: -0.1 + fall * 0.16,
    };
  }
  if (pose === 'windup') {
    return {
      ...idle,
      lean: -0.32,
      bob: 1,
      thighF: -0.18,
      kneeF: 0.22,
      thighB: 0.42,
      kneeB: 0.12,
      armF: 1.35,
      armB: 0.55,
      armFLen: 30,
      head: -0.16,
      glint: power,
    };
  }
  if (pose === 'smash') {
    return {
      ...idle,
      lean: 0.18,
      bob: 0,
      thighF: -0.32,
      kneeF: 0.12,
      thighB: 0.38,
      kneeB: 0.08,
      armF: -1.18,
      armB: 0.95,
      armFLen: 42,
      head: 0.08,
      swipe: power,
    };
  }
  if (pose === 'back') {
    return {
      ...idle,
      lean: -0.06,
      bob: -1,
      armF: -2.55,
      armB: 2.45,
      armFLen: 30,
      head: -0.08,
      shrug: 9,
      wave: power,
    };
  }
  if (pose === 'up') {
    return {
      ...idle,
      lean: -0.2,
      bob: -2,
      thighF: -0.16,
      thighB: 0.22,
      armF: -3.55,
      armB: 0.35,
      armFLen: 48,
      head: -0.22,
      shrug: 2,
      gavel: power,
    };
  }
  if (pose === 'down') {
    return {
      ...idle,
      lean: 0.38,
      bob: 4,
      thighF: -0.15,
      kneeF: 0.7,
      thighB: 0.12,
      kneeB: 0.35,
      armF: -0.45,
      armB: 0.7,
      armFLen: 38,
      head: 0.18,
      swipe: power * 0.85,
      swipeY: -30,
    };
  }
  if (pose === 'aerial') {
    return {
      ...idle,
      lean: 0.24,
      bob: -2,
      thighF: -1.12,
      kneeF: 0.72,
      thighB: 0.9,
      kneeB: 0.28,
      armF: -1.22,
      armB: 1.7,
      armFLen: 38,
      head: 0.12,
      swipe: power * 0.9,
    };
  }
  return {
    ...idle,
    lean: -0.62,
    bob: 0,
    thighF: -1.25,
    kneeF: 0.35,
    thighB: 1.05,
    kneeB: 0.15,
    armF: -2.55,
    armB: 2.15,
    armFLen: 34,
    head: 0.5,
  };
}

function renderPose(pen: Pen, pose: SamPose, opts: SamPaintOpts): void {
  const c = colors(opts);
  const spec = specFor(pose, opts.phase ?? 0, opts.power ?? 1);
  const sw = c.flat ? 7 : 5;
  pen.save();
  pen.translate(0, spec.bob);
  leg(pen, -10, spec.thighB, spec.kneeB, c, sw);
  leg(pen, 9, spec.thighF, spec.kneeF, c, sw);
  pen.save();
  pen.translate(0, -spec.shrug);
  pen.translate(0, HIP_Y);
  pen.rotate(spec.lean);
  pen.translate(0, -HIP_Y);
  if (spec.wave > 0.05 && !c.flat) wave(pen, c, spec.wave);
  arm(pen, -1, spec.armB, 30, c, sw, false, 0, 0);
  torso(pen, c, sw);
  head(pen, spec.head, c, sw);
  arm(pen, 1, spec.armF, spec.armFLen, c, sw, true, spec.gavel, spec.glint);
  if (spec.swipe > 0.04 && !c.flat) swipe(pen, c, spec.swipe, spec.swipeY);
  pen.restore();
  pen.restore();
}

function leg(
  pen: Pen,
  hipX: number,
  thigh: number,
  knee: number,
  c: ReturnType<typeof colors>,
  sw: number,
): void {
  pen.save();
  pen.translate(hipX, HIP_Y);
  pen.rotate(thigh);
  pen.shape(rr(-7, 0, 14, 16, 5), c.trouser, c.rim, sw);
  pen.translate(0, 14);
  pen.rotate(knee);
  pen.shape(rr(-6, 0, 12, 15, 4), c.trouser, c.rim, sw);
  pen.shape(rr(-4, 12, 17, 8, 3), c.shoe, c.rim, c.flat ? 6 : 4);
  pen.restore();
}

function arm(
  pen: Pen,
  side: -1 | 1,
  angle: number,
  len: number,
  c: ReturnType<typeof colors>,
  sw: number,
  lead: boolean,
  gavel: number,
  glint: number,
): void {
  pen.save();
  pen.translate(side * (SAM_SHOULDER_W / 2 - 7), SHOULDER_Y);
  pen.rotate(angle);
  pen.shape(rr(-6.5, -4, 13, len, 6), c.blazer, c.rim, sw);
  if (lead && gavel > 0.35) gavelFist(pen, c, len, gavel);
  else {
    pen.shape(circle(0, len + 1, 6.5), c.skin, c.rim, c.flat ? 6 : 4);
    if (lead && glint > 0.2 && !c.flat) {
      pen.shape(circle(1, len - 1, 3.5 + glint * 3), c.gold, c.gold, 2, 0.9);
    }
  }
  pen.restore();
}

function gavelFist(pen: Pen, c: ReturnType<typeof colors>, len: number, amount: number): void {
  pen.save();
  pen.translate(0, len);
  pen.shape(rr(-16, -8, 32, 14, 3), c.gold, c.rim, c.flat ? 6 : 4, Math.min(1, amount));
  pen.shape(circle(0, 5, 7), c.skin, c.rim, c.flat ? 6 : 4, Math.min(1, amount));
  if (!c.flat) {
    pen.stroke(`M -9 -12 L -9 -20 M 0 -14 L 0 -24 M 9 -12 L 9 -20`, c.hot, 3, amount);
  }
  pen.restore();
}

function torso(pen: Pen, c: ReturnType<typeof colors>, sw: number): void {
  const half = SAM_SHOULDER_W / 2;
  pen.shape(
    `M ${num(-half)} -80 L ${num(half)} -80 L 16 -34 L 20 -24 L -20 -24 L -16 -34 Z`,
    c.blazer,
    c.rim,
    sw,
  );
  if (c.flat) return;
  pen.shape('M -4 -76 L 18 -76 L 10 -30 L -2 -30 Z', c.lite, c.blazer, 2);
  pen.shape('M -11 -78 L 11 -78 L 0 -46 Z', c.shirt, c.blazer, 2);
  pen.shape('M -18 -78 L -7 -78 L -14 -64 Z', c.blazer, c.rim, 3);
  pen.shape('M 18 -78 L 7 -78 L 14 -64 Z', c.blazer, c.rim, 3);
  pen.stroke('M -8 -76 L 0 -48 L 8 -76', c.gold, 2.6);
}

function head(pen: Pen, tilt: number, c: ReturnType<typeof colors>, sw: number): void {
  pen.save();
  pen.translate(0, HEAD_Y);
  pen.rotate(tilt);
  pen.shape(rr(-5, 8, 10, 14, 3), c.skin, c.rim, c.flat ? 6 : 3);
  pen.shape(circle(0, 0, 15), c.skin, c.rim, sw);
  pen.shape(
    'M -16 4 C -20 -4 -15 -20 0 -20 C 15 -20 20 -4 16 4 Q 0 0 -16 4 Z',
    c.hair,
    c.rim,
    sw,
  );
  if (!c.flat) pen.stroke('M 4 3 L 11 2', '#4a3428', 2.4);
  pen.restore();
}

function swipe(pen: Pen, c: ReturnType<typeof colors>, alpha: number, y: number): void {
  const a = Math.max(0, Math.min(1, alpha));
  pen.shape(
    `M 16 ${num(y - 8)} L 96 ${num(y + 6)} L 100 ${num(y + 14)} L 18 ${num(y + 2)} Z`,
    c.gold,
    SAM.goldEdge,
    3,
    a,
  );
  pen.shape(
    `M 28 ${num(y - 2)} L 90 ${num(y + 6)} L 86 ${num(y + 10)} L 26 ${num(y + 2)} Z`,
    c.hot,
    c.hot,
    1,
    a,
  );
}

function wave(pen: Pen, c: ReturnType<typeof colors>, alpha: number): void {
  const a = Math.max(0, Math.min(1, alpha));
  pen.stroke('M -28 -78 Q -46 -58 -24 -40', c.gold, 4, a);
  pen.stroke('M -36 -86 Q -62 -58 -32 -34', c.gold, 3.5, a * 0.9);
  pen.stroke('M -44 -92 Q -78 -56 -40 -28', c.gold, 3, a * 0.75);
}

function ground(x: number, y: number, w: number): string {
  const g = STAGE.ground;
  return (
    `<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="8" fill="${g.top}"/>` +
    `<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="3" fill="${g.lip}"/>` +
    `<rect x="${num(x)}" y="${num(y + 8)}" width="${num(w)}" height="22" fill="${g.mid}"/>`
  );
}

function label(x: number, y: number, text: string): string {
  return `<text x="${num(x)}" y="${num(y)}" text-anchor="middle" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="14" font-weight="700" fill="${SAM.accent}">${text}</text>`;
}

function plate(x: number, y: number, scale: number): string {
  const rects = nameplateRects('sam')
    .rects.map(
      (rect) =>
        `<rect x="${num(rect.x)}" y="${num(rect.y)}" width="${num(rect.w)}" height="${num(rect.h)}" fill="${rect.fill}"/>`,
    )
    .join('');
  return `<g transform="translate(${num(x)} ${num(y)}) scale(${scale})">${rects}</g>`;
}

/** Shared gold-on-navy plate, bottom 8px above the idle dome. Scale is Elena's rest billboard. */
function plateAboveIdle(xCenter: number, feet: number): string {
  const geo = nameplateRects('sam');
  const scale = BILLBOARD_SCALE;
  const top = feet + samIdleTop() - 8 - geo.h * scale;
  const left = xCenter - (geo.w * scale) / 2;
  return plate(left, top, scale);
}

function cell(x: number, feet: number, pose: SamPose, text: string, phase = 0, power = 1): string {
  const fig = samPoseMarkup(pose, { phase, power, rim: '#F6E7D4' });
  const spin = pose === 'ko' ? ` rotate(-36)` : '';
  return (
    ground(x - 48, feet, 96) +
    `<g transform="translate(${num(x)} ${num(feet)})${spin}">${fig}</g>` +
    label(x, feet + 46, text)
  );
}

/** Contrast masses for the sheet. Not the other kits. */
function elonMass(): string {
  return `<path fill="#140c10" d="M 2 -96 L -8 -118 L -24 -100 L -4 -86 Z M -10 -90 A 12 12 0 1 0 14 -90 A 12 12 0 1 0 -10 -90 Z M -12 -78 H 12 V -36 H -12 Z M -12 -38 H -4 V 0 H -12 Z M 2 -38 H 10 V 0 H 2 Z"/>`;
}

function darioMass(): string {
  return `<path fill="#140c10" d="M -11 -108 H 11 V -78 H -11 Z M 8 -98 H 22 V -91 H 8 Z M -16 -80 Q -24 -40 -30 -6 H 30 Q 24 -40 16 -80 Z M -12 -20 H -3 V 0 H -12 Z M 3 -20 H 12 V 0 H 3 Z"/>`;
}

export function buildSamSheets(): Record<string, string> {
  const sky = STAGE.sky;
  const w = 1280;
  const h = 900;
  const poses: Array<[number, string, SamPose, number]> = [
    [110, 'IDLE', 'idle', 0.6],
    [300, 'WALK', 'walk', 0.18],
    [490, 'JUMP', 'jump', 0.18],
    [690, 'WIND-UP', 'windup', 0],
    [900, 'AERIAL', 'aerial', 0],
    [1110, 'KO', 'ko', 0],
  ];
  const row1 = poses
    .map(([x, text, pose, phase]) => cell(x, 300, pose, text, phase))
    .join('');
  const sheet = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${sky.top}"/>
      <stop offset="0.62" stop-color="${sky.bottom}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  <rect y="620" width="${w}" height="${h - 620}" fill="${STAGE.ground.mid}"/>
  <text x="36" y="48" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="28" font-weight="700" fill="${SAM.accent}">SAM</text>
  <text x="140" y="40" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="15" font-weight="700" fill="${SAM.ink}">Broad torso · short hair dome · open-collar taper</text>
  <text x="140" y="62" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="13" fill="${SAM.ink}">Match scale on Iris rust and sky. Original shapes. No marks.</text>
  ${swatch(36, 84, SAM.blazer, 'Blazer')}
  ${swatch(220, 84, SAM.shirt, 'Shirt')}
  ${swatch(390, 84, SAM.hair, 'Hair')}
  ${swatch(540, 84, SAM.accent, 'Gold')}
  ${row1}
  ${plateAboveIdle(110, 300)}
  ${cell(250, 560, 'smash', 'FORWARD CLOSE')}
  ${cell(560, 560, 'back', 'BACK SHRUG')}
  ${cell(870, 560, 'up', 'UP GAVEL')}
  <line x1="1080" y1="440" x2="1080" y2="560" stroke="${SAM.ink}" stroke-width="2"/>
  <text x="1092" y="506" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="12" font-weight="700" fill="${SAM.ink}">120px · 1/6 of 720</text>
  ${ground(202, 820, 96)}
  <g transform="translate(250 820)">${elonMass()}</g>
  ${label(250, 866, 'NOT ELON')}
  ${ground(512, 820, 96)}
  <g transform="translate(560 820)">${samPoseMarkup('idle', { silhouette: true })}</g>
  ${label(560, 866, 'SAM')}
  ${ground(822, 820, 96)}
  <g transform="translate(870 820)">${darioMass()}</g>
  ${label(870, 866, 'NOT DARIO')}
</svg>
`;

  const silW = 980;
  const silH = 420;
  const silhouette = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${silW}" height="${silH}" viewBox="0 0 ${silW} ${silH}">
  <rect width="${silW}" height="${silH}" fill="${STAGE.ground.mid}"/>
  <text x="36" y="42" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="18" font-weight="700" fill="${SAM.accent}">SAM silhouette — dome, shoulder shelf, taper</text>
  ${ground(120, 300, 120)}
  <g transform="translate(180 300)">${elonMass()}</g>
  ${label(180, 360, 'NOT ELON')}
  ${ground(420, 300, 140)}
  <g transform="translate(490 300)">${samPoseMarkup('idle', { silhouette: true })}</g>
  ${label(490, 360, 'SAM')}
  ${ground(740, 300, 140)}
  <g transform="translate(810 300)">${darioMass()}</g>
  ${label(810, 360, 'NOT DARIO')}
</svg>
`;
  return { 'sheet.svg': sheet, 'silhouette.svg': silhouette };
}

function swatch(x: number, y: number, fill: string, name: string): string {
  return (
    `<rect x="${x}" y="${y}" width="22" height="22" rx="4" fill="${fill}" stroke="${SAM.ink}" stroke-width="2"/>` +
    `<text x="${x + 30}" y="${y + 16}" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="12" font-weight="700" fill="${SAM.ink}">${name} ${fill}</text>`
  );
}
