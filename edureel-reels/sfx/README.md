# SFX for the EduReel reels

`sfx.py kit` synthesises the effect kit (`kit/*.wav`): whoosh, swish, back, impact, thud, pop, tick, shimmer, riser, flash, tear, scroll, down, drone.
`sfx.py mix SPEC.json VIDEO.mp4 OUT.mp4` reads the reel's motion spec, puts a cue on every motion (scene in/out, every text/word pop-in, stamp, card slide, check, counter tick, tear, window glow/dim, phone flicks),
side-chain ducks the effects under the voice, and remuxes the video without re-encoding. The cue sheets used are in `cues/`.

To use library sounds (e.g. Envato), drop WAVs with the same names into `kit/` and run `mix` again.
