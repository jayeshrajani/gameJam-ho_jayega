import { useEffect, useMemo } from 'react'
import { CatmullRomCurve3, Curve, QuadraticBezierCurve3, TubeGeometry, Vector3 } from 'three'
import type { ItemId } from '../../repair/types'
import { useKit } from '../../world/kit'
import { Ball, Box, Coil, Cone, Cyl, CylLow, Ring } from '../../world/primitives'
import { useDayRun } from '../runner/store'

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

/** Normalised progress through the current test (0 → 1), or null when not testing. */
export function testProgress(): number | null {
  const s = useDayRun.getState()
  if (s.phase !== 'testing') return null
  return clamp01((performance.now() - s.phaseAt) / Math.max(1, s.testMs))
}

class Helix extends Curve<Vector3> {
  private readonly radius: number
  private readonly length: number
  private readonly turns: number

  constructor(radius: number, length: number, turns: number) {
    super()
    this.radius = radius
    this.length = length
    this.turns = turns
  }

  override getPoint(t: number, target = new Vector3()): Vector3 {
    const a = t * Math.PI * 2 * this.turns
    return target.set(Math.cos(a) * this.radius, Math.sin(a) * this.radius, t * this.length)
  }
}

/** Geometry that only exists while a day is mounted; disposed with it. */
export function useDayGeometry() {
  const geo = useMemo(() => {
    const fanR = 0.062
    const motorR = 0.038
    const pts: Vector3[] = []
    for (let i = 0; i <= 14; i++) {
      const a = -0.12 + (i / 14) * (Math.PI + 0.24)
      pts.push(new Vector3(Math.cos(a) * fanR, 0.43 + Math.sin(a) * fanR, 0))
    }
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI + 0.12 + (i / 10) * (Math.PI - 0.24)
      pts.push(new Vector3(Math.cos(a) * motorR, 0.2 + Math.sin(a) * motorR, 0))
    }
    return {
      belt: new TubeGeometry(new CatmullRomCurve3(pts, true, 'centripetal'), 80, 0.0055, 6, true),
      spring: new TubeGeometry(new Helix(0.011, 0.034, 6), 90, 0.0018, 5, false),
      bridge: new TubeGeometry(
        new QuadraticBezierCurve3(new Vector3(-0.022, 0.09, -0.107), new Vector3(0, 0.055, -0.128), new Vector3(0.022, 0.09, -0.107)),
        24,
        0.0025,
        5,
        false,
      ),
      squiggle: new TubeGeometry(
        new CatmullRomCurve3([
          new Vector3(-0.075, 0.004, 0.012),
          new Vector3(-0.04, 0.004, -0.02),
          new Vector3(0, 0.004, 0.018),
          new Vector3(0.04, 0.004, -0.02),
          new Vector3(0.075, 0.006, 0.01),
        ]),
        40,
        0.0028,
        5,
        false,
      ),
      wrap: new TubeGeometry(new Helix(0.027, 0.03, 3), 60, 0.0022, 5, false),
    }
  }, [])
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])
  return geo
}

export type DayGeometry = ReturnType<typeof useDayGeometry>

