// Contrast mock. Draws the current kits on the one-pager slab.
// Does not boot a match and does not restyle Elon, Dario, or Sam.

import '../style.css';
import { NAMEPLATE_SIZE } from '../../art/nameplates.ts';
import { STAGE } from '../../art/palette.ts';
import { drawFighter, drawShadow } from './draw.ts';
import { HUD_PLATE_SCALE, drawHudPlate, drawWorldBillboard } from '../render/nameplate.ts';
import { damageColor, setFont } from '../render/text.ts';
import { FIGHTER_IDS, ROSTER } from './roster.ts';
import {
  fighterInPose,
  POSE_LABEL,
  POSE_ORDER,
  type CheckPose,
} from './readabilityPose.ts';
import { liveSlabSize, READABILITY_FRAME, SIXTH } from './slabFrame.ts';
import { PLATFORM } from '../stage/layout.ts';
import type { Fighter, FighterId } from '../game/types.ts';

const stageQuery = document.querySelector<HTMLCanvasElement>('#stage');
const sheetQuery = document.querySelector<HTMLCanvasElement>('#sheet');
const captionQuery = document.querySelector<HTMLParagraphElement>('#stage-caption');
if (!stageQuery || !sheetQuery || !captionQuery) {
  throw new Error('Cold Open readability mock is missing its canvases.');
}
const stageCanvas: HTMLCanvasElement = stageQuery;
const sheetCanvas: HTMLCanvasElement = sheetQuery;
const caption: HTMLParagraphElement = captionQuery;

const SHEET_W = 1280;
const GUTTER = 96;
const HEADER = 46;
const CELL_H = 430;
const SHEET_H = HEADER + FIGHTER_IDS.length * CELL_H + 20;
const RIM = 5;
/** Room above the feet so Elena's world billboard stays on screen at zoom 1. */
const PLATE_HEADROOM = 214;
const SHEET_SCALE = SIXTH / ROSTER.elon.height;

function airLift(pose: CheckPose): number {
  if (pose === 'jump') return 64;
  if (pose === 'aerial') return 78;
  if (pose === 'tumble') return 56;
  return 0;
}

let pinned: CheckPose | 'cycle' = 'idle';
let cycleStarted = 0;
const requestedPose = new URLSearchParams(location.search).get('pose');
if (requestedPose === 'cycle') pinned = 'cycle';
else if (requestedPose && isCheckPose(requestedPose)) pinned = requestedPose;

const buttons = document.querySelectorAll<HTMLButtonElement>('[data-pose]');
for (const button of buttons) {
  button.addEventListener('click', () => {
    const pose = button.dataset.pose;
    if (pose === 'cycle' || isCheckPose(pose)) {
      pinned = pose === 'cycle' ? 'cycle' : pose;
      cycleStarted = performance.now();
      paintPressed();
    }
  });
}

window.addEventListener('keydown', (event) => {
  const index = Number(event.key) - 1;
  if (index >= 0 && index < POSE_ORDER.length) {
    pinned = POSE_ORDER[index];
    paintPressed();
  } else if (event.key === '0' || event.key === 'c' || event.key === 'C') {
    pinned = 'cycle';
    cycleStarted = performance.now();
    paintPressed();
  }
});

function isCheckPose(value: string | undefined): value is CheckPose {
  return POSE_ORDER.some((pose) => pose === value);
}

function paintPressed(): void {
  for (const button of buttons) {
    button.setAttribute('aria-pressed', String(button.dataset.pose === pinned));
  }
}

function activePose(now: number): CheckPose {
  if (pinned !== 'cycle') return pinned;
  const index = Math.floor((now - cycleStarted) / 1600) % POSE_ORDER.length;
  return POSE_ORDER[index];
}

