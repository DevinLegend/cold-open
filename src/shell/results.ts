// Rematch UI decisions only. The round seed is requestRematch / startRematch.
// This module does not read or write fighter damage, stocks, koLog, or KO history.

import { RESULT_BUTTONS, type Rect } from './ui.ts';

export type ResultChoice = 'rematch' | 'change' | 'quit';

/** Slide and fade finish together. Input is live from the first frame. */
export const RESULT_REVEAL = 0.18;
export const RESULT_SLIDE = 32;

export interface ResultKeys {
  confirm: boolean;
  back: boolean;
  quitKey: boolean;
  click: ResultChoice | null;
}

/** Enter and Space always rematch. Attack keys do not, so a late smash does not skip the card. */
export function rematchPressed(isEdge: (code: string) => boolean): boolean {
  return isEdge('Enter') || isEdge('Space');
}

export function quitPressed(isEdge: (code: string) => boolean): boolean {
  return isEdge('KeyQ');
}

/**
 * Confirm wins over every other key on the same frame.
 * Back is the stub's Esc / Backspace path to fighter picks.
 */
export function chooseResult(input: ResultKeys): ResultChoice | null {
  if (input.confirm || input.click === 'rematch') return 'rematch';
  if (input.back || input.click === 'change') return 'change';
  if (input.quitKey || input.click === 'quit') return 'quit';
  return null;
}

export function resultAlpha(age: number): number {
  const t = reveal(age);
  return 0.2 + 0.8 * t;
}

export function resultOffset(age: number): number {
  const t = reveal(age);
  const ease = 1 - (1 - t) ** 3;
  return (1 - ease) * RESULT_SLIDE;
}

export function resultTarget(point: { x: number; y: number }, age: number): ResultChoice | null {
  const dy = resultOffset(age);
  const order: readonly ResultChoice[] = ['rematch', 'change', 'quit'];
  for (const id of order) {
    if (hit(point, RESULT_BUTTONS[id], dy)) return id;
  }
  return null;
}

function reveal(age: number): number {
  return Math.min(1, Math.max(0, age) / RESULT_REVEAL);
}

function hit(point: { x: number; y: number }, rect: Rect, dy: number): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.w &&
    point.y >= rect.y + dy &&
    point.y <= rect.y + dy + rect.h
  );
}
