// Regenerates the Dario pose sheets from src/fighters/dario-art.ts.
// Run: node --experimental-strip-types art/dario/render-sheets.mjs
// Not part of `npm run build`.

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDarioSheets } from '../../src/fighters/dario-art.ts';

const dir = dirname(fileURLToPath(import.meta.url));
const sheets = buildDarioSheets();
for (const [name, svg] of Object.entries(sheets)) {
  const path = join(dir, name);
  writeFileSync(path, svg);
  console.log(`${name} ${svg.length}`);
}
