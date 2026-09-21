// Lane: presentation. Title, mode, fighter pick, pause, and result cards.

import type { FighterId } from '../game/types.ts';
import { drawFighter, drawShadow } from '../fighters/draw.ts';
import { FIGHTER_IDS, ROSTER } from '../fighters/roster.ts';
import { spawnFighter } from '../fighters/spawn.ts';
import { P1_LABEL, P2_LABEL } from '../input/bindings.ts';
import { REST_CAMERA } from '../stage/camera.ts';
import { VIEW } from '../stage/layout.ts';
import { drawWorld } from './frame.ts';
import { setFont } from './text.ts';
import { CARDS, MODE_ROWS, PAUSE_CARD, START_BUTTON, type Rect } from '../shell/ui.ts';

export type Mode = 'cpu' | 'local';

function panel(ctx: CanvasRenderingContext2D, rect: Rect, hot: boolean, accent = '#E7B089'): void {
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 18);
  ctx.fillStyle = hot ? 'rgba(32, 14, 10, 0.9)' : 'rgba(14, 7, 6, 0.74)';
  ctx.fill();
  ctx.lineWidth = hot ? 3 : 1.5;
  ctx.strokeStyle = hot ? accent : 'rgba(246, 231, 212, 0.28)';
  ctx.stroke();
}

export function drawTitle(ctx: CanvasRenderingContext2D, time: number, hoverStart: boolean): void {
  drawWorld(ctx, REST_CAMERA, time, null);
  setFont(ctx, 14, 700);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(246, 231, 212, 0.7)';
  ctx.fillText('A FLAT STAGE', VIEW.w / 2, 168);

  setFont(ctx, 92, 700);
  ctx.fillStyle = 'rgba(20, 8, 6, 0.45)';
  ctx.fillText('COLD OPEN', VIEW.w / 2 + 4, 248);
  ctx.fillStyle = '#F6E7D4';
  ctx.fillText('COLD OPEN', VIEW.w / 2, 244);

  setFont(ctx, 20, 600);
  ctx.fillStyle = '#F0C7A4';
  ctx.fillText('The edges do not negotiate.', VIEW.w / 2, 318);

  panel(ctx, START_BUTTON, hoverStart, '#F0C7A4');
  setFont(ctx, 22, 700);
  ctx.fillStyle = '#F6E7D4';
  ctx.fillText('ENTER  —  START', VIEW.w / 2, START_BUTTON.y + START_BUTTON.h / 2);

  setFont(ctx, 15, 600);
  ctx.fillStyle = 'rgba(246, 231, 212, 0.82)';
  ctx.textAlign = 'left';
  ctx.fillText(`P1    ${P1_LABEL}`, 64, 660);
  ctx.textAlign = 'right';
  ctx.fillText(`P2    ${P2_LABEL}`, VIEW.w - 64, 660);
  ctx.textAlign = 'center';
  setFont(ctx, 13, 600);
  ctx.fillStyle = 'rgba(246, 231, 212, 0.55)';
  ctx.fillText('J smashes. H grabs. L dodges. Jump again, then again, to recover.', VIEW.w / 2, 692);
}

export function drawMode(ctx: CanvasRenderingContext2D, time: number, index: number): void {
  drawWorld(ctx, REST_CAMERA, time, null);
  setFont(ctx, 42, 700);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#F6E7D4';
  ctx.fillText('WHO IS FIGHTING', VIEW.w / 2, 150);
  setFont(ctx, 16, 600);
  ctx.fillStyle = '#E7B089';
  ctx.fillText('Same keyboard either way. Esc steps back.', VIEW.w / 2, 196);

  const rows: Array<{ title: string; body: string }> = [
    { title: 'Versus CPU', body: 'You pick both tempers. The other one fights back.' },
    { title: 'Local versus', body: 'Two players. P1 on the left keys, P2 on the arrows.' },
  ];
  rows.forEach((row, i) => {
    const hot = index === i;
    panel(ctx, MODE_ROWS[i], hot);
    ctx.textAlign = 'left';
    setFont(ctx, 26, 700);
    ctx.fillStyle = '#F6E7D4';
    ctx.fillText(row.title, MODE_ROWS[i].x + 28, MODE_ROWS[i].y + 38);
    setFont(ctx, 16, 600);
    ctx.fillStyle = '#E7B089';
    ctx.fillText(row.body, MODE_ROWS[i].x + 28, MODE_ROWS[i].y + 70);
  });
}

export function drawSelect(
  ctx: CanvasRenderingContext2D,
  time: number,
  cursor: number,
  picks: [FighterId | null, FighterId | null],
  mode: Mode,
  picking: 0 | 1,
): void {
  drawWorld(ctx, REST_CAMERA, time, null);
  const who = picking === 0 ? 'P1' : mode === 'cpu' ? 'CPU' : 'P2';
  setFont(ctx, 32, 700);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#F6E7D4';
  ctx.fillText(`${who}  CHOOSES`, VIEW.w / 2, 78);
  setFont(ctx, 15, 600);
  ctx.fillStyle = '#E7B089';
  ctx.fillText('A / D or arrows. Enter locks the pick. Esc steps back.', VIEW.w / 2, 116);

  CARDS.forEach((card, i) => {
    const id = FIGHTER_IDS[i];
    const def = ROSTER[id];
    const hot = cursor === i;
    panel(ctx, card, hot, def.accent);
    ctx.fillStyle = def.accent;
    ctx.fillRect(card.x + 18, card.y + 16, card.w - 36, 4);

    ctx.textAlign = 'center';
    setFont(ctx, 22, 700);
    ctx.fillStyle = '#F6E7D4';
    ctx.fillText(def.name, card.x + card.w / 2, card.y + 48);
    setFont(ctx, 14, 600);
    ctx.fillStyle = def.accent;
    ctx.fillText(def.temper, card.x + card.w / 2, card.y + 76);

    const tags: string[] = [];
    if (picks[0] === id) tags.push('P1');
    if (picks[1] === id) tags.push(mode === 'cpu' ? 'CPU' : 'P2');
    if (tags.length > 0) {
      setFont(ctx, 13, 700);
      ctx.fillStyle = '#F6E7D4';
      ctx.fillText(tags.join('  ·  '), card.x + card.w / 2, card.y + 104);
    }

    const preview = spawnFighter(0, id, 0, 0);
    preview.anim = time + i;
    ctx.save();
    ctx.translate(card.x + card.w / 2, card.y + 360);
    ctx.scale(1.45, 1.45);
    drawShadow(ctx, preview);
    drawFighter(ctx, preview);
    ctx.restore();
  });
}

export function drawPause(ctx: CanvasRenderingContext2D): void {
  dim(ctx);
  panel(ctx, PAUSE_CARD, true);
  ctx.textAlign = 'center';
  setFont(ctx, 36, 700);
  ctx.fillStyle = '#F6E7D4';
  ctx.fillText('PAUSED', VIEW.w / 2, PAUSE_CARD.y + 78);
  setFont(ctx, 18, 600);
  ctx.fillStyle = '#E7B089';
  ctx.fillText('Enter or Esc resumes', VIEW.w / 2, PAUSE_CARD.y + 132);
  ctx.fillText('Backspace returns to picks', VIEW.w / 2, PAUSE_CARD.y + 168);
}

function dim(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(8, 3, 2, 0.45)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
}
