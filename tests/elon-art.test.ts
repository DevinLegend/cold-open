import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ELON, ELON_SHOULDER_W, REF_SAM_SHOULDER_W } from '../art/elon/palette.ts';
import { elonIdleTop, elonPicture, type ElonPicture, type ElonPose } from '../art/elon/paint.ts';
import { FIGHTERS, STAGE } from '../art/palette.ts';
import { ROSTER } from '../src/fighters/roster.ts';

function channels(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
  ];
}

function dist(a: string, b: string): number {
  const [ar, ag, ab] = channels(a);
  const [br, bg, bb] = channels(b);
  return Math.hypot(ar - br, ag - bg, ab - bb);
}

assert.equal(ELON.jacket, '#1a1f2a');
assert.equal(ELON.tee, '#f2f4f8');
assert.equal(ELON.hair, '#2b241c');
assert.equal(ELON.accent, '#2ee6c5');
assert.equal(ELON.jacket, FIGHTERS.elon.body);
assert.equal(ELON.tee, FIGHTERS.elon.cloth);
assert.equal(ELON.hair, FIGHTERS.elon.hair);
assert.equal(ELON.accent, FIGHTERS.elon.accent);
assert.equal(ELON.plate, FIGHTERS.elon.body);
assert.equal(ELON.streak, FIGHTERS.elon.accent);
assert.equal(ELON.ink, STAGE.blast.void);
assert.equal(ELON.dust, STAGE.ground.mid);
assert.equal(ELON.dustShadow, STAGE.ground.lip);
assert.equal(ROSTER.elon.color, ELON.jacket);
assert.equal(ROSTER.elon.accent, ELON.accent);
assert.equal(ROSTER.elon.ink, STAGE.blast.void);
assert.equal(ROSTER.elon.short, 'ELON');

const [tealR, tealG, tealB] = channels(ELON.accent);
const [, cyanG, cyanB] = channels(STAGE.blast.cyanRim);
assert.ok(tealG > tealB, 'locked teal stays greener than it is blue');
assert.ok(cyanB > cyanG, 'blast cyan stays bluer than it is green');
assert.notEqual(ELON.accent.toLowerCase(), STAGE.blast.cyanRim.toLowerCase());
assert.ok(dist(ELON.accent, STAGE.blast.cyanRim) > 40, 'teal separates from the blast cyan rim');
assert.ok(dist(ELON.accent, ELON.jacket) > 180, 'teal pops on charcoal');
assert.ok(dist(ELON.tee, ELON.jacket) > 180, 'white tee pops on charcoal');
assert.ok(dist(ELON.accent, STAGE.ground.top) > 160, 'teal pops on rust');
assert.ok(dist(ELON.accent, STAGE.ground.mid) > 140, 'teal pops on ground mid');
assert.ok(dist(ELON.accent, STAGE.sky.bottom) > 140, 'teal pops on ochre');
assert.ok(dist(ELON.accent, STAGE.sky.horizon) > 120, 'teal pops on the mauve horizon');
assert.ok(dist(ELON.tee, STAGE.sky.bottom) > 120, 'white tee pops on ochre');
const [edgeR, edgeG, edgeB] = channels(ELON.streakEdge);
assert.ok(edgeG > edgeB && edgeG > edgeR, 'streak edge stays a teal shade');
assert.ok(edgeG < tealG && edgeB < tealB, 'streak edge is darker than the locked accent');
assert.notEqual(ELON.streakEdge.toLowerCase(), STAGE.blast.cyanRim.toLowerCase());

const stageOnly = [STAGE.blast.cyanRim, STAGE.blast.magentaRim, STAGE.rocket.ember, STAGE.rocket.vapor];
function assertFighterColors(pic: ElonPicture, pose: string): void {
  for (const shape of [...pic.body, ...pic.back, ...pic.front]) {
    for (const paint of [shape.fill, shape.stroke]) {
      if (!paint) continue;
      for (const banned of stageOnly) {
        assert.notEqual(
          paint.toLowerCase(),
          banned.toLowerCase(),
          `${pose} uses stage-only color ${banned}`,
        );
      }
    }
  }
}
assert.ok(ELON_SHOULDER_W < REF_SAM_SHOULDER_W);
assert.equal(ROSTER.elon.width, 40);
assert.equal(ROSTER.elon.height, 98);
assert.equal(ROSTER.elon.weight, 0.96);

const poses: ElonPose[] = [
  'idle',
  'walk',
  'jump',
  'smashWindup',
  'smash',
  'aerial',
  'ko',
  'upSmash',
  'downSmash',
];

for (const pose of poses) {
  const pic = elonPicture(pose, pose === 'walk' ? 0.8 : pose === 'ko' ? 1.2 : 1);
  assert.ok(pic.body.length > 4, `${pose} should have a body`);
  const fills = pic.body.map((shape) => shape.fill).join(' ');
  assert.ok(fills.includes(ELON.hair), `${pose} keeps the hair wedge`);
  assert.ok(fills.includes(ELON.jacket), `${pose} keeps the jacket`);
  assertFighterColors(pic, pose);
}

const smash = elonPicture('smash', 1);
assert.ok(smash.body.some((shape) => shape.kind === 'tell'), 'forward smash has a thrust streak');
const up = elonPicture('upSmash', 1);
assert.ok(up.back.some((shape) => (shape.alpha ?? 1) > 0.2), 'up smash has a vapor trail');
const down = elonPicture('downSmash', 1);
assert.ok(down.back.length + down.front.length > 0, 'down smash has a dust ring');
assert.ok(elonIdleTop() < -80, 'idle hair should stand above the shoulders');

const banned = ['spacex', 'tesla', 'nintendo', 'openai', 'anthropic', 'cybertruck'];
const artDir = join(import.meta.dirname, '../art/elon');
for (const name of readdirSync(artDir)) {
  if (!name.endsWith('.ts') && !name.endsWith('.svg')) continue;
  const text = readFileSync(join(artDir, name), 'utf8').toLowerCase();
  for (const word of banned) assert.equal(text.includes(word), false, `${name} mentions ${word}`);
}

const sheet = readFileSync(join(artDir, 'sheet.svg'), 'utf8');
const sheetLower = sheet.toLowerCase();
for (const hex of [
  FIGHTERS.elon.accent,
  FIGHTERS.elon.body,
  STAGE.ground.top,
  STAGE.ground.mid,
  STAGE.ground.lip,
  STAGE.sky.top,
  STAGE.sky.bottom,
  STAGE.sky.horizon,
]) {
  assert.ok(sheetLower.includes(hex.toLowerCase()), `sheet should show ${hex}`);
}
for (const hex of [STAGE.blast.cyanRim, STAGE.blast.magentaRim, STAGE.rocket.ember]) {
  assert.equal(sheetLower.includes(hex.toLowerCase()), false, `sheet must not use ${hex}`);
}

console.log('elon art kit ok', 'idleTop', elonIdleTop());
