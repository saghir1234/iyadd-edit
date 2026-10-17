// Palette and type taken from the reference reel (light grey studio, warm dark, slate dark, gold accent).
export const T = {
  w: 1080,
  h: 1920,
  fps: 30,
  ink: '#151515',
  paper: '#F4F3F5',
  gold: 'linear-gradient(100deg,#7d5c17 0%,#c9a548 28%,#f0d98a 48%,#b48c32 70%,#7a5714 100%)',
  goldSolid: '#B8923A',
  goldSoft: '#9A7A33',
  bg: {
    light: 'radial-gradient(ellipse 75% 55% at 50% 42%,#f7f6f8 0%,#e3e2e6 45%,#b7b6bc 100%)',
    warm: 'radial-gradient(ellipse 80% 60% at 55% 30%,#5a3612 0%,#2a1707 45%,#0d0703 100%)',
    slate: 'radial-gradient(ellipse 85% 60% at 50% 10%,#5d6068 0%,#2c2e33 45%,#121316 100%)',
    black: 'radial-gradient(ellipse 80% 60% at 50% 45%,#1d1d1f 0%,#0b0b0c 70%,#000 100%)',
  } as Record<string, string>,
  font: {
    display: 'Amiri',
    sans: 'Plex Arabic',
    latin: 'Playfair',
  },
};

export type Word = {w: string; s: number; e: number};
