// Regenerates art/nameplates/*.svg from art/nameplates.ts.
// Run: node --experimental-strip-types art/export-nameplates.mjs
// Not part of `npm run build`.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIGHTER_IDS, STAGE } from './palette.ts';
import { nameplateRects } from './nameplates.ts';

const root = dirname(fileURLToPath(import.meta.url));
const dir = join(root, 'nameplates');
mkdirSync(dir, { recursive: true });

function plateSvg(id) {
  const plate = nameplateRects(id);
  const rects = plate.rects
    .map(
      (rect) =>
        `  <rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="${rect.fill}"/>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${plate.w}" height="${plate.h}" viewBox="0 0 ${plate.w} ${plate.h}" role="img" aria-labelledby="title">
  <title id="title">${plate.label}</title>
  <g shape-rendering="crispEdges">
${rects}
  </g>
</svg>
`;
}

const plates = FIGHTER_IDS.map((id) => nameplateRects(id));
for (const plate of plates) {
  writeFileSync(join(dir, `${plate.id}.svg`), plateSvg(plate.id));
}

const gap = 36;
const sheetW = 1100;
const sheetH = 640;
const rowW = plates.reduce((sum, plate) => sum + plate.w, 0) + gap * (plates.length - 1);
let cursor = Math.round((sheetW - rowW) / 2);
const plateY = 168;
const groups = plates
  .map((plate) => {
    const group = `  <g transform="translate(${cursor} ${plateY})">\n${plate.rects
      .map(
        (rect) =>
          `    <rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="${rect.fill}"/>`,
      )
      .join('\n')}\n  </g>`;
    cursor += plate.w + gap;
    return group;
  })
  .join('\n');

const { ground, sky, blast } = STAGE;
const sheet = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}" height="${sheetH}" viewBox="0 0 ${sheetW} ${sheetH}" role="img" aria-labelledby="title">
  <title id="title">Cold Open nameplates on the flat stage palette</title>
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${sky.top}"/>
      <stop offset="1" stop-color="${sky.bottom}"/>
    </linearGradient>
  </defs>
  <rect width="${sheetW}" height="${sheetH}" fill="url(#sky)"/>
  <rect y="390" width="${sheetW}" height="70" fill="${sky.horizon}"/>
  <rect y="460" width="${sheetW}" height="180" fill="${ground.mid}"/>
  <rect y="460" width="${sheetW}" height="18" fill="${ground.top}"/>
  <rect y="460" width="${sheetW}" height="8" fill="${ground.lip}"/>
  <rect width="28" height="${sheetH}" fill="${blast.void}"/>
  <rect x="28" width="5" height="${sheetH}" fill="${blast.cyanRim}"/>
  <rect x="${sheetW - 33}" width="5" height="${sheetH}" fill="${blast.magentaRim}"/>
  <rect x="${sheetW - 28}" width="28" height="${sheetH}" fill="${blast.void}"/>
${groups}
</svg>
`;

writeFileSync(join(dir, 'sheet.svg'), sheet);
console.log(
  plates.map((plate) => `${plate.label} ${plate.w}x${plate.h}`).join('\n'),
);
