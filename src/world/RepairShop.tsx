import { selectActiveDay, selectGameComplete, useGame } from '../app/state'
import { Sway } from './ambient'
import { ArchWindow, PLINTH } from './architecture'
import { useKit } from './kit'
import { Ball, Box, Coil, Cone, Cyl, Plane, Ring } from './primitives'
import { SHOP, type ShopRig } from './rig'

const PLASTER = '#E9D8B4'
const TEAL = '#387C78'
const MAROON = '#883D3B'
const WOOD = '#49382D'
const WOOD_TOP = '#7b5a3e'
const MINT = '#bcd3bd'

const { width: W, groundHeight: GH, height: H, openingWidth: OW, openingHeight: OH, depth: D } = SHOP

export function RepairShop({ rig }: { rig: ShopRig }) {
  return (
    <group position={[0, PLINTH, 0]}>
      <Shell />
      <Shutter rig={rig} />
      <Frontage rig={rig} />
      <UpperFloor />
      <Interior />
    </group>
  )
}

function Shell() {
  const chalked = useGame((s) => (selectActiveDay(s) ?? 1) >= 2)
  const plaster = { color: PLASTER }
  return (
    <>
      <Box p={[0, GH + (H - GH) / 2, -D / 2]} s={[W, H - GH, D]} t="plaster" o={plaster} cast recv />
      <Box p={[-2.2, GH / 2, -D / 2]} s={[0.2, GH, D]} t="plaster" o={plaster} cast recv />
      <Box p={[2.2, GH / 2, -D / 2]} s={[0.2, GH, D]} t="plaster" o={plaster} cast recv />
      <Box p={[-1.85, GH / 2, -0.15]} s={[0.5, GH, 0.3]} t="plaster" o={plaster} cast recv />
      <Box p={[1.85, GH / 2, -0.15]} s={[0.5, GH, 0.3]} t="plaster" o={plaster} cast recv />
      <Box p={[0, (OH + GH) / 2, -0.15]} s={[OW, GH - OH, 0.3]} t="plaster" o={plaster} recv />
      <Box p={[0, GH / 2, -D + 0.1]} s={[4.2, GH, 0.2]} c={MINT} recv />
      {/* Teal dado bands on the pillars. */}
      {chalked && <Plane p={[1.95, 0.5, 0.018]} s={[0.6, 0.4]} t="chalk" o={{ opacity: 0.95 }} />}
      <Box p={[-1.95, 0.45, 0.008]} s={[0.7, 0.9, 0.016]} c={TEAL} />
      <Box p={[1.95, 0.45, 0.008]} s={[0.7, 0.9, 0.016]} c={TEAL} />
      <Box p={[0, 0.02, -0.08]} s={[OW, 0.04, 0.16]} c="#9d9282" />
      {/* Interior lining. */}
      <Plane p={[-2.099, GH / 2, -D / 2]} r={[0, Math.PI / 2, 0]} s={[D, GH]} c={MINT} recv />
      <Plane p={[2.099, GH / 2, -D / 2]} r={[0, -Math.PI / 2, 0]} s={[D, GH]} c={MINT} recv />
      <Plane p={[-1.85, GH / 2, -0.301]} r={[0, Math.PI, 0]} s={[0.5, GH]} c={MINT} />
      <Plane p={[1.85, GH / 2, -0.301]} r={[0, Math.PI, 0]} s={[0.5, GH]} c={MINT} />
      <Plane p={[0, (OH + GH) / 2, -0.301]} r={[0, Math.PI, 0]} s={[OW, GH - OH]} c={MINT} />
      <Plane p={[0, 3.4, -D / 2]} r={[Math.PI / 2, 0, 0]} s={[4.2, D]} c="#8e8474" />
      <Plane p={[0, 0.006, -D / 2 + 0.05]} r={[-Math.PI / 2, 0, 0]} s={[4.2, D - 0.1]} t="redOxide" recv />
      <Box p={[0, 0.06, -D + 0.215]} s={[4.2, 0.12, 0.03]} c="#6d5a48" />
    </>
  )
}

