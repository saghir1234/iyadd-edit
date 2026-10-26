// Scout talking-head reel. The raw talk (old burned-in captions removed) plays full frame; motion graphics in the
// reference style ride on top: dark glass cards, glowing gold, notification stacks, red flash / glitch hits,
// and word-by-word subtitles with gold / red keywords. Every time below comes from src/words.json (speech timings).
import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import WORDS from './words.json';

export const FPS = 30;
export const DURATION = 974;
export const W = 1080, H = 1920;
export const GOLD = '#FFC93C', GOLD2 = '#FF9F1C', RED = '#FF2D3A', INK = '#0B0D12';
export const FONT = 'Cairo, sans-serif';

// ─── fonts ───────────────────────────────────────────────────────────────────
let fontsStarted = false;
const loadFonts = () => {
  if (fontsStarted) return;
  fontsStarted = true;
  const h = delayRender('fonts');
  const files = [700, 800, 900].flatMap((w) => [
    new FontFace('Cairo', `url(${staticFile(`fonts/ar${w}.woff2`)})`, {weight: String(w), unicodeRange: 'U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF, U+200C-200E'}),
    new FontFace('Cairo', `url(${staticFile(`fonts/la${w}.woff2`)})`, {weight: String(w), unicodeRange: 'U+0000-00FF, U+2000-206F'}),
  ]);
  Promise.all(files.map((f) => f.load().then((l) => document.fonts.add(l)))).then(() => continueRender(h)).catch(() => continueRender(h));
};
loadFonts();

// ─── time helpers ────────────────────────────────────────────────────────────
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const eOut = (p: number) => 1 - Math.pow(1 - p, 3);
export const eIn = (p: number) => p * p * p;
export const eIO = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const back = (p: number) => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
// closed-form damped spring 0 → 1
export const spring = (t: number, t0: number, f = 2.2, z = 0.5) => {
  const d = t - t0;
  if (d <= 0) return 0;
  const w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * d) * (Math.cos(wd * d) + ((z * w) / wd) * Math.sin(wd * d));
};
// in at a, out at b: 0 → 1 → 0
export const life = (t: number, a: number, b: number, fi = 0.25, fo = 0.25) => Math.min(eOut(prog(t, a, a + fi)), 1 - eIn(prog(t, b - fo, b)));
export const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ─── words: the transcript, spelled as written ───────────────────────────────
type Wd = {w: string; s: number; e: number};
const WD = WORDS as Wd[];
const FIX: Record<number, string> = {0: 'دايماً', 16: 'ذهبية', 19: 'كشفي', 23: 'الذهبية', 29: 'هيدي', 30: '', 34: 'هيدي', 35: '', 54: 'بإتقان', 66: 'بتهزّها'};
const txt = (i: number) => FIX[i] ?? WD[i].w;
const at = (i: number) => WD[i].s;
const GOLDW = new Set([7, 8, 13, 15, 16, 18, 19, 23, 36, 37, 48, 54, 61, 62, 63, 64]);
const REDW = new Set([11, 32, 33, 51, 69, 70]);
const CHUNKS = [[0, 1], [2, 3, 4], [5, 6], [7, 8], [9, 10, 11], [12, 13], [14, 15, 16], [17, 18, 19], [20, 21], [22, 23],
  [29, 30, 31], [32, 33], [34, 35, 36, 37], [38, 39, 40], [41, 42], [43, 44], [45, 46], [47, 48], [49, 50, 51], [52, 53], [54],
  [55, 56, 57], [58, 59], [60, 61, 62], [63, 64], [65, 66], [67, 68], [69, 70]];

// ─── scene windows ───────────────────────────────────────────────────────────
const SC = {
  ask: [0.12, 2.5], question: [2.5, 6.25], tag: [6.7, 7.7], rule: [7.7, 12.28], scout: [12.3, 15.62],
  ideal: [15.95, 19.0], build: [20.0, 23.8], craft: [24.6, 27.1], peace: [27.12, 29.6], social: [29.62, 32.47],
};
const inS = (t: number, k: keyof typeof SC) => t >= SC[k][0] && t < SC[k][1];

// ─── speaker: grade, punch-ins, focus blur behind centre cards ───────────────
const PUNCH: [number, number][] = [[0, 1], [1.16, 1.06], [2.5, 1.0], [6.28, 1.1], [7.7, 1.0], [15.62, 1.12], [17.8, 1.18], [19.0, 1.0],
  [23.76, 1.08], [24.72, 1.15], [27.12, 1.0], [29.6, 1.1], [31.64, 1.18]];
