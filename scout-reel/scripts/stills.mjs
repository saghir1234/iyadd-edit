// node scripts/stills.mjs 1.0 4.2 ...  → out/stills/<t>.jpg (one bundle, many stills)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const browserExecutable = process.env.CHROME_PATH || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'Reel', browserExecutable});
fs.mkdirSync('out/stills', {recursive: true});
for (const t of process.argv.slice(2)) {
  await renderStill({serveUrl, composition, frame: Math.round(Number(t) * 30), output: `out/stills/${t}.jpg`, imageFormat: 'jpeg', scale: 0.5, browserExecutable});
}
