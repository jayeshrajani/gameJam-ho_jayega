import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh } from 'three'
import type { ItemId } from '../../repair/types'
import { useKit } from '../../world/kit'
import { Ball, Box, Coil, Cone, Cyl } from '../../world/primitives'
import { useDayRun } from '../runner/store'
import { type DayGeometry, ItemModel, testProgress } from '../scene/items'
import { Marking } from '../scene/labels'

const passShownNow = () => {
  const s = useDayRun.getState()
  return s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks')
}

const WIRE_COLOURS: Partial<Record<ItemId, string>> = { wire: '#c27a3a', steelWire: '#aeb4b8' }

/** A thin straight segment between two points in the XY plane at depth z. */
function Seg({ a, b, z, c, w = 0.004 }: { a: [number, number]; b: [number, number]; z: number; c: string; w?: number }) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  return <Box p={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z]} r={[0, 0, Math.atan2(dy, dx)]} s={[Math.hypot(dx, dy), w, w]} c={c} />
}

// ------------------------------------------------------------------ loudspeaker

export const SPEAKER_POINTS = {
  power: [0.155, 0.075, -0.08],
  volume: [0.1, 0.07, -0.08],
  mic: [0.15, 0.02, -0.15],
  speakerWire: [-0.07, 0.025, -0.06],
  terminal: [-0.1, 0.065, -0.06],
  cone: [-0.11, 0.17, -0.08],
} as const

