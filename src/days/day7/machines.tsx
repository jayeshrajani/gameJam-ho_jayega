import { useFrame } from '@react-three/fiber'
import { type RefObject, useEffect, useMemo, useRef } from 'react'
import { CatmullRomCurve3, type Group, type Mesh, MeshStandardMaterial, type PointLight, TubeGeometry, Vector3 } from 'three'
import { selectProgress, useGame } from '../../app/state'
import type { Vec3 } from '../../app/cameraPose'
import type { ItemId } from '../../repair/types'
import { useKit } from '../../world/kit'
import { Ball, Box, Cone, Coil, Cyl, Plane } from '../../world/primitives'
import { currentJob, useDayRun } from '../runner/store'
import { type DayGeometry, ItemModel, testProgress } from '../scene/items'

/** The wedding pandal in the lane outside the shop. Screen-left is +X. */
export const WEDDING_AT: Vec3 = [0, 0, 2.95]

/** The morning line at which the power dies. */
export const BLACKOUT_LINE = 2

const ENGINE_PULLEY = { x: -1.55, y: 0.22, r: 0.06 }
const DYNAMO_PULLEY = { x: -1.05, y: 0.3, r: 0.045 }
const PULLEY_Z = -0.23

export const GENERATOR_POINTS = {
  tank: [-1.2, 0.76, 0.02],
  fuelCrack: [-1.3, 0.46, -0.21],
  sleeveClamp: [-1.3, 0.46, -0.21],
  pullCord: [-1.78, 0.3, -0.05],
  beltGuard: [-1.3, 0.22, -0.25],
  enginePulley: [ENGINE_PULLEY.x, ENGINE_PULLEY.y, PULLEY_Z],
  dynamoPulley: [DYNAMO_PULLEY.x, DYNAMO_PULLEY.y, PULLEY_Z],
  oil: [-1.64, 0.1, -0.19],
  plug: [-1.62, 0.56, -0.08],
  dynamo: [-0.95, 0.46, 0.02],
} as const

export const FUSE_POINTS = {
  mainSwitch: [-0.15, 1.08, 0.23],
  fuseCarrier: [0.03, 1.14, 0.22],
  terminal: [0.18, 0.98, 0.22],
  cover: [0.1, 0.87, 0.22],
  crack: [0.1, 0.87, 0.22],
  meter: [0.1, 1.46, 0.27],
  load: [0.1, 0.5, 0.3],
} as const

export const STAGE_POINTS = {
  amp: [0.6, 0.27, 0.08],
  micCut: [0.8, 0.03, 0.14],
  micJoint: [0.8, 0.03, 0.14],
  archShort: [0.8, 1.0, 1.2],
  bulbs: [0.95, 1.8, 1.22],
  speakerStand: [2.08, 0.75, 0.44],
} as const

const JOB_PHASES = ['talk', 'inspect', 'inspecting', 'diagnosis', 'build', 'testing', 'result', 'thanks']
const EVENING = ['dusk', 'evening', 'report']

function useTube(points: readonly Vec3[], radius: number, closed = false) {
  const geo = useMemo(
    () => new TubeGeometry(new CatmullRomCurve3(points.map((p) => new Vector3(...p)), closed, 'centripetal'), 48, radius, 6, closed),
    // Points are module constants.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  useEffect(() => () => geo.dispose(), [geo])
  return geo
}

function beltPoints(): Vec3[] {
  const a = ENGINE_PULLEY
  const b = DYNAMO_PULLEY
  const phi = Math.atan2(b.y - a.y, b.x - a.x)
  const pts: Vec3[] = []
  for (let i = 0; i <= 10; i++) {
    const t = phi + Math.PI / 2 + (i / 10) * Math.PI
    pts.push([a.x + Math.cos(t) * a.r, a.y + Math.sin(t) * a.r, 0])
  }
  for (let i = 0; i <= 10; i++) {
    const t = phi - Math.PI / 2 + (i / 10) * Math.PI
    pts.push([b.x + Math.cos(t) * b.r, b.y + Math.sin(t) * b.r, 0])
  }
  return pts
}

const BELT = beltPoints()
const GEN_CABLE: Vec3[] = [[-0.82, 0.2, 0], [-0.7, 0.02, -0.08], [-0.25, 0.02, 0.1], [0.06, 0.02, 0.3], [0.08, 0.3, 0.33], [0.08, 0.82, 0.32]]
const STAGE_CABLE: Vec3[] = [[0.2, 0.84, 0.32], [0.24, 0.3, 0.32], [0.3, 0.02, 0.26], [0.5, 0.02, 0.18], [0.6, 0.08, 0.16]]
const MIC_CABLE_A: Vec3[] = [[0.68, 0.06, 0.12], [0.74, 0.015, 0.13], [0.78, 0.015, 0.14]]
const MIC_CABLE_B: Vec3[] = [[0.82, 0.015, 0.14], [0.9, 0.015, 0.2], [0.95, 0.1, 0.3], [0.96, 0.3, 0.42]]
const HIGH_CABLE: Vec3[] = [[0.1, 2.3, 0.4], [0.4, 2.0, 0.8], [0.76, 2.1, 1.25]]

/** Bulbs strung along the pandal's back wall, sagging between poles. */
function stringBulbs(y: number, sag: number, n: number, x0: number, x1: number, z: number): Vec3[] {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)
    const seg = (t * 4) % 1
    return [x0 + (x1 - x0) * t, y - Math.sin(seg * Math.PI) * sag, z] as Vec3
  })
}

