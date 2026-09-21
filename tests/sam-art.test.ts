import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ELON_SHOULDER_W, REF_SAM_SHOULDER_W } from '../art/elon/palette.ts';
import { FIGHTERS, STAGE } from '../art/palette.ts';
import { SAM, SAM_SHOULDER_W } from '../art/sam/palette.ts';
import { buildSamSheets, samIdleTop, samPoseMarkup } from '../art/sam/paint.ts';
import { ROSTER } from '../src/fighters/roster.ts';
import { fighterHeadTop } from '../src/render/nameplate.ts';

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

assert.equal(SAM.blazer, '#1c2a4a');
assert.equal(SAM.shirt, '#d8e0ef');
assert.equal(SAM.hair, '#c4a882');
assert.equal(SAM.accent, '#e8b84a');
assert.equal(SAM.blazer, FIGHTERS.sam.body);
assert.equal(SAM.shirt, FIGHTERS.sam.cloth);
assert.equal(SAM.hair, FIGHTERS.sam.hair);
assert.equal(SAM.accent, FIGHTERS.sam.accent);
assert.equal(SAM.ink, STAGE.blast.void);
assert.equal(ROSTER.sam.color, SAM.blazer);
assert.equal(ROSTER.sam.accent, SAM.accent);
assert.equal(ROSTER.sam.short, 'SAM');
assert.equal(ROSTER.sam.width, 48);
assert.equal(ROSTER.sam.height, 86);
assert.equal(ROSTER.sam.weight, 0.86);

assert.ok(SAM_SHOULDER_W > ELON_SHOULDER_W, 'SAM shoulders stay broader than Elon');
assert.ok(SAM_SHOULDER_W > REF_SAM_SHOULDER_W, 'SAM shoulders stay broader than the stub torso');
assert.ok(dist(SAM.blazer, STAGE.ground.top) > 100, 'navy holds on rust');
assert.ok(dist(SAM.blazer, STAGE.sky.bottom) > 180, 'navy holds on the ochre haze');
assert.ok(dist(SAM.accent, SAM.blazer) > 200, 'gold holds on navy');
assert.ok(dist(SAM.accent, STAGE.ground.top) > 120, 'gold holds on rust');
assert.ok(dist(SAM.shirt, STAGE.ground.top) > 200, 'shirt holds on rust');
assert.ok(dist(SAM.hair, STAGE.sky.bottom) < 40, 'hair sits near the ochre haze');
assert.ok(dist(SAM.ink, STAGE.sky.bottom) > 200, 'void ink holds the dome on ochre');
assert.ok(dist(SAM.goldEdge, STAGE.sky.bottom) > 100, 'gold edge holds the close on ochre');
const [edgeR, edgeG, edgeB] = channels(SAM.goldEdge);
const [goldR, goldG, goldB] = channels(SAM.accent);
assert.ok(edgeR < goldR && edgeG < goldG && edgeB < goldB, 'gold edge stays darker than the locked accent');
assert.equal(samIdleTop(), fighterHeadTop('sam'), 'idle outline matches the shared billboard head top');

const idle = samPoseMarkup('idle', { silhouette: true });
const idleColor = samPoseMarkup('idle');
const smash = samPoseMarkup('smash', { power: 1 });
const back = samPoseMarkup('back', { power: 1 });
const up = samPoseMarkup('up', { power: 1 });
assert.ok(idle.includes('140c10'), 'silhouette is a flat mass');
assert.ok(!idle.includes(SAM.accent), 'silhouette drops the gold accent');
assert.ok(idleColor.includes(SAM.ink), 'idle dome carries the void ink');
assert.ok(idleColor.includes(SAM.blazer), 'idle body is the navy blazer');
assert.ok(smash.includes(SAM.accent), 'forward close carries the gold flash');
assert.ok(smash.includes(SAM.goldEdge), 'forward close keeps the dark gold edge');
assert.ok(back.includes(SAM.accent), 'shrug wave carries gold');
assert.ok(up.includes(SAM.accent), 'gavel bar carries gold');

const sheets = buildSamSheets();
assert.ok(sheets['sheet.svg'].includes('FORWARD CLOSE'));
assert.ok(sheets['sheet.svg'].includes('BACK SHRUG'));
assert.ok(sheets['sheet.svg'].includes('UP GAVEL'));
assert.ok(sheets['silhouette.svg'].includes('NOT ELON'));
assert.ok(sheets['silhouette.svg'].includes('NOT DARIO'));
const banned = ['openai', 'chatgpt', 'nintendo', 'spacex', 'anthropic'];
for (const svg of Object.values(sheets)) {
  const lower = svg.toLowerCase();
  for (const word of banned) assert.equal(lower.includes(word), false, word);
}

const committed = readFileSync(new URL('../art/sam/sheet.svg', import.meta.url), 'utf8');
assert.ok(committed.includes('WIND-UP'));
assert.ok(committed.includes(SAM.hair));

console.log('sam art tests passed');