const zoomAt = (t: number) => {
  let z = 1;
  for (let i = 0; i < PUNCH.length; i++) {
    const [a, s] = PUNCH[i];
    if (t >= a) { const prev = i ? PUNCH[i - 1][1] : 1; z = lerp(prev, s, eOut(prog(t, a, a + 0.22))); }
  }
  return z;
};
const focusAt = (t: number) => Math.max(life(t, SC.question[0] + 0.1, SC.question[1], 0.3, 0.3), life(t, SC.peace[0], SC.peace[1], 0.3, 0.3));
const Speaker: React.FC<{t: number}> = ({t}) => {
  const z = zoomAt(t) * (1 + 0.012 * Math.sin(t * 0.7)), f = focusAt(t);
  // whip shake on scene changes
  const kick = [2.5, 6.25, 15.62, 27.12, 29.62].reduce((a, k) => a + Math.exp(-Math.max(0, t - k) * 18) * (t >= k ? 1 : 0), 0);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: INK}}>
      <AbsoluteFill style={{transform: `translateY(${kick * 18}px) scale(${z})`, transformOrigin: '540px 760px',
        filter: `contrast(1.1) saturate(0.88) brightness(${0.9 - 0.45 * f}) blur(${f * 9}px)`}}>
        <OffthreadVideo src={staticFile('talk.mp4')} style={{width: W, height: H}} />
      </AbsoluteFill>
      {/* moody grade: cool shadows, warm vignette, darker top for the cards */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 40%, rgba(5,6,10,0.72) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,16,0.55) 0%, rgba(8,10,16,0) 32%, rgba(8,10,16,0) 62%, rgba(8,10,16,0.6) 100%)'}} />
      <AbsoluteFill style={{background: 'rgba(255,170,60,0.05)', mixBlendMode: 'overlay'}} />
    </AbsoluteFill>
  );
};

// ─── shared pieces ───────────────────────────────────────────────────────────
export const Glass: React.FC<{x: number; y: number; w: number; h: number; r?: number; style?: React.CSSProperties; children?: React.ReactNode; glow?: string}> =
  ({x, y, w, h, r = 36, style, children, glow}) => (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: r,
      background: 'linear-gradient(160deg, rgba(40,44,56,0.92), rgba(14,16,22,0.94))', border: '2px solid rgba(255,255,255,0.14)',
      boxShadow: `0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18)${glow ? `, 0 0 60px ${glow}` : ''}`, overflow: 'hidden', ...style}}>
      {children}
    </div>
  );
export const T: React.FC<{children: React.ReactNode; size: number; color?: string; weight?: number; style?: React.CSSProperties}> = ({children, size, color = '#fff', weight = 800, style}) => (
  <div style={{fontFamily: FONT, fontSize: size, fontWeight: weight, color, direction: 'rtl', lineHeight: 1.25, whiteSpace: 'nowrap', ...style}}>{children}</div>
);
export const glowText = (c: string) => `0 0 18px ${c}, 0 0 42px ${c}, 0 4px 0 rgba(0,0,0,0.35)`;
// pop in with overshoot + blur
export const popStyle = (t: number, t0: number, dur = 0.35): React.CSSProperties => {
  const p = prog(t, t0, t0 + dur);
  return {opacity: clamp(p * 3), transform: `scale(${lerp(0.6, 1, back(p))})`, filter: `blur(${(1 - eOut(p)) * 10}px)`};
};

// ─── subtitles: word-by-word, keywords gold / red ────────────────────────────
const Subs: React.FC<{t: number}> = ({t}) => {
  if (inS(t, 'scout')) return null;
  const idx = CHUNKS.findIndex((c, i) => t >= at(c[0]) - 0.05 && (i === CHUNKS.length - 1 || t < at(CHUNKS[i + 1][0]) - 0.05));
  if (idx < 0) return null;
  const c = CHUNKS[idx];
  const t0 = at(c[0]) - 0.05;
  const ent = eOut(prog(t, t0, t0 + 0.18));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 1300, display: 'flex', justifyContent: 'center', alignItems: 'baseline', direction: 'rtl', gap: 18,
      transform: `translateY(${(1 - ent) * 24}px)`}}>
      {c.map((i) => {
        const s = txt(i);
        if (!s) return null;
        const p = prog(t, at(i) - 0.04, at(i) + 0.14), key = GOLDW.has(i) || REDW.has(i);
        const col = GOLDW.has(i) ? GOLD : REDW.has(i) ? '#fff' : '#fff';
        const spoken = t >= at(i) - 0.04;
        return (
          <span key={i} style={{fontFamily: FONT, fontWeight: key ? 900 : 800, fontSize: key ? 84 : 66, color: col, position: 'relative',
            opacity: spoken ? 1 : 0.0, transform: `translateY(${(1 - eOut(p)) * 18}px) scale(${lerp(key ? 1.35 : 1.15, 1, eOut(p))})`, display: 'inline-block',
            textShadow: GOLDW.has(i) ? `0 0 26px rgba(255,180,40,0.75), 0 5px 14px rgba(0,0,0,0.85)` : '0 5px 16px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.9)',
            padding: REDW.has(i) ? '0 14px' : 0}}>
            {REDW.has(i) && <span style={{position: 'absolute', inset: '14% 0 10% 0', background: RED, borderRadius: 10, zIndex: -1,
              transform: `scaleX(${eOut(prog(t, at(i), at(i) + 0.2))})`, transformOrigin: 'right', boxShadow: `0 0 30px ${RED}`}} />}
            {s}
          </span>
        );
      })}
    </div>
  );
};

