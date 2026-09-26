# Asset credits

## Visuals

All 3D content is made procedurally at runtime from three.js primitives and small
custom geometry. Signboards, paper, the calendar, the job sheet, plaster, the
shutter, asphalt and other surfaces are painted with Canvas2D in
`src/world/textures.ts`. The game uses **no photographs, 3D models, sprites or
downloaded artwork**.

Every shop, brand and sign in the lane is fictional. That includes Ho Jayega
Repair Works, Zaiqa Tea Stall, Naaz Tailors, Kiran General Store, Meetha Ghar,
the old-parts shop and Noor Battery House. The street is inspired by Old Bhopal
but is not a real location.

## Audio

All sounds are recordings from [Freesound](https://freesound.org), every one
released under **CC0 1.0 (public domain)**, so no attribution is legally
required. We credit the creators anyway. The files in `public/audio/` are
Freesound's MP3 previews; `src/audio/AudioManager.ts` trims them at play time
and re-pitches the motor for each machine. A tiny Web Audio synthesiser only
stands in for a sound until its file has loaded.

| File | Used for | Freesound sound | Creator |
| --- | --- | --- | --- |
| `street.mp3` | Lane ambience (loop) | [585570 — Indian Street traffic Ambience 2](https://freesound.org/s/585570/) | Athul_PR |
| `shutter.mp3` | Shop shutter | [394947 — Rolling shutter](https://freesound.org/s/394947/) | Areti18 |
| `click.mp3` | Buttons | [253168 — SFX UI Button Click](https://freesound.org/s/253168/) | suntemple |
| `stamp.mp3` | Name register stamp | [470710 — traditional stamp](https://freesound.org/s/470710/) | I.fekry |
| `pickup.mp3` | Picking up a part | [331719 — Belt Buckle](https://freesound.org/s/331719/) | IndigoRay |
| `attach.mp3` | Attaching a part | [399934 — Short Click/Snap Perc](https://freesound.org/s/399934/) | waveplaySFX |
| `success.mp3` | Repair works | [717771 — victory chime](https://freesound.org/s/717771/) | 1bob |
| `fail.mp3` | Repair fails | [419023 — acess denied buzz](https://freesound.org/s/419023/) | Jacco18 |
| `snap.mp3` | Snaps, jams and pops | [164472 — Crack of branch 3](https://freesound.org/s/164472/) | (account since deleted) |
| `static.mp3` | Radio and speaker static | [17804 — Static.wav](https://freesound.org/s/17804/) | Jace |
| `radio.mp3` | Old radio / band music | [423446 — An old radio playing in a Sri Lankan Sewing factory](https://freesound.org/s/423446/) | florianreichelt |
| `water.mp3` | Pumps and the cooler | [754321 — water_hose](https://freesound.org/s/754321/) | KenneysGarage |
| `motor.mp3` | Fans, mixer, pumps, sewing machine | [324666 — Refridgerator electric machine engine noise](https://freesound.org/s/324666/) | kentspublicdomain |
| `engine.mp3` | The Day 6 car engine | [200973 — Car Engine Start, Idle, and Revving](https://freesound.org/s/200973/) | NHumphrey |
| `car.mp3` | The Day 6 car arriving and leaving | [429405 — Car Arriving Idling And Pulling Away](https://freesound.org/s/429405/) | leonelmail |

## Fonts (bundled via Fontsource, SIL Open Font License 1.1)

| Font | Author | Licence file |
| --- | --- | --- |
| Baloo 2 | The Baloo 2 Project Authors / Ek Type | `public/licenses/Baloo2-OFL.txt` |
| Mukta | Girish Dalvi, Ek Type | `public/licenses/Mukta-OFL.txt` |
| Kalam | Indian Type Foundry | `public/licenses/Kalam-OFL.txt` |

The fonts are self-hosted in the build, so the game doesn't use a font CDN at
runtime.

## Code libraries (MIT)

- three.js
- React, React DOM
- React Three Fiber (Poimandres)
- Zustand (Poimandres)

Development only: Vite, TypeScript, Vitest, @vitejs/plugin-react.
