import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

export const FONT_DISPLAY =
  '"Baloo 2", Mukta, "Nirmala UI", "Kohinoor Devanagari", "Devanagari Sangam MN", "Noto Sans Devanagari", sans-serif'
export const FONT_BODY = 'Mukta, "Baloo 2", "Nirmala UI", "Kohinoor Devanagari", "Noto Sans Devanagari", sans-serif'
export const FONT_HAND = 'Kalam, Mukta, "Nirmala UI", "Kohinoor Devanagari", cursive'

export const PALETTE = {
  plaster: '#E9D8B4',
  teal: '#387C78',
  maroon: '#883D3B',
  mustard: '#D5A23B',
  wood: '#49382D',
  cream: '#F6EAD0',
  ink: '#2A1F18',
  penBlue: '#1F3A8A',
} as const

/** Deterministic PRNG so textures look identical every load. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Ctx = CanvasRenderingContext2D

function surface(w: number, h: number): { c: HTMLCanvasElement; ctx: Ctx } {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is unavailable')
  return { c, ctx }
}

function finish(c: HTMLCanvasElement, opts: { repeat?: boolean; color?: boolean } = {}): CanvasTexture {
  const t = new CanvasTexture(c)
  if (opts.color !== false) t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  if (opts.repeat) {
    t.wrapS = RepeatWrapping
    t.wrapT = RepeatWrapping
  }
  t.needsUpdate = true
  return t
}

interface TextStyle {
  size: number
  weight?: number | string
  family?: string
  fill: string
  outline?: string
  outlineWidth?: number
  shadow?: string
  shadowOffset?: [number, number]
  maxWidth?: number
  spacing?: number
  align?: CanvasTextAlign
}

function setFont(ctx: Ctx, s: TextStyle, size: number): void {
  ctx.font = `${s.weight ?? 700} ${size}px ${s.family ?? FONT_DISPLAY}`
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${s.spacing ?? 0}px`
}

/** Sign-painter style: offset shadow, outline, then fill. Whole strings keep Devanagari conjuncts intact. */
function paint(ctx: Ctx, text: string, x: number, y: number, s: TextStyle): void {
  let size = s.size
  setFont(ctx, s, size)
  if (s.maxWidth) {
    const w = ctx.measureText(text).width
    if (w > s.maxWidth) {
      size = Math.floor((size * s.maxWidth) / w)
      setFont(ctx, s, size)
    }
  }
  ctx.textAlign = s.align ?? 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  if (s.shadow) {
    const [dx, dy] = s.shadowOffset ?? [4, 5]
    ctx.fillStyle = s.shadow
    if (s.outline) {
      ctx.strokeStyle = s.shadow
      ctx.lineWidth = s.outlineWidth ?? 6
      ctx.strokeText(text, x + dx, y + dy)
    }
    ctx.fillText(text, x + dx, y + dy)
  }
  if (s.outline) {
    ctx.strokeStyle = s.outline
    ctx.lineWidth = s.outlineWidth ?? 6
    ctx.strokeText(text, x, y)
  }
  ctx.fillStyle = s.fill
  ctx.fillText(text, x, y)
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'
}

