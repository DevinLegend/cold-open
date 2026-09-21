// Lane: presentation. Shared menu geometry so clicks and drawing agree.

import { VIEW } from '../stage/layout.ts';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const START_BUTTON: Rect = { x: 470, y: 456, w: 340, h: 64 };

const CARD_W = 300;
const CARD_GAP = 28;
const CARD_X = (VIEW.w - (CARD_W * 3 + CARD_GAP * 2)) / 2;

export const CARDS: Rect[] = [0, 1, 2].map((i) => ({
  x: CARD_X + i * (CARD_W + CARD_GAP),
  y: 156,
  w: CARD_W,
  h: 430,
}));

export const MODE_ROWS: Rect[] = [
  { x: 330, y: 250, w: 620, h: 100 },
  { x: 330, y: 370, w: 620, h: 100 },
];

const RESULT_X = 290;
const RESULT_Y = 80;
const RESULT_W = 700;
const RESULT_INNER = 44;
const RESULT_BUTTON_W = RESULT_W - RESULT_INNER * 2;
const RESULT_HALF = (RESULT_BUTTON_W - 16) / 2;

export const RESULT_CARD: Rect = { x: RESULT_X, y: RESULT_Y, w: RESULT_W, h: 532 };

/** Rest positions. The card slides down by `resultOffset` while it eases in. */
export const RESULT_BUTTONS = {
  rematch: { x: RESULT_X + RESULT_INNER, y: RESULT_Y + 332, w: RESULT_BUTTON_W, h: 72 },
  change: { x: RESULT_X + RESULT_INNER, y: RESULT_Y + 418, w: RESULT_HALF, h: 52 },
  quit: { x: RESULT_X + RESULT_INNER + RESULT_HALF + 16, y: RESULT_Y + 418, w: RESULT_HALF, h: 52 },
} as const satisfies Record<'rematch' | 'change' | 'quit', Rect>;

export const PAUSE_CARD: Rect = { x: 390, y: 220, w: 500, h: 240 };