function Shutter({ rig }: { rig: ShopRig }) {
  const kit = useKit()
  const material = kit.texMat('shutter', { color: '#86aca6', metal: 0.35, rough: 0.5 })
  return (
    <>
      <group
        ref={(g) => {
          rig.shutter = g
          rig.shutterTexture = kit.tex.shutter
        }}
        position={[0, OH, 0.06]}
      >
        <mesh geometry={kit.geo.box} material={material} position={[0, -OH / 2, 0]} scale={[OW + 0.04, OH, 0.03]} castShadow />
      </group>
      <group ref={(g) => void (rig.shutterBottom = g)} position={[0, 0, 0.085]}>
        <Box p={[0, 0.05, 0]} s={[OW + 0.02, 0.1, 0.05]} c="#4e6b67" o={{ metal: 0.4, rough: 0.5 }} />
        <Box p={[-0.9, 0.1, 0.035]} s={[0.12, 0.04, 0.04]} c="#3b3b3b" />
        <Box p={[0.9, 0.1, 0.035]} s={[0.12, 0.04, 0.04]} c="#3b3b3b" />
        <group ref={(g) => void (rig.lock = g)} position={[0, 0.02, 0.05]}>
          <Box p={[0, 0, 0]} s={[0.13, 0.14, 0.05]} c="#b8892f" o={{ metal: 0.7, rough: 0.35 }} />
          <Ring p={[0, 0.09, 0]} s={[0.1, 0.1, 0.4]} c="#9aa0a3" o={{ metal: 0.8, rough: 0.3 }} />
        </group>
      </group>
      {/* Guide rails and roller housing. */}
      <Box p={[-OW / 2 - 0.03, OH / 2, 0.07]} s={[0.06, OH, 0.1]} c="#56625f" o={{ metal: 0.4 }} />
      <Box p={[OW / 2 + 0.03, OH / 2, 0.07]} s={[0.06, OH, 0.1]} c="#56625f" o={{ metal: 0.4 }} />
      <Box p={[0, OH + 0.15, 0.13]} s={[OW + 0.2, 0.3, 0.26]} c="#5f807b" o={{ metal: 0.35, rough: 0.55 }} cast />
    </>
  )
}

function Frontage({ rig }: { rig: ShopRig }) {
  const done = useGame(selectGameComplete)
  return (
    <>
      {/* Main hand-painted signboard. */}
      <Box p={[0, 3.87, 0.1]} s={[4.38, 1.5, 0.08]} c={MAROON} cast />
      <Plane p={[0, 3.87, 0.142]} s={[4.26, 1.4]} t={done ? 'mainSignDone' : 'mainSign'} />
      {[-1.4, 1.4].map((x) => (
        <group key={x} position={[x, 4.75, 0.2]}>
          <Box p={[0, 0.05, 0.12]} s={[0.03, 0.03, 0.34]} c="#2b2b2b" />
          <Cone p={[0, 0, 0.3]} s={[0.22, 0.12, 0.22]} c="#2f4f4c" o={{ metal: 0.5 }} />
          <Ball p={[0, -0.05, 0.3]} s={0.07} c="#fff4d6" o={{ emissive: '#ffe3a8', emissiveIntensity: 0.6 }} />
        </group>
      ))}

      {/* Blade sign listing what we fix. */}
      <Box p={[2.2, 3.43, 0.5]} s={[0.035, 0.035, 1.0]} c="#2b2b2b" />
      <Sway axis="x" amp={0.025} speed={1.1} phase={1} position={[2.2, 3.4, 0.62]}>
        <Box p={[0, -0.52, 0]} s={[0.045, 1.0, 0.76]} c={TEAL} cast />
        <Plane p={[0.024, -0.52, 0]} r={[0, Math.PI / 2, 0]} s={[0.72, 0.96]} t="bladeSign" />
        <Plane p={[-0.024, -0.52, 0]} r={[0, -Math.PI / 2, 0]} s={[0.72, 0.96]} t="bladeSign" />
        <Box p={[0, -0.01, -0.25]} s={[0.02, 0.03, 0.02]} c="#2b2b2b" />
        <Box p={[0, -0.01, 0.25]} s={[0.02, 0.03, 0.02]} c="#2b2b2b" />
      </Sway>

      {/* Enamel street plate. */}
      <Box p={[-1.95, 2.6, 0.012]} s={[0.64, 0.26, 0.02]} c="#1d4f8f" />
      <Plane p={[-1.95, 2.6, 0.024]} s={[0.62, 0.242]} t="streetPlate" />

      {/* Closed / open sign; the Director flips it. */}
      <Box p={[-1.95, 2.02, 0.02]} s={[0.03, 0.03, 0.04]} c="#555" />
      <group ref={(g) => void (rig.openSign = g)} position={[-1.95, 1.72, 0.045]}>
        <Box p={[-0.1, 0.2, 0]} r={[0, 0, -0.9]} s={[0.24, 0.008, 0.008]} c="#d8cdb8" />
        <Box p={[0.1, 0.2, 0]} r={[0, 0, 0.9]} s={[0.24, 0.008, 0.008]} c="#d8cdb8" />
        <Box s={[0.44, 0.26, 0.014]} c="#2b2019" cast />
        <Plane p={[0, 0, 0.0085]} s={[0.42, 0.245]} t="signClosed" />
        <Plane p={[0, 0, -0.0085]} r={[0, Math.PI, 0]} s={[0.42, 0.245]} t="signOpen" />
      </group>
    </>
  )
}

