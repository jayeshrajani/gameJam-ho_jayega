import { DoubleSide } from 'three'
import { Sway } from './ambient'
import { ArchWindow, Awning, Building, PLINTH, Pot, RectWindow, Rod, SignBoard, Wire } from './architecture'
import { Ball, Box, Coil, Cone, Cyl, CylLow, Ico, Plane, Ring, Taper, type V3 } from './primitives'
import type { ShopRig } from './rig'

export const CHAI_ORIGIN: V3 = [-4.45, PLINTH, -0.25]
/** World position of the chai kettle lid, used for steam. */
export const KETTLE_TOP: V3 = [CHAI_ORIGIN[0] - 1.1, PLINTH + 1.62, CHAI_ORIGIN[2] + 0.4]

export function Street({ rig }: { rig: ShopRig }) {
  return (
    <>
      <Ground />
      <ChaiStall />
      <PartsShop />
      <TailorShop />
      <GeneralStore />
      <Fillers />
      <Poles />
      <NeemTree p={[12.9, PLINTH, 0.7]} />
      <Bicycle p={[3.6, PLINTH, 0.82]} />
      <Backdrop />
      <OppositeRow rig={rig} />
    </>
  )
}

function Ground() {
  return (
    <>
      <Plane p={[0, 0, 5.6]} r={[-Math.PI / 2, 0, 0]} s={[90, 9.4]} t="asphalt" recv />
      <Box p={[0, PLINTH / 2, 0.55]} s={[90, PLINTH, 1.3]} t="slab" recv />
      <Box p={[0, 0.05, 1.24]} s={[90, 0.1, 0.1]} c="#5f5850" />
      <Box p={[0, PLINTH / 2, 11.0]} s={[90, PLINTH, 1.3]} t="slab" recv />
      <Plane p={[0, -0.02, 0]} r={[-Math.PI / 2, 0, 0]} s={[200, 200]} c="#a8927a" />
    </>
  )
}

