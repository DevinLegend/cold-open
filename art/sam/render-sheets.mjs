// Regenerates the SAM pose sheet and silhouette sheet.
// Run: node --experimental-strip-types art/sam/render-sheets.mjs
// Not part of `npm run build`.

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSamSheets } from './paint.ts';

const dir = dirname(fileURLToPath(import.meta.url));
const sheets = buildSamSheets();
for (const [name, svg] of Object.entries(sheets)) {
  const path = join(dir, name);
  writeFileSync(path, svg);
  console.log(`${name} ${svg.length}`);
}