/** Bunty's band amplifier (left) wired to a horn speaker on a stand (right). */
export function SpeakerMachine({ geo }: { geo: DayGeometry }) {
  const kit = useKit()
  const led = useRef<Mesh>(null)
  const needle = useRef<Group>(null)
  const knob = useRef<Group>(null)
  const horn = useRef<Group>(null)
  const notes = useRef<(Group | null)[]>([])
  const lead = useDayRun((s) => s.placements.lead)
  const screw = useDayRun((s) => s.placements.screw)
  const patch = useDayRun((s) => s.placements.patch)
  const passShown = useDayRun((s) => s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks'))
  const ledOn = kit.mat('#ff5a3c', { emissive: '#ff3b1f', emissiveIntensity: 2 })
  const ledOff = kit.mat('#5a2a22')

  useFrame(() => {
    const s = useDayRun.getState()
    const now = performance.now()
    const tp = testProgress()
    const shown = passShownNow()
    const on = (s.phase === 'inspecting' && s.seen.includes('power')) || s.phase === 'diagnosis' || s.phase === 'testing' || shown
    const recent = s.phase === 'inspecting' && now - s.stepAt < 1400 ? s.seen[s.seen.length - 1] : undefined
    const music = shown || (tp !== null && s.outcome?.pass === true && tp > 0.5)
    if (led.current) led.current.material = on ? ledOn : ledOff
    if (knob.current) knob.current.rotation.z = on && s.seen.includes('volume') ? -1.4 : 0
    if (needle.current) needle.current.rotation.z = on && (recent === 'mic' || music || tp !== null) ? Math.sin(now * 0.03) * 0.5 : 0.6
    if (horn.current) horn.current.scale.setScalar(music ? 1 + Math.abs(Math.sin(now * 0.02)) * 0.04 : 1)
    notes.current.forEach((n, i) => {
      if (!n) return
      n.visible = music
      if (!music) return
      const k = (now / 1500 + i / 3) % 1
      n.position.set(-0.12 + Math.sin(k * 6 + i) * 0.04, 0.2 + k * 0.2, -0.1)
      n.scale.setScalar(Math.sin(k * Math.PI) * 1.1)
    })
  })

  const amp = '#2e2e33'
  const brass = { metal: 0.7, rough: 0.35 }
  const leadColour = WIRE_COLOURS[lead ?? 'wire'] ?? '#c27a3a'
  return (
    <group>
      {/* Amplifier. */}
      <Box p={[0.1, 0.055, 0]} s={[0.15, 0.11, 0.12]} c={amp} cast />
      <Box p={[0.155, 0.075, -0.064]} s={[0.018, 0.012, 0.006]} c="#1a1a1a" />
      <mesh ref={led} geometry={kit.geo.sphere} material={ledOff} position={[0.155, 0.095, -0.062]} scale={0.008} />
      <Marking text="ON/OFF" p={[0.155, 0.056, -0.0612]} h={0.008} />
      <group ref={knob} position={[0.1, 0.07, -0.064]}>
        <Cyl r={[Math.PI / 2, 0, 0]} s={[0.026, 0.012, 0.026]} c="#c9ced1" o={brass} />
        <Box p={[0, 0.008, -0.007]} s={[0.003, 0.01, 0.002]} c="#1a1a1a" />
      </group>
      <Marking text="VOLUME" p={[0.1, 0.048, -0.0612]} h={0.008} />
      <Box p={[0.05, 0.08, -0.0612]} s={[0.045, 0.028, 0.002]} c="#efe6c8" />
      <group ref={needle} position={[0.05, 0.068, -0.063]}>
        <Box p={[0, 0.011, 0]} s={[0.0015, 0.022, 0.001]} c="#b3261e" />
      </group>
      {/* Microphone and its cable. */}
      <group position={[0.15, 0.012, -0.15]} rotation={[0, 0.6, Math.PI / 2]}>
        <Cyl s={[0.014, 0.06, 0.014]} c="#1f1f1f" />
        <Ball p={[0, 0.04, 0]} s={0.024} c="#8a9095" o={brass} />
      </group>
      <Seg a={[0.13, 0.006]} b={[0.06, 0.006]} z={-0.1} c="#1f1f1f" />
      {/* Horn speaker on a stand, with a junction box and terminal below it. */}
      <Cyl p={[-0.12, 0.06, 0.02]} s={[0.012, 0.12, 0.012]} c="#5d6468" />
      <Cyl p={[-0.12, 0.004, 0.02]} s={[0.07, 0.008, 0.07]} c="#3a3a3a" />
      <Box p={[-0.12, 0.065, -0.012]} s={[0.05, 0.035, 0.03]} c="#3a3a3a" />
      <Cyl p={[-0.1, 0.065, -0.03]} r={[Math.PI / 2, 0, 0]} s={[0.01, 0.008, 0.01]} c="#c9a13b" o={brass} />
      <group ref={horn} position={[-0.12, 0.17, 0.02]}>
        <Cone r={[Math.PI / 2, 0, 0]} s={[0.17, 0.14, 0.17]} c="#c9ced1" o={brass} cast />
        <Cyl p={[0, 0, 0.1]} r={[Math.PI / 2, 0, 0]} s={[0.06, 0.05, 0.06]} c="#2e2e33" />
        <Cyl p={[0, 0, -0.068]} r={[Math.PI / 2, 0, 0]} s={[0.14, 0.004, 0.14]} c="#3b3026" />
        {!patch && !passShown && <Box p={[0.015, 0.008, -0.071]} r={[0, 0, 0.6]} s={[0.05, 0.004, 0.002]} c="#d9c9a3" />}
        {(patch || passShown) && <ConePatch item={patch ?? 'tape'} geo={geo} />}
      </group>
      {/* Speaker wire: amp to terminal. Snapped short of the terminal until it's joined. */}
      <Seg a={[0.025, 0.012]} b={[-0.05, 0.006]} z={-0.04} c="#1f1f1f" w={0.006} />
      {lead || passShown ? (
        <>
          <Seg a={[-0.05, 0.006]} b={[-0.1, 0.065]} z={-0.04} c={leadColour} w={0.005} />
          {(screw || passShown) && (
            <Cyl p={[-0.1, 0.065, -0.038]} r={[Math.PI / 2, 0, 0]} s={[0.012, 0.014, 0.012]} c="#b9bec2" o={{ metal: 0.85, rough: 0.3 }} />
          )}
        </>
      ) : (
        <>
          <Seg a={[-0.05, 0.006]} b={[-0.065, 0.012]} z={-0.04} c="#1f1f1f" w={0.006} />
          <Seg a={[-0.065, 0.012]} b={[-0.072, 0.02]} z={-0.04} c="#c27a3a" w={0.002} />
        </>
      )}
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(g) => void (notes.current[i] = g)} visible={false}>
          <Ball s={[0.016, 0.012, 0.01]} c="#2a1f18" />
          <Box p={[0.007, 0.018, 0]} s={[0.002, 0.036, 0.002]} c="#2a1f18" />
        </group>
      ))}
    </group>
  )
}