function ChaiStall() {
  const [x, , z] = CHAI_ORIGIN
  return (
    <Building x={x} z={z} w={4.3} h={6.2} gh={3.3} color="#E4AE94" trim="#f4e4cc" openW={3.3} openH={2.6} interior="#6a4e3c" tank={-0.6}>
      <SignBoard p={[0, 2.95, 0.06]} w={2.6} h={0.62} t="chaiSign" frame="#b3261e" />
      <Awning p={[0, 2.6, 0.1]} w={3.6} depth={1.05} tilt={0.32} t="chaiAwning" poles phase={0.3} />
      {/* Counter and the tea setup. */}
      <Box p={[-0.3, 0.5, 0.4]} s={[2.6, 1.0, 0.7]} c="#3f6f8f" cast recv />
      <Box p={[-0.3, 1.02, 0.4]} s={[2.7, 0.04, 0.8]} c="#c9ccce" o={{ metal: 0.6, rough: 0.35 }} recv />
      <Box p={[-0.3, 0.5, 0.756]} s={[2.4, 0.12, 0.01]} c="#f2c14e" />
      <Cyl p={[-1.1, 1.1, 0.4]} s={[0.36, 0.12, 0.36]} c="#303030" />
      <Taper p={[-1.1, 1.33, 0.4]} s={[0.3, 0.34, 0.3]} c="#c8cdd0" o={{ metal: 0.65, rough: 0.3 }} cast />
      <Cone p={[-1.1, 1.55, 0.4]} s={[0.2, 0.1, 0.2]} c="#b9bfc2" o={{ metal: 0.6, rough: 0.3 }} />
      <Cyl p={[-0.93, 1.39, 0.4]} r={[0, 0, -0.9]} s={[0.035, 0.22, 0.035]} c="#b9bfc2" o={{ metal: 0.6 }} />
      <Cyl p={[0.1, 1.1, 0.4]} s={[0.64, 0.12, 0.64]} c="#2a2a2a" o={{ metal: 0.5, rough: 0.4 }} cast />
      <Cyl p={[0.1, 1.165, 0.4]} s={[0.57, 0.02, 0.57]} t="poha" />
      {[0.55, 0.65, 0.75, 0.85, 0.95].map((gx, i) => (
        <Cyl key={gx} p={[gx, 1.1, 0.62]} s={[0.07, 0.11, 0.07]} c={i % 2 ? '#b07a45' : '#e6eeee'} o={{ rough: 0.3 }} />
      ))}
      <Cyl p={[0.75, 1.2, 0.25]} s={[0.2, 0.3, 0.2]} c="#e8f0f0" o={{ opacity: 0.55, rough: 0.2 }} />
      <Cyl p={[0.75, 1.37, 0.25]} s={[0.21, 0.04, 0.21]} c="#c0392b" />
      {/* Back shelf with jars. */}
      <Box p={[0, 1.5, -1.75]} s={[3.0, 0.04, 0.3]} c="#6b4e38" />
      {[-1.1, -0.6, -0.1, 0.4, 0.9].map((jx, i) => (
        <Cyl key={jx} p={[jx, 1.64, -1.75]} s={[0.18, 0.24, 0.18]} c={['#e3b04b', '#d35400', '#f5f0e1', '#8e5b3a', '#27ae60'][i]} />
      ))}
      {/* Customer bench. */}
      <Box p={[1.35, 0.45, 1.0]} s={[1.0, 0.06, 0.34]} c="#8a5a3b" cast />
      {[0.95, 1.75].map((bx) => (
        <Box key={bx} p={[bx, 0.22, 1.0]} s={[0.06, 0.44, 0.3]} c="#5c3d28" />
      ))}
      {/* Balcony. */}
      <Box p={[0.3, 3.92, 0.38]} s={[2.4, 0.12, 0.8]} c="#e9d3bd" cast recv />
      {Array.from({ length: 11 }, (_, i) => (
        <Box key={i} p={[0.3 - 1.15 + i * 0.23, 4.36, 0.74]} s={[0.035, 0.76, 0.035]} c="#387C78" />
      ))}
      {[-0.85, 1.45].map((sx) =>
        [0.2, 0.47].map((sz) => <Box key={`${sx}${sz}`} p={[sx, 4.36, sz]} s={[0.035, 0.76, 0.035]} c="#387C78" />),
      )}
      <Box p={[0.3, 4.76, 0.74]} s={[2.4, 0.05, 0.06]} c="#387C78" cast />
      <Box p={[-0.85, 4.76, 0.4]} s={[0.05, 0.05, 0.7]} c="#387C78" />
      <Box p={[1.45, 4.76, 0.4]} s={[0.05, 0.05, 0.7]} c="#387C78" />
      <ArchWindow p={[0.3, 3.99, 0]} w={0.95} h={1.95} shutter="#7a4b2a" openL={0.9} openR={1.2} curtain="#3e7cb1" grille={false} />
      <Sway axis="x" amp={0.05} speed={1.2} position={[-0.25, 4.78, 0.77]}>
        <Box p={[0, -0.24, 0]} s={[0.55, 0.48, 0.015]} c="#d94f70" cast />
      </Sway>
      <Sway axis="x" amp={0.06} speed={1.35} phase={1.3} position={[0.6, 4.78, 0.77]}>
        <Box p={[0, -0.32, 0]} s={[0.38, 0.62, 0.015]} c="#f2c14e" cast />
      </Sway>
      <Pot p={[1.2, 3.98, 0.45]} />
      <Pot p={[-0.6, 3.98, 0.5]} scale={0.8} leaf="#6fa04f" />
      <ArchWindow p={[-1.55, 4.3, 0]} w={0.72} h={1.3} shutter="#5b8a6f" openL={1.3} openR={1.4} />
    </Building>
  )
}

