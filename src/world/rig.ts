import type { Group, Object3D, Texture } from 'three'

/** Handles the Director animates. Filled by ref callbacks; no React state involved. */
export interface ShopRig {
  shutter: Group | null
  shutterBottom: Group | null
  lock: Object3D | null
  openSign: Group | null
  opposite: Group | null
  shutterTexture: Texture | null
}

export function createShopRig(): ShopRig {
  return { shutter: null, shutterBottom: null, lock: null, openSign: null, opposite: null, shutterTexture: null }
}

/** Height of the raised pavement the shops stand on. */
export const PLINTH = 0.22

/** Repair-shop dimensions shared by the shop, camera poses and day shells. */
export const SHOP = {
  width: 4.6,
  groundHeight: 3.6,
  height: 7.4,
  openingWidth: 3.2,
  openingHeight: 2.8,
  depth: 4.3,
  /** Counter-top height above the plinth. */
  counterTop: 1.045,
  counterZ: -0.7,
} as const
