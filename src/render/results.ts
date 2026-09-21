// End-of-match card. Reads the snapshot it is given. Does not seed a round.

import { STAGE } from '../../art/palette.ts';
import type { ResultChoice } from '../shell/results.ts';
import { resultAlpha, resultOffset } from '../shell/results.ts';
import { RESULT_BUTTONS, RESULT_CARD, type Rect } from '../shell/ui.ts';
import { STOCKS, VIEW } from '../stage/layout.ts';
import { damageColor, setFont } from './text.ts';

const CREAM = '#F6E7D4';
const INK = '#140C09';

export interface ResultPlate {
  tag: string;
  name: string;
  damage: number;
  stocks: number;
  accent: string;
  won: boolean;
}

export interface ResultOverlay {
  draw: boolean;
  winnerName: string | null;
  winnerTag: string | null;
  winnerAccent: string;
  plates: readonly [ResultPlate, ResultPlate];
  hover: ResultChoice | null;
  /** Seconds since the card became visible. Does not gate input. */
  age: number;
}

export function drawResultOverlay(ctx: CanvasRenderingContext2D, view: ResultOverlay): void {
  const alpha = resultAlpha(view.age);
  const dy = resultOffset(view.age);

  ctx.save();
  ctx.fillStyle = STAGE.blast.void;
  ctx.globalAlpha = alpha * 0.72;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  ctx.globalAlpha = alpha;
  ctx.translate(0, dy);
  drawCard(ctx, view);
  drawPlates(ctx, view);
  drawRematch(ctx, view);
  drawSecondary(ctx, view, 'change', 'CHANGE FIGHTER', 'ESC');
  drawSecondary(ctx, view, 'quit', 'QUIT', 'Q');
  hint(ctx, view);
  ctx.restore();
}

function drawCard(ctx: CanvasRenderingContext2D, view: ResultOverlay): void {
  const card = RESULT_CARD;
  ctx.fillStyle = STAGE.ground.lip;
  round(ctx, card.x + 8, card.y + 10, card.w, card.h, 14);
  ctx.fill();

  ctx.fillStyle = '#160E0C';
  round(ctx, card.x, card.y, card.w, card.h, 14);
  ctx.fill();

  ctx.save();
  round(ctx, card.x, card.y, card.w, card.h, 14);
  ctx.clip();
  ctx.fillStyle = view.winnerAccent;
  ctx.fillRect(card.x, card.y, card.w, 6);
  ctx.fillStyle = STAGE.ground.mid;
  ctx.fillRect(card.x, card.y + 6, card.w, 8);
  ctx.restore();

  ctx.lineWidth = 4;
  ctx.strokeStyle = CREAM;
  round(ctx, card.x, card.y, card.w, card.h, 14);
  ctx.stroke();

  const center = card.x + card.w / 2;
  const kicker = view.draw ? 'NO ONE LEFT' : 'HORIZON CLEARED';
  const headline = view.draw ? 'BOTH OUT' : (view.winnerName ?? 'THEY').toUpperCase();
  const sub = view.draw
    ? 'Both leave the stage.'
    : view.winnerTag === 'CPU'
      ? 'The CPU takes the slab.'
      : 'Takes the slab.';

  text(ctx, kicker, center, card.y + 46, 14, STAGE.sky.bottom, 700);
  text(ctx, headline, center + 3, card.y + 108, 52, 'rgba(20, 8, 6, 0.55)', 700);
  text(ctx, headline, center, card.y + 104, 52, view.draw ? CREAM : view.winnerAccent, 700);
  text(ctx, sub, center, card.y + 152, 18, CREAM, 600);
}

function drawPlates(ctx: CanvasRenderingContext2D, view: ResultOverlay): void {
  const plateH = 118;
  const plateY = RESULT_BUTTONS.rematch.y - 18 - plateH;
  const center = RESULT_CARD.x + RESULT_CARD.w / 2;
  text(ctx, 'AT THE BELL', center, plateY - 16, 12, STAGE.sky.bottom, 700);
  drawPlate(ctx, view.plates[0], RESULT_BUTTONS.change.x, plateY, RESULT_BUTTONS.change.w, plateH);
  drawPlate(ctx, view.plates[1], RESULT_BUTTONS.quit.x, plateY, RESULT_BUTTONS.quit.w, plateH);
}

