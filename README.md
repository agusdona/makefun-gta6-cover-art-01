Vice Cover Lab — turn your photo and a caption into a neon-sunset GTA-style poster cover, offline in your browser.

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/agusdona/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/agusdona/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Cover Lab is a static web app that makes multi-panel poster covers in the style of GTA 6's posters: your photo fills three diagonal panels under a Vice City sunset or neon sky, with a big bold outlined caption, halftone dots and grain. It runs fully offline — no network, no uploads, no game logos, artwork or fonts.

## Run it

Serve the app and open it in a browser:

```sh
node serve.ts
# open http://localhost:8080
```

1. Upload your photo (or try a sample photo).
2. Type your caption and pick a size — Square 1080×1080, Portrait 1080×1350 or Wide 1920×1080.
3. Pick a colour grade — Sunset, Neon or Noir Gold.
4. Click a panel on the cover to crop and position that photo.
5. Export PNG and share it.

## Build the entry

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `app/` and `screenshots/` into `out/` and writes `out/dossier.json`.

Made for [make.fun](https://make.fun/bounty/gta6-cover-art-01).