function UpperFloor() {
  return (
    <>
      <Box p={[0, 4.83, 0.3]} s={[4.8, 0.1, 0.62]} c="#dcc9a2" cast recv />
      {[-2.1, -0.7, 0.7, 2.1].map((x) => (
        <Box key={x} p={[x, 4.7, 0.12]} s={[0.1, 0.2, 0.24]} c="#cdb88f" />
      ))}
      <ArchWindow p={[-1.1, 5.2, 0]} w={1.0} h={1.75} shutter={TEAL} openL={1.35} openR={1.1} curtain="#d5a23b" pot />
      <ArchWindow p={[1.1, 5.2, 0]} w={1.0} h={1.75} shutter={TEAL} openL={0.25} openR={1.3} curtain="#9c3f5a" />
      <Box p={[0, 7.22, 0.1]} s={[4.9, 0.2, 0.42]} c="#f1e5c8" cast />
      <Box p={[0, 7.03, 0.03]} s={[4.6, 0.07, 0.1]} c={TEAL} />
      <Box p={[0, 7.62, -0.08]} s={[4.6, 0.6, 0.22]} t="plaster" o={{ color: PLASTER }} />
      <Cyl p={[1.25, 8.0, -1.8]} s={[1.0, 1.1, 1.0]} c="#1b1b1b" o={{ rough: 0.6 }} />
      <Box p={[-1.5, 7.4, 0.28]} s={[0.05, 0.05, 0.2]} c="#2b2b2b" />
    </>
  )
}

function Interior() {
  const done = useGame(selectGameComplete)
  return (
    <>
      <InteriorLighting />
      <Counter />
      <BackShelves />
      <Pegboard />
      <SideBench />
      <PedestalFan p={[-1.55, 0, -3.65]} />
      <Stool p={[1.28, 0, -1.4]} />
      {/* Calendar and job sheet on the inside of the front wall. */}
      <Box p={[1.85, 2.52, -0.305]} s={[0.02, 0.02, 0.02]} c="#444" />
      <Plane p={[1.85, 2.2, -0.306]} r={[0, Math.PI, 0]} s={[0.4, 0.6]} t="calendar" />
      <Box p={[-1.85, 1.95, -0.308]} s={[0.4, 0.55, 0.012]} c="#8a6443" />
      <Box p={[-1.85, 2.2, -0.318]} s={[0.12, 0.04, 0.02]} c="#b0b3b5" o={{ metal: 0.7 }} />
      <Plane p={[-1.85, 1.94, -0.316]} r={[0, Math.PI, 0]} s={[0.36, 0.5]} t="jobSheet" />
      {/* Mama's board above the side bench. */}
      <Box p={[-0.95, 2.3, -D + 0.215]} s={[1.12, 0.58, 0.03]} c="#6b4a30" />
      <Plane p={[-0.95, 2.3, -D + 0.232]} s={[1.08, 0.54]} t={done ? 'mamaBoardDone' : 'mamaBoard'} />
      {/* Wall clock. */}
      <Cyl p={[-0.95, 2.95, -D + 0.225]} r={[Math.PI / 2, 0, 0]} s={[0.34, 0.03, 0.34]} c="#f5f0e3" />
      <Ring p={[-0.95, 2.95, -D + 0.24]} s={[0.35, 0.35, 0.6]} c={MAROON} />
      <Box p={[-0.95, 2.99, -D + 0.245]} r={[0, 0, 0.2]} s={[0.012, 0.09, 0.005]} c="#222" />
      <Box p={[-0.92, 2.95, -D + 0.245]} r={[0, 0, -1.1]} s={[0.01, 0.12, 0.005]} c="#222" />
    </>
  )
}

