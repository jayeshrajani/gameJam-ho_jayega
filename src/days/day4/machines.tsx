import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { CatmullRomCurve3, type Group, type Mesh, TubeGeometry, Vector3 } from 'three'
import { ITEMS } from '../../repair/items'
import type { ItemId } from '../../repair/types'
import { useKit } from '../../world/kit'
import { Ball, Box, Cyl, Ring } from '../../world/primitives'
import { useDayRun } from '../runner/store'
import { clamp01, type DayGeometry, ItemModel, testProgress } from '../scene/items'
import { Marking } from '../scene/labels'

const TREADLE = { x: -0.12, y: 0.07, r: 0.058 }
const HAND = { x: -0.145, y: 0.25, r: 0.042 }
const Z = -0.045
const NEEDLE = { x: 0.115, y: 0.2 }
const DISCS = { x: 0.065, y: 0.262 }
const CLOTH_Y = 0.1635
const STITCHES = 9

export const SEWING_POINTS = {
  treadle: [TREADLE.x, TREADLE.y, -0.09],
  treadleWheel: [TREADLE.x, TREADLE.y, -0.09],
  wheel: [HAND.x, HAND.y, -0.08],
  handWheel: [HAND.x, HAND.y, -0.08],
  needle: [NEEDLE.x, 0.19, -0.06],
  needleClamp: [NEEDLE.x, 0.19, -0.06],
  thread: [DISCS.x, DISCS.y, -0.06],
  tensionPost: [DISCS.x, DISCS.y, -0.06],
  bobbin: [0.0, 0.163, -0.075],
} as const

const BELT_COLOURS: Partial<Record<ItemId, string>> = { innerTube: '#2a2a2a', clothStrip: '#c2455a', tape: '#e6d9b8' }
const BELT_OK: readonly ItemId[] = ['innerTube', 'clothStrip', 'tape']
const CLAMP_OK: readonly ItemId[] = ['bolt', 'safetyPin', 'tape']
const TENSION_OK: readonly ItemId[] = ['spring', 'hairClip', 'rubberBand']

/** A closed belt round the big wheel (below the table) and the hand wheel (above). */
function useBeltGeometry() {
  const geo = useMemo(() => {
    const pts: Vector3[] = []
    for (let i = 0; i <= 12; i++) {
      const a = -0.1 + (i / 12) * (Math.PI + 0.2)
      pts.push(new Vector3(HAND.x + Math.cos(a) * HAND.r, HAND.y + Math.sin(a) * HAND.r, 0))
    }
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI + 0.1 + (i / 12) * (Math.PI - 0.2)
      pts.push(new Vector3(TREADLE.x + Math.cos(a) * TREADLE.r, TREADLE.y + Math.sin(a) * TREADLE.r, 0))
    }
    return new TubeGeometry(new CatmullRomCurve3(pts, true, 'centripetal'), 80, 0.0055, 6, true)
  }, [])
  useEffect(() => () => geo.dispose(), [geo])
  return geo
}

/** A thin straight segment between two points in the XY plane. */
function Seg({ a, b, z, c, w = 0.0016 }: { a: [number, number]; b: [number, number]; z: number; c: string; w?: number }) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  return <Box p={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z]} r={[0, 0, Math.atan2(dy, dx)]} s={[Math.hypot(dx, dy), w, w]} c={c} />
}

