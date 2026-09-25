import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh } from 'three'
import { selectReducedMotion, useGame } from '../../app/state'
import type { ItemId } from '../../repair/types'
import { useKit } from '../../world/kit'
import { Ball, Box, Cone, Cyl, Ring } from '../../world/primitives'
import { useDayRun } from '../runner/store'
import { BottleCap, clamp01, type DayGeometry, ItemModel, Spoon, testProgress } from '../scene/items'
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
  guard: [0, 0.665, 0.1],
  guardClip: [0, 0.665, 0.1],
} as const

const BELT_COLOURS: Partial<Record<ItemId, string>> = { rubberBand: '#c8844a', innerTube: '#2a2a2a', clothStrip: '#c2455a', wire: '#c27a3a' }

export const MIXER_POINTS = {
  motor: [0.083, 0.043, -0.11],
  button: [0, 0.175, -0.112],
  contact: [0, 0.085, -0.09],
} as const

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

/** Whatever ties the guard at the top of its rim, in guard space. */
function FanClip({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  if (item === 'wire') return <Ring p={[0, 0.23, 0]} r={[0, Math.PI / 2, 0]} s={[0.03, 0.03, 0.4]} c="#c27a3a" o={{ metal: 0.6, rough: 0.35 }} />
  return (
    <group position={[0, 0.23, -0.01]} rotation={[-Math.PI / 2, 0, 0]} scale={0.5}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

// ------------------------------------------------------------------ mixer

/** Rukmini Aunty's mixer. Faces the mechanic (-Z); the switch panel comes off during inspection. */
export function MixerMachine({ geo }: { geo: DayGeometry }) {
  const body = useRef<Group>(null)
  const chutney = useRef<Group>(null)
  const panel = useRef<Group>(null)
  const button = useRef<Group>(null)
  const pusherItem = useRef<Group>(null)
  const returnItem = useRef<Group>(null)
  const spin = useRef(0)

  useFrame((_, delta) => {
    const s = useDayRun.getState()
    const dt = Math.min(delta, 0.05)
    const now = performance.now()
    const tp = testProgress()
    const code = s.outcome?.code
    let pressed = false
    let running = false

    if (tp !== null) {
      pressed = tp >= 0.18 && (tp < 0.6 || code === 'no-return')
      if (code === 'switch') running = tp >= 0.2 && tp < 0.62
      else if (code === 'bridge') running = tp >= 0.08
      else if (code === 'no-return') running = tp >= 0.2
    } else if (s.phase === 'thanks' && s.outcome?.pass) {
      const cycle = ((now - s.phaseAt) / 2400) % 1
      pressed = cycle < 0.5
      running = cycle > 0.04 && cycle < 0.52
    } else if (s.phase === 'inspecting') {
      const since = (now - s.stepAt) / 1000
      const last = s.seen[s.seen.length - 1]
      if (last === 'motor') running = since < 0.9
      if (last === 'button') pressed = since < 0.5
    }

    spin.current += (running ? 24 : 0) * dt
    if (chutney.current) chutney.current.rotation.y = spin.current
    if (body.current) {
      const shake = running && !selectReducedMotion(useGame.getState()) ? 0.0025 : 0
      body.current.position.set(Math.sin(now * 0.09) * shake, Math.abs(Math.sin(now * 0.13)) * shake, 0)
    }
    const panelOff =
      (s.phase === 'inspecting' && s.seen.includes('contact')) ||
      ['diagnosis', 'build', 'testing', 'result'].includes(s.phase)
    if (panel.current) {
      panel.current.position.set(panelOff ? 0.19 : 0, panelOff ? 0.005 : 0.1, panelOff ? -0.06 : -0.104)
      panel.current.rotation.set(panelOff ? -Math.PI / 2 : 0, 0, panelOff ? 0.35 : 0)
    }
    const depth = pressed ? 0.008 : 0
    if (button.current) button.current.position.z = -0.107 + depth
    if (pusherItem.current) pusherItem.current.position.z = depth
    if (returnItem.current) returnItem.current.scale.z = pressed && s.placements.return === 'spring' ? 0.55 : 1
  })

  const pusher = useDayRun((s) => s.placements.pusher)
  const back = useDayRun((s) => s.placements.return)
  const passShown = useDayRun((s) => s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks'))

  const shell = '#efece4'
  return (
    <group ref={body}>
      <Box p={[0, 0.008, 0]} s={[0.23, 0.016, 0.23]} c="#d9d4c7" cast />
      <Box p={[0, 0.11, 0]} s={[0.2, 0.19, 0.2]} c={shell} cast />
      <Box p={[0, 0.1, -0.101]} s={[0.12, 0.12, 0.004]} c="#2a2420" />
      <Box p={[-0.022, 0.09, -0.104]} s={[0.012, 0.05, 0.004]} c="#c27a3a" o={{ metal: 0.7, rough: 0.35 }} />
      <Box p={[0.022, 0.09, -0.104]} s={[0.012, 0.05, 0.004]} c="#c27a3a" o={{ metal: 0.7, rough: 0.35 }} />
      <Box p={[0.006, 0.128, -0.105]} r={[0, 0, 0.5]} s={[0.022, 0.012, 0.006]} c="#d8d2c2" />
      <group ref={panel}>
        <Box s={[0.13, 0.13, 0.008]} c="#dcd6c8" cast />
        <Box p={[0.05, 0.05, -0.005]} s={[0.012, 0.012, 0.004]} c="#8a8a8a" />
        <Box p={[-0.05, -0.05, -0.005]} s={[0.012, 0.012, 0.004]} c="#8a8a8a" />
        <Marking text="SWITCH" p={[0, 0, -0.0045]} h={0.013} dark />
      </group>
      <group ref={button} position={[0, 0.175, -0.107]}>
        <Cyl r={[Math.PI / 2, 0, 0]} s={[0.035, 0.012, 0.035]} c="#c0392b" />
      </group>
      <Marking text="START" p={[-0.05, 0.175, -0.1015]} h={0.013} dark />
      {/* Motor test terminals, to the side of the switch panel. */}
      {[0.052, 0.034].map((y) => (
        <Cyl key={y} p={[0.083, y, -0.102]} r={[Math.PI / 2, 0, 0]} s={[0.012, 0.006, 0.012]} c="#b8892f" o={{ metal: 0.7, rough: 0.35 }} />
      ))}
      <Marking text="MOTOR" p={[0.083, 0.022, -0.1015]} h={0.009} dark />
      {/* Jar with chutney. */}
      <Cyl p={[0, 0.215, 0]} s={[0.16, 0.03, 0.16]} c="#2b2b2b" />
      <Cyl p={[0, 0.33, 0]} s={[0.15, 0.2, 0.15]} c="#dbe7ea" o={{ opacity: 0.4, rough: 0.15 }} />
      <group ref={chutney} position={[0, 0.27, 0]}>
        <Cyl s={[0.13, 0.08, 0.13]} c="#4e8a3a" />
        <Box p={[0.03, 0.041, 0]} s={[0.05, 0.004, 0.015]} c="#8fc46a" />
      </group>
      <Cyl p={[0, 0.44, 0]} s={[0.16, 0.025, 0.16]} c="#222" />
      <Cone p={[0, 0.465, 0]} s={[0.05, 0.03, 0.05]} c="#222" />

      <group ref={pusherItem}>
        {pusher && <Installed item={pusher} slot="pusher" geo={geo} />}
      </group>
      <group ref={returnItem} position={[0, 0.085, -0.1]}>
        {back && <Installed item={back} slot="return" geo={geo} />}
      </group>
      {passShown && !pusher && <Installed item="bottleCap" slot="pusher" geo={geo} />}
    </group>
  )
}

/** An item fitted into a mixer joint. */
function Installed({ item, slot, geo }: { item: ItemId; slot: 'pusher' | 'return'; geo: DayGeometry }) {
  const kit = useKit()
  if (slot === 'pusher') {
    const p: [number, number, number] = [0, 0.175, -0.118]
    if (item === 'bottleCap') {
      return (
        <group position={p} rotation={[-Math.PI / 2, 0, 0]}>
          <BottleCap />
        </group>
      )
    }
    if (item === 'spring') return <mesh geometry={geo.spring} material={kit.mat('#c9ced1', { metal: 0.8, rough: 0.3 })} position={[0, 0.175, -0.145]} />
    if (item === 'wire') return <mesh geometry={geo.bridge} material={kit.mat('#c27a3a', { metal: 0.6, rough: 0.35 })} position={[0, 0.07, 0]} />
    return <group position={p} rotation={[Math.PI / 2, 0, 0]}><ItemModel id={item} geo={geo} /></group>
  }
  if (item === 'spring') return <mesh geometry={geo.spring} material={kit.mat('#c9ced1', { metal: 0.8, rough: 0.3 })} rotation={[Math.PI, 0, 0]} position={[0, 0, -0.002]} />
  if (item === 'wire') return <mesh geometry={geo.bridge} material={kit.mat('#c27a3a', { metal: 0.6, rough: 0.35 })} position={[0, -0.085, 0.004]} />
  return (
    <group position={[0, 0, -0.012]} rotation={[-Math.PI / 2, 0, 0]}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}
