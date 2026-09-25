/** Single source of truth for the shop-opening sequence (seconds). */
export interface EnterTimeline {
  duration: number
  shutter: readonly [number, number]
  sign: readonly [number, number]
  push: readonly [number, number]
  fadeIn: readonly [number, number]
  /** Moment the camera cuts to the workshop, hidden behind the fade. */
  cut: number
}

export const FULL_ENTER: EnterTimeline = {
  duration: 1.9,
  shutter: [0.05, 0.8],
  sign: [0.35, 0.75],
  push: [0.25, 1.42],
  fadeIn: [1.08, 1.42],
  cut: 1.42,
}

export const REDUCED_ENTER: EnterTimeline = {
  duration: 0.4,
  shutter: [0.15, 0.15],
  sign: [0.15, 0.15],
  push: [0.15, 0.15],
  fadeIn: [0, 0.15],
  cut: 0.15,
}

export const DAY_CARD_MS = 2400
export const RETURN_FADE_MS = 450

export function timelineFor(reducedMotion: boolean): EnterTimeline {
  return reducedMotion ? REDUCED_ENTER : FULL_ENTER
}

export function phase(t: number, [start, end]: readonly [number, number]): number {
  if (end <= start) return t >= start ? 1 : 0
  return Math.min(1, Math.max(0, (t - start) / (end - start)))
}

export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2
}

export function easeOutBack(x: number): number {
  const c1 = 1.4
  const c3 = c1 + 1
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2
}