/** An item as it looks lying on the bench. */
export function ItemModel({ id, geo }: { id: ItemId; geo: DayGeometry }) {
  const kit = useKit()
  const steel = { metal: 0.85, rough: 0.28 }
  switch (id) {
    case 'rubberBand':
      return (
        <group position={[0, 0.004, 0]}>
          <Ring r={[Math.PI / 2, 0, 0]} s={[0.075, 0.075, 0.14]} c="#c8844a" o={{ rough: 0.9 }} cast />
          <Ring p={[0.004, 0.003, 0.003]} r={[Math.PI / 2 + 0.12, 0.1, 0]} s={[0.07, 0.066, 0.12]} c="#b8743c" o={{ rough: 0.9 }} />
        </group>
      )
    case 'spoon':
      return <Spoon />
    case 'spring':
      return (
        <group>
          <mesh geometry={geo.spring} material={kit.mat('#c9ced1', steel)} rotation={[0, Math.PI / 2, 0]} position={[-0.017, 0.012, 0]} castShadow />
          <Box p={[-0.022, 0.012, 0]} s={[0.01, 0.002, 0.002]} c="#c9ced1" o={steel} />
          <Box p={[0.022, 0.012, 0]} s={[0.01, 0.002, 0.002]} c="#c9ced1" o={steel} />
        </group>
      )
    case 'bottleCap':
      return <BottleCap />
    case 'wire':
      return (
        <group>
          <mesh geometry={geo.squiggle} material={kit.mat('#c27a3a', { metal: 0.6, rough: 0.35 })} castShadow />
          <Ring p={[0.075, 0.006, 0.01]} r={[Math.PI / 2, 0, 0]} s={[0.022, 0.022, 0.12]} c="#c27a3a" o={{ metal: 0.6, rough: 0.35 }} />
        </group>
      )
    case 'steelWire':
      // A straightened clothes hanger: long shank, bent hook at one end.
      return (
        <group position={[0, 0.005, 0]} rotation={[0, 0.3, 0]}>
          <Cyl r={[0, 0, Math.PI / 2]} s={[0.006, 0.26, 0.006]} c="#aeb4b8" o={steel} cast />
          <Cyl p={[0.135, 0, 0.012]} r={[Math.PI / 2, 0, 0.9]} s={[0.006, 0.03, 0.006]} c="#aeb4b8" o={steel} />
          <Ring p={[0.14, 0, 0.03]} r={[Math.PI / 2, 0, 0]} s={[0.03, 0.03, 0.15]} c="#aeb4b8" o={steel} />
        </group>
      )
    case 'woodenStick':
      return (
        <group position={[0, 0.008, 0]} rotation={[0, -0.25, 0]}>
          <Box s={[0.24, 0.012, 0.02]} c="#c49460" cast />
          <Cyl p={[0.12, 0, 0]} s={[0.02, 0.012, 0.02]} c="#c49460" />
          <Cyl p={[-0.12, 0, 0]} s={[0.02, 0.012, 0.02]} c="#c49460" />
          <Box p={[0, 0.0065, 0.003]} s={[0.2, 0.001, 0.0015]} c="#a2743f" />
          <Box p={[0.02, 0.0065, -0.004]} s={[0.15, 0.001, 0.0012]} c="#a2743f" />
        </group>
      )
    case 'tape':
      return (
        <group>
          <Coil r={[Math.PI / 2, 0, 0]} s={[0.075, 0.075, 0.18]} p={[0, 0.013, 0]} c="#e6d9b8" o={{ rough: 0.9 }} cast />
          <Ring r={[Math.PI / 2, 0, 0]} s={[0.045, 0.045, 0.5]} p={[0, 0.013, 0]} c="#9c7a52" o={{ rough: 0.95 }} />
          <Box p={[0.05, 0.002, 0.03]} r={[0, 0.5, 0]} s={[0.06, 0.002, 0.03]} c="#e6d9b8" />
        </group>
      )
    case 'innerTube':
      return (
        <group position={[0, 0.012, 0]} rotation={[0, 0.4, 0]}>
          <Cyl r={[0, 0, Math.PI / 2]} s={[0.024, 0.13, 0.024]} c="#2a2a2a" o={{ rough: 0.95 }} cast />
          <Cyl p={[0.066, 0, 0]} r={[0, 0, Math.PI / 2]} s={[0.014, 0.002, 0.014]} c="#0d0d0d" />
          <Cyl p={[-0.066, 0, 0]} r={[0, 0, Math.PI / 2]} s={[0.014, 0.002, 0.014]} c="#0d0d0d" />
          <Cyl p={[0.02, 0.016, 0]} s={[0.005, 0.012, 0.005]} c="#b9bec2" o={steel} />
          <Cyl p={[0.02, 0.023, 0]} s={[0.007, 0.004, 0.007]} c="#1f1f1f" />
        </group>
      )
    case 'bolt':
      return (
        <group rotation={[0, 0.5, Math.PI / 2]} position={[0, 0.012, 0]}>
          <Cyl s={[0.016, 0.08, 0.016]} c="#b9bec2" o={steel} cast />
          {[-0.03, -0.018, -0.006, 0.006, 0.018].map((y) => (
            <Ring key={y} p={[0, y, 0]} r={[Math.PI / 2, 0, 0]} s={[0.017, 0.017, 0.08]} c="#9ea4a8" o={steel} />
          ))}
          <CylLow p={[0, 0.043, 0]} s={[0.032, 0.012, 0.032]} c="#9ea4a8" o={steel} cast />
        </group>
      )
    case 'penRefill':
      return (
        <group rotation={[0, -0.3, Math.PI / 2]} position={[0, 0.005, 0]}>
          <Cyl s={[0.007, 0.13, 0.007]} c="#dfe7ec" o={{ opacity: 0.75, rough: 0.2 }} cast />
          <Cyl p={[0, 0.02, 0]} s={[0.0045, 0.07, 0.0045]} c="#2f4da8" />
          <Cone p={[0, 0.071, 0]} s={[0.007, 0.012, 0.007]} c="#c9ced1" o={steel} />
        </group>
      )
    case 'clothStrip':
      return (
        <group position={[0, 0.004, 0]} rotation={[0, 0.35, 0]}>
          <Box s={[0.2, 0.006, 0.03]} c="#c2455a" o={{ rough: 0.95 }} cast />
          {[-0.06, 0, 0.06].map((x) => (
            <Box key={x} p={[x, 0.0035, 0]} s={[0.012, 0.001, 0.03]} c="#f0c75e" />
          ))}
          {[-0.009, 0, 0.009].map((z) => (
            <Box key={z} p={[0.106, 0, z]} r={[0, z * 20, 0]} s={[0.014, 0.004, 0.003]} c="#c2455a" />
          ))}
        </group>
      )
    case 'safetyPin':
      return (
        <group position={[0, 0.004, 0]} rotation={[0, 0.4, 0]}>
          <Box p={[0, 0, 0.005]} s={[0.07, 0.003, 0.003]} c="#c9ced1" o={steel} />
          <Box p={[0, 0, -0.005]} s={[0.07, 0.003, 0.003]} c="#c9ced1" o={steel} />
          <Box p={[0.036, 0, 0]} s={[0.012, 0.007, 0.016]} c="#b9bec2" o={steel} />
          <Ring p={[-0.038, 0, 0]} r={[Math.PI / 2, 0, 0]} s={[0.012, 0.012, 0.06]} c="#c9ced1" o={steel} />
        </group>
      )
    case 'hairClip':
      return (
        <group position={[0, 0.006, 0]} rotation={[0, -0.5, 0]}>
          <Box s={[0.06, 0.004, 0.012]} c="#2a2a2a" o={{ metal: 0.6, rough: 0.4 }} cast />
          <Box p={[0, 0.006, 0]} r={[0, 0, 0.15]} s={[0.058, 0.003, 0.01]} c="#3a3a3a" o={{ metal: 0.6, rough: 0.4 }} />
          <Ball p={[0.028, 0.003, 0]} s={[0.008, 0.008, 0.013]} c="#8a2a4a" />
        </group>
      )
    case 'nylonRope':
      return (
        <group>
          <Coil r={[Math.PI / 2, 0, 0]} s={[0.1, 0.1, 0.25]} p={[0, 0.012, 0]} c="#d8c99a" o={{ rough: 0.95 }} cast />
          <Coil r={[Math.PI / 2, 0, 0]} s={[0.075, 0.075, 0.25]} p={[0, 0.02, 0]} c="#cbb987" o={{ rough: 0.95 }} />
          <Cyl p={[0.07, 0.006, 0.03]} r={[0, 0.5, Math.PI / 2]} s={[0.008, 0.06, 0.008]} c="#d8c99a" o={{ rough: 0.95 }} />
        </group>
      )
    case 'coin':
      return (
        <group position={[0, 0.003, 0]}>
          <Cyl s={[0.03, 0.004, 0.03]} c="#c9a13b" o={{ metal: 0.9, rough: 0.25 }} cast />
          <Ring p={[0, 0.002, 0]} r={[Math.PI / 2, 0, 0]} s={[0.028, 0.028, 0.05]} c="#a8852c" o={{ metal: 0.9, rough: 0.3 }} />
          <Box p={[0, 0.0025, 0]} s={[0.003, 0.0008, 0.012]} c="#a8852c" />
        </group>
      )
    case 'sodaCan':
      return (
        <group position={[0, 0.003, 0]} rotation={[0, 0.3, 0]}>
          <Box s={[0.1, 0.004, 0.07]} c="#c0392b" o={{ metal: 0.7, rough: 0.3 }} cast />
          <Box p={[0.035, 0.003, 0]} s={[0.025, 0.002, 0.07]} c="#c9ced1" o={steel} />
          <Box p={[-0.02, 0.0025, 0]} s={[0.04, 0.001, 0.02]} c="#f2efe6" />
        </group>
      )
    case 'brick':
      return (
        <group position={[0, 0.03, 0]} rotation={[0, 0.2, 0]}>
          <Box s={[0.12, 0.06, 0.06]} c="#a2412c" o={{ rough: 0.95 }} cast />
          <Box p={[0, 0.0305, 0]} s={[0.07, 0.002, 0.03]} c="#7a2e1f" />
          <Box p={[0.04, -0.01, 0.0305]} s={[0.02, 0.012, 0.001]} c="#c9b8a0" />
        </group>
      )
    case 'chewingGum':
      return (
        <group position={[0, 0.008, 0]}>
          <Ball s={[0.025, 0.014, 0.02]} c="#ff8fb5" o={{ rough: 0.6 }} cast />
          <Ball p={[0.008, 0.004, 0.004]} s={[0.01, 0.008, 0.01]} c="#ffa3c3" o={{ rough: 0.6 }} />
        </group>
      )
    case 'cyclePump':
      return (
        <group position={[0, 0.012, 0]} rotation={[0, 0.4, Math.PI / 2]}>
          <Cyl s={[0.022, 0.13, 0.022]} c="#2f6f8f" cast />
          <Cyl p={[0, 0.07, 0]} s={[0.006, 0.02, 0.006]} c="#b9bec2" o={steel} />
          <Box p={[0, 0.082, 0]} s={[0.06, 0.012, 0.012]} c="#1f1f1f" />
          <Cyl p={[0, -0.068, 0]} s={[0.026, 0.006, 0.026]} c="#1f1f1f" />
          <Ring p={[0.03, -0.06, 0]} r={[0, 0, 0]} s={[0.05, 0.05, 0.2]} c="#1f1f1f" />
        </group>
      )
    case 'fuseStrand':
      return (
        <group position={[0, 0.003, 0]} rotation={[0, 0.35, 0]}>
          <Cyl r={[0, 0, Math.PI / 2]} s={[0.0022, 0.16, 0.0022]} c="#e0894a" o={{ metal: 0.8, rough: 0.25 }} cast />
          <Ring p={[0.085, 0, 0]} r={[Math.PI / 2, 0, 0]} s={[0.012, 0.012, 0.15]} c="#e0894a" o={{ metal: 0.8, rough: 0.25 }} />
          <Box p={[-0.02, -0.002, 0.012]} s={[0.05, 0.001, 0.02]} c="#f2efe6" />
        </group>
      )
  }
}

