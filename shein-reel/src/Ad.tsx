// App ad, built from real screens: search → the product lifts out of its tile → into the bag (or a basket that
// pours into the bag) → the full bag is lifted onto the final screen → a blade cut → the closing line.
// Everything product-specific lives in config.json; every time lives in timeline.json (made by scripts/timeline.py).
import React, {createContext, useContext} from 'react';
import {AbsoluteFill, Audio, Img, continueRender, delayRender, getRemotionEnvironment, staticFile, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import CFG from './config.json';
import TL_FULL from './timeline.json';

const C: any = CFG;
const [W, H] = C.canvas as [number, number];
const RTL = (C.direction ?? 'rtl') === 'rtl';
const FPS = C.fps as number;

// ─── fonts (declared in config.fonts, files in public/) ──────────────────────
let fontsStarted = false;
const loadFonts = () => {
  if (fontsStarted) return;
  fontsStarted = true;
  const h = delayRender('fonts');
  Promise.all((C.fonts as {family: string; file: string; weight: string}[]).map((f) =>
    new FontFace(f.family, `url(${staticFile(f.file)})`, {weight: String(f.weight)}).load().then((l) => document.fonts.add(l))))
    .then(() => continueRender(h)).catch((e) => { console.error(e); continueRender(h); });
};
loadFonts();

// ─── timeline from context: the full film and the short cut share every scene ─
type Round = {id: string; q: string; box: 'bag' | 'basket'; start?: number; clear?: number; type: number; step: number; enter: number;
  cut: number; tap: number; pop: number; up: number; fall: number; close?: number; in: number; end: number};
const TLCtx = createContext<any>(TL_FULL);
const useTL = () => { const TL = useContext(TLCtx); return {TL, RS: TL.rounds as Round[], PO: TL.pour}; };

// ─── time helpers ────────────────────────────────────────────────────────────
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const eIO = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const eOut = (p: number) => 1 - Math.pow(1 - p, 3);
const eIn = (p: number) => p * p * p;
const eIn2 = (p: number) => p * p;
// closed-form damped spring 0 → 1: any frame can be drawn on its own
const spring = (t: number, t0: number, f = 2.4, z = 0.55) => {
  const d = t - t0;
  if (d <= 0) return 0;
  const w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * d) * (Math.cos(wd * d) + ((z * w) / wd) * Math.sin(wd * d));
};
// a knock that rings out: a container taking a weight
const knock = (t: number, t0: number, a = 1, f = 3.2, tau = 0.13) => {
  const d = t - t0;
  return d < 0 ? 0 : a * Math.exp(-d / tau) * Math.cos(2 * Math.PI * f * d);
};
// camera: an app point → a screen point at scale s
const cam = (s: number, ax: number, ay: number, sx = ax, sy = ay, rot = 0) =>
  ({transform: `translate(${sx}px, ${sy}px) rotate(${rot}deg) scale(${s}) translate(${-ax}px, ${-ay}px)`, transformOrigin: '0 0'} as React.CSSProperties);

// ─── products ────────────────────────────────────────────────────────────────
const ITEM: Record<string, any> = Object.fromEntries(C.items.map((i: any) => [i.id, i]));
type Pose = {x: number; y: number; w: number; r: number; o?: number; sh?: number};
const size = (id: string): [number, number] => (TL_FULL as any).sizes[id];
const fit = (id: string, box: number) => {
  const [w, h] = size(id);
  return w >= h ? {w: box, h: (box * h) / w} : {w: (box * w) / h, h: box};
};
const poseW = (id: string, box: number) => fit(id, box).w;
const Item: React.FC<{id: string; p: Pose}> = ({id, p}) => {
  const [iw, ih] = size(id), h = (p.w * ih) / iw, sh = p.sh ?? 1;
  return (
    <Img src={staticFile(ITEM[id].image)} style={{position: 'absolute', left: p.x - p.w / 2, top: p.y - h / 2, width: p.w, height: h,
      transform: `rotate(${p.r}deg)`, opacity: p.o ?? 1, filter: `drop-shadow(0 ${26 * sh}px ${30 * sh}px rgba(0,30,40,${0.26 * sh}))`}} />
  );
};
const mix = (a: Pose, b: Pose, q: number): Pose => ({x: lerp(a.x, b.x, q), y: lerp(a.y, b.y, q), w: lerp(a.w, b.w, q), r: lerp(a.r, b.r, q), sh: lerp(a.sh ?? 1, b.sh ?? 1, q)});
const tileOf = (id: string): Pose => {
  const [x0, y0, x1, y1] = ITEM[id].tile;
  return {x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, r: 0, sh: 0.1};
};
const HERO_R = [-5, -6, 5, -4, -8, 3];
const heroOf = (r: Round, i: number, t: number): Pose => ({x: W / 2, y: H * 0.417 + Math.sin((t - r.pop) * 3) * 6 * prog(t, r.pop + 0.4, r.pop + 0.7),
  w: poseW(r.id, ITEM[r.id].heroBox ?? 600), r: HERO_R[i % HERO_R.length]});

