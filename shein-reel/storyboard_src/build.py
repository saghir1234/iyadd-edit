import base64, io, html
from PIL import Image
D='/tmp/claude-0/-home-user-iyadd-edit/9688f4a2-8efe-546e-9350-d51722e3cc93/images/'
def b64(img, q=82, w=None):
    if w: img = img.resize((w, int(img.height*w/img.width)))
    buf = io.BytesIO(); img.convert('RGB').save(buf, 'JPEG', quality=q); return 'data:image/jpeg;base64,'+base64.b64encode(buf.getvalue()).decode()
scr = {k: Image.open(D+f'{n}.webp') for k, n in [('shorts',1),('shirts',3),('halloween',4),('shoes',5),('pants',6),('home',7),('cart',8)]}
S = {k: b64(v, w=360) for k, v in scr.items()}
# product tiles (photo only: above the price bars/badges), in the screenshot's 923x2000 pixels
tiles = {'shorts': (14,716,454,1300), 'shirts': (468,815,908,1400), 'halloween': (468,425,908,1010), 'shoes': (468,425,908,955), 'pants': (468,815,908,1400)}
T = {k: b64(scr[k].crop(tiles[k]), w=300) for k in tiles}
bar = {k: b64(scr[k].crop((0,110,923,260)), w=360) for k in scr}
def frame(inner, cls=''): return f'<div class="fr {cls}">{inner}</div>'
def img(src, c=''): return f'<img src="{src}" class="{c}">'
beats = [
 ('1. Open on the home screen', '0.0 – 1.2 s', frame(img(S['home'],'scr')+'<div class="q">Can’t decide<br>what to choose?</div>', 'blur'),
  'SHEIN’s own home screen, lightly blurred so people know the brand in the first second. The question fades in word by word as the voice says it.',
  'Slow push in.', 'One deep hit.', '“Can’t decide what to choose?”'),
 ('2. The question drops into the search bar', '1.2 – 2.4 s', frame(img(bar['halloween'],'bar')+'<div class="q small">Can’t decide…</div>'),
  'The question shrinks into SHEIN’s own search bar, in place of its hint. The camera zooms from the bar’s outer edge so the logo stays in frame.', 'Zoom 1.6× on the bar.', 'Soft air whoosh.', '“SHEIN has a wide range of styles and products to explore.”'),
 ('3. Type the first search', '2.4 – 4.0 s', frame(img(bar['halloween'],'bar')+'<div class="type">halloween deals<span>|</span></div>'),
  'Every search is typed, in SHEIN’s font, inside the bar. Queries as you gave them: halloween deals · summer short · shirts · black pants · red shoes.', 'Held on the bar.', 'iPhone key clicks, one per letter.', 'On-screen words land on the spoken ones.'),
 ('4. Results appear, the product lifts out of its tile', '4.0 – 5.6 s', frame(img(S['halloween'],'scr')+img(T['halloween'],'lift')),
  'The results page opens. The tile’s photo lifts out of its exact place, grows big and is held for about a second. Prices, “after coupon” lines and discount badges are covered or cropped. Nothing about price is shown.', 'Push toward the tile.', 'Soft whoosh on the lift.', ''),
 ('5. Into the bag', '5.6 – 6.6 s', frame('<div class="bag">SHEIN bag<br><small>see decision B</small></div>'+img(T['halloween'],'drop')),
  'The product drops into the bag and disappears inside it. Nothing hangs on top. The bag takes the weight. Every item enters the same way.', 'Wide, then a closer cut at the mouth.', 'Bag rustle, then a filled-bag landing.', ''),
 ('6. Items 2 to 5, same method', '6.6 – 17 s', ''.join(img(T[k],'mini') for k in ['shorts','shirts','pants','shoes']),
  'summer short → shirts → black pants → red shoes. Each: typed search, product out of its tile, held about a second, into the bag. The cart badge counts up with each one.', 'Same push every time.', 'Same sounds every time.', ''),
 ('7. The full bag is lifted onto the order screen', '17 – 19 s', frame(img(S['cart'],'scr')+'<div class="bag up">bag</div>'),
  'The bag is lifted out and onto SHEIN’s own cart screen. Held for about a second. Masked first: “Lebanon”, every price, the free-shipping and “Spend … get … OFF” lines. The status bar (time, battery) is cropped on every screen.', 'Camera follows the lift.', 'Bag lifted. Soft whoosh.', ''),
 ('8. The blade cut', '19 – 19.8 s', frame('<div class="cut"></div>'),
  'A single blade cut across the order screen. It opens onto the closing line.', 'Locked off.', 'Dagger whoosh.', ''),
 ('9. Closing line + handle', '19.8 – 24 s', frame('<div class="end"><b>Find your style<br>and shop your favorites<br>on SHEIN.</b><div class="hd">@shein by siya</div><div class="spec">Personal concept · not an official SHEIN ad</div></div>', 'dark'),
  'The closing line, on the blurred order screen. The handle @shein by siya stays small at the bottom for the whole film and grows in the last frame. The last frame says plainly that this is a personal concept.', 'Slow settle.', 'One deep hit.', '“Find your style and shop your favorites on SHEIN.”'),
]
cards = ''
for t, tm, fr, what, cam, snd, vo in beats:
    f = fr if fr.startswith('<div class="fr') else frame(fr)
    v = ('<dt>Voice</dt><dd>' + vo + '</dd>') if vo else ''
    cards += ('<section class="card"><div class="left">' + f + '</div><div class="right"><h3>' + t + ' <em>' + tm + '</em></h3><p>' + what +
              '</p><dl><dt>Camera</dt><dd>' + cam + '</dd><dt>Sound</dt><dd>' + snd + '</dd>' + v + '</dl></div></section>')