function InteriorLighting() {
  return (
    <>
      <Box p={[0.4, 3.12, -D + 0.28]} s={[1.25, 0.05, 0.05]} c="#ffffff" o={{ emissive: '#fff7e6', emissiveIntensity: 1.6 }} />
      <Box p={[0.4, 3.12, -D + 0.24]} s={[1.35, 0.06, 0.04]} c="#dcdcd4" />
      <pointLight position={[0.2, 2.9, -2.4]} intensity={9} distance={9} decay={1.5} color="#ffe6c2" />
      <pointLight position={[0, 2.4, -0.9]} intensity={3} distance={4} decay={1.5} color="#ffe2b0" />
    </>
  )
}

function Counter() {
  return (
    <group position={[-0.3, 0, SHOP.counterZ]}>
      <Box p={[0, 0.5, 0]} s={[2.4, 1.0, 0.7]} t="wood" o={{ color: '#b79a84' }} cast recv />
      <Box p={[0, SHOP.counterTop - 0.025, 0]} s={[2.5, 0.05, 0.78]} c={WOOD_TOP} recv cast />
      <Box p={[0, 0.05, 0.36]} s={[2.4, 0.1, 0.02]} c={WOOD} />
      <Plane p={[-0.62, 0.64, 0.356]} r={[0, 0, 0.03]} s={[0.52, 0.27]} t="repairOngoing" />
      {/* Permanent clutter at the counter's back-left corner. */}
      <Cyl p={[-1.02, SHOP.counterTop + 0.07, -0.22]} s={[0.12, 0.14, 0.12]} c="#a9b1b4" o={{ metal: 0.6, rough: 0.4 }} />
      <Cyl p={[-0.86, SHOP.counterTop + 0.05, -0.26]} s={[0.1, 0.1, 0.1]} c="#c0443a" o={{ metal: 0.4 }} />
      <Coil p={[1.05, SHOP.counterTop + 0.02, -0.26]} r={[Math.PI / 2, 0, 0]} s={[0.14, 0.14, 0.12]} c="#2f4f3e" />
    </group>
  )
}

function BackShelves() {
  const z = -D + 0.42
  return (
    <group position={[1.0, 0, z]}>
      {[1.2, 1.75, 2.3].map((y) => (
        <Box key={y} p={[0, y, 0]} s={[1.9, 0.04, 0.42]} c="#6b4e38" cast recv />
      ))}
      <Box p={[-0.93, 1.4, 0]} s={[0.04, 2.8, 0.42]} c="#5a412f" />
      <Box p={[0.93, 1.4, 0]} s={[0.04, 2.8, 0.42]} c="#5a412f" />
      {/* Shelf 1: CRT television and valve radio. */}
      <group position={[-0.45, 1.22, 0]}>
        <Box p={[0, 0.22, 0]} s={[0.52, 0.44, 0.42]} c="#5d5853" cast />
        <Box p={[-0.04, 0.22, 0.212]} s={[0.36, 0.3, 0.01]} c="#2e3b3a" o={{ rough: 0.25 }} />
        <Cyl p={[0.2, 0.3, 0.215]} r={[Math.PI / 2, 0, 0]} s={[0.04, 0.02, 0.04]} c="#222" />
        <Cyl p={[0.2, 0.18, 0.215]} r={[Math.PI / 2, 0, 0]} s={[0.04, 0.02, 0.04]} c="#222" />
        <Box p={[0, 0.5, 0]} r={[0, 0, 0.5]} s={[0.012, 0.18, 0.012]} c="#999" />
      </group>
      <group position={[0.3, 1.22, 0.02]}>
        <Box p={[0, 0.14, 0]} s={[0.5, 0.28, 0.17]} c="#7a3d24" cast />
        <Cyl p={[-0.1, 0.14, 0.087]} r={[Math.PI / 2, 0, 0]} s={[0.19, 0.01, 0.19]} c="#dccba3" />
        <Box p={[0.14, 0.17, 0.087]} s={[0.14, 0.06, 0.01]} c="#f1e3b5" />
        <Cyl p={[0.14, 0.08, 0.09]} r={[Math.PI / 2, 0, 0]} s={[0.05, 0.02, 0.05]} c="#2a2a2a" />
      </group>
      <Cyl p={[0.75, 1.3, 0]} s={[0.12, 0.16, 0.12]} c="#b0b5b8" o={{ metal: 0.6 }} />
      {/* Shelf 2: mixer grinder, iron, transistor. */}
      <group position={[-0.55, 1.77, 0]}>
        <Box p={[0, 0.1, 0]} s={[0.26, 0.2, 0.22]} c="#efece4" cast />
        <Cyl p={[0, 0.32, 0]} s={[0.16, 0.24, 0.16]} c="#c9d1d4" o={{ metal: 0.7, rough: 0.3 }} />
        <Cyl p={[0, 0.46, 0]} s={[0.17, 0.04, 0.17]} c="#222" />
        <Cyl p={[-0.08, 0.14, 0.115]} r={[Math.PI / 2, 0, 0]} s={[0.05, 0.02, 0.05]} c="#b3261e" />
      </group>
      <group position={[-0.05, 1.77, 0.02]}>
        <Box p={[0, 0.05, 0]} s={[0.28, 0.1, 0.14]} c="#c3c7ca" o={{ metal: 0.6, rough: 0.35 }} />
        <Box p={[0.01, 0.15, 0]} s={[0.2, 0.05, 0.04]} c={MAROON} />
        <Box p={[-0.08, 0.12, 0]} s={[0.03, 0.08, 0.03]} c={MAROON} />
      </group>
      <group position={[0.4, 1.77, 0.02]}>
        <Box p={[0, 0.1, 0]} s={[0.3, 0.2, 0.1]} c="#d5a23b" />
        <Cyl p={[-0.06, 0.1, 0.052]} r={[Math.PI / 2, 0, 0]} s={[0.12, 0.01, 0.12]} c="#3a3a3a" />
      </group>
      <Box p={[0.77, 1.9, 0]} s={[0.26, 0.26, 0.3]} c="#b58b5a" />
      {/* Shelf 3: boxes and a fan motor. */}
      <Box p={[-0.6, 2.45, 0]} s={[0.4, 0.28, 0.32]} c="#b98f5f" />
      <Box p={[-0.2, 2.42, 0]} s={[0.3, 0.22, 0.3]} c="#c79f6b" />
      <Cyl p={[0.25, 2.44, 0]} r={[0, 0, Math.PI / 2]} s={[0.22, 0.2, 0.22]} c="#6f7a7e" o={{ metal: 0.5 }} />
      <Box p={[0.65, 2.4, 0]} s={[0.36, 0.18, 0.28]} c="#2f5d8a" />
    </group>
  )
}

