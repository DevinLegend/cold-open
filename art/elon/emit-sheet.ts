// Regenerates the Elon contact sheet and silhouette sheet from the kit.
// node --experimental-strip-types art/elon/emit-sheet.ts

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STAGE } from '../palette.ts';
import { nameplateRects } from '../nameplates.ts';
import { ELON, ELON_SHOULDER_W, REF_SAM_SHOULDER_W } from './palette.ts';
import { elonIdleTop, elonMarkup, elonPicture, type ElonPicture, type ElonPose } from './paint.ts';

const dir = dirname(fileURLToPath(import.meta.url));

const POSES: { pose: ElonPose; t: number; label: string }[] = [
  { pose: 'idle', t: 0, label: 'IDLE' },
  { pose: 'walk', t: 0.92, label: 'WALK' },
  { pose: 'walk', t: -0.92, label: 'WALK' },
  { pose: 'jump', t: 0.12, label: 'JUMP' },
  { pose: 'smashWindup', t: 1, label: 'SMASH WIND-UP' },
  { pose: 'smash', t: 1, label: 'FORWARD SMASH' },
  { pose: 'aerial', t: 1, label: 'AERIAL' },
  { pose: 'ko', t: 2.35, label: 'KO TUMBLE' },
  { pose: 'upSmash', t: 1, label: 'UP SMASH' },
  { pose: 'downSmash', t: 1, label: 'DOWN SMASH' },
];

function pictureSvg(pic: ElonPicture, rim: string): string {
  return elonMarkup(pic, rim);
}

function fighterGroup(pic: ElonPicture, x: number, y: number, scale: number, rim: string): string {
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale})">${pictureSvg(pic, rim)}</g>`;
}

function rrectPath(x: number, y: number, w: number, h: number, r: number): string {
  return `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
}

/** Stub silhouettes traced from the current Sam / Dario draws, for contrast only. */
function samStub(): string {
  const d = [
    rrectPath(-18, -40, 14, 40, 5),
    rrectPath(4, -40, 14, 40, 5),
    rrectPath(-24, -86, 48, 50, 12),
    `M -16 -96 A 16 16 0 1 0 16 -96 A 16 16 0 1 0 -16 -96 Z`,
  ].join(' ');
  return `<path d="${d}" fill="#140c0a"/>`;
}

function darioStub(): string {
  const d = [
    'M -16 -88 L 16 -88 L 26 -4 L -26 -4 Z',
    rrectPath(-14, -36, 10, 36, 2),
    rrectPath(4, -36, 10, 36, 2),
    rrectPath(-12, -112, 24, 26, 6),
  ].join(' ');
  return `<path d="${d}" fill="#140c0a"/>`;
}

function ground(x: number, y: number, w: number): string {
  const g = STAGE.ground;
  return (
    `<rect x="${x}" y="${y - 10}" width="${w}" height="10" fill="${STAGE.sky.horizon}"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="8" fill="${g.top}"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="3" fill="${g.lip}"/>` +
    `<rect x="${x}" y="${y + 8}" width="${w}" height="28" fill="${g.mid}"/>`
  );
}

function elonPlate(x: number, y: number, scale: number): string {
  const plate = nameplateRects('elon');
  const rects = plate.rects
    .map((rect) => `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="${rect.fill}"/>`)
    .join('');
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale})">${rects}</g>`;
}

function label(x: number, y: number, text: string, size = 15): string {
  return `<text x="${x}" y="${y}" text-anchor="middle" font-family="Trebuchet MS, Segoe UI, sans-serif" font-size="${size}" font-weight="700" fill="#1a120e">${text}</text>`;
}