function PartsShop() {
  return (
    <Building x={-9.0} z={0.05} w={4.8} h={7.6} color="#B7C79E" trim="#e8efd8" openW={3.6} openH={2.7} interior="#4f463d" tank={0.5}>
      <SignBoard p={[0, 3.05, 0.06]} w={2.6} h={0.62} t="partsSign" frame="#f5c518" />
      <Awning p={[0, 2.72, 0.08]} w={4.0} depth={1.1} tilt={0.2} t="tarp" valance={0} poles />
      <Box p={[0, 0.72, 0.62]} s={[2.9, 0.05, 0.62]} c="#6b4e38" cast recv />
      {[-1.35, 1.35].map((lx) =>
        [0.38, 0.86].map((lz) => <Box key={`${lx}${lz}`} p={[lx, 0.36, lz]} s={[0.05, 0.72, 0.05]} c="#4d3829" />),
      )}
      <group position={[-1.1, 0.745, 0.6]}>
        <Box p={[0, 0.21, 0]} s={[0.3, 0.42, 0.26]} c="#1f1f1f" cast />
        <Ring p={[0, 0.27, 0.132]} s={[0.2, 0.2, 0.3]} c="#555" />
        <Cyl p={[0, 0.27, 0.13]} r={[Math.PI / 2, 0, 0]} s={[0.16, 0.01, 0.16]} c="#3a3a3a" />
        <Cyl p={[0, 0.1, 0.13]} r={[Math.PI / 2, 0, 0]} s={[0.08, 0.01, 0.08]} c="#3a3a3a" />
      </group>
      <Cyl p={[-0.55, 0.77, 0.6]} s={[0.32, 0.05, 0.32]} c="#8a8f93" o={{ metal: 0.7, rough: 0.4 }} />
      <Cyl p={[-0.55, 0.81, 0.6]} s={[0.18, 0.04, 0.18]} c="#a2a7aa" o={{ metal: 0.7, rough: 0.4 }} />
      <Cyl p={[0, 0.87, 0.62]} r={[0, 0, Math.PI / 2]} s={[0.24, 0.34, 0.24]} c="#2f6f5f" o={{ metal: 0.5 }} cast />
      <Cyl p={[0.2, 0.87, 0.62]} r={[0, 0, Math.PI / 2]} s={[0.03, 0.12, 0.03]} c="#ccc" o={{ metal: 0.8 }} />
      <Cyl p={[0.5, 0.765, 0.52]} s={[0.34, 0.03, 0.34]} c="#d0d4d6" o={{ metal: 0.85, rough: 0.25 }} />
      <Box p={[0.95, 0.85, 0.62]} s={[0.34, 0.2, 0.16]} c="#7a3d24" />
      <Box p={[0.95, 1.05, 0.62]} s={[0.3, 0.18, 0.15]} c="#2f5d8a" />
      <Box p={[1.55, 0.13, 0.9]} s={[0.32, 0.22, 0.2]} c="#1a1a1a" cast />
      <Cyl p={[1.46, 0.26, 0.9]} s={[0.04, 0.04, 0.04]} c="#c0392b" />
      <Cyl p={[1.64, 0.26, 0.9]} s={[0.04, 0.04, 0.04]} c="#222" />
      <Coil p={[-1.55, 0.05, 0.9]} r={[Math.PI / 2, 0, 0]} s={[0.3, 0.3, 0.25]} c="#222" />
      <Coil p={[-1.55, 2.1, 0.1]} s={[0.55, 0.55, 0.7]} c="#1c1c1c" cast />
      <Coil p={[1.55, 1.95, 0.1]} s={[0.5, 0.5, 0.7]} c="#1c1c1c" cast />
      {/* Inside: stacked parts boxes. */}
      {[-1.2, -0.4, 0.4, 1.2].map((ix, i) => (
        <Box key={ix} p={[ix, 0.35 + (i % 2) * 0.1, -1.5]} s={[0.6, 0.7 + (i % 2) * 0.2, 0.5]} c={['#b98f5f', '#8a6a48', '#c79f6b', '#6f5a45'][i]} />
      ))}
      <RectWindow p={[-1.2, 4.1, 0]} w={0.9} h={1.3} />
      <RectWindow p={[1.2, 4.1, 0]} w={0.9} h={1.3} glass="#4a5856" />
      <group position={[0, 4.4, 0.2]}>
        <Box s={[0.8, 0.55, 0.3]} c="#efefe9" cast />
        <Ring p={[0.12, 0, 0.16]} s={[0.36, 0.36, 0.3]} c="#9a9a94" />
      </group>
      <ArchWindow p={[-1.2, 5.85, 0]} w={0.8} h={1.3} shutter="#8a6a48" openL={1.2} openR={1.2} />
      <ArchWindow p={[1.2, 5.85, 0]} w={0.8} h={1.3} shutter="#8a6a48" openL={0.2} openR={0.2} />
    </Building>
  )
}