/** Master Ji's black-and-gold treadle machine on its iron stand, front towards the mechanic. */
export function SewingMachine({ geo }: { geo: DayGeometry }) {
  const kit = useKit()
  const beltGeo = useBeltGeometry()
  const treadle = useRef<Group>(null)
  const pedal = useRef<Group>(null)
  const hand = useRef<Group>(null)
  const needleBar = useRef<Group>(null)
  const nest = useRef<Group>(null)
  const slack = useRef<Group>(null)
  const beltMesh = useRef<Mesh>(null)
  const stitches = useRef<(Mesh | null)[]>([])
  const spin = useRef({ treadle: 0, hand: 0 })
  const belt = useDayRun((s) => s.placements.belt)
  const clamp = useDayRun((s) => s.placements.clamp)
  const tension = useDayRun((s) => s.placements.tension)
  const passShown = useDayRun((s) => s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks'))

  useFrame((_, delta) => {
    const s = useDayRun.getState()
    const dt = Math.min(delta, 0.05)
    const now = performance.now()
    const tp = testProgress()
    const shown = s.outcome?.pass === true && (s.phase === 'result' || s.phase === 'thanks')
    const beltOk = shown || BELT_OK.includes(s.placements.belt ?? ('' as ItemId))
    const clampOk = shown || CLAMP_OK.includes(s.placements.clamp ?? ('' as ItemId))
    const tensionOk = shown || TENSION_OK.includes(s.placements.tension ?? ('' as ItemId))
    const recent = s.phase === 'inspecting' && now - s.stepAt < 1500 ? s.seen[s.seen.length - 1] : undefined
    const pedalling = (tp !== null && tp > 0.1) || (shown && s.phase === 'thanks') || recent === 'treadle' || recent === 'wheel'
    const sewing = pedalling && beltOk

    spin.current.treadle += (pedalling ? 6 : 0) * dt
    spin.current.hand += (sewing ? 10 : 0) * dt
    if (treadle.current) treadle.current.rotation.z = spin.current.treadle
    if (pedal.current) pedal.current.rotation.z = pedalling ? Math.sin(spin.current.treadle) * 0.12 : 0
    if (hand.current) hand.current.rotation.z = spin.current.hand
    if (needleBar.current) {
      const loose = !clampOk
      needleBar.current.position.y = sewing ? Math.sin(spin.current.hand * 2) * 0.01 : 0
      needleBar.current.rotation.z = loose ? 0.22 + ((sewing || recent === 'needle') ? Math.sin(now * 0.06) * 0.08 : 0) : 0
    }
    // The thread: slack loop at the discs and a knotted nest under the foot until the spring is back.
    if (slack.current) slack.current.visible = !tensionOk
    if (nest.current) {
      nest.current.visible = !tensionOk
      const grow = tp !== null && sewing ? 1 + clamp01((tp - 0.3) / 0.5) * 0.8 : 1
      nest.current.scale.setScalar(grow)
    }
    // Stitches appear along the cloth while it sews; a loose needle skips every other one.
    const sewn = shown ? 1 : tp !== null && sewing ? clamp01((tp - 0.2) / 0.7) : 0
    stitches.current.forEach((m, i) => {
      if (!m) return
      m.visible = i < Math.round(sewn * STITCHES) && (clampOk || i % 2 === 0) && tensionOk
    })
    if (beltMesh.current) {
      const b = s.placements.belt
      beltMesh.current.visible = shown || (b !== undefined && ITEMS[b].props.flexibility >= 4 && !ITEMS[b].tags.includes('LOOP'))
    }
  })

  const black = '#1c1c1e'
  const gold = '#c9a13b'
  const wood = '#7a4f2e'
  const iron = '#2b2b2b'
  const metal = { metal: 0.8, rough: 0.3 }
  const red = '#c0392b'
  return (
    <group>
      {/* Iron stand: table top, legs, foot treadle and the rod up to the big wheel. */}
      <Box p={[0, 0.14, 0]} s={[0.36, 0.02, 0.2]} c={wood} cast />
      <Box p={[-0.13, 0.1505, Z]} s={[0.035, 0.002, 0.03]} c="#120c08" />
      {[0.16, -0.16].map((x) => (
        <group key={x}>
          <Box p={[x, 0.065, 0.07]} s={[0.014, 0.13, 0.014]} c={iron} />
          <Box p={[x, 0.065, -0.07]} s={[0.014, 0.13, 0.014]} c={iron} />
          <Box p={[x, 0.01, 0]} s={[0.014, 0.014, 0.16]} c={iron} />
        </group>
      ))}
      <group ref={pedal} position={[0, 0.02, -0.02]}>
        <Box s={[0.2, 0.008, 0.09]} c={iron} o={metal} />
        {[-0.06, -0.02, 0.02, 0.06].map((x) => (
          <Box key={x} p={[x, 0.005, 0]} s={[0.012, 0.004, 0.08]} c="#3a3a3a" />
        ))}
      </group>
      <Seg a={[-0.06, 0.025]} b={[TREADLE.x + 0.02, TREADLE.y - 0.02]} z={Z + 0.012} c={iron} w={0.006} />
      <group ref={treadle} position={[TREADLE.x, TREADLE.y, Z]}>
        <Ring s={[TREADLE.r * 2, TREADLE.r * 2, 0.8]} c={iron} o={metal} />
        {[0, Math.PI / 3, (2 * Math.PI) / 3].map((a) => (
          <Box key={a} r={[0, 0, a]} s={[TREADLE.r * 2, 0.006, 0.006]} c="#3a3a3a" />
        ))}
        <Cyl r={[Math.PI / 2, 0, 0]} s={[0.02, 0.02, 0.02]} c="#4a4a4a" o={metal} />
      </group>
      {/* Machine head: bed, pillar, arm and needle head. */}
      <Box p={[0.02, 0.156, 0]} s={[0.3, 0.012, 0.1]} c="#2a2a2c" />
      <Box p={[-0.1, 0.21, 0]} s={[0.055, 0.1, 0.07]} c={black} cast />
      <Box p={[0, 0.272, 0]} s={[0.26, 0.048, 0.062]} c={black} cast />
      <Cyl p={[0, 0.296, 0]} r={[0, 0, Math.PI / 2]} s={[0.05, 0.25, 0.05]} c={black} />
      <Box p={[NEEDLE.x, 0.23, 0]} s={[0.05, 0.1, 0.062]} c={black} cast />
      <Box p={[0, 0.278, -0.0315]} s={[0.2, 0.003, 0.002]} c={gold} />
      <Box p={[0, 0.254, -0.0315]} s={[0.16, 0.002, 0.002]} c={gold} />
      <Marking text="SITARA" p={[-0.02, 0.266, -0.0322]} h={0.014} />
      {/* Bobbin plate with its round window. */}
      <Box p={[0.0, 0.1625, -0.02]} s={[0.05, 0.002, 0.04]} c="#b9bec2" o={metal} />
      <Cyl p={[0.0, 0.1635, -0.02]} s={[0.018, 0.002, 0.018]} c="#c9a13b" o={metal} />
      {/* Cloth under the needle, and the stitches that appear on it. */}
      <Box p={[0.12, CLOTH_Y, -0.01]} s={[0.12, 0.002, 0.075]} c="#8fb8de" />
      {Array.from({ length: STITCHES }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => void (stitches.current[i] = m)}
          geometry={kit.geo.box}
          material={kit.mat(red)}
          position={[NEEDLE.x - 0.04 + i * 0.01, CLOTH_Y + 0.0015, -0.015]}
          scale={[0.006, 0.0012, 0.0015]}
          visible={false}
        />
      ))}
      {/* Needle bar, presser foot and needle. The needle hangs crooked while its screw is missing. */}
      <Box p={[NEEDLE.x, 0.172, -0.018]} s={[0.022, 0.004, 0.022]} c="#9aa0a3" o={metal} />
      <group ref={needleBar} position={[NEEDLE.x, 0.2, -0.02]}>
        <Cyl p={[0, 0, 0]} s={[0.007, 0.03, 0.007]} c="#c9ced1" o={metal} />
        <Cyl p={[0, -0.024, 0]} s={[0.0025, 0.022, 0.0025]} c="#e8ecef" o={metal} />
      </group>
      {!clamp && !passShown && <Cyl p={[NEEDLE.x, 0.19, -0.0335]} r={[Math.PI / 2, 0, 0]} s={[0.006, 0.002, 0.006]} c="#050505" />}
      {(clamp || passShown) && <ClampPart item={clamp ?? 'bolt'} geo={geo} />}
      {/* Hand wheel with chrome rim and spokes. */}
      <group ref={hand} position={[HAND.x, HAND.y, Z]}>
        <Cyl r={[Math.PI / 2, 0, 0]} s={[HAND.r * 2, 0.012, HAND.r * 2]} c="#6d7275" o={metal} />
        <Ring s={[HAND.r * 2, HAND.r * 2, 0.6]} p={[0, 0, -0.007]} c="#c9ced1" o={metal} />
        {[0, Math.PI / 3, (2 * Math.PI) / 3].map((a) => (
          <Box key={a} p={[0, 0, -0.008]} r={[0, 0, a]} s={[HAND.r * 1.7, 0.005, 0.003]} c="#3a3a3a" />
        ))}
      </group>
      {/* Spool on its pin, the thread path, and the two tension discs. */}
      <Cyl p={[0, 0.33, 0]} s={[0.004, 0.02, 0.004]} c="#8a9095" />
      <Cyl p={[0, 0.335, 0]} s={[0.022, 0.028, 0.022]} c="#f2efe6" />
      <Cyl p={[0, 0.335, 0]} s={[0.018, 0.024, 0.018]} c={red} />
      <Cyl p={[DISCS.x, DISCS.y, -0.034]} r={[Math.PI / 2, 0, 0]} s={[0.004, 0.02, 0.004]} c="#8a9095" o={metal} />
      <Cyl p={[DISCS.x, DISCS.y, -0.034]} r={[Math.PI / 2, 0, 0]} s={[0.02, 0.002, 0.02]} c="#c9ced1" o={metal} />
      <Cyl
        p={[DISCS.x, DISCS.y, tension || passShown ? -0.039 : -0.044]}
        r={[Math.PI / 2 + (tension || passShown ? 0 : 0.35), 0, 0]}
        s={[0.02, 0.002, 0.02]}
        c="#c9ced1"
        o={metal}
      />
      <Seg a={[0.01, 0.33]} b={[0.045, 0.3]} z={-0.034} c={red} />
      <Seg a={[0.045, 0.3]} b={[DISCS.x, DISCS.y + 0.004]} z={-0.036} c={red} />
      <Seg a={[DISCS.x, DISCS.y - 0.004]} b={[NEEDLE.x - 0.01, 0.29]} z={-0.036} c={red} />
      <Seg a={[NEEDLE.x - 0.01, 0.29]} b={[NEEDLE.x, 0.21]} z={-0.036} c={red} />
      {(tension || passShown) && <TensionPart item={tension ?? 'spring'} geo={geo} />}
      <group ref={slack}>
        <Ring p={[DISCS.x + 0.01, DISCS.y - 0.02, -0.04]} r={[0, 0, 0]} s={[0.03, 0.03, 0.08]} c={red} />
      </group>
      <group ref={nest} position={[NEEDLE.x, CLOTH_Y + 0.004, -0.015]}>
        {[0, 1, 2, 3].map((i) => (
          <Ring key={i} r={[i * 0.8, i * 0.5, i * 0.3]} s={[0.018, 0.018, 0.08]} c={red} />
        ))}
        <Ball s={[0.01, 0.006, 0.01]} c={red} />
      </group>
      {/* Belt: the snapped old one dangles above and below the table until something replaces it. */}
      <mesh
        ref={beltMesh}
        geometry={beltGeo}
        material={kit.mat(BELT_COLOURS[belt ?? 'innerTube'] ?? '#2a2a2a', { rough: 0.85 })}
        position={[0, 0, Z - 0.012]}
        visible={false}
      />
      {!belt && !passShown && (
        <group>
          <Box p={[HAND.x - 0.042, HAND.y - 0.05, Z - 0.012]} r={[0, 0, 0.12]} s={[0.008, 0.09, 0.006]} c="#6b4a30" />
          <Box p={[HAND.x - 0.036, HAND.y - 0.1, Z - 0.012]} r={[0, 0, 0.5]} s={[0.008, 0.025, 0.006]} c="#6b4a30" />
          <Box p={[TREADLE.x + 0.058, TREADLE.y + 0.035, Z - 0.012]} r={[0, 0, -0.25]} s={[0.008, 0.07, 0.006]} c="#6b4a30" />
          <Box p={[TREADLE.x + 0.075, TREADLE.y + 0.075, Z - 0.012]} r={[0, 0, -0.9]} s={[0.008, 0.025, 0.006]} c="#6b4a30" />
        </group>
      )}
      {belt === 'rubberBand' && (
        <group position={[HAND.x, HAND.y - 0.05, Z - 0.02]} rotation={[Math.PI / 2, 0, 0]} scale={0.5}>
          <ItemModel id="rubberBand" geo={geo} />
        </group>
      )}
    </group>
  )
}

function ClampPart({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  if (item === 'bolt') {
    return (
      <group position={[NEEDLE.x, 0.19, -0.034]}>
        <Cyl r={[Math.PI / 2, 0, 0]} s={[0.014, 0.006, 0.014]} c="#b9bec2" o={{ metal: 0.85, rough: 0.3 }} />
        <Box p={[0, 0, -0.0035]} s={[0.01, 0.0015, 0.001]} c="#555" />
      </group>
    )
  }
  if (item === 'tape') return <Cyl p={[NEEDLE.x, 0.2, -0.02]} s={[0.02, 0.018, 0.02]} c="#e6d9b8" o={{ rough: 0.95 }} />
  return (
    <group position={[NEEDLE.x, 0.19, -0.038]} rotation={[-Math.PI / 2, 0, 0]} scale={0.45}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

function TensionPart({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  const kit = useKit()
  if (item === 'spring') {
    return <mesh geometry={geo.spring} material={kit.mat('#c9ced1', { metal: 0.8, rough: 0.3 })} position={[DISCS.x, DISCS.y, -0.075]} />
  }
  return (
    <group position={[DISCS.x, DISCS.y, -0.046]} rotation={[-Math.PI / 2, 0, 0]} scale={0.45}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}
