import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { type Group, Sprite, SpriteMaterial } from 'three'
import { useGame } from '../app/state'
import { useAmbient } from './ambient'
import { PLINTH } from './architecture'
import { useKit } from './kit'
import { Ball, Box, Cyl, type V3 } from './primitives'
import { CHAI_ORIGIN, KETTLE_TOP } from './Street'
import { createLimbs, type Outfit, Person, RAFIQ } from './Person'

// ------------------------------------------------------------------ people

interface WalkerSpec {
  outfit: Outfit
  z: number
  dir: 1 | -1
  speed: number
  x0: number
  scale?: number
}

const NEAR_LANE = 1.9
const FAR_LANE = 5.5
const WRAP = 21
/** Near-lane walkers wait outside this band while the camera pushes in; those inside hurry out. */
const ENTRANCE_HOLD = 3.6
const HURRY = 2.4

const WALKERS: WalkerSpec[] = [
  {
    outfit: { kind: 'shirt', skin: '#8d5a3b', hair: '#1b1512', top: '#7fb3d5', bottom: '#5d6163', bag: '#e3d3b0', moustache: true },
    z: NEAR_LANE,
    dir: 1,
    speed: 1.15,
    x0: -6.5,
  },
  {
    outfit: { kind: 'saree', skin: '#a8704c', hair: '#15100d', top: '#e2762b', bottom: '#883D3B', accent: '#883D3B' },
    z: FAR_LANE,
    dir: -1,
    speed: 0.95,
    x0: 4.5,
  },
  {
    outfit: {
      kind: 'kurta',
      skin: '#7a4e35',
      hair: '#d8d4cc',
      top: '#f4f1e8',
      bottom: '#e9e4d6',
      accent: '#6b4e38',
      moustache: true,
    },
    z: NEAR_LANE + 0.25,
    dir: -1,
    speed: 0.7,
    x0: 11.5,
  },
  {
    outfit: { kind: 'salwar', skin: '#b98260', hair: '#1a120e', top: '#2a9d8f', bottom: '#f5e6c8', accent: '#e76f91' },
    z: FAR_LANE - 0.4,
    dir: 1,
    speed: 1.05,
    x0: -13,
  },
  {
    outfit: { kind: 'kid', skin: '#9a6445', hair: '#120d0a', top: '#ffffff', bottom: '#1f3a5f', accent: '#c0392b' },
    z: NEAR_LANE - 0.15,
    dir: 1,
    speed: 1.3,
    x0: -17,
    scale: 0.72,
  },
]

function Walker({ spec }: { spec: WalkerSpec }) {
  const root = useRef<Group>(null)
  const limbs = useMemo(createLimbs, [])
  const state = useRef({ x: spec.x0, phase: 0 })
  const clock = useAmbient()
  const nearLane = spec.z < 3

  useFrame(() => {
    const g = root.current
    if (!g) return
    const { dt } = clock.current
    const s = state.current
    if (dt > 0) {
      const entering = useGame.getState().screen === 'ENTERING_SHOP'
      const inBand = Math.abs(s.x) < ENTRANCE_HOLD
      const pace = entering && nearLane && inBand ? HURRY : 1
      const next = s.x + spec.dir * spec.speed * pace * dt
      const blocked = entering && nearLane && !inBand && Math.abs(next) < ENTRANCE_HOLD
      if (!blocked) {
        s.x = next
        s.phase += dt * spec.speed * pace * 5.2
      }
      if (s.x > WRAP) s.x = -WRAP
      if (s.x < -WRAP) s.x = WRAP
    }
    g.position.x = s.x
    const swing = Math.sin(s.phase)
    if (limbs.legL) limbs.legL.rotation.z = swing * 0.45
    if (limbs.legR) limbs.legR.rotation.z = -swing * 0.45
    if (limbs.armL) limbs.armL.rotation.z = -swing * 0.35
    if (limbs.armR) limbs.armR.rotation.z = swing * 0.35
    if (limbs.body) limbs.body.position.y = Math.abs(Math.cos(s.phase)) * 0.03
  })

  return (
    <group ref={root} position={[spec.x0, 0, spec.z]} rotation={[0, spec.dir > 0 ? 0 : Math.PI, 0]} scale={spec.scale ?? 1}>
      <Person o={spec.outfit} limbs={limbs} />
    </group>
  )
}