const GARMENTS = ['#d94f70', '#f2c14e', '#3e7cb1', '#f7f3ea']

function TailorShop() {
  return (
    <Building x={4.4} z={0.25} w={4.2} h={6.6} color="#A4C3C9" trim="#f2f0e6" openW={3.0} openH={2.7} interior="#5d4b54" tank={0.2}>
      <SignBoard p={[0, 3.05, 0.06]} w={2.4} h={0.6} t="tailorSign" frame="#f2c14e" />
      <Awning p={[0, 2.72, 0.08]} w={3.4} depth={0.85} tilt={0.3} t="tailorAwning" phase={2} />
      <Cyl p={[0, 2.42, 0.3]} r={[0, 0, Math.PI / 2]} s={[0.03, 2.7, 0.03]} c="#7f8c8d" o={{ metal: 0.6 }} />
      {[-1.0, -0.33, 0.33, 1.0].map((gx, i) => (
        <Sway key={gx} axis="x" amp={0.07} speed={1.1 + i * 0.13} phase={i * 1.7} position={[gx, 2.42, 0.3]}>
          <Box p={[0, -0.05, 0]} s={[0.02, 0.1, 0.02]} c="#555" />
          <Box p={[0, -0.18, 0]} s={[0.62, 0.13, 0.03]} c={GARMENTS[i]} cast />
          <Box p={[0, -0.55, 0]} s={[0.4, 0.74, 0.03]} c={GARMENTS[i]} cast />
          <Box p={[0, -0.2, 0.017]} s={[0.12, 0.08, 0.005]} c="#ffffff" o={{ opacity: 0.6 }} />
        </Sway>
      ))}
      {/* Dress form. */}
      <group position={[1.05, 0, -0.35]}>
        <Cyl p={[0, 0.03, 0]} s={[0.36, 0.06, 0.36]} c="#3a2e28" />
        <Cyl p={[0, 0.55, 0]} s={[0.035, 1.0, 0.035]} c="#8a6a48" />
        <Taper p={[0, 1.3, 0]} r={[Math.PI, 0, 0]} s={[0.42, 0.6, 0.3]} c="#883D3B" cast />
        <Cyl p={[0, 1.66, 0]} s={[0.08, 0.12, 0.08]} c="#e6d7c0" />
      </group>
      {/* Sewing machine on its table. */}
      <group position={[-0.6, 0, -1.2]}>
        <Box p={[0, 0.74, 0]} s={[0.9, 0.05, 0.5]} c="#6b4e38" />
        <Box p={[-0.38, 0.37, 0]} s={[0.05, 0.74, 0.45]} c="#2a2a2a" />
        <Box p={[0.38, 0.37, 0]} s={[0.05, 0.74, 0.45]} c="#2a2a2a" />
        <Box p={[0, 0.8, 0]} s={[0.42, 0.07, 0.18]} c="#1b1b1b" o={{ rough: 0.35 }} />
        <Box p={[0.16, 0.93, 0]} s={[0.08, 0.22, 0.12]} c="#1b1b1b" o={{ rough: 0.35 }} />
        <Box p={[0, 1.02, 0]} s={[0.38, 0.07, 0.1]} c="#1b1b1b" o={{ rough: 0.35 }} />
        <Box p={[0, 1.02, 0.052]} s={[0.2, 0.02, 0.005]} c="#d5a23b" />
        <Cyl p={[0.23, 0.95, 0]} r={[0, 0, Math.PI / 2]} s={[0.14, 0.03, 0.14]} c="#555" o={{ metal: 0.6 }} />
      </group>
      <ArchWindow p={[-1.0, 4.05, 0]} w={0.85} h={1.5} shutter="#8c5a3c" openL={1.2} openR={0.4} curtain="#f2c14e" pot />
      <ArchWindow p={[1.0, 4.05, 0]} w={0.85} h={1.5} shutter="#8c5a3c" openL={1.3} openR={1.3} />
    </Building>
  )
}

