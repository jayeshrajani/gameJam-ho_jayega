import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh } from 'three'
import { ITEMS } from '../../repair/items'
import type { ItemId } from '../../repair/types'
import { useKit } from '../../world/kit'
import { Box, Cyl, Ring } from '../../world/primitives'
import { useDayRun } from '../runner/store'
import { clamp01, type DayGeometry, ItemModel, testProgress } from '../scene/items'
import { Marking } from '../scene/labels'

export const COOLER_POINTS = {
  power: [-0.1, 0.055, -0.125],
  fan: [-0.03, 0.26, -0.05],
  pump: [0.105, 0.105, -0.07],
  gap: [0.105, 0.2, -0.05],
  tie: [0.105, 0.168, -0.05],
  pads: [-0.13, 0.13, 0.06],
} as const

export const BIKE_POINTS = {
  wheel: [-0.19, 0.1, -0.06],
  crank: [-0.02, 0.1, -0.075],
  chainLink: [-0.1, 0.035, -0.06],
  pedal: [0.2, 0.025, -0.17],
  pinHole: [0.07, 0.1, -0.075],
  pinEnd: [0.07, 0.1, -0.115],
} as const

const passShownNow = () => {
  const s = useDayRun.getState()
  return s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks')
}

// ------------------------------------------------------------------ desert cooler

const DROPS = 7
const GAP_TOP = 0.165