/** Stationary figures with small looping gestures. */
function ChaiVendor() {
  const limbs = useMemo(createLimbs, [])
  const root = useRef<Group>(null)
  const clock = useAmbient()
  useFrame(() => {
    if (root.current) root.current.visible = !useGame.getState().vendorAway
    const t = clock.current.t
    if (limbs.armR) {
      limbs.armR.rotation.z = 0.9 + Math.sin(t * 2.4) * 0.15
      limbs.armR.rotation.x = Math.cos(t * 2.4) * 0.15
    }
  })
  return (
    <group ref={root} position={[CHAI_ORIGIN[0] + 0.25, PLINTH, CHAI_ORIGIN[2] - 0.35]} rotation={[0, -Math.PI / 2, 0]}>
      <Person o={RAFIQ} limbs={limbs} />
    </group>
  )
}

function ChaiCustomer() {
  const limbs = useMemo(createLimbs, [])
  const clock = useAmbient()
  useFrame(() => {
    const cycle = (clock.current.t * 0.25) % 1
    const sip = cycle > 0.7 ? Math.sin(((cycle - 0.7) / 0.3) * Math.PI) : 0
    if (limbs.armL) limbs.armL.rotation.z = 0.5 + sip * 1.1
  })
  return (
    <group position={[CHAI_ORIGIN[0] - 0.55, PLINTH, CHAI_ORIGIN[2] + 1.3]} rotation={[0, Math.PI / 2, 0]}>
      <Person
        o={{ kind: 'shirt', skin: '#9c6848', hair: '#161210', top: '#e8b04a', bottom: '#3b4a5a', holding: '#b07a45' }}
        limbs={limbs}
      />
    </group>
  )
}

// ------------------------------------------------------------------ auto-rickshaw

const AUTO_LANE = 4.3
const AUTO_SPEED = 5.2
const AUTO_RANGE = 26
const AUTO_WAITS = [6, 9, 7.5, 11]