function drawPlate(
  ctx: CanvasRenderingContext2D,
  plate: ResultPlate,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.fillStyle = plate.won ? 'rgba(246, 231, 212, 0.08)' : 'rgba(0, 0, 0, 0.28)';
  round(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.lineWidth = plate.won ? 3 : 1.5;
  ctx.strokeStyle = plate.won ? plate.accent : 'rgba(246, 231, 212, 0.28)';
  ctx.stroke();

  const cx = x + w / 2;
  const tag = plate.won ? `${plate.tag}  ·  TAKES IT` : plate.tag;
  text(ctx, tag, cx, y + 20, 12, plate.accent, 700);
  text(ctx, plate.name, cx, y + 42, 16, CREAM, 700);
  text(ctx, `${Math.floor(plate.damage)}%`, cx, y + 78, 32, damageColor(plate.damage), 700);
  if (plate.stocks <= 0) text(ctx, 'OUT', cx, y + 104, 13, '#FF5A4A', 700);
  else pips(ctx, cx, y + 104, plate.stocks, plate.accent);
}

function drawRematch(ctx: CanvasRenderingContext2D, view: ResultOverlay): void {
  const rect = RESULT_BUTTONS.rematch;
  const hot = view.hover === 'rematch';
  const pulse = 0.45 + Math.sin(view.age * 8) * 0.35;

  ctx.save();
  ctx.globalAlpha = resultAlpha(view.age) * pulse;
  ctx.lineWidth = 3;
  ctx.strokeStyle = view.winnerAccent;
  round(ctx, rect.x - 7, rect.y - 7, rect.w + 14, rect.h + 14, 12);
  ctx.stroke();
  ctx.restore();

  buttonShadow(ctx, rect);
  ctx.save();
  round(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.clip();
  ctx.fillStyle = hot ? '#FFF8F1' : CREAM;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = STAGE.rocket.ember;
  ctx.fillRect(rect.x, rect.y, 10, rect.h);
  ctx.restore();
  text(ctx, 'REMATCH', rect.x + rect.w / 2, rect.y + rect.h / 2 - 12, 28, INK, 700);
  text(ctx, 'ENTER  OR  SPACE', rect.x + rect.w / 2, rect.y + rect.h / 2 + 16, 13, '#5C3A28', 700);
}

function drawSecondary(
  ctx: CanvasRenderingContext2D,
  view: ResultOverlay,
  id: 'change' | 'quit',
  label: string,
  key: string,
): void {
  const rect = RESULT_BUTTONS[id];
  const hot = view.hover === id;
  buttonShadow(ctx, rect);
  ctx.fillStyle = hot ? STAGE.ground.top : STAGE.ground.lip;
  round(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fill();
  ctx.lineWidth = hot ? 3 : 1.5;
  ctx.strokeStyle = hot ? CREAM : 'rgba(246, 231, 212, 0.4)';
  ctx.stroke();
  text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 - 9, 15, CREAM, 700);
  text(ctx, key, rect.x + rect.w / 2, rect.y + rect.h / 2 + 12, 12, STAGE.sky.bottom, 700);
}

function hint(ctx: CanvasRenderingContext2D, view: ResultOverlay): void {
  const line = view.draw
    ? 'Enter or Space runs it back. Esc returns to picks.'
    : 'Same fighters. The next round starts clean.';
  text(ctx, line, RESULT_CARD.x + RESULT_CARD.w / 2, RESULT_BUTTONS.change.y + RESULT_BUTTONS.change.h + 28, 14, 'rgba(246, 231, 212, 0.72)', 600);
}

function pips(ctx: CanvasRenderingContext2D, x: number, y: number, stocks: number, accent: string): void {
  const step = 18;
  const start = x - ((STOCKS - 1) * step) / 2;
  for (let i = 0; i < STOCKS; i++) {
    ctx.beginPath();
    ctx.arc(start + i * step, y, 5, 0, Math.PI * 2);
    if (i < stocks) {
      ctx.fillStyle = accent;
      ctx.fill();
    } else {
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(246, 231, 212, 0.45)';
      ctx.stroke();
    }
  }
}

function buttonShadow(ctx: CanvasRenderingContext2D, rect: Rect): void {
  ctx.fillStyle = '#2A160F';
  round(ctx, rect.x + 5, rect.y + 6, rect.w, rect.h, 8);
  ctx.fill();
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
}

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight: number,
): void {
  setFont(ctx, size, weight);
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}
