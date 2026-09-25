import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { CanvasTexture, MeshBasicMaterial, SpriteMaterial, SRGBColorSpace } from 'three'
import type { Vec3 } from '../../app/cameraPose'
import { useKit } from '../../world/kit'
import { FONT_DISPLAY } from '../../world/textures'

type LabelStyle = 'tag' | 'marking' | 'markingDark'

interface Label {
  sprite?: SpriteMaterial
  plane?: MeshBasicMaterial
  aspect: number
}

/** Text textures made on demand and shared; everything is disposed when the day unmounts. */
class LabelCache {
  private readonly labels = new Map<string, Label>()
  private readonly textures: CanvasTexture[] = []

  get(text: string, style: LabelStyle): Label {
    const key = `${style}|${text}`
    const hit = this.labels.get(key)
    if (hit) return hit
    const H = 72
    const c = document.createElement('canvas')
    const ctx = c.getContext('2d')
    if (!ctx) return { aspect: 1 }
    const font = `700 ${style === 'tag' ? 40 : 48}px ${FONT_DISPLAY}`
    ctx.font = font
    const W = Math.ceil(ctx.measureText(text).width) + (style === 'tag' ? 44 : 16)
    c.width = W
    c.height = H
    ctx.font = font
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (style === 'tag') {
      ctx.fillStyle = 'rgba(42, 31, 24, 0.9)'
      ctx.beginPath()
      ctx.roundRect(2, 6, W - 4, H - 12, 16)
      ctx.fill()
      ctx.strokeStyle = '#d5a23b'
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.fillStyle = '#f6ead0'
    } else {
      ctx.fillStyle = style === 'marking' ? '#f3e9cf' : '#2a1f18'
    }
    ctx.fillText(text, W / 2, H / 2 + 2)
    const map = new CanvasTexture(c)
    map.colorSpace = SRGBColorSpace
    map.anisotropy = 4
    this.textures.push(map)
    const label: Label =
      style === 'tag'
        ? { sprite: new SpriteMaterial({ map, depthTest: false, transparent: true }), aspect: W / H }
        : { plane: new MeshBasicMaterial({ map, transparent: true, depthWrite: false }), aspect: W / H }
    this.labels.set(key, label)
    return label
  }

  dispose(): void {
    for (const l of this.labels.values()) {
      l.sprite?.dispose()
      l.plane?.dispose()
    }
    for (const t of this.textures) t.dispose()
    this.labels.clear()
    this.textures.length = 0
  }
}

const LabelContext = createContext<LabelCache | null>(null)

export function LabelProvider({ children }: { children: ReactNode }) {
  const cache = useMemo(() => new LabelCache(), [])
  useEffect(() => () => cache.dispose(), [cache])
  return <LabelContext.Provider value={cache}>{children}</LabelContext.Provider>
}

function useLabels(): LabelCache {
  const cache = useContext(LabelContext)
  if (!cache) throw new Error('Labels must be used inside <LabelProvider>')
  return cache
}

/** A floating name tag that always faces the camera and draws on top. */
export function Tag({ text, at, height = 0.026 }: { text: string; at: Vec3; height?: number }) {
  const label = useLabels().get(text, 'tag')
  if (!label.sprite) return null
  return <sprite material={label.sprite} position={[...at]} scale={[height * label.aspect, height, 1]} renderOrder={10} />
}

/** Lettering printed on a machine, facing the mechanic (-Z). */
export function Marking({ text, p, h = 0.013, dark = false }: { text: string; p: Vec3; h?: number; dark?: boolean }) {
  const kit = useKit()
  const label = useLabels().get(text, dark ? 'markingDark' : 'marking')
  if (!label.plane) return null
  return <mesh geometry={kit.geo.plane} material={label.plane} position={[...p]} rotation={[0, Math.PI, 0]} scale={[h * label.aspect, h, 1]} />
}

/** Hover state for 3D objects, keeping the cursor in sync. */
export function useHover(enabled = true) {
  const [hovered, setHovered] = useState(false)
  useEffect(() => {
    if (!enabled && hovered) setHovered(false)
  }, [enabled, hovered])
  useEffect(() => () => void (document.body.style.cursor = ''), [])
  return {
    hovered,
    bind: {
      onPointerOver: (e: { stopPropagation(): void }) => {
        e.stopPropagation()
        if (!enabled) return
        setHovered(true)
        document.body.style.cursor = 'pointer'
      },
      onPointerOut: () => {
        setHovered(false)
        document.body.style.cursor = ''
      },
    },
  }
}