function AutoRickshaw() {
  const root = useRef<Group>(null)
  const wheels = useRef<(Group | null)[]>([])
  const state = useRef({ x: -8.5, wait: 0, trip: 0 })
  const clock = useAmbient()

  useFrame(() => {
    const g = root.current
    if (!g) return
    const { dt, t } = clock.current
    const s = state.current
    if (dt > 0) {
      if (s.wait > 0) {
        const entering = useGame.getState().screen === 'ENTERING_SHOP'
        if (!entering) s.wait -= dt
        if (s.wait <= 0) s.x = -AUTO_RANGE
      } else {
        s.x += AUTO_SPEED * dt
        for (const w of wheels.current) if (w) w.rotation.z -= (AUTO_SPEED * dt) / 0.22
        if (s.x > AUTO_RANGE) {
          s.wait = AUTO_WAITS[s.trip % AUTO_WAITS.length] ?? 8
          s.trip++
        }
      }
    }
    g.visible = s.wait <= 0
    g.position.x = s.x
    g.position.y = s.wait <= 0 && dt > 0 ? Math.abs(Math.sin(t * 13)) * 0.012 : 0
  })

  const green = '#2e7d4f'
  const yellow = '#f2c230'
  const black = '#1d1d1d'
  const wheel = (key: number, p: V3) => (
    <group key={key} position={p} ref={(g) => void (wheels.current[key] = g)}>
      <Cyl r={[Math.PI / 2, 0, 0]} s={[0.44, 0.14, 0.44]} c="#1a1a1a" cast />
      <Cyl r={[Math.PI / 2, 0, 0]} s={[0.2, 0.15, 0.2]} c="#b8bcc0" o={{ metal: 0.7 }} />
      <Box s={[0.3, 0.03, 0.155]} c="#8a8f93" />
    </group>
  )

  return (
    <group ref={root} position={[-8.5, 0, AUTO_LANE]}>
      <Box p={[0.2, 0.36, 0]} s={[2.2, 0.08, 1.2]} c="#1f3a2b" />
      <Box p={[-0.45, 0.64, 0]} s={[1.1, 0.52, 1.3]} c={green} cast />
      <Box p={[-0.45, 0.74, 0.652]} s={[1.1, 0.06, 0.01]} c={yellow} />
      <Box p={[-0.45, 0.74, -0.652]} s={[1.1, 0.06, 0.01]} c={yellow} />
      <Box p={[0.95, 0.76, 0]} s={[0.5, 0.78, 0.9]} c={green} cast />
      <Box p={[1.24, 0.56, 0]} s={[0.24, 0.5, 0.5]} c={green} />
      <Box p={[1.2, 1.1, 0]} s={[0.12, 0.1, 0.92]} c={yellow} />
      <Cyl p={[1.28, 0.98, 0]} r={[0, 0, Math.PI / 2]} s={[0.15, 0.06, 0.15]} c="#fff5cc" o={{ emissive: '#fff1b8', emissiveIntensity: 0.4 }} />
      <Box p={[0.95, 1.4, 0]} s={[0.035, 0.55, 0.88]} c="#cfe8ef" o={{ opacity: 0.35, rough: 0.1 }} />
      <Box p={[0, 1.75, 0]} s={[2.0, 0.08, 1.38]} c={yellow} cast />
      <Box p={[0, 1.69, 0.67]} s={[2.0, 0.12, 0.03]} c={black} />
      <Box p={[0, 1.69, -0.67]} s={[2.0, 0.12, 0.03]} c={black} />
      <Box p={[-0.98, 1.3, 0]} s={[0.08, 0.84, 1.34]} c={black} cast />
      {[
        [0.92, 0.44],
        [0.92, -0.44],
        [-0.92, 0.65],
        [-0.92, -0.65],
      ].map(([px, pz]) => (
        <Box key={`${px}${pz}`} p={[px as number, 1.33, pz as number]} s={[0.035, 0.78, 0.035]} c={black} />
      ))}
      <Box p={[-0.45, 0.95, 0]} s={[0.5, 0.12, 1.15]} c="#222" />
      <Box p={[-0.72, 1.2, 0]} s={[0.1, 0.42, 1.15]} c="#222" />
      <Box p={[0.45, 0.86, 0]} s={[0.35, 0.1, 0.42]} c="#222" />
      <Box p={[0.82, 1.14, 0]} s={[0.05, 0.05, 0.64]} c="#222" />
      <Box p={[1.15, 0.48, 0]} s={[0.46, 0.04, 0.2]} c={green} />
      <Box p={[-1.0, 0.55, 0]} s={[0.02, 0.14, 0.36]} c={yellow} />
      {/* Driver in khaki. */}
      <Box p={[0.45, 1.16, 0]} s={[0.22, 0.52, 0.36]} c="#b59b6a" />
      <Ball p={[0.47, 1.55, 0]} s={[0.21, 0.24, 0.2]} c="#7d5036" />
      <Ball p={[0.44, 1.6, 0]} s={[0.22, 0.18, 0.21]} c="#15100d" />
      <Box p={[0.66, 1.18, 0.2]} r={[0, 0, -1.1]} s={[0.07, 0.36, 0.07]} c="#b59b6a" />
      <Box p={[0.66, 1.18, -0.2]} r={[0, 0, -1.1]} s={[0.07, 0.36, 0.07]} c="#b59b6a" />
      <Box p={[0.62, 0.9, 0.09]} s={[0.36, 0.12, 0.12]} c="#a38a5c" />
      <Box p={[0.62, 0.9, -0.09]} s={[0.36, 0.12, 0.12]} c="#a38a5c" />
      {wheel(0, [1.15, 0.22, 0])}
      {wheel(1, [-0.55, 0.22, 0.62])}
      {wheel(2, [-0.55, 0.22, -0.62])}
    </group>
  )
}

// ------------------------------------------------------------------ steam

const PUFFS = 6

function Steam() {
  const kit = useKit()
  const clock = useAmbient()
  const sprites = useMemo(
    () =>
      Array.from({ length: PUFFS }, () => {
        const material = new SpriteMaterial({ map: kit.tex.puff, transparent: true, depthWrite: false, opacity: 0.3 })
        return new Sprite(material)
      }),
    [kit],
  )
  useEffect(() => () => sprites.forEach((s) => s.material.dispose()), [sprites])

  useFrame(() => {
    const t = clock.current.t
    sprites.forEach((s, i) => {
      const k = (t * 0.42 + i / PUFFS) % 1
      s.position.set(KETTLE_TOP[0] + Math.sin(k * 5 + i) * 0.05, KETTLE_TOP[1] + k * 0.75, KETTLE_TOP[2])
      const size = 0.12 + k * 0.38
      s.scale.set(size, size, 1)
      s.material.opacity = 0.38 * Math.sin(k * Math.PI)
    })
  })

  return (
    <>
      {sprites.map((s, i) => (
        <primitive key={i} object={s} />
      ))}
    </>
  )
}

export function StreetLife() {
  // On the wedding night the whole lane is at the pandal.
  const night = useGame((s) => s.timeOfDay === 'night')
  return (
    <group visible={!night}>
      {WALKERS.map((w) => (
        <Walker key={w.x0} spec={w} />
      ))}
      <ChaiVendor />
      <ChaiCustomer />
      <AutoRickshaw />
      <Steam />
    </group>
  )
}