// ─── their screens ───────────────────────────────────────────────────────────
const B = C.bar;
const [BX0, BY0, BX1, BY1] = B.rect as number[];
const BCY = B.textCenterY ?? (BY0 + BY1) / 2;
const HB: any = {...B, ...(B.home ?? {})};
const Typed: React.FC<{text: string; caret: number; bar?: any}> = ({text, caret, bar = B}) => (
  <div style={{position: 'absolute', ...(RTL ? {right: W - bar.textEdge} : {left: bar.textEdge}), top: (bar.textCenterY ?? BCY) - 40, height: 80, display: 'flex', alignItems: 'center',
    direction: RTL ? 'rtl' : 'ltr', font: `400 ${B.fontSize}px ${B.font}`, color: B.ink, whiteSpace: 'nowrap'}}>
    <span>{text}</span>
    <span style={{width: 3, height: B.fontSize * 1.2, borderRadius: 2, background: B.caret, marginInlineStart: text ? 3 : 0, opacity: caret}} />
  </div>
);
const caretBlink = (t: number) => (Math.floor(t * 2.2) % 2 === 0 ? 1 : 0);
const Hint: React.FC<{o: number; bar?: any}> = ({o, bar = B}) => {
  const [x0, y0, x1, y1] = bar.hint;
  return <div style={{position: 'absolute', left: x0, top: y0, width: x1 - x0, height: y1 - y0, background: B.fill, opacity: o}} />;
};
const Screen: React.FC<{src: string}> = ({src}) => <Img src={staticFile(src)} style={{position: 'absolute', left: 0, top: 0, width: W, height: H, objectFit: 'cover'}} />;

const Home: React.FC<{hint: number; children?: React.ReactNode}> = ({hint, children}) => (
  <AbsoluteFill style={{background: '#fff'}}><Screen src={C.opening.screen} /><Hint o={hint} bar={HB} />{children}</AbsoluteFill>
);
const Results: React.FC<{id: string; query: string; caret?: number; hole?: boolean; cart?: number; bump?: number}> = ({id, query, caret = 0, hole = false, cart = 0, bump = 1}) => {
  const it = ITEM[id], src = staticFile(it.screen);
  const [x0, y0, x1, y1] = it.tile, pad = it.holePad ?? 12, [px, py] = it.plus ?? [0, 0], pr = it.plusR ?? 50;
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      <Screen src={it.screen} />
      {hole && (
        <>
          {/* the photo has left its tile: the tile is empty, its + button stays */}
          <div style={{position: 'absolute', left: x0 - pad, top: y0 - pad, width: x1 - x0 + 2 * pad, height: y1 - y0 + 2 * pad, borderRadius: 24, background: it.tileFill ?? '#fff'}} />
          {it.plus && (
            <div style={{position: 'absolute', left: px - pr, top: py - pr, width: 2 * pr, height: 2 * pr, borderRadius: pr, overflow: 'hidden'}}>
              <Img src={src} style={{position: 'absolute', left: -(px - pr), top: -(py - pr), width: W, height: H}} />
            </div>
          )}
        </>
      )}
      {C.cart && cart > 0 && (
        <div style={{position: 'absolute', left: C.cart.x - 22, top: C.cart.y - 22, width: 44, height: 44, borderRadius: 22, background: C.cart.color, color: '#fff',
          font: `700 26px ${B.font}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${bump})`, boxShadow: '0 0 0 4px #fff'}}>{cart}</div>
      )}
      <Hint o={1} /><Typed text={query} caret={caret} />
    </AbsoluteFill>
  );
};
const Final: React.FC = () => <AbsoluteFill style={{background: '#fff'}}><Screen src={C.final?.screen ?? C.opening.screen} /></AbsoluteFill>;
const TapMark: React.FC<{t: number; at: number; x: number; y: number}> = ({t, at, x, y}) => {
  const d = t - at;
  if (d < -0.1 || d > 0.4) return null;
  const inP = prog(d, -0.1, 0), outP = prog(d, 0.06, 0.4);
  const s = lerp(1.25, 1, eOut(inP)) * lerp(1, 1.5, eOut(outP));
  return <div style={{position: 'absolute', left: x - 42, top: y - 42, width: 84, height: 84, borderRadius: 42, background: 'rgba(30,40,44,.22)',
    border: '2px solid rgba(255,255,255,.6)', opacity: inP * (1 - outP), transform: `scale(${s})`}} />;
};