/** Mishra Ji's desert cooler, open at the front: pump and pipe on the left, fan in front of the back pad. */
export function CoolerMachine({ geo }: { geo: DayGeometry }) {
  const kit = useKit()
  const rotor = useRef<Group>(null)
  const pump = useRef<Group>(null)
  const lever = useRef<Group>(null)
  const pad = useRef<Mesh>(null)
  const trayWater = useRef<Mesh>(null)
  const tube = useRef<Group>(null)
  const spill = useRef<(Mesh | null)[]>([])
  const drips = useRef<(Mesh | null)[]>([])
  const spin = useRef(0)
  const pipe = useDayRun((s) => s.placements.pipe)
  const tie = useDayRun((s) => s.placements.tie)
  const passShown = useDayRun((s) => s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks'))
  const water = kit.mat('#8cc4df', { opacity: 0.8, rough: 0.1 })
  const padDry = kit.mat('#dcbc7c', { rough: 0.95 })
  const padWet = kit.mat('#5a4528', { rough: 0.5 })

  useFrame((_, delta) => {
    const s = useDayRun.getState()
    const now = performance.now()
    const tp = testProgress()
    const code = s.outcome?.code
    const shown = passShownNow()
    const on = (s.phase === 'inspecting' && s.seen.includes('power')) || s.phase === 'diagnosis' || s.phase === 'testing' || shown
    let rising = false
    let trickle = false
    let popped = false
    if (tp !== null) {
      if (code === 'cool') rising = tp > 0.3
      else if (code === 'pops') {
        popped = tp > 0.66
        rising = tp > 0.3 && !popped
      } else if (code === 'trickle') trickle = tp > 0.3
    } else if (shown) rising = true
    const spilling = on && !rising && !trickle

    spin.current += (on ? 22 : 0) * Math.min(delta, 0.05)
    if (rotor.current) rotor.current.rotation.z = spin.current
    if (pump.current) pump.current.position.x = on ? Math.sin(now * 0.08) * 0.0012 : 0
    if (lever.current) lever.current.rotation.x = on ? -0.5 : 0.5
    if (pad.current) pad.current.material = rising && (tp === null || tp > 0.5) ? padWet : padDry
    if (trayWater.current) trayWater.current.visible = rising
    if (tube.current) {
      tube.current.rotation.z = popped ? Math.min(1.2, (tp! - 0.66) * 8) : 0
      tube.current.position.y = GAP_TOP - (popped ? Math.min(0.06, (tp! - 0.66) * 0.5) : 0)
    }
    spill.current.forEach((d, i) => {
      if (!d) return
      d.visible = spilling
      if (!spilling) return
      const k = (now / 500 + i / DROPS) % 1
      const a = (i / DROPS) * Math.PI * 2
      d.position.set(0.105 + Math.cos(a) * k * 0.035, GAP_TOP + Math.sin(k * Math.PI) * 0.02 - k * 0.07, -0.02 + Math.sin(a) * k * 0.025)
    })
    drips.current.forEach((d, i) => {
      if (!d) return
      d.visible = rising || (trickle && i === 0)
      if (!d.visible) return
      const k = (now / 900 + i / DROPS) % 1
      d.position.set(-0.13 + (i / DROPS) * 0.16, 0.355 - k * 0.25, 0.074)
    })
  })

  const body = '#e8e4da'
  const pipeCol = '#e9ecee'
  return (
    <group>
      {/* Tank with open water on top, and the power switch on its front. */}
      <Box p={[0, 0.045, 0]} s={[0.32, 0.09, 0.2]} c="#d8dcd8" cast />
      <Box p={[0, 0.091, 0]} s={[0.3, 0.003, 0.18]} c="#7fb8d8" o={{ rough: 0.1 }} />
      <Box p={[-0.1, 0.05, -0.106]} s={[0.05, 0.03, 0.012]} c="#1f1f1f" />
      <group ref={lever} position={[-0.1, 0.066, -0.106]}>
        <Box p={[0, 0.01, 0]} s={[0.01, 0.02, 0.01]} c="#d5a23b" />
      </group>
      <Marking text="ON/OFF" p={[-0.1, 0.047, -0.1125]} h={0.011} />
      {/* Frame, sides, lid and top water tray. */}
      {[0.154, -0.154].flatMap((x) =>
        [0.094, -0.094].map((z) => <Box key={`${x}${z}`} p={[x, 0.24, z]} s={[0.012, 0.3, 0.012]} c={body} />),
      )}
      <Box p={[-0.156, 0.24, 0]} s={[0.006, 0.3, 0.19]} c={body} />
      <Box p={[0.156, 0.24, 0]} s={[0.006, 0.3, 0.19]} c={body} />
      <Box p={[0, 0.39, 0]} s={[0.33, 0.02, 0.21]} c={body} cast />
      <Box p={[0, 0.366, 0.02]} s={[0.3, 0.012, 0.14]} c="#aeb6b2" />
      <mesh ref={trayWater} geometry={kit.geo.box} material={water} position={[0, 0.373, 0.02]} scale={[0.28, 0.003, 0.12]} visible={false} />
      {/* Back cooling pad (honeycomb) that the tray drips onto. */}
      <mesh ref={pad} geometry={kit.geo.box} material={padDry} position={[-0.05, 0.225, 0.088]} scale={[0.2, 0.25, 0.012]} />
      {[-0.08, -0.04, 0, 0.04, 0.08].map((y) => (
        <Box key={y} p={[-0.05, 0.225 + y, 0.081]} r={[0, 0, 0.35]} s={[0.21, 0.003, 0.002]} c="#a88a50" />
      ))}
      <Box p={[0.045, 0.225, 0.045]} s={[0.006, 0.27, 0.09]} c={body} />
      {/* Fan in front of the pad. */}
      <group ref={rotor} position={[-0.05, 0.225, 0.03]}>
        {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((a) => (
          <group key={a} rotation={[0, 0, a]}>
            <Box p={[0, 0.045, 0]} r={[0.3, 0, 0]} s={[0.045, 0.08, 0.004]} c="#4f7fa8" />
          </group>
        ))}
        <Cyl r={[Math.PI / 2, 0, 0]} s={[0.03, 0.02, 0.03]} c="#2d3a44" />
      </group>
      <Ring p={[-0.05, 0.225, 0.012]} s={[0.2, 0.2, 0.3]} c="#9aa3a8" o={{ metal: 0.6 }} />
      {[0, Math.PI / 3, (2 * Math.PI) / 3].map((a) => (
        <Box key={a} p={[-0.05, 0.225, 0.012]} r={[0, 0, a]} s={[0.2, 0.003, 0.003]} c="#9aa3a8" />
      ))}
      {/* Pump in the tank, with the broken pipe above it. */}
      <group ref={pump}>
        <Box p={[0.105, 0.105, -0.02]} s={[0.045, 0.04, 0.045]} c="#2b3a44" cast />
      </group>
      <Cyl p={[0.105, 0.145, -0.02]} s={[0.016, 0.04, 0.016]} c={pipeCol} />
      <Cyl p={[0.105, 0.3, -0.02]} s={[0.016, 0.12, 0.016]} c={pipeCol} />
      {!pipe && !passShown && (
        <group position={[0.13, 0.096, -0.07]} rotation={[0, 0.6, Math.PI / 2]}>
          <Cyl s={[0.022, 0.06, 0.022]} c="#2a2a2a" />
          <Box p={[0.012, 0, 0]} s={[0.003, 0.05, 0.02]} c="#7fb8d8" />
        </group>
      )}
      <group ref={tube} position={[0.105, GAP_TOP, -0.02]}>
        {(pipe || passShown) && <CoolerPipe item={pipe ?? 'innerTube'} geo={geo} />}
      </group>
      {(tie || passShown) && <CoolerTie item={tie ?? 'rubberBand'} geo={geo} />}
      {Array.from({ length: DROPS }, (_, i) => (
        <mesh key={`s${i}`} ref={(m) => void (spill.current[i] = m)} geometry={kit.geo.sphere} material={water} scale={0.007} visible={false} />
      ))}
      {Array.from({ length: DROPS }, (_, i) => (
        <mesh key={`d${i}`} ref={(m) => void (drips.current[i] = m)} geometry={kit.geo.sphere} material={water} scale={0.009} visible={false} />
      ))}
    </group>
  )
}

/** Whatever bridges the gap, drawn from the lower pipe end upwards. */
function CoolerPipe({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  if (item === 'innerTube') return <Cyl p={[0, 0.038, 0]} s={[0.026, 0.09, 0.026]} c="#2a2a2a" o={{ rough: 0.95 }} />
  if (item === 'penRefill') return <Cyl p={[0.004, 0.035, 0]} r={[0, 0, 0.12]} s={[0.007, 0.07, 0.007]} c="#dfe7ec" o={{ opacity: 0.8 }} />
  if (item === 'woodenStick') return <Box p={[0, 0.038, 0]} s={[0.018, 0.09, 0.012]} c="#b98a55" />
  return (
    <group position={[0, 0.035, -0.01]} rotation={[-Math.PI / 2, 0, 0]} scale={0.5}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

function CoolerTie({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  if (item === 'rubberBand' || item === 'wire' || item === 'steelWire') {
    const c = item === 'rubberBand' ? '#c8844a' : item === 'wire' ? '#c27a3a' : '#aeb4b8'
    return <Ring p={[0.105, 0.17, -0.02]} r={[Math.PI / 2, 0, 0]} s={[0.034, 0.034, 0.25]} c={c} />
  }
  return (
    <group position={[0.105, 0.17, -0.045]} rotation={[-Math.PI / 2, 0, 0]} scale={0.45}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

// ------------------------------------------------------------------ bicycle

const BB: [number, number] = [0, 0.1]
const CRANK = 0.07
const PEDAL_Z = -0.075
const LOAD_AT = 0.78
const LOOSE: [number, number, number] = [0.2, 0.012, -0.17]

const pinShaped = (id: ItemId) => {
  const tags = ITEMS[id].tags
  return tags.includes('PIN') || (tags.includes('RIGID') && tags.includes('LONG'))
}
const joinsChain = (id: ItemId) => ITEMS[id].tags.includes('CORD') && ITEMS[id].tags.includes('METAL')

const WIRE_COLOURS: Partial<Record<ItemId, string>> = { wire: '#c27a3a', steelWire: '#aeb4b8', rubberBand: '#c8844a' }

/** A red kid's cycle standing side-on, drive side towards the mechanic. */
export function BicycleMachine({ geo }: { geo: DayGeometry }) {
  const crank = useRef<Group>(null)
  const offCrank = useRef<Group>(null)
  const rearWheel = useRef<Group>(null)
  const pedal = useRef<Group>(null)
  const pinGroup = useRef<Group>(null)
  const chainWhole = useRef<Group>(null)
  const chainBroken = useRef<Group>(null)
  const angle = useRef(0)
  const wheelAngle = useRef(0)
  const pin = useDayRun((s) => s.placements.pin)
  const lock = useDayRun((s) => s.placements.lock)
  const link = useDayRun((s) => s.placements.link)
  const passShown = useDayRun((s) => s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks'))

  useFrame((_, delta) => {
    const s = useDayRun.getState()
    const dt = Math.min(delta, 0.05)
    const now = performance.now()
    const tp = testProgress()
    const code = s.outcome?.code
    const shown = passShownNow()
    const placedPin = s.placements.pin
    const placedLink = s.placements.link
    const fits = placedPin !== undefined && pinShaped(placedPin)
    const chainSnapped = code === 'link-snap' && tp !== null && tp >= LOAD_AT
    const chainOk = shown || (placedLink !== undefined && joinsChain(placedLink) && !chainSnapped)
    let speed = 0
    let attached = shown || ((tp !== null || s.phase === 'build') && fits)
    let fall = 0
    let slide = 0
    let wobble = 0
    let wheelSpin = false

    if (tp !== null && fits) {
      speed = tp < 0.15 ? 0 : tp < LOAD_AT ? 3 : 6
      if (code === 'snap' && tp >= LOAD_AT) {
        fall = clamp01((tp - LOAD_AT) / 0.12)
        speed = 6 * (1 - fall)
        attached = false
      } else if (code === 'wobble' && tp >= 0.35) {
        wobble = Math.sin(now * 0.05) * 0.4
        if (tp >= 0.5) {
          fall = clamp01((tp - 0.5) / 0.12)
          speed = 3 * (1 - fall)
          attached = false
        }
      } else if (code === 'slides' && tp >= 0.3) {
        slide = clamp01((tp - 0.3) / 0.15)
        if (slide >= 1) {
          fall = clamp01((tp - 0.45) / 0.12)
          attached = false
        }
      }
      wheelSpin = chainOk && speed > 0
    } else if (shown && s.phase === 'thanks') {
      speed = 3
      wheelSpin = true
    } else if (s.phase === 'inspecting' && now - s.stepAt < 1400) {
      const last = s.seen[s.seen.length - 1]
      if (last === 'crank') speed = 4
      if (last === 'wheel') wheelSpin = true
    }

    // Park the crank level at rest so the pin hole stays where the hotspot is.
    if (speed === 0 && tp === null) angle.current += (Math.round(angle.current / (Math.PI * 2)) * Math.PI * 2 - angle.current) * 0.2
    angle.current += speed * dt
    if (wheelSpin) wheelAngle.current += Math.max(speed, 4) * 1.8 * dt
    const a = angle.current
    if (crank.current) crank.current.rotation.z = a
    if (offCrank.current) offCrank.current.rotation.z = a + Math.PI
    if (rearWheel.current) rearWheel.current.rotation.z = wheelAngle.current
    if (chainWhole.current) chainWhole.current.visible = chainOk
    if (chainBroken.current) chainBroken.current.visible = !chainOk

    const end: [number, number, number] = [BB[0] + Math.cos(a) * CRANK, BB[1] + Math.sin(a) * CRANK, PEDAL_Z - slide * 0.05]
    if (pedal.current) {
      if (attached) {
        pedal.current.position.set(...end)
        pedal.current.rotation.set(wobble, 0, 0)
      } else if (fall > 0) {
        pedal.current.position.set(end[0], end[1] + (0.012 - end[1]) * fall, end[2] - 0.03 * fall)
        pedal.current.rotation.set(fall * 1.4, 0, fall * 0.8)
      } else {
        pedal.current.position.set(...LOOSE)
        pedal.current.rotation.set(0, 0.5, 0)
      }
    }
    if (pinGroup.current) pinGroup.current.scale.z = code === 'snap' && tp !== null && tp >= LOAD_AT ? 0.4 : 1
  })

  const red = '#c0392b'
  const metal = { metal: 0.8, rough: 0.3 }
  return (
    <group>
      {[-0.19, 0.19].map((x, i) => (
        <group key={x} position={[x, 0.1, 0]}>
          <Ring s={[0.2, 0.2, 0.5]} c="#1d1d1d" o={{ rough: 0.9 }} cast />
          <Ring s={[0.17, 0.17, 0.25]} c="#b9bec2" o={metal} />
          <group ref={i === 0 ? rearWheel : undefined}>
            {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((r) => (
              <Box key={r} r={[0, 0, r]} s={[0.17, 0.002, 0.002]} c="#c9ced1" />
            ))}
          </group>
          <Cyl r={[Math.PI / 2, 0, 0]} s={[0.018, 0.05, 0.018]} c="#7c8488" o={metal} />
        </group>
      ))}
      <Tube a={[0, 0.1]} b={[-0.19, 0.1]} c={red} />
      <Tube a={[-0.19, 0.1]} b={[-0.07, 0.26]} c={red} />
      <Tube a={[0, 0.1]} b={[-0.07, 0.26]} c={red} />
      <Tube a={[-0.07, 0.26]} b={[0.13, 0.26]} c={red} />
      <Tube a={[0, 0.1]} b={[0.145, 0.22]} c={red} />
      <Tube a={[0.13, 0.27]} b={[0.19, 0.1]} c={red} />
      <Tube a={[-0.07, 0.26]} b={[-0.08, 0.29]} c="#7c8488" />
      <Box p={[-0.085, 0.296, 0]} s={[0.075, 0.016, 0.038]} c="#1f1f1f" />
      <Tube a={[0.13, 0.27]} b={[0.115, 0.33]} c="#7c8488" />
      <Cyl p={[0.115, 0.33, 0]} r={[Math.PI / 2, 0, 0]} s={[0.012, 0.16, 0.012]} c="#7c8488" o={metal} />
      {[-0.07, 0.07].map((z) => (
        <Cyl key={z} p={[0.115, 0.33, z]} r={[Math.PI / 2, 0, 0]} s={[0.016, 0.04, 0.016]} c="#1f1f1f" />
      ))}
      <Tube a={[-0.04, 0.09]} b={[-0.07, 0.0]} c="#7c8488" w={0.008} z={0.03} />
      {/* Drive train. */}
      <Cyl p={[0, 0.1, -0.03]} r={[Math.PI / 2, 0, 0]} s={[0.09, 0.006, 0.09]} c="#8a9095" o={metal} />
      <Cyl p={[-0.19, 0.1, -0.03]} r={[Math.PI / 2, 0, 0]} s={[0.04, 0.006, 0.04]} c="#8a9095" o={metal} />
      <Tube a={[0, 0.145]} b={[-0.19, 0.12]} c="#3a3a3a" w={0.004} z={-0.03} />
      <group ref={chainWhole}>
        <Tube a={[0, 0.055]} b={[-0.19, 0.08]} c="#3a3a3a" w={0.004} z={-0.03} />
        {(link || passShown) && (
          <Ring p={[-0.1, 0.068, -0.034]} s={[0.014, 0.014, 0.4]} c={WIRE_COLOURS[link ?? 'steelWire'] ?? '#aeb4b8'} o={metal} />
        )}
      </group>
      {/* The snapped lower run droops from both ends. */}
      <group ref={chainBroken}>
        <Tube a={[0, 0.055]} b={[-0.08, 0.022]} c="#3a3a3a" w={0.004} z={-0.03} />
        <Tube a={[-0.19, 0.08]} b={[-0.12, 0.028]} c="#3a3a3a" w={0.004} z={-0.03} />
        {link && !joinsChain(link) && (
          <group position={[-0.1, 0.03, -0.045]} scale={0.4}>
            <ItemModel id={link} geo={geo} />
          </group>
        )}
      </group>
      <group ref={crank} position={[0, 0.1, -0.045]}>
        <Box p={[CRANK / 2, 0, 0]} s={[CRANK + 0.012, 0.014, 0.008]} c="#c9ced1" o={metal} />
        <Cyl p={[CRANK, 0, -0.004]} r={[Math.PI / 2, 0, 0]} s={[0.01, 0.004, 0.01]} c="#1b1b1b" />
        <group ref={pinGroup} position={[CRANK, 0, PEDAL_Z + 0.045 + 0.015]}>
          {(pin || passShown) && <PedalPin item={pin ?? 'bolt'} geo={geo} />}
        </group>
        {(lock || passShown) && <PinLock item={lock ?? 'wire'} geo={geo} />}
      </group>
      <group ref={offCrank} position={[0, 0.1, 0.045]}>
        <Box p={[CRANK / 2, 0, 0]} s={[CRANK + 0.012, 0.014, 0.008]} c="#c9ced1" o={metal} />
      </group>
      <group ref={pedal}>
        <Box s={[0.036, 0.012, 0.05]} c="#1f1f1f" cast />
        <Box p={[0.019, 0, 0]} s={[0.002, 0.008, 0.02]} c="#f2c14e" />
      </group>
    </group>
  )
}

/** A thin frame tube between two side-view points. */
function Tube({ a, b, c, w = 0.014, z = 0 }: { a: [number, number]; b: [number, number]; c: string; w?: number; z?: number }) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  return <Box p={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z]} r={[0, 0, Math.atan2(dy, dx)]} s={[Math.hypot(dx, dy), w, w]} c={c} />
}

/** The part pushed through the crank end, pointing out towards the mechanic. */
function PedalPin({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  if (item === 'bolt') return <Cyl p={[0, 0, -0.03]} r={[Math.PI / 2, 0, 0]} s={[0.011, 0.06, 0.011]} c="#b9bec2" o={{ metal: 0.85, rough: 0.3 }} />
  if (item === 'woodenStick') return <Box p={[0, 0, -0.03]} s={[0.011, 0.011, 0.06]} c="#b98a55" />
  if (item === 'penRefill') return <Cyl p={[0, 0, -0.03]} r={[Math.PI / 2, 0, 0]} s={[0.006, 0.06, 0.006]} c="#dfe7ec" o={{ opacity: 0.8 }} />
  return (
    <group position={[0, -0.03, -0.03]} rotation={[0, 0, 0.6]} scale={0.6}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

/** Whatever is wound round the outer end of the pin, in crank space. */
function PinLock({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  const colour = WIRE_COLOURS[item]
  if (colour) return <Ring p={[CRANK, 0, -0.07]} s={[0.016, 0.016, 0.5]} c={colour} o={{ metal: 0.6, rough: 0.35 }} />
  return (
    <group position={[CRANK, -0.012, -0.075]} scale={0.4}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}
