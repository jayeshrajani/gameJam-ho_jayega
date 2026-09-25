import { useEffect, useMemo, type ReactNode } from 'react'
import { DoubleSide, QuadraticBezierCurve3, TubeGeometry, Vector3 } from 'three'
import { Sway } from './ambient'
import { type TextureName, useKit } from './kit'
import { Arch, Box, Cyl, CylLow, Ico, Plane, type V3 } from './primitives'
import { PLINTH } from './rig'

export { PLINTH }

interface ArchWindowProps {
  p: V3
  w?: number
  h?: number
  frame?: string
  shutter?: string
  openL?: number
  openR?: number
  curtain?: string
  grille?: boolean
  pot?: boolean
}

/** Arched window with hinged wooden shutters. p is the bottom centre on the facade. */
export function ArchWindow({
  p,
  w = 1,
  h = 1.6,
  frame = '#f1e6cc',
  shutter = '#387C78',
  openL = 1.25,
  openR = 1.25,
  curtain,
  grille = true,
  pot = false,
}: ArchWindowProps) {
  const rectH = h - w / 2
  const panelH = rectH * 0.95
  return (
    <group position={p}>
      <Arch p={[0, -0.07, 0.006]} s={[w + 0.2, (h + 0.14) / 1.5, 1]} c={frame} />
      <Arch p={[0, 0, 0.012]} s={[w, h / 1.5, 1]} c="#2b231e" />
      {curtain && <Plane p={[-w * 0.2, rectH * 0.5, 0.016]} s={[w * 0.5, rectH * 0.85]} c={curtain} />}
      {grille &&
        [-0.3, 0, 0.3].map((f) => (
          <Box key={f} p={[f * w, rectH * 0.45, 0.03]} s={[0.025, rectH * 0.9, 0.025]} c="#2d2a28" />
        ))}
      <Box p={[0, -0.06, 0.09]} s={[w + 0.3, 0.07, 0.2]} c={frame} cast />
      <group position={[-w / 2, 0.02, 0.03]} rotation={[0, -openL, 0]}>
        <Box p={[w / 4, panelH / 2, 0]} s={[w / 2, panelH, 0.035]} c={shutter} cast />
        <Box p={[w / 4, panelH / 2, 0.02]} s={[w / 2 - 0.1, panelH - 0.14, 0.01]} c={shutter} o={{ rough: 0.6 }} />
      </group>
      <group position={[w / 2, 0.02, 0.03]} rotation={[0, openR, 0]}>
        <Box p={[-w / 4, panelH / 2, 0]} s={[w / 2, panelH, 0.035]} c={shutter} cast />
        <Box p={[-w / 4, panelH / 2, 0.02]} s={[w / 2 - 0.1, panelH - 0.14, 0.01]} c={shutter} o={{ rough: 0.6 }} />
      </group>
      {pot && <Pot p={[w * 0.25, 0, 0.12]} />}
    </group>
  )
}

export function Pot({ p, scale = 1, leaf = '#5c8f43' }: { p: V3; scale?: number; leaf?: string }) {
  return (
    <group position={p} scale={scale}>
      <CylLow p={[0, 0.09, 0]} s={[0.2, 0.18, 0.2]} c="#b5613a" cast />
      <Ico p={[0, 0.27, 0]} s={[0.3, 0.26, 0.3]} c={leaf} o={{ flat: true }} cast />
    </group>
  )
}

interface RectWindowProps {
  p: V3
  w?: number
  h?: number
  frame?: string
  glass?: string
  hood?: boolean
  grille?: boolean
}

export function RectWindow({ p, w = 0.9, h = 1.2, frame = '#efe6d2', glass = '#34403f', hood = true, grille = true }: RectWindowProps) {
  return (
    <group position={p}>
      <Box p={[0, h / 2, 0.01]} s={[w + 0.16, h + 0.16, 0.02]} c={frame} />
      <Box p={[0, h / 2, 0.022]} s={[w, h, 0.01]} c={glass} o={{ rough: 0.35 }} />
      {grille &&
        [-0.33, 0, 0.33].map((f) => (
          <Box key={f} p={[f * w, h / 2, 0.04]} s={[0.022, h, 0.022]} c="#2d2a28" />
        ))}
      {hood && <Box p={[0, h + 0.14, 0.14]} s={[w + 0.36, 0.06, 0.3]} c={frame} cast />}
      <Box p={[0, -0.04, 0.07]} s={[w + 0.24, 0.06, 0.14]} c={frame} />
    </group>
  )
}

interface BuildingProps {
  x: number
  z?: number
  w: number
  h: number
  gh?: number
  color: string
  trim: string
  openW?: number
  openH?: number
  interior?: string
  depth?: number
  tank?: number | null
  children?: ReactNode
}

