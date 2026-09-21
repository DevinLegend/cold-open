import assert from 'node:assert/strict';
import { profileFor } from '../src/combat/attacks.ts';
import { inBlast, overlap } from '../src/combat/hit.ts';
import { EMPTY_INTENT } from '../src/game/types.ts';
import type { AttackKind, FighterId, Intent } from '../src/game/types.ts';
import { createMatch, stepMatch } from '../src/match/sim.ts';
import { REST_CAMERA } from '../src/stage/camera.ts';
import { collisionSolids, ROCKETS_COLLIDE } from '../src/stage/collision.ts';
import {
  BLAST,
  PLATFORM,
  REF_FIGHTER_HEIGHT,
  REF_FIGHTER_WIDTH,
  SLAB_FIGHTER_WIDTHS,
  SLAB_THICKNESS_FH,
  SPAWN,
  STOCKS,
  VIEW,
} from '../src/stage/layout.ts';
import { ROSTER } from '../src/fighters/roster.ts';

function intent(partial: Partial<Intent> = {}): Intent {
  return { ...EMPTY_INTENT, ...partial };
}

function pump(
  state: ReturnType<typeof createMatch>,
  seconds: number,
  make: (frame: number) => [Intent, Intent],
): void {
  const dt = 1 / 60;
  const frames = Math.round(seconds * 60);
  for (let i = 0; i < frames; i++) stepMatch(state, dt, make(i));
}

assert.equal(STOCKS, 3);
assert.ok(SPAWN[0] > PLATFORM.left && SPAWN[0] < PLATFORM.right);
assert.ok(SPAWN[1] > PLATFORM.left && SPAWN[1] < PLATFORM.right);
assert.ok(BLAST.left < PLATFORM.left);
assert.ok(BLAST.right > PLATFORM.right);
assert.ok(BLAST.bottom > PLATFORM.top);
assert.equal(inBlast(SPAWN[0], PLATFORM.top), false);
assert.equal(inBlast(BLAST.left - 1, PLATFORM.top), true);
assert.equal(inBlast(SPAWN[0], -4000), false, 'no ceiling blast');
assert.equal(inBlast(SPAWN[0], BLAST.bottom + 1), true);

const slabWidth = PLATFORM.right - PLATFORM.left;
const widths = slabWidth / REF_FIGHTER_WIDTH;
assert.ok(widths >= 18 && widths <= 22, `slab should be 18–22 fighter-widths, got ${widths}`);
assert.equal(SLAB_FIGHTER_WIDTHS, 20);
assert.ok(Math.abs(PLATFORM.height / REF_FIGHTER_HEIGHT - SLAB_THICKNESS_FH) < 0.02);
assert.equal(PLATFORM.top, 518);
assert.equal(ROCKETS_COLLIDE, false);
assert.equal(collisionSolids().length, 1);
const solid = collisionSolids()[0];
assert.equal(solid.x, PLATFORM.left);
assert.equal(solid.y, PLATFORM.top);
assert.equal(solid.w, slabWidth);
assert.equal(solid.h, PLATFORM.height);

const viewTop = REST_CAMERA.y - (VIEW.h * REST_CAMERA.zoom) / 2;
const viewBottom = REST_CAMERA.y + (VIEW.h * REST_CAMERA.zoom) / 2;
const viewLeft = REST_CAMERA.x - (VIEW.w * REST_CAMERA.zoom) / 2;
const viewRight = REST_CAMERA.x + (VIEW.w * REST_CAMERA.zoom) / 2;
assert.ok(viewLeft <= PLATFORM.left && viewRight >= PLATFORM.right, 'rest camera shows the full slab');
assert.ok(viewTop <= PLATFORM.top - REF_FIGHTER_HEIGHT * 1.5, 'rest camera keeps 1.5 FH of air');
assert.ok(viewBottom >= PLATFORM.top + PLATFORM.height + 48, 'rest camera shows the pit rim');
assert.equal(overlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 9, w: 4, h: 4 }), true);
assert.equal(overlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 12, y: 0, w: 4, h: 4 }), false);

const smash = profileFor('elon', 'forwardSmash');
const aerial = profileFor('dario', 'forwardAerial');
assert.equal(smash.kind, 'forwardSmash');
assert.equal(aerial.kind, 'forwardAerial');
assert.ok(smash.damage > aerial.damage);

const walk = createMatch(['sam', 'dario'], ['human', 'human'], { intro: 0, seed: 2 });
const origin = walk.fighters[0].x;
pump(walk, 0.4, () => [intent({ x: 1 }), intent()]);
assert.ok(walk.fighters[0].x > origin + 20, 'walk should move P1 right');

