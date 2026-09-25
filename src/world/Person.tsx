import type { Group } from 'three'
import { Ball, Box, Cyl, Taper } from './primitives'

export type OutfitKind = 'shirt' | 'kurta' | 'saree' | 'salwar' | 'kid'

export interface Outfit {
  kind: OutfitKind
  skin: string
  hair: string
  top: string
  bottom: string
  accent?: string
  bag?: string
  moustache?: boolean
  glasses?: boolean
  /** Colour of a cup held in the left hand. */
  holding?: string
}

export interface Limbs {
  legL: Group | null
  legR: Group | null
  armL: Group | null
  armR: Group | null
  body: Group | null
}

export const HIP = 0.84

/** Rafiq Bhai of the chai stall; shared by the street and day scenes. */
export const RAFIQ: Outfit = {
  kind: 'kurta',
  skin: '#7d5036',
  hair: '#1a1410',
  top: '#e9dcc0',
  bottom: '#d9ceb8',
  accent: '#a8452f',
  moustache: true,
}

export function createLimbs(): Limbs {
  return { legL: null, legR: null, armL: null, armR: null, body: null }
}

/** Low-poly person facing +X, feet at the origin. Limb groups are exposed for animation. */
export function Person({ o, limbs }: { o: Outfit; limbs: Limbs }) {
  const longTop = o.kind === 'kurta' || o.kind === 'salwar'
  const sleeve = longTop ? 0.4 : 0.28
  const legColour = o.kind === 'kid' ? o.skin : o.bottom
  return (
    <group ref={(g) => void (limbs.body = g)}>
      {o.kind !== 'saree' &&
        ([
          ['legL', -0.09],
          ['legR', 0.09],
        ] as const).map(([key, z]) => (
          <group key={key} ref={(g) => void (limbs[key] = g)} position={[0, HIP, z]}>
            <Box p={[0, -0.41, 0]} s={[0.13, 0.82, 0.13]} c={legColour} cast />
            {o.kind === 'kid' && <Box p={[0, -0.12, 0]} s={[0.15, 0.26, 0.15]} c={o.bottom} />}
            <Box p={[0.05, -0.8, 0]} s={[0.22, 0.05, 0.11]} c="#3a2a20" />
          </group>
        ))}

      {o.kind === 'shirt' && (
        <>
          <Box p={[0, HIP + 0.3, 0]} s={[0.22, 0.6, 0.38]} c={o.top} cast />
          <Box p={[0, HIP + 0.02, 0]} s={[0.225, 0.06, 0.36]} c="#2b2019" />
        </>
      )}
      {o.kind === 'kid' && <Box p={[0, HIP + 0.3, 0]} s={[0.22, 0.58, 0.36]} c={o.top} cast />}
      {o.kind === 'kurta' && (
        <>
          <Box p={[0, HIP + 0.12, 0]} s={[0.25, 0.98, 0.4]} c={o.top} cast />
          {o.accent && <Box p={[0.006, HIP + 0.34, 0]} s={[0.26, 0.54, 0.41]} c={o.accent} />}
        </>
      )}
      {o.kind === 'salwar' && (
        <>
          <Box p={[0, HIP + 0.1, 0]} s={[0.24, 0.96, 0.38]} c={o.top} cast />
          <Box p={[0.02, HIP + 0.5, 0]} s={[0.26, 0.08, 0.42]} c={o.accent ?? o.top} />
          <Box p={[-0.13, HIP + 0.12, 0.12]} s={[0.02, 0.72, 0.12]} c={o.accent ?? o.top} />
          <Box p={[-0.13, HIP + 0.12, -0.12]} s={[0.02, 0.72, 0.12]} c={o.accent ?? o.top} />
        </>
      )}
      {o.kind === 'saree' && (
        <>
          <Taper p={[0, 0.45, 0]} s={[0.5, 0.9, 0.52]} c={o.top} cast />
          <Box p={[0, HIP + 0.32, 0]} s={[0.21, 0.5, 0.34]} c={o.accent ?? o.top} cast />
          <Box p={[0.115, HIP + 0.3, 0]} r={[0.7, 0, 0]} s={[0.012, 0.62, 0.14]} c={o.top} />
          <Box p={[-0.12, HIP + 0.12, 0.1]} s={[0.02, 0.84, 0.18]} c={o.top} />
          <Box p={[0, 0.9, 0]} s={[0.36, 0.05, 0.4]} c={o.bottom} />
        </>
      )}

      <Cyl p={[0, HIP + 0.64, 0]} s={[0.08, 0.08, 0.08]} c={o.skin} />
      <Ball p={[0, HIP + 0.77, 0]} s={[0.22, 0.25, 0.21]} c={o.skin} cast />
      <Ball p={[-0.025, HIP + 0.82, 0]} s={[0.225, 0.2, 0.225]} c={o.hair} />
      {(o.kind === 'saree' || o.kind === 'salwar') && <Ball p={[-0.13, HIP + 0.76, 0]} s={0.1} c={o.hair} />}
      {o.moustache && <Box p={[0.105, HIP + 0.72, 0]} s={[0.012, 0.02, 0.07]} c={o.hair} />}
      {o.glasses && (
        <>
          <Box p={[0.108, HIP + 0.785, 0]} s={[0.01, 0.035, 0.17]} c="#1e1e1e" />
          <Box p={[0.112, HIP + 0.785, 0]} s={[0.004, 0.028, 0.15]} c="#cfe3ea" o={{ rough: 0.2 }} />
        </>
      )}

      {([
        ['armL', -0.22],
        ['armR', 0.22],
      ] as const).map(([key, z]) => (
        <group key={key} ref={(g) => void (limbs[key] = g)} position={[0, HIP + 0.56, z]}>
          <Box p={[0, -sleeve / 2 + 0.02, 0]} s={[0.09, sleeve, 0.09]} c={o.kind === 'saree' ? (o.accent ?? o.top) : o.top} />
          <Box p={[0, -sleeve - 0.12, 0]} s={[0.075, 0.28 - (sleeve - 0.28) * 0.6, 0.075]} c={o.skin} />
          <Ball p={[0, -0.56, 0]} s={0.075} c={o.skin} />
          {key === 'armL' && o.holding && <Cyl p={[0.05, -0.58, 0]} s={[0.06, 0.09, 0.06]} c={o.holding} o={{ rough: 0.3 }} />}
        </group>
      ))}

      {o.bag && (
        <>
          <Box p={[0, HIP + 0.02, 0.26]} s={[0.26, 0.3, 0.05]} c={o.bag} cast />
          <Box p={[0, HIP + 0.3, 0.24]} r={[0.25, 0, 0]} s={[0.02, 0.56, 0.02]} c={o.bag} />
        </>
      )}
      {o.kind === 'kid' && <Box p={[-0.17, HIP + 0.32, 0]} s={[0.14, 0.34, 0.28]} c={o.accent ?? '#c0392b'} cast />}
    </group>
  )
}
