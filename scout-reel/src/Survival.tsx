// Reel 2: the scouts' "rule of threes" (3 minutes without air, 3 days without water, 3 weeks without food,
// but not 3 seconds once you lose your nerve). Same look as Reel.tsx: dark glass cards, glowing gold, red
// glitch / flash hits and word-by-word subtitles. Every time comes from src/words_survival.json.
import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import WORDS from './words_survival.json';
import {FPS} from './Reel';
import {W, H, GOLD, GOLD2, RED, INK, FONT, clamp, prog, lerp, eOut, eIn, eIO, back, spring, life, rnd, Glass, T, glowText, popStyle, Glitch, Sparkle} from './Reel';

export const SURVIVAL_DURATION = 631;
const CYAN = '#38D6FF', BLUE = '#3D8BFF', ORANGE = '#FF9F1C';

type Wd = {w: string; s: number; e: number};
const WD = WORDS as Wd[];
const FIX: Record<number, string> = {6: 'ذهبية', 9: 'الثلاثية', 10: 'عادةً', 12: '٣', 13: 'دقايق', 15: 'هوا', 16: '٣', 19: 'مَي', 20: '٣',
  21: 'أسابيع', 28: '٣', 34: 'للذعر', 35: 'والخوف'};
const txt = (i: number) => FIX[i] ?? WD[i].w;
const at = (i: number) => WD[i].s;
const GOLDW = new Set([5, 6, 8, 9, 12, 13, 16, 17, 20, 21, 38, 39, 41, 42]);
const REDW = new Set([28, 29, 32, 34, 35, 36, 37]);
const CHUNKS = [[0, 1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11], [12, 13], [14, 15], [16, 17], [18, 19], [20, 21], [22, 23], [24, 25, 26, 27],
  [28, 29], [30, 31, 32], [33], [34, 35], [36, 37], [38, 39], [40, 41], [42, 43], [44, 45, 46]];

const SC = {
  hook: [0.0, 3.92], threes: [3.92, 9.5], seconds: [9.5, 11.95], panic: [11.95, 15.24], pressure: [15.24, 16.56],
  control: [16.56, 18.3], key: [18.3, 19.85], plan: [19.85, 21.04],
};
const inS = (t: number, k: keyof typeof SC) => t >= SC[k][0] && t < SC[k][1];

// ─── speaker ─────────────────────────────────────────────────────────────────
const PUNCH: [number, number][] = [[0, 1.0], [1.56, 1.07], [3.92, 1.0], [9.48, 1.1], [11.0, 1.2], [11.9, 1.0], [12.72, 1.12], [14.0, 1.18],
  [16.54, 1.0], [18.26, 1.08], [19.8, 1.0]];
const zoomAt = (t: number) => {
  let z = 1;
  for (let i = 0; i < PUNCH.length; i++) {
    const [a, s] = PUNCH[i];
    if (t >= a) { const prev = i ? PUNCH[i - 1][1] : 1; z = lerp(prev, s, eOut(prog(t, a, a + 0.22))); }
  }
  return z;
};
// panic tints the room red; control brings it back
const redAt = (t: number) => life(t, 12.7, 16.6, 0.4, 0.5);
const focusAt = (t: number) => Math.max(life(t, SC.seconds[0] + 0.3, SC.seconds[1], 0.3, 0.25), life(t, SC.key[0], SC.key[1], 0.3, 0.3));
const Speaker: React.FC<{t: number}> = ({t}) => {
  const f = focusAt(t), r = redAt(t);
  const shake = r > 0.3 && t > 13.38 && t < 15.3 ? (rnd(Math.floor(t * 30)) - 0.5) * 10 * r : 0;
  const kick = [3.92, 9.5, 11.95, 16.56, 19.85].reduce((a, k) => a + (t >= k ? Math.exp(-(t - k) * 18) : 0), 0);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: INK}}>
      <AbsoluteFill style={{transform: `translate(${shake}px, ${kick * 18}px) scale(${zoomAt(t) * (1 + 0.012 * Math.sin(t * 0.7))})`, transformOrigin: '540px 760px',
        filter: `contrast(1.1) saturate(${0.88 - 0.3 * r}) brightness(${0.9 - 0.45 * f}) blur(${f * 9}px)`}}>
        <OffthreadVideo src={staticFile('survival/talk.mp4')} style={{width: W, height: H}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 40%, rgba(5,6,10,0.72) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,16,0.55) 0%, rgba(8,10,16,0) 32%, rgba(8,10,16,0) 62%, rgba(8,10,16,0.6) 100%)'}} />
      <AbsoluteFill style={{background: 'rgba(255,170,60,0.05)', mixBlendMode: 'overlay'}} />
      <AbsoluteFill style={{background: `radial-gradient(circle, rgba(255,30,40,0) 35%, rgba(255,30,40,${0.55 + 0.25 * Math.sin(t * 9)}))`, opacity: r}} />
    </AbsoluteFill>
  );
};

