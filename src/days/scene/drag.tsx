import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { type Group, type Mesh, Plane, Raycaster, Vector2, Vector3 } from 'three'
import { create } from 'zustand'
import type { Vec3 } from '../../app/cameraPose'
import { jointForSlot, slotAvailable } from '../../repair/engine'
import { ITEMS } from '../../repair/items'
import type { ItemId } from '../../repair/types'
import { useKit } from '../../world/kit'
import { MACHINE_AT } from '../layout'
import { currentJob, useDayRun } from '../runner/store'
import { type DayGeometry, ItemModel } from './items'
import { machinePoint } from './machines'

interface DragState {
  /** The part being dragged from the tray. */
  item: ItemId | null
  /** The attach point it would snap to if dropped now. */
  over: string | null
}

export const useDrag = create<DragState>(() => ({ item: null, over: null }))

const START_PX = 6
const SNAP_PX = 52

const press = { item: null as ItemId | null, x: 0, y: 0, active: false }
const pointer = { x: -1, y: -1 }
let swallowClick = false

/** Called on pointer-down on a tray part; becomes a drag once the pointer moves. */
export function pressItem(item: ItemId, x: number, y: number): void {
  press.item = item
  press.x = x
  press.y = y
  press.active = false
  swallowClick = false
}

/** True once after a drag ended, so the click that follows it is ignored. */
export function consumeDragClick(): boolean {
  const was = swallowClick
  swallowClick = false
  return was
}

/** Belts and wires stretch from the first point to the pointer; rigid parts just follow it. */
export const stretches = (id: ItemId): boolean => ITEMS[id].props.flexibility >= 3

const STRAND_COLOR: Partial<Record<ItemId, string>> = { rubberBand: '#c8844a', wire: '#c27a3a', steelWire: '#aeb4b8' }

