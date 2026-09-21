// Lane: match. Lifecycle the results UI can bind. No buttons, overlays, or HUD.
//
// Public surface:
//   Starting stocks — STARTING_STOCKS, the one constant `STOCKS` in src/stage/layout.ts (3).
//   Read — readRematchState(match) → { over, canRematch, winner, draw, stocks, damage }.
//   Rematch — requestRematch(match) once canRematch is true.
//             startRematch(match) resets even if the match is still going.
//   Both reset stocks, percent, positions, winner/draw, and koLog.
//   Persist — drainKoLog writes KO_HISTORY_KEY. See src/match/persist.ts.
// HUD keeps reading fighter.damage and fighter.stocks. This module does not draw.

import type { MatchState } from '../game/types.ts';
import { STOCKS } from '../stage/layout.ts';
import { drainKoLog, type KeyValueStore } from './persist.ts';
import { createMatch, type MatchOptions } from './sim.ts';

/** Alias of `STOCKS`. Fighters spawn with this many stocks. */
export const STARTING_STOCKS = STOCKS;

export interface RematchState {
  /** A side has no stocks left, or both do (draw). Combat already ignores input. */
  over: boolean;
  /** Results UI may call requestRematch. False during the KO hitstop. */
  canRematch: boolean;
  winner: 0 | 1 | null;
  draw: boolean;
  stocks: [number, number];
  /** Live percents. Same numbers the HUD reads from fighter.damage. */
  damage: [number, number];
}

export function isMatchOver(state: MatchState): boolean {
  return state.winner !== null || state.draw;
}

export function readRematchState(state: MatchState): RematchState {
  const over = isMatchOver(state);
  return {
    over,
    canRematch: over && state.hitstop <= 0,
    winner: state.winner,
    draw: state.draw,
    stocks: [state.fighters[0].stocks, state.fighters[1].stocks],
    damage: [state.fighters[0].damage, state.fighters[1].damage],
  };
}

/**
 * Archive any KOs still in `koLog`, then start a fresh round on the same match object.
 * Stocks, percent, positions, camera, winner, and koLog all come from createMatch.
 */
export function startRematch(
  state: MatchState,
  options: MatchOptions = {},
  store?: KeyValueStore,
): void {
  drainKoLog(state, store);
  const fresh = createMatch(
    [state.fighters[0].id, state.fighters[1].id],
    [state.control[0], state.control[1]],
    {
      seed: options.seed ?? remixSeed(state),
      intro: options.intro ?? 0.4,
    },
  );
  Object.assign(state, fresh);
}

/**
 * Rematch entry point for the results UI.
 * No-op until the match is over and the KO hitstop has finished.
 */
export function requestRematch(
  state: MatchState,
  options: MatchOptions = {},
  store?: KeyValueStore,
): boolean {
  if (!readRematchState(state).canRematch) return false;
  startRematch(state, options, store);
  return true;
}

function remixSeed(state: MatchState): number {
  const mixed = (Date.now() ^ Math.floor(state.time * 1000) ^ (state.fighters[0].damage * 13)) >>> 0;
  return mixed === 0 ? 1 : mixed;
}
