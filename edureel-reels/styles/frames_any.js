// usage: node frames_any.js page.html spec.json outDir [--stills t1,t2 --panel panel.mov]
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
(async () => {
  const [html, specPath, outDir] = process.argv.slice(2);
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  const si = process.argv.indexOf('--stills'); const stills = si > 0 ? process.argv[si + 1].split(',').map(Number) : null;
  const pi = process.argv.indexOf('--panel'); const panel = pi > 0 ? process.argv[pi + 1] : null;
  const fps = 30, n = Math.round(spec.duration * fps);
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1.5 });
  await page.goto('file://' + path.resolve(html));
  await page.evaluate(s => window.init(s), spec);
  await page.evaluate(() => document.fonts.ready);
  const ts = stills || [...Array(n).keys()].map(i => i / fps);
  for (let k = 0; k < ts.length; k++) {
    const t = ts[k];
    const f = stills ? path.join(outDir, `ov_${t.toFixed(2)}.png`) : path.join(outDir, `f_${String(k).padStart(5, '0')}.png`);
    await page.evaluate(t => window.render(t), t);
    fs.writeFileSync(f, await page.screenshot({ omitBackground: true }));
    if (stills && panel) spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', panel, '-i', f, '-filter_complex', '[0:v][1:v]overlay=0:0', '-frames:v', '1', path.join(outDir, `still_${t.toFixed(2)}.jpg`)]);
    if (!stills && k % 300 === 0) process.stderr.write(`frame ${k}/${n}\n`);
  }
  await browser.close();
})();