// ─── subtitles ───────────────────────────────────────────────────────────────
const Subs: React.FC<{t: number}> = ({t}) => {
  const idx = CHUNKS.findIndex((c, i) => t >= at(c[0]) - 0.05 && (i === CHUNKS.length - 1 || t < at(CHUNKS[i + 1][0]) - 0.05));
  if (idx < 0) return null;
  const c = CHUNKS[idx], t0 = at(c[0]) - 0.05, ent = eOut(prog(t, t0, t0 + 0.18));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 1450, display: 'flex', justifyContent: 'center', alignItems: 'baseline', direction: 'rtl', gap: 18,
      transform: `translateY(${(1 - ent) * 24}px)`}}>
      {c.map((i) => {
        const p = prog(t, at(i) - 0.04, at(i) + 0.14), key = GOLDW.has(i) || REDW.has(i);
        return (
          <span key={i} style={{fontFamily: FONT, fontWeight: key ? 900 : 800, fontSize: key ? 84 : 66, color: GOLDW.has(i) ? GOLD : '#fff', position: 'relative',
            opacity: t >= at(i) - 0.04 ? 1 : 0, transform: `translateY(${(1 - eOut(p)) * 18}px) scale(${lerp(key ? 1.35 : 1.15, 1, eOut(p))})`, display: 'inline-block',
            textShadow: GOLDW.has(i) ? '0 0 26px rgba(255,180,40,0.75), 0 5px 14px rgba(0,0,0,0.85)' : '0 5px 16px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.9)',
            padding: REDW.has(i) ? '0 14px' : 0}}>
            {REDW.has(i) && <span style={{position: 'absolute', inset: '14% 0 10% 0', background: RED, borderRadius: 10, zIndex: -1,
              transform: `scaleX(${eOut(prog(t, at(i), at(i) + 0.2))})`, transformOrigin: 'right', boxShadow: `0 0 30px ${RED}`}} />}
            {txt(i)}
          </span>
        );
      })}
    </div>
  );
};

