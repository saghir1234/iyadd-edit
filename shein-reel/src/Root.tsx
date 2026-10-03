import React from 'react';
import {Composition} from 'remotion';
import {Ad} from './Ad';
import CFG from './config.json';
import TL from './timeline.json';
import TLS from './timeline_short.json';

const [W, H] = CFG.canvas;
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="AppAd" component={Ad} durationInFrames={Math.round(TL.dur * CFG.fps)} fps={CFG.fps} width={W} height={H} defaultProps={{tl: TL, mix: 'mix.wav'}} />
    <Composition id="AppAdShort" component={Ad} durationInFrames={Math.round(TLS.dur * CFG.fps)} fps={CFG.fps} width={W} height={H} defaultProps={{tl: TLS, mix: 'mix_short.wav'}} />
  </>
);