function ConePatch({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  if (item === 'tape') return <Box p={[0.015, 0.008, -0.072]} r={[0, 0, 0.6]} s={[0.06, 0.022, 0.002]} c="#e6d9b8" />
  if (item === 'clothStrip') return <Box p={[0.015, 0.008, -0.072]} r={[0, 0, 0.6]} s={[0.06, 0.022, 0.003]} c="#c2455a" />
  return (
    <group position={[0.015, 0, -0.08]} rotation={[-Math.PI / 2, 0, 0]} scale={0.45}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

// ------------------------------------------------------------------ string lights

const BULBS = [
  { id: 'bulbA', x: 0.085, c: '#e84a4a' },
  { id: 'bulbB', x: 0.01, c: '#f2c14e' },
  { id: 'bulbHolder', x: -0.065, c: '#4caf50' },
  { id: 'bulbD', x: -0.14, c: '#3f7fd6' },
  { id: 'bulbE', x: -0.215, c: '#ff9a3c' },
] as const
const WIRE_Z = -0.03
const FRAY_X = 0.165

export const LIGHTS_POINTS = {
  plug: [0.235, 0.045, -0.07],
  bulbA: [0.085, 0.06, -0.065],
  bulbB: [0.01, 0.06, -0.065],
  bulbHolder: [-0.065, 0.06, -0.065],
  bulbD: [-0.14, 0.06, -0.065],
  fray: [FRAY_X, 0.03, -0.07],
  bareJoint: [FRAY_X, 0.03, -0.07],
} as const

/** Ayesha's mother's string of wedding lights, laid out along a board and plugged into an extension box. */
export function LightsMachine({ geo }: { geo: DayGeometry }) {
  const kit = useKit()
  const bulbs = useRef<(Mesh | null)[]>([])
  const bulbC = useRef<Group>(null)
  const spark = useRef<Mesh>(null)
  const splice = useDayRun((s) => s.placements.splice)
  const insulate = useDayRun((s) => s.placements.insulate)
  const contact = useDayRun((s) => s.placements.contact)
  const passShown = useDayRun((s) => s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks'))
  const lit = BULBS.map((b) => kit.mat(b.c, { emissive: b.c, emissiveIntensity: 1.8 }))
  const unlit = BULBS.map((b) => kit.mat(b.c, { opacity: 0.55, rough: 0.2 }))

  useFrame(() => {
    const s = useDayRun.getState()
    const now = performance.now()
    const tp = testProgress()
    const shown = passShownNow()
    const spliceOk = ['wire', 'steelWire'].includes(s.placements.splice ?? '')
    const insulated = ['tape', 'innerTube', 'rubberBand'].includes(s.placements.insulate ?? '')
    const contactOk = ['hairClip', 'safetyPin', 'wire'].includes(s.placements.contact ?? '')
    const live = tp !== null && tp > 0.3 && spliceOk
    const on = shown || (live && contactOk)
    bulbs.current.forEach((m, i) => {
      const matOn = lit[i]
      const matOff = unlit[i]
      if (m && matOn && matOff) m.material = on ? matOn : matOff
    })
    if (bulbC.current) bulbC.current.rotation.z = shown || s.placements.contact ? 0 : 0.5
    if (spark.current) spark.current.visible = live && !insulated && Math.sin(now * 0.05) > 0.3
  })

  return (
    <group>
      <Box p={[0, 0.008, 0]} s={[0.5, 0.016, 0.16]} c="#8a6443" recv cast />
      {/* Extension box with the plug in it. */}
      <Box p={[0.235, 0.03, 0.03]} s={[0.05, 0.028, 0.06]} c="#efece4" />
      <Box p={[0.235, 0.03, -0.012]} s={[0.03, 0.02, 0.025]} c="#f7f5ef" />
      {/* The wire, with a frayed gap near the plug. */}
      <Seg a={[0.235, 0.022]} b={[FRAY_X + 0.012, 0.022]} z={WIRE_Z} c="#1f5f2f" />
      <Seg a={[FRAY_X - 0.012, 0.022]} b={[-0.235, 0.022]} z={WIRE_Z} c="#1f5f2f" />
      {!splice && !passShown && (
        <>
          <Box p={[FRAY_X + 0.008, 0.024, WIRE_Z]} r={[0, 0, 0.5]} s={[0.012, 0.0015, 0.0015]} c="#c27a3a" />
          <Box p={[FRAY_X - 0.008, 0.02, WIRE_Z]} r={[0, 0, -0.4]} s={[0.012, 0.0015, 0.0015]} c="#c27a3a" />
        </>
      )}
      {(splice || passShown) && <Splice item={splice ?? 'wire'} geo={geo} />}
      {(insulate || passShown) && <JointCover item={insulate ?? 'tape'} geo={geo} />}
      <mesh ref={spark} geometry={kit.geo.sphere} material={kit.mat('#fff3a0', { emissive: '#ffd84a', emissiveIntensity: 3 })} position={[FRAY_X, 0.03, WIRE_Z - 0.01]} scale={0.02} visible={false} />
      {BULBS.map((b, i) => {
        const body = (
          <>
            <Cyl p={[0, 0.03, 0]} s={[0.014, 0.018, 0.014]} c="#2a2a2a" />
            <mesh ref={(m) => void (bulbs.current[i] = m)} geometry={kit.geo.sphere} material={unlit[i]} position={[0, 0.052, 0]} scale={[0.022, 0.03, 0.022]} />
          </>
        )
        return b.id === 'bulbHolder' ? (
          <group key={b.id} ref={bulbC} position={[b.x, 0, WIRE_Z]}>
            {body}
            {(contact || passShown) && <BulbContact item={contact ?? 'hairClip'} geo={geo} />}
          </group>
        ) : (
          <group key={b.id} position={[b.x, 0, WIRE_Z]}>
            {body}
          </group>
        )
      })}
    </group>
  )
}

function Splice({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  const colour = WIRE_COLOURS[item]
  if (colour) return <Coil p={[FRAY_X, 0.022, WIRE_Z]} r={[0, Math.PI / 2, 0]} s={[0.012, 0.012, 0.5]} c={colour} o={{ metal: 0.6, rough: 0.35 }} />
  return (
    <group position={[FRAY_X, 0.02, WIRE_Z - 0.02]} scale={0.4}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

function JointCover({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  const colour = item === 'tape' ? '#e6d9b8' : item === 'innerTube' ? '#2a2a2a' : item === 'rubberBand' ? '#c8844a' : undefined
  if (colour) return <Cyl p={[FRAY_X, 0.022, WIRE_Z]} r={[0, 0, Math.PI / 2]} s={[0.016, 0.04, 0.016]} c={colour} o={{ rough: 0.9 }} />
  return (
    <group position={[FRAY_X, 0.024, WIRE_Z - 0.025]} scale={0.4}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

function BulbContact({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  return (
    <group position={[0.012, 0.028, -0.012]} rotation={[0, 0, Math.PI / 2]} scale={0.35}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}
