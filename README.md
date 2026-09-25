# HO JAYEGA · हो जाएगा

> *"Sahi part nahi hai? Koi baat nahi."*
> A little repair shop. A lot of jugaad.

**HO JAYEGA** is a cosy browser game about running a tiny repair shop in a
narrow lane inspired by Old Bhopal. The neighbourhood brings you whatever has
stopped working: a table fan, a chutney mixer, a grandfather's radio, a leaking
water pump. You rarely have the right part, so you improvise with whatever is
lying on the bench: a rubber band, a bottle cap, a bent hanger, some cloth tape.

Made for **MP Game Udaan**, a 48-hour game jam run by the Game Developer
Association of India (GDAI) with the Government of Madhya Pradesh (MPSEDC).

---

## The theme: jugaad

*Jugaad* is the very Indian art of making things work with what you have. It's
clever, cheap and a little cheeky. The name says it all: **"ho jayega"**, the
reassuring "it'll get done" you hear in every repair shop in the country.

Every repair in the game is a small jugaad puzzle:

1. **Inspect** the machine. Switch it on, see what works and what doesn't.
2. **Think** about what it needs: something flexible and grippy? Something
   that carries current and reaches far?
3. **Pick a part** from the junk tray. Each one shows how strong, flexible,
   grippy, springy or conductive it is.
4. **Drag it onto the machine** and **test**. Stretch a rubber band between two
   pulleys, push a bottle cap into a broken switch, wind wire round a taped
   pipe.

There's no single "correct" recipe. The machine only cares whether your fix
makes physical sense. A spoon won't bend round a pulley, a wooden stick won't
catch a radio signal, and tape alone might hold... almost.

## The lane

- **The shop.** You've just reopened the old Ho Jayega repair shop, and Mama's
  diary of hard-won repair wisdom is your guide.
- **The neighbours.** Sharma Uncle and his beloved fan, Rukmini Aunty and her
  snack-shop mixer, Ayesha and her grandfather's radio, and Rafiq Bhai, whose
  chai stall can't run without water.
- **The street.** An animated low-poly market lane with hand-painted Hindi
  signboards, a chai & poha stall, a tailor, passers-by, an auto-rickshaw and
  the evening light turning warm as you close up.

## What's playable

- **Day 1: "First day. Let's see how it goes."** A guided day that teaches the
  loop: inspect, understand, pick, attach, test.
- **Day 2: "Word is getting around."** Read part properties, choose between
  look-alike options, and learn that the first fix doesn't have to be the
  last.
- **Two ways to play** from Day 2: *Tutorial mode* (Mama's diary walks you
  through it) or *Play it yourself* (just the problem, the parts and hints
  when you're stuck).
- You can't lose. Parts never run out, and a failed test just teaches you
  something. Progress saves in your browser, and finished days can be replayed.

## How we made it

Everything you see and hear is made in code: no downloaded models, textures or
sound files.

- **3D world:** [three.js](https://threejs.org/) through
  [React Three Fiber](https://r3f.docs.pmnd.rs/). The shop, the street, the
  customers and every machine are built from simple shapes. The signboards,
  paper and textures are painted onto HTML canvases at runtime.
- **Sound:** synthesised live with the Web Audio API, including the old-radio
  tune.
- **Repairs:** a small engine where every part has properties (strength,
  flexibility, grip, conductivity, springiness, rigidity, seal). Each machine
  judges a fix by what it physically needs, not by an exact answer.
- **UI and state:** React, TypeScript and zustand, built with Vite and tested
  with Vitest.
- **Type:** Baloo 2, Mukta and Kalam, which cover both English and Devanagari.

## Run it locally

Requires Node 20.19+ (or 22.12+).

```bash
npm install
npm run dev      # open the printed localhost URL
npm run build    # production build in dist/
```

## Credits

Made by [@jayeshrajani](https://github.com/jayeshrajani) for MP Game Udaan.

Fonts are used under the SIL Open Font License; see [`public/licenses/`](public/licenses/).
