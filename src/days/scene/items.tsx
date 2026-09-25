import { useEffect, useMemo } from 'react'
import { CatmullRomCurve3, Curve, QuadraticBezierCurve3, TubeGeometry, Vector3 } from 'three'
import type { ItemId } from '../../repair/types'
import { useKit } from '../../world/kit'
import { Ball, Box, Coil, Cyl, Ring } from '../../world/primitives'
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
  switch (id) {
    case 'rubberBand':
      return <Ring r={[Math.PI / 2, 0, 0]} s={[0.075, 0.075, 0.12]} p={[0, 0.004, 0]} c="#c8844a" o={{ rough: 0.9 }} cast />
    case 'spoon':
      return <Spoon />
    case 'spring':
      return (
        <mesh
          geometry={geo.spring}
          material={kit.mat('#c9ced1', { metal: 0.8, rough: 0.3 })}
          rotation={[0, Math.PI / 2, 0]}
          position={[-0.017, 0.012, 0]}
          castShadow
        />
      )
    case 'bottleCap':
      return <BottleCap />
    case 'wire':
      return <mesh geometry={geo.squiggle} material={kit.mat('#c27a3a', { metal: 0.6, rough: 0.35 })} castShadow />
    case 'steelWire':
      return <Cyl p={[0, 0.005, 0]} r={[0, 0.3, Math.PI / 2]} s={[0.006, 0.3, 0.006]} c="#aeb4b8" o={{ metal: 0.8, rough: 0.3 }} cast />
    case 'woodenStick':
      return <Box p={[0, 0.008, 0]} r={[0, -0.25, 0]} s={[0.26, 0.014, 0.018]} c="#b98a55" cast />
    case 'tape':
      return (
        <group>
          <Coil r={[Math.PI / 2, 0, 0]} s={[0.075, 0.075, 0.18]} p={[0, 0.013, 0]} c="#e6d9b8" o={{ rough: 0.9 }} cast />
          <Box p={[0.05, 0.002, 0.03]} r={[0, 0.5, 0]} s={[0.06, 0.002, 0.03]} c="#e6d9b8" />
        </group>
      )
    case 'innerTube':
      return <Cyl p={[0, 0.012, 0]} r={[0, 0.4, Math.PI / 2]} s={[0.024, 0.13, 0.024]} c="#2a2a2a" o={{ rough: 0.95 }} cast />
    case 'bolt':
      return (
        <group rotation={[0, 0.5, Math.PI / 2]} position={[0, 0.012, 0]}>
          <Cyl s={[0.016, 0.08, 0.016]} c="#b9bec2" o={{ metal: 0.85, rough: 0.3 }} cast />
          <Cyl p={[0, 0.043, 0]} s={[0.03, 0.01, 0.03]} c="#9ea4a8" o={{ metal: 0.85, rough: 0.3 }} cast />
        </group>
      )
    case 'penRefill':
      return (
        <group rotation={[0, -0.3, Math.PI / 2]} position={[0, 0.005, 0]}>
          <Cyl s={[0.007, 0.13, 0.007]} c="#dfe7ec" o={{ opacity: 0.8, rough: 0.2 }} cast />
          <Cyl p={[0, 0.06, 0]} s={[0.004, 0.012, 0.004]} c="#2f4da8" />
        </group>
      )
  }
}

export function Spoon() {
  return (
    <group>
      <Ball p={[0.055, 0.006, 0]} s={[0.05, 0.012, 0.036]} c="#cfd4d7" o={{ metal: 0.85, rough: 0.25 }} cast />
      <Box p={[-0.02, 0.005, 0]} s={[0.12, 0.005, 0.013]} c="#cfd4d7" o={{ metal: 0.85, rough: 0.25 }} cast />
    </group>
  )
}

export function BottleCap() {
  return (
    <group>
      <Cyl p={[0, 0.007, 0]} s={[0.045, 0.014, 0.045]} c="#1f7a3a" o={{ metal: 0.3, rough: 0.5 }} cast />
      <Cyl p={[0, 0.0145, 0]} s={[0.036, 0.002, 0.036]} c="#e8e2d0" />
    </group>
  )
}