const STRINGS: Vec3[] = [
  ...stringBulbs(2.45, 0.18, 36, -3.0, 3.0, 1.46),
  ...stringBulbs(2.15, 0.14, 30, -3.0, 3.0, 1.44),
]
const ARCH_C = { x: 1.45, y: 2.05, z: 1.25, r: 0.7 }
const ARCH_BULBS: Vec3[] = Array.from({ length: 17 }, (_, i) => {
  const a = (i / 16) * Math.PI
  return [ARCH_C.x + Math.cos(a) * ARCH_C.r, ARCH_C.y + Math.sin(a) * 0.35, ARCH_C.z - 0.02] as Vec3
})

const PUFFS = 8

export function WeddingMachine({ geo }: { geo: DayGeometry }) {
  const kit = useKit()
  const beltGeo = useTube(BELT, 0.008, true)
  const genCable = useTube(GEN_CABLE, 0.012)
  const stageCable = useTube(STAGE_CABLE, 0.01)
  const micA = useTube(MIC_CABLE_A, 0.006)
  const micB = useTube(MIC_CABLE_B, 0.006)
  const highCable = useTube(HIGH_CABLE, 0.008)
  const mats = useMemo(
    () => ({
      bulb: new MeshStandardMaterial({ color: '#ffe7a3', emissive: '#ffcf5a', emissiveIntensity: 0, roughness: 0.4 }),
      arch: new MeshStandardMaterial({ color: '#ff9fc8', emissive: '#ff5fa8', emissiveIntensity: 0, roughness: 0.4 }),
      lamp: new MeshStandardMaterial({ color: '#7a3', emissive: '#6f3', emissiveIntensity: 0 }),
      flame: new MeshStandardMaterial({ color: '#ffb347', emissive: '#ff7a00', emissiveIntensity: 0, transparent: true, opacity: 0.9 }),
    }),
    [],
  )
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats])

  const gen = useRef<Group>(null)
  const door = useRef<Group>(null)
  const lever = useRef<Group>(null)
  const meterDisc = useRef<Mesh>(null)
  const cone = useRef<Mesh>(null)
  const goatHead = useRef<Group>(null)
  const glow = useRef<PointLight>(null)
  const torch = useRef<PointLight>(null)
  const drips = useRef<(Mesh | null)[]>([])
  const exhaust = useRef<(Mesh | null)[]>([])
  const smoke = useRef<(Mesh | null)[]>([])
  const termSpark = useRef<Mesh>(null)
  const archSpark = useRef<Mesh>(null)
  const burnSpark = useRef<Mesh>(null)

  const jobId = useDayRun((s) => currentJob(s)?.id)
  const phase = useDayRun((s) => s.phase)
  const placements = useDayRun((s) => s.placements)
  const passShown = useDayRun((s) => s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks'))
  const done = useGame((s) => selectProgress(s)?.completedJobs.join(',') ?? '')
  const evening = EVENING.includes(phase)
  const fixed = (id: string) => evening || done.split(',').includes(id) || (jobId === id && passShown)
  const active = (id: string) => jobId === id && JOB_PHASES.includes(phase)
  // What's fitted: the current job's placements, or the ★★★ parts once a zone is finished.
  const part = (zone: string, joint: string, fallback: ItemId | undefined): ItemId | undefined =>
    active(zone) && placements[joint] ? placements[joint] : fixed(zone) ? fallback : undefined

  const fuel = part('generator', 'fuel', 'penRefill')
  const clamp = part('generator', 'clamp', 'steelWire')
  const cord = part('generator', 'cord', 'nylonRope')
  const belt = part('generator', 'belt', 'innerTube')
  const fuse = part('fuseBox', 'fuse', 'fuseStrand')
  const screw = active('fuseBox') ? placements.screw : undefined
  const tight = fixed('fuseBox') || screw !== undefined
  const cover = part('fuseBox', 'cover', 'tape')
  const splice = part('stage', 'splice', 'wire')
  const wrap = part('stage', 'wrap', 'tape')
  const spacer = part('stage', 'separate', 'innerTube')

  useFrame((_, delta) => {
    const s = useDayRun.getState()
    const now = performance.now()
    const tp = testProgress()
    const job = currentJob(s)?.id
    const outcome = s.outcome
    const progress = selectProgress(useGame.getState())?.completedJobs ?? []
    const late = EVENING.includes(s.phase)
    const isFixed = (id: string) => late || progress.includes(id) || (job === id && outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks'))
    const before = s.phase === 'morning' && s.line < BLACKOUT_LINE
    const flick = Math.sin(now * 0.05) > 0.2

    // Power: on before the blackout, back once the generator and fuse are both fixed; tests light things up for a moment.
    let mains = before || (isFixed('generator') && isFixed('fuseBox'))
    let burning = false
    if (tp !== null && job === 'fuseBox') {
      if (outcome?.code === 'burn') {
        mains = tp > 0.3 && tp < 0.55 && flick
        burning = tp >= 0.5
      } else if (outcome?.pass) mains = tp > 0.6
    }
    if (s.phase === 'result' && job === 'fuseBox' && outcome?.code === 'burn') burning = true
    if (tp !== null && job === 'generator' && outcome?.pass && isFixed('fuseBox')) mains = tp > 0.55
    const stageOk = isFixed('stage') || (tp !== null && job === 'stage' && outcome?.pass === true && tp > 0.6)
    const archOn = stageOk && (mains || (tp !== null && job === 'stage'))
    mats.bulb.emissiveIntensity = mains ? 2.2 : 0
    mats.arch.emissiveIntensity = archOn || before ? 2.4 : 0
    mats.lamp.emissiveIntensity = mains ? 2 : 0
    mats.flame.emissiveIntensity = late ? 2.5 + Math.sin(now * 0.02) * 0.6 : 0
    if (glow.current) glow.current.intensity = mains ? 6 : 0
    if (torch.current) {
      // Rocky's phone torch, pointed at whatever you're working on in the dark.
      const at = job === 'generator' ? [-1.2, 1.1, -0.9] : job === 'fuseBox' ? [0.05, 1.5, -0.6] : [1.1, 1.3, -0.5]
      torch.current.position.set(at[0] ?? 0, at[1] ?? 0, at[2] ?? 0)
      torch.current.intensity = !mains && JOB_PHASES.includes(s.phase) ? 5 : !mains && s.phase === 'pick' ? 1.5 : 0
    }

    // Generator: running shakes it and puffs exhaust.
    const genTest = tp !== null && job === 'generator'
    const running = before || late || (isFixed('generator') && !genTest) || (genTest && tp > 0.3 && outcome?.stages[2]?.ok === true)
    if (gen.current) gen.current.position.y = running ? Math.sin(now * 0.09) * 0.004 : 0
    exhaust.current.forEach((m, i) => {
      if (!m) return
      m.visible = running
      if (!running) return
      const k = (now / 600 + i / PUFFS) % 1
      m.position.set(-1.52 + k * 0.05, 0.62 + k * 0.4, 0.2 + Math.sin(i) * 0.03)
      m.scale.setScalar(0.02 + k * 0.05)
    })
    const sealed = isFixed('generator') || (job === 'generator' && s.placements.fuel !== undefined)
    drips.current.forEach((m, i) => {
      if (!m) return
      m.visible = !sealed && s.phase !== 'leave'
      const k = (now / 900 + i / 3) % 1
      m.position.set(-1.3, 0.44 - k * 0.42, -0.215)
    })

    // Fuse box: door opens once the main is off; the lever drops for work and goes back up to test.
    const fuseWork = job === 'fuseBox' && s.phase !== 'pick'
    const mainOff = fuseWork && (s.seen.includes('mainSwitch') || ['diagnosis', 'build', 'result'].includes(s.phase))
    if (door.current) door.current.rotation.y += ((fuseWork && (mainOff || s.phase === 'testing') ? -1.9 : 0) - door.current.rotation.y) * 0.15
    if (lever.current) lever.current.rotation.x += ((mainOff && s.phase !== 'testing' ? 1.0 : -0.4) - lever.current.rotation.x) * 0.2
    if (meterDisc.current) meterDisc.current.rotation.y += mains ? Math.min(delta, 0.05) * 6 : 0
    if (termSpark.current) termSpark.current.visible = !isFixed('fuseBox') && !(job === 'fuseBox' && s.placements.screw) && !mainOff && flick && s.phase !== 'morning'
    if (burnSpark.current) burnSpark.current.visible = burning && flick
    smoke.current.forEach((m, i) => {
      if (!m) return
      m.visible = burning
      if (!burning) return
      const k = (now / 1100 + i / PUFFS) % 1
      m.position.set(0.28 + Math.sin(i * 1.7) * 0.05, 0.05 + k * 0.7, 0.28 + Math.cos(i * 2.1) * 0.05)
      m.scale.setScalar(0.04 + k * 0.1)
    })

    // Stage: the arch short fizzes until it's fixed; the speaker thumps once the mic works.
    if (archSpark.current) archSpark.current.visible = !stageOk && !(job === 'stage' && s.placements.separate) && flick && (before || s.phase === 'morning')
    const booming = late || (tp !== null && job === 'stage' && outcome?.stages[0]?.ok === true && tp > 0.4)
    if (cone.current) {
      const k = booming ? 1 + Math.max(0, Math.sin(now * 0.03)) * 0.12 : 1
      cone.current.scale.set(0.18 * k, 0.01, 0.18 * k)
    }
    if (goatHead.current) goatHead.current.rotation.z = stageOk ? 0.3 : -0.5 + Math.sin(now * 0.012) * 0.15
  })

  const metal = { metal: 0.8, rough: 0.35 }
  return (
    <group>
      <pointLight ref={glow} position={[0.2, 2.2, 0.6]} color="#ffcf7a" intensity={0} distance={9} decay={1.4} />
      <pointLight ref={torch} color="#e8f0ff" intensity={0} distance={4.5} decay={1.4} />

      <Pandal mats={mats} />

      {/* ---------- Generator ---------- */}
      <group ref={gen}>
        <Box p={[-1.3, 0.04, 0]} s={[1.0, 0.08, 0.5]} c="#2a2a2a" cast />
        {[-0.48, 0.48].flatMap((dx) =>
          [-0.23, 0.23].map((dz) => <Cyl key={`${dx}${dz}`} p={[-1.3 + dx, 0.4, dz]} s={[0.025, 0.72, 0.025]} c="#e0a31a" o={metal} />),
        )}
        {[-0.23, 0.23].map((dz) => (
          <Box key={dz} p={[-1.3, 0.76, dz]} s={[1.0, 0.025, 0.025]} c="#e0a31a" o={metal} />
        ))}
        {/* Engine with cooling fins, spark plug and oil cap. */}
        <Box p={[-1.55, 0.3, 0.02]} s={[0.36, 0.36, 0.38]} c="#4a4f55" cast />
        {[0.42, 0.46, 0.5].map((y) => (
          <Box key={y} p={[-1.55, y, 0.02]} s={[0.38, 0.012, 0.4]} c="#6d7275" />
        ))}
        <Cyl p={[-1.62, 0.54, -0.08]} s={[0.02, 0.06, 0.02]} c="#e8e2d0" />
        <Cyl p={[-1.62, 0.58, -0.08]} s={[0.028, 0.02, 0.028]} c="#1f1f1f" />
        <Cyl p={[-1.64, 0.1, -0.17]} r={[Math.PI / 2, 0, 0]} s={[0.04, 0.03, 0.04]} c="#e0a31a" />
        {/* Petrol tank, cap, muffler. */}
        <Box p={[-1.3, 0.66, 0.02]} s={[0.62, 0.16, 0.36]} c="#c0392b" o={{ metal: 0.4, rough: 0.35 }} cast />
        <Cyl p={[-1.2, 0.755, 0.02]} s={[0.07, 0.03, 0.07]} c="#1f1f1f" />
        <Cyl p={[-1.52, 0.55, 0.2]} r={[0, 0, Math.PI / 2]} s={[0.08, 0.2, 0.08]} c="#3a3a3a" o={metal} />
        {/* Dynamo, control panel with sockets and a power lamp. */}
        <Cyl p={[-1.05, 0.3, 0.02]} r={[Math.PI / 2, 0, 0]} s={[0.28, 0.4, 0.28]} c="#2f6f4f" o={{ metal: 0.4, rough: 0.4 }} cast />
        <Box p={[-0.86, 0.36, 0.02]} s={[0.1, 0.34, 0.34]} c="#d8d2c2" />
        {[-0.07, 0.07].map((z) => (
          <Box key={z} p={[-0.81, 0.32, z]} s={[0.01, 0.06, 0.05]} c="#1f1f1f" />
        ))}
        <mesh geometry={kit.geo.sphere} material={mats.lamp} position={[-0.81, 0.46, 0.02]} scale={0.02} />
        {/* Pulleys and the belt on the near face. */}
        {[ENGINE_PULLEY, DYNAMO_PULLEY].map((c) => (
          <Cyl key={c.x} p={[c.x, c.y, PULLEY_Z + 0.02]} r={[Math.PI / 2, 0, 0]} s={[c.r * 2, 0.025, c.r * 2]} c="#8a9095" o={metal} />
        ))}
        {belt ? (
          <mesh geometry={beltGeo} material={kit.mat(belt === 'nylonRope' ? '#d8c99a' : belt === 'clothStrip' ? '#c2455a' : '#1b1b1b', { rough: 0.85 })} position={[0, 0, PULLEY_Z]} />
        ) : (
          <Box p={[-1.3, 0.02, -0.3]} r={[0, 0.4, 0]} s={[0.2, 0.008, 0.012]} c="#1b1b1b" />
        )}
        {/* Fuel pipe from the tank down to the carburettor; the crack drips petrol. */}
        <Cyl p={[-1.3, 0.47, -0.215]} s={[0.016, 0.22, 0.016]} c="#1f1f1f" />
        {!fuel && <Box p={[-1.3, 0.46, -0.224]} s={[0.018, 0.012, 0.004]} c="#e0d6b8" />}
        {fuel && <FuelSleeve item={fuel} geo={geo} />}
        {clamp && <SleeveClamp item={clamp} geo={geo} />}
        {Array.from({ length: 3 }, (_, i) => (
          <mesh key={`d${i}`} ref={(m) => void (drips.current[i] = m)} geometry={kit.geo.sphere} material={kit.mat('#d8c070', { opacity: 0.8, rough: 0.1 })} scale={0.008} />
        ))}
        {!fuel && <Cyl p={[-1.3, 0.004, -0.24]} s={[0.1, 0.002, 0.07]} c="#3b3423" o={{ opacity: 0.7, rough: 0.1 }} />}
        {/* Recoil starter on the end; its cord has snapped. */}
        <Cyl p={[-1.75, 0.3, 0.0]} r={[0, 0, Math.PI / 2]} s={[0.22, 0.05, 0.22]} c="#c0392b" />
        {cord ? <StarterCord item={cord} geo={geo} /> : <Box p={[-1.79, 0.25, -0.02]} s={[0.006, 0.1, 0.006]} c="#d8c99a" />}
        {!cord && <Box p={[-1.9, 0.015, -0.3]} r={[0, 0.5, 0]} s={[0.08, 0.02, 0.02]} c="#1f1f1f" />}
        {Array.from({ length: PUFFS }, (_, i) => (
          <mesh key={`ex${i}`} ref={(m) => void (exhaust.current[i] = m)} geometry={kit.geo.sphere} material={kit.mat('#8a8a8a', { opacity: 0.4 })} visible={false} />
        ))}
      </group>
      <mesh geometry={genCable} material={kit.mat('#161616', { rough: 0.7 })} />

      {/* ---------- Fuse box on the electric pole ---------- */}
      <Cyl p={[0.1, 1.25, 0.4]} s={[0.13, 2.5, 0.13]} c="#9d9282" cast />
      <Box p={[0.1, 1.05, 0.31]} s={[0.42, 0.48, 0.1]} c="#6d7275" o={metal} cast />
      <Box p={[0.1, 1.05, 0.259]} s={[0.38, 0.44, 0.002]} c="#3a3f44" />
      {/* Porcelain kit-kat fuse carriers: the left one has blown. */}
      {[0.03, 0.17].map((x) => (
        <Box key={x} p={[x, 1.14, 0.245]} s={[0.1, 0.06, 0.03]} c="#f2efe6" o={{ rough: 0.3 }} />
      ))}
      <Box p={[0.17, 1.14, 0.228]} s={[0.07, 0.003, 0.003]} c="#c27a3a" o={metal} />
      {fuse ? <FuseWire item={fuse} geo={geo} /> : <Box p={[0.03, 1.14, 0.228]} s={[0.05, 0.02, 0.002]} c="#2a1f18" />}
      {/* Terminal block; one screw is loose and scorched. */}
      <Box p={[0.1, 0.98, 0.25]} s={[0.28, 0.05, 0.03]} c="#1f1f1f" />
      {[0.02, 0.1].map((x) => (
        <Cyl key={x} p={[x, 0.98, 0.232]} r={[Math.PI / 2, 0, 0]} s={[0.018, 0.01, 0.018]} c="#c9ced1" o={metal} />
      ))}
      <Cyl p={[0.18, 0.98, tight ? 0.232 : 0.222]} r={[Math.PI / 2, 0, tight ? 0 : 0.4]} s={[0.018, 0.012, 0.018]} c={tight ? '#c9ced1' : '#5a4a3a'} o={metal} />
      {!tight && <Box p={[0.18, 0.98, 0.234]} s={[0.05, 0.04, 0.001]} c="#1a120c" />}
      {screw && (
        <group position={[0.2, 0.99, 0.2]} rotation={[Math.PI / 2, 0, -0.6]} scale={0.7}>
          <ItemModel id={screw} geo={geo} />
        </group>
      )}
      <mesh ref={termSpark} geometry={kit.geo.sphere} material={kit.mat('#fff3a0', { emissive: '#8fd0ff', emissiveIntensity: 3 })} position={[0.19, 0.99, 0.22]} scale={0.02} visible={false} />
      {/* Bakelite cover over the busbars, cracked: copper shows through. */}
      <Box p={[0.1, 0.87, 0.25]} s={[0.3, 0.1, 0.02]} c="#5a3a2a" />
      <Box p={[0.08, 0.87, 0.239]} r={[0, 0, 0.6]} s={[0.12, 0.006, 0.002]} c="#140c08" />
      {!cover && <Box p={[0.1, 0.868, 0.238]} s={[0.03, 0.012, 0.002]} c="#e0894a" o={metal} />}
      {cover && <CoverPatch item={cover} geo={geo} />}
      {/* The door, hinged on the screen-left edge. */}
      <group ref={door} position={[0.31, 1.05, 0.255]}>
        <Box p={[-0.21, 0, -0.006]} s={[0.42, 0.48, 0.012]} c="#7c8488" o={metal} cast />
        <Cone p={[-0.21, 0.08, -0.014]} r={[Math.PI / 2, 0, 0]} s={[0.1, 0.004, 0.09]} c="#f2c14e" />
        <Box p={[-0.21, 0.07, -0.017]} s={[0.012, 0.04, 0.002]} c="#1f1f1f" />
      </group>
      {/* Main switch: a red lever on the screen-right side. */}
      <Box p={[-0.15, 1.05, 0.3]} s={[0.08, 0.18, 0.1]} c="#3a3f44" />
      <group ref={lever} position={[-0.15, 1.05, 0.245]}>
        <Box p={[0, 0.06, -0.02]} s={[0.025, 0.12, 0.025]} c="#b3261e" />
      </group>
      {/* Meter with a spinning disc, and the overloaded extension board lashed to the pole. */}
      <Box p={[0.1, 1.46, 0.33]} s={[0.2, 0.22, 0.08]} c="#e8e2d0" />
      <Cyl p={[0.1, 1.46, 0.285]} r={[Math.PI / 2, 0, 0]} s={[0.12, 0.004, 0.12]} c="#cfe3ea" o={{ opacity: 0.6 }} />
      <mesh ref={meterDisc} geometry={kit.geo.cyl} material={kit.mat('#9aa0a4', metal)} position={[0.1, 1.42, 0.3]} scale={[0.08, 0.004, 0.08]} />
      <Box p={[0.1, 0.5, 0.33]} s={[0.24, 0.06, 0.04]} c="#f2efe6" />
      {[0.02, 0.07, 0.12, 0.17].map((x, i) => (
        <Box key={x} p={[x, 0.5, 0.305]} s={[0.035, 0.04, 0.03]} c={['#1f1f1f', '#f2efe6', '#b3261e', '#1f1f1f'][i]} />
      ))}
      <mesh geometry={stageCable} material={kit.mat('#161616', { rough: 0.7 })} />
      <mesh geometry={highCable} material={kit.mat('#161616', { rough: 0.7 })} />
      <mesh ref={burnSpark} geometry={kit.geo.sphere} material={kit.mat('#fff3a0', { emissive: '#ffb703', emissiveIntensity: 3 })} position={[0.28, 0.06, 0.28]} scale={0.035} visible={false} />
      {Array.from({ length: PUFFS }, (_, i) => (
        <mesh key={`sm${i}`} ref={(m) => void (smoke.current[i] = m)} geometry={kit.geo.sphere} material={kit.mat('#3a3a3a', { opacity: 0.55 })} visible={false} />
      ))}

      {/* ---------- Stage, mandap, arch and Bunty's gear ---------- */}
      <Box p={[1.45, 0.15, 0.8]} s={[1.5, 0.3, 0.9]} c="#7a1f2b" cast recv />
      <Box p={[1.45, 0.28, 0.345]} s={[1.5, 0.04, 0.01]} c="#d5a23b" />
      {[1.15, 1.75].flatMap((x) =>
        [0.6, 1.1].map((z) => <Cyl key={`${x}${z}`} p={[x, 0.9, z]} s={[0.03, 1.2, 0.03]} c="#d5a23b" o={metal} />),
      )}
      <Box p={[1.45, 1.52, 0.85]} s={[0.7, 0.05, 0.6]} c="#b3261e" />
      {Array.from({ length: 8 }, (_, i) => (
        <Ball key={i} p={[1.12 + i * 0.094, 1.47, 0.56]} s={0.035} c={i % 2 ? '#f39c12' : '#f5c542'} />
      ))}
      {/* The havan fire for the pheras, lit in the evening. */}
      <Box p={[1.45, 0.34, 0.85]} s={[0.16, 0.08, 0.16]} c="#8a4a2a" />
      <mesh geometry={kit.geo.cone} material={mats.flame} position={[1.45, 0.44, 0.85]} scale={[0.06, 0.12, 0.06]} />
      {/* Bunty's speaker (your Day 5 fix) and the amp on the ground. */}
      <Box p={[2.08, 0.6, 0.6]} s={[0.3, 0.6, 0.3]} c="#1a1a1a" cast />
      <mesh ref={cone} geometry={kit.geo.cyl} material={kit.mat('#3a3a3a', { rough: 0.9 })} position={[2.08, 0.62, 0.445]} rotation={[Math.PI / 2, 0, 0]} scale={[0.18, 0.01, 0.18]} />
      <Box p={[0.6, 0.12, 0.2]} s={[0.3, 0.24, 0.2]} c="#3a3f44" cast />
      {[0.52, 0.6, 0.68].map((x) => (
        <Cyl key={x} p={[x, 0.17, 0.097]} r={[Math.PI / 2, 0, 0]} s={[0.025, 0.01, 0.025]} c="#c9ced1" />
      ))}
      {/* Mic stand and its chewed cable. */}
      <Cyl p={[0.96, 0.31, 0.42]} s={[0.1, 0.01, 0.1]} c="#1f1f1f" />
      <Cyl p={[0.96, 0.75, 0.42]} s={[0.012, 0.88, 0.012]} c="#1f1f1f" o={metal} />
      <Ball p={[0.96, 1.22, 0.4]} s={[0.035, 0.05, 0.035]} c="#2a2a2a" />
      <mesh geometry={micA} material={kit.mat('#1f1f1f', { rough: 0.7 })} />
      <mesh geometry={micB} material={kit.mat('#1f1f1f', { rough: 0.7 })} />
      {!splice && (
        <>
          <Box p={[0.785, 0.015, 0.14]} s={[0.012, 0.004, 0.004]} c="#e0894a" o={metal} />
          <Box p={[0.815, 0.015, 0.14]} s={[0.012, 0.004, 0.004]} c="#e0894a" o={metal} />
        </>
      )}
      {splice && <MicJoin item={splice} wrap={wrap} geo={geo} />}
      <Goat headRef={goatHead} />
      {/* The light arch behind the stage; two bare wires touch at the left pole. */}
      {[ARCH_C.x - ARCH_C.r, ARCH_C.x + ARCH_C.r].map((x) => (
        <Cyl key={x} p={[x, 1.05, ARCH_C.z]} s={[0.04, 2.1, 0.04]} c="#d5a23b" o={metal} />
      ))}
      {ARCH_BULBS.map((p, i) => (
        <mesh key={i} geometry={kit.geo.sphere} material={mats.arch} position={p} scale={0.03} />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <Ball key={i} p={[ARCH_C.x - ARCH_C.r + 0.02, 0.3 + i * 0.2, ARCH_C.z - 0.03]} s={0.035} c={i % 2 ? '#f39c12' : '#f5c542'} />
      ))}
      <Plane p={[ARCH_C.x, 2.05, ARCH_C.z + 0.01]} r={[0, Math.PI, 0]} s={[1.1, 0.28]} t="weddingBanner" />
      <Box p={[0.8, 1.0, 1.22]} s={[0.06, 0.08, 0.04]} c="#1f1f1f" />
      {!spacer && (
        <>
          <Box p={[0.79, 1.0, 1.195]} r={[0, 0, 0.5]} s={[0.06, 0.004, 0.004]} c="#e0894a" o={metal} />
          <Box p={[0.81, 1.0, 1.195]} r={[0, 0, -0.5]} s={[0.06, 0.004, 0.004]} c="#e0894a" o={metal} />
        </>
      )}
      {spacer && (
        <group position={[0.8, 1.0, 1.18]} rotation={[Math.PI / 2, 0, 0.3]} scale={0.5}>
          <ItemModel id={spacer} geo={geo} />
        </group>
      )}
      <mesh ref={archSpark} geometry={kit.geo.sphere} material={kit.mat('#fff3a0', { emissive: '#8fd0ff', emissiveIntensity: 3 })} position={[0.8, 1.0, 1.18]} scale={0.03} visible={false} />
    </group>
  )
}

/** Back wall of striped cloth, bamboo poles, garlands and fairy lights. */
function Pandal({ mats }: { mats: { bulb: MeshStandardMaterial } }) {
  const kit = useKit()
  return (
    <group>
      {Array.from({ length: 12 }, (_, i) => (
        <Box key={i} p={[-2.75 + i * 0.5, 1.3, 1.5]} s={[0.5, 2.6, 0.02]} c={i % 2 ? '#f2c14e' : '#b3261e'} o={{ rough: 0.95 }} recv />
      ))}
      {Array.from({ length: 30 }, (_, i) => (
        <Ball key={i} p={[-2.9 + i * 0.2, 2.58, 1.47]} s={[0.1, 0.06, 0.04]} c={i % 2 ? '#f39c12' : '#c0392b'} />
      ))}
      {[-3.05, 3.05].flatMap((x) =>
        [-1.2, 1.5].map((z) => <Cyl key={`${x}${z}`} p={[x, 1.35, z]} s={[0.06, 2.7, 0.06]} c="#c9a36a" />),
      )}
      {STRINGS.map((p, i) => (
        <mesh key={i} geometry={kit.geo.sphere} material={mats.bulb} position={p} scale={0.022} />
      ))}
      {/* Marigold strands hanging down the back wall. */}
      {[-2.5, -1.5, -0.5, 0.5].map((x) =>
        Array.from({ length: 7 }, (_, i) => <Ball key={`${x}${i}`} p={[x, 2.4 - i * 0.18, 1.47]} s={0.04} c={i % 2 ? '#f39c12' : '#f5c542'} />),
      )}
      {/* A few plastic chairs for the guests. */}
      {[-2.75, -2.35].map((x) => (
        <Chair key={x} at={[x, 0, 0.9]} />
      ))}
      {[2.55, 2.9].map((x) => (
        <Chair key={x} at={[x, 0, 1.0]} />
      ))}
    </group>
  )
}

function Chair({ at }: { at: Vec3 }) {
  const c = '#c0392b'
  return (
    <group position={[...at]}>
      <Box p={[0, 0.42, 0]} s={[0.38, 0.03, 0.38]} c={c} cast />
      <Box p={[0, 0.66, 0.18]} s={[0.38, 0.45, 0.03]} c={c} cast />
      {[-0.16, 0.16].flatMap((x) => [-0.16, 0.16].map((z) => <Cyl key={`${x}${z}`} p={[x, 0.21, z]} s={[0.02, 0.42, 0.02]} c={c} />))}
    </group>
  )
}

/** The culprit. */
function Goat({ headRef }: { headRef: RefObject<Group | null> }) {
  const white = '#ece6d8'
  return (
    <group position={[0.42, 0, 0.62]} rotation={[0, -0.9, 0]}>
      <Box p={[0, 0.32, 0]} s={[0.36, 0.18, 0.16]} c={white} cast />
      {[-0.13, 0.13].flatMap((x) => [-0.05, 0.05].map((z) => <Box key={`${x}${z}`} p={[x, 0.12, z]} s={[0.03, 0.24, 0.03]} c={white} />))}
      <group ref={headRef} position={[0.2, 0.38, 0]}>
        <Box p={[0.06, -0.04, 0]} s={[0.14, 0.08, 0.08]} c={white} />
        <Box p={[0.02, 0.04, 0.04]} r={[0.3, 0, 0.5]} s={[0.02, 0.06, 0.01]} c="#8a7a6a" />
        <Box p={[0.02, 0.04, -0.04]} r={[-0.3, 0, 0.5]} s={[0.02, 0.06, 0.01]} c="#8a7a6a" />
        <Box p={[0.12, -0.1, 0]} s={[0.02, 0.05, 0.02]} c="#d8d0c0" />
      </group>
      <Box p={[-0.19, 0.38, 0]} r={[0, 0, 0.6]} s={[0.05, 0.02, 0.02]} c={white} />
    </group>
  )
}

function FuelSleeve({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  if (item === 'innerTube') return <Cyl p={[-1.3, 0.46, -0.215]} s={[0.028, 0.08, 0.028]} c="#111" o={{ rough: 0.95 }} />
  if (item === 'penRefill') return <Cyl p={[-1.3, 0.46, -0.215]} s={[0.024, 0.08, 0.024]} c="#dfe7ec" o={{ opacity: 0.75, rough: 0.2 }} />
  return (
    <group position={[-1.3, 0.47, -0.25]} rotation={[-Math.PI / 2, 0, 0]} scale={0.5}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

function SleeveClamp({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  const c = item === 'steelWire' ? '#aeb4b8' : item === 'rubberBand' ? '#c8844a' : undefined
  if (c) return <Coil p={[-1.3, 0.46, -0.215]} s={[0.034, 0.034, 0.05]} c={c} o={{ metal: 0.7, rough: 0.35 }} />
  return (
    <group position={[-1.3, 0.46, -0.25]} rotation={[-Math.PI / 2, 0, 0]} scale={0.5}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

function StarterCord({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  const c = item === 'nylonRope' ? '#d8c99a' : item === 'clothStrip' ? '#c2455a' : item === 'rubberBand' ? '#c8844a' : undefined
  if (!c) {
    return (
      <group position={[-1.82, 0.3, -0.05]} rotation={[0, 0, Math.PI / 2]} scale={0.5}>
        <ItemModel id={item} geo={geo} />
      </group>
    )
  }
  return (
    <group>
      <Cyl p={[-1.81, 0.3, -0.02]} r={[0, 0, Math.PI / 2]} s={[0.008, 0.06, 0.008]} c={c} />
      <Box p={[-1.85, 0.3, -0.02]} s={[0.025, 0.02, 0.1]} c="#1f1f1f" />
    </group>
  )
}

function FuseWire({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  if (item === 'fuseStrand') return <Box p={[0.03, 1.14, 0.228]} s={[0.07, 0.002, 0.002]} c="#e0894a" o={{ metal: 0.8 }} />
  if (item === 'wire' || item === 'steelWire') return <Box p={[0.03, 1.14, 0.227]} s={[0.07, 0.008, 0.008]} c={item === 'wire' ? '#c27a3a' : '#aeb4b8'} o={{ metal: 0.8 }} />
  return (
    <group position={[0.03, 1.14, 0.22]} rotation={[Math.PI / 2, 0, 0]} scale={0.6}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

function CoverPatch({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  if (item === 'tape') return <Box p={[0.09, 0.87, 0.238]} r={[0, 0, 0.5]} s={[0.16, 0.035, 0.002]} c="#e6d9b8" />
  if (item === 'sodaCan') return <Box p={[0.1, 0.87, 0.237]} s={[0.14, 0.07, 0.003]} c="#c9ced1" o={{ metal: 0.8, rough: 0.3 }} />
  return (
    <group position={[0.1, 0.87, 0.23]} rotation={[Math.PI / 2, 0, 0]} scale={0.55}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

function MicJoin({ item, wrap, geo }: { item: ItemId; wrap: ItemId | undefined; geo: DayGeometry }) {
  const c = item === 'wire' ? '#c27a3a' : item === 'steelWire' ? '#aeb4b8' : undefined
  return (
    <group>
      {c ? (
        <Box p={[0.8, 0.015, 0.14]} s={[0.05, 0.005, 0.005]} c={c} o={{ metal: 0.8 }} />
      ) : (
        <group position={[0.8, 0.012, 0.14]} scale={0.4}>
          <ItemModel id={item} geo={geo} />
        </group>
      )}
      {wrap === 'tape' && <Cyl p={[0.8, 0.015, 0.14]} r={[0, 0, Math.PI / 2]} s={[0.02, 0.06, 0.02]} c="#e6d9b8" />}
      {wrap === 'innerTube' && <Cyl p={[0.8, 0.015, 0.14]} r={[0, 0, Math.PI / 2]} s={[0.022, 0.06, 0.022]} c="#111" />}
      {wrap && wrap !== 'tape' && wrap !== 'innerTube' && (
        <group position={[0.8, 0.03, 0.14]} scale={0.4}>
          <ItemModel id={wrap} geo={geo} />
        </group>
      )}
    </group>
  )
}
