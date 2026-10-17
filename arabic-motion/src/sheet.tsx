import React from 'react';
import {Easing, Img, interpolate, staticFile} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.45, 0, 0.25, 1);

export type Stroke = {at: number; dur: number; pts: [number, number][]; color: 'ink' | 'gold'; width?: number};
export type SheetSpec = {x: number; y: number; w: number; h: number; rot?: number; tearAt?: number; pen?: boolean; enterAt?: number};

const SW = 600; // sheet drawing space (viewBox)
const SH = 760;

// Catmull-Rom through the points, as cubic Béziers
const smoothPath = (p: [number, number][]) => {
  if (p.length < 2) return '';
  let d = `M ${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
  }
  return d;
};

const polyLen = (p: [number, number][]) => {
  const acc = [0];
  for (let i = 1; i < p.length; i++) acc.push(acc[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  return acc;
};

const tipAt = (p: [number, number][], k: number): [number, number] => {
  const acc = polyLen(p);
  const L = acc[acc.length - 1] * k;
  for (let i = 1; i < p.length; i++) {
    if (acc[i] >= L) {
      const u = (L - acc[i - 1]) / Math.max(acc[i] - acc[i - 1], 1e-6);
      return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * u, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * u];
    }
  }
  return p[p.length - 1];
};

// jagged tear line from top to bottom, roughly down the middle
const TEAR: [number, number][] = [
  [318, -10], [296, 60], [330, 128], [300, 190], [336, 262], [306, 330], [342, 398],
  [298, 470], [326, 540], [294, 610], [332, 680], [308, 770],
];
const leftPoly = `polygon(0% 0%, ${TEAR.map(([x, y]) => `${(x / SW) * 100}% ${(y / SH) * 100}%`).join(', ')}, 0% 100%)`;
const rightPoly = `polygon(100% 0%, ${TEAR.map(([x, y]) => `${(x / SW) * 100}% ${(y / SH) * 100}%`).join(', ')}, 100% 100%)`;

const Paper: React.FC<{t: number; strokes: Stroke[]; clip?: string}> = ({t, strokes, clip}) => (
  <div style={{position: 'absolute', inset: 0, clipPath: clip}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(160deg,#fbfaf6 0%,#f1eee6 60%,#e7e2d6 100%)',
        boxShadow: '0 40px 70px rgba(0,0,0,0.28), 0 6px 14px rgba(0,0,0,0.12)',
      }}
    />
    <svg viewBox={`0 0 ${SW} ${SH}`} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a6418" />
          <stop offset="0.45" stopColor="#e3c46f" />
          <stop offset="1" stopColor="#9c7424" />
        </linearGradient>
      </defs>
      {strokes.map((s, i) => {
        const k = interpolate(t, [s.at, s.at + s.dur], [0, 1], {...clamp, easing: ease});
        if (k <= 0) return null;
        const L = polyLen(s.pts).slice(-1)[0] * 1.25;
        return (
          <path
            key={i}
            d={smoothPath(s.pts)}
            fill="none"
            stroke={s.color === 'gold' ? 'url(#gold)' : '#1d1b18'}
            strokeWidth={s.width ?? 7}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={L}
            strokeDashoffset={L * (1 - k)}
          />
        );
      })}
    </svg>
  </div>
);

export const Sheet: React.FC<{spec: SheetSpec; strokes: Stroke[]; t: number}> = ({spec, strokes, t}) => {
  const enter = spec.enterAt ?? -99;
  const ek = interpolate(t, [enter, enter + 0.7], [0, 1], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const tear = spec.tearAt ?? 1e9;
  const tk = interpolate(t, [tear, tear + 0.9], [0, 1], {...clamp, easing: Easing.bezier(0.2, 0.8, 0.2, 1)});
  const torn = t >= tear;
  // active stroke → where the nib sits
  const active = strokes.filter((s) => t >= s.at - 0.25 && t <= s.at + s.dur + 0.25).slice(-1)[0];
  let nib: [number, number] | null = null;
  if (spec.pen && active && !torn) {
    const k = interpolate(t, [active.at, active.at + active.dur], [0, 1], {...clamp, easing: ease});
    nib = tipAt(active.pts, k);
  }
  const sx = spec.w / SW;
  const sy = spec.h / SH;
  const box: React.CSSProperties = {
    position: 'absolute',
    left: spec.x - spec.w / 2,
    top: spec.y - spec.h / 2 + (1 - ek) * 300,
    width: spec.w,
    height: spec.h,
    transform: `rotate(${spec.rot ?? -2}deg)`,
    opacity: ek,
  };
  return (
    <div style={box}>
      {!torn && <Paper t={t} strokes={strokes} />}
      {torn && (
        <>
          <div style={{position: 'absolute', inset: 0, transform: `translate(${-150 * tk}px, ${60 * tk}px) rotate(${-9 * tk}deg)`, transformOrigin: '0% 100%'}}>
            <Paper t={t} strokes={strokes} clip={leftPoly} />
          </div>
          <div style={{position: 'absolute', inset: 0, transform: `translate(${150 * tk}px, ${90 * tk}px) rotate(${11 * tk}deg)`, transformOrigin: '100% 100%'}}>
            <Paper t={t} strokes={strokes} clip={rightPoly} />
          </div>
        </>
      )}
      {nib && (
        <Img
          src={staticFile('props/nib.png')}
          style={{
            position: 'absolute',
            width: 230,
            // the nib tip sits at the bottom-left of the cut-out (≈ 13% x, 97% y of 991×1195)
            left: nib[0] * sx - 230 * 0.13,
            top: nib[1] * sy - 230 * (1195 / 991) * 0.97,
            filter: 'drop-shadow(-14px 22px 16px rgba(0,0,0,0.3))',
          }}
        />
      )}
    </div>
  );
};
