import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh } from 'three'
import type { ItemId } from '../../repair/types'
import { useKit } from '../../world/kit'
import { Ball, Box, Cyl, Ring } from '../../world/primitives'
import { useDayRun } from '../runner/store'
import { clamp01, type DayGeometry, ItemModel, testProgress } from '../scene/items'
import { Marking } from '../scene/labels'

export const RADIO_POINTS = {
  power: [-0.115, 0.065, -0.1],
  tuning: [-0.045, 0.065, -0.1],
  antennaMount: [-0.13, 0.25, -0.02],
} as const

export const PUMP_POINTS = {
  motor: [0.1, 0.155, -0.045],
  outlet: [-0.2, 0.24, -0.04],
  crack: [-0.07, 0.19, -0.045],
  clamp: [-0.07, 0.225, -0.05],
} as const

/** On to inspect (once switched on) and to test; off while the mechanic works. */
function poweredNow(switchTarget: string): boolean {
  const s = useDayRun.getState()
  const passShown = s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks')
  return (s.phase === 'inspecting' && s.seen.includes(switchTarget)) || s.phase === 'diagnosis' || s.phase === 'testing' || passShown
}

// ------------------------------------------------------------------ radio

/** Ayesha's grandfather's wooden valve radio. The dial faces the mechanic (-Z). */
export function RadioMachine({ geo }: { geo: DayGeometry }) {
  const kit = useKit()
  const dial = useRef<Mesh>(null)
  const led = useRef<Mesh>(null)
  const needle = useRef<Group>(null)
  const notes = useRef<(Group | null)[]>([])
  const antenna = useDayRun((s) => s.placements.antenna)
  const passShown = useDayRun((s) => s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks'))
  const glowOn = kit.mat('#f7e7b0', { emissive: '#ffc766', emissiveIntensity: 1.1 })
  const glowOff = kit.mat('#d9cfae')
  const ledOn = kit.mat('#ff5a3c', { emissive: '#ff3b1f', emissiveIntensity: 2 })
  const ledOff = kit.mat('#5a2a22')

  useFrame(() => {
    const s = useDayRun.getState()
    const now = performance.now()
    const tp = testProgress()
    const on = poweredNow('power')
    if (dial.current) dial.current.material = on ? glowOn : glowOff
    if (led.current) led.current.material = on ? ledOn : ledOff
    let sweep = 0
    if (s.phase === 'inspecting' && s.seen.includes('tuning')) sweep = Math.sin(now * 0.003) * 0.9
    if (tp !== null) sweep = s.outcome?.pass && tp > 0.55 ? 0.35 : Math.sin(tp * 18) * 0.9
    if (passShown) sweep = 0.35
    if (needle.current) needle.current.position.x = -0.08 + sweep * 0.04

    const music = passShown || (tp !== null && s.outcome?.pass === true && tp > 0.55)
    notes.current.forEach((n, i) => {
      if (!n) return
      n.visible = music
      if (!music) return
      const k = ((now / 1600 + i / 3) % 1)
      n.position.set(0.07 + Math.sin(k * 6 + i) * 0.03, 0.2 + k * 0.22, -0.08)
      n.scale.setScalar(Math.sin(k * Math.PI) * 1.1)
    })
  })

  return (
    <group>
      {[-0.14, 0.14].map((x) => (
        <Box key={x} p={[x, 0.006, 0]} s={[0.03, 0.012, 0.14]} c="#3a2618" />
      ))}
      <Box p={[0, 0.12, 0]} s={[0.34, 0.22, 0.16]} c="#7a4a2a" cast />
      <Box p={[0, 0.234, 0]} s={[0.35, 0.012, 0.165]} c="#8f5a33" />
      {/* Speaker cloth and grille. */}
      <Box p={[0.075, 0.12, -0.081]} s={[0.15, 0.15, 0.004]} c="#d9c9a3" />
      {[-0.045, -0.015, 0.015, 0.045].map((x) => (
        <Box key={x} p={[0.075 + x, 0.12, -0.085]} s={[0.006, 0.15, 0.004]} c="#5a3a22" />
      ))}
      {/* Dial window, needle and knobs. */}
      <mesh ref={dial} geometry={kit.geo.box} material={glowOff} position={[-0.08, 0.16, -0.082]} scale={[0.13, 0.05, 0.004]} />
      <group ref={needle} position={[-0.08, 0.16, -0.086]}>
        <Box s={[0.003, 0.045, 0.002]} c="#b3261e" />
      </group>
      <Cyl p={[-0.115, 0.065, -0.09]} r={[Math.PI / 2, 0, 0]} s={[0.036, 0.02, 0.036]} c="#2a1d14" />
      <Cyl p={[-0.045, 0.065, -0.09]} r={[Math.PI / 2, 0, 0]} s={[0.036, 0.02, 0.036]} c="#2a1d14" />
      <Marking text="ON/OFF" p={[-0.115, 0.034, -0.0815]} h={0.012} />
      <Marking text="TUNE" p={[-0.045, 0.034, -0.0815]} h={0.012} />
      <mesh ref={led} geometry={kit.geo.sphere} material={ledOff} position={[-0.145, 0.09, -0.083]} scale={0.009} />
      <Box p={[0.075, 0.215, -0.081]} s={[0.1, 0.012, 0.004]} c="#d5a23b" />
      {/* Antenna socket and its snapped stub. */}
      <Cyl p={[-0.13, 0.25, 0.03]} s={[0.02, 0.022, 0.02]} c="#b8bcc0" o={{ metal: 0.8, rough: 0.3 }} />
      {!antenna && !passShown && <Cyl p={[-0.128, 0.275, 0.03]} r={[0, 0, 0.3]} s={[0.006, 0.03, 0.006]} c="#9aa0a3" o={{ metal: 0.8 }} />}
      {(antenna || passShown) && <InstalledAntenna item={antenna ?? 'steelWire'} geo={geo} />}
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(g) => void (notes.current[i] = g)} visible={false}>
          <Ball s={[0.016, 0.012, 0.01]} c="#2a1f18" />
          <Box p={[0.007, 0.018, 0]} s={[0.002, 0.036, 0.002]} c="#2a1f18" />
        </group>
      ))}
    </group>
  )
}

