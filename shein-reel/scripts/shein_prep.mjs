// Opens a SHEIN mobile page, rejects cookies, closes the app banner, saves a 1080x1920 screenshot.
// node scripts/shein_prep.mjs <url> <out.png> [--hide-fixed] [--dump-images out.json]
import {chromium} from 'playwright';
import {writeFileSync, mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
const [url, out] = process.argv.slice(2);
const has = (k) => process.argv.includes('--' + k);
const opt = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const b = await chromium.launch({args: ['--no-sandbox'], executablePath: process.env.CHROME_PATH});
const ctx = await b.newContext({viewport: {width: 360, height: 640}, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'en-US',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'});
const p = await ctx.newPage();
await p.goto(url, {waitUntil: 'domcontentloaded', timeout: 60000}).catch(e => console.log('goto', e.message));
await p.waitForTimeout(6000);
await p.getByText('Reject All', {exact: true}).first().click({timeout: 4000}).catch(() => console.log('no cookie dialog'));
await p.waitForTimeout(800);
// app-download banner: remove it (it carries a discount code that is not ours to show)
await p.evaluate(() => { for (const el of document.querySelectorAll('body *')) {
  if (/APP EXCLUSIVE|APPOFF|SHEIN APP/i.test(el.textContent || '') && el.getBoundingClientRect().height < 120 && el.getBoundingClientRect().top < 5) el.style.display = 'none'; } });
await p.waitForTimeout(500);
if (has('hide-fixed')) await p.evaluate(() => { for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el);
  if ((cs.position === 'fixed' || cs.position === 'sticky') && el.getBoundingClientRect().top > 400) el.style.visibility = 'hidden'; } });
const dump = opt('dump-images', null);
if (dump) { const imgs = await p.evaluate(() => [...document.images].map(i => ({src: i.currentSrc || i.src, alt: i.alt, r: i.getBoundingClientRect().toJSON()})).filter(i => i.r.width > 60));
  writeFileSync(dump, JSON.stringify(imgs, null, 1)); console.log('images', imgs.length); }
console.log('url', p.url(), 'title', await p.title());
mkdirSync(dirname(out), {recursive: true});
writeFileSync(out, await p.screenshot());
await b.close();
