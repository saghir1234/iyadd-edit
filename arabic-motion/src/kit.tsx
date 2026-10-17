import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {T, Word} from './theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

export const useTime = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return f / fps;
};

// ---------- backgrounds ----------
export const Background: React.FC<{kind: string; t: number; grid?: boolean}> = ({kind, t, grid}) => {
  const breathe = 1 + 0.025 * Math.sin(t * 0.6);
  const dark = kind !== 'light';
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{background: T.bg[kind], transform: `scale(${breathe})`}} />
      {grid && (
        <AbsoluteFill
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.05) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,0.05) 2px,transparent 2px)',
            backgroundSize: '120px 120px',
            backgroundPosition: `${(t * 6) % 120}px 0px`,
            maskImage: 'linear-gradient(180deg,transparent 0%,#000 25%,#000 70%,transparent 100%)',
          }}
        />
      )}
      {/* soft top light, like the studio spot in the reference */}
      <AbsoluteFill
        style={{
          background: dark
            ? 'radial-gradient(ellipse 60% 28% at 50% 0%,rgba(255,255,255,0.16),transparent 70%)'
            : 'radial-gradient(ellipse 60% 30% at 50% 35%,rgba(255,255,255,0.55),transparent 70%)',
        }}
      />
      <Grain t={t} dark={dark} />
    </AbsoluteFill>
  );
};

const Grain: React.FC<{t: number; dark: boolean}> = ({t, dark}) => {
  const k = Math.floor(t * 12);
  return (
    <AbsoluteFill style={{opacity: dark ? 0.09 : 0.06, mixBlendMode: dark ? 'screen' : 'multiply'}}>
      <Img
        src={staticFile('noise.png')}
        style={{width: 1400, height: 2300, position: 'absolute', left: -((k * 97) % 300), top: -((k * 61) % 360)}}
      />
    </AbsoluteFill>
  );
};

// ---------- words ----------
export type LineStyle = 'small' | 'big' | 'gold' | 'plate' | 'white' | 'ink' | 'goldItalic';

const styleFor = (st: LineStyle, size?: number, dark?: boolean): React.CSSProperties => {
  switch (st) {
    case 'small':
      return {fontFamily: T.font.sans, fontWeight: 300, fontSize: size ?? 66, color: dark ? '#e9e6df' : '#3a3a3a', letterSpacing: 0};
    case 'big':
      return {fontFamily: T.font.display, fontWeight: 700, fontSize: size ?? 170, color: dark ? '#f2f2f2' : T.ink, lineHeight: 1.25};
    case 'white':
      return {fontFamily: T.font.sans, fontWeight: 700, fontSize: size ?? 150, color: '#f1efe9', lineHeight: 1.3};
    case 'ink':
      return {fontFamily: T.font.sans, fontWeight: 700, fontSize: size ?? 150, color: T.ink, lineHeight: 1.3};
    case 'gold':
    case 'plate':
    case 'goldItalic':
      return {
        fontFamily: T.font.display,
        fontWeight: 700,
        fontSize: size ?? 160,
        lineHeight: 1.35,
        backgroundImage: T.gold,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      };
  }
};

/** One line of spoken words; each word stays hidden until it is spoken, then sharpens in. */
export const Line: React.FC<{
  words: Word[];
  t: number;
  st: LineStyle;
  y: number;
  size?: number;
  dark?: boolean;
  rules?: boolean;
  x?: number;
  maxW?: number;
}> = ({words, t, st, y, size, dark, rules, x = 540, maxW = 940}) => {
  const css = styleFor(st, size, dark);
  const plate = st === 'plate';
  const first = words.length ? words[0].s : 0;
  const plateK = interpolate(t, [first - 0.15, first + 0.35], [0, 1], {...clamp, easing: easeOut});
  const ruleK = interpolate(t, [first - 0.2, first + 0.5], [0, 1], {...clamp, easing: easeOut});
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: x - maxW / 2,
        width: maxW,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform: 'translateY(-50%)',
      }}
    >
      {rules && <Rule k={ruleK} dark={dark} side="r" />}
      <div style={{position: 'relative', padding: plate ? '6px 34px 18px' : 0}}>
        {plate && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg,#2b2117,#120d08)',
              boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
              clipPath: `inset(0 0 0 ${(1 - plateK) * 100}%)`,
            }}
          />
        )}
        <div style={{direction: 'rtl', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: Number(css.fontSize) * 0.3, position: 'relative', whiteSpace: 'nowrap'}}>
          {words.map((wd, i) => {
            const k = interpolate(t, [wd.s - 0.06, wd.s + 0.28], [0, 1], {...clamp, easing: easeOut});
            return (
              <span
                key={i}
                style={{
                  ...css,
                  display: 'inline-block',
                  opacity: k,
                  filter: `blur(${(1 - k) * 14}px)`,
                  transform: `translateY(${(1 - k) * 26}px) scale(${1 + (1 - k) * 0.08})`,
                  visibility: t < wd.s - 0.06 ? 'hidden' : 'visible',
                }}
              >
                {wd.w}
              </span>
            );
          })}
        </div>
      </div>
      {rules && <Rule k={ruleK} dark={dark} side="l" />}
    </div>
  );
};