// ─── the bag: one photo, drawn twice (the inside of its back above the rim, then its front) ─
const BG = C.bag;
const [BW, BH] = (TL_FULL as any).sizes.__bag as [number, number];
const BK = BG.scale, REST = {cx: BG.rest[0], top: BG.rest[1]};
const MOUTH_Y = REST.top + BG.rim * BK;
type BagState = {cx: number; top: number; k: number; f: number; sq: number; dy: number; rot?: number};
const bagXf = (b: BagState) => {
  const sx = (1 + 0.05 * b.f) * (1 + 0.55 * b.sq), sy = 1 - b.sq;
  const tx = b.cx - (BW * b.k) / 2 + b.k * (BW / 2) * (1 - sx), ty = b.top + b.dy + b.k * BH * (1 - sy);
  return {transform: `translate(${tx}px, ${ty}px) rotate(${b.rot ?? 0}deg) scale(${b.k * sx}, ${b.k * sy})`, transformOrigin: '0 0'} as React.CSSProperties;
};
const [OX0, OX1, OY0, OY1] = BG.opening ?? [23, 77, 6, 36];      // the mouth between the handles, in % of the photo
const BagBack: React.FC<{b: BagState}> = ({b}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: BW, height: BH, ...bagXf(b)}}>
    <div style={{position: 'absolute', inset: 0, clipPath: `polygon(${OX0}% ${OY0}%, ${OX1}% ${OY0}%, ${OX1}% ${OY1}%, ${OX0}% ${OY1}%)`, transform: `translateY(${-(8 + 40 * b.f)}px)`}}>
      <Img src={staticFile(BG.image)} style={{width: BW, filter: 'brightness(.46) saturate(1.25)'}} />
    </div>
    <div style={{position: 'absolute', left: BW / 2 - BW * 0.224, top: BG.rim - 34 - 30 * b.f, width: BW * 0.448, height: 70 + 50 * b.f, borderRadius: '50%',
      opacity: 0.6 + 0.4 * b.f, background: 'radial-gradient(ellipse at 50% 65%, rgba(0,0,0,.75) 0, rgba(0,0,0,.4) 45%, rgba(0,0,0,0) 72%)'}} />
  </div>
);
const BagFront: React.FC<{b: BagState}> = ({b}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: BW, height: BH, ...bagXf(b)}}>
    <Img src={staticFile(BG.image)} style={{width: BW}} />
    <div style={{position: 'absolute', inset: 0, WebkitMaskImage: `url(${staticFile(BG.image)})`, WebkitMaskSize: '100% 100%',
      background: `radial-gradient(ellipse 60% 70% at 50% 58%, rgba(255,255,255,${0.06 * b.f}) 0, rgba(0,0,0,0) 55%, rgba(0,0,0,${0.08 + 0.1 * b.f}) 100%)`}} />
  </div>
);
const rise = (t: number, t0: number) => lerp(H * 0.55, 0, clamp(spring(t, t0, 1.9, 0.74), 0, 1.2));
// drops through the mouth and is gone inside: nothing is left hanging on top
const dropIn = (id: string, t: number, from: Pose, t0: number, dur: number, rEnd: number, box = 320): Pose | null => {
  const q = prog(t, t0, t0 + dur);
  if (q >= 1) return null;
  const {w, h} = fit(id, box), rr = (rEnd * Math.PI) / 180;
  const halfV = (Math.abs(w * Math.sin(rr)) + Math.abs(h * Math.cos(rr))) / 2;
  const inside = {x: REST.cx, y: MOUTH_Y + halfV + 34, w, r: rEnd, sh: 0};
  const p = mix(from, inside, eIn2(q));
  p.x = lerp(from.x, inside.x, eOut(q));
  return p;
};
const BagStage: React.FC<{view: React.CSSProperties; bg: React.ReactNode; blur: number; b: BagState; items: [string, Pose][]; hideBag?: boolean}> = ({view, bg, blur, b, items, hideBag}) => (
  <AbsoluteFill style={{background: '#fff', overflow: 'hidden'}}>
    <AbsoluteFill style={view}>
      <AbsoluteFill style={{filter: `blur(${blur}px) brightness(${1 - blur * 0.004})`, transform: `scale(${1 + blur * 0.004})`}}>{bg}</AbsoluteFill>
      {!hideBag && <BagBack b={b} />}
      {items.map(([id, p], i) => <Item key={i} id={id} p={p} />)}
      {!hideBag && <BagFront b={b} />}
    </AbsoluteFill>
  </AbsoluteFill>
);

// ─── the basket: rendered once in 3D as two layers, inside and front ─────────
const BS = C.basket ?? null;
const bsk = BS ? {s: BS.scale, left: BS.left, top: BS.top, w: BS.size[0], h: BS.size[1]} : null;
const BSK_C = bsk ? {x: bsk.left + (bsk.w * bsk.s) / 2, y: bsk.top + 520 * bsk.s} : {x: 0, y: 0};
const restIn = (id: string, j: number, n: number): Pose => ({x: W / 2 + (j - (n - 1) / 2) * 150, y: bsk!.top + BS.rimFront * bsk!.s + 30 - (j % 2) * 18,
  w: poseW(id, 280), r: [-9, 13, 4, -5][j % 4], sh: 0.4});
