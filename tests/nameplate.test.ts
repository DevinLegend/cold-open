import assert from 'node:assert/strict';
import { CELL, LETTER_GAP, NAMEPLATE_SIZE } from '../art/nameplates.ts';
import type { FighterId } from '../src/game/types.ts';
import {
  BILLBOARD_SCALE,
  HUD_PLATE_SCALE,
  billboardCenterY,
  billboardScaleForZoom,
  cameraDamp,
  fighterHeadTop,
} from '../src/render/nameplate.ts';

const ids: FighterId[] = ['elon', 'sam', 'dario'];
const feet = 518;

for (const id of ids) {
  const cy = billboardCenterY(id, feet);
  const half = (NAMEPLATE_SIZE[id].h * BILLBOARD_SCALE) / 2;
  const bottom = cy + half;
  const head = feet + fighterHeadTop(id);
  assert.ok(bottom <= head - 8, `${id} billboard stays above the head`);
  assert.ok(head - bottom < 12, `${id} billboard stays with the fighter`);
}

assert.ok(BILLBOARD_SCALE < 1, 'world plate is not drawn at full pixel size');
assert.ok(HUD_PLATE_SCALE < BILLBOARD_SCALE, 'HUD repeat is smaller than the billboard');

const worldH = NAMEPLATE_SIZE.elon.h * BILLBOARD_SCALE;
const zoomOut = 1.62;
assert.ok(worldH / zoomOut < worldH, 'camera zoom-out shrinks the billboard');

assert.equal(CELL * BILLBOARD_SCALE, 4, 'rest scale keeps glyph cells on whole pixels');
assert.equal(LETTER_GAP * BILLBOARD_SCALE, 3, 'rest scale keeps the kit letter gap open');
assert.equal(cameraDamp(1), 1);
assert.equal(billboardScaleForZoom(1), BILLBOARD_SCALE);

function screenH(zoom: number): number {
  return (NAMEPLATE_SIZE.elon.h * billboardScaleForZoom(zoom)) / zoom;
}

const rest = screenH(1);
const far = screenH(zoomOut);
const rawFar = worldH / zoomOut;
assert.ok(far < rest, 'pull-back still shrinks the plate on screen');
assert.ok(far > rawFar, 'damped zoom keeps the plate from vanishing');
assert.ok(screenH(0.5) < rest * 1.2, 'punch-in does not explode the plate');
assert.ok(billboardScaleForZoom(zoomOut) > BILLBOARD_SCALE, 'pull-back grows the world plate only partway');
assert.ok(billboardScaleForZoom(zoomOut) < BILLBOARD_SCALE * zoomOut, 'pull-back is not a full counter-scale');

console.log('nameplate placement ok');