function GeneralStore() {
  return (
    <Building x={9.0} z={-0.1} w={5.0} h={8.0} gh={3.5} color="#D8B067" trim="#f6ebcf" openW={3.8} openH={2.8} interior="#5a4838" tank={-0.4}>
      <SignBoard p={[0, 3.18, 0.06]} w={2.8} h={0.66} t="generalSign" frame="#1f7a3a" />
      <Box p={[0, 2.05, 0.05]} s={[3.8, 1.1, 0.03]} t="shutterStatic" o={{ color: '#b7bbba', metal: 0.3, rough: 0.5 }} cast />
      <Box p={[0, 2.72, 0.12]} s={[4.0, 0.25, 0.22]} c="#8d9392" o={{ metal: 0.35 }} />
      {[-1.7, -1.45, 1.7].map((px, i) => (
        <Sway key={px} axis="x" amp={0.05} speed={1.4} phase={i} position={[px, 2.55, 0.25]}>
          <Plane p={[0, -0.7, 0]} s={[0.22, 1.4]} t="packets" o={{ side: DoubleSide }} />
        </Sway>
      ))}
      {[
        [-0.9, '#e5b53a'],
        [-0.4, '#f3efe2'],
        [0.1, '#b3261e'],
      ].map(([sx, grain]) => (
        <group key={sx as number} position={[sx as number, 0, 0.55]}>
          <Taper p={[0, 0.3, 0]} r={[Math.PI, 0, 0]} s={[0.42, 0.6, 0.42]} c="#c9a66b" cast />
          <Cyl p={[0, 0.58, 0]} s={[0.36, 0.04, 0.36]} c={grain as string} />
        </group>
      ))}
      <Box p={[1.1, 0.25, 0.5]} s={[0.5, 0.5, 0.4]} c="#2f5d8a" cast />
      <Box p={[1.15, 0.7, 0.5]} s={[0.46, 0.4, 0.38]} c="#c0392b" cast />
      <Box p={[1.6, 0.2, 0.55]} s={[0.36, 0.4, 0.36]} c="#27ae60" cast />
      {[-1.5, 0, 1.5].map((wx) => (
        <RectWindow key={wx} p={[wx, 4.2, 0]} w={0.85} h={1.25} />
      ))}
      {[-1.5, 0, 1.5].map((wx) => (
        <RectWindow key={wx} p={[wx, 6.05, 0]} w={0.85} h={1.2} glass="#4a5856" />
      ))}
      <group position={[2.05, 5.6, 0.35]}>
        <Box p={[0, 0, -0.15]} s={[0.04, 0.04, 0.3]} c="#555" />
        <Ball r={[0, -0.6, 0]} s={[0.5, 0.5, 0.12]} c="#e8e8e2" cast />
      </group>
    </Building>
  )
}

interface FillerSpec {
  x: number
  w: number
  h: number
  color: string
  shutter: string
}

const FILLERS: FillerSpec[] = [
  { x: -14.5, w: 6.0, h: 6.4, color: '#cdb89e', shutter: '#9ea7a5' },
  { x: -20.6, w: 6.2, h: 7.9, color: '#b6cfcc', shutter: '#b19a7a' },
  { x: -26.8, w: 6.2, h: 6.2, color: '#e3c29d', shutter: '#8f9ea0' },
  { x: 14.6, w: 6.2, h: 6.9, color: '#d4c3dc', shutter: '#9ea7a5' },
  { x: 20.8, w: 6.2, h: 7.3, color: '#c7d8ae', shutter: '#a5968a' },
  { x: 27.0, w: 6.2, h: 6.0, color: '#e8cea6', shutter: '#9ea7a5' },
]

function Fillers() {
  return (
    <>
      {FILLERS.map((f, i) => (
        <Building key={f.x} x={f.x} z={i % 2 ? -0.2 : 0.1} w={f.w} h={f.h} color={f.color} trim="#f1e7d2" tank={i % 3 ? 0.3 : null}>
          {[-1.45, 1.45].map((sx) => (
            <Box key={sx} p={[sx, 1.3, 0.02]} s={[2.4, 2.6, 0.03]} t="shutterStatic" o={{ color: f.shutter, metal: 0.3 }} />
          ))}
          {[-1.8, 0, 1.8].map((wx) => (
            <RectWindow key={wx} p={[wx, 4.1, 0]} w={0.8} h={1.2} glass={i % 2 ? '#3c4847' : '#34403f'} />
          ))}
        </Building>
      ))}
    </>
  )
}