function grain(ctx: Ctx, w: number, h: number, count: number, alpha: number, seed: number, dark = true): void {
  const r = rng(seed)
  for (let i = 0; i < count; i++) {
    const v = dark ? 0 : 255
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha * r()})`
    const s = 1 + r() * 2.5
    ctx.fillRect(r() * w, r() * h, s, s)
  }
}

function streaks(ctx: Ctx, w: number, h: number, count: number, color: string, seed: number): void {
  const r = rng(seed)
  ctx.strokeStyle = color
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = 0.05 + r() * 0.08
    ctx.lineWidth = 2 + r() * 8
    const y = r() * h
    ctx.beginPath()
    ctx.moveTo(-10, y)
    ctx.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 10, w * 0.7, y + (r() - 0.5) * 10, w + 10, y + (r() - 0.5) * 6)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function wobblyRect(ctx: Ctx, x: number, y: number, w: number, h: number, jitter: number, seed: number): void {
  const r = rng(seed)
  const j = () => (r() - 0.5) * jitter
  ctx.beginPath()
  ctx.moveTo(x + j(), y + j())
  ctx.lineTo(x + w * 0.5 + j(), y + j())
  ctx.lineTo(x + w + j(), y + j())
  ctx.lineTo(x + w + j(), y + h * 0.5 + j())
  ctx.lineTo(x + w + j(), y + h + j())
  ctx.lineTo(x + w * 0.5 + j(), y + h + j())
  ctx.lineTo(x + j(), y + h + j())
  ctx.lineTo(x + j(), y + h * 0.5 + j())
  ctx.closePath()
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

// ---------------------------------------------------------------- surfaces

export function plasterTexture(): CanvasTexture {
  const { c, ctx } = surface(256, 256)
  ctx.fillStyle = '#f4f0e8'
  ctx.fillRect(0, 0, 256, 256)
  const r = rng(11)
  for (let i = 0; i < 70; i++) {
    const x = r() * 256
    const y = r() * 256
    const rad = 10 + r() * 40
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
    const tone = r() > 0.5 ? '255,255,255' : '150,130,110'
    g.addColorStop(0, `rgba(${tone},${0.05 + r() * 0.08})`)
    g.addColorStop(1, `rgba(${tone},0)`)
    ctx.fillStyle = g
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  // A few rain stains running down from the top.
  for (let i = 0; i < 6; i++) {
    const x = r() * 256
    const g = ctx.createLinearGradient(0, 0, 0, 120)
    g.addColorStop(0, 'rgba(120,100,80,0.10)')
    g.addColorStop(1, 'rgba(120,100,80,0)')
    ctx.fillStyle = g
    ctx.fillRect(x, 0, 6 + r() * 14, 60 + r() * 60)
  }
  grain(ctx, 256, 256, 2600, 0.12, 12)
  return finish(c, { repeat: true })
}

export function shutterTexture(): CanvasTexture {
  const { c, ctx } = surface(128, 512)
  const ribs = 26
  const rh = 512 / ribs
  for (let i = 0; i < ribs; i++) {
    const y = i * rh
    const g = ctx.createLinearGradient(0, y, 0, y + rh)
    g.addColorStop(0, '#9aa3a0')
    g.addColorStop(0.35, '#e8ece8')
    g.addColorStop(0.7, '#b9c0bc')
    g.addColorStop(1, '#5d6461')
    ctx.fillStyle = g
    ctx.fillRect(0, y, 128, rh)
  }
  const r = rng(21)
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = `rgba(110,70,40,${0.05 + r() * 0.08})`
    ctx.fillRect(r() * 128, r() * 512, 2 + r() * 4, 20 + r() * 80)
  }
  grain(ctx, 128, 512, 900, 0.12, 22)
  return finish(c, { repeat: true })
}

export function asphaltTexture(): CanvasTexture {
  const { c, ctx } = surface(512, 512)
  ctx.fillStyle = '#7b7268'
  ctx.fillRect(0, 0, 512, 512)
  const r = rng(31)
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(60,55,50,0.18)' : 'rgba(150,140,125,0.15)'
    ctx.beginPath()
    ctx.ellipse(r() * 512, r() * 512, 20 + r() * 70, 12 + r() * 40, r() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = 'rgba(55,50,46,0.22)'
    ctx.fillRect(r() * 480, r() * 480, 40 + r() * 80, 25 + r() * 50)
  }
  grain(ctx, 512, 512, 9000, 0.25, 32)
  grain(ctx, 512, 512, 4000, 0.18, 33, false)
  return finish(c, { repeat: true })
}

export function slabTexture(): CanvasTexture {
  const { c, ctx } = surface(256, 256)
  const r = rng(41)
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const l = 180 + Math.floor(r() * 30)
      ctx.fillStyle = `rgb(${l},${l - 12},${l - 30})`
      ctx.fillRect(x * 64, y * 64, 64, 64)
    }
  }
  ctx.strokeStyle = 'rgba(70,55,40,0.45)'
  ctx.lineWidth = 2
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath()
    ctx.moveTo(i * 64, 0)
    ctx.lineTo(i * 64, 256)
    ctx.moveTo(0, i * 64)
    ctx.lineTo(256, i * 64)
    ctx.stroke()
  }
  grain(ctx, 256, 256, 2500, 0.18, 42)
  return finish(c, { repeat: true })
}

export function redOxideTexture(): CanvasTexture {
  const { c, ctx } = surface(256, 256)
  ctx.fillStyle = '#9a4332'
  ctx.fillRect(0, 0, 256, 256)
  const r = rng(51)
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(255,220,200,${r() * 0.06})`
    ctx.beginPath()
    ctx.ellipse(r() * 256, r() * 256, 10 + r() * 40, 5 + r() * 20, r() * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.strokeStyle = 'rgba(40,15,10,0.35)'
  ctx.lineWidth = 1.5
  for (let i = 0; i <= 256; i += 64) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, 256)
    ctx.moveTo(0, i)
    ctx.lineTo(256, i)
    ctx.stroke()
  }
  grain(ctx, 256, 256, 2000, 0.15, 52)
  return finish(c, { repeat: true })
}

