// usage: node render.js spec.json panel.mp4 out.mp4 [--frames a,b,c --png-dir dir]
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');

(async () => {
  const [specPath, panelPath, outPath] = process.argv.slice(2);
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  const fi = process.argv.indexOf('--frames');
  const stills = fi > 0 ? process.argv[fi + 1].split(',').map(Number) : null;
  const pngDir = process.argv.indexOf('--png-dir') > 0 ? process.argv[process.argv.indexOf('--png-dir') + 1] : null;
  const fps = 30, n = Math.round(spec.duration * fps);
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1.5 });
  await page.goto('file://' + path.join(__dirname, 'mg.html'));
  await page.evaluate(s => window.init(s), spec);
  await page.evaluate(() => document.fonts.ready);
  const P = Object.fromEntries(Object.entries(spec.panel).map(([k, v]) => [k, Math.round(v * 1.5)]));
  if (stills) {
    for (const t of stills) {
      await page.evaluate(t => window.render(t), t);
      const png = await page.screenshot({ omitBackground: true });
      const f = path.join(pngDir, `ov_${t.toFixed(2)}.png`);
      fs.writeFileSync(f, png);
      // composite with panel frame at t for a true preview
      await new Promise(r => spawn('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', panelPath, '-i', f, '-filter_complex',
        `[0:v]pad=1080:1920:${P.x}:${P.y}:black[b];[b][1:v]overlay=0:0`, '-frames:v', '1', path.join(pngDir, `still_${t.toFixed(2)}.jpg`)], { stdio: 'inherit' }).on('close', r));
    }
    await browser.close(); return;
  }
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-i', panelPath, '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-filter_complex', `[0:v]fps=${fps},pad=1080:1920:${P.x}:${P.y}:black[b];[b][1:v]overlay=0:0:eof_action=pass,noise=alls=6:allf=t,format=yuv420p[v]`,
    '-map', '[v]', '-map', '0:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-c:a', 'aac', '-b:a', '256k',
    '-movflags', '+faststart', '-t', String(spec.duration), outPath], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => window.render(t), i / fps);
    const png = await page.screenshot({ omitBackground: true });
    if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) process.stderr.write(`frame ${i}/${n}\n`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', code => { process.stderr.write(`ffmpeg exit ${code}\n`); r(); }));
  await browser.close();
})();