const jump = createMatch(['elon', 'sam'], ['human', 'human'], { intro: 0, seed: 3 });
stepMatch(jump, 1 / 60, [intent({ jumpEdge: true, jumpHeld: true }), intent()]);
pump(jump, 0.2, () => [intent({ jumpHeld: true }), intent()]);
assert.ok(jump.fighters[0].y < PLATFORM.top - 20, 'full hop should leave the slab');
assert.equal(jump.fighters[0].grounded, false);
assert.equal(jump.fighters[0].jumpsLeft, 1);
const beforeSecond = jump.fighters[0].vy;
stepMatch(jump, 1 / 60, [intent({ jumpEdge: true, jumpHeld: true }), intent()]);
assert.ok(jump.fighters[0].vy < beforeSecond, 'second jump should add upward speed');
assert.equal(jump.fighters[0].jumpsLeft, 0);

const air = createMatch(['sam', 'elon'], ['human', 'human'], { intro: 0, seed: 4 });
air.fighters[0].grounded = false;
air.fighters[0].y = PLATFORM.top - 80;
air.fighters[0].jumpsLeft = 0;
stepMatch(air, 1 / 60, [intent({ attackEdge: true }), intent()]);
assert.equal(air.fighters[0].attack?.kind, 'forwardAerial');

const safe = createMatch(['elon', 'sam'], ['human', 'human'], { intro: 0, seed: 5 });
safe.fighters[0].x = 600;
safe.fighters[0].facing = 1;
safe.fighters[1].x = 660;
safe.fighters[1].facing = -1;
stepMatch(safe, 1 / 60, [intent({ attackEdge: true, x: 1 }), intent()]);
pump(safe, 2.2, () => [intent(), intent()]);
assert.equal(safe.fighters[1].damage, smash.damage);
assert.equal(safe.fighters[1].stocks, STOCKS);
assert.equal(inBlast(safe.fighters[1].x, safe.fighters[1].y), false);

const lethal = createMatch(['elon', 'sam'], ['human', 'human'], { intro: 0, seed: 6 });
lethal.fighters[0].x = 600;
lethal.fighters[0].facing = 1;
lethal.fighters[1].x = 660;
lethal.fighters[1].damage = 210;
lethal.fighters[1].facing = -1;
stepMatch(lethal, 1 / 60, [intent({ attackEdge: true, x: 1 }), intent()]);
pump(lethal, 3, () => [intent(), intent()]);
assert.equal(lethal.fighters[1].stocks, STOCKS - 1);
assert.equal(lethal.fighters[1].damage, 0);
assert.ok(lethal.fighters[1].x > PLATFORM.left && lethal.fighters[1].x < PLATFORM.right);

const direct = createMatch(['dario', 'elon'], ['human', 'human'], { intro: 0, seed: 7 });
direct.fighters[0].x = BLAST.left - 30;
direct.fighters[0].grounded = false;
stepMatch(direct, 1 / 60, [intent(), intent()]);
assert.equal(direct.fighters[0].stocks, STOCKS - 1);
pump(direct, 0.6, () => [intent(), intent()]);
assert.equal(direct.fighters[0].damage, 0);
assert.equal(direct.fighters[0].koHold, false);

const cpu = createMatch(['elon', 'dario'], ['cpu', 'cpu'], { intro: 0, seed: 8 });
pump(cpu, 8, () => [intent(), intent()]);
assert.ok(cpu.fighters[0].stocks >= 0 && cpu.fighters[0].stocks <= STOCKS);
assert.ok(cpu.fighters[1].stocks >= 0 && cpu.fighters[1].stocks <= STOCKS);

assert.equal(direct.koLog.length, 1);
assert.equal(direct.koLog[0].slot, 0);
assert.equal(direct.koLog[0].stocksRemaining, STOCKS - 1);
assert.equal(direct.koLog[0].damageAtKo, 0);
assert.ok(lethal.koLog.length >= 1);
assert.ok(lethal.koLog[0].damageAtKo > 200);

const kinds: AttackKind[] = [
  'forwardSmash',
  'backSmash',
  'downSmash',
  'upSmash',
  'forwardAerial',
  'backAerial',
  'downAerial',
  'upAerial',
  'grab',
  'throwForward',
  'throwBack',
  'throwUp',
  'throwDown',
  'upSpecial',
];
for (const id of ['elon', 'sam', 'dario'] as const) {
  for (const kind of kinds) {
    const profile = profileFor(id, kind);
    assert.equal(profile.kind, kind);
    assert.ok(profile.hit.w > 0 && profile.hit.h > 0);
  }
}