export function woodPlankTexture(): CanvasTexture {
  const { c, ctx } = surface(256, 256)
  const r = rng(61)
  const planks = 6
  const pw = 256 / planks
  for (let i = 0; i < planks; i++) {
    const l = 0.85 + r() * 0.3
    ctx.fillStyle = `rgb(${Math.floor(92 * l)},${Math.floor(68 * l)},${Math.floor(52 * l)})`
    ctx.fillRect(i * pw, 0, pw, 256)
    ctx.strokeStyle = 'rgba(30,18,10,0.25)'
    for (let k = 0; k < 6; k++) {
      ctx.lineWidth = 1 + r()
      ctx.beginPath()
      const x = i * pw + r() * pw
      ctx.moveTo(x, 0)
      ctx.bezierCurveTo(x + 4, 80, x - 4, 170, x + 2, 256)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(20,12,8,0.6)'
    ctx.fillRect(i * pw, 0, 2, 256)
  }
  return finish(c, { repeat: true })
}

export function skyTexture(): CanvasTexture {
  const { c, ctx } = surface(8, 256)
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, '#9fc5cf')
  g.addColorStop(0.45, '#d9e2d4')
  g.addColorStop(0.75, '#f7dfb8')
  g.addColorStop(1, '#f4cf9d')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 8, 256)
  return finish(c)
}

export function puffTexture(): CanvasTexture {
  const { c, ctx } = surface(64, 64)
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return finish(c)
}

export function stripeTexture(a: string, b: string, stripes = 8): CanvasTexture {
  const { c, ctx } = surface(256, 32)
  const sw = 256 / stripes
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? a : b
    ctx.fillRect(i * sw, 0, sw, 32)
  }
  grain(ctx, 256, 32, 300, 0.12, 71)
  return finish(c, { repeat: true })
}

export function tarpTexture(): CanvasTexture {
  const { c, ctx } = surface(256, 128)
  ctx.fillStyle = '#2f68a8'
  ctx.fillRect(0, 0, 256, 128)
  const r = rng(81)
  for (let i = 0; i < 18; i++) {
    ctx.strokeStyle = r() > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,30,0.18)'
    ctx.lineWidth = 3 + r() * 6
    ctx.beginPath()
    const x = r() * 256
    ctx.moveTo(x, 0)
    ctx.quadraticCurveTo(x + (r() - 0.5) * 60, 64, x + (r() - 0.5) * 40, 128)
    ctx.stroke()
  }
  ctx.fillStyle = '#c9d6e6'
  for (let x = 12; x < 256; x += 48) ctx.fillRect(x, 4, 6, 6)
  return finish(c)
}