/** Shallow shopfront facade with an open ground floor. Children are placed in facade space. */
export function Building({
  x,
  z = 0,
  w,
  h,
  gh = 3.4,
  color,
  trim,
  openW = 0,
  openH = 2.7,
  interior = '#5b4a3e',
  depth = 3,
  tank = 0.8,
  children,
}: BuildingProps) {
  const pw = (w - openW) / 2
  return (
    <group position={[x, PLINTH, z]}>
      <Box p={[0, gh + (h - gh) / 2, -depth / 2]} s={[w, h - gh, depth]} t="plaster" o={{ color }} recv cast />
      {openW > 0 ? (
        <>
          <Box p={[-(openW / 2 + pw / 2), gh / 2, -depth / 2]} s={[pw, gh, depth]} t="plaster" o={{ color }} recv cast />
          <Box p={[openW / 2 + pw / 2, gh / 2, -depth / 2]} s={[pw, gh, depth]} t="plaster" o={{ color }} recv cast />
          <Box p={[0, (openH + gh) / 2, -0.2]} s={[openW, gh - openH, 0.4]} t="plaster" o={{ color }} recv />
          <Box p={[0, openH / 2, -1.9]} s={[openW, openH, 0.1]} c={interior} recv />
          <Box p={[0, openH + 0.05, -1]} s={[openW, 0.1, 2]} c="#3e342c" />
          <Box p={[0, -PLINTH / 2, -1]} s={[openW, PLINTH, 2]} c="#8d7e6a" recv />
        </>
      ) : (
        <Box p={[0, gh / 2, -depth / 2]} s={[w, gh, depth]} t="plaster" o={{ color }} recv cast />
      )}
      {/* Ledge between floors and cornice. */}
      <Box p={[0, gh + 0.05, 0.22]} s={[w, 0.09, 0.44]} c={trim} cast recv />
      <Box p={[0, h - 0.12, 0.08]} s={[w + 0.1, 0.22, 0.34]} c={trim} cast />
      <Box p={[0, h - 0.34, 0.02]} s={[w, 0.08, 0.1]} c={trim} />
      <Box p={[0, 0.35, 0.01]} s={[w, 0.7, 0.03]} t="plaster" o={{ color: shade(color) }} />
      {tank != null && <Cyl p={[tank * w * 0.4, h + 0.45, -1.6]} s={[0.95, 1.0, 0.95]} c="#1c1c1c" o={{ rough: 0.6 }} />}
      {children}
    </group>
  )
}

/** Darker variant of a hex colour for dado bands. */
function shade(hex: string, k = 0.82): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * k)
  const g = Math.round(((n >> 8) & 255) * k)
  const b = Math.round((n & 255) * k)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

interface SignProps {
  p: V3
  w: number
  h: number
  t: TextureName
  frame?: string
}

export function SignBoard({ p, w, h, t, frame = '#2d2520' }: SignProps) {
  return (
    <group position={p}>
      <Box p={[0, 0, 0]} s={[w + 0.08, h + 0.08, 0.06]} c={frame} cast />
      <Plane p={[0, 0, 0.032]} s={[w, h]} t={t} />
    </group>
  )
}

interface AwningProps {
  p: V3
  w: number
  depth: number
  tilt: number
  t: TextureName
  valance?: number
  poles?: boolean
  phase?: number
}

/** Sloped fabric awning with a fluttering front flap. */
export function Awning({ p, w, depth, tilt, t, valance = 0.22, poles = false, phase = 0 }: AwningProps) {
  const kit = useKit()
  const material = kit.texMat(t, { side: DoubleSide })
  const dropY = -Math.sin(tilt) * depth
  const outZ = Math.cos(tilt) * depth
  return (
    <group position={p}>
      <group rotation={[tilt, 0, 0]}>
        <mesh geometry={kit.geo.box} material={material} position={[0, 0, depth / 2]} scale={[w, 0.03, depth]} castShadow />
      </group>
      {valance > 0 && (
        <Sway axis="x" amp={0.07} speed={1.6} phase={phase} position={[0, dropY, outZ]}>
          <mesh geometry={kit.geo.plane} material={material} position={[0, -valance / 2, 0]} scale={[w, valance, 1]} castShadow />
        </Sway>
      )}
      {poles &&
        [-w / 2 + 0.08, w / 2 - 0.08].map((px) => (
          <Cyl key={px} p={[px, (dropY - p[1]) / 2, outZ]} s={[0.05, p[1] + dropY, 0.05]} c="#8a6a3e" />
        ))}
    </group>
  )
}

interface WireProps {
  from: V3
  to: V3
  sag: number
  radius?: number
  color?: string
}

export function Wire({ from, to, sag, radius = 0.014, color = '#1d1a18' }: WireProps) {
  const kit = useKit()
  const geometry = useMemo(() => {
    const a = new Vector3(...from)
    const b = new Vector3(...to)
    const mid = a.clone().add(b).multiplyScalar(0.5)
    mid.y -= sag * 2
    return new TubeGeometry(new QuadraticBezierCurve3(a, mid, b), 32, radius, 4, false)
  }, [from.join(), to.join(), sag, radius])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} material={kit.mat(color, { rough: 0.7 })} />
}

/** A thin rod between two points in the XY plane (used for bicycle frames and brackets). */
export function Rod({ a, b, z = 0, r = 0.03, c }: { a: [number, number]; b: [number, number]; z?: number; r?: number; c: string }) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy)
  return (
    <Box p={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z]} r={[0, 0, Math.atan2(dy, dx)]} s={[len, r, r]} c={c} o={{ metal: 0.3, rough: 0.5 }} />
  )
}