// ─── 1. "they always ask us": notification stack + floating question marks ──
const BellIcon: React.FC<{c?: string}> = ({c = '#fff'}) => (
  <svg width="46" height="46" viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 3 13.5z" fill={c} /></svg>
);
const Notif: React.FC<{t: number; t0: number; y: number; title: string; body: string; grad: string}> = ({t, t0, y, title, body, grad}) => {
  const p = spring(t, t0, 2.4, 0.55);
  return (
    <Glass x={W / 2} y={lerp(y - 160, y, p)} w={880} h={150} r={34} style={{opacity: clamp(prog(t, t0, t0 + 0.12)), transform: `scale(${lerp(0.9, 1, p)})`}}>
      <div style={{position: 'absolute', right: 26, top: 27, width: 96, height: 96, borderRadius: 26, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><BellIcon /></div>
      <div style={{position: 'absolute', right: 146, top: 18}}>
        <T size={34} color="rgba(255,255,255,0.65)" weight={700}>{title}</T>
        <T size={42}>{body}</T>
      </div>
      <T size={28} color="rgba(255,255,255,0.45)" weight={700} style={{position: 'absolute', left: 30, top: 26, direction: 'ltr'}}>now</T>
    </Glass>
  );
};
const QMark: React.FC<{t: number; t0: number; x: number; y: number; s: number; r: number}> = ({t, t0, x, y, s, r}) => {
  const p = spring(t, t0, 1.8, 0.45);
  return (
    <div style={{position: 'absolute', left: x, top: y + Math.sin((t - t0) * 2.4 + x) * 12, transform: `translate(-50%,-50%) scale(${p}) rotate(${r + Math.sin(t * 1.7 + y) * 6}deg)`,
      fontFamily: FONT, fontWeight: 900, fontSize: s, color: '#fff', textShadow: '0 18px 40px rgba(0,0,0,0.6), 0 0 30px rgba(255,255,255,0.35)', opacity: clamp(p * 2)}}>؟</div>
  );
};
const Ask: React.FC<{t: number}> = ({t}) => {
  const [a, b] = SC.ask, o = 1 - eIn(prog(t, b - 0.25, b));
  const N = [
    {t0: a + 0.15, title: 'رسالة جديدة', body: 'كيف بحافظ على تفكيري؟', grad: 'linear-gradient(135deg,#FFC93C,#FF7A1C)'},
    {t0: a + 0.45, title: 'رسالة جديدة', body: 'شو الحل مع التشويش؟', grad: 'linear-gradient(135deg,#FF4D6D,#C2185B)'},
    {t0: a + 0.75, title: 'رسالة جديدة', body: 'كيف بضل نضيف من جوّا؟', grad: 'linear-gradient(135deg,#7C4DFF,#3D5AFE)'},
  ];
  return (
    <AbsoluteFill style={{opacity: o, transform: `translateY(${-eIn(prog(t, b - 0.25, b)) * 120}px)`}}>
      {N.map((n, i) => {
        // newer notifications push older ones down
        const below = N.filter((m) => m.t0 > n.t0).reduce((s, m) => s + spring(t, m.t0, 2.4, 0.6) * 172, 0);
        return <Notif key={i} t={t} t0={n.t0} y={230 + below} title={n.title} body={n.body} grad={n.grad} />;
      })}
      <QMark t={t} t0={a + 1.1} x={170} y={760} s={190} r={-14} />
      <QMark t={t} t0={a + 1.25} x={930} y={700} s={240} r={12} />
      <QMark t={t} t0={a + 1.4} x={860} y={1040} s={120} r={-8} />
    </AbsoluteFill>
  );
};

// ─── 2. the question card (purple → pink tile, bouncing ?) + glitch on "تشويش" ─
const Question: React.FC<{t: number}> = ({t}) => {
  const [a, b] = SC.question;
  const p = spring(t, a + 0.05, 2.0, 0.55), out = eIn(prog(t, b - 0.3, b));
  const bob = Math.sin((t - a) * 4) * 10;
  const hi = t >= at(7) - 0.05;
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `translateY(${out * -80}px)`}}>
      <Glass x={W / 2} y={720} w={860} h={900} r={48} glow="rgba(180,90,255,0.25)" style={{transform: `scale(${lerp(0.7, 1, p)}) translateY(${(1 - p) * 140}px)`, opacity: clamp(p * 2)}}>
        <div style={{position: 'absolute', left: 60, right: 60, top: 60, height: 430, borderRadius: 34, background: 'linear-gradient(135deg,#8E2DE2,#FF4E9B 60%,#FFB86B)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 60px rgba(255,78,155,0.4)'}}>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 330, color: GOLD, transform: `translateY(${bob}px) rotate(${Math.sin(t * 3) * 5}deg)`,
            textShadow: '0 16px 0 #B8860B, 0 30px 50px rgba(0,0,0,0.45)'}}>؟</div>
        </div>
        <T size={64} weight={900} color={GOLD} style={{position: 'absolute', right: 64, top: 520, fontStyle: 'italic', textShadow: glowText('rgba(255,190,40,0.4)')}}>سؤال:</T>
        <div style={{position: 'absolute', right: 64, left: 64, top: 610, direction: 'rtl'}}>
          <T size={54} style={{whiteSpace: 'normal'}}>كيف بيقدر الشاب يحافظ على <span style={{color: hi ? GOLD : '#fff', textShadow: hi ? glowText('rgba(255,190,40,0.5)') : 'none'}}>نقاء تفكيره</span>؟</T>
        </div>
      </Glass>
    </AbsoluteFill>
  );
};
export const Glitch: React.FC<{t: number; t0: number; dur: number; children: React.ReactNode}> = ({t, t0, dur, children}) => {
  const g = t >= t0 && t < t0 + dur ? 1 - prog(t, t0, t0 + dur) * 0.6 : 0;
  if (!g) return <>{children}</>;
  const f = Math.floor(t * 30), dx = (rnd(f) - 0.5) * 60 * g;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `translateX(${dx}px)`}}>{children}</AbsoluteFill>
      <AbsoluteFill style={{transform: `translateX(${-dx * 0.6 + 14 * g}px)`, mixBlendMode: 'screen', opacity: 0.55 * g, filter: 'sepia(1) hue-rotate(-50deg) saturate(6)'}}>{children}</AbsoluteFill>
      {Array.from({length: 7}).map((_, i) => (
        <div key={i} style={{position: 'absolute', left: 0, right: 0, top: rnd(f * 7 + i) * H, height: 6 + rnd(f + i * 3) * 40,
          background: i % 2 ? 'rgba(255,45,58,0.5)' : 'rgba(255,255,255,0.25)', transform: `translateX(${(rnd(f + i) - 0.5) * 200}px)`, mixBlendMode: 'screen'}} />
      ))}
      <AbsoluteFill style={{background: RED, opacity: 0.22 * g, mixBlendMode: 'multiply'}} />
    </AbsoluteFill>
  );
};