// ─── 1. hook: heartbeat line, then the golden "3" coin ───────────────────────
const Hook: React.FC<{t: number}> = ({t}) => {
  const [a, b] = SC.hook, out = eIn(prog(t, b - 0.3, b));
  // ECG trace drawn left → right while "للبقاء على قيد الحياة" is said
  const draw = prog(t, 0.05, 1.5), fadeEcg = 1 - prog(t, 1.45, 1.7);
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const x = i / 120, px = 60 + x * 960;
    const ph = (x * 3) % 1;
    const y = ph > 0.42 && ph < 0.5 ? -110 * Math.sin((ph - 0.42) / 0.08 * Math.PI) : ph > 0.5 && ph < 0.56 ? 60 * Math.sin((ph - 0.5) / 0.06 * Math.PI) : 0;
    pts.push(`${i ? 'L' : 'M'}${px.toFixed(1)} ${(330 + y).toFixed(1)}`);
  }
  const coin = spring(t, at(5) - 0.05, 1.8, 0.5);
  const flip = eIO(prog(t, at(8) - 0.1, at(8) + 0.45)), sx = Math.cos(flip * Math.PI * 2);
  const label = t >= at(8) - 0.05 ? 'القاعدة الثلاثية' : 'قاعدة ذهبية';
  const cy = 270;
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `translateY(${out * -120}px) scale(${1 - out * 0.2})`}}>
      <svg width={W} height={600} style={{position: 'absolute', top: 0, left: 0, opacity: fadeEcg}}>
        <path d={pts.join(' ')} stroke={RED} strokeWidth={9} fill="none" strokeLinejoin="round" strokeDasharray={3000} strokeDashoffset={3000 * (1 - draw)}
          style={{filter: `drop-shadow(0 0 12px ${RED})`}} />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', justifyContent: 'center', opacity: fadeEcg}}>
        <div style={popStyle(t, 0.05)}><T size={84} weight={900}>للبقاء على قيد الحياة</T></div>
      </div>
      {/* rays + coin with a big 3 */}
      <div style={{position: 'absolute', left: W / 2 - 700, top: cy - 700, width: 1400, height: 1400, opacity: 0.5 * coin,
        background: 'repeating-conic-gradient(from 0deg, rgba(255,200,60,0.18) 0deg 6deg, rgba(255,200,60,0) 6deg 18deg)', transform: `rotate(${t * 12}deg)`,
        WebkitMaskImage: 'radial-gradient(circle, black 10%, transparent 60%)', maskImage: 'radial-gradient(circle, black 10%, transparent 60%)'}} />
      <div style={{position: 'absolute', left: W / 2, top: cy, transform: `translate(-50%,-50%) translateY(${(1 - coin) * -500}px) scale(${lerp(0.4, 1, coin)}) scaleX(${Math.abs(sx) < 0.05 ? 0.05 : sx})`,
        opacity: clamp(coin * 3)}}>
        <div style={{width: 330, height: 330, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, #FFF3B0, ${GOLD} 40%, ${GOLD2} 75%, #B86A00)`,
          boxShadow: '0 0 80px rgba(255,190,40,0.85), 0 0 180px rgba(255,160,30,0.5), inset 0 -16px 30px rgba(140,70,0,0.5), inset 0 10px 20px rgba(255,255,255,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
          <div style={{position: 'absolute', inset: 22, borderRadius: '50%', border: '6px solid rgba(150,80,0,0.45)'}} />
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 230, color: 'rgba(120,60,0,0.88)', lineHeight: 1, marginTop: -20}}>٣</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: cy + 175, display: 'flex', justifyContent: 'center'}}>
        <div style={popStyle(t, at(5) - 0.05)}>
          <T size={92} weight={900} color={GOLD} style={{textShadow: glowText('rgba(255,180,40,0.55)')}}>{label}</T>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── 2. the three survival cards: air / water / food ─────────────────────────
