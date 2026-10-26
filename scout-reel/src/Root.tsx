import React from 'react';
import {Composition} from 'remotion';
import {Reel, DURATION} from './Reel';
import {Survival, SURVIVAL_DURATION} from './Survival';
export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={DURATION} fps={30} width={1080} height={1920} />
    <Composition id="Survival" component={Survival} durationInFrames={SURVIVAL_DURATION} fps={30} width={1080} height={1920} />
  </>
);