// ─── 3. scouts tag + the golden rule medallion ───────────────────────────────
export const Lily: React.FC<{size: number; color: string}> = ({size, color}) => (
  // scout fleur-de-lis, drawn by hand
  <svg width={size} height={size} viewBox="0 0 100 100">
    <g fill={color}>
      <path d="M50 6 C42 20 38 32 42 46 L46 60 L54 60 L58 46 C62 32 58 20 50 6Z" />
      <path d="M44 58 C34 40 18 34 10 44 C4 52 10 64 22 62 C16 56 20 48 28 50 C36 52 40 58 42 62Z" />
      <path d="M56 58 C66 40 82 34 90 44 C96 52 90 64 78 62 C84 56 80 48 72 50 C64 52 60 58 58 62Z" />
      <rect x="30" y="60" width="40" height="8" rx="4" />
      <path d="M44 68 L40 90 C46 86 48 82 50 76 C52 82 54 86 60 90 L56 68Z" />
    </g>
  </svg>
);
const Tag: React.FC<{t: number}> = ({t}) => {
  const [a, b] = SC.tag, o = life(t, a, b, 0.2, 0.25);
  return (
    <div style={{position: 'absolute', left: W / 2, top: 330, transform: `translate(-50%,-50%) scale(${lerp(0.7, 1, back(prog(t, a, a + 0.35)))})`, opacity: o,
      display: 'flex', alignItems: 'center', gap: 22, padding: '18px 44px 18px 34px', borderRadius: 100, background: 'rgba(14,16,22,0.88)',
      border: `2px solid ${GOLD}`, boxShadow: `0 0 40px rgba(255,190,40,0.35)`, direction: 'rtl'}}>
      <Lily size={74} color={GOLD} />
      <T size={64} weight={900}>الكشّافة</T>
    </div>
  );
};
const Rule: React.FC<{t: number}> = ({t}) => {
  const [a, b] = SC.rule;
  const p = spring(t, a + 0.04, 1.8, 0.5), out = eIn(prog(t, b - 0.28, b));
  // the coin spins (edge-on) on "قانون كشفي", like the reference coin flip
  const flip = eIO(prog(t, at(18) - 0.1, at(18) + 0.5));
  const sx = Math.cos(flip * Math.PI * 2);
  const sweep = prog(t, at(22) - 0.1, at(23) + 0.4);
  const label2 = t >= at(18) - 0.05;
  const cy = 320;
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `scale(${1 + out * 0.3})`}}>
      {/* light rays */}
      <div style={{position: 'absolute', left: W / 2 - 700, top: cy - 700, width: 1400, height: 1400, opacity: 0.5 * p,
        background: 'repeating-conic-gradient(from 0deg, rgba(255,200,60,0.18) 0deg 6deg, rgba(255,200,60,0) 6deg 18deg)', transform: `rotate(${t * 12}deg)`,
        WebkitMaskImage: 'radial-gradient(circle, black 10%, transparent 60%)', maskImage: 'radial-gradient(circle, black 10%, transparent 60%)'}} />
      <div style={{position: 'absolute', left: W / 2, top: cy, transform: `translate(-50%,-50%) translateY(${(1 - p) * -500}px) scale(${lerp(0.4, 1, p)}) scaleX(${Math.abs(sx) < 0.05 ? 0.05 : sx})`}}>
        <div style={{width: 330, height: 330, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, #FFF3B0, ${GOLD} 40%, ${GOLD2} 75%, #B86A00)`,
          boxShadow: `0 0 80px rgba(255,190,40,0.85), 0 0 180px rgba(255,160,30,0.5), inset 0 -16px 30px rgba(140,70,0,0.5), inset 0 10px 20px rgba(255,255,255,0.5)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'}}>
          <div style={{position: 'absolute', inset: 22, borderRadius: '50%', border: '6px solid rgba(150,80,0,0.45)'}} />
          <Lily size={200} color="rgba(130,70,0,0.85)" />
          <div style={{position: 'absolute', top: 0, bottom: 0, width: 120, left: lerp(-200, 520, sweep), transform: 'skewX(-20deg)',
            background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.85), rgba(255,255,255,0))'}} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: cy + 190, display: 'flex', justifyContent: 'center'}}>
        <div style={popStyle(t, at(15) - 0.05)}>
          <T size={96} weight={900} color={GOLD} style={{textShadow: glowText('rgba(255,180,40,0.55)')}}>{label2 ? 'قانون كشفي' : 'قاعدة ذهبية'}</T>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── 4. the scout photo, animated (push-in, waving flag, warm leak) + the law ─
const FLAG = {x0: 0.6, x1: 1.0, y0: 0.04, y1: 0.52}; // flag region in the photo, as fractions
const ScoutPhoto: React.FC<{t: number}> = ({t}) => {
  const [a, b] = SC.scout, d = t - a;
  const inP = eOut(prog(t, a, a + 0.35)), out = eIn(prog(t, b - 0.3, b));
  const s = 1.06 + d * 0.035, iw = 752, ih = 1344, k = W / iw; // fit width
  const ph = ih * k;
  const flash = Math.max(0, 1 - prog(t, a, a + 0.35));
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `translateX(${out * -W * 0.4}px)`}}>
      <AbsoluteFill style={{overflow: 'hidden', background: INK, clipPath: `inset(${(1 - inP) * 50}% 0 ${(1 - inP) * 50}% 0)`}}>
        <AbsoluteFill style={{transform: `scale(${s}) translate(${-d * 6}px, ${d * 4}px)`, transformOrigin: '60% 40%'}}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', top: 0, left: 0}}>
            <defs>
              <filter id="wave" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves={2} seed={4} result="n" />
                <feOffset in="n" dx={d * -160} dy={0} result="m" />
                <feDisplacementMap in="SourceGraphic" in2="m" scale={26} xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <filter id="soft"><feGaussianBlur stdDeviation="40" /></filter>
              <mask id="flagMask">
                <rect x={FLAG.x0 * W} y={FLAG.y0 * ph} width={(FLAG.x1 - FLAG.x0) * W} height={(FLAG.y1 - FLAG.y0) * ph} fill="white" filter="url(#soft)" />
              </mask>
            </defs>
            <image href={staticFile('scout.png')} x={0} y={(H - ph) / 2} width={W} height={ph} preserveAspectRatio="none" />
            <g mask="url(#flagMask)">
              <image href={staticFile('scout.png')} x={0} y={(H - ph) / 2} width={W} height={ph} preserveAspectRatio="none" filter="url(#wave)" />
            </g>
          </svg>
        </AbsoluteFill>
        {/* warm light leak drifting across */}
        <AbsoluteFill style={{background: `radial-gradient(circle at ${20 + d * 18}% ${25 + Math.sin(d) * 6}%, rgba(255,170,60,0.45), rgba(255,120,30,0) 45%)`, mixBlendMode: 'screen'}} />
        {/* dust in the light */}
        {Array.from({length: 26}).map((_, i) => (
          <div key={i} style={{position: 'absolute', left: rnd(i) * W + Math.sin(d * 0.8 + i) * 30, top: ((rnd(i + 40) * H - d * (30 + rnd(i + 9) * 50)) % H + H) % H,
            width: 4 + rnd(i + 3) * 6, height: 4 + rnd(i + 3) * 6, borderRadius: '50%', background: 'rgba(255,230,180,0.7)', filter: 'blur(1px)', opacity: 0.4 + 0.4 * Math.sin(d * 2 + i)}} />
        ))}
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,6,10,0.75) 0%, rgba(5,6,10,0) 28%, rgba(5,6,10,0) 55%, rgba(5,6,10,0.85) 100%)'}} />
        <AbsoluteFill style={{background: '#fff', opacity: flash * 0.85}} />
      </AbsoluteFill>
      {/* "الكشّاف طاهر" */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 190, display: 'flex', justifyContent: 'center', gap: 26, direction: 'rtl'}}>
        <div style={popStyle(t, at(24))}><T size={118} weight={900}>الكشّاف</T></div>
        <div style={popStyle(t, at(25))}><T size={118} weight={900} color={GOLD} style={{textShadow: glowText('rgba(255,180,40,0.5)')}}>طاهر</T></div>
      </div>
      {/* thought · word · deed */}
      {[{i: 26, s: 'الفكر'}, {i: 27, s: 'القول'}, {i: 28, s: 'العمل'}].map((r, j) => {
        const p = spring(t, at(r.i) - 0.05, 2.4, 0.55);
        const ck = eOut(prog(t, at(r.i) + 0.12, at(r.i) + 0.4));
        return (
          <Glass key={j} x={W / 2 + (1 - p) * 300} y={1260 + j * 165} w={620} h={140} r={70} glow="rgba(255,190,40,0.18)" style={{opacity: clamp(p * 2), direction: 'rtl'}}>
            <div style={{position: 'absolute', right: 26, top: 22, width: 96, height: 96, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(255,190,40,0.7)'}}>
              <svg width="60" height="60" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke={INK} strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="24" strokeDashoffset={24 * (1 - ck)} /></svg>
            </div>
            <T size={70} weight={900} style={{position: 'absolute', right: 150, top: 18}}>{r.s}</T>
          </Glass>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── 5. not a fantasy ideal → spiritual cleanliness ──────────────────────────
export const Sparkle: React.FC<{x: number; y: number; s: number; t: number; t0: number}> = ({x, y, s, t, t0}) => {
  const p = prog(t, t0, t0 + 0.6), k = Math.sin(p * Math.PI);
  return (
    <svg width={s} height={s} viewBox="-10 -10 20 20" style={{position: 'absolute', left: x - s / 2, top: y - s / 2, transform: `scale(${k}) rotate(${p * 90}deg)`, opacity: k}}>
      <path d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2Z" fill="#fff" style={{filter: 'drop-shadow(0 0 4px #FFD76A)'}} />
    </svg>
  );
};
const Ideal: React.FC<{t: number}> = ({t}) => {
  const [a, b] = SC.ideal, o = life(t, a, b, 0.2, 0.3);
  const strike = eIO(prog(t, at(33) + 0.15, at(33) + 0.45));
  const sw = t >= at(36) - 0.08;
  const p2 = spring(t, at(36) - 0.08, 2.2, 0.5);
  return (
    <AbsoluteFill style={{opacity: o}}>
      {!sw ? (
        <Glass x={W / 2} y={380} w={820} h={230} r={40} style={{...popStyle(t, at(32) - 0.1)}}>
          <T size={92} weight={900} style={{position: 'absolute', left: 0, right: 0, top: 50, textAlign: 'center'}}>مثالية خيالية</T>
          <div style={{position: 'absolute', left: 70, right: 70, top: 112, height: 14, borderRadius: 7, background: RED, transform: `scaleX(${strike})`, transformOrigin: 'right',
            boxShadow: `0 0 24px ${RED}`}} />
        </Glass>
      ) : (
        <div style={{position: 'absolute', left: 0, right: 0, top: 260, display: 'flex', justifyContent: 'center', transform: `scale(${lerp(0.5, 1, p2)})`, opacity: clamp(p2 * 2)}}>
          <T size={128} weight={900} color={GOLD} style={{textShadow: glowText('rgba(255,180,40,0.65)')}}>نظافة روحية</T>
          <Sparkle x={150} y={60} s={90} t={t} t0={at(37) - 0.1} />
          <Sparkle x={930} y={230} s={70} t={t} t0={at(37) + 0.1} />
          <Sparkle x={820} y={20} s={50} t={t} t0={at(37) + 0.3} />
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── 6. words that don't hurt, thinking that builds (growth chart) ───────────
const Build: React.FC<{t: number}> = ({t}) => {
  const [a, b] = SC.build, o = life(t, a, b, 0.25, 0.3);
  const p = spring(t, a, 2.0, 0.6);
  const g = eIO(prog(t, at(48) - 0.4, at(48) + 0.9));
  const pts = Array.from({length: 40}, (_, i) => {
    const x = i / 39, y = Math.pow(x, 1.8) * 0.85 + 0.04 * Math.sin(x * 14);
    return [40 + x * 640, 300 - y * 250];
  });
  const shown = pts.slice(0, Math.max(2, Math.round(g * pts.length)));
  const d = shown.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ');
  const tip = shown[shown.length - 1];
  const red = eOut(prog(t, at(51) - 0.1, at(51) + 0.2));
  return (
    <AbsoluteFill style={{opacity: o}}>
      <Glass x={W / 2} y={350} w={720} h={460} r={44} style={{transform: `translateY(${(1 - p) * -200}px) scale(${lerp(0.8, 1, p)})`}}>
        <div style={{position: 'absolute', right: 40, top: 30, padding: '6px 26px', borderRadius: 18, background: 'rgba(255,255,255,0.08)'}}>
          <T size={54} weight={900} color={GOLD}>{Math.round(g * 100)}%</T>
        </div>
        <svg width={720} height={340} style={{position: 'absolute', left: 0, top: 60, transform: 'scale(0.9)', transformOrigin: '50% 0'}}>
          <defs>
            <linearGradient id="gl" x1="0" x2="1"><stop offset="0" stopColor="#FFB000" stopOpacity="0.3" /><stop offset="1" stopColor={GOLD} /></linearGradient>
            <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={GOLD} stopOpacity="0.35" /><stop offset="1" stopColor={GOLD} stopOpacity="0" /></linearGradient>
          </defs>
          {[0, 1, 2, 3].map((i) => <line key={i} x1={40} x2={680} y1={60 + i * 80} y2={60 + i * 80} stroke="rgba(255,255,255,0.07)" strokeWidth={2} />)}
          <path d={`${d} L${tip[0]} 320 L40 320Z`} fill="url(#fill)" />
          <path d={d} stroke="url(#gl)" strokeWidth={9} fill="none" strokeLinecap="round" style={{filter: 'drop-shadow(0 0 10px rgba(255,190,40,0.9))'}} />
          <circle cx={tip[0]} cy={tip[1]} r={14} fill="#fff" style={{filter: 'drop-shadow(0 0 12px #FFC93C)'}} />
        </svg>
        <T size={56} weight={900} style={{position: 'absolute', right: 44, bottom: 30}}>البناء</T>
        <T size={34} weight={700} color="rgba(255,255,255,0.55)" style={{position: 'absolute', left: 44, bottom: 42}}>تفكيرك يركّز</T>
      </Glass>
      {/* "مش على الهدم": a red chip knocked away */}
      <div style={{position: 'absolute', left: 70, top: 600, opacity: red * (1 - prog(t, b - 0.3, b)), transform: `rotate(${-8 * red}deg) scale(${lerp(0.5, 1, back(clamp(red)))})`,
        padding: '10px 34px', borderRadius: 22, background: RED, boxShadow: `0 0 40px rgba(255,45,58,0.6)`, display: 'flex', alignItems: 'center', gap: 14, direction: 'rtl'}}>
        <T size={56} weight={900}>✕ الهدم</T>
      </div>
    </AbsoluteFill>
  );
};

// ─── 7. done with mastery, even when nobody sees ─────────────────────────────
const Craft: React.FC<{t: number}> = ({t}) => {
  const [a, b] = SC.craft, o = life(t, a, b, 0.2, 0.3);
  const eyeIn = spring(t, at(55) - 0.05, 2.2, 0.55);
  const slash = eOut(prog(t, at(57), at(59)));
  const st = prog(t, at(54) - 0.05, at(54) + 0.25);
  return (
    <AbsoluteFill style={{opacity: o}}>
      {/* stamp: بإتقان */}
      <div style={{position: 'absolute', left: 420, top: 300, transform: `translate(-50%,-50%) rotate(-6deg) scale(${lerp(2.2, 1, eOut(st))})`, opacity: clamp(st * 3),
        padding: '6px 50px', border: `8px solid ${GOLD}`, borderRadius: 24, boxShadow: `0 0 40px rgba(255,190,40,0.5), inset 0 0 30px rgba(255,190,40,0.3)`, background: 'rgba(10,10,14,0.55)'}}>
        <T size={120} weight={900} color={GOLD} style={{textShadow: glowText('rgba(255,180,40,0.4)')}}>بإتقان</T>
      </div>
      {/* eye with a slash: nobody is watching */}
      <Glass x={850} y={300} w={300} h={180} r={90} style={{transform: `scale(${eyeIn})`, opacity: clamp(eyeIn * 2)}}>
        <svg width={300} height={180} viewBox="0 0 300 180">
          <path d="M60 90 Q150 10 240 90 Q150 170 60 90Z" stroke="#fff" strokeWidth={10} fill="none" />
          <circle cx={150} cy={90} r={26} fill="#fff" />
          <line x1={80} y1={150} x2={220} y2={30} stroke={RED} strokeWidth={14} strokeLinecap="round" strokeDasharray={185} strokeDashoffset={185 * (1 - slash)}
            style={{filter: `drop-shadow(0 0 8px ${RED})`}} />
        </svg>
      </Glass>
    </AbsoluteFill>
  );
};

// ─── 8. inner peace / inner strength meter ───────────────────────────────────
const Peace: React.FC<{t: number}> = ({t}) => {
  const [a, b] = SC.peace, out = eIn(prog(t, b - 0.3, b));
  const p = spring(t, a + 0.05, 2.0, 0.55);
  const v1 = eOut(prog(t, at(61), at(62) + 0.5)), v2 = eOut(prog(t, at(63), at(64) + 0.4));
  const second = t >= at(63) - 0.05;
  const v = second ? v2 : v1;
  const R = 150, C = 2 * Math.PI * R;
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `translateY(${out * 100}px)`}}>
      <Glass x={W / 2} y={720} w={780} h={860} r={48} glow="rgba(255,190,40,0.2)" style={{transform: `scale(${lerp(0.7, 1, p)})`, opacity: clamp(p * 2)}}>
        <T size={110} weight={900} color={GOLD} style={{position: 'absolute', left: 0, right: 0, top: 40, textAlign: 'center', direction: 'ltr', textShadow: glowText('rgba(255,180,40,0.5)')}}>
          {Math.round(v * 100)}%</T>
        <svg width={400} height={400} style={{position: 'absolute', left: 190, top: 210}}>
          <circle cx={200} cy={200} r={R} stroke="rgba(255,255,255,0.08)" strokeWidth={34} fill="none" />
          <circle cx={200} cy={200} r={R} stroke={GOLD} strokeWidth={34} fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - v)}
            transform="rotate(-90 200 200)" style={{filter: 'drop-shadow(0 0 16px rgba(255,190,40,0.9))'}} />
        </svg>
        <div style={{position: 'absolute', left: 290, top: 310, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, #FFF3B0, ${GOLD} 45%, ${GOLD2})`,
          boxShadow: '0 0 60px rgba(255,190,40,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width="110" height="110" viewBox="0 0 24 24"><path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" fill="rgba(120,60,0,0.8)" /></svg>
        </div>
        <T size={70} weight={900} style={{position: 'absolute', left: 0, right: 0, top: 650, textAlign: 'center'}}>{second ? 'قوة داخلية' : 'سلام نفسي'}</T>
        <T size={34} weight={700} color="rgba(255,255,255,0.5)" style={{position: 'absolute', left: 0, right: 0, top: 750, textAlign: 'center'}}>بتعيش فيها كل يوم</T>
      </Glass>
      {/* gold particles burst on "قوة داخلية" */}
      {Array.from({length: 22}).map((_, i) => {
        const q = prog(t, at(63), at(63) + 1.2); if (q <= 0 || q >= 1) return null;
        const ang = rnd(i) * Math.PI * 2, dist = 200 + rnd(i + 5) * 520;
        return <div key={i} style={{position: 'absolute', left: W / 2 + Math.cos(ang) * dist * eOut(q), top: 720 + Math.sin(ang) * dist * eOut(q) + q * q * 200,
          width: 16, height: 16, borderRadius: 4, background: GOLD, transform: `rotate(${q * 400 + i * 40}deg)`, opacity: 1 - q, boxShadow: '0 0 12px #FFC93C'}} />;
      })}
    </AbsoluteFill>
  );
};

