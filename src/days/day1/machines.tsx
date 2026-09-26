import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { type Group, type Mesh, Quaternion, Vector3 } from 'three'
import type { Vec3 } from '../../app/cameraPose'
import { ITEMS } from '../../repair/items'
import type { ItemId } from '../../repair/types'
import { useKit } from '../../world/kit'
import { Ball, Box, Coil, Cone, Cyl, Ring } from '../../world/primitives'
import { useDayRun } from '../runner/store'
import { BottleCap, clamp01, type DayGeometry, ItemModel, Spoon, testProgress } from '../scene/items'
import { Marking } from '../scene/labels'

const UP = new Vector3(0, 1, 0)
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t)
const along = (base: Vec3, dir: Vector3, k: number): Vec3 => [base[0] + dir.x * k, base[1] + dir.y * k, base[2] + dir.z * k]
const brass = { metal: 0.75, rough: 0.3 }
const steel = { metal: 0.85, rough: 0.28 }

// ------------------------------------------------------------------ gramophone

/** Top of the horn's neck, over the back-right corner of the box. */
const ELBOW: Vec3 = [-0.09, 0.2, 0.11]
/** The horn opens up and out to screen-right, clear of the record. */
const HORN_DIR = new Vector3(-0.55, 0.45, -0.7).normalize()
const HORN_LEN = 0.3
const HORN_Q = new Quaternion().setFromUnitVectors(UP, HORN_DIR.clone().negate())
const HORN_MID = along(ELBOW, HORN_DIR, HORN_LEN / 2)
const HORN_MOUTH = along(ELBOW, HORN_DIR, HORN_LEN)
const ARM_YAW = -0.467
const ARM_LEN = 0.2
const SOUNDBOX: Vec3 = [ELBOW[0] - Math.sin(ARM_YAW) * ARM_LEN, ELBOW[1], ELBOW[2] - Math.cos(ARM_YAW) * ARM_LEN]

export const GRAMOPHONE_POINTS = {
  crank: [-0.194, 0.105, -0.02],
  turntable: [0.075, 0.125, -0.04],
  horn: HORN_MOUTH,
  needle: [SOUNDBOX[0], 0.14, SOUNDBOX[2]],
  needleHolder: [SOUNDBOX[0], 0.14, SOUNDBOX[2]],
} as const

