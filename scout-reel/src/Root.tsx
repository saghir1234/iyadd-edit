import React from 'react';
import {Composition} from 'remotion';
import {Reel, DURATION} from './Reel';
export const Root: React.FC = () => (
  <Composition id="Reel" component={Reel} durationInFrames={DURATION} fps={30} width={1080} height={1920} />
);
