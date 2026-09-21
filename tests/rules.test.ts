import assert from 'node:assert/strict';
import type { Intent, MatchState } from '../src/game/types.ts';
import { EMPTY_INTENT } from '../src/game/types.ts';
import {
  clearKoHistory,
  createMemoryStore,
  drainKoLog,
  KO_HISTORY_KEY,
  KO_HISTORY_LIMIT,
  loadKoHistory,
} from '../src/match/persist.ts';
import { readRematchState, requestRematch, STARTING_STOCKS } from '../src/match/rematch.ts';
import { createMatch, stepMatch } from '../src/match/sim.ts';
import { BLAST, PLATFORM, SPAWN, STOCKS } from '../src/stage/layout.ts';

function intent(partial: Partial<Intent> = {}): Intent {
  return { ...EMPTY_INTENT, ...partial };
}

function pump(state: MatchState, seconds: number): void {
  const dt = 1 / 60;
  const frames = Math.round(seconds * 60);
  for (let i = 0; i < frames; i++) stepMatch(state, dt, [intent(), intent()]);
}

assert.equal(STARTING_STOCKS, STOCKS);
assert.equal(STARTING_STOCKS, 3);

function peakTravel(startDamage: number): number {
  const state = createMatch(['elon', 'sam'], ['human', 'human'], { intro: 0, seed: 4 });
  state.fighters[0].x = 600;
  state.fighters[0].facing = 1;
  state.fighters[1].x = 660;
  state.fighters[1].facing = -1;
  state.fighters[1].damage = startDamage;
  stepMatch(state, 1 / 60, [intent({ attackEdge: true, x: 1 }), intent()]);
  let peak = 0;
  for (let i = 0; i < 70; i++) {
    stepMatch(state, 1 / 60, [intent(), intent()]);
    peak = Math.max(peak, Math.abs(state.fighters[1].x - 660));
    if (state.fighters[1].stocks < STARTING_STOCKS) break;
  }
  assert.ok(state.fighters[1].damage > startDamage, 'a hit adds percent on top of what they already had');
  return peak;
}

const lowTravel = peakTravel(0);
const highTravel = peakTravel(150);
assert.ok(highTravel > lowTravel + 40, `knockback should grow with percent (${highTravel} vs ${lowTravel})`);

clearKoHistory();
const match = createMatch(['dario', 'elon'], ['human', 'cpu'], { intro: 0, seed: 9 });
const firstId = match.matchId;
assert.equal(match.fighters[0].stocks, STARTING_STOCKS);
assert.equal(match.fighters[1].damage, 0);

function blast(slot: 0 | 1, damage: number): void {
  const fighter = match.fighters[slot];
  fighter.damage = damage;
  fighter.x = BLAST.left - 30;
  fighter.y = PLATFORM.top;
  fighter.grounded = false;
  fighter.vx = 0;
  fighter.vy = 0;
  fighter.koHold = false;
  fighter.out = false;
  fighter.held = false;
  fighter.respawnLock = 0;
  fighter.intangible = 0;
  stepMatch(match, 1 / 60, [intent(), intent()]);
}

const percents = [30, 80, 140];
for (let n = 0; n < percents.length; n++) {
  blast(1, percents[n]);
  const record = match.koLog[match.koLog.length - 1];
  assert.equal(match.fighters[1].stocks, STARTING_STOCKS - (n + 1));
  assert.equal(record.damageAtKo, percents[n]);
  assert.equal(record.stocksRemaining, STARTING_STOCKS - (n + 1));
  assert.equal(record.slot, 1);
  assert.equal(record.fighterId, 'elon');
  assert.equal(match.fighters[1].damage, percents[n]);
  if (n < percents.length - 1) {
    assert.equal(readRematchState(match).over, false);
    pump(match, 0.7);
    assert.equal(match.fighters[1].damage, 0);
    assert.equal(match.fighters[1].koHold, false);
    assert.equal(match.fighters[1].x, SPAWN[1]);
    assert.equal(match.fighters[1].y, PLATFORM.top);
    assert.equal(match.koLog.length, n + 1);
  }
}

assert.equal(match.winner, 0);
assert.equal(readRematchState(match).canRematch, false);
assert.equal(requestRematch(match, { intro: 0, seed: 3 }), false);
pump(match, 0.5);
assert.equal(match.koLog.length, 0);
assert.equal(match.fighters[1].out, true);
assert.equal(match.fighters[1].stocks, 0);
assert.equal(match.fighters[1].damage, 140);

const live = readRematchState(match);
assert.equal(live.over, true);
assert.equal(live.canRematch, true);
assert.equal(live.winner, 0);
assert.equal(live.draw, false);
assert.deepEqual(live.stocks, [STARTING_STOCKS, 0]);
assert.equal(live.damage[1], 140);