export function pegboardTexture(): CanvasTexture {
  const { c, ctx } = surface(512, 256)
  ctx.fillStyle = '#8c6c4a'
  ctx.fillRect(0, 0, 512, 256)
  grain(ctx, 512, 256, 3000, 0.15, 91)
  ctx.fillStyle = 'rgba(35,22,14,0.8)'
  for (let y = 12; y < 256; y += 22) {
    for (let x = 12; x < 512; x += 22) {
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  return finish(c)
}

export function pohaTexture(): CanvasTexture {
  const { c, ctx } = surface(128, 128)
  ctx.fillStyle = '#e9c64e'
  ctx.fillRect(0, 0, 128, 128)
  const r = rng(101)
  const flecks = ['#4f8c36', '#7a4a24', '#f08a2a', '#fff2b0']
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = flecks[i % flecks.length] ?? '#fff'
    ctx.fillRect(r() * 128, r() * 128, 2 + r() * 3, 1.5 + r() * 2)
  }
  return finish(c)
}

export function packetStripTexture(): CanvasTexture {
  const { c, ctx } = surface(64, 512)
  const colours = ['#e53935', '#fdd835', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#00897b']
  for (let i = 0; i < 8; i++) {
    const y = i * 64
    ctx.fillStyle = colours[i % colours.length] ?? '#fff'
    ctx.fillRect(4, y + 4, 56, 56)
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.beginPath()
    ctx.ellipse(32, y + 30, 16, 10, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(14, y + 46, 36, 4)
  }
  return finish(c)
}

// ---------------------------------------------------------------- signboards

export function mainSignTexture(main = 'हो जाएगा'): CanvasTexture {
  const W = 1024
  const H = 352
  const { c, ctx } = surface(W, H)
  ctx.fillStyle = PALETTE.mustard
  ctx.fillRect(0, 0, W, H)
  streaks(ctx, W, H, 40, '#f2c766', 1)
  streaks(ctx, W, H, 25, '#9c6f1c', 2)

  ctx.strokeStyle = PALETTE.maroon
  ctx.lineWidth = 16
  wobblyRect(ctx, 14, 14, W - 28, H - 28, 5, 3)
  ctx.stroke()
  ctx.strokeStyle = PALETTE.cream
  ctx.lineWidth = 4
  wobblyRect(ctx, 32, 32, W - 64, H - 64, 3, 4)
  ctx.stroke()

  ctx.fillStyle = PALETTE.maroon
  for (const [x, y] of [
    [50, 50],
    [W - 50, 50],
    [50, H - 50],
    [W - 50, H - 50],
  ] as const) {
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.fill()
  }

  paint(ctx, main, W / 2, 118, {
    size: 150,
    weight: 800,
    fill: PALETTE.maroon,
    outline: PALETTE.cream,
    outlineWidth: 12,
    shadow: '#3b2418',
    shadowOffset: [6, 7],
    maxWidth: 700,
  })
  paint(ctx, 'REPAIR WORKS', W / 2, 222, {
    size: 64,
    weight: 800,
    fill: '#2b2019',
    spacing: 8,
    maxWidth: 560,
  })
  drawSpanner(ctx, 150, 222, 0.9, '#2b2019')
  drawScrewdriver(ctx, W - 150, 222, 0.9, '#2b2019')

  ctx.fillStyle = PALETTE.maroon
  ctx.fillRect(W / 2 - 250, 262, 500, 4)
  paint(ctx, 'जुगाड़ हमारा, भरोसा आपका।', W / 2, 298, {
    size: 40,
    weight: 700,
    fill: '#1f5753',
    maxWidth: 760,
  })
  grain(ctx, W, H, 2500, 0.15, 5)
  return finish(c)
}

function drawSpanner(ctx: Ctx, x: number, y: number, s: number, color: string): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(-0.6)
  ctx.scale(s, s)
  ctx.fillStyle = color
  ctx.fillRect(-45, -7, 90, 14)
  ctx.beginPath()
  ctx.arc(-50, 0, 18, 0, Math.PI * 2)
  ctx.arc(50, 0, 18, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = PALETTE.mustard
  ctx.fillRect(-72, -6, 24, 12)
  ctx.fillRect(48, -6, 24, 12)
  ctx.restore()
}

function drawScrewdriver(ctx: Ctx, x: number, y: number, s: number, color: string): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(0.6)
  ctx.scale(s, s)
  ctx.fillStyle = PALETTE.maroon
  roundRect(ctx, -60, -12, 50, 24, 8)
  ctx.fill()
  ctx.fillStyle = color
  ctx.fillRect(-12, -4, 62, 8)
  ctx.fillRect(48, -7, 12, 14)
  ctx.restore()
}

export function bladeSignTexture(): CanvasTexture {
  const W = 384
  const H = 512
  const { c, ctx } = surface(W, H)
  ctx.fillStyle = PALETTE.teal
  ctx.fillRect(0, 0, W, H)
  streaks(ctx, W, H, 30, '#5aa19c', 6)
  ctx.strokeStyle = PALETTE.cream
  ctx.lineWidth = 10
  wobblyRect(ctx, 16, 16, W - 32, H - 32, 4, 7)
  ctx.stroke()
  const style: TextStyle = {
    size: 92,
    weight: 800,
    fill: PALETTE.cream,
    shadow: '#1a3b39',
    shadowOffset: [4, 5],
    maxWidth: W - 70,
  }
  paint(ctx, 'पंखा', W / 2, 110, style)
  paint(ctx, 'मिक्सर', W / 2, 262, style)
  paint(ctx, 'रेडियो', W / 2, 414, style)
  ctx.fillStyle = PALETTE.mustard
  for (const y of [186, 338]) {
    ctx.beginPath()
    ctx.arc(W / 2, y, 10, 0, Math.PI * 2)
    ctx.fill()
  }
  grain(ctx, W, H, 1200, 0.15, 8)
  return finish(c)
}

export function openSignTexture(open: boolean): CanvasTexture {
  const W = 256
  const H = 150
  const { c, ctx } = surface(W, H)
  ctx.fillStyle = open ? '#2f7a4d' : PALETTE.maroon
  roundRect(ctx, 0, 0, W, H, 14)
  ctx.fill()
  ctx.strokeStyle = PALETTE.cream
  ctx.lineWidth = 5
  roundRect(ctx, 10, 10, W - 20, H - 20, 10)
  ctx.stroke()
  paint(ctx, open ? 'खुला' : 'बंद', W / 2, 58, { size: 62, weight: 800, fill: PALETTE.cream })
  paint(ctx, open ? 'OPEN' : 'CLOSED', W / 2, 112, { size: 36, weight: 800, fill: '#ffe6a6', spacing: 4 })
  return finish(c)
}

export function streetPlateTexture(): CanvasTexture {
  const W = 512
  const H = 200
  const { c, ctx } = surface(W, H)
  ctx.fillStyle = '#1d4f8f'
  roundRect(ctx, 0, 0, W, H, 26)
  ctx.fill()
  ctx.strokeStyle = '#f5f5ef'
  ctx.lineWidth = 8
  roundRect(ctx, 14, 14, W - 28, H - 28, 18)
  ctx.stroke()
  paint(ctx, 'पुराना भोपाल', W / 2, 76, { size: 72, weight: 800, fill: '#f5f5ef', maxWidth: W - 60 })
  paint(ctx, 'Old Bhopal', W / 2, 146, { size: 48, weight: 600, family: FONT_BODY, fill: '#f5f5ef', spacing: 2 })
  const r = rng(111)
  ctx.fillStyle = '#10213a'
  for (let i = 0; i < 9; i++) {
    const edge = r() > 0.5
    const x = edge ? (r() > 0.5 ? 6 + r() * 20 : W - 6 - r() * 20) : r() * W
    const y = edge ? r() * H : r() > 0.5 ? 6 + r() * 12 : H - 6 - r() * 12
    ctx.beginPath()
    ctx.ellipse(x, y, 3 + r() * 7, 2 + r() * 5, r() * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  return finish(c)
}

interface ShopSignSpec {
  main: string
  sub: string
  bg: string
  fg: string
  subFg: string
  border?: string
  seed: number
}

export function shopSignTexture(spec: ShopSignSpec): CanvasTexture {
  const W = 768
  const H = 192
  const { c, ctx } = surface(W, H)
  ctx.fillStyle = spec.bg
  ctx.fillRect(0, 0, W, H)
  streaks(ctx, W, H, 25, 'rgba(255,255,255,0.6)', spec.seed)
  if (spec.border) {
    ctx.strokeStyle = spec.border
    ctx.lineWidth = 8
    wobblyRect(ctx, 12, 12, W - 24, H - 24, 3, spec.seed + 1)
    ctx.stroke()
  }
  paint(ctx, spec.main, W / 2, 78, {
    size: 92,
    weight: 800,
    fill: spec.fg,
    shadow: 'rgba(0,0,0,0.35)',
    shadowOffset: [3, 4],
    maxWidth: W - 80,
  })
  paint(ctx, spec.sub, W / 2, 150, { size: 38, weight: 700, fill: spec.subFg, spacing: 3, maxWidth: W - 80 })
  grain(ctx, W, H, 1400, 0.14, spec.seed + 2)
  return finish(c)
}

export function repairOngoingTexture(): CanvasTexture {
  const W = 384
  const H = 200
  const { c, ctx } = surface(W, H)
  ctx.fillStyle = '#b98d5c'
  ctx.fillRect(0, 0, W, H)
  grain(ctx, W, H, 1500, 0.2, 121)
  ctx.strokeStyle = 'rgba(80,50,25,0.35)'
  ctx.lineWidth = 2
  for (let x = 20; x < W; x += 26) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  ctx.save()
  ctx.translate(W / 2, H / 2)
  ctx.rotate(-0.04)
  paint(ctx, 'मरम्मत जारी है', 0, -22, { size: 58, weight: 700, family: FONT_HAND, fill: '#1c1612', maxWidth: W - 40 })
  paint(ctx, 'repair in progress', 0, 44, { size: 32, weight: 400, family: FONT_HAND, fill: '#7a1f1a' })
  ctx.restore()
  return finish(c)
}

// ---------------------------------------------------------------- paper

/** A neighbour's chalk review on the shop pillar (transparent background). */
export function chalkTexture(): CanvasTexture {
  const W = 384
  const H = 256
  const { c, ctx } = surface(W, H)
  ctx.save()
  ctx.translate(W / 2, H / 2)
  ctx.rotate(-0.08)
  paint(ctx, 'HO JAYEGA', 0, -52, { size: 64, weight: 700, family: FONT_HAND, fill: 'rgba(250,248,240,0.92)' })
  ctx.strokeStyle = 'rgba(250,248,240,0.9)'
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  // A crude thumbs-up.
  ctx.beginPath()
  ctx.roundRect(-40, 22, 64, 58, 12)
  ctx.moveTo(-14, 22)
  ctx.lineTo(-18, -8)
  ctx.quadraticCurveTo(-10, -18, -2, -8)
  ctx.lineTo(4, 22)
  ctx.moveTo(-40, 42)
  ctx.lineTo(24, 42)
  ctx.moveTo(-40, 60)
  ctx.lineTo(24, 60)
  ctx.stroke()
  ctx.restore()
  const r = rng(231)
  ctx.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 900; i++) ctx.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2)
  return finish(c)
}

/** Mama's hand-painted board above the side bench; repainted once the week is done. */
export function mamaBoardTexture(done = false): CanvasTexture {
  const W = 512
  const H = 256
  const { c, ctx } = surface(W, H)
  ctx.fillStyle = '#2f3b33'
  ctx.fillRect(0, 0, W, H)
  streaks(ctx, W, H, 30, 'rgba(255,255,255,0.35)', 221)
  ctx.strokeStyle = '#8a6443'
  ctx.lineWidth = 14
  ctx.strokeRect(7, 7, W - 14, H - 14)
  if (done) {
    paint(ctx, 'HO JAYEGA', W / 2, 62, { size: 40, weight: 700, family: FONT_HAND, fill: 'rgba(243,233,207,0.55)' })
    ctx.strokeStyle = '#f2c14e'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(W / 2 - 120, 64)
    ctx.lineTo(W / 2 + 120, 58)
    ctx.stroke()
    paint(ctx, 'HO GAYA!', W / 2, 138, { size: 76, weight: 700, family: FONT_HAND, fill: '#f3e9cf' })
    paint(ctx, '— Mama & the new boss', W - 50, 222, { size: 24, weight: 700, family: FONT_HAND, fill: '#f2c14e', align: 'right' })
    return finish(c)
  }
  paint(ctx, 'HO JAYEGA.', W / 2, 78, { size: 64, weight: 700, family: FONT_HAND, fill: '#f3e9cf' })
  paint(ctx, 'Pehle dekh toh sahi,', W / 2, 146, { size: 38, weight: 400, family: FONT_HAND, fill: '#f3e9cf' })
  paint(ctx, 'problem kya hai.', W / 2, 190, { size: 38, weight: 400, family: FONT_HAND, fill: '#f3e9cf' })
  paint(ctx, '— Mama', W - 60, 228, { size: 24, weight: 700, family: FONT_HAND, fill: '#f2c14e', align: 'right' })
  return finish(c)
}

/** The pandal banner over the wedding stage (Day 7). */
export function weddingBannerTexture(): CanvasTexture {
  const W = 768
  const H = 192
  const { c, ctx } = surface(W, H)
  ctx.fillStyle = '#9b1b30'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#f2c14e'
  ctx.lineWidth = 10
  ctx.strokeRect(10, 10, W - 20, H - 20)
  ctx.fillStyle = '#f39c12'
  for (let x = 40; x < W - 20; x += 56) {
    ctx.beginPath()
    ctx.arc(x, 30, 9, 0, Math.PI * 2)
    ctx.arc(x, H - 30, 9, 0, Math.PI * 2)
    ctx.fill()
  }
  paint(ctx, 'शुभ विवाह', W / 2, 92, { size: 82, weight: 800, fill: '#f8e7c4', outline: '#5a0f1c', outlineWidth: 6, maxWidth: 640 })
  paint(ctx, 'AYESHA’S DIDI WEDS', W / 2, 150, { size: 28, weight: 700, fill: '#f2c14e', spacing: 4, maxWidth: 600 })
  return finish(c)
}

function paper(ctx: Ctx, w: number, h: number, tone = '#f7f0de', seed = 1): void {
  ctx.fillStyle = tone
  ctx.fillRect(0, 0, w, h)
  grain(ctx, w, h, Math.floor((w * h) / 60), 0.06, seed)
}

export function calendarTexture(now: Date = new Date()): CanvasTexture {
  const W = 256
  const H = 384
  const { c, ctx } = surface(W, H)
  paper(ctx, W, H, '#fbf8ef', 131)
  ctx.fillStyle = '#b3261e'
  ctx.fillRect(0, 0, W, 34)
  paint(ctx, 'NOOR BATTERY HOUSE', W / 2, 18, { size: 20, weight: 800, fill: '#fff', spacing: 1, maxWidth: W - 20 })

  // Painted lake-and-hills picture.
  const py = 40
  const ph = 150
  const g = ctx.createLinearGradient(0, py, 0, py + ph)
  g.addColorStop(0, '#f6c98a')
  g.addColorStop(1, '#f9e7c4')
  ctx.fillStyle = g
  ctx.fillRect(10, py, W - 20, ph)
  ctx.fillStyle = '#f39c4a'
  ctx.beginPath()
  ctx.arc(170, py + 55, 20, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#6f8f64'
  ctx.beginPath()
  ctx.moveTo(10, py + 100)
  ctx.quadraticCurveTo(70, py + 55, 130, py + 95)
  ctx.quadraticCurveTo(190, py + 65, W - 10, py + 100)
  ctx.lineTo(W - 10, py + ph)
  ctx.lineTo(10, py + ph)
  ctx.fill()
  ctx.fillStyle = '#4f8fa8'
  ctx.fillRect(10, py + 105, W - 20, ph - 105)
  ctx.fillStyle = '#7a4a2a'
  ctx.beginPath()
  ctx.moveTo(90, py + 122)
  ctx.lineTo(130, py + 122)
  ctx.lineTo(122, py + 130)
  ctx.lineTo(98, py + 130)
  ctx.fill()

  const month = now.toLocaleString('en-IN', { month: 'long' }).toUpperCase()
  paint(ctx, `${month} ${now.getFullYear()}`, W / 2, 208, { size: 24, weight: 800, fill: '#2a1f18', spacing: 2 })
  const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay()
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const cw = (W - 20) / 7
  const heads = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  heads.forEach((d, i) =>
    paint(ctx, d, 10 + cw * i + cw / 2, 234, { size: 15, weight: 800, fill: i === 0 ? '#b3261e' : '#555' }),
  )
  for (let d = 1; d <= days; d++) {
    const idx = first + d - 1
    const col = idx % 7
    const row = Math.floor(idx / 7)
    const x = 10 + cw * col + cw / 2
    const y = 258 + row * 22
    paint(ctx, String(d), x, y, { size: 16, weight: 600, family: FONT_BODY, fill: col === 0 ? '#b3261e' : '#2a1f18' })
    if (d === now.getDate()) {
      ctx.strokeStyle = '#c62828'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.ellipse(x, y, 13, 10, -0.2, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  return finish(c)
}

export function jobSheetTexture(): CanvasTexture {
  const W = 256
  const H = 352
  const { c, ctx } = surface(W, H)
  paper(ctx, W, H, '#f3ecd8', 141)
  paint(ctx, 'JOB SHEET', 18, 30, { size: 30, weight: 700, family: FONT_HAND, fill: PALETTE.penBlue, align: 'left' })
  paint(ctx, 'जॉब शीट', W - 18, 32, { size: 24, weight: 700, family: FONT_HAND, fill: '#7a1f1a', align: 'right' })
  ctx.strokeStyle = 'rgba(40,60,140,0.35)'
  ctx.lineWidth = 1.5
  for (let y = 80; y < H - 10; y += 28) {
    ctx.beginPath()
    ctx.moveTo(10, y)
    ctx.lineTo(W - 10, y)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(190,40,40,0.5)'
  ctx.beginPath()
  ctx.moveTo(44, 56)
  ctx.lineTo(44, H - 10)
  ctx.moveTo(190, 56)
  ctx.lineTo(190, H - 10)
  ctx.stroke()
  const head: TextStyle = { size: 18, weight: 700, family: FONT_HAND, fill: '#333', align: 'left' }
  paint(ctx, 'No.', 12, 68, head)
  paint(ctx, 'Item / kaam', 52, 68, head)
  paint(ctx, 'Status', 196, 68, head)
  paint(ctx, 'Day 1 —', 52, 96, { ...head, fill: PALETTE.penBlue, size: 20 })
  return finish(c)
}

export function paperNoteTexture(lines: readonly { text: string; size: number; bold?: boolean }[]): CanvasTexture {
  const W = 400
  const H = 300
  const { c, ctx } = surface(W, H)
  paper(ctx, W, H, '#fbf4df', 151)
  ctx.strokeStyle = 'rgba(40,60,140,0.2)'
  ctx.lineWidth = 1.5
  for (let y = 70; y < H; y += 38) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }
  ctx.fillStyle = 'rgba(235,225,180,0.85)'
  ctx.save()
  ctx.translate(W / 2, 12)
  ctx.rotate(-0.05)
  ctx.fillRect(-60, -14, 120, 30)
  ctx.restore()
  let y = 84
  for (const line of lines) {
    paint(ctx, line.text, W / 2, y, {
      size: line.size,
      weight: line.bold ? 700 : 400,
      family: FONT_HAND,
      fill: PALETTE.penBlue,
      maxWidth: W - 40,
    })
    y += line.size + 16
  }
  return finish(c)
}

export function registerTexture(): CanvasTexture {
  const W = 512
  const H = 320
  const { c, ctx } = surface(W, H)
  ctx.fillStyle = '#6b1f22'
  roundRect(ctx, 0, 0, W, H, 10)
  ctx.fill()
  ctx.fillStyle = '#f5eedb'
  ctx.fillRect(10, 10, W / 2 - 14, H - 20)
  ctx.fillRect(W / 2 + 4, 10, W / 2 - 14, H - 20)
  grain(ctx, W, H, 2500, 0.05, 161)
  const g = ctx.createLinearGradient(W / 2 - 20, 0, W / 2 + 20, 0)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(0.5, 'rgba(0,0,0,0.3)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(W / 2 - 20, 10, 40, H - 20)
  ctx.strokeStyle = 'rgba(40,60,140,0.3)'
  ctx.lineWidth = 1.5
  for (let y = 84; y < H - 16; y += 24) {
    ctx.beginPath()
    ctx.moveTo(18, y)
    ctx.lineTo(W / 2 - 10, y)
    ctx.moveTo(W / 2 + 12, y)
    ctx.lineTo(W - 18, y)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(190,40,40,0.55)'
  ctx.beginPath()
  ctx.moveTo(W / 2 + 44, 20)
  ctx.lineTo(W / 2 + 44, H - 16)
  ctx.stroke()
  paint(ctx, 'जॉब रजिस्टर', W / 4 + 4, 36, { size: 34, weight: 800, fill: PALETTE.maroon })
  paint(ctx, 'JOB REGISTER', W / 4 + 4, 64, { size: 18, weight: 700, fill: '#333', spacing: 3 })
  paint(ctx, 'Day 1', W / 2 + 56, 72, { size: 26, weight: 700, family: FONT_HAND, fill: PALETTE.penBlue, align: 'left' })
  return finish(c)
}

export function workMatTexture(): CanvasTexture {
  const W = 512
  const H = 384
  const { c, ctx } = surface(W, H)
  ctx.fillStyle = '#2e5b47'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(220,240,225,0.18)'
  ctx.lineWidth = 1
  for (let x = 16; x < W; x += 16) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  for (let y = 16; y < H; y += 16) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(230,245,230,0.4)'
  ctx.lineWidth = 2
  for (let x = 64; x < W; x += 64) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  for (let y = 64; y < H; y += 64) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }
  ctx.strokeStyle = PALETTE.mustard
  ctx.lineWidth = 6
  ctx.strokeRect(10, 10, W - 20, H - 20)
  paint(ctx, 'WORK AREA', W - 24, H - 30, {
    size: 20,
    weight: 700,
    fill: 'rgba(240,220,160,0.75)',
    align: 'right',
    spacing: 1,
  })
  return finish(c)
}