/** Sharma Uncle's wind-up gramophone. Faces the mechanic (-Z); the horn opens to screen-right. */
export function GramophoneMachine({ geo }: { geo: DayGeometry }) {
  const platter = useRef<Group>(null)
  const crank = useRef<Group>(null)
  const arm = useRef<Group>(null)
  const horn = useRef<Group>(null)
  const notes = useRef<(Group | null)[]>([])
  const angles = useRef({ platter: 0, crank: 0 })
  const needle = useDayRun((s) => s.placements.needle)
  const passShown = useDayRun((s) => s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks'))

  useFrame((_, delta) => {
    const s = useDayRun.getState()
    const dt = Math.min(delta, 0.05)
    const now = performance.now()
    const tp = testProgress()
    const shownPass = s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks')
    const turning = (s.phase === 'inspecting' && s.seen.includes('crank')) || s.phase === 'diagnosis' || tp !== null || shownPass
    const winding = (s.phase === 'inspecting' && s.seen[s.seen.length - 1] === 'crank' && now - s.stepAt < 1200) || (tp !== null && tp < 0.15)
    angles.current.platter -= (turning ? 3.4 : 0) * dt
    angles.current.crank += (winding ? 9 : 0) * dt
    if (platter.current) platter.current.rotation.y = angles.current.platter
    if (crank.current) crank.current.rotation.x = angles.current.crank
    const playing = shownPass || (tp !== null && s.outcome?.pass === true && tp > 0.4)
    const scratching = tp !== null && s.outcome?.code === 'scratch' && tp > 0.25 && tp < 0.7
    if (arm.current) arm.current.rotation.y = ARM_YAW + (scratching ? Math.sin(now * 0.08) * 0.035 : 0)
    if (horn.current) horn.current.scale.setScalar(playing ? 1 + Math.sin(now * 0.025) * 0.025 : 1)
    notes.current.forEach((n, i) => {
      if (!n) return
      n.visible = playing
      if (!playing) return
      const k = (now / 1700 + i / 3) % 1
      const p = along(HORN_MOUTH, HORN_DIR, 0.05 + k * 0.08)
      n.position.set(p[0] + Math.sin(k * 9 + i) * 0.02, p[1] + k * 0.2, p[2])
      n.scale.setScalar(1.6 * Math.sin(k * Math.PI))
    })
  })

  const wood = '#6b3f22'
  return (
    <group>
      {/* Wooden box on four little feet. */}
      <Box p={[0, 0.058, 0]} s={[0.3, 0.1, 0.3]} c={wood} cast />
      <Box p={[0, 0.11, 0]} s={[0.31, 0.008, 0.31]} c="#4a2a16" />
      <Box p={[0, 0.012, 0]} s={[0.31, 0.012, 0.31]} c="#4a2a16" />
      {[-0.13, 0.13].flatMap((x) => [-0.13, 0.13].map((z) => <Cyl key={`${x}${z}`} p={[x, 0.004, z]} s={[0.03, 0.008, 0.03]} c="#2a1a10" />))}
      <Box p={[0, 0.058, -0.151]} s={[0.2, 0.05, 0.002]} c="#3a2212" />
      <Marking text="GRAMOPHONE" p={[0, 0.058, -0.1525]} h={0.014} />

      {/* Turntable: felt, record, grooves, label. */}
      <group ref={platter} position={[0, 0.105, 0]}>
        <Cyl s={[0.25, 0.01, 0.25]} c="#5a1f2a" o={{ rough: 0.95 }} />
        <Cyl p={[0, 0.008, 0]} s={[0.23, 0.004, 0.23]} c="#141414" o={{ rough: 0.3, metal: 0.2 }} />
        {[0.205, 0.175, 0.145, 0.115].map((d) => (
          <Ring key={d} p={[0, 0.0102, 0]} r={[Math.PI / 2, 0, 0]} s={[d, d, 0.02]} c="#2e2e2e" />
        ))}
        <Cyl p={[0, 0.0105, 0]} s={[0.075, 0.002, 0.075]} c="#b3261e" />
        <Box p={[0.016, 0.0118, 0]} s={[0.03, 0.001, 0.007]} c="#f0c75e" />
        <Cyl p={[0, 0.016, 0]} s={[0.008, 0.016, 0.008]} c="#c9ced1" o={steel} />
      </group>

      {/* Winding handle on the screen-right side. */}
      <group ref={crank} position={[-0.152, 0.055, -0.02]}>
        <Cyl p={[-0.015, 0, 0]} r={[0, 0, Math.PI / 2]} s={[0.012, 0.03, 0.012]} c="#b8892f" o={brass} />
        <Box p={[-0.032, 0.025, 0]} s={[0.006, 0.058, 0.012]} c="#b8892f" o={brass} />
        <Cyl p={[-0.042, 0.05, 0]} r={[0, 0, Math.PI / 2]} s={[0.018, 0.03, 0.018]} c="#2a1a10" />
      </group>

      {/* Horn neck, tone arm and soundbox. */}
      <Cyl p={[ELBOW[0], 0.15, ELBOW[2]]} s={[0.024, 0.1, 0.024]} c="#b8892f" o={brass} cast />
      <Ball p={[...ELBOW]} s={[0.032, 0.032, 0.032]} c="#b8892f" o={brass} />
      <group ref={arm} position={ELBOW} rotation={[0, ARM_YAW, 0]}>
        <Cyl p={[0, 0, -ARM_LEN / 2]} r={[Math.PI / 2, 0, 0]} s={[0.013, ARM_LEN, 0.013]} c="#b8892f" o={brass} cast />
        <Cyl p={[0, 0, -ARM_LEN]} r={[Math.PI / 2, 0, 0]} s={[0.06, 0.016, 0.06]} c="#c9ced1" o={steel} cast />
        <Cyl p={[0, 0, -ARM_LEN - 0.009]} r={[Math.PI / 2, 0, 0]} s={[0.04, 0.002, 0.04]} c="#e8e2d0" />
        <Box p={[0, -0.036, -ARM_LEN]} s={[0.012, 0.014, 0.012]} c="#2b2622" o={steel} />
        {(needle || passShown) && (
          <group position={[0, 0, -ARM_LEN]}>
            <InstalledNeedle item={needle ?? 'safetyPin'} geo={geo} />
          </group>
        )}
      </group>
      <group ref={horn} position={HORN_MID} quaternion={HORN_Q}>
        <Cone s={[0.3, HORN_LEN, 0.3]} c="#c9a13b" o={brass} cast />
        <Ring p={[0, -HORN_LEN / 2, 0]} r={[Math.PI / 2, 0, 0]} s={[0.3, 0.3, 0.3]} c="#9c7a2a" o={brass} />
        <Cyl p={[0, -HORN_LEN / 2 - 0.001, 0]} s={[0.2, 0.002, 0.2]} c="#5a4212" />
        <Cyl p={[0, -HORN_LEN / 2 - 0.002, 0]} s={[0.08, 0.002, 0.08]} c="#2a1e08" />
      </group>
      {[0, 1, 2].map((i) => (
        <group
          key={i}
          ref={(g) => {
            notes.current[i] = g
          }}
          visible={false}
        >
          <Ball s={[0.02, 0.015, 0.015]} c="#fff4d6" o={{ emissive: '#ffd166', emissiveIntensity: 0.6 }} />
          <Box p={[0.009, 0.02, 0]} s={[0.003, 0.04, 0.003]} c="#fff4d6" o={{ emissive: '#ffd166', emissiveIntensity: 0.6 }} />
        </group>
      ))}
    </group>
  )
}

/** Whatever sits in the needle holder, hanging point-down onto the record (soundbox space). */
function InstalledNeedle({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  if (item === 'spoon') {
    return (
      <group position={[0, -0.068, 0]} rotation={[0, 0, -Math.PI / 2]} scale={0.35}>
        <Spoon />
      </group>
    )
  }
  if (item === 'safetyPin') {
    return (
      <group position={[0, -0.063, 0]} rotation={[0, 0, Math.PI / 2]} scale={0.5}>
        <ItemModel id={item} geo={geo} />
      </group>
    )
  }
  return (
    <group position={[0, -0.06, 0]} scale={0.35}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

// ------------------------------------------------------------------ spring scale

/** The scale's centre line, just screen-right of the stand's post. */
const SX = -0.01
const ZERO_Y = 0.44
const HALF_KG_Y = 0.39
const BOTTOM_Y = 0.305
const SPRING_TOP = 0.455
const PAN_HANG = 0.12
const PAN_REST = 0.028
const APEX = 0.135
const DOOR_Z = -0.05
const DOOR_OPEN = -1.9

const STRINGS = [0, 1, 2].map((i) => {
  const a = (i / 3) * Math.PI * 2 + 0.5
  const start = new Vector3(Math.cos(a) * 0.078, 0.006, Math.sin(a) * 0.078)
  const dir = new Vector3(0, APEX, 0).sub(start)
  return { mid: start.clone().addScaledVector(dir, 0.5), len: dir.length(), q: new Quaternion().setFromUnitVectors(UP, dir.clone().normalize()) }
})

const JALEBIS: readonly Vec3[] = [
  [0.028, 0.012, 0.012],
  [-0.026, 0.012, 0.02],
  [0.002, 0.012, -0.03],
  [0.004, 0.022, 0.006],
]

export const SCALE_POINTS = {
  dial: [SX, 0.445, -0.053],
  spring: [SX + 0.022, 0.33, -0.053],
  springCase: [SX, 0.37, -0.045],
  hook: [SX, 0.278, -0.012],
  hookEye: [SX, 0.278, -0.012],
} as const

const HOOK_COLOURS: Partial<Record<ItemId, string>> = { wire: '#c27a3a', steelWire: '#aeb4b8' }

/** Rukmini Aunty's hanging spring scale on its stand. Faces the mechanic (-Z); the dial door opens during inspection. */
export function ScaleMachine({ geo }: { geo: DayGeometry }) {
  const kit = useKit()
  const pan = useRef<Group>(null)
  const strings = useRef<Group>(null)
  const jalebis = useRef<Group>(null)
  const pointer = useRef<Group>(null)
  const door = useRef<Group>(null)
  const spring = useRef<Mesh>(null)
  const anim = useRef({ pointer: BOTTOM_Y, door: 0, pan: PAN_REST })
  const hookItem = useDayRun((s) => s.placements.hook)
  const springItem = useDayRun((s) => s.placements.spring)
  const passShown = useDayRun((s) => s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks'))

  useFrame((_, delta) => {
    const s = useDayRun.getState()
    const dt = Math.min(delta, 0.05)
    const now = performance.now()
    const tp = testProgress()
    const code = s.outcome?.code
    const shownPass = s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks')
    const fitted = s.placements.spring
    const springy = (fitted !== undefined && ITEMS[fitted].props.elasticity >= 4) || shownPass
    let panY = PAN_REST
    let loaded = false
    let target = springy || fitted ? ZERO_Y : BOTTOM_Y
    let snap = false

    if (tp !== null && s.outcome) {
      const lifted = lerp(PAN_REST, PAN_HANG, tp / 0.15)
      if (code === 'drop') {
        panY = s.placements.hook ? (tp < 0.3 ? lifted : lerp(PAN_HANG, PAN_REST, (tp - 0.3) / 0.05)) : PAN_REST
      } else if (code === 'bounce') {
        panY = lifted + (tp > 0.15 ? Math.sin(tp * 70) * 0.03 * (1.15 - tp) : 0)
        target = HALF_KG_Y + (panY - PAN_HANG) * 1.5
        snap = true
      } else {
        panY = lifted
        loaded = tp > 0.25 && tp < 0.62
        if (code === 'weigh') target = loaded ? HALF_KG_Y : ZERO_Y
        else if (tp > 0.25) target = BOTTOM_Y
      }
    } else if (shownPass) {
      panY = PAN_HANG
      if (s.phase === 'thanks') {
        const c = ((now - s.phaseAt) / 3200) % 1
        loaded = c > 0.2 && c < 0.65
      }
      target = loaded ? HALF_KG_Y : ZERO_Y
    } else if (s.phase === 'result' && (code === 'no-zero' || code === 'bounce')) {
      panY = PAN_HANG
      target = BOTTOM_Y
    }

    const a = anim.current
    a.pointer = snap ? target : a.pointer + (target - a.pointer) * Math.min(1, dt * 7)
    a.pan = panY
    const open = (s.phase === 'inspecting' && s.seen.includes('spring')) || s.phase === 'diagnosis' || s.phase === 'build'
    a.door += ((open ? DOOR_OPEN : 0) - a.door) * Math.min(1, dt * 6)

    if (pan.current) pan.current.position.y = a.pan
    if (strings.current) strings.current.visible = a.pan > 0.07
    if (jalebis.current) jalebis.current.visible = loaded
    if (pointer.current) pointer.current.position.y = a.pointer
    if (door.current) door.current.rotation.y = a.door
    if (spring.current) spring.current.scale.z = Math.max(0.3, (SPRING_TOP - a.pointer) / 0.034)
  })

  const wood = '#8a5a33'
  return (
    <group>
      {/* Stand: base, post and arm. */}
      <Box p={[0.03, 0.01, 0.02]} s={[0.28, 0.02, 0.2]} c={wood} cast recv />
      <Box p={[0.13, 0.27, 0]} s={[0.024, 0.5, 0.024]} c="#6b4a30" cast />
      <Box p={[0.06, 0.51, 0]} s={[0.17, 0.022, 0.024]} c="#6b4a30" cast />
      <Ring p={[SX, 0.487, 0]} s={[0.028, 0.028, 0.3]} c="#b8892f" o={brass} />

      {/* Brass case with its window. */}
      <Cyl p={[SX, 0.475, 0]} s={[0.006, 0.02, 0.006]} c="#b8892f" o={brass} />
      <Cyl p={[SX, 0.468, 0]} s={[0.074, 0.008, 0.074]} c="#9c7a2a" o={brass} />
      <Cyl p={[SX, 0.38, 0]} s={[0.07, 0.17, 0.07]} c="#c9a13b" o={brass} cast />
      <Cyl p={[SX, 0.293, 0]} s={[0.074, 0.008, 0.074]} c="#9c7a2a" o={brass} />
      <Box p={[SX, 0.37, -0.037]} s={[0.03, 0.16, 0.004]} c="#1a1510" />

      {/* The spring inside: new, or the two snapped halves. */}
      {springItem === 'spring' || passShown ? (
        <mesh
          ref={spring}
          geometry={geo.spring}
          material={kit.mat('#c9ced1', steel)}
          position={[SX, SPRING_TOP, -0.042]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[0.5, 0.5, 2]}
        />
      ) : (
        <>
          <mesh geometry={geo.spring} material={kit.mat('#9aa0a4', steel)} position={[SX, SPRING_TOP, -0.042]} rotation={[Math.PI / 2, 0, 0]} scale={[0.5, 0.5, 0.9]} />
          <mesh geometry={geo.spring} material={kit.mat('#9aa0a4', steel)} position={[SX + 0.004, 0.3, -0.042]} rotation={[-Math.PI / 2, 0.3, 0]} scale={[0.5, 0.5, 0.8]} />
          {springItem && (
            <group position={[SX, 0.37, -0.043]} rotation={[-Math.PI / 2, 0, 0]} scale={0.3}>
              {springItem === 'bottleCap' ? <BottleCap /> : <ItemModel id={springItem} geo={geo} />}
            </group>
          )}
        </>
      )}

      {/* The dial door, hinged on its screen-left edge. */}
      <group ref={door} position={[SX + 0.02, 0.37, DOOR_Z]}>
        <Box p={[-0.02, 0, 0]} s={[0.04, 0.16, 0.003]} c="#f2efe6" />
        {Array.from({ length: 7 }, (_, i) => (
          <Box key={i} p={[-0.012, ZERO_Y - 0.37 - i * 0.02, -0.002]} s={[i % 2 ? 0.008 : 0.014, 0.0016, 0.001]} c="#2a2420" />
        ))}
        <Marking text="0" p={[-0.032, ZERO_Y - 0.37, -0.002]} h={0.01} dark />
        <Marking text="½" p={[-0.032, HALF_KG_Y - 0.37, -0.002]} h={0.01} dark />
        <Marking text="kg" p={[-0.02, -0.07, -0.002]} h={0.009} dark />
      </group>
      <group ref={pointer} position={[SX, BOTTOM_Y, DOOR_Z - 0.003]}>
        <Box s={[0.036, 0.005, 0.003]} c="#c0392b" />
        <Box p={[0.019, 0, 0]} r={[0, 0, Math.PI / 4]} s={[0.006, 0.006, 0.003]} c="#c0392b" />
      </group>

      {/* The hook under the case: the new one, or the snapped stub. */}
      {hookItem || passShown ? <InstalledHook item={hookItem ?? 'wire'} geo={geo} /> : <Cyl p={[SX, 0.285, 0]} s={[0.005, 0.012, 0.005]} c="#6d6d6d" o={steel} />}

      {/* The pan, resting on the base until something holds it up. */}
      <group ref={pan} position={[SX, PAN_REST, 0]}>
        <Cyl s={[0.17, 0.012, 0.17]} c="#c9ced1" o={steel} cast />
        <Ring p={[0, 0.006, 0]} r={[Math.PI / 2, 0, 0]} s={[0.17, 0.17, 0.15]} c="#aeb4b8" o={steel} />
        <group ref={strings}>
          {STRINGS.map((st, i) => (
            <group key={i} position={st.mid} quaternion={st.q}>
              <Cyl s={[0.0025, st.len, 0.0025]} c="#e6d9b8" />
            </group>
          ))}
        </group>
        <group ref={jalebis} visible={false}>
          {JALEBIS.map((p, i) => (
            <Coil key={i} p={[...p]} r={[Math.PI / 2, 0, i]} s={[0.042, 0.042, 0.04]} c="#f29e1f" o={{ rough: 0.4 }} />
          ))}
        </group>
      </group>
    </group>
  )
}

/** Whatever was fitted where the hook snapped. */
function InstalledHook({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  const kit = useKit()
  const colour = HOOK_COLOURS[item]
  if (colour) {
    return (
      <group>
        <Cyl p={[SX, 0.291, 0]} s={[0.004, 0.012, 0.004]} c={colour} o={{ metal: 0.6, rough: 0.35 }} />
        <Ring p={[SX, 0.2685, 0]} s={[0.04, 0.04, 0.35]} c={colour} o={{ metal: 0.6, rough: 0.35 }} />
      </group>
    )
  }
  if (item === 'spring') {
    return <mesh geometry={geo.spring} material={kit.mat('#c9ced1', steel)} position={[SX, 0.293, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.8, 0.8, 1.1]} />
  }
  if (item === 'bottleCap') {
    return (
      <group position={[SX, 0.285, 0]} rotation={[Math.PI, 0, 0]}>
        <BottleCap />
      </group>
    )
  }
  return (
    <group position={[SX, 0.28, 0]} scale={0.35}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}
