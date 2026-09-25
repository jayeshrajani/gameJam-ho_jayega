import { type ThreeElements, useFrame } from '@react-three/fiber'
import { createContext, type ReactNode, useContext, useRef } from 'react'
import type { Group } from 'three'
import { selectReducedMotion, useGame } from '../app/state'

export interface AmbientClock {
  /** Accumulated ambient time; frozen while motion is reduced. */
  t: number
  /** Clamped frame delta (0 while frozen) so tab restores never cause jumps. */
  dt: number
  animate: boolean
}

export const AmbientContext = createContext<{ current: AmbientClock } | null>(null)

export function useAmbient(): { current: AmbientClock } {
  const clock = useContext(AmbientContext)
  if (!clock) throw new Error('useAmbient must be used inside <AmbientContext.Provider>')
  return clock
}

const MAX_DT = 1 / 20

/** Runs first each frame and advances the shared ambient clock. */
export function AmbientDriver() {
  const clock = useAmbient()
  useFrame((_, delta) => {
    const animate = !selectReducedMotion(useGame.getState())
    const dt = animate ? Math.min(delta, MAX_DT) : 0
    clock.current.animate = animate
    clock.current.dt = dt
    clock.current.t += dt
  }, -1)
  return null
}

type SwayProps = Omit<ThreeElements['group'], 'ref'> & {
  axis?: 'x' | 'y' | 'z'
  amp?: number
  speed?: number
  phase?: number
  children?: ReactNode
}

/** Gentle pendulum motion for cloth, awnings and hanging signs. */
export function Sway({ axis = 'z', amp = 0.05, speed = 1.3, phase = 0, children, ...rest }: SwayProps) {
  const ref = useRef<Group>(null)
  const clock = useAmbient()
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const { t, animate } = clock.current
    g.rotation[axis] = animate
      ? Math.sin(t * speed + phase) * amp + Math.sin(t * speed * 2.3 + phase * 1.7) * amp * 0.3
      : 0
  })
  return (
    <group {...rest}>
      <group ref={ref}>{children}</group>
    </group>
  )
}
