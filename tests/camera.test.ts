import assert from 'node:assert/strict';
import { EMPTY_INTENT } from '../src/game/types.ts';
import type { Camera, Fighter } from '../src/game/types.ts';
import { createMatch, stepMatch } from '../src/match/sim.ts';
import { desiredCamera, MAX_ZOOM, MIN_ZOOM, REST_CAMERA, stepCamera } from '../src/stage/camera.ts';
import { BLAST, PLATFORM, REF_FIGHTER_HEIGHT, VIEW } from '../src/stage/layout.ts';

function viewOf(camera: Camera) {
  const halfW = (VIEW.w * camera.zoom) / 2;
  const halfH = (VIEW.h * camera.zoom) / 2;
  return {
    left: camera.x - halfW,
    right: camera.x + halfW,
    top: camera.y - halfH,
    bottom: camera.y + halfH,
  };
}

function place(fighters: readonly Fighter[], slot: 0 | 1, x: number, y = PLATFORM.top, vx = 0, vy = 0): void {
  const fighter = fighters[slot];
  fighter.x = x;
  fighter.y = y;
  fighter.vx = vx;
  fighter.vy = vy;
  fighter.out = false;
  fighter.grounded = y >= PLATFORM.top - 0.01 && Math.abs(y - PLATFORM.top) < 0.01;
}

function assertReadable(camera: Camera, label: string): void {
  const view = viewOf(camera);
  assert.ok(camera.zoom >= MIN_ZOOM - 1e-6, `${label} zoom cropped the stage (${camera.zoom})`);
  assert.ok(camera.zoom <= MAX_ZOOM + 1e-6, `${label} zoom pulled too wide (${camera.zoom})`);
  assert.ok(camera.zoom <= 1.3, `${label} fighters would shrink toward specks`);
  assert.ok(view.left <= PLATFORM.left + 0.5, `${label} cropped the left lip`);
  assert.ok(view.right >= PLATFORM.right - 0.5, `${label} cropped the right lip`);
  const air = PLATFORM.top - view.top;
  assert.ok(air >= REF_FIGHTER_HEIGHT * 1.2, `${label} lost the air above the slab (${air})`);
  const fraction = air / (view.bottom - view.top);
  assert.ok(fraction >= 0.32 && fraction <= 0.78, `${label} horizon fraction ${fraction}`);
  assert.ok(view.top < PLATFORM.top && view.bottom > PLATFORM.top + PLATFORM.height, `${label} lost the ground`);
}

function run(camera: Camera, fighters: readonly Fighter[], seconds: number): number {
  const dt = 1 / 60;
  const frames = Math.round(seconds * 60);
  let peak = 0;
  let prev = camera.x;
  for (let i = 0; i < frames; i++) {
    stepCamera(camera, fighters, dt);
    peak = Math.max(peak, Math.abs(camera.x - prev));
    prev = camera.x;
    assertReadable(camera, 'spring frame');
  }
  return peak;
}

const home = createMatch(['elon', 'sam'], ['human', 'human'], { intro: 0, seed: 1 });
const rest = desiredCamera(home.fighters);
assert.equal(rest.x, REST_CAMERA.x);
assert.equal(rest.y, REST_CAMERA.y);
assert.equal(rest.zoom, 1);
assertReadable(rest, 'spawn');

const left = createMatch(['elon', 'sam'], ['human', 'human'], { intro: 0, seed: 2 });
place(left.fighters, 0, 250);
place(left.fighters, 1, 400);
const leftTarget = desiredCamera(left.fighters);
assert.ok(leftTarget.x < REST_CAMERA.x - 40, 'a pair on the left pulls the frame');
assert.ok(leftTarget.zoom < 1.2, 'an on-slab pair does not open into a wide shot');
assertReadable(leftTarget, 'left pair');
const leftView = viewOf(leftTarget);
assert.ok(leftView.left <= 250 && leftView.right >= 400, 'left pair stays in frame');

const huddled = createMatch(['sam', 'dario'], ['human', 'human'], { intro: 0, seed: 3 });
place(huddled.fighters, 0, 610);
place(huddled.fighters, 1, 670);
const huddleTarget = desiredCamera(huddled.fighters);
assert.ok(Math.abs(huddleTarget.x - REST_CAMERA.x) < 24, 'a centered pair stays on the midpoint');
assert.equal(huddleTarget.zoom, 1);

const quiet = createMatch(['sam', 'dario'], ['human', 'human'], { intro: 0, seed: 4 });
place(quiet.fighters, 0, 600);
place(quiet.fighters, 1, 660);
const quietCam = { ...REST_CAMERA };
run(quietCam, quiet.fighters, 0.45);
assert.ok(Math.abs(quietCam.x - REST_CAMERA.x) < 8, 'soft deadzone ignores a small shuffle');
assert.ok(Math.abs(quietCam.y - REST_CAMERA.y) < 4, 'horizon does not bob');

const blast = createMatch(['elon', 'dario'], ['human', 'human'], { intro: 0, seed: 5 });
place(blast.fighters, 0, 640);
place(blast.fighters, 1, BLAST.right - 30, PLATFORM.top, 400, 0);
const blastTarget = desiredCamera(blast.fighters);
assert.ok(blastTarget.zoom > 1.12, 'a side blast eases the view out');
assertReadable(blastTarget, 'side blast');
const blastView = viewOf(blastTarget);
assert.ok(blastView.right >= blast.fighters[1].x + 24, 'the blasted fighter is inside the view');
assert.ok(blastView.left <= 640, 'the fighter still on the slab stays in view');

