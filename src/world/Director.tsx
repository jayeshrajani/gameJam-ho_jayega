import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { type PerspectiveCamera, Vector3 } from 'three'
import type { CameraPose } from '../app/cameraPose'
import { type Screen, selectReducedMotion, useGame } from '../app/state'
import { easeInOutCubic, easeOutBack, phase, timelineFor } from '../app/transition'
import { useAmbient } from './ambient'
import { SHOP, type ShopRig } from './rig'

export type { CameraPose }

const NARROW = 0.95

export function titlePose(aspect: number): CameraPose {
  if (aspect < NARROW) return { pos: [3.0, 3.6, 21], target: [0.3, 0.6, 0], fov: 46 }
  // Wide screens keep the shop right of centre so the menu has room on the left.
  return { pos: [8.2, 3.55, 15.4], target: [-1.75, 3.15, 0], fov: 35 }
}

export function nameEntryPose(aspect: number): CameraPose {
  if (aspect < NARROW) return { pos: [2.6, 3.4, 18.5], target: [0.3, 0.4, 0], fov: 46 }
  return { pos: [6.8, 3.15, 12.8], target: [-1.35, 2.75, 0], fov: 35 }
}

// High enough to look down over passers-by instead of through them.
export const ENTRANCE_POSE: CameraPose = { pos: [0.2, 2.65, 2.6], target: [0.0, 1.25, -2.4], fov: 48 }

export function workshopPose(aspect: number): CameraPose {
  const fov = aspect < NARROW ? Math.min(82, 2 * Math.atan(Math.tan((40 * Math.PI) / 180) / aspect) * (180 / Math.PI)) : 54
  return { pos: [0.05, 2.22, -2.6], target: [-0.05, 1.1, 0.7], fov }
}

const tmpPos = new Vector3()

/** Keeps a desktop-tuned pose's horizontal view on narrow screens by widening the vertical FOV. */
function fitFov(fov: number, aspect: number): number {
  const ref = 1.6
  if (aspect >= ref * 0.85) return fov
  const halfH = Math.atan(Math.tan((fov * Math.PI) / 360) * ref)
  return Math.min(85, (2 * Math.atan(Math.tan(halfH) / aspect) * 180) / Math.PI)
}
const tmpTarget = new Vector3()
const goalPos = new Vector3()
const goalTarget = new Vector3()

/** Owns the camera and the shop's animated props. Everything is derived from app state each frame. */
export function Director({ rig }: { rig: ShopRig }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const clock = useAmbient()
  const target = useRef(new Vector3(...titlePose(16 / 9).target))
  const from = useRef({ pos: new Vector3(), target: new Vector3(), fov: 34 })
  const lastScreen = useRef<Screen | null>(null)

  useFrame((_, delta) => {
    const s = useGame.getState()
    const reduced = selectReducedMotion(s)
    const aspect = size.width / Math.max(1, size.height)
    const dt = Math.min(delta, 0.05)
    let snap = reduced

    if (s.screen !== lastScreen.current) {
      if (s.screen === 'ENTERING_SHOP') {
        from.current.pos.copy(camera.position)
        from.current.target.copy(target.current)
        from.current.fov = camera.fov
      }
      // First frame, or returning from the workshop under the fade: jump straight to the pose.
      if (lastScreen.current === null || lastScreen.current === 'SHOP') snap = true
      lastScreen.current = s.screen
    }

    let shutter = 0
    let sign = 0
    let inside = false
    let fov: number

    if (s.screen === 'ENTERING_SHOP' || s.screen === 'SHOP') {
      const tl = timelineFor(s.enterReduced)
      const t = s.screen === 'SHOP' ? Number.POSITIVE_INFINITY : (performance.now() - s.enterStartedAt) / 1000
      shutter = easeInOutCubic(phase(t, tl.shutter))
      sign = phase(t, tl.sign)
      if (t >= tl.cut) {
        inside = true
        const pose = s.shopCamera ?? workshopPose(aspect)
        const goalFov = s.shopCamera ? fitFov(pose.fov, aspect) : pose.fov
        goalPos.set(...pose.pos)
        goalTarget.set(...pose.target)
        if (s.screen === 'ENTERING_SHOP' || snap) {
          camera.position.copy(goalPos)
          target.current.copy(goalTarget)
          fov = goalFov
        } else {
          const k = 1 - Math.exp(-dt * 3.2)
          camera.position.lerp(goalPos, k)
          target.current.lerp(goalTarget, k)
          fov = camera.fov + (goalFov - camera.fov) * k
        }
      } else {
        const k = easeInOutCubic(phase(t, tl.push))
        tmpPos.copy(from.current.pos).lerp(goalPos.set(...ENTRANCE_POSE.pos), k)
        target.current.copy(from.current.target).lerp(goalTarget.set(...ENTRANCE_POSE.target), k)
        fov = from.current.fov + (ENTRANCE_POSE.fov - from.current.fov) * k
        camera.position.copy(tmpPos)
      }
    } else {
      const pose = s.screen === 'NAME_ENTRY' ? nameEntryPose(aspect) : titlePose(aspect)
      goalPos.set(...pose.pos)
      goalTarget.set(...pose.target)
      if (!reduced) {
        const t = clock.current.t
        goalPos.x += Math.sin(t * 0.13) * 0.35
        goalPos.y += Math.sin(t * 0.21) * 0.08
      }
      if (snap) {
        camera.position.copy(goalPos)
        target.current.copy(goalTarget)
        fov = pose.fov
      } else {
        const k = 1 - Math.exp(-dt * 2.2)
        camera.position.lerp(goalPos, k)
        target.current.lerp(tmpTarget.copy(goalTarget), k)
        fov = camera.fov + (pose.fov - camera.fov) * k
      }
    }

    camera.lookAt(target.current)
    if (Math.abs(camera.fov - fov) > 1e-4) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }

    const curtain = Math.max(0.02, 1 - shutter * 0.98)
    if (rig.shutter) rig.shutter.scale.y = curtain
    if (rig.shutterTexture) rig.shutterTexture.repeat.y = curtain
    if (rig.shutterBottom) rig.shutterBottom.position.y = SHOP.openingHeight * (1 - curtain)
    if (rig.lock) rig.lock.visible = shutter < 0.02
    if (rig.openSign) rig.openSign.rotation.y = easeOutBack(sign) * Math.PI
    if (rig.opposite) rig.opposite.visible = inside
  })

  return null
}
