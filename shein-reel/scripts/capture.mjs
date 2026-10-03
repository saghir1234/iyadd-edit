// node scripts/capture.mjs <url> <out.png> [--hide-fixed] [--full] [--click "<css or text>"] [--wait 2500]
// Captures the real product as a phone sees it: 360x640 CSS px at 3x = exactly 1080x1920.
// --hide-fixed hides floating bars (bottom nav, banners) so the content under them is visible.
// Pages change during the day: capture on the day you render.
import {chromium} from 'playwright';
import {writeFileSync, mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
const [url, out] = process.argv.slice(2);
const opt = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes('--' + k);
if (!url || !out) { console.log('usage: node scripts/capture.mjs <url> <out.png> [--hide-fixed] [--full] [--click "..."] [--wait ms]'); process.exit(1); }
// Playwright's own browser if installed (npx playwright install chromium), otherwise the Chrome already on the machine
const b = await chromium.launch({args: ['--no-sandbox'], executablePath: process.env.CHROME_PATH || undefined}).catch(() => chromium.launch({channel: 'chrome', args: []}));
const ctx = await b.newContext({viewport: {width: 360, height: 640}, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: opt('locale', 'ar-SA'),
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'});
const p = await ctx.newPage();
await p.goto(url, {waitUntil: 'networkidle', timeout: 60000}).catch(() => {});
await p.waitForTimeout(+opt('wait', 2500));
const click = opt('click', null);
if (click) {                                   // close a dialog without sharing anything (e.g. the X of a location prompt)
  const el = click.startsWith('text=') ? p.getByText(click.slice(5)).first() : p.locator(click).first();
  await el.click({force: true, timeout: 3000}).catch(() => console.log('could not click', click));
  await p.waitForTimeout(800);
}
if (has('hide-fixed')) {
  await p.evaluate(() => { for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el);
    if ((cs.position === 'fixed' || cs.position === 'sticky') && el.getBoundingClientRect().top > 400) el.style.visibility = 'hidden'; } });
  await p.waitForTimeout(200);
}
mkdirSync(dirname(out), {recursive: true});
writeFileSync(out, await p.screenshot({fullPage: has('full')}));
console.log('saved', out);
await b.close();
