import assert from 'node:assert/strict';
import { FIGHTERS, SLAB, STAGE } from '../art/palette.ts';
import { profileFor } from '../src/combat/attacks.ts';
import { fighterInPose, POSE_ORDER } from '../src/fighters/readabilityPose.ts';
import { ROSTER } from '../src/fighters/roster.ts';
import { liveSlabSize } from '../src/fighters/slabFrame.ts';
import {
  PLATFORM,
  REF_FIGHTER_HEIGHT,
  REF_FIGHTER_WIDTH,
  SLAB_FIGHTER_WIDTHS,
  SLAB_THICKNESS_FH,
} from '../src/stage/layout.ts';

assert.equal(STAGE.ground.top, '#8B4513');
assert.equal(STAGE.ground.mid, '#A0522D');
assert.equal(STAGE.ground.lip, '#3D2314');
assert.equal(STAGE.sky.top, '#C47A6A');
assert.equal(STAGE.sky.bottom, '#D4A574');
assert.equal(STAGE.sky.horizon, '#9B6B7A');
assert.equal(STAGE.blast.void, '#0B0A12');
assert.equal(STAGE.blast.cyanRim, '#3DE0FF');
assert.equal(STAGE.blast.magentaRim, '#FF3D9A');
assert.equal(SLAB.thicknessInFighterHeights, 1.2);
assert.equal(SLAB.restAirInFighterHeights, 1.5);
assert.equal(SLAB.widthInFighterWidths.min, 18);
assert.equal(SLAB.widthInFighterWidths.max, 22);

const slab = liveSlabSize();
assert.equal(slab.width, REF_FIGHTER_WIDTH * SLAB_FIGHTER_WIDTHS);
assert.equal(slab.height, Math.round(REF_FIGHTER_HEIGHT * SLAB_THICKNESS_FH));
assert.equal(PLATFORM.right - PLATFORM.left, slab.width);
assert.equal(PLATFORM.height, slab.height);
assert.equal(PLATFORM.top, 518);
assert.equal(SLAB_FIGHTER_WIDTHS, 20);
assert.equal(SLAB_THICKNESS_FH, SLAB.thicknessInFighterHeights);
assert.ok(SLAB_FIGHTER_WIDTHS >= SLAB.widthInFighterWidths.min);
assert.ok(SLAB_FIGHTER_WIDTHS <= SLAB.widthInFighterWidths.max);
assert.equal(slab.air, 1.5 * REF_FIGHTER_HEIGHT);

assert.equal(ROSTER.elon.width, 40);
assert.equal(ROSTER.elon.height, 98);
assert.equal(ROSTER.elon.weight, 0.96);
assert.equal(ROSTER.sam.width, 48);
assert.equal(ROSTER.sam.height, 86);
assert.equal(FIGHTERS.sam.body, '#1c2a4a');
assert.equal(FIGHTERS.sam.accent, '#e8b84a');
assert.equal(ROSTER.sam.color, FIGHTERS.sam.body);
assert.equal(ROSTER.sam.accent, FIGHTERS.sam.accent);
assert.equal(ROSTER.dario.width, 46);
assert.equal(ROSTER.dario.height, 96);
assert.equal(ROSTER.dario.color, '#3a4558');
assert.equal(ROSTER.dario.accent, '#7dffb3');
assert.equal(ROSTER.elon.accent, '#2ee6c5');

for (const id of ['elon', 'sam', 'dario'] as const) {
  for (const pose of POSE_ORDER) {
    const fighter = fighterInPose(id, pose, Math.PI / 16);
    assert.equal(fighter.id, id);
  }
  const wind = fighterInPose(id, 'windup');
  assert.equal(wind.attack?.kind, 'forwardSmash');
  assert.ok(wind.attack);
  assert.ok(wind.attack.t < profileFor(id, 'forwardSmash').startup);
  assert.equal(wind.grounded, true);
  const air = fighterInPose(id, 'aerial');
  assert.equal(air.attack?.kind, 'forwardAerial');
  assert.equal(air.grounded, false);
  const jump = fighterInPose(id, 'jump');
  assert.equal(jump.attack, null);
  assert.equal(jump.grounded, false);
  assert.ok(jump.jumpsLeft > 0);
  const tumble = fighterInPose(id, 'tumble');
  assert.ok(tumble.hitstun > 0);
  assert.equal(tumble.koHold, true);
  assert.equal(tumble.grounded, false);
  const walk = fighterInPose(id, 'walk');
  assert.ok(Math.abs(walk.vx) > 28);
  assert.equal(walk.grounded, true);
}