function sheet(): string {
  const w = 1280;
  const h = 1180;
  const cols = 5;
  const cellW = 240;
  const originX = (w - cols * cellW) / 2;
  const rows = [118, 470];
  let body = '';
  POSES.forEach((entry, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = originX + col * cellW;
    const y = rows[row];
    const feetX = x + 108;
    const feetY = y + 250;
    const rim = STAGE.blast.void;
    const pic = elonPicture(entry.pose, entry.t, { rim });
    body += ground(x + 28, feetY, cellW - 56);
    body += label(x + cellW / 2, y + 22, entry.label);
    body += fighterGroup(pic, feetX, feetY, 1, rim);
  });

  const idleTop = Math.abs(elonIdleTop());
  const scale = 120 / idleTop;
  const bandY = 820;
  body += `<rect x="36" y="${bandY}" width="${w - 72}" height="250" rx="18" fill="${STAGE.ground.top}"/>`;
  body += label(w / 2, bandY + 28, 'SILHOUETTE AT 1/6 OF 720  ·  120px ELON', 16);
  body += `<text x="${w / 2}" y="${bandY + 50}" text-anchor="middle" font-family="Trebuchet MS, Segoe UI, sans-serif" font-size="13" fill="#f2e6d8">Hair wedge and narrow shoulders against Sam’s dome and Dario’s trapezoid. Same scale.</text>`;

  const feetY = bandY + 210;
  const marks: { name: string; svg: string }[] = [
    { name: 'ELON', svg: pictureSvg(elonPicture('idle', 0, { silhouette: true }), '#140c0a') },
    { name: 'ELON SMASH', svg: pictureSvg(elonPicture('smash', 1, { silhouette: true }), '#140c0a') },
    { name: 'ELON KO', svg: pictureSvg(elonPicture('ko', 2.35, { silhouette: true }), '#140c0a') },
    { name: 'SAM', svg: samStub() },
    { name: 'DARIO', svg: darioStub() },
  ];
  marks.forEach((mark, i) => {
    const x = 150 + i * 230;
    body += `<g transform="translate(${x} ${feetY}) scale(${scale.toFixed(4)})">${mark.svg}</g>`;
    body += `<text x="${x}" y="${bandY + 72}" text-anchor="middle" font-family="Trebuchet MS, Segoe UI, sans-serif" font-size="13" font-weight="700" fill="#f2e6d8">${mark.name}</text>`;
  });

  const chipY = 1092;
  const chips: { hex: string; name: string }[] = [
    { hex: ELON.jacket, name: 'JACKET' },
    { hex: ELON.tee, name: 'TEE' },
    { hex: ELON.hair, name: 'HAIR' },
    { hex: ELON.accent, name: 'TEAL' },
  ];
  chips.forEach((chip, i) => {
    const x = 48 + i * 150;
    body += `<rect x="${x}" y="${chipY}" width="28" height="28" rx="6" fill="${chip.hex}" stroke="#1a120e" stroke-width="2"/>`;
    body += `<text x="${x + 36}" y="${chipY + 19}" font-family="Trebuchet MS, Segoe UI, sans-serif" font-size="13" font-weight="700" fill="#1a120e">${chip.name} ${chip.hex}</text>`;
  });
  body += elonPlate(660, chipY - 8, 0.42);
  body += `<text x="780" y="${chipY + 20}" font-family="Trebuchet MS, Segoe UI, sans-serif" font-size="13" fill="#1a120e">nameplate · teal on charcoal · shoulders ${ELON_SHOULDER_W} vs Sam ${REF_SAM_SHOULDER_W}</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <title>ELON fighter kit</title>
  <desc>Cold Open Elon poses on the Iris Mars palette. No photos, no corp marks.</desc>
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${STAGE.sky.top}"/>
      <stop offset="1" stop-color="${STAGE.sky.bottom}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  <text x="48" y="54" font-family="Trebuchet MS, Segoe UI, sans-serif" font-size="32" font-weight="700" fill="#1a120e">ELON</text>
  <text x="160" y="54" font-family="Trebuchet MS, Segoe UI, sans-serif" font-size="16" fill="#3a241c">fighter kit · charcoal jacket, white tee, hair wedge, acid teal · rocket pack is an unbranded prop</text>
  ${body}
</svg>
`;
}

function silhouetteSheet(): string {
  const w = 1100;
  const h = 420;
  const idleTop = Math.abs(elonIdleTop());
  const scale = 120 / idleTop;
  const feetY = 300;
  const poses: { pose: ElonPose; t: number; name: string }[] = [
    { pose: 'idle', t: 0, name: 'IDLE' },
    { pose: 'walk', t: 0.92, name: 'WALK' },
    { pose: 'jump', t: 0.12, name: 'JUMP' },
    { pose: 'smashWindup', t: 1, name: 'WIND-UP' },
    { pose: 'smash', t: 1, name: 'SMASH' },
    { pose: 'aerial', t: 1, name: 'AERIAL' },
    { pose: 'ko', t: 0.8, name: 'KO' },
    { pose: 'ko', t: 2.4, name: 'KO' },
    { pose: 'upSmash', t: 1, name: 'UP' },
    { pose: 'downSmash', t: 1, name: 'DOWN' },
  ];
  let body = '';
  poses.forEach((entry, i) => {
    const x = 70 + (i % 10) * 104;
    body += `<text x="${x}" y="78" text-anchor="middle" font-family="Trebuchet MS, Segoe UI, sans-serif" font-size="11" font-weight="700" fill="#f2e6d8">${entry.name}</text>`;
    body += fighterGroup(elonPicture(entry.pose, entry.t, { silhouette: true }), x, feetY, scale, '#140c0a');
  });
  const compareY = 390;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h + 40}" viewBox="0 0 ${w} ${h}">
  <title>ELON silhouette sheet</title>
  <rect width="${w}" height="${h}" fill="${STAGE.ground.mid}"/>
  <rect x="0" y="0" width="${w}" height="46" fill="${STAGE.ground.top}"/>
  <text x="24" y="30" font-family="Trebuchet MS, Segoe UI, sans-serif" font-size="16" font-weight="700" fill="#f2e6d8">ELON silhouettes · scaled so idle hair-to-feet is 120px (1/6 of 720)</text>
  ${body}
  <text x="24" y="${compareY - 8}" font-family="Trebuchet MS, Segoe UI, sans-serif" font-size="11" fill="#f6e7d4">Every pose keeps the wedge. Shoulders ${ELON_SHOULDER_W}. Sam stub on the contact sheet is ${REF_SAM_SHOULDER_W}.</text>
</svg>
`;
}

writeFileSync(join(dir, 'sheet.svg'), sheet());
writeFileSync(join(dir, 'silhouette.svg'), silhouetteSheet());
console.log('wrote art/elon/sheet.svg and art/elon/silhouette.svg', 'idleTop', elonIdleTop());