function Pegboard() {
  const x = -2.085
  return (
    <group>
      <Plane p={[x, 1.95, -2.7]} r={[0, Math.PI / 2, 0]} s={[2.0, 1.0]} t="pegboard" />
      <group position={[x + 0.03, 0, 0]}>
        {[
          [-3.3, '#c0392b'],
          [-3.15, '#f1c40f'],
          [-3.0, '#2d7dd2'],
        ].map(([z, color]) => (
          <group key={z as number} position={[0, 2.05, z as number]}>
            <Cyl p={[0, 0.12, 0]} s={[0.035, 0.12, 0.035]} c={color as string} />
            <Cyl p={[0, -0.05, 0]} s={[0.012, 0.22, 0.012]} c="#b8bcc0" o={{ metal: 0.8, rough: 0.3 }} />
          </group>
        ))}
        <Box p={[0, 2.05, -2.7]} r={[0.35, 0, 0]} s={[0.02, 0.28, 0.03]} c="#34495e" />
        <Box p={[0, 2.05, -2.62]} r={[-0.35, 0, 0]} s={[0.02, 0.28, 0.03]} c="#c0392b" />
        <Box p={[0, 2.1, -2.3]} s={[0.015, 0.34, 0.04]} c="#a6acb0" o={{ metal: 0.8, rough: 0.3 }} />
        <Ring p={[0, 2.29, -2.3]} r={[0, Math.PI / 2, 0]} s={[0.07, 0.07, 0.7]} c="#a6acb0" o={{ metal: 0.8 }} />
        <Box p={[0, 1.72, -3.1]} s={[0.05, 0.05, 0.18]} c="#555" o={{ metal: 0.6 }} />
        <Cyl p={[0, 1.58, -3.1]} s={[0.03, 0.28, 0.03]} c="#9a6b3f" />
        <Coil p={[0.02, 1.7, -1.95]} r={[0, Math.PI / 2, 0]} s={[0.22, 0.22, 0.16]} c="#e67e22" />
        <Box p={[0, 2.25, -1.95]} s={[0.04, 0.04, 0.04]} c="#444" />
      </group>
    </group>
  )
}

