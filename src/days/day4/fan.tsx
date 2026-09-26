import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh } from 'three'
import type { ItemId } from '../../repair/types'
import { useKit } from '../../world/kit'
import { Ball, Box, Coil, Cyl, Ring } from '../../world/primitives'
import { useDayRun } from '../runner/store'
import { clamp01, type DayGeometry, ItemModel, Spoon, testProgress } from '../scene/items'
import { Marking } from '../scene/labels'
import { ITEMS } from '../../repair/items'

export const FAN_POINTS = {
  fanSwitch: [0.07, 0.07, -0.115],
  motorPulley: [0, 0.2, -0.16],
  fanPulley: [0, 0.43, -0.16],
  beltGap: [0.05, 0.315, -0.16],
} as const

export const FAN_AGAIN_POINTS = {
  ...FAN_POINTS,
  neck: [-0.05, 0.34, -0.07],
  neckJoint: [-0.05, 0.34, -0.07],
  guard: [-0.2, 0.315, 0.12],
  guardClip: [-0.2, 0.315, 0.12],
} as const

const BELT_COLOURS: Partial<Record<ItemId, string>> = { rubberBand: '#c8844a', innerTube: '#2a2a2a', clothStrip: '#c2455a', wire: '#c27a3a' }

// ------------------------------------------------------------------ table fan

const FAN_SPIN = 16

