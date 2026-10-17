import React from 'react';
import {Composition} from 'remotion';
import {Reel, ReelSpec} from './Reel';
import {T} from './theme';
import {reels} from './reels';

export const Root: React.FC = () => (
  <>
    {reels.map((r: ReelSpec) => (
      <Composition
        key={r.id}
        id={r.id}
        component={Reel as any}
        durationInFrames={Math.round(r.duration * T.fps)}
        fps={T.fps}
        width={T.w}
        height={T.h}
        defaultProps={{spec: r}}
      />
    ))}
  </>
);
