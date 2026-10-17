import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Background, Cards, Flare, Handle, Line, LineStyle, Orbits, Prop, PropSpec, Slam} from './kit';
import {loadFonts} from './fonts';
import {Word} from './theme';
import {Sheet, SheetSpec, Stroke} from './sheet';

export type LineSpec = {i0: number; i1: number; st: LineStyle; y: number; size?: number; rules?: boolean; show?: [number, number]};
export type SceneSpec = {
  s: number;
  e: number;
  bg: string;
  grid?: boolean;
  kind?: 'text' | 'slam' | 'cards' | 'end';
  lines?: LineSpec[];
  props?: PropSpec[];
  orbits?: boolean;
  flare?: {at: number; x: number; y: number};
  cards?: {num?: string; i0: number; i1: number}[];
  slam?: {i0: number; i1: number};
  handle?: string;
  push?: number; // slow camera push-in amount
  sheet?: SheetSpec;
};
export type ReelSpec = {id: string; audio: string; duration: number; words: Word[]; scenes: SceneSpec[]; strokes?: Stroke[]; tail?: number; preview?: boolean};

const Scene: React.FC<{sc: SceneSpec; words: Word[]; strokes: Stroke[]}> = ({sc, words, strokes}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lt = f / fps; // scene-local time
  const t = sc.s + lt; // reel time (word times are in reel time)
  const dur = sc.e - sc.s;
  const dark = sc.bg !== 'light';
  const rng = (a: number, b: number) => words.slice(a, b + 1);
  const push = 1 + (sc.push ?? 0.035) * (lt / Math.max(dur, 0.1));

  if (sc.kind === 'slam' && sc.slam) {
    return <Slam words={rng(sc.slam.i0, sc.slam.i1)} t={t} />;
  }

  const back = (sc.props ?? []).filter((p) => !p.front);
  const front = (sc.props ?? []).filter((p) => p.front);
  const relProp = (p: PropSpec) => ({...p, at: (p.at ?? sc.s) - sc.s});

  return (
    <AbsoluteFill>
      <Background kind={sc.bg} t={t} grid={sc.grid} />
      <AbsoluteFill style={{transform: `scale(${push})`}}>
        {sc.orbits && <Orbits t={t} dark={dark} />}
        {back.map((p, i) => (
          <Prop key={'b' + i} p={relProp(p)} t={lt} dur={dur} />
        ))}
        {sc.kind === 'cards' && sc.cards && <Cards t={t} cards={sc.cards.map((c) => ({num: c.num, words: rng(c.i0, c.i1)}))} />}
        {sc.sheet && <Sheet spec={sc.sheet} strokes={strokes} t={t} />}
        {(sc.lines ?? []).filter((l) => !l.show || (t >= l.show[0] && t < l.show[1])).map((l, i) => (
          <Line key={i} words={rng(l.i0, l.i1)} t={t} st={l.st} y={l.y} size={l.size} rules={l.rules} dark={dark} />
        ))}
        {front.map((p, i) => (
          <Prop key={'f' + i} p={relProp(p)} t={lt} dur={dur} />
        ))}
        {sc.flare && <Flare t={t} at={sc.flare.at} x={sc.flare.x} y={sc.flare.y} />}
        {sc.kind === 'end' && sc.handle && <Handle t={lt} text={sc.handle} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Reel: React.FC<{spec: ReelSpec}> = ({spec}) => {
  loadFonts();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {spec.preview && <Audio src={staticFile('audio/' + spec.audio)} />}
      {spec.scenes.map((sc, i) => {
        const from = Math.round(sc.s * fps);
        const to = Math.round(sc.e * fps);
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(to - from, 1)}>
            <Scene sc={sc} words={spec.words} strokes={spec.strokes ?? []} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