/** Sharma Uncle's belt-drive table fan. Faces +Z, so its pulleys face the mechanic. `worn` adds Day 4's faults. */
export function TableFanMachine({ geo, worn = false }: { geo: DayGeometry; worn?: boolean }) {
  const kit = useKit()
  const motor = useRef<Group>(null)
  const shaft = useRef<Group>(null)
  const blades = useRef<Group>(null)
  const head = useRef<Group>(null)
  const guard = useRef<Group>(null)
  const belt = useRef<Mesh>(null)
  const spoon = useRef<Group>(null)
  const broken = useRef<Group>(null)
  const lever = useRef<Group>(null)
  const angles = useRef({ motor: 0, fan: 0 })
  const beltItem = useDayRun((s) => s.placements.drive)
  const neckItem = useDayRun((s) => s.placements.neck)
  const guardItem = useDayRun((s) => s.placements.guard)
  const passShown = useDayRun((s) => s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks'))

  useFrame((_, delta) => {
    const s = useDayRun.getState()
    const dt = Math.min(delta, 0.05)
    const pass = s.outcome?.pass === true
    const drive = s.placements.drive
    const tp = testProgress()
    // Switched on to inspect and to test; always off while the mechanic works on it.
    const on =
      (s.phase === 'inspecting' && s.seen.includes('fanSwitch')) ||
      s.phase === 'diagnosis' ||
      s.phase === 'testing' ||
      (pass && (s.phase === 'result' || s.phase === 'thanks'))
    if (lever.current) lever.current.rotation.x = on ? -0.5 : 0.5
    let motorSpeed = on ? FAN_SPIN : 0
    let fanSpeed = 0
    let spoonPop = 0
    if (tp !== null && s.outcome) {
      if (pass) fanSpeed = FAN_SPIN * 0.6 * clamp01((tp - 0.12) / 0.35)
      else if (s.outcome.code === 'jam') {
        if (tp > 0.15 && tp < 0.45) motorSpeed = FAN_SPIN * 0.15
        if (tp >= 0.45) spoonPop = clamp01((tp - 0.45) / 0.25)
      }
    } else if (pass && (s.phase === 'result' || s.phase === 'thanks')) {
      fanSpeed = FAN_SPIN * 0.6
    } else if (s.phase === 'result' && s.outcome?.code === 'jam') {
      spoonPop = 1
    }
    angles.current.motor -= motorSpeed * dt
    angles.current.fan -= fanSpeed * dt
    if (motor.current) {
      motor.current.rotation.z = angles.current.motor
      // A jammed motor shudders instead of spinning freely.
      motor.current.position.x = tp !== null && s.outcome?.code === 'jam' && tp > 0.15 && tp < 0.45 ? Math.sin(tp * 400) * 0.002 : 0
    }
    if (shaft.current) shaft.current.rotation.z = angles.current.fan
    if (blades.current) blades.current.rotation.z = angles.current.fan
    const shownPass = pass && (s.phase === 'result' || s.phase === 'thanks')
    if (head.current) head.current.rotation.x = worn && !s.placements.neck && !shownPass ? 0.22 : 0
    if (guard.current) {
      const loose = worn && !s.placements.guard && !shownPass
      guard.current.rotation.z = loose ? 0.12 + (on ? Math.sin(performance.now() * 0.09) * 0.03 : 0) : 0
    }
    const beltOn = (drive !== undefined && ITEMS[drive].props.flexibility >= 4) || shownPass
    if (belt.current) belt.current.visible = beltOn
    if (broken.current) broken.current.visible = !beltOn
    if (spoon.current) {
      spoon.current.visible = drive === 'spoon'
      const k = spoonPop
      spoon.current.position.set(0.02 + k * 0.14, 0.315 + Math.sin(k * Math.PI) * 0.18 - k * 0.3, -0.165 - k * 0.06)
      spoon.current.rotation.set(0, 0, 1.35 + k * 5)
    }
  })

  const body = '#3d5a58'
  const metal = { metal: 0.7, rough: 0.35 }
  return (
    <group>
      <Cyl p={[0, 0.025, 0]} s={[0.28, 0.05, 0.24]} c={body} cast />
      {/* ON/OFF switch on the back of the base, facing the mechanic. */}
      <Box p={[0.07, 0.062, -0.095]} s={[0.05, 0.024, 0.03]} c="#1e1e1e" />
      <group ref={lever} position={[0.07, 0.074, -0.095]}>
        <Box p={[0, 0.01, 0]} s={[0.01, 0.022, 0.01]} c="#d5a23b" />
      </group>
      <Marking text="ON/OFF" p={[0.07, 0.036, -0.122]} h={0.012} />
      <Cyl p={[0, 0.13, 0]} s={[0.045, 0.16, 0.045]} c={body} />
      <Cyl p={[0, 0.2, -0.04]} r={[Math.PI / 2, 0, 0]} s={[0.1, 0.16, 0.1]} c="#46625f" cast />
      <Box p={[0, 0.315, -0.03]} s={[0.035, 0.2, 0.035]} c={body} />
      <group ref={motor} position={[0, 0.2, -0.135]}>
        <Cyl r={[Math.PI / 2, 0, 0]} s={[0.068, 0.018, 0.068]} c="#b8892f" o={metal} />
        <Box p={[0, 0, -0.011]} s={[0.05, 0.008, 0.003]} c="#2b2019" />
      </group>
      <group ref={shaft} position={[0, 0.43, 0]}>
        <group position={[0, 0, -0.135]}>
          <Cyl r={[Math.PI / 2, 0, 0]} s={[0.116, 0.018, 0.116]} c="#b8892f" o={metal} />
          <Box p={[0, 0, -0.011]} s={[0.09, 0.01, 0.003]} c="#2b2019" />
          <Cyl r={[Math.PI / 2, 0, 0]} s={[0.07, 0.022, 0.07]} c="#8a6a2a" o={metal} />
        </group>
      </group>
      {/* The head tilts on its neck; the pulley stays put so the belt still lines up. */}
      <group ref={head} position={[0, 0.43, -0.02]}>
        <Ball s={[0.13, 0.13, 0.17]} c="#46625f" cast />
        <group ref={blades} position={[0, 0, 0.12]}>
          {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((a) => (
            <group key={a} rotation={[0, 0, a]}>
              <Box p={[0, 0.1, 0]} r={[0.25, 0, 0]} s={[0.085, 0.16, 0.006]} c="#7fb3c8" cast />
            </group>
          ))}
          <Cyl r={[Math.PI / 2, 0, 0]} s={[0.05, 0.03, 0.05]} c="#46625f" />
        </group>
        <Ring p={[0, 0, 0.08]} s={[0.46, 0.46, 0.6]} c="#a8b0b2" o={metal} />
        <group ref={guard} position={[0, 0, 0.165]}>
          <Ring s={[0.46, 0.46, 0.6]} c="#a8b0b2" o={metal} />
          {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((a) => (
            <Box key={a} r={[0, 0, a]} s={[0.46, 0.004, 0.004]} c="#a8b0b2" />
          ))}
          {worn && (guardItem || passShown) && <FanClip item={guardItem ?? 'wire'} geo={geo} />}
        </group>
      </group>
      {worn && (neckItem || passShown) && <NeckPin item={neckItem ?? 'bolt'} geo={geo} />}
      <mesh
        ref={belt}
        geometry={geo.belt}
        material={kit.mat(BELT_COLOURS[beltItem ?? 'rubberBand'] ?? '#c8844a', { rough: 0.85 })}
        position={[0, 0, -0.145]}
        visible={false}
        castShadow
      />
      <group ref={broken}>
        <Box p={[0.045, 0.25, -0.145]} r={[0, 0, 0.5]} s={[0.006, 0.07, 0.012]} c="#2b2622" />
        <Box p={[-0.05, 0.37, -0.145]} r={[0, 0, -0.35]} s={[0.006, 0.06, 0.012]} c="#2b2622" />
      </group>
      <group ref={spoon} visible={false}>
        <Spoon />
      </group>
      <Cyl p={[0.03, 0.008, -0.2]} r={[Math.PI / 2, 0, 0.3]} s={[0.012, 0.18, 0.012]} c="#1f1f1f" />
    </group>
  )
}

export function FanAgainMachine({ geo }: { geo: DayGeometry }) {
  return <TableFanMachine geo={geo} worn />
}

/** Whatever holds the neck joint, pushed through sideways. */
function NeckPin({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  if (item === 'bolt') return <Cyl p={[0, 0.34, -0.03]} r={[0, 0, Math.PI / 2]} s={[0.012, 0.08, 0.012]} c="#b9bec2" o={{ metal: 0.85, rough: 0.3 }} />
  if (item === 'woodenStick') return <Box p={[0, 0.34, -0.03]} s={[0.09, 0.011, 0.011]} c="#b98a55" />
  return (
    <group position={[-0.04, 0.33, -0.06]} scale={0.5}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

/** Whatever ties the guard at the side of its rim (in view of the bench camera), in guard space. */
function FanClip({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  if (item === 'wire') return <Coil p={[-0.2, -0.115, 0]} r={[Math.PI / 2, 0, 1.05]} s={[0.032, 0.032, 0.5]} c="#c27a3a" o={{ metal: 0.6, rough: 0.35 }} />
  return (
    <group position={[-0.2, -0.115, -0.01]} rotation={[-Math.PI / 2, 0, 0]} scale={0.5}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}
