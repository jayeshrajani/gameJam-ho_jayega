import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { CatmullRomCurve3, type Group, type Mesh, TubeGeometry, Vector3 } from 'three'
import { selectProgress, useGame } from '../../app/state'
import type { Vec3 } from '../../app/cameraPose'
import type { ItemId } from '../../repair/types'
import { useKit } from '../../world/kit'
import { Ball, Box, Coil, Cyl } from '../../world/primitives'
import { currentJob, useDayRun } from '../runner/store'
import { clamp01, type DayGeometry, ItemModel, testProgress } from '../scene/items'

/** The groom's car, parked in the road outside the shop, nose towards world -X. */
export const CAR_AT: Vec3 = [0, 0, 2.95]

const CRANK = { x: -1.4, y: 0.48, r: 0.07 }
const ALT = { x: -1.15, y: 0.7, r: 0.045 }
const PULLEY_Z = -0.36
const WHEEL = { x: -1.2, y: 0.3, z: -0.68 }
const SIL_PIVOT: Vec3 = [-0.35, 0.16, -0.55]

export const CAR_ENGINE_POINTS = {
  hood: [-1.3, 0.88, -0.62],
  dipstick: [-1.02, 0.86, 0.12],
  coolant: [-1.7, 0.84, 0.42],
  hoseSplit: [-1.61, 0.8, -0.3],
  belt: [-1.28, 0.6, -0.42],
  crankPulley: [CRANK.x, CRANK.y, -0.42],
  altPulley: [ALT.x, ALT.y, -0.42],
  batteryTerminal: [-1.66, 0.73, -0.56],
} as const

export const CAR_SILENCER_POINTS = {
  tailpipe: [1.9, 0.12, -0.62],
  frontHanger: [-0.42, 0.3, -0.68],
  hanger: [0.42, 0.3, -0.68],
  hole: [0.05, 0.16, -0.74],
  patchWrap: [0.05, 0.16, -0.74],
  heat: [-0.15, 0.32, -0.68],
} as const

export const CAR_TYRE_POINTS = {
  slope: [-1.85, 0.03, -1.0],
  wheelChock: [-1.62, 0.06, -0.86],
  tyre: [-1.45, 0.45, -0.86],
  puncture: [-1.02, 0.1, -0.86],
  rim: [-1.2, 0.3, -0.86],
  valve: [-1.1, 0.5, -0.86],
} as const

const BELT_COLOURS: Partial<Record<ItemId, string>> = { nylonRope: '#d8c99a', innerTube: '#2a2a2a', clothStrip: '#c2455a' }

/** A closed belt round two pulleys at arbitrary positions in the XY plane. */
function useBelt() {
  const geo = useMemo(() => {
    const dx = ALT.x - CRANK.x
    const dy = ALT.y - CRANK.y
    const phi = Math.atan2(dy, dx)
    const pts: Vector3[] = []
    for (let i = 0; i <= 10; i++) {
      const a = phi + Math.PI / 2 + (i / 10) * Math.PI
      pts.push(new Vector3(CRANK.x + Math.cos(a) * CRANK.r, CRANK.y + Math.sin(a) * CRANK.r, 0))
    }
    for (let i = 0; i <= 10; i++) {
      const a = phi - Math.PI / 2 + (i / 10) * Math.PI
      pts.push(new Vector3(ALT.x + Math.cos(a) * ALT.r, ALT.y + Math.sin(a) * ALT.r, 0))
    }
    return new TubeGeometry(new CatmullRomCurve3(pts, true, 'centripetal'), 60, 0.008, 6, true)
  }, [])
  useEffect(() => () => geo.dispose(), [geo])
  return geo
}

const PUFFS = 8

