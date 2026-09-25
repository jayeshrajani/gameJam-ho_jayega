import { createContext, useContext } from 'react'
import {
  BoxGeometry,
  type BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  FrontSide,
  IcosahedronGeometry,
  type Material,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  type Side,
  SphereGeometry,
  type Texture,
  TorusGeometry,
} from 'three'
import * as T from './textures'

function archGeometry(): ShapeGeometry {
  // Unit arch: 1 wide, 1.5 tall (1 rectangle + 0.5 semicircle), origin at bottom centre.
  const s = new Shape()
  s.moveTo(-0.5, 0)
  s.lineTo(0.5, 0)
  s.lineTo(0.5, 1)
  s.absarc(0, 1, 0.5, 0, Math.PI, false)
  s.lineTo(-0.5, 0)
  return new ShapeGeometry(s, 12)
}

function createGeometries() {
  return {
    box: new BoxGeometry(1, 1, 1),
    plane: new PlaneGeometry(1, 1),
    cyl: new CylinderGeometry(0.5, 0.5, 1, 20),
    cylLow: new CylinderGeometry(0.5, 0.5, 1, 8),
    taper: new CylinderGeometry(0.34, 0.5, 1, 14),
    cone: new ConeGeometry(0.5, 1, 14),
    sphere: new SphereGeometry(0.5, 16, 12),
    ico: new IcosahedronGeometry(0.5, 1),
    ring: new TorusGeometry(0.5, 0.04, 8, 32),
    coil: new TorusGeometry(0.5, 0.16, 8, 24),
    arch: archGeometry(),
  }
}

export type GeometryName = keyof ReturnType<typeof createGeometries>

function createTextures() {
  const tex = {
    plaster: T.plasterTexture(),
    shutter: T.shutterTexture(),
    shutterStatic: T.shutterTexture(),
    asphalt: T.asphaltTexture(),
    slab: T.slabTexture(),
    redOxide: T.redOxideTexture(),
    wood: T.woodPlankTexture(),
    sky: T.skyTexture(),
    puff: T.puffTexture(),
    tarp: T.tarpTexture(),
    pegboard: T.pegboardTexture(),
    poha: T.pohaTexture(),
    packets: T.packetStripTexture(),
    chaiAwning: T.stripeTexture('#d5a23b', '#f4ead2', 10),
    tailorAwning: T.stripeTexture('#883d3b', '#a44a45', 6),
    mainSign: T.mainSignTexture(),
    bladeSign: T.bladeSignTexture(),
    signClosed: T.openSignTexture(false),
    signOpen: T.openSignTexture(true),
    streetPlate: T.streetPlateTexture(),
    repairOngoing: T.repairOngoingTexture(),
    calendar: T.calendarTexture(),
    jobSheet: T.jobSheetTexture(),
    mamaBoard: T.mamaBoardTexture(),
    chalk: T.chalkTexture(),
    chaiSign: T.shopSignTexture({
      main: 'चाय • पोहा',
      sub: 'ZAIQA TEA STALL',
      bg: '#f3e6c8',
      fg: '#b3261e',
      subFg: '#2a1f18',
      border: '#b3261e',
      seed: 170,
    }),
    tailorSign: T.shopSignTexture({
      main: 'नाज़ टेलर्स',
      sub: 'NAAZ TAILORS · LADIES & GENTS',
      bg: '#7d2f33',
      fg: '#f8e7c4',
      subFg: '#f2c14e',
      seed: 180,
    }),
    partsSign: T.shopSignTexture({
      main: 'पुराने पुर्ज़े',
      sub: 'OLD PARTS · BUY / SELL',
      bg: '#1f1f1c',
      fg: '#f5c518',
      subFg: '#f0efe6',
      seed: 190,
    }),
    generalSign: T.shopSignTexture({
      main: 'किरण जनरल स्टोर',
      sub: 'KIRAN GENERAL STORE',
      bg: '#fbfaf3',
      fg: '#1f7a3a',
      subFg: '#b3261e',
      border: '#1f7a3a',
      seed: 200,
    }),
    sweetSign: T.shopSignTexture({
      main: 'मीठा घर',
      sub: 'MEETHA GHAR · SWEETS',
      bg: '#e8742c',
      fg: '#fff6df',
      subFg: '#3a1c0c',
      seed: 210,
    }),
  }
  tex.asphalt.repeat.set(12, 1.2)
  tex.slab.repeat.set(34, 0.5)
  tex.redOxide.repeat.set(2, 2)
  tex.wood.repeat.set(1.5, 1)
  tex.chaiAwning.repeat.set(2, 1)
  tex.tailorAwning.repeat.set(2, 1)
  return tex
}