function fit(canvas: HTMLCanvasElement, cssW: number, cssH: number): CanvasRenderingContext2D {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const nextW = Math.round(cssW * dpr);
  const nextH = Math.round(cssH * dpr);
  if (canvas.width !== nextW || canvas.height !== nextH) {
    canvas.width = nextW;
    canvas.height = nextH;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cold Open readability mock could not get a 2D context.');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function drawContact(
  ctx: CanvasRenderingContext2D,
  left: number,
  deckY: number,
  slabW: number,
  slabH: number,
): void {
  ctx.fillStyle = STAGE.ground.mid;
  ctx.fillRect(left, deckY + 18, slabW, slabH - 18);
  ctx.fillStyle = STAGE.ground.top;
  ctx.fillRect(left, deckY, slabW, 20);
  ctx.fillStyle = STAGE.ground.lip;
  ctx.fillRect(left, deckY + 16, slabW, 4);
  ctx.fillRect(left, deckY + slabH - 8, slabW, 8);
}

function drawPosed(
  ctx: CanvasRenderingContext2D,
  id: FighterId,
  pose: CheckPose,
  phase: number,
  feetX: number,
  feetY: number,
  deckY: number,
  slot: 0 | 1,
  unit: number,
): void {
  const fighter: Fighter = fighterInPose(id, pose, phase);
  fighter.slot = slot;
  fighter.facing = 1;
  ctx.save();
  ctx.translate(feetX, feetY);
  ctx.scale(unit, unit);
  fighter.x = 0;
  fighter.y = (deckY - feetY) / unit;
  drawShadow(ctx, fighter);
  fighter.y = 0;
  drawFighter(ctx, fighter);
  drawWorldBillboard(ctx, fighter);
  ctx.restore();
}

function drawStage(ctx: CanvasRenderingContext2D, pose: CheckPose, time: number): void {
  const slab = liveSlabSize();
  const lift = airLift(pose);
  const { w, h } = READABILITY_FRAME;
  const left = (w - slab.width) / 2;
  const feetY = PLATE_HEADROOM;
  const deckY = feetY + lift;

  ctx.fillStyle = STAGE.blast.void;
  ctx.fillRect(0, 0, w, h);

  const sky = ctx.createLinearGradient(0, 0, 0, deckY);
  sky.addColorStop(0, STAGE.sky.top);
  sky.addColorStop(0.2, STAGE.sky.bottom);
  sky.addColorStop(1, STAGE.sky.bottom);
  ctx.fillStyle = sky;
  ctx.fillRect(left, 0, slab.width, deckY);

  const airLine = deckY - slab.air;
  ctx.fillStyle = STAGE.sky.horizon;
  ctx.fillRect(left, deckY - 16, slab.width, 16);
  ctx.fillStyle = 'rgba(11, 10, 18, 0.55)';
  ctx.fillRect(left, airLine, slab.width, 2);

  drawContact(ctx, left, deckY, slab.width, slab.height);

  ctx.fillStyle = STAGE.blast.cyanRim;
  ctx.fillRect(left - RIM, 0, RIM, h);
  ctx.fillRect(left, deckY + slab.height, slab.width / 2, RIM);
  ctx.fillStyle = STAGE.blast.magentaRim;
  ctx.fillRect(left + slab.width, 0, RIM, h);
  ctx.fillRect(left + slab.width / 2, deckY + slab.height, slab.width / 2, RIM);

  const phase = pose === 'walk' || pose === 'idle' || pose === 'tumble' ? time : 0.2;
  const spots: Array<[FighterId, number, 0 | 1]> = [
    ['elon', 0.24, 0],
    ['sam', 0.5, 1],
    ['dario', 0.76, 0],
  ];
  for (const [id, t, slot] of spots) {
    drawPosed(ctx, id, pose, phase, left + slab.width * t, feetY, deckY, slot, 1);
  }

  const bracketX = left + 18;
  ctx.strokeStyle = STAGE.blast.void;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bracketX, feetY);
  ctx.lineTo(bracketX, feetY - SIXTH);
  ctx.moveTo(bracketX - 7, feetY);
  ctx.lineTo(bracketX + 7, feetY);
  ctx.moveTo(bracketX - 7, feetY - SIXTH);
  ctx.lineTo(bracketX + 7, feetY - SIXTH);
  ctx.stroke();
  ctx.font = '700 13px "Segoe UI", "Liberation Sans", "DejaVu Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = STAGE.blast.void;
  ctx.fillText('1/6', bracketX + 12, feetY - SIXTH / 2);

  ctx.textBaseline = 'top';
  ctx.font = '700 11px "Segoe UI", "Liberation Sans", "DejaVu Sans", sans-serif';
  ctx.fillStyle = STAGE.blast.cyanRim;
  ctx.fillText('CYAN', 14, 16);
  ctx.textAlign = 'right';
  ctx.fillStyle = STAGE.blast.magentaRim;
  ctx.fillText('MAGENTA', w - 14, 16);

  const under = deckY + slab.height + 28;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f4efe6';
  ctx.font = '700 18px "Segoe UI", "Liberation Sans", "DejaVu Sans", sans-serif';
  ctx.fillText(POSE_LABEL[pose].toUpperCase(), w / 2, under);
  ctx.font = '600 13px "Segoe UI", "Liberation Sans", "DejaVu Sans", sans-serif';
  ctx.fillText('Miles slab at zoom 1  ·  1.5 ref-heights of air marked  ·  blast rims', w / 2, under + 26);
  drawHudRepeat(ctx);
}