export function CarMachine({ geo }: { geo: DayGeometry }) {
  const kit = useKit()
  const beltGeo = useBelt()
  const car = useRef<Group>(null)
  const hood = useRef<Group>(null)
  const silencer = useRef<Group>(null)
  const frontTyre = useRef<Group>(null)
  const fan = useRef<Group>(null)
  const steam = useRef<(Mesh | null)[]>([])
  const exhaust = useRef<(Mesh | null)[]>([])
  const sparks = useRef<Mesh>(null)
  const spin = useRef(0)

  const jobId = useDayRun((s) => currentJob(s)?.id)
  const phase = useDayRun((s) => s.phase)
  const placements = useDayRun((s) => s.placements)
  const passShown = useDayRun((s) => s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks'))
  const done = useGame((s) => selectProgress(s)?.completedJobs.join(',') ?? '')
  const working = ['talk', 'inspect', 'inspecting', 'diagnosis', 'build', 'testing', 'result', 'thanks'].includes(phase)
  const fixed = (id: string) => done.split(',').includes(id) || (jobId === id && passShown)
  const active = (id: string) => jobId === id && working
  // Parts shown on the car: the current job's placements, or the ★★★ parts once a zone is finished.
  const part = (zone: string, joint: string, fallback: ItemId): ItemId | undefined =>
    active(zone) && placements[joint] ? placements[joint] : fixed(zone) ? fallback : undefined

  const belt = part('carEngine', 'belt', 'nylonRope')
  const hose = part('carEngine', 'hose', 'innerTube')
  const terminal = part('carEngine', 'terminal', 'coin')
  const hang = part('carSilencer', 'hang', 'steelWire')
  const patch = part('carSilencer', 'patch', 'sodaCan')
  const wrap = part('carSilencer', 'wrap', 'wire')
  const chock = part('carTyre', 'chock', 'brick')
  const plug = part('carTyre', 'plug', 'innerTube')
  const pump = active('carTyre') ? placements.inflate : undefined

  useFrame((_, delta) => {
    const s = useDayRun.getState()
    const now = performance.now()
    const dt = Math.min(delta, 0.05)
    const t = (now - s.phaseAt) / 1000
    const tp = testProgress()
    const job = currentJob(s)?.id
    const progress = selectProgress(useGame.getState())?.completedJobs ?? []
    const isFixed = (id: string) => progress.includes(id) || (job === id && s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks'))

    // Rolls in during the morning, drives off after the last zone.
    if (car.current) {
      let x = 0
      if (s.phase === 'morning' && s.line === 0) x = 14 * (1 - clamp01(t / 3.5)) ** 2
      if (s.phase === 'leave') x = -16 * clamp01(t / 2.6) ** 2
      car.current.position.x = x
    }

    const engineJob = job === 'carEngine' && s.phase !== 'pick'
    const hoodOpen = engineJob && (s.seen.includes('hood') || ['diagnosis', 'build', 'testing', 'result', 'thanks'].includes(s.phase))
    if (hood.current) hood.current.rotation.z += ((hoodOpen ? -1.15 : 0) - hood.current.rotation.z) * 0.12

    const engineTest = tp !== null && job === 'carEngine'
    const beltOk = isFixed('carEngine') || (engineTest && s.outcome?.stages[0]?.ok === true)
    const hoseOk = isFixed('carEngine') || (engineTest && s.outcome?.stages[1]?.ok === true)
    const running = tp !== null && job !== 'carTyre'
    spin.current += (running && beltOk ? 20 : 0) * dt
    if (fan.current) fan.current.rotation.x = spin.current

    // Steam from the split hose while the engine is still hot and broken.
    const steaming = !hoseOk && !isFixed('carEngine') && s.phase !== 'leave'
    steam.current.forEach((m, i) => {
      if (!m) return
      m.visible = steaming
      if (!steaming) return
      const k = (now / 1400 + i / PUFFS) % 1
      const top = hoodOpen ? 0.82 : 0.9
      m.position.set(-1.61 + Math.sin(i * 2.3) * 0.08, top + k * 0.5, -0.3 + Math.cos(i * 1.7) * 0.08)
      m.scale.setScalar(0.04 + k * 0.1)
    })

    // Silencer sags onto the road until the hanger is fixed.
    const silencerJob = job === 'carSilencer'
    const hung = isFixed('carSilencer') || (silencerJob && s.placements.hang !== undefined && (tp === null || s.outcome?.stages[0]?.ok))
    if (silencer.current) silencer.current.rotation.z += ((hung ? 0 : -0.09) - silencer.current.rotation.z) * 0.15
    if (sparks.current) sparks.current.visible = !hung && s.phase === 'morning' && s.line === 0 && t < 3.5 && Math.sin(now * 0.06) > 0
    const quiet = isFixed('carSilencer') || (silencerJob && tp !== null && s.outcome?.stages[1]?.ok === true)
    exhaust.current.forEach((m, i) => {
      if (!m) return
      m.visible = running
      if (!running) return
      const k = (now / 700 + i / PUFFS) % 1
      const fromHole = !quiet && i % 2 === 0
      const x = fromHole ? 0.05 : 2.0 + k * 0.3
      m.position.set(x, fromHole ? 0.16 + k * 0.25 : 0.14 + k * 0.08, fromHole ? -0.74 - k * 0.1 : -0.6)
      m.scale.setScalar(0.03 + k * 0.06)
    })

    // The flat tyre squats until it's pumped up.
    const tyreTest = tp !== null && job === 'carTyre' && s.outcome?.pass === true
    const inflate = isFixed('carTyre') ? 1 : tyreTest ? clamp01((tp - 0.55) / 0.35) : 0
    if (frontTyre.current) {
      frontTyre.current.scale.y = 0.78 + 0.22 * inflate
      frontTyre.current.position.y = WHEEL.y - 0.05 * (1 - inflate)
    }
  })

  const white = '#eceef0'
  const glass = kit.mat('#2a3a48', { rough: 0.15, metal: 0.3 })
  const metal = { metal: 0.8, rough: 0.35 }
  return (
    <group ref={car}>
      {/* Body behind the engine bay, and the cabin. */}
      <Box p={[0.575, 0.57, 0]} s={[2.65, 0.5, 1.55]} c={white} cast />
      <Box p={[0.35, 1.05, 0]} s={[1.95, 0.46, 1.4]} c={white} cast />
      <mesh geometry={kit.geo.box} material={glass} position={[0.35, 1.07, -0.705]} scale={[1.75, 0.32, 0.01]} />
      <mesh geometry={kit.geo.box} material={glass} position={[0.35, 1.07, 0.705]} scale={[1.75, 0.32, 0.01]} />
      <mesh geometry={kit.geo.box} material={glass} position={[-0.66, 1.03, 0]} rotation={[0, 0, 0.55]} scale={[0.5, 0.02, 1.32]} />
      <mesh geometry={kit.geo.box} material={glass} position={[1.36, 1.03, 0]} rotation={[0, 0, -0.55]} scale={[0.45, 0.02, 1.32]} />
      {/* Wedding marigolds along the roof. */}
      {Array.from({ length: 9 }, (_, i) => (
        <Ball key={i} p={[-0.45 + i * 0.2, 1.3, (i % 2 ? 1 : -1) * 0.02]} s={0.07} c={i % 2 ? '#f39c12' : '#f5c542'} />
      ))}
      <Box p={[-1.88, 0.5, 0]} s={[0.06, 0.26, 1.55]} c="#b9bec2" o={metal} />
      <Box p={[1.9, 0.5, 0]} s={[0.06, 0.26, 1.55]} c="#b9bec2" o={metal} />
      {[-0.55, 0.55].map((z) => (
        <Box key={z} p={[-1.91, 0.66, z]} s={[0.02, 0.1, 0.25]} c="#fff4c2" o={{ emissive: '#fff1b0', emissiveIntensity: 0.3 }} />
      ))}
      {/* Engine bay: floor, fenders, firewall, grille. */}
      <Box p={[-1.325, 0.36, 0]} s={[1.15, 0.08, 1.45]} c="#3a3a3a" />
      {[-0.74, 0.74].map((z) => (
        <Box key={z} p={[-1.325, 0.6, z]} s={[1.15, 0.44, 0.07]} c={white} cast />
      ))}
      <Box p={[-0.77, 0.62, 0]} s={[0.04, 0.4, 1.45]} c="#2e2e33" />
      <Box p={[-1.84, 0.62, 0]} s={[0.04, 0.34, 1.4]} c="#1f1f1f" />
      {/* Engine, radiator, fan, hoses, battery, dipstick, coolant. */}
      <Box p={[-1.25, 0.58, 0.05]} s={[0.55, 0.36, 0.7]} c="#3d4147" />
      <Box p={[-1.25, 0.78, 0.05]} s={[0.5, 0.05, 0.6]} c="#b3261e" />
      <Box p={[-1.76, 0.6, 0]} s={[0.07, 0.36, 1.2]} c="#5d6468" />
      <group ref={fan} position={[-1.66, 0.6, 0]}>
        {[0, Math.PI / 2].map((a) => (
          <Box key={a} r={[a, 0, 0]} s={[0.01, 0.3, 0.05]} c="#2a2a2a" />
        ))}
      </group>
      <Cyl p={[-1.61, 0.76, -0.3]} r={[0, 0, Math.PI / 2]} s={[0.05, 0.24, 0.05]} c="#1f1f1f" />
      {!hose && <Box p={[-1.61, 0.787, -0.3]} s={[0.04, 0.004, 0.02]} c="#dcdcdc" />}
      {hose && <HosePatch item={hose} geo={geo} />}
      <Box p={[-1.6, 0.56, -0.52]} s={[0.24, 0.2, 0.18]} c="#1a1a1a" />
      <Cyl p={[-1.54, 0.68, -0.52]} s={[0.035, 0.03, 0.035]} c="#2a2a2a" />
      <Cyl p={[-1.66, 0.68 + (terminal ? 0 : 0.012), -0.52]} r={[terminal ? 0 : 0.35, 0, 0]} s={[0.035, 0.03, 0.035]} c="#b3261e" />
      {terminal && <TerminalShim item={terminal} geo={geo} />}
      <Cyl p={[-1.02, 0.84, 0.12]} r={[Math.PI / 2, 0, 0]} s={[0.04, 0.008, 0.04]} c="#f2c14e" />
      <Box p={[-1.7, 0.74, 0.42]} s={[0.12, 0.14, 0.12]} c="#e8e2d0" o={{ opacity: 0.85 }} />
      {/* Pulleys and the fan belt on the near face of the engine. */}
      {[CRANK, ALT].map((c) => (
        <Cyl key={c.x} p={[c.x, c.y, PULLEY_Z]} r={[Math.PI / 2, 0, 0]} s={[c.r * 2, 0.02, c.r * 2]} c="#8a9095" o={metal} />
      ))}
      {belt ? (
        <mesh geometry={beltGeo} material={kit.mat(BELT_COLOURS[belt] ?? '#8a8a8a', { rough: 0.85 })} position={[0, 0, PULLEY_Z - 0.015]} />
      ) : (
        <Box p={[CRANK.x + 0.02, CRANK.y - 0.1, PULLEY_Z - 0.015]} r={[0, 0, 0.3]} s={[0.012, 0.12, 0.01]} c="#2a2a2a" />
      )}
      {/* Bonnet, hinged at the windscreen. */}
      <group ref={hood} position={[-0.76, 0.82, 0]}>
        <Box p={[-0.575, 0.02, 0]} s={[1.15, 0.04, 1.52]} c={white} cast />
      </group>
      {/* Wheels. The front one on the pavement side is flat. */}
      {[
        [-1.2, 0.68],
        [1.2, -0.68],
        [1.2, 0.68],
      ].map(([x, z]) => (
        <Wheel key={`${x}${z}`} at={[x ?? 0, WHEEL.y, z ?? 0]} />
      ))}
      <group ref={frontTyre} position={[WHEEL.x, WHEEL.y, WHEEL.z]}>
        <Wheel at={[0, 0, 0]} />
      </group>
      {!plug && <Cyl p={[-1.02, 0.1, -0.79]} r={[Math.PI / 2, 0, 0]} s={[0.012, 0.05, 0.012]} c="#c9ced1" o={metal} />}
      {plug && <PuncturePlug item={plug} geo={geo} />}
      {chock && <Chock item={chock} geo={geo} />}
      {pump && (
        <group position={[-1.1, 0.5, -0.86]} rotation={[0.3, 0, 0]}>
          <ItemModel id={pump} geo={geo} />
        </group>
      )}
      {/* Exhaust pipe from the engine, then the silencer drum between the wheels, pivoting at its front joint. */}
      <Cyl p={[-0.575, SIL_PIVOT[1], SIL_PIVOT[2]]} r={[0, 0, Math.PI / 2]} s={[0.06, 0.45, 0.06]} c="#6d7275" o={metal} />
      <group ref={silencer} position={[...SIL_PIVOT]}>
        <Cyl p={[0.4, 0, 0]} r={[0, 0, Math.PI / 2]} s={[0.24, 0.8, 0.24]} c="#7c8488" o={metal} cast />
        <Cyl p={[1.55, 0, 0]} r={[0, 0, Math.PI / 2]} s={[0.06, 1.5, 0.06]} c="#6d7275" o={metal} />
        {!patch && <Cyl p={[0.4, 0, -0.118]} r={[Math.PI / 2, 0, 0]} s={[0.05, 0.004, 0.05]} c="#3a2418" />}
        {patch && <SilencerPatch item={patch} wrap={wrap} geo={geo} />}
      </group>
      {hang && <Hanger item={hang} geo={geo} />}
      <mesh ref={sparks} geometry={kit.geo.sphere} material={kit.mat('#fff3a0', { emissive: '#ffb703', emissiveIntensity: 3 })} position={[1.95, 0.02, -0.55]} scale={0.05} visible={false} />
      {Array.from({ length: PUFFS }, (_, i) => (
        <mesh key={`st${i}`} ref={(m) => void (steam.current[i] = m)} geometry={kit.geo.sphere} material={kit.mat('#f4f4f4', { opacity: 0.55 })} visible={false} />
      ))}
      {Array.from({ length: PUFFS }, (_, i) => (
        <mesh key={`ex${i}`} ref={(m) => void (exhaust.current[i] = m)} geometry={kit.geo.sphere} material={kit.mat('#9a9a9a', { opacity: 0.45 })} visible={false} />
      ))}
    </group>
  )
}

function Wheel({ at }: { at: Vec3 }) {
  return (
    <group position={[...at]}>
      <Cyl r={[Math.PI / 2, 0, 0]} s={[0.6, 0.2, 0.6]} c="#1b1b1b" o={{ rough: 0.9 }} cast />
      <Cyl r={[Math.PI / 2, 0, 0]} s={[0.34, 0.21, 0.34]} c="#b9bec2" o={{ metal: 0.8, rough: 0.3 }} />
    </group>
  )
}

function HosePatch({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  if (item === 'innerTube') return <Cyl p={[-1.61, 0.76, -0.3]} r={[0, 0, Math.PI / 2]} s={[0.07, 0.1, 0.07]} c="#111" o={{ rough: 0.95 }} />
  if (item === 'tape') return <Cyl p={[-1.61, 0.76, -0.3]} r={[0, 0, Math.PI / 2]} s={[0.065, 0.08, 0.065]} c="#e6d9b8" />
  return (
    <group position={[-1.61, 0.8, -0.34]} scale={0.6}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

function TerminalShim({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  return (
    <group position={[-1.66, 0.7, -0.56]} rotation={[Math.PI / 2, 0, 0]} scale={0.8}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

function Hanger({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  const c = item === 'steelWire' ? '#aeb4b8' : item === 'wire' ? '#c27a3a' : undefined
  if (c) return <Coil p={[0.42, 0.28, -0.55]} r={[0, Math.PI / 2, 0]} s={[0.07, 0.07, 0.6]} c={c} o={{ metal: 0.7, rough: 0.35 }} />
  return (
    <group position={[0.42, 0.28, -0.62]} scale={0.6}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

function SilencerPatch({ item, wrap, geo }: { item: ItemId; wrap: ItemId | undefined; geo: DayGeometry }) {
  const sheet =
    item === 'sodaCan' ? (
      <Box p={[0.4, 0, -0.122]} s={[0.12, 0.09, 0.004]} c="#c9ced1" o={{ metal: 0.8, rough: 0.3 }} />
    ) : (
      <group position={[0.4, 0, -0.14]} rotation={[-Math.PI / 2, 0, 0]} scale={0.6}>
        <ItemModel id={item} geo={geo} />
      </group>
    )
  const wc = wrap === 'steelWire' ? '#aeb4b8' : wrap === 'wire' ? '#c27a3a' : undefined
  return (
    <group>
      {sheet}
      {wc && <Coil p={[0.4, 0, 0]} r={[0, Math.PI / 2, 0]} s={[0.25, 0.25, 0.1]} c={wc} o={{ metal: 0.7, rough: 0.35 }} />}
      {wrap && !wc && (
        <group position={[0.4, 0.05, -0.14]} scale={0.5}>
          <ItemModel id={wrap} geo={geo} />
        </group>
      )}
    </group>
  )
}

function PuncturePlug({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  if (item === 'innerTube') return <Box p={[-1.02, 0.1, -0.79]} s={[0.03, 0.03, 0.01]} c="#111" />
  if (item === 'chewingGum') return <Ball p={[-1.02, 0.1, -0.79]} s={[0.035, 0.03, 0.015]} c="#ff8fb5" />
  return (
    <group position={[-1.02, 0.1, -0.82]} rotation={[-Math.PI / 2, 0, 0]} scale={0.5}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

function Chock({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  if (item === 'brick') return <Box p={[-1.62, 0.05, -0.7]} s={[0.1, 0.1, 0.22]} c="#a2412c" o={{ rough: 0.95 }} cast />
  return (
    <group position={[-1.62, 0.01, -0.72]} rotation={[0, Math.PI / 2, 0]}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}