function SideBench() {
  return (
    <group position={[-1.72, 0, -2.55]}>
      <Box p={[0, 0.88, 0]} s={[0.7, 0.06, 1.9]} c="#6b4e38" cast recv />
      {[-0.85, 0.85].map((z) =>
        [-0.28, 0.28].map((x) => <Box key={`${x}${z}`} p={[x, 0.43, z]} s={[0.06, 0.86, 0.06]} c="#4d3829" />),
      )}
      <Box p={[0, 0.25, 0]} s={[0.66, 0.03, 1.8]} c="#5a412f" />
      <Box p={[0.05, 0.3, 0.3]} s={[0.4, 0.2, 0.35]} c="#2f5d8a" />
      {/* Vice. */}
      <group position={[0.1, 0.91, -0.6]}>
        <Box p={[0, 0.06, 0]} s={[0.16, 0.12, 0.2]} c="#2f6f5f" o={{ metal: 0.5 }} />
        <Box p={[0, 0.14, 0]} s={[0.2, 0.06, 0.08]} c="#2f6f5f" o={{ metal: 0.5 }} />
        <Cyl p={[0.14, 0.08, 0]} r={[0, 0, Math.PI / 2]} s={[0.02, 0.18, 0.02]} c="#aaa" o={{ metal: 0.8 }} />
      </group>
      {/* Multimeter and solder. */}
      <Box p={[0.12, 0.93, 0.05]} r={[0, 0.3, 0]} s={[0.12, 0.03, 0.2]} c="#f1c40f" />
      <Box p={[0.12, 0.95, 0.02]} r={[0, 0.3, 0]} s={[0.08, 0.005, 0.07]} c="#2f3b35" />
      <Cyl p={[-0.05, 0.94, 0.45]} s={[0.1, 0.06, 0.1]} c="#95a5a6" o={{ metal: 0.7 }} />
      <Coil p={[0.1, 0.93, 0.6]} r={[Math.PI / 2, 0, 0]} s={[0.1, 0.1, 0.08]} c="#bdc3c7" o={{ metal: 0.8 }} />
      <Cyl p={[-0.12, 0.99, -0.1]} s={[0.1, 0.16, 0.1]} c="#7f8c8d" o={{ metal: 0.5 }} />
      {['#c0392b', '#f1c40f', '#16a085'].map((c, i) => (
        <Cyl key={c} p={[-0.12 + (i - 1) * 0.025, 1.12, -0.1]} r={[0.1 * (i - 1), 0, 0.1]} s={[0.018, 0.14, 0.018]} c={c} />
      ))}
    </group>
  )
}

function PedestalFan({ p }: { p: [number, number, number] }) {
  return (
    <group position={p} rotation={[0, 0.5, 0]}>
      <Cyl p={[0, 0.03, 0]} s={[0.4, 0.06, 0.4]} c="#2f3b3a" />
      <Cyl p={[0, 0.7, 0]} s={[0.04, 1.3, 0.04]} c="#b7bcbf" o={{ metal: 0.7 }} />
      <Ball p={[0, 1.4, -0.08]} s={[0.18, 0.18, 0.24]} c="#dfe6e3" />
      <group position={[0, 1.4, 0.08]}>
        <Ring s={[0.5, 0.5, 0.6]} c="#9aa3a6" o={{ metal: 0.6 }} />
        <Ring p={[0, 0, 0.04]} s={[0.42, 0.42, 0.6]} c="#9aa3a6" o={{ metal: 0.6 }} />
        {[0, 2.09, 4.19].map((a) => (
          <Box key={a} r={[0, 0, a]} p={[Math.cos(a + Math.PI / 2) * 0.1, Math.sin(a + Math.PI / 2) * 0.1, 0.02]} s={[0.1, 0.2, 0.01]} c="#7fb3c8" />
        ))}
        <Cyl p={[0, 0, 0.04]} r={[Math.PI / 2, 0, 0]} s={[0.06, 0.04, 0.06]} c="#dfe6e3" />
      </group>
    </group>
  )
}

function Stool({ p }: { p: [number, number, number] }) {
  return (
    <group position={p}>
      <Cyl p={[0, 0.62, 0]} s={[0.38, 0.05, 0.38]} c="#8a5a3b" cast />
      {[0, 2.09, 4.19].map((a) => (
        <Box
          key={a}
          p={[Math.cos(a) * 0.12, 0.3, Math.sin(a) * 0.12]}
          r={[Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12]}
          s={[0.04, 0.62, 0.04]}
          c="#5c3d28"
        />
      ))}
    </group>
  )
}

