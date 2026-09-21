import assert from 'node:assert/strict';
import {
  RESULT_REVEAL,
  RESULT_SLIDE,
  chooseResult,
  quitPressed,
  rematchPressed,
  resultAlpha,
  resultOffset,
  resultTarget,
} from '../src/shell/results.ts';
import { RESULT_BUTTONS, RESULT_CARD, type Rect } from '../src/shell/ui.ts';

assert.equal(rematchPressed((code) => code === 'Enter'), true);
assert.equal(rematchPressed((code) => code === 'Space'), true);
assert.equal(rematchPressed((code) => code === 'KeyJ'), false);
assert.equal(quitPressed((code) => code === 'KeyQ'), true);
assert.equal(quitPressed((code) => code === 'Escape'), false);

assert.equal(chooseResult({ confirm: true, back: false, quitKey: false, click: null }), 'rematch');
assert.equal(
  chooseResult({ confirm: true, back: true, quitKey: true, click: 'quit' }),
  'rematch',
);
assert.equal(chooseResult({ confirm: false, back: true, quitKey: false, click: null }), 'change');
assert.equal(chooseResult({ confirm: false, back: false, quitKey: true, click: null }), 'quit');
assert.equal(chooseResult({ confirm: false, back: false, quitKey: false, click: 'change' }), 'change');
assert.equal(chooseResult({ confirm: false, back: false, quitKey: false, click: 'quit' }), 'quit');
assert.equal(chooseResult({ confirm: false, back: false, quitKey: false, click: null }), null);

assert.ok(RESULT_REVEAL < 0.3, 'the card must not sit behind a multi-second lock');
assert.equal(resultAlpha(0), 0.2);
assert.equal(resultAlpha(RESULT_REVEAL), 1);
assert.equal(resultOffset(0), RESULT_SLIDE);
assert.equal(resultOffset(RESULT_REVEAL), 0);
assert.equal(
  chooseResult({ confirm: true, back: false, quitKey: false, click: null }),
  'rematch',
);

for (const rect of Object.values(RESULT_BUTTONS)) {
  assert.ok(rect.x >= RESULT_CARD.x && rect.y >= RESULT_CARD.y);
  assert.ok(rect.x + rect.w <= RESULT_CARD.x + RESULT_CARD.w);
  assert.ok(rect.y + rect.h <= RESULT_CARD.y + RESULT_CARD.h);
}
assert.equal(overlaps(RESULT_BUTTONS.rematch, RESULT_BUTTONS.change), false);
assert.equal(overlaps(RESULT_BUTTONS.rematch, RESULT_BUTTONS.quit), false);
assert.equal(overlaps(RESULT_BUTTONS.change, RESULT_BUTTONS.quit), false);
assert.ok(RESULT_BUTTONS.rematch.w > RESULT_BUTTONS.change.w);

const rematch = RESULT_BUTTONS.rematch;
assert.equal(resultTarget({ x: rematch.x + 12, y: rematch.y + 12 }, 0), null);
assert.equal(
  resultTarget({ x: rematch.x + 12, y: rematch.y + RESULT_SLIDE + 12 }, 0),
  'rematch',
);
assert.equal(resultTarget({ x: rematch.x + 12, y: rematch.y + 12 }, RESULT_REVEAL), 'rematch');

const quit = RESULT_BUTTONS.quit;
assert.equal(resultTarget({ x: quit.x + 8, y: quit.y + 8 }, RESULT_REVEAL), 'quit');
assert.equal(resultTarget({ x: -10, y: -10 }, RESULT_REVEAL), null);

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

console.log('results tests passed');
