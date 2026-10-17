import {continueRender, delayRender, staticFile} from 'remotion';

const FACES: [string, string, string][] = [
  ['Amiri', 'Amiri-Regular.ttf', '400'],
  ['Amiri', 'Amiri-Bold.ttf', '700'],
  ['Plex Arabic', 'IBMPlexSansArabic-Light.ttf', '300'],
  ['Plex Arabic', 'IBMPlexSansArabic-Medium.ttf', '500'],
  ['Plex Arabic', 'IBMPlexSansArabic-Bold.ttf', '700'],
  ['Playfair', 'PlayfairDisplay.ttf', '400 900'],
];

let started = false;
export const loadFonts = () => {
  if (started) return;
  started = true;
  const handle = delayRender('fonts');
  Promise.all(
    FACES.map(([family, file, weight]) => {
      const f = new FontFace(family, `url(${staticFile('fonts/' + file)})`, {weight});
      return f.load().then((l) => {
        (document as any).fonts.add(l);
      });
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error('FONT LOAD FAILED', e);
      continueRender(handle);
    });
};