const Rule: React.FC<{k: number; dark?: boolean; side: 'l' | 'r'}> = ({k, dark, side}) => (
  <div
    style={{
      width: 70 * k,
      height: 3,
      margin: '0 24px',
      background: dark ? 'rgba(240,230,210,0.75)' : 'rgba(40,40,40,0.65)',
      transformOrigin: side === 'l' ? 'left' : 'right',
      borderRadius: 2,
      opacity: k,
    }}
  />
);

// ---------- cut-out objects ----------
export type PropSpec = {
  src: string;
  x: number; // centre x in px
  y: number; // centre y in px
  w: number; // width in px
  from?: 'bottom' | 'top' | 'left' | 'right';
  at?: number; // entry time (scene-relative seconds)
  rot?: number;
  drift?: number; // px of slow upward drift across the scene
  spin?: number; // degrees of slow rotation across the scene
  front?: boolean;
  shadow?: boolean;
};

export const Prop: React.FC<{p: PropSpec; t: number; dur: number}> = ({p, t, dur}) => {
  const at = p.at ?? 0;
  const k = interpolate(t, [at, at + 1.0], [0, 1], {...clamp, easing: easeOut});
  const off = 1 - k;
  const dx = p.from === 'left' ? -700 * off : p.from === 'right' ? 700 * off : 0;
  const dy = p.from === 'top' ? -900 * off : p.from === 'bottom' || !p.from ? 900 * off : 0;
  const life = interpolate(t, [at, dur], [0, 1], clamp);
  const drift = -(p.drift ?? 30) * life;
  const rot = (p.rot ?? 0) + (p.spin ?? 0) * life;
  return (
    <Img
      src={staticFile('props/' + p.src)}
      style={{
        position: 'absolute',
        width: p.w,
        left: p.x - p.w / 2 + dx,
        top: p.y + dy + drift,
        transform: `translateY(-50%) rotate(${rot}deg)`,
        filter: p.shadow === false ? undefined : 'drop-shadow(0 30px 40px rgba(0,0,0,0.35))',
        opacity: t < at ? 0 : 1,
      }}
    />
  );
};

// ---------- thin orbit lines (hourglass scene) ----------
export const Orbits: React.FC<{t: number; dark?: boolean}> = ({t, dark}) => (
  <svg width={T.w} height={T.h} style={{position: 'absolute', inset: 0}}>
    {[700, 980, 1300].map((r, i) => (
      <ellipse
        key={i}
        cx={540 + 40 * i}
        cy={960}
        rx={r}
        ry={r * 0.82}
        fill="none"
        stroke={dark ? 'rgba(255,255,255,0.18)' : 'rgba(30,30,30,0.22)'}
        strokeWidth={2}
        transform={`rotate(${t * (6 + i * 3) * (i % 2 ? -1 : 1) - 20} 540 960)`}
        strokeDasharray={i === 1 ? '2200 900' : undefined}
      />
    ))}
  </svg>
);

// ---------- light flare ----------
export const Flare: React.FC<{t: number; at: number; x: number; y: number}> = ({t, at, x, y}) => {
  const k = interpolate(t, [at - 0.1, at + 0.12, at + 0.9], [0, 1, 0.25], clamp);
  if (k <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 400,
        top: y - 400,
        width: 800,
        height: 800,
        background: 'radial-gradient(circle,rgba(255,255,255,0.95) 0%,rgba(255,240,210,0.45) 12%,rgba(255,220,160,0.1) 35%,transparent 60%)',
        opacity: k,
        mixBlendMode: 'screen',
      }}
    />
  );
};