function Pole({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <Box p={[0, 4.0, 0]} s={[0.2, 8.0, 0.2]} c="#a3a097" cast />
      <Box p={[0, 7.45, 0]} s={[1.3, 0.08, 0.1]} c="#6d6a62" />
      {[-0.55, -0.2, 0.2, 0.55].map((ix) => (
        <Cyl key={ix} p={[ix, 7.54, 0]} s={[0.05, 0.1, 0.05]} c="#e8e4da" />
      ))}
      <Box p={[0, 6.2, 0.35]} r={[0.35, 0, 0]} s={[0.05, 0.05, 0.8]} c="#555" />
      <Box p={[0, 6.34, 0.72]} s={[0.12, 0.06, 0.3]} c="#4a4a4a" />
      <Box p={[0, 1.4, 0.13]} s={[0.3, 0.4, 0.06]} c="#b3261e" />
    </group>
  )
}

function Poles() {
  const a: V3 = [-6.6, 7.8, 1.0]
  const b: V3 = [7.3, 7.8, 1.05]
  return (
    <>
      <Pole p={[a[0], PLINTH, a[2]]} />
      <Pole p={[b[0], PLINTH, b[2]]} />
      <Wire from={[a[0] - 0.55, a[1], a[2]]} to={[b[0] - 0.55, b[1], b[2]]} sag={0.55} />
      <Wire from={[a[0] + 0.2, a[1], a[2]]} to={[b[0] + 0.2, b[1], b[2]]} sag={0.62} />
      <Wire from={[a[0], 7.0, 1.08]} to={[b[0], 6.95, 1.12]} sag={0.9} radius={0.02} color="#2a2522" />
      <Wire from={[a[0], 7.0, 1.08]} to={[-1.8, 6.4, 0.08]} sag={0.25} radius={0.01} />
      <Wire from={[b[0], 7.0, 1.12]} to={[4.9, 5.9, 0.3]} sag={0.2} radius={0.01} />
      <Wire from={[a[0] - 0.55, a[1], a[2]]} to={[-21, 7.4, 1.0]} sag={0.7} />
      <Wire from={[b[0] + 0.55, b[1], b[2]]} to={[21, 7.4, 1.1]} sag={0.7} />
      <Wire from={[a[0] + 0.55, a[1], a[2]]} to={[-9, 8.2, 16]} sag={0.6} />
      <Wire from={[b[0] - 0.2, b[1], b[2]]} to={[5, 8.4, 16]} sag={0.7} />
      <Wire from={[b[0] + 0.55, b[1], b[2]]} to={[10.5, 5.7, -0.05]} sag={0.2} radius={0.01} />
    </>
  )
}

function NeemTree({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <Cyl p={[0, 0.22, 0]} s={[1.1, 0.44, 1.1]} c="#a3553c" recv />
      <Cyl p={[0, 0.45, 0]} s={[1.0, 0.02, 1.0]} c="#6b5a45" />
      <Taper p={[0, 1.8, 0]} s={[0.36, 3.4, 0.36]} c="#5b4636" cast />
      <Box p={[0.35, 3.2, 0]} r={[0, 0, -0.7]} s={[0.12, 1.2, 0.12]} c="#5b4636" />
      <Box p={[-0.3, 3.4, 0.1]} r={[0.2, 0, 0.6]} s={[0.1, 1.0, 0.1]} c="#5b4636" />
      <Ico p={[0, 4.4, 0]} s={[2.6, 2.0, 2.4]} c="#5f8a47" o={{ flat: true }} cast />
      <Ico p={[0.9, 3.9, 0.3]} s={[1.8, 1.5, 1.7]} c="#6f9a52" o={{ flat: true }} cast />
      <Ico p={[-0.9, 4.0, -0.2]} s={[1.9, 1.5, 1.8]} c="#56803f" o={{ flat: true }} cast />
      <Ico p={[0.2, 5.2, -0.1]} s={[1.6, 1.2, 1.5]} c="#7aa65a" o={{ flat: true }} cast />
    </group>
  )
}