function InstalledAntenna({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  const base: [number, number, number] = [-0.13, 0.26, 0.03]
  if (item === 'steelWire' || item === 'wire') {
    return <Cyl p={[base[0] + 0.03, base[1] + 0.2, base[2]]} r={[0, 0, 0.15]} s={[0.005, 0.42, 0.005]} c="#aeb4b8" o={{ metal: 0.8, rough: 0.3 }} cast />
  }
  if (item === 'woodenStick') {
    return <Box p={[base[0] + 0.02, base[1] + 0.13, base[2]]} r={[0, 0, 0.12]} s={[0.018, 0.27, 0.014]} c="#b98a55" cast />
  }
  if (item === 'rubberBand') {
    return <Ring p={[base[0], base[1] + 0.02, base[2]]} s={[0.07, 0.07, 0.12]} c="#c8844a" />
  }
  return (
    <group position={base} rotation={[0, 0, Math.PI / 2]}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

// ------------------------------------------------------------------ water pump

const DROPS = 6

/** Rafiq Bhai's little water pump. A cracked coupling on the outlet leaks all the pressure. */
export function PumpMachine({ geo }: { geo: DayGeometry }) {
  const kit = useKit()
  const rotor = useRef<Group>(null)
  const stream = useRef<Group>(null)
  const lever = useRef<Group>(null)
  const drops = useRef<(Mesh | null)[]>([])
  const spin = useRef(0)
  const seal = useDayRun((s) => s.placements.seal)
  const clamp = useDayRun((s) => s.placements.clamp)
  const passShown = useDayRun((s) => s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks'))
  const water = kit.mat('#8cc4df', { opacity: 0.75, rough: 0.1 })

  useFrame((_, delta) => {
    const s = useDayRun.getState()
    const now = performance.now()
    const tp = testProgress()
    const code = s.outcome?.code
    let running = false
    let flow = 0
    let leak: 'spray' | 'drip' | null = null

    if (tp !== null) {
      running = tp > 0.08
      if (code === 'sealed') flow = clamp01((tp - 0.12) / 0.2)
      else if (code === 'drip') {
        flow = 0.75
        leak = tp > 0.55 ? 'drip' : null
      } else {
        flow = 0.15
        leak = 'spray'
      }
    } else if (s.phase === 'thanks' && s.outcome?.pass) {
      running = true
      flow = 1
    } else if (s.phase === 'inspecting' && s.seen.includes('motor')) {
      running = true
      flow = 0.15
      leak = 'spray'
    }
    if (!running) flow = 0
    if (lever.current) lever.current.rotation.x = running ? -0.5 : 0.5

    spin.current += (running ? 30 : 0) * Math.min(delta, 0.05)
    if (rotor.current) rotor.current.rotation.z = spin.current
    if (stream.current) {
      stream.current.visible = flow > 0
      const w = 0.004 + flow * 0.01
      stream.current.scale.set(w, 1, w)
    }
    drops.current.forEach((d, i) => {
      if (!d) return
      d.visible = leak !== null
      if (!leak) return
      if (leak === 'spray') {
        const k = ((now / 450 + i / DROPS) % 1)
        const a = (i / DROPS) * Math.PI * 1.4 - 0.2
        d.position.set(-0.07 + Math.cos(a) * k * 0.12, 0.19 + Math.sin(a) * k * 0.08 - k * k * 0.12, -0.05 - k * 0.04)
      } else {
        const k = ((now / 900 + i / DROPS) % 1)
        d.visible = i < 2
        d.position.set(-0.07, 0.18 - k * 0.17, -0.05)
      }
    })
  })

  return (
    <group>
      <Box p={[0, 0.01, 0]} s={[0.32, 0.02, 0.18]} c="#3a4a55" cast />
      {/* Motor with cooling fins. */}
      <Cyl p={[0.07, 0.085, 0]} r={[0, 0, Math.PI / 2]} s={[0.11, 0.16, 0.11]} c="#2f6f8f" cast />
      {[-0.05, -0.02, 0.01, 0.04].map((x) => (
        <Cyl key={x} p={[0.07 + x, 0.085, 0]} r={[0, 0, Math.PI / 2]} s={[0.118, 0.008, 0.118]} c="#285f7a" />
      ))}
      <Box p={[0.1, 0.15, 0]} s={[0.05, 0.03, 0.06]} c="#1f1f1f" />
      <group ref={lever} position={[0.1, 0.165, -0.012]}>
        <Box p={[0, 0.011, 0]} s={[0.01, 0.022, 0.01]} c="#d5a23b" />
      </group>
      <Marking text="ON/OFF" p={[0.1, 0.15, -0.0315]} h={0.011} />
      {/* Pump head, visible impeller, inlet and outlet. */}
      <Cyl p={[-0.07, 0.085, 0]} r={[Math.PI / 2, 0, 0]} s={[0.12, 0.07, 0.12]} c="#9aa0a3" o={{ metal: 0.6, rough: 0.4 }} cast />
      <group ref={rotor} position={[-0.07, 0.085, -0.037]}>
        <Box s={[0.08, 0.012, 0.004]} c="#5d6468" />
        <Box r={[0, 0, Math.PI / 2]} s={[0.08, 0.012, 0.004]} c="#5d6468" />
      </group>
      <Cyl p={[-0.07, 0.085, -0.036]} r={[Math.PI / 2, 0, 0]} s={[0.1, 0.002, 0.1]} c="#cfe3ea" o={{ opacity: 0.35, rough: 0.1 }} />
      <Cyl p={[-0.07, 0.085, 0.08]} r={[Math.PI / 2, 0, 0]} s={[0.03, 0.1, 0.03]} c="#2b2b2b" />
      <Cyl p={[-0.07, 0.165, 0]} s={[0.028, 0.05, 0.028]} c="#9aa0a3" o={{ metal: 0.6 }} />
      {/* The cracked coupling. */}
      <Cyl p={[-0.07, 0.2, 0]} s={[0.046, 0.04, 0.046]} c="#7c8488" o={{ metal: 0.5, rough: 0.45 }} />
      <Box p={[-0.07, 0.2, -0.024]} r={[0, 0, 0.9]} s={[0.003, 0.035, 0.002]} c="#1b1b1b" />
      <Cyl p={[-0.07, 0.245, 0]} s={[0.028, 0.05, 0.028]} c="#9aa0a3" o={{ metal: 0.6 }} />
      <Ball p={[-0.07, 0.272, 0]} s={0.032} c="#9aa0a3" o={{ metal: 0.6 }} />
      <Cyl p={[-0.135, 0.272, 0]} r={[0, 0, Math.PI / 2]} s={[0.028, 0.13, 0.028]} c="#9aa0a3" o={{ metal: 0.6 }} />
      <Cyl p={[-0.2, 0.26, 0]} s={[0.032, 0.03, 0.032]} c="#7c8488" />
      {/* Bucket under the outlet. */}
      <Cyl p={[-0.2, 0.05, 0]} s={[0.1, 0.1, 0.1]} c="#b8bcc0" o={{ metal: 0.6, rough: 0.4 }} cast />
      <Cyl p={[-0.2, 0.095, 0]} s={[0.088, 0.004, 0.088]} c="#7fb8d8" o={{ rough: 0.1 }} />
      <group ref={stream} position={[-0.2, 0.17, 0]} visible={false}>
        <mesh geometry={kit.geo.cyl} material={water} scale={[1, 0.16, 1]} />
      </group>
      {Array.from({ length: DROPS }, (_, i) => (
        <mesh key={i} ref={(m) => void (drops.current[i] = m)} geometry={kit.geo.sphere} material={water} scale={0.008} visible={false} />
      ))}
      {(seal || passShown) && <Wrap item={seal ?? 'tape'} layer={0} geo={geo} />}
      {(clamp || passShown) && <Wrap item={clamp ?? 'wire'} layer={1} geo={geo} />}
    </group>
  )
}

const WRAP_COLOURS: Partial<Record<ItemId, string>> = {
  tape: '#e6d9b8',
  wire: '#c27a3a',
  steelWire: '#aeb4b8',
  rubberBand: '#c8844a',
}

/** Something wound round the coupling: tape underneath, a clamp on top. */
function Wrap({ item, layer, geo }: { item: ItemId; layer: 0 | 1; geo: DayGeometry }) {
  const kit = useKit()
  const colour = WRAP_COLOURS[item]
  if (item === 'tape') {
    return <Cyl p={[-0.07, 0.2, 0]} s={[0.054, 0.036, 0.054]} c={colour} o={{ rough: 0.95 }} />
  }
  if (!colour) {
    return (
      <group position={[-0.07, 0.2, -0.035 - layer * 0.01]} rotation={[-Math.PI / 2, 0, 0.4]}>
        <ItemModel id={item} geo={geo} />
      </group>
    )
  }
  const s = layer === 0 ? 1 : 1.12
  return (
    <mesh
      geometry={geo.wrap}
      material={kit.mat(colour, layer === 0 ? { rough: 0.9 } : { metal: 0.6, rough: 0.35 })}
      position={[-0.07, 0.185 - layer * 0.002, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[s, s, 1]}
    />
  )
}
