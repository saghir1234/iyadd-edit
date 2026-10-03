// node scripts/basket/render.mjs [--body 17191b] [--label 5CC8D7] [--logo public/brand/logo.png]
// → public/container/basket_back.png + basket_front.png (1600x1250, transparent) and prints the rim geometry.
// Use it when you need a basket and have no clean photo of one. A real photo of the brand's own container is always better.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {extname, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const opt = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const T = {'.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png'};
const srv = createServer((q, s) => { try { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); const b = readFileSync(p);
  s.writeHead(200, {'content-type': T[extname(p)] || 'application/octet-stream'}); s.end(b); } catch { s.writeHead(404); s.end(); } }).listen(0);
// Playwright's own browser if installed (npx playwright install chromium), otherwise the Chrome already on the machine
const b = await chromium.launch({args: ['--use-angle=metal', '--enable-gpu']}).catch(() => chromium.launch({channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu']}));
const p = await b.newPage({viewport: {width: 1600, height: 1250}});
p.on('pageerror', (e) => console.error('PAGE', e.message));
const logo = opt('logo', null);
const qs = new URLSearchParams({body: opt('body', '17191b'), label: opt('label', 'ffffff'), ...(logo ? {logo: '/' + logo} : {})});
await p.goto(`http://localhost:${srv.address().port}/scripts/basket/basket.html?${qs}`);
await p.waitForFunction(() => window.ready === true && window.renderLayer, null, {timeout: 60000});
mkdirSync(join(ROOT, 'public', 'container'), {recursive: true});
let geo;
for (const L of ['back', 'front']) {
  geo = await p.evaluate((l) => window.renderLayer(l), L);
  writeFileSync(join(ROOT, 'public', 'container', `basket_${L}.png`), await p.locator('#c').screenshot({omitBackground: true}));
}
console.log('saved public/container/basket_back.png and basket_front.png');
console.log(`rim front y = ${geo.rimFL[1]} px in the 1600x1250 render → config.basket.rimFront`);
await b.close(); srv.close();