export type TextureName = keyof ReturnType<typeof createTextures>

export interface MatOptions {
  rough?: number
  metal?: number
  emissive?: string
  emissiveIntensity?: number
  flat?: boolean
  side?: Side
  opacity?: number
  fog?: boolean
}

export interface WorldKit {
  geo: ReturnType<typeof createGeometries>
  tex: ReturnType<typeof createTextures>
  /** Shared, cached flat-colour material. */
  mat(color: string, opts?: MatOptions): MeshStandardMaterial
  /** Shared, cached textured material (optionally tinted). */
  texMat(name: TextureName, opts?: MatOptions & { color?: string; basic?: boolean }): Material
  /** Adopt a resource so it is disposed with the kit. */
  own<R extends { dispose(): void }>(resource: R): R
  dispose(): void
}

export function createWorldKit(): WorldKit {
  const geo = createGeometries()
  const tex = createTextures()
  const materials = new Map<string, Material>()
  const owned: { dispose(): void }[] = []

  function standard(key: string, build: () => Material): Material {
    let m = materials.get(key)
    if (!m) {
      m = build()
      materials.set(key, m)
    }
    return m
  }

  function params(opts: MatOptions) {
    const transparent = opts.opacity !== undefined && opts.opacity < 1
    return {
      roughness: opts.rough ?? 0.85,
      metalness: opts.metal ?? 0,
      flatShading: opts.flat ?? false,
      side: opts.side ?? FrontSide,
      transparent,
      opacity: opts.opacity ?? 1,
      depthWrite: !transparent,
      ...(opts.emissive ? { emissive: opts.emissive, emissiveIntensity: opts.emissiveIntensity ?? 1 } : {}),
    }
  }

  const kit: WorldKit = {
    geo,
    tex,
    mat(color, opts = {}) {
      const key = `c|${color}|${JSON.stringify(opts)}`
      return standard(key, () => new MeshStandardMaterial({ color, ...params(opts) })) as MeshStandardMaterial
    },
    texMat(name, opts = {}) {
      const key = `t|${name}|${JSON.stringify(opts)}`
      return standard(key, () => {
        const map: Texture = tex[name]
        if (opts.basic) {
          return new MeshBasicMaterial({
            map,
            color: opts.color ?? '#ffffff',
            fog: opts.fog ?? true,
            side: opts.side ?? FrontSide,
          })
        }
        return new MeshStandardMaterial({ map, color: opts.color ?? '#ffffff', ...params(opts) })
      })
    },
    own(resource) {
      owned.push(resource)
      return resource
    },
    dispose() {
      for (const g of Object.values(geo) as BufferGeometry[]) g.dispose()
      for (const t of Object.values(tex) as Texture[]) t.dispose()
      for (const m of materials.values()) m.dispose()
      for (const r of owned) r.dispose()
      materials.clear()
      owned.length = 0
    },
  }
  return kit
}

export const KitContext = createContext<WorldKit | null>(null)

export function useKit(): WorldKit {
  const kit = useContext(KitContext)
  if (!kit) throw new Error('useKit must be used inside <KitContext.Provider>')
  return kit
}

export { DoubleSide }