const history = loadKoHistory();
assert.equal(history.version, 1);
assert.equal(history.matches.length, 1);
const saved = history.matches[0];
assert.equal(saved.id, firstId);
assert.equal(saved.complete, true);
assert.equal(saved.stocksEach, STARTING_STOCKS);
assert.deepEqual(saved.fighters, ['dario', 'elon']);
assert.equal(saved.control[1], 'cpu');
assert.equal(saved.winner, 0);
assert.equal(saved.draw, false);
assert.equal(saved.kos.length, 3);
assert.equal(saved.kos[0].damageAtKo, 30);
assert.equal(saved.kos[0].stocksRemaining, 2);
assert.equal(saved.kos[2].damageAtKo, 140);
assert.equal(saved.kos[2].stocksRemaining, 0);
assert.ok(saved.kos[2].x < BLAST.left);

const winnerDamage = match.fighters[0].damage;
match.fighters[0].x = 600;
match.fighters[0].facing = 1;
match.fighters[1].x = 660;
match.fighters[1].out = false;
stepMatch(match, 1 / 60, [intent({ attackEdge: true, x: 1 }), intent()]);
pump(match, 0.5);
assert.equal(match.fighters[0].damage, winnerDamage);
assert.equal(match.fighters[1].damage, 140);
assert.equal(match.fighters[1].stocks, 0);

assert.equal(requestRematch(match, { intro: 0, seed: 11 }), true);
assert.equal(match.fighters[0].stocks, STARTING_STOCKS);
assert.equal(match.fighters[1].stocks, STARTING_STOCKS);
assert.equal(match.fighters[0].damage, 0);
assert.equal(match.fighters[1].damage, 0);
assert.equal(match.fighters[0].x, SPAWN[0]);
assert.equal(match.fighters[1].x, SPAWN[1]);
assert.equal(match.fighters[0].y, PLATFORM.top);
assert.equal(match.fighters[1].y, PLATFORM.top);
assert.equal(match.winner, null);
assert.equal(match.draw, false);
assert.equal(match.koLog.length, 0);
assert.equal(match.fighters[1].out, false);
assert.equal(readRematchState(match).over, false);
assert.notEqual(match.matchId, firstId);
assert.equal(loadKoHistory().matches.length, 1);

match.fighters[1].damage = 12;
assert.equal(requestRematch(match), false);
assert.equal(match.fighters[1].damage, 12);
assert.equal(match.fighters[1].stocks, STARTING_STOCKS);

match.koLog.push({
  slot: 0,
  fighterId: 'dario',
  stocksRemaining: 2,
  damageAtKo: 15,
  x: 1,
  y: 2,
});
const partial = drainKoLog(match);
assert.ok(partial);
assert.equal(partial.complete, false);
assert.equal(partial.winner, null);
assert.equal(partial.kos.length, 1);
assert.equal(partial.kos[0].damageAtKo, 15);
assert.equal(match.koLog.length, 0);
assert.equal(drainKoLog(match), null);

const store = createMemoryStore();
store.setItem(KO_HISTORY_KEY, '{not json');
assert.deepEqual(loadKoHistory(store), { version: 1, matches: [] });
for (let i = 0; i < KO_HISTORY_LIMIT + 3; i++) {
  const round = createMatch(['sam', 'dario'], ['human', 'human'], { intro: 0, seed: i + 1 });
  round.koLog.push({
    slot: 0,
    fighterId: 'sam',
    stocksRemaining: 2,
    damageAtKo: i,
    x: i,
    y: 4,
  });
  const wrote = drainKoLog(round, store);
  assert.ok(wrote);
  assert.equal(wrote.id, round.matchId);
}
const capped = loadKoHistory(store);
assert.equal(capped.matches.length, KO_HISTORY_LIMIT);
assert.equal(capped.matches[0].kos[0].damageAtKo, 3);
assert.equal(capped.matches[capped.matches.length - 1].kos[0].damageAtKo, KO_HISTORY_LIMIT + 2);
const raw = store.getItem(KO_HISTORY_KEY);
assert.ok(raw?.includes('"version":1'));

const both = createMatch(['elon', 'sam'], ['human', 'human'], { intro: 0, seed: 2 });
both.fighters[0].stocks = 1;
both.fighters[1].stocks = 1;
both.fighters[0].damage = 50;
both.fighters[1].damage = 60;
both.fighters[0].x = BLAST.left - 10;
both.fighters[1].x = BLAST.right + 10;
both.fighters[0].grounded = false;
both.fighters[1].grounded = false;
stepMatch(both, 1 / 60, [intent(), intent()]);
assert.equal(both.draw, true);
assert.equal(both.winner, null);
assert.equal(both.koLog.length, 2);
assert.equal(both.koLog[0].damageAtKo, 50);
assert.equal(both.koLog[1].stocksRemaining, 0);
pump(both, 0.5);
assert.equal(both.koLog.length, 0);
const drawSave = loadKoHistory().matches.find((entry) => entry.draw);
assert.ok(drawSave);
assert.equal(drawSave.complete, true);
assert.equal(drawSave.kos.length, 2);
assert.equal(requestRematch(both, { intro: 0, seed: 8 }), true);
assert.equal(both.draw, false);
assert.equal(both.fighters[0].stocks, STARTING_STOCKS);
assert.equal(both.fighters[1].damage, 0);

console.log('rules tests passed');