const AirIcon = ({c}: {c: string}) => (
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round">
    <path d="M3 8h11a3 3 0 1 0-3-3" /><path d="M3 12h16a3 3 0 1 1-3 3" /><path d="M3 16h7" />
  </svg>
);
const DropIcon = ({c}: {c: string}) => (
  <svg width="80" height="80" viewBox="0 0 24 24"><path d="M12 2.5C9 7 5.5 10.5 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10.5 15 7 12 2.5z" fill={c} />
    <path d="M9 15a3 3 0 0 0 3 3" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
);
const FoodIcon = ({c}: {c: string}) => (
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2v8a2 2 0 0 0 2 2v10" /><path d="M10 2v8a2 2 0 0 1-2 2" /><path d="M8 2v6" /><path d="M17 22V2c-2.2 1.5-3 4-3 7v4h3" />
  </svg>
);
const CARDS = [
  {i: 12, num: '٣', unit: 'دقايق', sub: 'بلا هوا', c: CYAN, Icon: AirIcon},
  {i: 16, num: '٣', unit: 'أيام', sub: 'بلا مَي', c: BLUE, Icon: DropIcon},
  {i: 20, num: '٣', unit: 'أسابيع', sub: 'بلا أكل', c: ORANGE, Icon: FoodIcon},
];
const Threes: React.FC<{t: number}> = ({t}) => {
  const [a, b] = SC.threes;
  return (
    <AbsoluteFill>
      {CARDS.map((k, j) => {
        const t0 = at(k.i) - 0.12, p = spring(t, t0, 2.3, 0.55);
        const out = eIn(prog(t, b - 0.35 + j * 0.06, b - 0.05 + j * 0.06));
        const ring = eOut(prog(t, t0 + 0.2, t0 + 1.2)), subOn = prog(t, at(k.i + 2) - 0.05, at(k.i + 2) + 0.25);
        const R = 46, C = 2 * Math.PI * R;
        if (t < t0) return null;
        return (
          <Glass key={j} x={W / 2 + (1 - p) * (j % 2 ? -700 : 700) + out * (j % 2 ? 900 : -900)} y={175 + j * 160} w={900} h={140} r={40}
            glow={`${k.c}33`} style={{direction: 'rtl', opacity: clamp(p * 2) * (1 - out)}}>
            {/* icon chip */}
            <div style={{position: 'absolute', right: 20, top: 16, width: 108, height: 108, borderRadius: 30, background: `${k.c}22`, border: `2px solid ${k.c}88`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 30px ${k.c}55`}}><k.Icon c={k.c} /></div>
            <div style={{position: 'absolute', right: 150, top: 8, display: 'flex', alignItems: 'baseline', gap: 16}}>
              <T size={92} weight={900} color={GOLD} style={{textShadow: glowText('rgba(255,180,40,0.45)'), lineHeight: 1.2}}>{k.num}</T>
              <T size={62} weight={900}>{k.unit}</T>
            </div>
            <div style={{position: 'absolute', left: 140, top: 38, opacity: clamp(subOn * 2), transform: `translateX(${(1 - eOut(subOn)) * 40}px)`}}>
              <T size={50} weight={800} color="rgba(255,255,255,0.75)">{k.sub}</T>
            </div>
            {/* timer ring */}
            <svg width={120} height={120} style={{position: 'absolute', left: 14, top: 10}}>
              <circle cx={60} cy={60} r={R} stroke="rgba(255,255,255,0.1)" strokeWidth={10} fill="none" />
              <circle cx={60} cy={60} r={R} stroke={k.c} strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * ring}
                transform="rotate(-90 60 60)" style={{filter: `drop-shadow(0 0 8px ${k.c})`}} />
            </svg>
          </Glass>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── 3. "but you can't live 3 seconds": red stopwatch 3 → 0 ───────────────────
const Seconds: React.FC<{t: number}> = ({t}) => {
  const [a, b] = SC.seconds, o = life(t, a + 0.25, b, 0.3, 0.2);
  const run = prog(t, at(28), at(29) + 0.55);
  const n = Math.max(0, 3 - Math.floor(run * 3.999));
  const R = 210, C = 2 * Math.PI * R;
  const beat = 1 + 0.06 * Math.max(0, Math.sin((t - at(28)) * Math.PI * 3.4)) * (run > 0 ? 1 : 0);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <div style={{position: 'absolute', left: W / 2, top: 760, transform: `translate(-50%,-50%) scale(${lerp(0.7, 1, back(prog(t, a + 0.25, a + 0.65))) * beat})`}}>
        <svg width={520} height={560} viewBox="-260 -300 520 560" style={{overflow: 'visible'}}>
          <rect x={-40} y={-292} width={80} height={44} rx={12} fill="#fff" />
          <rect x={-14} y={-252} width={28} height={30} fill="#fff" />
          <circle r={R + 24} fill="rgba(16,18,24,0.92)" stroke="rgba(255,255,255,0.15)" strokeWidth={4} />
          <circle r={R} stroke="rgba(255,255,255,0.08)" strokeWidth={26} fill="none" />
          <circle r={R} stroke={RED} strokeWidth={26} fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * run}
            transform="rotate(-90)" style={{filter: `drop-shadow(0 0 18px ${RED})`}} />
        </svg>
        <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 230, lineHeight: 1,
          color: run > 0 ? RED : '#fff', textShadow: run > 0 ? glowText('rgba(255,45,58,0.7)') : '0 10px 30px rgba(0,0,0,0.6)'}}>{['٠', '١', '٢', '٣'][n]}</div>
        <T size={56} weight={900} style={{position: 'absolute', left: 0, right: 0, top: 395, textAlign: 'center'}}>ثواني</T>
      </div>
    </AbsoluteFill>
  );
};

// ─── 4. panic: warning sign, shaking red chips ───────────────────────────────
const Panic: React.FC<{t: number}> = ({t}) => {
  const [a, b] = SC.panic, o = life(t, at(31) - 0.1, b, 0.2, 0.25);
  const sign = spring(t, at(31) - 0.1, 2.4, 0.4);
  const f = Math.floor(t * 30);
  const jit = (k: number) => (t > at(33) ? (rnd(f * 3 + k) - 0.5) * 14 : 0);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <div style={{position: 'absolute', left: W / 2, top: 260, transform: `translate(-50%,-50%) translate(${jit(1)}px, ${jit(2)}px) scale(${sign}) rotate(${Math.sin(t * 20) * 4 * (t > at(33) ? 1 : 0)}deg)`}}>
        <svg width={300} height={270} viewBox="0 0 24 22" style={{filter: `drop-shadow(0 0 30px ${RED})`}}>
          <path d="M12 1L23 21H1z" fill={RED} stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
          <rect x="11" y="7" width="2" height="8" rx="1" fill="#fff" /><circle cx="12" cy="18" r="1.2" fill="#fff" />
        </svg>
      </div>
      {[{s: 'أعصابك', i: 32, x: 250, y: 470, r: -8}, {s: 'ذعر', i: 34, x: 830, y: 450, r: 7}, {s: 'خوف', i: 35, x: 540, y: 520, r: -3}].map((c, j) => {
        const p = prog(t, at(c.i) - 0.05, at(c.i) + 0.25);
        return (
          <div key={j} style={{position: 'absolute', left: c.x, top: c.y, transform: `translate(-50%,-50%) translate(${jit(j + 5)}px, ${jit(j + 9)}px) rotate(${c.r}deg) scale(${lerp(1.8, 1, eOut(p))})`,
            opacity: clamp(p * 3), padding: '6px 34px', borderRadius: 20, background: RED, boxShadow: `0 0 40px rgba(255,45,58,0.7)`}}>
            <T size={60} weight={900}>{c.s}</T>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── 5. crises and pressure: gauge needle into the red ───────────────────────
const Pressure: React.FC<{t: number}> = ({t}) => {
  const [a, b] = SC.pressure, o = life(t, a, b, 0.2, 0.2);
  const v = eOut(prog(t, a + 0.1, at(37) + 0.3)) + 0.03 * Math.sin(t * 40) * prog(t, at(37), b);
  const ang = lerp(-120, 110, v);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <Glass x={W / 2} y={330} w={560} h={420} r={44} glow="rgba(255,45,58,0.3)" style={popStyle(t, a)}>
        <svg width={560} height={340} viewBox="-280 -260 560 340" style={{position: 'absolute', top: 10}}>
          <defs><linearGradient id="gz" x1="0" x2="1"><stop offset="0" stopColor="#3DDC84" /><stop offset="0.5" stopColor={GOLD} /><stop offset="1" stopColor={RED} /></linearGradient></defs>
          <path d="M-200 40 A200 200 0 1 1 200 40" stroke="url(#gz)" strokeWidth={30} fill="none" strokeLinecap="round" transform="rotate(0)" />
          <g transform={`rotate(${ang})`}><path d="M-10 0 L0 -180 L10 0z" fill="#fff" /></g>
          <circle r={26} fill="#fff" />
        </svg>
        <T size={56} weight={900} style={{position: 'absolute', left: 0, right: 0, bottom: 26, textAlign: 'center'}}>ضغوط</T>
      </Glass>
    </AbsoluteFill>
  );
};

// ─── 6. control your emotions: dial from red to calm gold ────────────────────
const Control: React.FC<{t: number}> = ({t}) => {
  const [a, b] = SC.control, o = life(t, a, b, 0.25, 0.25);
  const turn = eIO(prog(t, at(38) + 0.2, at(39) + 0.5));
  const col = turn < 0.5 ? RED : GOLD;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <div style={{position: 'absolute', left: W / 2, top: 390, transform: `translate(-50%,-50%) scale(${lerp(0.6, 1, back(prog(t, a, a + 0.4)))})`}}>
        <div style={{width: 340, height: 340, borderRadius: '50%', background: 'linear-gradient(160deg, #2B2F3A, #0F1117)', border: '3px solid rgba(255,255,255,0.15)',
          boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 ${60 + 40 * turn}px ${col}88`, position: 'relative', transform: `rotate(${lerp(110, -40, turn)}deg)`}}>
          {Array.from({length: 24}).map((_, i) => (
            <div key={i} style={{position: 'absolute', left: 166, top: 6, width: 8, height: 24, borderRadius: 4, background: 'rgba(255,255,255,0.25)',
              transformOrigin: '4px 164px', transform: `rotate(${i * 15}deg)`}} />
          ))}
          <div style={{position: 'absolute', left: 158, top: 40, width: 24, height: 70, borderRadius: 12, background: col, boxShadow: `0 0 20px ${col}`}} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 110, display: 'flex', justifyContent: 'center'}}>
        <div style={popStyle(t, at(39) - 0.05)}><T size={64} weight={900} color={turn > 0.5 ? GOLD : '#fff'}>تحكّم بمشاعرك</T></div>
      </div>
    </AbsoluteFill>
  );
};

// ─── 7. the key: "مفتاح النجاة الأول" ─────────────────────────────────────────
const KeyScene: React.FC<{t: number}> = ({t}) => {
  const [a, b] = SC.key, out = eIn(prog(t, b - 0.3, b));
  const p = spring(t, a + 0.05, 1.8, 0.5);
  const sweep = prog(t, at(43) - 0.2, at(43) + 0.4);
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `scale(${1 + out * 0.2})`}}>
      <div style={{position: 'absolute', left: W / 2 - 600, top: 700 - 600, width: 1200, height: 1200, opacity: 0.55 * p,
        background: 'repeating-conic-gradient(from 0deg, rgba(255,200,60,0.18) 0deg 6deg, rgba(255,200,60,0) 6deg 18deg)', transform: `rotate(${t * 14}deg)`,
        WebkitMaskImage: 'radial-gradient(circle, black 10%, transparent 60%)', maskImage: 'radial-gradient(circle, black 10%, transparent 60%)'}} />
      <div style={{position: 'absolute', left: W / 2, top: 640, transform: `translate(-50%,-50%) rotate(${lerp(-200, -35, p)}deg) scale(${lerp(0.3, 1, p)})`}}>
        <svg width={560} height={260} viewBox="0 0 56 26" style={{filter: 'drop-shadow(0 0 30px rgba(255,190,40,0.9))', overflow: 'visible'}}>
          <defs><linearGradient id="kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF3B0" /><stop offset="0.5" stopColor={GOLD} /><stop offset="1" stopColor={GOLD2} /></linearGradient>
            <clipPath id="kc"><circle cx="12" cy="13" r="11" /><rect x="20" y="10" width="34" height="6" rx="1" /><rect x="44" y="15" width="4" height="7" /><rect x="50" y="15" width="4" height="9" /></clipPath></defs>
          <circle cx="12" cy="13" r="11" fill="url(#kg)" /><circle cx="12" cy="13" r="5" fill={INK} />
          <rect x="20" y="10" width="34" height="6" rx="1" fill="url(#kg)" /><rect x="44" y="15" width="4" height="7" fill="url(#kg)" /><rect x="50" y="15" width="4" height="9" fill="url(#kg)" />
          <g clipPath="url(#kc)"><rect x={lerp(-20, 70, sweep)} y="-5" width="6" height="40" fill="rgba(255,255,255,0.85)" transform="skewX(-20)" /></g>
        </svg>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 860, display: 'flex', justifyContent: 'center', gap: 24, direction: 'rtl'}}>
        <div style={popStyle(t, at(41) - 0.05)}><T size={104} weight={900}>مفتاح</T></div>
        <div style={popStyle(t, at(42) - 0.05)}><T size={104} weight={900} color={GOLD} style={{textShadow: glowText('rgba(255,180,40,0.6)')}}>النجاة</T></div>
      </div>
      <div style={{position: 'absolute', left: W / 2, top: 400, transform: `translate(-50%,-50%) rotate(-8deg) scale(${lerp(2, 1, eOut(prog(t, at(43) - 0.05, at(43) + 0.2)))})`,
        opacity: clamp(prog(t, at(43) - 0.05, at(43) + 0.1) * 3), padding: '4px 40px', borderRadius: 20, border: `7px solid ${GOLD}`, background: 'rgba(10,10,14,0.6)',
        boxShadow: '0 0 40px rgba(255,190,40,0.5)'}}>
        <T size={80} weight={900} color={GOLD}>الأول</T>
      </div>
      <Sparkle x={300} y={560} s={80} t={t} t0={at(42)} />
      <Sparkle x={820} y={720} s={60} t={t} t0={at(42) + 0.2} />
    </AbsoluteFill>
  );
};

