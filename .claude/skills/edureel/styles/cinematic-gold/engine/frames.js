// usage: node frames.js spec.json outDir  -> writes outDir/f_00000.png ... (1080x1920 RGBA)
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('fs'), path = require('path');

(async () => {
  const [specPath, outDir] = process.argv.slice(2);
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  const fps = 30, n = Math.round(spec.duration * fps);
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1.5 });
  await page.goto('file://' + path.join(__dirname, 'mg.html'));
  await page.evaluate(s => window.init(s), spec);
  await page.evaluate(() => document.fonts.ready);
  const i0 = +(process.env.I0 || 0), i1 = +(process.env.I1 || n);
  for (let i = i0; i < i1; i++) {
    const f = path.join(outDir, `f_${String(i).padStart(5, '0')}.png`);
    if (fs.existsSync(f)) continue;
    await page.evaluate(t => window.render(t), i / fps);
    fs.writeFileSync(f + '.tmp', await page.screenshot({ omitBackground: true }));
    fs.renameSync(f + '.tmp', f);
    if (i % 300 === 0) process.stderr.write(`frame ${i}/${n}\n`);
  }
  await browser.close();
  process.stderr.write(`done ${n}\n`);
})();
