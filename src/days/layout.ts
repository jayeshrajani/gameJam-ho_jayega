import type { CameraPose, Vec3 } from '../app/cameraPose'
import { PLINTH, SHOP } from '../world/rig'

/** World height of the counter top. The workshop camera looks out towards +Z, so world +X is screen-left. */
export const TOP = PLINTH + SHOP.counterTop

/** Where the customer's machine sits (centre of the work mat). */
export const MACHINE_AT: Vec3 = [-0.05, TOP, -0.7]

/** The junk tray, to the screen-right of the machine. */
export const TRAY_AT: Vec3 = [-0.72, TOP, -0.93]

/** Up to four parts sit in one row; five or six go in two rows of three. */
export function trayItemPosition(index: number, count = 3): Vec3 {
  if (count > 4) {
    const row = Math.floor(index / 3)
    return [TRAY_AT[0] + 0.25 - (index % 3) * 0.14, TRAY_AT[1] + 0.03, TRAY_AT[2] + (row === 0 ? -0.05 : 0.05)]
  }
  const gap = count > 3 ? 0.145 : 0.19
  return [TRAY_AT[0] + ((count - 1) / 2) * gap - index * gap, TRAY_AT[1] + 0.03, TRAY_AT[2]]
}

/** Raise alternate name tags so neighbours don't overlap. */
export function trayTagHigh(index: number, count: number): boolean {
  return count > 4 ? index >= 3 : count > 3 && index % 2 === 1
}

/** Where the customer stands, just outside the counter. */
export const CUSTOMER_AT: Vec3 = [0.15, PLINTH, 0.5]

export const BENCH_POSE: CameraPose = { pos: [-0.28, 1.98, -1.95], target: [-0.36, 1.32, -0.74], fov: 46 }

export function atMachine(p: Vec3): Vec3 {
  return [MACHINE_AT[0] + p[0], MACHINE_AT[1] + p[1], MACHINE_AT[2] + p[2]]
}