// ---------- one-word slam inside a ringed disc, colours invert per word ----------
export const Slam: React.FC<{words: Word[]; t: number; size?: number}> = ({words, t, size = 230}) => {
  let idx = 0;
  words.forEach((w, i) => {
    if (t >= w.s - 0.04) idx = i;
  });
  const w = words[idx];
  const dark = idx % 2 === 1;
  const k = interpolate(t, [w.s - 0.04, w.s + 0.18], [0, 1], {...clamp, easing: easeOut});
  return (
    <AbsoluteFill style={{background: dark ? '#050505' : '#f3f3f3'}}>
      <svg width={T.w} height={T.h} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: 26}).map((_, i) => (
          <circle key={i} cx={540} cy={960} r={330 + i * 26} fill="none" stroke={dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.16)'} strokeWidth={2} />
        ))}
        <circle cx={540} cy={960} r={330} fill={dark ? '#000' : '#fff'} />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: 960,
          left: 0,
          width: T.w,
          textAlign: 'center',
          transform: `translateY(-55%) scale(${1.35 - 0.35 * k})`,
          fontFamily: T.font.display,
          fontWeight: 700,
          fontSize: size,
          color: dark ? '#fff' : '#000',
          opacity: k,
          direction: 'rtl',
        }}
      >
        {w.w}
      </div>
    </AbsoluteFill>
  );
};

// ---------- photo cards hung on a string, camera pans to the newest card ----------
export type CardSpec = {num?: string; words: Word[]};

export const Cards: React.FC<{cards: CardSpec[]; t: number}> = ({cards, t}) => {
  const CW = 470;
  const GAP = 120;
  // card i becomes "current" when its first word is spoken
  let cur = 0;
  cards.forEach((c, i) => {
    if (c.words.length && t >= c.words[0].s - 0.3) cur = i;
  });
  const prevStart = cur > 0 ? cards[cur].words[0].s - 0.3 : 0;
  const pan = interpolate(t, [prevStart, prevStart + 0.7], [Math.max(cur - 1, 0), cur], {...clamp, easing: easeOut});
  // RTL: first card on the right, later cards to the left
  const camX = pan * (CW + GAP);
  return (
    <>
      <svg width={T.w} height={T.h} style={{position: 'absolute', inset: 0}}>
        <path d={`M -100 760 Q 540 ${820} 1180 760`} stroke="rgba(210,190,150,0.8)" strokeWidth={4} fill="none" />
      </svg>
      {cards.map((c, i) => {
        const s = c.words.length ? c.words[0].s - 0.35 : 0;
        const k = interpolate(t, [s, s + 0.6], [0, 1], {...clamp, easing: easeOut});
        const swing = interpolate(t, [s, s + 0.6, s + 1.2], [-14, 4, 0], clamp) + (i % 2 ? 4 : -4);
        const cx = 540 - i * (CW + GAP) + camX;
        if (t < s) return null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: cx - CW / 2,
              top: 800 - (1 - k) * 500,
              width: CW,
              height: 560,
              transformOrigin: '50% -40px',
              transform: `rotate(${swing}deg)`,
              opacity: k,
            }}
          >
            <div style={{position: 'absolute', left: CW / 2 - 18, top: -70, width: 36, height: 110, background: 'linear-gradient(90deg,#b8925a,#e5c896,#a8814a)', borderRadius: 6, zIndex: 2}} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: '#f7f6f2',
                boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
                padding: 34,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              {c.num && <div style={{fontFamily: T.font.sans, fontWeight: 700, fontSize: 170, color: '#1b1b1b', lineHeight: 1}}>{c.num}</div>}
              <div style={{direction: 'rtl', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 22}}>
                {c.words.map((wd, j) => {
                  const kk = interpolate(t, [wd.s - 0.06, wd.s + 0.28], [0, 1], {...clamp, easing: easeOut});
                  return (
                    <span key={j} style={{fontFamily: T.font.display, fontWeight: 700, fontSize: c.num ? 80 : 104, color: '#222', opacity: kk, filter: `blur(${(1 - kk) * 10}px)`, lineHeight: 1.35}}>
                      {wd.w}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

// ---------- end card ----------
export const Handle: React.FC<{t: number; text: string}> = ({t, text}) => {
  const k = interpolate(t, [0, 0.8], [0, 1], {...clamp, easing: easeOut});
  return (
    <div
      style={{
        position: 'absolute',
        top: 1050,
        width: T.w,
        textAlign: 'center',
        fontFamily: T.font.latin,
        fontSize: 64,
        backgroundImage: T.gold,
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        opacity: k,
        filter: `blur(${(1 - k) * 10}px)`,
        transform: `rotate(${(1 - k) * -4}deg)`,
      }}
    >
      {text}
    </div>
  );
};