function swing(id: FighterId, grounded: boolean, partial: Partial<Intent>): AttackKind | undefined {
  const state = createMatch([id, 'sam'], ['human', 'human'], { intro: 0, seed: 11 });
  state.fighters[0].facing = 1;
  if (!grounded) {
    state.fighters[0].grounded = false;
    state.fighters[0].y = PLATFORM.top - 90;
    state.fighters[0].jumpsLeft = 1;
  }
  stepMatch(state, 1 / 60, [intent({ attackEdge: true, ...partial }), intent()]);
  return state.fighters[0].attack?.kind;
}

for (const id of ['elon', 'sam', 'dario'] as const) {
  assert.equal(swing(id, true, { x: 1 }), 'forwardSmash');
  assert.equal(swing(id, true, { x: -1 }), 'backSmash');
  assert.equal(swing(id, true, { y: 1 }), 'downSmash');
  assert.equal(swing(id, true, { y: -1 }), 'upSmash');
  assert.equal(swing(id, false, {}), 'forwardAerial');
  assert.equal(swing(id, false, { x: -1 }), 'backAerial');
  assert.equal(swing(id, false, { y: 1 }), 'downAerial');
  assert.equal(swing(id, false, { y: -1 }), 'upAerial');
  const grab = createMatch([id, 'sam'], ['human', 'human'], { intro: 0, seed: 12 });
  stepMatch(grab, 1 / 60, [intent({ grabEdge: true }), intent()]);
  assert.equal(grab.fighters[0].attack?.kind, 'grab');
}

const back = createMatch(['elon', 'sam'], ['human', 'human'], { intro: 0, seed: 13 });
back.fighters[0].x = 700;
back.fighters[0].facing = 1;
back.fighters[1].x = 640;
stepMatch(back, 1 / 60, [intent({ attackEdge: true, x: -1 }), intent()]);
pump(back, 0.45, () => [intent(), intent()]);
assert.ok(back.fighters[1].damage > 0, 'back smash should connect behind the attacker');
assert.ok(back.fighters[1].x < 640, 'back smash should send the defender backward');

const dodge = createMatch(['elon', 'sam'], ['human', 'human'], { intro: 0, seed: 14 });
dodge.fighters[0].x = 600;
dodge.fighters[0].facing = 1;
dodge.fighters[1].x = 660;
stepMatch(dodge, 1 / 60, [intent({ attackEdge: true, x: 1 }), intent({ dodgeEdge: true })]);
pump(dodge, 0.5, () => [intent(), intent()]);
assert.equal(dodge.fighters[1].damage, 0, 'spot dodge should slip a forward smash');

const roll = createMatch(['sam', 'dario'], ['human', 'human'], { intro: 0, seed: 15 });
const rollFrom = roll.fighters[0].x;
stepMatch(roll, 1 / 60, [intent({ dodgeEdge: true, x: 1 }), intent()]);
pump(roll, 0.4, () => [intent(), intent()]);
assert.ok(roll.fighters[0].x > rollFrom + 80, 'roll should carry the fighter');

const recover = createMatch(['elon', 'sam'], ['human', 'human'], { intro: 0, seed: 16 });
recover.fighters[0].grounded = false;
recover.fighters[0].y = PLATFORM.top - 140;
recover.fighters[0].jumpsLeft = 0;
recover.fighters[0].facing = 1;
recover.fighters[0].vy = 80;
stepMatch(recover, 1 / 60, [intent({ jumpEdge: true, jumpHeld: true }), intent()]);
assert.equal(recover.fighters[0].attack?.kind, 'upSpecial');
assert.ok(recover.fighters[0].vy < -700, 'Elon recovery should lift');
assert.equal(recover.fighters[0].recoveryUsed, true);
const samRec = createMatch(['sam', 'dario'], ['human', 'human'], { intro: 0, seed: 17 });
samRec.fighters[0].grounded = false;
samRec.fighters[0].y = PLATFORM.top - 140;
samRec.fighters[0].jumpsLeft = 0;
samRec.fighters[0].facing = 1;
stepMatch(samRec, 1 / 60, [intent({ jumpEdge: true, jumpHeld: true }), intent()]);
const darioRec = createMatch(['dario', 'elon'], ['human', 'human'], { intro: 0, seed: 18 });
darioRec.fighters[0].grounded = false;
darioRec.fighters[0].y = PLATFORM.top - 140;
darioRec.fighters[0].jumpsLeft = 0;
darioRec.fighters[0].facing = 1;
stepMatch(darioRec, 1 / 60, [intent({ jumpEdge: true, jumpHeld: true }), intent()]);
assert.ok(Math.abs(samRec.fighters[0].vx) > Math.abs(darioRec.fighters[0].vx));

