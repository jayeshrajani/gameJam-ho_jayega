import type { ThreeElements } from '@react-three/fiber'
import type { Material } from 'three'
import { type GeometryName, type MatOptions, type TextureName, useKit } from './kit'

export type V3 = [number, number, number]

export interface PrimProps {
  p?: V3
  r?: V3
  /** Scale; planes also accept [width, height]. */
  s?: V3 | [number, number] | number
  /** Flat colour (cached shared material). */
  c?: string
  /** Shared textured material by name. */
  t?: TextureName
  m?: Material
  o?: MatOptions & { color?: string; basic?: boolean }
  cast?: boolean
  recv?: boolean
  visible?: boolean
  meshRef?: ThreeElements['mesh']['ref']
}

function Prim({ g, p, r, s, c = '#ffffff', t, m, o, cast, recv, visible, meshRef }: PrimProps & { g: GeometryName }) {
  const kit = useKit()
  const material = m ?? (t ? kit.texMat(t, o) : kit.mat(c, o))
  const scale: V3 | number | undefined = Array.isArray(s) && s.length === 2 ? [s[0], s[1], 1] : (s as V3 | number | undefined)
  return (
    <mesh
      ref={meshRef}
      geometry={kit.geo[g]}
      material={material}
      position={p}
      rotation={r}
      scale={scale}
      castShadow={cast}
      receiveShadow={recv}
      visible={visible}
    />
  )
}

export const Box = (props: PrimProps) => <Prim g="box" {...props} />
export const Cyl = (props: PrimProps) => <Prim g="cyl" {...props} />
export const CylLow = (props: PrimProps) => <Prim g="cylLow" {...props} />
export const Taper = (props: PrimProps) => <Prim g="taper" {...props} />
export const Cone = (props: PrimProps) => <Prim g="cone" {...props} />
export const Ball = (props: PrimProps) => <Prim g="sphere" {...props} />
export const Ico = (props: PrimProps) => <Prim g="ico" {...props} />
export const Ring = (props: PrimProps) => <Prim g="ring" {...props} />
export const Coil = (props: PrimProps) => <Prim g="coil" {...props} />
export const Arch = (props: PrimProps) => <Prim g="arch" {...props} />
export const Plane = (props: PrimProps) => <Prim g="plane" {...props} />