/** Dragging parts onto the machine, with a stretching belt for two-point joints. */
export function DragLayer({ geo }: { geo: DayGeometry }) {
  const kit = useKit()
  const { camera, gl } = useThree()
  const item = useDrag((d) => d.item)
  const held = useDayRun((s) => s.held)
  const ghost = useRef<Group>(null)
  const strands = useRef<(Mesh | null)[]>([])
  const t = useMemo(
    () => ({ v: new Vector3(), hit: new Vector3(), anchor: new Vector3(), dir: new Vector3(), side: new Vector3(), up: new Vector3(0, 1, 0), ndc: new Vector2(), ray: new Raycaster(), plane: new Plane() }),
    [],
  )

  useEffect(() => {
    const toScreen = (at: Vec3, rect: DOMRect) => {
      t.v.set(at[0], at[1], at[2]).project(camera)
      return [rect.left + ((t.v.x + 1) / 2) * rect.width, rect.top + ((1 - t.v.y) / 2) * rect.height] as const
    }
    const nearestSlot = (x: number, y: number): string | null => {
      const s = useDayRun.getState()
      const job = currentJob(s)
      if (!job) return null
      const rect = gl.domElement.getBoundingClientRect()
      let best: string | null = null
      let bestD = SNAP_PX
      for (const slot of job.repair.slots) {
        if (slot.id === s.pendingSlot || !slotAvailable(job.repair, s.placements, slot.id)) continue
        const joint = jointForSlot(job.repair, slot.id)
        const at = machinePoint(job.id, slot.id, MACHINE_AT)
        if (!joint || !at || s.placements[joint.id]) continue
        const [sx, sy] = toScreen(at, rect)
        const d = Math.hypot(sx - x, sy - y)
        if (d < bestD) {
          bestD = d
          best = slot.id
        }
      }
      return best
    }
    const move = (e: PointerEvent) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
      if (!press.item) return
      const s = useDayRun.getState()
      if (!press.active) {
        if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < START_PX) return
        if (s.phase !== 'build') {
          press.item = null
          return
        }
        press.active = true
        if (s.held !== press.item) s.pick(press.item)
        useDrag.setState({ item: press.item })
        document.body.style.cursor = 'grabbing'
      }
      const over = nearestSlot(e.clientX, e.clientY)
      const job = currentJob(s)
      if (over && job && s.pendingSlot === null && jointForSlot(job.repair, over)?.slots.length === 2) {
        // Hook the first end on, then keep dragging to stretch it to the second point.
        s.clickSlot(over)
        useDrag.setState({ over: null })
        return
      }
      if (useDrag.getState().over !== over) useDrag.setState({ over })
    }
    const up = () => {
      if (!press.item) return
      const wasDragging = press.active
      press.item = null
      press.active = false
      if (!wasDragging) return
      swallowClick = true
      document.body.style.cursor = ''
      const over = useDrag.getState().over
      useDrag.setState({ item: null, over: null })
      const s = useDayRun.getState()
      if (over) s.clickSlot(over)
      else s.letGo()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      press.item = null
      press.active = false
      useDrag.setState({ item: null, over: null })
    }
  }, [camera, gl, t])

  useFrame(() => {
    const s = useDayRun.getState()
    const job = currentJob(s)
    const d = useDrag.getState()
    const pending = job && s.pendingSlot ? machinePoint(job.id, s.pendingSlot, MACHINE_AT) : undefined
    const target = job && d.over ? machinePoint(job.id, d.over, MACHINE_AT) : undefined
    const band = Boolean(s.phase === 'build' && s.held && pending && stretches(s.held))

    // The point under the pointer, at the machine's depth.
    if (pending) t.anchor.set(pending[0], pending[1], pending[2])
    else t.anchor.set(MACHINE_AT[0], MACHINE_AT[1] + 0.25, MACHINE_AT[2])
    camera.getWorldDirection(t.dir)
    t.plane.setFromNormalAndCoplanarPoint(t.dir, t.anchor)
    const rect = gl.domElement.getBoundingClientRect()
    t.ndc.set(((pointer.x - rect.left) / rect.width) * 2 - 1, -((pointer.y - rect.top) / rect.height) * 2 + 1)
    t.ray.setFromCamera(t.ndc, camera)
    const hitOk = t.ray.ray.intersectPlane(t.plane, t.hit) !== null
    if (target) t.hit.set(target[0], target[1], target[2])

    if (ghost.current) {
      ghost.current.visible = d.item !== null && hitOk && !band
      ghost.current.position.copy(t.hit)
    }

    // A loop is two strands; a wire is one.
    const pair = s.held === 'rubberBand'
    t.side.copy(t.hit).sub(t.anchor)
    const length = t.side.length()
    const along = t.v.copy(t.side).normalize()
    t.side.crossVectors(along, t.dir).normalize().multiplyScalar(pair ? 0.009 * Math.max(0.35, 1 - length * 2) : 0)
    strands.current.forEach((m, i) => {
      if (!m) return
      m.visible = band && hitOk && length > 0.005 && (pair || i === 0)
      if (!m.visible) return
      const sign = i === 0 ? 1 : -1
      m.position.copy(t.anchor).lerp(t.hit, 0.5).addScaledVector(t.side, sign)
      m.quaternion.setFromUnitVectors(t.up, along)
      // Thinner the further it's stretched, like real rubber.
      const thick = pair ? Math.max(0.0025, 0.006 - length * 0.008) : 0.003
      m.scale.set(thick, length, thick)
    })
  })

  const strandMat = kit.mat((held && STRAND_COLOR[held]) ?? '#8a8a8a', { rough: 0.7 })
  return (
    <group>
      <group ref={ghost} visible={false}>
        {item && <ItemModel id={item} geo={geo} />}
      </group>
      {[0, 1].map((i) => (
        <mesh key={i} ref={(m) => void (strands.current[i] = m)} geometry={kit.geo.box} material={strandMat} visible={false} renderOrder={5} />
      ))}
    </group>
  )
}
