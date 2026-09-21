import assert from 'node:assert/strict';
import { EMPTY_INTENT } from '../src/game/types.ts';
import type { Intent } from '../src/game/types.ts';
import { createMatch, stepMatch } from '../src/match/sim.ts';
import { formatPercent, hudPanelRect, hudPopScale, readHud } from '../src/render/hud.ts';
import { REST_CAMERA } from '../src/stage/camera.ts';
import { BLAST, PLATFORM, STOCKS, VIEW } from '../src/stage/layout.ts';

function intent(partial: Partial<Intent> = {}): Intent {
  return { ...EMPTY_INTENT, ...partial };
}

function restScreenY(worldY: number): number {
  return (worldY - REST_CAMERA.y) / REST_CAMERA.zoom + VIEW.h / 2;
}

const feet = restScreenY(PLATFORM.top);
const slabBottom = restScreenY(PLATFORM.top + PLATFORM.height);
const mid = VIEW.w / 2;

for (const slot of [0, 1] as const) {
  const panel = hudPanelRect(slot);
  assert.ok(panel.y >= slabBottom + 8, `slot ${slot} should sit below the slab`);
  assert.ok(panel.y >= feet + 80, `slot ${slot} should stay clear of fighter feet`);
  assert.ok(panel.y + panel.h <= VIEW.h, `slot ${slot} should stay on screen`);
  assert.ok(panel.x >= 0 && panel.x + panel.w <= VIEW.w);
  if (slot === 0) assert.ok(panel.x + panel.w < mid - 200, 'P1 panel should stay left of the midline');
  else assert.ok(panel.x > mid + 200, 'P2 panel should stay right of the midline');
}
assert.ok(hudPanelRect(0).x + hudPanelRect(0).w < hudPanelRect(1).x);

assert.equal(formatPercent(0), '0%');
assert.equal(formatPercent(14.9), '14%');
assert.equal(hudPopScale(0), 1);
assert.equal(hudPopScale(-0.2), 1);
assert.ok(hudPopScale(0.22) > 1.15);
assert.ok(hudPopScale(0.22) <= 1.2);

const idle = createMatch(['dario', 'sam'], ['human', 'cpu'], { intro: 0, seed: 1 });
idle.fighters[0].damage = 14.9;
idle.fighters[0].stocks = 2;
idle.fighters[1].damage = 80;
const idleHud = readHud(idle);
assert.equal(idleHud[0].damage, idle.fighters[0].damage);
assert.equal(idleHud[0].stocks, idle.fighters[0].stocks);
assert.equal(idleHud[0].damage, 14.9);
assert.equal(idleHud[0].stocks, 2);
assert.equal(formatPercent(idleHud[0].damage), '14%');
assert.equal(idleHud[0].side, 'P1');
assert.equal(idleHud[0].name, 'DARIO');
assert.equal(idleHud[0].fighterId, 'dario');
assert.equal(idleHud[1].side, 'CPU');
assert.equal(idleHud[1].name, 'SAM');
assert.equal(idleHud[1].damage, 80);
assert.equal(idleHud[1].stocks, STOCKS);
assert.equal(idleHud[0].stockCap, STOCKS);
assert.equal(idle.koLog.length, 0);
assert.equal(idle.fighters[0].damage, 14.9);

const live = createMatch(['elon', 'sam'], ['human', 'human'], { intro: 0, seed: 5 });
live.fighters[0].x = 600;
live.fighters[0].facing = 1;
live.fighters[1].x = 660;
live.fighters[1].facing = -1;
stepMatch(live, 1 / 60, [intent({ attackEdge: true, x: 1 }), intent()]);
for (let i = 0; i < 40 && live.fighters[1].damage === 0; i++) {
  stepMatch(live, 1 / 60, [intent(), intent()]);
}
assert.ok(live.fighters[1].damage > 0, 'smash should add fighter.damage');
const struck = readHud(live);
assert.equal(struck[1].damage, live.fighters[1].damage);
assert.equal(struck[1].stocks, live.fighters[1].stocks);
assert.equal(struck[1].stocks, STOCKS);
assert.equal(struck[1].flash, live.fighters[1].damageFlash);
assert.ok(struck[1].flash > 0, 'hit juice should still be on fighter.damageFlash');
assert.equal(struck[0].side, 'P1');
assert.equal(struck[1].side, 'P2');
assert.equal(live.koLog.length, 0);

const blasted = createMatch(['dario', 'elon'], ['human', 'human'], { intro: 0, seed: 7 });
blasted.fighters[0].x = BLAST.left - 30;
blasted.fighters[0].grounded = false;
stepMatch(blasted, 1 / 60, [intent(), intent()]);
const koHud = readHud(blasted);
assert.equal(koHud[0].stocks, blasted.fighters[0].stocks);
assert.equal(koHud[0].stocks, STOCKS - 1);
assert.equal(koHud[0].damage, blasted.fighters[0].damage);
assert.equal(koHud[0].koHold, true);
assert.equal(blasted.koLog.length, 1);
assert.equal(blasted.koLog[0].stocksRemaining, STOCKS - 1);

console.log('hud tests passed');