export function Spoon() {
  const steel = { metal: 0.85, rough: 0.25 }
  return (
    <group>
      <Ball p={[0.055, 0.006, 0]} s={[0.05, 0.012, 0.036]} c="#cfd4d7" o={steel} cast />
      <Ball p={[0.055, 0.0105, 0]} s={[0.04, 0.004, 0.028]} c="#b9bec2" o={steel} />
      <Box p={[0.02, 0.005, 0]} s={[0.03, 0.004, 0.008]} c="#cfd4d7" o={steel} />
      <Box p={[-0.03, 0.005, 0]} s={[0.08, 0.005, 0.013]} c="#cfd4d7" o={steel} cast />
      <Cyl p={[-0.07, 0.005, 0]} s={[0.016, 0.005, 0.016]} c="#cfd4d7" o={steel} />
    </group>
  )
}

export function BottleCap() {
  return (
    <group>
      <Cyl p={[0, 0.007, 0]} s={[0.045, 0.014, 0.045]} c="#1f7a3a" o={{ metal: 0.3, rough: 0.5 }} cast />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return <Box key={i} p={[Math.cos(a) * 0.0235, 0.005, Math.sin(a) * 0.0235]} r={[0, -a, 0]} s={[0.003, 0.01, 0.008]} c="#1a6a32" />
      })}
      <Cyl p={[0, 0.0145, 0]} s={[0.036, 0.002, 0.036]} c="#e8e2d0" />
      <Cyl p={[0, 0.0158, 0]} s={[0.02, 0.001, 0.02]} c="#c0392b" />
    </group>
  )
}