const pit = createMatch(['dario', 'sam'], ['human', 'human'], { intro: 0, seed: 6 });
place(pit.fighters, 0, 700, BLAST.bottom - 8, 0, 600);
place(pit.fighters, 1, 620);
const pitTarget = desiredCamera(pit.fighters);
assert.ok(pitTarget.zoom > 1.15, 'a deep fall eases the view out');
assert.ok(pitTarget.y > REST_CAMERA.y + 40, 'the frame follows the fall down');
assertReadable(pitTarget, 'pit');
const pitView = viewOf(pitTarget);
assert.ok(pitView.bottom >= pit.fighters[0].y - 8, 'the falling fighter reaches the frame');
assert.ok(pitView.top < PLATFORM.top - REF_FIGHTER_HEIGHT, 'the slab horizon stays on screen');

const leadStill = createMatch(['elon', 'sam'], ['human', 'human'], { intro: 0, seed: 7 });
place(leadStill.fighters, 0, 520);
place(leadStill.fighters, 1, 760);
const leadMove = createMatch(['elon', 'sam'], ['human', 'human'], { intro: 0, seed: 8 });
place(leadMove.fighters, 0, 520, PLATFORM.top, 900, 0);
place(leadMove.fighters, 1, 760);
assert.ok(desiredCamera(leadMove.fighters).x > desiredCamera(leadStill.fighters).x, 'velocity leads the frame');

const gone = createMatch(['elon', 'sam'], ['human', 'human'], { intro: 0, seed: 9 });
gone.fighters[0].out = true;
gone.fighters[0].x = BLAST.left - 200;
place(gone.fighters, 1, 640);
const solo = desiredCamera(gone.fighters);
assert.ok(Math.abs(solo.x - REST_CAMERA.x) < 80, 'an eliminated fighter drops out of the frame');
assertReadable(solo, 'solo');

const samples: Array<[number, number, number, number]> = [
  [300, PLATFORM.top, 900, PLATFORM.top],
  [PLATFORM.left + 10, PLATFORM.top, PLATFORM.right - 10, PLATFORM.top],
  [BLAST.left + 10, PLATFORM.top, 800, PLATFORM.top],
  [200, PLATFORM.top - 280, 640, PLATFORM.top],
  [640, BLAST.bottom, 500, PLATFORM.top],
  [BLAST.right, PLATFORM.top + 40, BLAST.left, PLATFORM.top],
];
for (const [x0, y0, x1, y1] of samples) {
  const match = createMatch(['sam', 'elon'], ['human', 'human'], { intro: 0, seed: 10 });
  place(match.fighters, 0, x0, y0);
  place(match.fighters, 1, x1, y1);
  assertReadable(desiredCamera(match.fighters), `sample ${x0},${y0}`);
}

const chase = { ...REST_CAMERA };
const chaseMatch = createMatch(['elon', 'sam'], ['human', 'human'], { intro: 0, seed: 11 });
place(chaseMatch.fighters, 0, 260);
place(chaseMatch.fighters, 1, 380);
const goal = desiredCamera(chaseMatch.fighters);
const gap = Math.abs(goal.x - chase.x);
stepCamera(chase, chaseMatch.fighters, 1 / 60);
const first = Math.abs(chase.x - REST_CAMERA.x);
assert.ok(first > 0.2, 'the spring starts on the first frame');
assert.ok(first < gap * 0.08, `one frame snapped (${first} of ${gap})`);
const peak = run(chase, chaseMatch.fighters, 1);
assert.ok(peak < 22, `a frame jumped ${peak}px`);
assert.ok(Math.abs(goal.x - chase.x) < gap * 0.45, 'one second of ease covers most of the pan');

const recover = { ...REST_CAMERA };
const recoverMatch = createMatch(['dario', 'elon'], ['human', 'human'], { intro: 0, seed: 12 });
place(recoverMatch.fighters, 0, 640);
place(recoverMatch.fighters, 1, BLAST.right - 20, PLATFORM.top + 80, 0, 200);
run(recover, recoverMatch.fighters, 1.4);
assert.ok(recover.x > REST_CAMERA.x + 30, 'the view eases toward the blast');
assert.ok(recover.zoom > 1.08, 'zoom eases out before the KO');
place(recoverMatch.fighters, 0, 430);
place(recoverMatch.fighters, 1, 850);
const returnPeak = run(recover, recoverMatch.fighters, 1.6);
assert.ok(returnPeak < 28, `recovery snapped ${returnPeak}px`);
assert.ok(Math.abs(recover.x - REST_CAMERA.x) < 36, 'the view settles back on the slab');
assert.ok(recover.zoom < 1.06, 'zoom recovers with the fighters');

const wired = createMatch(['sam', 'dario'], ['human', 'human'], { intro: 0, seed: 13 });
place(wired.fighters, 0, 280);
place(wired.fighters, 1, 360);
const beforeX = wired.camera.x;
stepMatch(wired, 1 / 60, [EMPTY_INTENT, EMPTY_INTENT]);
assert.ok(Math.abs(wired.camera.x - beforeX) > 0.2, 'the match steps the follow camera');
assert.ok(Math.abs(wired.camera.x - beforeX) < 20, 'the match step does not snap the camera');
assert.equal(wired.koLog.length, 0);
assert.equal(wired.fighters[0].stocks, 3);

console.log('camera tests passed');