strip = ''.join(f'<figure>{img(T[k])}<figcaption>{n}</figcaption></figure>' for k, n in [('halloween','halloween deals'),('shorts','summer short'),('shirts','shirts'),('pants','black pants'),('shoes','red shoes')])
page = f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SHEIN by siya storyboard</title>
<style>
:root{{--bg:#fff;--fg:#111;--mut:#666;--card:#f5f5f7;--ac:#111}}@media(prefers-color-scheme:dark){{:root{{--bg:#111;--fg:#f2f2f2;--mut:#aaa;--card:#1d1d20;--ac:#fff}}}}
body{{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,sans-serif}}main{{max-width:880px;margin:auto;padding:24px 16px 80px}}
h1{{font-size:26px;margin:0}}h2{{margin-top:40px}}.sub{{color:var(--mut)}}
.card{{display:flex;gap:20px;background:var(--card);border-radius:16px;padding:16px;margin:16px 0;flex-wrap:wrap}}.left{{flex:0 0 216px}}.right{{flex:1;min-width:240px}}
.right h3{{margin:0 0 6px;font-size:17px}}.right em{{font-style:normal;color:var(--mut);font-weight:400;font-size:14px;display:block}}
dl{{display:grid;grid-template-columns:70px 1fr;gap:4px 8px;font-size:14px;margin:8px 0 0}}dt{{color:var(--mut)}}dd{{margin:0}}
.fr{{position:relative;width:216px;height:384px;background:#fff;border-radius:12px;overflow:hidden;color:#111}}.fr.dark{{background:#222;color:#fff}}
.fr img.scr{{width:100%;height:100%;object-fit:cover;object-position:top}}.bar{{width:100%;margin-top:30px}}
.ph,.bag{{position:absolute;inset:60px 20px;border:2px dashed #aaa;border-radius:12px;display:grid;place-content:center;text-align:center;font-weight:600;background:#eee}}
.ph small,.bag small,.miss small{{font-weight:400;color:#c00}}.blur .ph,.blur img.scr{{filter:blur(2px)}}
.q{{position:absolute;left:0;right:0;top:150px;text-align:center;font:700 26px/1.2 system-ui;animation:fade 3s infinite}}.q.small{{font-size:14px;top:80px}}
.type{{position:absolute;left:34px;top:62px;font-size:14px}}.type span{{animation:blink 1s infinite}}
.lift{{position:absolute;left:30px;top:80px;width:156px;border-radius:10px;box-shadow:0 10px 24px #0006;animation:lift 3s infinite}}
.bag{{inset:200px 30px 20px}}.drop{{position:absolute;left:68px;top:30px;width:80px;animation:drop 3s infinite}}
.mini{{display:inline-block;width:98px;margin:4px;border-radius:8px;vertical-align:top}}.miss{{height:84px;border:2px dashed #aaa;display:inline-grid;place-content:center;text-align:center;font-size:12px;font-weight:600;background:#eee}}
.up{{inset:60px 40px 160px;animation:lift 3s infinite}}.cut{{position:absolute;left:-20px;right:-20px;top:50%;height:3px;background:#fff;box-shadow:0 0 12px #fff;transform:rotate(-35deg);animation:cut 2s infinite}}
.end{{position:absolute;inset:0;display:grid;place-content:center;text-align:center;padding:12px;gap:14px}}.end b{{font-size:20px}}.hd{{font-size:13px}}.spec{{font-size:9px;opacity:.7}}
@keyframes fade{{0%{{opacity:0}}30%,80%{{opacity:1}}100%{{opacity:0}}}}@keyframes blink{{50%{{opacity:0}}}}@keyframes lift{{0%{{transform:scale(.6) translateY(40px);opacity:.4}}50%,80%{{transform:scale(1);opacity:1}}100%{{opacity:0}}}}
@keyframes drop{{0%{{transform:translateY(0)}}70%{{transform:translateY(190px) scale(.8);opacity:1}}100%{{transform:translateY(210px) scale(.7);opacity:0}}}}@keyframes cut{{0%{{transform:translateX(-300px) rotate(-35deg)}}100%{{transform:translateX(300px) rotate(-35deg)}}}}
figure{{display:inline-block;margin:6px;width:150px;text-align:center;font-size:13px}}figure img{{width:100%;border-radius:8px}}.warn{{background:var(--card);border-left:4px solid #c00;padding:10px 14px;border-radius:8px}}
</style><main>
<h1>SHEIN by siya — storyboard</h1><p class="sub">Personal concept inspired by SHEIN · text + female voice-over · sound effects only, no music · about 24 s</p>
<h2>The products</h2><p class="sub">Cut from your screenshots (photo area only, no prices or badges). These are low-resolution: see decision A.</p>{strip}
<h2>Beats</h2>{cards}
<h2>Sound</h2><p>Real foley only: iPhone key clicks · plastic bag rustle · a filled bag landing · a bag lifted · a soft air whoosh · a dagger whoosh for the cut · one deep hit at the start and the end. Voice: natural, youthful, female, one voice, you pick the takes by ear.<br><b>Never:</b> music, bubbles, dings, springs, risers, cartoon sounds.</p>
<h2>Rules I’m following from your brief</h2><p>No invented prices, discounts, specs or claims — every discount, coupon, “Save $”, sold-count and price on the SHEIN screens is covered or cropped. No “safest place to order”. Handle exactly <b>@shein by siya</b>, small for the whole film. Last frame says it’s a personal concept, not official.</p>
<h2>Screens received</h2><p>Home, cart, and the five searches (halloween deals, summer short, shirts, black pant, red shoes). Nothing else is needed from you except decision A and your OK.</p><h2>Decisions</h2><p><b>A. Product photos.</b> <i>Recommended:</i> send the product page images (save the main photo of each pick at full size), so I can cut them out cleanly. <i>Fallback:</i> use the tile photos from your screenshots as rounded cards that lift out (no cut-out; softer, with models and backgrounds).<br>
<b>B. The container.</b> <i>Recommended:</i> a plain shopping bag in SHEIN’s black/white with the SHEIN wordmark, drawn from the logo on SHEIN’s site. SHEIN’s own bag photo if you can send one.<br>
<b>C. Length.</b> About 24 s at 4 s per product. A 15 s short cut is made too.<br>
<b>D. Search terms.</b> I kept your exact words as typed in your screenshots: “summer short”, “black pant”.<br><b>E. Home screen.</b> Its search hint reads “Black Pants For Women” (personalised to your account). It is covered by the typed question, so it never shows.</p>
</main></html>'''
open('storyboard.html','w').write(page); print(len(page)//1024,'KB')
