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

UI sounds (click, stamp and shutter rattle) are synthesised live with the Web
Audio API in `src/audio/AudioManager.ts`. The game uses no audio files or music.

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
