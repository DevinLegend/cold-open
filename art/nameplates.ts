// Art lane. Arcade nameplates: ELON / SAM / DARIO.
// Geometry here is the source for the SVG plates in art/nameplates/.
// Teal on charcoal, gold on navy, mint on slate. No corporation wordmarks.

import { FIGHTERS, STAGE, type FighterId } from './palette.ts';
import { GLYPHS, GLYPH_COLS, GLYPH_ROWS } from './glyphs.ts';

export const NAMEPLATE_LABELS = {
  elon: 'ELON',
  sam: 'SAM',
  dario: 'DARIO',
} as const satisfies Record<FighterId, string>;

/** Pixel size of one glyph cell. */
export const CELL = 8;
/** Gap between letters, in pixels. */
export const LETTER_GAP = 6;
/** Accent rail on the left edge of the plate. */
export const RAIL = 10;
export const PAD_X = 18;
export const PAD_Y = 16;
export const BORDER = 4;
/** Hard offset so the letters stay chunky on the plate. */
export const INK_OFFSET = 2;

export interface PlateRect {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
}

export interface NameplateGeometry {
  id: FighterId;
  label: string;
  w: number;
  h: number;
  rects: readonly PlateRect[];
}

export function nameplateSize(label: string): { w: number; h: number } {
  const inner =
    label.length * GLYPH_COLS * CELL + Math.max(0, label.length - 1) * LETTER_GAP;
  return {
    w: RAIL + PAD_X + inner + PAD_X,
    h: PAD_Y + GLYPH_ROWS * CELL + PAD_Y,
  };
}

export const NAMEPLATE_SIZE = {
  elon: nameplateSize(NAMEPLATE_LABELS.elon),
  sam: nameplateSize(NAMEPLATE_LABELS.sam),
  dario: nameplateSize(NAMEPLATE_LABELS.dario),
} as const;

function glyph(ch: string): readonly string[] {
  const rows = GLYPHS[ch];
  if (!rows || rows.length !== GLYPH_ROWS || rows.some((row) => row.length !== GLYPH_COLS)) {
    throw new Error(`No nameplate glyph for ${ch}`);
  }
  return rows;
}

/** Plate chrome plus pixel letters. Origin is the plate's top-left. */
export function nameplateRects(id: FighterId): NameplateGeometry {
  const label = NAMEPLATE_LABELS[id];
  const colors = FIGHTERS[id];
  const { w, h } = nameplateSize(label);
  const frame: PlateRect[] = [
    { x: 0, y: 0, w, h, fill: colors.accent },
    {
      x: RAIL,
      y: BORDER,
      w: w - RAIL - BORDER,
      h: h - BORDER * 2,
      fill: colors.body,
    },
  ];

  const originX = RAIL + PAD_X;
  const originY = PAD_Y;
  const shadows: PlateRect[] = [];
  const ink: PlateRect[] = [];

  for (let i = 0; i < label.length; i++) {
    const rows = glyph(label[i]);
    const ox = originX + i * (GLYPH_COLS * CELL + LETTER_GAP);
    rows.forEach((row, ry) => {
      for (let cx = 0; cx < row.length; cx++) {
        if (row[cx] !== '#') continue;
        const x = ox + cx * CELL;
        const y = originY + ry * CELL;
        shadows.push({
          x: x + INK_OFFSET,
          y: y + INK_OFFSET,
          w: CELL,
          h: CELL,
          fill: STAGE.blast.void,
        });
        ink.push({ x, y, w: CELL, h: CELL, fill: colors.accent });
      }
    });
  }

  return { id, label, w, h, rects: [...frame, ...shadows, ...ink] };
}

/**
 * Draw one plate centered at (`cx`, `cy`). World or screen pixels, caller's choice.
 * Returns the plate size so a HUD can stack stocks under it.
 */
export function paintNameplate(
  ctx: CanvasRenderingContext2D,
  id: FighterId,
  cx: number,
  cy: number,
): { w: number; h: number } {
  const plate = nameplateRects(id);
  const left = Math.round(cx - plate.w / 2);
  const top = Math.round(cy - plate.h / 2);
  ctx.save();
  for (const rect of plate.rects) {
    ctx.fillStyle = rect.fill;
    ctx.fillRect(left + rect.x, top + rect.y, rect.w, rect.h);
  }
  ctx.restore();
  return { w: plate.w, h: plate.h };
}