const BasketLayer: React.FC<{which: 'back' | 'front'; style?: React.CSSProperties}> = ({which, style}) => (
  <Img src={staticFile(which === 'back' ? BS.back : BS.front)} style={{position: 'absolute', left: bsk!.left, top: bsk!.top, width: bsk!.w * bsk!.s, height: bsk!.h * bsk!.s, ...style}} />
);
const BasketShadow: React.FC<{dy: number; o?: number}> = ({dy, o = 1}) => (
  <div style={{position: 'absolute', left: W * 0.176, top: bsk!.top + 900 * bsk!.s + dy, width: W * 0.65, height: 70, borderRadius: '50%',
    opacity: o * clamp(1 - dy / 600), background: 'radial-gradient(ellipse at 50% 50%, rgba(0,30,40,.3) 0, rgba(0,30,40,0) 70%)'}} />
);
const inBasket = (p: Pose, c: {x: number; y: number}, rot: number): Pose => {
  const a = (rot * Math.PI) / 180, dx = p.x - BSK_C.x, dy = p.y - BSK_C.y;
  return {...p, x: c.x + dx * Math.cos(a) - dy * Math.sin(a), y: c.y + dx * Math.sin(a) + dy * Math.cos(a), r: p.r + rot};
};

// ─── beats ───────────────────────────────────────────────────────────────────
const ZOOM = B.zoom ?? 1.6;
const AX = RTL ? W : 0;                                 // the bar's outer edge stays put, so the logo is never cropped
const DIVE_X = RTL ? B.textEdge - B.fontSize * 1.8 : B.textEdge + B.fontSize * 1.8;
const diveCam = (d: number) => cam(lerp(ZOOM, 11, d), DIVE_X, BCY, AX + (DIVE_X - AX) * ZOOM, BCY * ZOOM + (BCY - BCY * ZOOM) * eIn(d));

