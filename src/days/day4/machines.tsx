import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { CatmullRomCurve3, type Group, type Mesh, TubeGeometry, Vector3 } from 'three'
import { ITEMS } from '../../repair/items'
import type { ItemId } from '../../repair/types'
import { useKit } from '../../world/kit'
import { Box, Cyl, Ring } from '../../world/primitives'
import { useDayRun } from '../runner/store'
import { type DayGeometry, ItemModel, testProgress } from '../scene/items'

const TREADLE = { x: -0.12, y: 0.07, r: 0.055 }
const HAND = { x: -0.14, y: 0.25, r: 0.04 }
const Z = -0.045

export const SEWING_POINTS = {
  treadle: [TREADLE.x, TREADLE.y, -0.09],
  treadleWheel: [TREADLE.x, TREADLE.y, -0.09],
  wheel: [HAND.x, HAND.y, -0.08],
  handWheel: [HAND.x, HAND.y, -0.08],
  needle: [0.11, 0.18, -0.06],
  needleClamp: [0.11, 0.18, -0.06],
  thread: [0.07, 0.262, -0.06],
  tensionPost: [0.07, 0.262, -0.06],
  bobbin: [0.03, 0.16, -0.08],
} as const

const BELT_COLOURS: Partial<Record<ItemId, string>> = { innerTube: '#2a2a2a', clothStrip: '#c2455a', tape: '#e6d9b8' }
const BELT_GRADED: readonly ItemId[] = ['innerTube', 'clothStrip', 'tape']

/** A closed belt round the treadle wheel (below) and the hand wheel (above). */
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
    return new TubeGeometry(new CatmullRomCurve3(pts, true, 'centripetal'), 80, 0.005, 6, true)
  }, [])
  useEffect(() => () => geo.dispose(), [geo])
  return geo
}