function Bicycle({ p }: { p: V3 }) {
  const frame = '#1f2426'
  const R: [number, number] = [-0.52, 0.34]
  const F: [number, number] = [0.52, 0.34]
  const B: [number, number] = [-0.06, 0.3]
  const S: [number, number] = [-0.2, 0.86]
  const Ht: [number, number] = [0.36, 0.9]
  const Hb: [number, number] = [0.42, 0.72]
  return (
    <group position={p} rotation={[-0.1, 0.08, 0]}>
      {[R, F].map(([wx, wy]) => (
        <group key={wx} position={[wx, wy, 0]}>
          <Ring s={[0.66, 0.66, 0.9]} c="#1a1a1a" cast />
          <Ring s={[0.6, 0.6, 0.5]} c="#b8bcc0" o={{ metal: 0.8, rough: 0.3 }} />
          <Cyl r={[Math.PI / 2, 0, 0]} s={[0.05, 0.08, 0.05]} c="#b8bcc0" o={{ metal: 0.8 }} />
          <Box r={[0, 0, 0.6]} s={[0.6, 0.006, 0.006]} c="#c9cdd0" />
          <Box r={[0, 0, -0.6]} s={[0.6, 0.006, 0.006]} c="#c9cdd0" />
          <Box r={[0, 0, 1.57]} s={[0.6, 0.006, 0.006]} c="#c9cdd0" />
        </group>
      ))}
      <Rod a={B} b={S} c={frame} />
      <Rod a={B} b={Hb} c={frame} />
      <Rod a={S} b={Ht} c={frame} />
      <Rod a={B} b={R} c={frame} r={0.025} />
      <Rod a={S} b={R} c={frame} r={0.025} />
      <Rod a={Hb} b={F} c={frame} />
      <Rod a={Hb} b={[0.34, 1.0]} c={frame} />
      <Rod a={[-0.62, 0.72]} b={[-0.2, 0.74]} c={frame} r={0.02} />
      <Box p={[-0.42, 0.74, 0]} s={[0.36, 0.02, 0.16]} c={frame} />
      <Box p={[-0.22, 0.92, 0]} s={[0.24, 0.06, 0.12]} c="#5a3a26" />
      <Box p={[0.34, 1.0, 0]} s={[0.04, 0.04, 0.52]} c={frame} />
      <Cyl p={[0.34, 1.0, 0.26]} r={[Math.PI / 2, 0, 0]} s={[0.04, 0.1, 0.04]} c="#2b2b2b" />
      <Cyl p={[0.34, 1.0, -0.26]} r={[Math.PI / 2, 0, 0]} s={[0.04, 0.1, 0.04]} c="#2b2b2b" />
      <Ball p={[0.45, 0.92, 0]} s={0.07} c="#d0d4d6" o={{ metal: 0.8 }} />
      <Cyl p={[B[0], B[1], 0.05]} r={[Math.PI / 2, 0, 0]} s={[0.16, 0.02, 0.16]} c="#8a8f93" o={{ metal: 0.7 }} />
      <Rod a={[-0.1, 0.28]} b={[-0.3, 0.02]} z={-0.06} c={frame} r={0.02} />
    </group>
  )
}

