import {Config} from '@remotion/cli/config';
// PNG frames, not JPEG: JPEG intermediates dull the colours.
Config.setVideoImageFormat('png');
Config.setChromiumOpenGlRenderer('angle');