/** Master Ji's black-and-gold treadle machine on a little stand, front towards the mechanic. */
export function SewingMachine({ geo }: { geo: DayGeometry }) {
  const kit = useKit()
  const beltGeo = useBeltGeometry()
  const treadle = useRef<Group>(null)
  const hand = useRef<Group>(null)
  const needleBar = useRef<Group>(null)
  const tangle = useRef<Group>(null)
  const beltMesh = useRef<Mesh>(null)
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
    const beltOk = shown || (s.placements.belt !== undefined && BELT_GRADED.includes(s.placements.belt))
    const clampOk = shown || ['bolt', 'safetyPin', 'tape'].includes(s.placements.clamp ?? '')
    const tensionOk = shown || ['spring', 'hairClip', 'rubberBand'].includes(s.placements.tension ?? '')
    const recent = s.phase === 'inspecting' && now - s.stepAt < 1400 ? s.seen[s.seen.length - 1] : undefined
    const pedalling = (tp !== null && tp > 0.1) || (shown && s.phase === 'thanks') || recent === 'treadle'
    const sewing = pedalling && beltOk && recent !== 'treadle'

    spin.current.treadle += (pedalling ? 6 : 0) * dt
    spin.current.hand += (sewing ? 9 : 0) * dt
    if (treadle.current) treadle.current.rotation.z = spin.current.treadle
    if (hand.current) hand.current.rotation.z = spin.current.hand
    if (needleBar.current) {
      needleBar.current.position.y = sewing ? Math.sin(spin.current.hand * 2) * 0.008 : 0
      needleBar.current.position.x = (sewing || recent === 'needle') && !clampOk ? Math.sin(now * 0.07) * 0.004 : 0
    }
    if (tangle.current) tangle.current.visible = !tensionOk
    if (beltMesh.current) {
      const b = s.placements.belt
      beltMesh.current.visible = shown || (b !== undefined && ITEMS[b].props.flexibility >= 4 && !ITEMS[b].tags.includes('LOOP'))
    }
  })

  const black = '#1c1c1e'
  const gold = '#c9a13b'
  const wood = '#7a4f2e'
  const metal = { metal: 0.8, rough: 0.3 }
  return (
    <group>
      {/* Stand: table top on four legs, the treadle wheel underneath. */}
      <Box p={[0, 0.14, 0]} s={[0.36, 0.02, 0.2]} c={wood} cast />
      {[0.16, -0.16].flatMap((x) => [0.08, -0.08].map((z) => <Box key={`${x}${z}`} p={[x, 0.065, z]} s={[0.015, 0.13, 0.015]} c="#3a2a1f" />))}
      <Box p={[0, 0.02, 0]} s={[0.34, 0.01, 0.16]} c="#3a2a1f" />
      <group ref={treadle} position={[TREADLE.x, TREADLE.y, Z]}>
        <Ring s={[TREADLE.r * 2, TREADLE.r * 2, 0.6]} c="#2b2b2b" o={metal} />
        {[0, Math.PI / 3, (2 * Math.PI) / 3].map((a) => (
          <Box key={a} r={[0, 0, a]} s={[TREADLE.r * 2, 0.005, 0.005]} c="#3a3a3a" />
        ))}
      </group>
      {/* Machine head: pillar, arm, needle head and a bed plate. */}
      <Box p={[0.02, 0.156, 0]} s={[0.3, 0.012, 0.1]} c="#2a2a2c" />
      <Box p={[-0.1, 0.21, 0]} s={[0.05, 0.1, 0.07]} c={black} cast />
      <Box p={[0, 0.27, 0]} s={[0.25, 0.045, 0.06]} c={black} cast />
      <Box p={[0.11, 0.225, 0]} s={[0.05, 0.1, 0.06]} c={black} cast />
      <Box p={[0, 0.27, -0.031]} s={[0.18, 0.004, 0.002]} c={gold} />
      <Box p={[0, 0.258, -0.031]} s={[0.14, 0.002, 0.002]} c={gold} />
      <Box p={[0.06, 0.159, -0.03]} s={[0.04, 0.002, 0.03]} c="#b9bec2" o={metal} />
      <group ref={needleBar}>
        <Cyl p={[0.11, 0.17, -0.015]} s={[0.006, 0.04, 0.006]} c="#c9ced1" o={metal} />
        <Box p={[0.11, 0.153, -0.015]} s={[0.02, 0.004, 0.02]} c="#9aa0a3" o={metal} />
        {(clamp || passShown) && <ClampPart item={clamp ?? 'bolt'} geo={geo} />}
      </group>
      <group ref={hand} position={[HAND.x, HAND.y, Z]}>
        <Cyl r={[Math.PI / 2, 0, 0]} s={[HAND.r * 2, 0.014, HAND.r * 2]} c="#8a9095" o={metal} />
        <Box s={[HAND.r * 1.6, 0.006, 0.016]} c="#5d6468" />
      </group>
      {/* Spool, thread and the tension post. */}
      <Cyl p={[0, 0.31, 0]} s={[0.02, 0.035, 0.02]} c="#f2efe6" />
      <Cyl p={[0.07, 0.262, -0.033]} r={[Math.PI / 2, 0, 0]} s={[0.018, 0.008, 0.018]} c="#8a9095" o={metal} />
      <Box p={[0.035, 0.29, -0.033]} r={[0, 0, -0.9]} s={[0.075, 0.0015, 0.0015]} c="#b3261e" />
      <Box p={[0.09, 0.215, -0.034]} r={[0, 0, 1.2]} s={[0.1, 0.0015, 0.0015]} c="#b3261e" />
      {(tension || passShown) && <TensionPart item={tension ?? 'spring'} geo={geo} />}
      <group ref={tangle}>
        {[0, 1, 2].map((i) => (
          <Ring key={i} p={[0.125 + i * 0.006, 0.158 + i * 0.004, -0.04]} r={[i, 0.4 * i, 0]} s={[0.02, 0.02, 0.06]} c="#b3261e" />
        ))}
      </group>
      {/* Belt: the snapped old one hangs down until something replaces it. */}
      <mesh
        ref={beltMesh}
        geometry={beltGeo}
        material={kit.mat(BELT_COLOURS[belt ?? 'innerTube'] ?? '#2a2a2a', { rough: 0.85 })}
        position={[0, 0, Z - 0.012]}
        visible={false}
      />
      {!belt && !passShown && (
        <group>
          <Box p={[HAND.x - 0.035, HAND.y - 0.06, Z - 0.012]} r={[0, 0, 0.2]} s={[0.006, 0.08, 0.01]} c="#6b4a30" />
          <Box p={[TREADLE.x + 0.05, TREADLE.y + 0.04, Z - 0.012]} r={[0, 0, -0.3]} s={[0.006, 0.06, 0.01]} c="#6b4a30" />
        </group>
      )}
      {belt === 'rubberBand' && (
        <group position={[TREADLE.x, TREADLE.y + 0.06, Z - 0.02]} rotation={[Math.PI / 2, 0, 0]} scale={0.5}>
          <ItemModel id="rubberBand" geo={geo} />
        </group>
      )}
    </group>
  )
}

function ClampPart({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  if (item === 'bolt') return <Cyl p={[0.11, 0.18, -0.035]} r={[Math.PI / 2, 0, 0]} s={[0.01, 0.03, 0.01]} c="#b9bec2" o={{ metal: 0.85, rough: 0.3 }} />
  if (item === 'tape') return <Cyl p={[0.11, 0.18, -0.015]} s={[0.02, 0.016, 0.02]} c="#e6d9b8" o={{ rough: 0.95 }} />
  return (
    <group position={[0.11, 0.18, -0.04]} rotation={[-Math.PI / 2, 0, 0]} scale={0.45}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}

function TensionPart({ item, geo }: { item: ItemId; geo: DayGeometry }) {
  const kit = useKit()
  if (item === 'spring') {
    return <mesh geometry={geo.spring} material={kit.mat('#c9ced1', { metal: 0.8, rough: 0.3 })} position={[0.07, 0.262, -0.07]} />
  }
  return (
    <group position={[0.07, 0.262, -0.045]} rotation={[-Math.PI / 2, 0, 0]} scale={0.45}>
      <ItemModel id={item} geo={geo} />
    </group>
  )
}
