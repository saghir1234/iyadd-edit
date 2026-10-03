// node scripts/stills.mjs <out_dir> <t1> <t2> ...   (seconds; COMP=AppAdShort for the short cut)
// Renders exact frames (with motion blur, like the final render) so you can look before a full render.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
const [out, ...ts] = process.argv.slice(2);
mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: process.env.COMP || 'AppAd'});
for (const t of ts) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(parseFloat(t) * composition.fps));
  await renderStill({composition, serveUrl, output: `${out}/t${String(t).padStart(5, '0')}.png`, frame, imageFormat: 'png'});
  process.stdout.write(t + ' ');
}
console.log('done');