function Backdrop() {
  const roofs: { x: number; w: number; h: number; c: string }[] = [
    { x: -34, w: 9, h: 10, c: '#d7c2a2' },
    { x: -24, w: 8, h: 12.5, c: '#cbb9a1' },
    { x: -15, w: 10, h: 10.5, c: '#dcc6a6' },
    { x: -6, w: 7, h: 12, c: '#d0bca0' },
    { x: 2, w: 9, h: 11, c: '#d8c3a4' },
    { x: 11, w: 8, h: 13, c: '#ccb99f' },
    { x: 20, w: 9, h: 10.5, c: '#dac5a5' },
    { x: 30, w: 10, h: 12, c: '#cfbca2' },
  ]
  return (
    <>
      <Plane p={[0, 18, -34]} s={[180, 52]} t="sky" o={{ basic: true, fog: false }} />
      {roofs.map((r, i) => (
        <group key={r.x} position={[r.x, 0, -15 - (i % 3) * 2]}>
          <Box p={[0, r.h / 2, 0]} s={[r.w, r.h, 2]} c={r.c} />
          {i % 2 === 0 && <Cyl p={[r.w * 0.2, r.h + 0.5, 0]} s={[1.0, 1.0, 1.0]} c="#3a3634" />}
          {i % 3 === 1 && <Ico p={[-r.w * 0.4, r.h + 0.8, 1]} s={[3, 2.4, 3]} c="#8fa37a" o={{ flat: true }} />}
        </group>
      ))}
    </>
  )
}

/** Facades across the street, only visible from inside the workshop. */
function OppositeRow({ rig }: { rig: ShopRig }) {
  return (
    <group ref={(g) => void (rig.opposite = g)} position={[0, 0, 11.65]} rotation={[0, Math.PI, 0]} visible={false}>
      <Building x={1.2} w={4.6} h={6.6} color="#EFC9A0" trim="#fbf1dc" openW={3.4} openH={2.7} interior="#6a4b3a">
        <SignBoard p={[0, 3.05, 0.06]} w={2.6} h={0.62} t="sweetSign" frame="#3a1c0c" />
        <Awning p={[0, 2.72, 0.08]} w={3.8} depth={0.9} tilt={0.3} t="chaiAwning" />
        <Box p={[0, 0.5, 0.35]} s={[3.0, 1.0, 0.6]} c="#d9e6e8" o={{ rough: 0.25 }} cast />
        {['#f6d365', '#f39c12', '#fdfefe', '#e67e22', '#c0392b', '#f5cba7'].map((c, i) => (
          <CylLow key={c} p={[-1.2 + i * 0.48, 1.04, 0.35]} s={[0.38, 0.06, 0.38]} c={c} />
        ))}
        <ArchWindow p={[-1.1, 4.0, 0]} w={0.9} h={1.5} shutter="#b3261e" />
        <ArchWindow p={[1.1, 4.0, 0]} w={0.9} h={1.5} shutter="#b3261e" openL={0.3} />
      </Building>
      <Building x={-3.7} w={4.6} h={7.4} color="#9FC0B0" trim="#eef4ea" tank={0.4}>
        <Box p={[0, 1.3, 0.02]} s={[3.4, 2.6, 0.03]} t="shutterStatic" o={{ color: '#c9b27c', metal: 0.3 }} />
        <RectWindow p={[-1.2, 4.1, 0]} />
        <RectWindow p={[1.2, 4.1, 0]} />
        <RectWindow p={[0, 5.9, 0]} />
      </Building>
      <Building x={6.3} w={5.2} h={6.0} color="#E2B8B8" trim="#f7e9e4" openW={3.2} openH={2.6}>
        <Box p={[0, 1.2, 0.7]} s={[1.4, 1.2, 0.8]} c="#2f7a4d" cast />
        <Box p={[0, 2.05, 0.7]} s={[1.7, 0.06, 1.1]} c="#9aa0a3" o={{ metal: 0.5 }} cast />
        <Plane p={[0, 1.5, 1.11]} s={[0.4, 0.5]} t="packets" />
        <RectWindow p={[-1.4, 3.9, 0]} />
        <RectWindow p={[1.4, 3.9, 0]} />
      </Building>
      <Building x={-9.2} w={6} h={6.6} color="#d9c7a0" trim="#f1e7d2">
        <RectWindow p={[-1.5, 4.0, 0]} />
        <RectWindow p={[1.5, 4.0, 0]} />
      </Building>
      <Building x={11.8} w={6} h={7.2} color="#c4d3de" trim="#f1e7d2">
        <RectWindow p={[-1.5, 4.0, 0]} />
        <RectWindow p={[1.5, 4.0, 0]} />
      </Building>
      <Plane p={[0, 16, -30]} s={[140, 44]} t="sky" o={{ basic: true, fog: false }} />
    </group>
  )
}