// ─── 8. "before any plan": priority list ─────────────────────────────────────
const Plan: React.FC<{t: number}> = ({t}) => {
  const [a] = SC.plan, end = 1 - prog(t, 20.85, 21.04);
  const p = spring(t, a + 0.02, 2.2, 0.6);
  const rows = [{n: '١', s: 'تحكّم بمشاعرك', on: true, t0: a + 0.1}, {n: '٢', s: 'الخطة', on: false, t0: at(46) - 0.1}];
  return (
    <AbsoluteFill style={{opacity: end}}>
      <Glass x={W / 2} y={330} w={760} h={380} r={44} glow="rgba(255,190,40,0.2)" style={{transform: `translateY(${(1 - p) * -200}px) scale(${lerp(0.8, 1, p)})`, opacity: clamp(p * 2)}}>
        {rows.map((r, j) => {
          const q = spring(t, r.t0, 2.4, 0.6);
          return (
            <div key={j} style={{position: 'absolute', right: 40, left: 40, top: 50 + j * 150, height: 120, borderRadius: 30, direction: 'rtl', opacity: clamp(q * 2),
              transform: `translateX(${(1 - q) * -200}px)`, background: r.on ? 'rgba(255,201,60,0.14)' : 'rgba(255,255,255,0.05)', border: r.on ? `2px solid ${GOLD}` : '2px solid rgba(255,255,255,0.1)'}}>
              <div style={{position: 'absolute', right: 20, top: 16, width: 88, height: 88, borderRadius: '50%', background: r.on ? GOLD : 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: r.on ? '0 0 30px rgba(255,190,40,0.7)' : 'none'}}>
                <T size={56} weight={900} color={r.on ? INK : '#fff'}>{r.n}</T>
              </div>
              <T size={60} weight={900} color={r.on ? GOLD : 'rgba(255,255,255,0.55)'} style={{position: 'absolute', right: 130, top: 16}}>{r.s}</T>
            </div>
          );
        })}
      </Glass>
    </AbsoluteFill>
  );
};