// ─── 9. social media temptations bounce off a gold shield ────────────────────
const SOC = [{c: '#FF2D55', g: 'M12 21s-7-4.4-9.3-8.6C1 9 3 5.5 6.5 5.5c2 0 3.5 1.2 5.5 3.2 2-2 3.5-3.2 5.5-3.2C21 5.5 23 9 21.3 12.4 19 16.6 12 21 12 21z'},
  {c: '#7C4DFF', g: 'M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 3 13.5z'},
  {c: '#FF9F1C', g: 'M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5-6.7V3.5a2 2 0 0 0-4 0v.8A7 7 0 0 0 5 11v5l-2 2v1h18v-1z'},
  {c: '#00C2FF', g: 'M8 5v14l11-7z'}];
const Social: React.FC<{t: number}> = ({t}) => {
  const [a] = SC.social;
  const sh = spring(t, a + 0.05, 2.0, 0.5);
  const cy = 300;
  const fadeEnd = 1 - prog(t, 32.2, 32.47);
  return (
    <AbsoluteFill style={{opacity: fadeEnd}}>
      <div style={{position: 'absolute', left: W / 2, top: cy, transform: `translate(-50%,-50%) scale(${sh})`}}>
        <div style={{position: 'absolute', left: -260, top: -260, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,190,40,0.35), rgba(255,190,40,0) 65%)'}} />
        <svg width="300" height="300" viewBox="0 0 24 24" style={{position: 'absolute', left: -150, top: -150, filter: 'drop-shadow(0 0 30px rgba(255,190,40,0.9))'}}>
          <defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF3B0" /><stop offset="0.5" stopColor={GOLD} /><stop offset="1" stopColor={GOLD2} /></linearGradient></defs>
          <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" fill="url(#sg)" />
        </svg>
      </div>
      {Array.from({length: 10}).map((_, i) => {
        // each icon flies at the shield, hits, and is knocked away
        const t0 = a + 0.25 + i * 0.22, hit = t0 + 0.45;
        if (t < t0) return null;
        const side = i % 2 ? 1 : -1, sy = 120 + rnd(i) * 900;
        const sx = side > 0 ? W + 120 : -120;
        let x, y, r, o = 1;
        if (t < hit) { const q = eIn(prog(t, t0, hit)); x = lerp(sx, W / 2 + side * 150, q); y = lerp(sy, cy + (rnd(i + 2) - 0.5) * 160, q); r = q * 90 * side; }
        else { const q = prog(t, hit, hit + 0.9); x = W / 2 + side * (150 + q * 700); y = cy + (rnd(i + 2) - 0.5) * 160 + (-300 + 900 * q) * q; r = 90 * side + q * 500 * side; o = 1 - q; }
        const s = SOC[i % SOC.length];
        return (
          <div key={i} style={{position: 'absolute', left: x - 60, top: y - 60, width: 120, height: 120, borderRadius: 30, background: s.c, opacity: o, transform: `rotate(${r}deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 30px ${s.c}88`}}>
            <svg width="70" height="70" viewBox="0 0 24 24"><path d={s.g} fill="#fff" /></svg>
          </div>
        );
      })}
      {/* impact rings */}
      {Array.from({length: 10}).map((_, i) => {
        const q = prog(t, a + 0.7 + i * 0.22, a + 1.1 + i * 0.22); if (q <= 0 || q >= 1) return null;
        return <div key={i} style={{position: 'absolute', left: W / 2 - 170 - q * 120, top: cy - 170 - q * 120, width: 340 + q * 240, height: 340 + q * 240, borderRadius: '50%',
          border: `6px solid rgba(255,201,60,${0.8 * (1 - q)})`}} />;
      })}
    </AbsoluteFill>
  );
};

// ─── flashes at the big cuts ─────────────────────────────────────────────────
const Flashes: React.FC<{t: number}> = ({t}) => {
  const red = [at(11)].reduce((m, k) => Math.max(m, t >= k ? Math.exp(-(t - k) * 7) : 0), 0);
  const white = [SC.question[0], SC.peace[0], SC.social[0]].reduce((m, k) => Math.max(m, t >= k ? Math.exp(-(t - k) * 10) : 0), 0);
  return (
    <>
      <AbsoluteFill style={{background: `radial-gradient(circle, rgba(255,45,58,0) 30%, rgba(255,45,58,0.9))`, opacity: red * 0.7}} />
      <AbsoluteFill style={{background: '#fff', opacity: white * 0.5}} />
    </>
  );
};

export const Reel: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const glitchAt = at(11) - 0.02;
  return (
    <AbsoluteFill style={{background: INK}}>
      <Glitch t={t} t0={glitchAt} dur={0.55}>
        <Speaker t={t} />
        {inS(t, 'ask') && <Ask t={t} />}
        {inS(t, 'question') && <Question t={t} />}
      </Glitch>
      {inS(t, 'tag') && <Tag t={t} />}
      {inS(t, 'rule') && <Rule t={t} />}
      {inS(t, 'ideal') && <Ideal t={t} />}
      {inS(t, 'build') && <Build t={t} />}
      {inS(t, 'craft') && <Craft t={t} />}
      {inS(t, 'peace') && <Peace t={t} />}
      {inS(t, 'social') && <Social t={t} />}
      {inS(t, 'scout') && <ScoutPhoto t={t} />}
      <Subs t={t} />
      <Flashes t={t} />
    </AbsoluteFill>
  );
};