const secondOnly = createMatch(['elon', 'sam'], ['human', 'human'], { intro: 0, seed: 19 });
secondOnly.fighters[0].grounded = false;
secondOnly.fighters[0].y = PLATFORM.top - 100;
secondOnly.fighters[0].jumpsLeft = 1;
stepMatch(secondOnly, 1 / 60, [intent({ jumpEdge: true, jumpHeld: true }), intent()]);
assert.notEqual(secondOnly.fighters[0].attack?.kind, 'upSpecial');
assert.equal(secondOnly.fighters[0].jumpsLeft, 0);

const grabbed = createMatch(['sam', 'elon'], ['human', 'human'], { intro: 0, seed: 20 });
grabbed.fighters[0].x = 600;
grabbed.fighters[0].facing = 1;
grabbed.fighters[1].x = 640;
stepMatch(grabbed, 1 / 60, [intent({ grabEdge: true }), intent()]);
pump(grabbed, 0.45, () => [intent(), intent()]);
assert.equal(grabbed.fighters[1].held, true, 'grab should pin');
assert.equal(grabbed.fighters[1].damage, 0);
stepMatch(grabbed, 1 / 60, [intent({ attackEdge: true, x: 1 }), intent()]);
pump(grabbed, 0.4, () => [intent(), intent()]);
assert.equal(grabbed.fighters[1].damage, profileFor('sam', 'throwForward').damage);
assert.equal(grabbed.fighters[1].held, false);

const held = createMatch(['elon', 'sam'], ['human', 'human'], { intro: 0, seed: 21 });
held.fighters[0].x = 600;
held.fighters[0].facing = 1;
held.fighters[1].x = 660;
stepMatch(held, 1 / 60, [intent({ attackEdge: true, attackHeld: true, x: 1 }), intent()]);
assert.equal(held.fighters[0].attack?.kind, 'forwardSmash');
assert.equal(held.fighters[0].charge, null);
pump(held, 0.5, () => [intent({ attackHeld: true, x: 1 }), intent()]);
assert.equal(held.fighters[1].damage, smash.damage);

const drop = createMatch(['dario', 'sam'], ['human', 'human'], { intro: 0, seed: 22 });
drop.fighters[0].grounded = false;
drop.fighters[0].y = PLATFORM.top - 180;
drop.fighters[0].vy = 0;
drop.fighters[0].x = 640;
pump(drop, 1.2, () => [intent(), intent()]);
assert.equal(drop.fighters[0].grounded, true);
assert.equal(drop.fighters[0].y, PLATFORM.top);

const side = createMatch(['elon', 'sam'], ['human', 'human'], { intro: 0, seed: 23 });
side.fighters[0].grounded = false;
side.fighters[0].x = PLATFORM.left - 36;
side.fighters[0].y = PLATFORM.top + 40;
side.fighters[0].vy = 0;
side.fighters[0].vx = 900;
pump(side, 0.15, () => [intent(), intent()]);
assert.ok(side.fighters[0].x <= PLATFORM.left, 'slab side should stop a body entering the AABB');

const bonk = createMatch(['elon', 'sam'], ['human', 'human'], { intro: 0, seed: 24 });
bonk.fighters[0].grounded = false;
bonk.fighters[0].x = 640;
bonk.fighters[0].y = PLATFORM.top + PLATFORM.height + ROSTER.elon.height + 30;
bonk.fighters[0].vy = -1400;
pump(bonk, 0.45, () => [intent(), intent()]);
const bonkHead = bonk.fighters[0].y - ROSTER.elon.height;
const bonkInside =
  bonk.fighters[0].y > PLATFORM.top &&
  bonkHead < PLATFORM.top + PLATFORM.height &&
  bonk.fighters[0].x > PLATFORM.left &&
  bonk.fighters[0].x < PLATFORM.right;
assert.equal(bonkInside, false, 'underside of the slab should stay solid');
assert.equal(bonk.fighters[0].grounded, false);

const off = createMatch(['sam', 'elon'], ['human', 'human'], { intro: 0, seed: 25 });
off.fighters[0].x = PLATFORM.right - 5;
pump(off, 0.55, () => [intent({ x: 1 }), intent()]);
assert.equal(off.fighters[0].grounded, false);
assert.ok(off.fighters[0].x > PLATFORM.right);

console.log('sim tests passed');