const SearchBeat: React.FC<{t: number; r: Round; prev: Round; n0: number}> = ({t, r, prev, n0}) => {
  const n = t < r.type ? 0 : clamp(Math.floor((t - r.type) / r.step) + 1, 0, [...r.q].length);
  const text = t < (r.clear ?? 0) ? prev.q : [...r.q].slice(0, n).join('');
  let camStyle = cam(ZOOM, AX, BCY, AX, BCY * ZOOM), blur = 0;
  if (t >= r.enter) { const d = eIn(prog(t, r.enter, r.cut)); camStyle = diveCam(d); blur = lerp(0, 18, d); }
  return (
    <AbsoluteFill style={{background: '#fff', overflow: 'hidden'}}>
      <AbsoluteFill style={{...camStyle, filter: `blur(${blur}px)`}}>
        <Results id={prev.id} query={text} caret={t < r.enter ? caretBlink(t - (r.start ?? 0)) : 0} hole cart={n0} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
const ResultsBeat: React.FC<{t: number; r: Round; i: number}> = ({t, r, i}) => {
  const st = eOut(prog(t, r.cut, r.cut + 0.3));
  const it = t >= r.pop ? mix(tileOf(r.id), heroOf(r, i, t), clamp(spring(t, r.pop, 2.2, 0.6), 0, 1.08)) : null;
  const badgeAt = r.pop + 0.36;
  const [px, py] = ITEM[r.id].plus ?? [W / 2, H / 2];
  return (
    <AbsoluteFill style={{background: '#fff', overflow: 'hidden'}}>
      <AbsoluteFill style={{...cam(lerp(1.18, 1, st), DIVE_X, BCY), filter: `blur(${lerp(12, 0, st)}px)`}}>
        <Results id={r.id} query={r.q} hole={t >= r.pop} cart={t >= badgeAt ? i + 1 : i} bump={t >= badgeAt ? clamp(spring(t, badgeAt, 3, 0.45), 0, 1.3) : 1} />
      </AbsoluteFill>
      <TapMark t={t} at={r.tap} x={px} y={py} />
      {it && <Item id={r.id} p={it} />}
    </AbsoluteFill>
  );
};
const fullness = (RS: Round[], i: number): [number, number] => {
  const bags = RS.filter((x) => x.box === 'bag'), j = bags.indexOf(RS[i]), n = bags.length + (RS.some((x) => x.box === 'basket') ? 1.4 : 0);
  return [j / n, (j + 1) / n].map((v) => v * 0.9) as [number, number];
};
const BagBeat: React.FC<{t: number; r: Round; i: number}> = ({t, r, i}) => {
  const {RS} = useTL();
  const hero = heroOf(r, i, t);
  const above: Pose = {x: REST.cx, y: MOUTH_Y - 150, w: poseW(r.id, 330), r: 6, sh: 0.6};
  let it: Pose | null = hero;
  if (t >= r.fall) it = t < r.close! ? mix(hero, above, eIn2(prog(t, r.fall, r.close!))) : dropIn(r.id, t, above, r.close!, r.in - r.close!, i % 2 ? -4 : 12);
  const [f0, f1] = fullness(RS, i);
  const b: BagState = {cx: REST.cx, top: REST.top + rise(t, r.up), k: BK, f: lerp(f0, f1, eOut(prog(t, r.in, r.in + 0.3))), sq: knock(t, r.in, 0.05), dy: knock(t, r.in, 22)};
  const view = t >= r.close! ? cam(1.33, REST.cx, MOUTH_Y - 60, REST.cx, H * 0.552) : cam(1, 0, 0);
  return <BagStage view={view} bg={<Results id={r.id} query={r.q} hole cart={i + 1} />} blur={lerp(0, 11, eOut(prog(t, r.up, r.up + 0.28)))} b={b} items={it ? [[r.id, it]] : []} />;
};
const BasketBeat: React.FC<{t: number; r: Round; i: number}> = ({t, r, i}) => {
  const {RS} = useTL();
  const BR = RS.filter((x) => x.box === 'basket'), idx = BR.indexOf(r);
  const up = lerp(H * 0.43, 0, clamp(spring(t, r.up, 2.1, 0.72), 0, 1.2));
  const dy = up + knock(t, r.in, 12, 3.4, 0.1);
  const inside: [string, Pose][] = BR.slice(0, idx).map((x, j) => { const p = restIn(x.id, j, BR.length); return [x.id, {...p, y: p.y + dy}]; });
  let it: Pose = heroOf(r, i, t);
  if (t >= r.fall) {
    const rest = restIn(r.id, idx, BR.length), q = prog(t, r.fall, r.in);
    const to = {...rest, y: rest.y + dy};
    const h = heroOf(r, i, t);
    it = mix(h, to, eIn2(q)); it.x = lerp(h.x, to.x, eOut(q)); it.sh = lerp(1, 0.4, q);
  }
  const ls = {transform: `translateY(${dy}px)`};
  return (
    <AbsoluteFill style={{background: '#fff', overflow: 'hidden'}}>
      <AbsoluteFill style={{filter: `blur(${lerp(0, 11, eOut(prog(t, r.up, r.up + 0.28)))}px)`}}><Results id={r.id} query={r.q} hole cart={i + 1} /></AbsoluteFill>
      <BasketShadow dy={dy} />
      <BasketLayer which="back" style={ls} />
      {inside.map(([id, p], j) => <Item key={j} id={id} p={p} />)}
      <Item id={r.id} p={it} />
      <BasketLayer which="front" style={ls} />
    </AbsoluteFill>
  );
};
const PourBeat: React.FC<{t: number}> = ({t}) => {
  const {RS, PO} = useTL();
  const last = RS[RS.length - 1], BR = RS.filter((x) => x.box === 'basket');
  const f0 = fullness(RS, RS.map((x) => x.box).lastIndexOf('bag'))[1];
  const to = {x: W * 0.305, y: H * 0.333};
  const where = (tt: number) => { const mv = eIO(prog(tt, PO.move[0], PO.move[1])); return {c: {x: lerp(BSK_C.x, to.x, mv), y: lerp(BSK_C.y, to.y, mv)}, rot: lerp(0, 122, mv), mv}; };
  const ex = eIn(prog(t, PO.exit[0], PO.exit[1])), now = where(t);
  const c = {x: lerp(now.c.x, -420, ex), y: lerp(now.c.y, 60, ex)}, rot = now.rot + 40 * ex;
  const inside: [string, Pose][] = [], falling: [string, Pose][] = [];
  let f = f0, sq = 0, dyb = 0;
  BR.forEach((x, j) => {
    const tOut = PO.out[j];
    if (t < tOut) { inside.push([x.id, restIn(x.id, j, BR.length)]); return; }
    const w0 = where(tOut), rp = restIn(x.id, j, BR.length);
    const from = inBasket({...rp, y: rp.y - 120}, w0.c, w0.rot);
    const p = dropIn(x.id, t, {...from, sh: 0.6}, tOut, PO.fallDur, [8, -78, -6][j % 3], 290);
    if (p) falling.push([x.id, p]);
    const tin = tOut + PO.fallDur, lastOne = j === BR.length - 1;
    f += ((1 - f0) / BR.length) * eOut(prog(t, tin, tin + 0.25)); sq += knock(t, tin, lastOne ? 0.06 : 0.03); dyb += knock(t, tin, lastOne ? 30 : 14);
  });
  const b: BagState = {cx: REST.cx, top: REST.top + rise(t, PO.bagup), k: BK, f, sq, dy: dyb};
  return (
    <AbsoluteFill style={{background: '#fff', overflow: 'hidden'}}>
      <BagStage view={cam(1, 0, 0)} bg={<Results id={last.id} query={last.q} hole cart={RS.length} />} blur={11} b={b} items={falling} />
      {t < PO.exit[1] && (
        <AbsoluteFill style={{transformOrigin: `${BSK_C.x}px ${BSK_C.y}px`, transform: `translate(${c.x - BSK_C.x}px, ${c.y - BSK_C.y}px) rotate(${rot}deg)`}}>
          <BasketShadow dy={0} o={1 - now.mv} />
          <BasketLayer which="back" />
          {inside.map(([id, p], j) => <Item key={j} id={id} p={p} />)}
          <BasketLayer which="front" />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
// the full bag is lifted away; the camera follows it up onto the final screen
const LiftBeat: React.FC<{t: number}> = ({t}) => {
  const {TL, RS} = useTL();
  const last = RS[RS.length - 1];
  const L = eIn(prog(t, TL.lift[0], TL.lift[1])), w = eIO(prog(t, TL.whip[0], TL.whip[1]));
  const b: BagState = {cx: REST.cx, top: REST.top - L * H * 1.3, k: BK, f: 0.95, sq: -0.03 * Math.sin(Math.PI * prog(t, TL.lift[0], TL.lift[0] + 0.25)), dy: 0, rot: -3 * L};
  return (
    <AbsoluteFill style={{background: '#fff', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translateY(${w * H}px)`}}>
        <BagStage view={cam(1, 0, 0)} bg={<Results id={last.id} query={last.q} hole cart={RS.length} />} blur={11} b={b} items={[]} hideBag={t >= TL.lift[1] + 0.2} />
      </AbsoluteFill>
      <AbsoluteFill style={{transform: `translateY(${(w - 1) * H}px)`}}><Final /></AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── the blade cut and the closing line ──────────────────────────────────────
const S = C.slash ?? {};
const P1 = {x: -90, y: H * 0.786}, P2 = {x: W + 90, y: H * 0.151};
const EndBg: React.FC = () => <AbsoluteFill style={{filter: 'blur(9px) brightness(.55)', transform: 'scale(1.03)'}}><Final /></AbsoluteFill>;
const Slash: React.FC<{t: number}> = ({t}) => {
  const {TL} = useTL();
  const q = prog(t, TL.slash[0], TL.slash[1]);
  const sx = lerp(P1.x, P2.x, eIO(q)), sy = lerp(P1.y, P2.y, eIO(q));
  const ang = (Math.atan2(P2.y - P1.y, P2.x - P1.x) * 180) / Math.PI, len = Math.hypot(sx - P1.x, sy - P1.y);
  const sp = eIO(prog(t, TL.split[0], TL.split[1]));
  const n = Math.hypot(P2.x - P1.x, P2.y - P1.y), nx = -(P2.y - P1.y) / n, ny = (P2.x - P1.x) / n;
  const yl = P1.y + ((0 - P1.x) * (P2.y - P1.y)) / (P2.x - P1.x), yr = P1.y + ((W - P1.x) * (P2.y - P1.y)) / (P2.x - P1.x);
  const top = <AbsoluteFill style={cam(lerp(1.05, 1, eOut(prog(t, TL.final[0], TL.final[1] + 0.3))), W / 2, H / 2)}><Final /></AbsoluteFill>;
  const d = sp * 1500;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {sp > 0 && <EndBg />}
      {sp > 0 && <EndText t={t} />}
      <AbsoluteFill style={{clipPath: `polygon(0 0, ${W}px 0, ${W}px ${yr}px, 0 ${yl}px)`, transform: `translate(${-nx * d}px, ${-ny * d}px) rotate(${-4 * sp}deg)`}}>{top}</AbsoluteFill>
      <AbsoluteFill style={{clipPath: `polygon(0 ${yl}px, ${W}px ${yr}px, ${W}px ${H}px, 0 ${H}px)`, transform: `translate(${nx * d}px, ${ny * d}px) rotate(${-4 * sp}deg)`}}>{top}</AbsoluteFill>
      {q > 0 && <div style={{position: 'absolute', left: P1.x, top: P1.y - 4, width: len, height: 8, transformOrigin: '0 50%', transform: `rotate(${ang}deg)`,
        background: `linear-gradient(90deg, transparent, ${S.trail ?? '#fff'} 30%, ${S.trail ?? '#fff'})`, boxShadow: `0 0 20px 4px ${S.trail ?? '#fff'}`, opacity: 1 - sp * 1.6}} />}
      {q > 0 && q < 1 && (
        <svg width="200" height="200" viewBox="-12 -12 24 24" style={{position: 'absolute', left: sx - 100, top: sy - 100, transform: `rotate(${q * 720}deg)`, filter: 'drop-shadow(0 10px 16px rgba(0,0,0,.4))'}}>
          <path d={S.path ?? 'M0 -11 Q1.8 -1.8 11 0 Q1.8 1.8 0 11 Q-1.8 1.8 -11 0 Q-1.8 -1.8 0 -11Z'} fill={S.color ?? '#111'} stroke={S.trail ?? '#fff'} strokeWidth="0.7" />
        </svg>
      )}
    </AbsoluteFill>
  );
};
const ICON: Record<string, string> = {
  instagram: 'M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 4.6a5.2 5.2 0 1 0 0 10.4 5.2 5.2 0 0 0 0-10.4zm0 8.6a3.4 3.4 0 1 1 0-6.8 3.4 3.4 0 0 1 0 6.8zm5.4-9.9a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z',
  tiktok: 'M16.6 2h-3.2v13.3a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.2a6.2 6.2 0 1 0 5.2 6.1V8.6a8 8 0 0 0 4.4 1.4V6.8a4.5 4.5 0 0 1-4.4-4.8z',
  snapchat: 'M12 2.5c2.6 0 4.7 2 4.7 4.8v2.3c.4.2.9.1 1.3-.1.5-.2 1 .1 1 .6 0 .4-.4.7-1 .9-.5.2-1.1.4-1 .9.4 1.5 1.9 3.1 3.4 3.5.3.1.4.4.3.7-.3.6-1.4.8-2.2 1-.2.3-.1.9-.5 1.1-.6.2-1.4-.2-2.4.1-1 .3-1.7 1.5-3.6 1.5s-2.6-1.2-3.6-1.5c-1-.3-1.8.1-2.4-.1-.4-.2-.3-.8-.5-1.1-.8-.2-1.9-.4-2.2-1-.1-.3 0-.6.3-.7 1.5-.4 3-2 3.4-3.5.1-.5-.5-.7-1-.9-.6-.2-1-.5-1-.9 0-.5.5-.8 1-.6.4.2.9.3 1.3.1V7.3c0-2.8 2.1-4.8 4.7-4.8z',
  youtube: 'M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15.1V8.9l5.8 3.1-5.8 3.1z',
  x: 'M17.8 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.8 3h6.4l4.4 5.9L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z',
};
const E = C.ending;
const EndText: React.FC<{t: number}> = ({t}) => {
  const {TL} = useTL();
  const line = (at: number) => { const a = spring(t, at, 2, 0.75); return {opacity: clamp(a * 1.3), transform: `translateY(${(1 - clamp(a, 0, 1.1)) * 46}px)`}; };
  const accent = (s: string) => (E.accentWord && s.includes(E.accentWord)
    ? <>{s.split(E.accentWord)[0]}<span style={{color: E.accent}}>{E.accentWord}</span>{s.split(E.accentWord)[1]}</> : s);
  return (
    <>
      <div style={{position: 'absolute', left: 60, right: 60, top: H * 0.333, textAlign: 'center', direction: RTL ? 'rtl' : 'ltr', color: '#fff'}}>
        {(E.lines as string[]).map((s, i) => <div key={i} style={{font: `700 ${(E.sizes ?? [])[i] ?? E.size ?? 150}px/1.18 ${E.font}`, textShadow: '0 6px 30px rgba(0,0,0,.35)', ...line(TL.endLines[i])}}>{accent(s)}</div>)}
        {E.sub && <div style={{font: `400 ${E.subSize ?? 52}px/1.4 ${E.subFont ?? E.font}`, color: '#EEF3F4', marginTop: 34, ...line(TL.endLines[TL.endLines.length - 1] + 0.16)}}>{E.sub}</div>}
      </div>
      {E.handle && (
        <div style={{position: 'absolute', left: 0, right: 0, top: H * 0.672, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, direction: 'ltr', ...line(TL.accounts)}}>
          {(E.platforms ?? []).map((k: string) => <svg key={k} width="54" height="54" viewBox="0 0 24 24"><path d={ICON[k]} fill="#F2EDE4" /></svg>)}
          <span style={{font: `700 50px ${E.subFont ?? E.font}`, color: E.accent, marginLeft: 8}}>{E.handle}</span>
        </div>
      )}
    </>
  );
};

// ─── the film ────────────────────────────────────────────────────────────────
const O = C.opening;
const Film: React.FC = () => {
  const {TL, RS} = useTL();
  const t = useCurrentFrame() / FPS;
  const T = RS[0];
  if (t < T.cut) {
    // their home screen, lightly blurred; the question appears, then shrinks into their bar in place of its hint
    const push = eIO(prog(t, TL.pull[0], TL.pull[1]));
    const s = lerp(lerp(1, 1.03, prog(t, 0, TL.pull[0])), ZOOM, push);
    let camStyle = cam(s, AX, BCY, AX, BCY * s), diveBlur = 0;
    if (t >= T.enter) { const d = eIn(prog(t, T.enter, T.cut)); camStyle = diveCam(d); diveBlur = lerp(0, 18, d); }
    const n = t >= T.type - 0.02 ? clamp(Math.floor((t - T.type) / T.step) + 1, 0, [...T.q].length) : -1;
    const qp = push, qSize = lerp(O.size ?? 120, B.fontSize * ZOOM, qp);
    const edge = (RTL ? W - HB.textEdge : HB.textEdge) * ZOOM;             // where the bar text sits, from the anchored edge
    const qCol = `rgba(${lerp(11, 120, qp)},${lerp(20, 120, qp)},${lerp(22, 120, qp)},1)`;
    const words = (O.question as string).split(' ');
    return (
      <AbsoluteFill style={{background: '#fff', overflow: 'hidden'}}>
        <AbsoluteFill style={{...camStyle, filter: `blur(${lerp(O.blur ?? 6, 0, prog(t, TL.pull[0], TL.pull[0] + 0.5)) + diveBlur}px)`}}>
          <Home hint={prog(t, TL.pull[0] + 0.25, TL.pull[0] + 0.5)}>{n >= 0 && <Typed bar={HB} text={[...T.q].slice(0, n).join('')} caret={t < T.enter ? caretBlink(t - T.type) : 0} />}</Home>
        </AbsoluteFill>
        <AbsoluteFill style={{opacity: 1 - prog(t, TL.pull[0], TL.pull[0] + 0.4),
          background: 'radial-gradient(ellipse 70% 30% at 50% 50%, rgba(255,255,255,.82) 0, rgba(255,255,255,.35) 55%, rgba(255,255,255,0) 100%)'}} />
        {O.sub && TL.subAt != null && (
          <div style={{position: 'absolute', left: 70, right: 70, top: H / 2 + 120, textAlign: 'center', font: `600 ${O.subSize ?? 40}px/1.3 ${O.font}`, color: '#0b1416',
            opacity: clamp(spring(t, TL.subAt, 2.2, 0.75) * 1.3) * (1 - prog(t, TL.pull[0], TL.pull[0] + 0.35)), transform: `translateY(${(1 - clamp(spring(t, TL.subAt, 2.2, 0.75), 0, 1.1)) * 36}px)`,
            textShadow: '0 0 24px rgba(255,255,255,.95), 0 0 10px rgba(255,255,255,.9)'}}>{O.sub}</div>
        )}
        {t < T.type && (
          <div style={{position: 'absolute', top: lerp(H / 2, HB.textCenterY ?? BCY, qp), [RTL ? 'right' : 'left']: `calc(${(1 - qp) * 50}% + ${qp * edge}px)`,
            transform: `translate(${(RTL ? 1 : -1) * (1 - qp) * 50}%, -50%)`, display: 'flex', gap: qSize * 0.22, direction: RTL ? 'rtl' : 'ltr',
            font: `700 ${qSize}px ${O.font}`, color: qCol, whiteSpace: 'nowrap', opacity: 1 - prog(t, T.type - 0.14, T.type - 0.04), lineHeight: 1.25,
            textShadow: [28, 28, 14, 6].map((r) => `0 0 ${r * lerp(1, 0.4, qp)}px rgba(255,255,255,${1 - prog(qp, 0.78, 1)})`).join(', ')}}>
            {words.map((w, i) => {
              const a = spring(t, TL.words[Math.min(i, TL.words.length - 1)] + Math.max(0, i - TL.words.length + 1) * 0.18, 2.2, 0.7);
              return <span key={i} style={{opacity: clamp(a * 1.4), transform: `translateY(${(1 - clamp(a, 0, 1.2)) * 50}px)`, display: 'inline-block'}}>{w}</span>;
            })}
          </div>
        )}
      </AbsoluteFill>
    );
  }
  for (let i = 0; i < RS.length; i++) {
    const r = RS[i];
    if (t >= r.end) continue;
    if (i > 0 && t < r.cut) return <SearchBeat t={t} r={r} prev={RS[i - 1]} n0={i} />;
    if (t < r.up) return <ResultsBeat t={t} r={r} i={i} />;
    return r.box === 'bag' ? <BagBeat t={t} r={r} i={i} /> : <BasketBeat t={t} r={r} i={i} />;
  }
  if (TL.pour && t < TL.lift[0]) return <PourBeat t={t} />;
  if (t < TL.whip[1]) return <LiftBeat t={t} />;
  if (t < TL.slash[0]) return <AbsoluteFill style={cam(lerp(1.05, 1, eOut(prog(t, TL.final[0], TL.final[1] + 0.3))), W / 2, H / 2)}><Final /></AbsoluteFill>;
  if (t < TL.split[1]) return <Slash t={t} />;
  return <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}><EndBg /><EndText t={t} /></AbsoluteFill>;
};

// fast moments get real motion blur in the render (several samples inside one frame)
const fastOf = (TL: any): [number, number][] => [
  ...(TL.rounds as Round[]).flatMap((r) => [[r.enter, r.cut + 0.12], [r.pop, r.pop + 0.3], [r.fall, r.in]] as [number, number][]),
  ...(TL.pour ? [[TL.pour.move[0], TL.pour.exit[1]] as [number, number]] : []), [TL.lift[0], TL.whip[1]], [TL.slash[0], TL.split[1]],
];
// the creator's accounts, small, for the whole film, so a re-upload still carries them; they give way to the big ones
const Mark: React.FC<{t: number}> = ({t}) => {
  const {TL} = useTL();
  if (!E.handle || E.mark === false) return null;
  const o = 1 - prog(t, TL.accounts - 0.15, TL.accounts + 0.25);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: H * (E.markBottom ?? 0.054), display: 'flex', justifyContent: 'center', opacity: o * 0.9}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 10, direction: 'ltr', padding: '8px 18px', borderRadius: 30, background: 'rgba(10,14,16,.38)'}}>
        {(E.platforms ?? []).map((k: string) => <svg key={k} width="24" height="24" viewBox="0 0 24 24"><path d={ICON[k]} fill="#fff" /></svg>)}
        <span style={{font: `700 26px ${E.subFont ?? E.font}`, color: '#fff', marginLeft: 4}}>{E.handle}</span>
      </div>
    </div>
  );
};

export const Ad: React.FC<{tl?: any; mix?: string}> = ({tl = TL_FULL, mix = 'mix.wav'}) => {
  const t = useCurrentFrame() / FPS;
  const env = getRemotionEnvironment();
  const fast = fastOf(tl).some(([a, b]) => t >= a - 0.02 && t < b + 0.02);
  return (
    <TLCtx.Provider value={tl}>
      <AbsoluteFill style={{background: '#fff'}}>
        {env.isRendering && fast ? <CameraMotionBlur shutterAngle={200} samples={5}><Film /></CameraMotionBlur> : <Film />}
        <Mark t={t} />
        {!env.isRendering && tl.hasMix && <Audio src={staticFile(mix)} />}
      </AbsoluteFill>
    </TLCtx.Provider>
  );
};