/** Screen-space repeat of the match % strip. Same painter and scale as the HUD. */
function drawHudRepeat(ctx: CanvasRenderingContext2D): void {
  const y = READABILITY_FRAME.h - 40;
  let x = 36;
  setFont(ctx, 28, 700);
  ctx.textAlign = 'left';
  ctx.fillStyle = damageColor(0);
  for (const id of FIGHTER_IDS) {
    const percent = '0%';
    const percentW = ctx.measureText(percent).width;
    ctx.fillText(percent, x, y);
    const plateW = NAMEPLATE_SIZE[id].w * HUD_PLATE_SCALE;
    drawHudPlate(ctx, id, x + percentW + 12 + plateW / 2, y);
    x += percentW + 12 + plateW + 28;
  }
}

function drawSheet(ctx: CanvasRenderingContext2D): void {
  const unit = SHEET_SCALE;
  ctx.fillStyle = STAGE.blast.void;
  ctx.fillRect(0, 0, SHEET_W, SHEET_H);
  const cellW = (SHEET_W - GUTTER) / POSE_ORDER.length;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 13px "Segoe UI", "Liberation Sans", "DejaVu Sans", sans-serif';
  ctx.fillStyle = '#f4efe6';
  POSE_ORDER.forEach((pose, column) => {
    ctx.fillText(POSE_LABEL[pose].toUpperCase(), GUTTER + cellW * column + cellW / 2, 24);
  });

  FIGHTER_IDS.forEach((id, row) => {
    const def = ROSTER[id];
    const rowY = HEADER + row * CELL_H;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '700 15px "Segoe UI", "Liberation Sans", "DejaVu Sans", sans-serif';
    ctx.fillStyle = def.accent;
    ctx.fillText(def.short, 16, rowY + 28);

    POSE_ORDER.forEach((pose, column) => {
      const x = GUTTER + column * cellW;
      const phase = pose === 'walk' ? Math.PI / 16 : pose === 'tumble' ? 0.7 : 0.2;
      const feetX = x + cellW / 2;
      const floorY = rowY + CELL_H - 28;
      const feetY = floorY - airLift(pose) * unit;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 4, rowY + 4, cellW - 8, CELL_H - 8);
      ctx.clip();

      const backdrop = ctx.createLinearGradient(0, rowY, 0, floorY);
      backdrop.addColorStop(0, STAGE.sky.top);
      backdrop.addColorStop(0.22, STAGE.sky.bottom);
      backdrop.addColorStop(1, STAGE.sky.bottom);
      ctx.fillStyle = backdrop;
      ctx.fillRect(x, rowY, cellW, CELL_H);
      ctx.fillStyle = STAGE.sky.horizon;
      ctx.fillRect(x, floorY - 14, cellW, 14);
      drawContact(ctx, x, floorY, cellW, rowY + CELL_H - floorY);
      drawPosed(ctx, id, pose, phase, feetX, feetY, floorY, row === 1 ? 1 : 0, unit);
      ctx.restore();
    });
  });
}

function writeCaption(pose: CheckPose): void {
  const slab = liveSlabSize();
  caption.textContent = `${POSE_LABEL[pose]}. Slab ${slab.width.toFixed(0)}×${slab.height.toFixed(0)} matches the live platform (${PLATFORM.left.toFixed(0)}–${PLATFORM.right.toFixed(0)}). Air mark is ${slab.air.toFixed(0)}px, 1.5 reference heights. Elon is ${ROSTER.elon.height}px here; the bracket is ${SIXTH.toFixed(0)}px. Elon, Sam, and Dario are their kits. Sam is gold on navy.`;
  caption.dataset.ready = '1';
}

function frame(now: number): void {
  const pose = activePose(now);
  const stage = fit(stageCanvas, READABILITY_FRAME.w, READABILITY_FRAME.h);
  const sheet = fit(sheetCanvas, SHEET_W, SHEET_H);
  drawStage(stage, pose, now / 1000);
  drawSheet(sheet);
  writeCaption(pose);
  requestAnimationFrame(frame);
}

paintPressed();
requestAnimationFrame(frame);
