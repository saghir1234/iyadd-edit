// Renders container/bag.png (transparent): a black shopping bag, front view, mouth open (transparent) so items can drop in.
import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
const wm = 'data:image/png;base64,' + readFileSync('public/brand/wordmark_white.png').toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1400" viewBox="0 0 1100 1400">
<defs>
 <linearGradient id="b" x1="0" x2="1"><stop offset="0" stop-color="#050506"/><stop offset=".12" stop-color="#1b1b1e"/><stop offset=".42" stop-color="#2d2d31"/><stop offset=".75" stop-color="#18181b"/><stop offset="1" stop-color="#050506"/></linearGradient>
 <linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".25" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
 <filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity=".45"/></filter>
</defs>
<path id="p" d="M130 300 Q550 450 970 300 L970 1290 Q970 1340 920 1340 L180 1340 Q130 1340 130 1290 Z" fill="url(#b)"/>
<path d="M130 300 Q550 450 970 300 L970 1290 Q970 1340 920 1340 L180 1340 Q130 1340 130 1290 Z" fill="url(#v)"/>
<path d="M130 300 Q550 450 970 300" fill="none" stroke="#4a4a50" stroke-width="7" stroke-linecap="round"/>
<path d="M130 1180 L970 1180" stroke="#000" stroke-opacity=".25" stroke-width="3"/>
<path d="M186 330 L186 1330 M914 330 L914 1330" stroke="#000" stroke-opacity=".28" stroke-width="3"/>
<image href="${wm}" x="${550 - 290}" y="560" width="580" height="${580 * 254 / 1191}"/>
<g fill="none" stroke="#f3f3f1" stroke-width="30" stroke-linecap="round" filter="url(#s)">
 <path d="M300 348 C270 80 460 80 430 369"/>
 <path d="M800 348 C830 80 640 80 670 369"/>
</g>
</svg>`;
const b = await chromium.launch({args: ['--no-sandbox'], executablePath: process.env.CHROME_PATH});
const p = await b.newPage({viewport: {width: 1100, height: 1400}});
await p.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
await p.screenshot({path: 'public/container/bag.png', omitBackground: true});
await b.close(); console.log('bag.png');