const Flashes: React.FC<{t: number}> = ({t}) => {
  const red = [at(28), at(32)].reduce((m, k) => Math.max(m, t >= k ? Math.exp(-(t - k) * 7) : 0), 0);
  const white = [SC.threes[0], SC.seconds[0], SC.control[0], SC.key[0]].reduce((m, k) => Math.max(m, t >= k ? Math.exp(-(t - k) * 10) : 0), 0);
  return (
    <>
      <AbsoluteFill style={{background: 'radial-gradient(circle, rgba(255,45,58,0) 30%, rgba(255,45,58,0.9))', opacity: red * 0.7}} />
      <AbsoluteFill style={{background: '#fff', opacity: white * 0.45}} />
    </>
  );
};

export const Survival: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{background: INK}}>
      <Glitch t={t} t0={at(32) - 0.02} dur={0.5}>
        <Speaker t={t} />
        {inS(t, 'panic') && <Panic t={t} />}
      </Glitch>
      {inS(t, 'hook') && <Hook t={t} />}
      {inS(t, 'threes') && <Threes t={t} />}
      {inS(t, 'seconds') && <Seconds t={t} />}
      {inS(t, 'pressure') && <Pressure t={t} />}
      {inS(t, 'control') && <Control t={t} />}
      {inS(t, 'key') && <KeyScene t={t} />}
      {inS(t, 'plan') && <Plan t={t} />}
      <Subs t={t} />
      <Flashes t={t} />
    </AbsoluteFill>
  );
};
