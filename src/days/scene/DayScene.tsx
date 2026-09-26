import { type ThreeEvent, useFrame } from '@react-three/fiber'
import { type ReactNode, useEffect, useMemo, useRef } from 'react'
import { type Group, MeshStandardMaterial } from 'three'
import type { Vec3 } from '../../app/cameraPose'
import { selectProgress, selectReducedMotion, useGame } from '../../app/state'
import { itemsOnBench, slotAvailable } from '../../repair/engine'
import type { ItemId } from '../../repair/types'
import { useKit } from '../../world/kit'
import { createLimbs, type Outfit, Person } from '../../world/Person'
import { Box, Cyl, Plane, Ring } from '../../world/primitives'
import { PLINTH } from '../../world/rig'
import { registerTexture, workMatTexture } from '../../world/textures'
import { CUSTOMER_AT, MACHINE_AT, TOP, TRAY_AT, trayItemPosition, trayTagHigh } from '../layout'
import { currentJob, currentScript, guidance, type Phase, playMode, useDayRun } from '../runner/store'
import { consumeDragClick, DragLayer, pressItem, stretches, useDrag } from './drag'
import { type DayGeometry, ItemModel, useDayGeometry } from './items'
import { LabelProvider, Tag } from './labels'
import { EVENING_VISITORS, MACHINES, machinePoint, tagOffset, trayOrigin } from './machines'
import { ITEMS } from '../../repair/items'

const MACHINE_PHASES: readonly Phase[] = ['talk', 'inspect', 'inspecting', 'diagnosis', 'build', 'testing', 'result', 'thanks']
const EVENING_PHASES: readonly Phase[] = ['dusk', 'evening', 'report']
const OFF_PHASES: readonly Phase[] = ['idle', 'choose', ...EVENING_PHASES]

/** The 3D half of a day: bench, the customer's machine, parts, hotspots and visitors. */
export function DayScene() {
  const geo = useDayGeometry()
  // After dark the pandal stays up for the evening, when no job is current.
  const job = useDayRun((s) => currentJob(s) ?? (currentScript(s)?.night ? currentScript(s)?.jobs.at(-1) : undefined))
  const phase = useDayRun((s) => s.phase)
  const night = useDayRun((s) => currentScript(s)?.night === true)
  const entry = job ? MACHINES[job.id] : undefined
  const showMachine = entry && (entry.allDay ? !OFF_PHASES.includes(phase) || (night && EVENING_PHASES.includes(phase)) : MACHINE_PHASES.includes(phase))

  return (
    <LabelProvider>
      <Bench />
      {showMachine && job && (
        <group position={[...(entry.at ?? MACHINE_AT)]}>
          {entry.allDay ? (
            <entry.Machine key={entry.allDay} geo={geo} />
          ) : (
            <AppearIn key={job.id}>
              <entry.Machine geo={geo} />
            </AppearIn>
          )}
        </group>
      )}
      <TrayItems geo={geo} />
      <Hotspots />
      <DragLayer geo={geo} />
      <Visitor />
      <Companions />
    </LabelProvider>
  )
}

/** Neighbours standing around on a zone day (e.g. Rocky by the car). */
function Companions() {
  const phase = useDayRun((s) => s.phase)
  const companions = useDayRun((s) => currentScript(s)?.companions)
  const night = useDayRun((s) => currentScript(s)?.night === true)
  if (!companions || phase === 'idle' || phase === 'choose' || (!night && EVENING_PHASES.includes(phase))) return null
  return (
    <>
      {companions.map((c) => (
        <group key={c.visitor} position={[...c.at]} rotation={[0, c.facing ?? Math.PI / 2, 0]}>
          <Person o={EVENING_VISITORS[c.visitor]} limbs={NO_LIMBS} />
        </group>
      ))}
    </>
  )
}

const NO_LIMBS = createLimbs()

function AppearIn({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null)
  const born = useRef(performance.now())
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const k = selectReducedMotion(useGame.getState()) ? 1 : Math.min(1, (performance.now() - born.current) / 350)
    g.scale.setScalar(0.85 + 0.15 * k)
    g.position.y = (1 - k) * 0.06
  })
  return <group ref={ref}>{children}</group>
}

function Bench() {
  const res = useMemo(() => {
    const register = registerTexture()
    const mat = workMatTexture()
    return {
      register,
      mat,
      registerMat: new MeshStandardMaterial({ map: register, roughness: 0.9 }),
      matMat: new MeshStandardMaterial({ map: mat, roughness: 0.95 }),
    }
  }, [])
  useEffect(
    () => () => {
      res.register.dispose()
      res.mat.dispose()
      res.registerMat.dispose()
      res.matMat.dispose()
    },
    [res],
  )
  // Flat props are rotated by PI because the camera looks out towards +Z.
  return (
    <group>
      <Plane p={[MACHINE_AT[0], TOP + 0.004, MACHINE_AT[2]]} r={[-Math.PI / 2, 0, Math.PI]} s={[0.66, 0.48]} m={res.matMat} recv />
      <group position={[...TRAY_AT]}>
        <Box p={[0, 0.008, 0]} s={[0.62, 0.016, 0.22]} c="#8a6443" recv cast />
        <Box p={[0, 0.025, 0.105]} s={[0.62, 0.035, 0.012]} c="#6b4a30" />
        <Box p={[0, 0.025, -0.105]} s={[0.62, 0.035, 0.012]} c="#6b4a30" />
        <Box p={[0.305, 0.025, 0]} s={[0.012, 0.035, 0.22]} c="#6b4a30" />
        <Box p={[-0.305, 0.025, 0]} s={[0.012, 0.035, 0.22]} c="#6b4a30" />
      </group>
      <group position={[0.62, TOP, -0.7]} rotation={[0, 0.2, 0]}>
        <Box p={[0, 0.015, 0]} s={[0.46, 0.03, 0.29]} c="#6b1f22" cast />
        <Plane p={[0, 0.031, 0]} r={[-Math.PI / 2, 0, Math.PI]} s={[0.45, 0.28]} m={res.registerMat} />
        <Cyl p={[-0.12, 0.04, 0.02]} r={[0, -0.5, Math.PI / 2]} s={[0.012, 0.16, 0.012]} c="#1f3a8a" />
      </group>
    </group>
  )
}

function setCursor(value: string) {
  document.body.style.cursor = value
}

function useGlowPulse() {
  const ref = useRef<Group>(null)
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const reduced = selectReducedMotion(useGame.getState())
    g.scale.setScalar(reduced ? 1 : 1 + Math.sin(performance.now() * 0.006) * 0.12)
  })
  return ref
}

function TrayItems({ geo }: { geo: DayGeometry }) {
  const job = useDayRun((s) => currentJob(s))
  const phase = useDayRun((s) => s.phase)
  const placements = useDayRun((s) => s.placements)
  const held = useDayRun((s) => s.held)
  const glowItem = useDayRun((s) => guidance(s, playMode())?.glowItem)
  const pick = useDayRun((s) => s.pick)
  const pendingSlot = useDayRun((s) => s.pendingSlot)
  const dragging = useDrag((d) => d.item)
  if (!job || !['build', 'testing', 'result'].includes(phase)) return null
  const onBench = itemsOnBench(job.repair, placements)
  const tray = trayOrigin(job.id)
  const shift: Vec3 = [tray[0] - TRAY_AT[0], tray[1] - TRAY_AT[1], tray[2] - TRAY_AT[2]]
  const outdoor = MACHINES[job.id]?.trayAt !== undefined
  const place = (i: number): Vec3 => {
    const p = trayItemPosition(i, job.repair.items.length)
    return [p[0] + shift[0], p[1] + shift[1], p[2] + shift[2]]
  }

  return (
    <>
      {outdoor && (
        <group position={[tray[0], 0, tray[2]]}>
          <Box p={[0, tray[1] / 2, 0]} s={[0.62, tray[1], 0.26]} c="#8a6443" cast recv />
          <Box p={[0, tray[1] + 0.02, 0.125]} s={[0.62, 0.04, 0.012]} c="#6b4a30" />
          <Box p={[0, tray[1] + 0.02, -0.125]} s={[0.62, 0.04, 0.012]} c="#6b4a30" />
        </group>
      )}
      {onBench.map((id) => (
        <TrayItem
          key={id}
          id={id}
          at={place(job.repair.items.indexOf(id))}
          tagHigh={trayTagHigh(job.repair.items.indexOf(id), job.repair.items.length)}
          geo={geo}
          held={held === id}
          away={dragging === id || (held === id && pendingSlot !== null && stretches(id))}
          glow={glowItem === id}
          interactive={phase === 'build'}
          onPick={() => pick(id)}
        />
      ))}
    </>
  )
}

function TrayItem(props: {
  id: ItemId
  at: Vec3
  geo: DayGeometry
  held: boolean
  /** Raise the name tag so neighbouring tags don't overlap. */
  tagHigh?: boolean
  /** Being dragged, or stretched onto the machine: the tray spot shows empty. */
  away: boolean
  glow: boolean
  interactive: boolean
  onPick(): void
}) {
  const kit = useKit()
  const pulse = useGlowPulse()
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (consumeDragClick()) return
    if (props.interactive) props.onPick()
  }
  return (
    <group position={[props.at[0], props.at[1] + (props.held ? 0.05 : 0), props.at[2]]} visible={!props.away}>
      <ItemModel id={props.id} geo={props.geo} />
      {props.interactive && <Tag text={ITEMS[props.id].name} at={[0, props.tagHigh ? 0.115 : 0.075, 0]} height={0.03} />}
      {(props.glow || props.held) && (
        <group ref={pulse}>
          <Ring
            r={[Math.PI / 2, 0, 0]}
            s={[0.16, 0.16, 0.5]}
            p={[0, props.held ? -0.045 : 0.004, 0]}
            m={kit.mat('#ffd166', { emissive: '#ffb703', emissiveIntensity: props.held ? 2.2 : 1.4 })}
          />
        </group>
      )}
      <mesh
        geometry={kit.geo.sphere}
        material={kit.mat('#000000', { opacity: 0.001 })}
        scale={0.14}
        onClick={onClick}
        onPointerDown={(e) => {
          if (!props.interactive) return
          e.stopPropagation()
          pressItem(props.id, e.nativeEvent.clientX, e.nativeEvent.clientY)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          if (props.interactive) setCursor('grab')
        }}
        onPointerOut={() => setCursor('')}
      />
    </group>
  )
}

function Hotspots() {
  // Whole-store subscription: guidance() builds fresh objects, so it can't be a selector.
  const s = useDayRun()
  const mode = useGame((g) => selectProgress(g)?.mode ?? 'tutorial')
  const dragOver = useDrag((d) => d.over)
  const { phase, seen, held, pendingSlot, placements, inspectTarget, clickSlot } = s
  const g = guidance(s, mode)
  const job = currentJob(s)
  if (!job) return null

  if (phase === 'inspecting') {
    const open = job.inspect.filter((step) => !seen.includes(step.target))
    const shown = mode === 'tutorial' ? open.filter((st) => !st.requires || seen.includes(st.requires)).slice(0, 1) : open
    return (
      <>
        {shown.map((step) => {
          const at = machinePoint(job.id, step.target)
          return at ? (
            <Hotspot
              key={step.target}
              at={at}
              label={step.label}
              tagAt={tagOffset(job.id, step.target)}
              glow={mode === 'tutorial'}
              onClick={() => inspectTarget(step.target)}
            />
          ) : null
        })}
      </>
    )
  }
  if (phase !== 'build') return null
  return (
    <>
      {job.repair.slots.map((slot) => {
        if (!slotAvailable(job.repair, placements, slot.id)) return null
        const at = machinePoint(job.id, slot.id)
        if (!at) return null
        const joint = job.repair.joints.find((j) => j.slots.includes(slot.id))
        const filled = joint ? Boolean(placements[joint.id]) : false
        const glow = g?.glowSlots.includes(slot.id) ?? false
        const show = glow || (held !== null && !filled) || pendingSlot === slot.id
        if (!show) return null
        return (
          <Hotspot
            key={slot.id}
            at={at}
            label={slot.label}
            tagAt={tagOffset(job.id, slot.id)}
            glow={glow || pendingSlot === slot.id || dragOver === slot.id}
            onClick={() => clickSlot(slot.id)}
          />
        )
      })}
    </>
  )
}

function Hotspot({ at, label, tagAt, glow, onClick }: { at: Vec3; label: string; tagAt: Vec3; glow: boolean; onClick(): void }) {
  const kit = useKit()
  const pulse = useGlowPulse()
  return (
    <group position={[...at]}>
      <Tag text={label} at={tagAt} />
      <group ref={pulse}>
        <Ring
          s={[0.09, 0.09, 0.4]}
          m={glow ? kit.mat('#ffd166', { emissive: '#ffb703', emissiveIntensity: 1.8 }) : kit.mat('#f6ead0', { opacity: 0.55 })}
        />
      </group>
      <mesh
        geometry={kit.geo.sphere}
        material={kit.mat('#000000', { opacity: 0.001 })}
        scale={0.075}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setCursor('pointer')
        }}
        onPointerOut={() => setCursor('')}
      />
    </group>
  )
}

const FROM_RIGHT: Vec3 = [3.4, PLINTH, 0.7]
const FROM_LEFT: Vec3 = [-4.3, PLINTH, 0.75]
const EXIT_LEFT: Vec3 = [-3.6, PLINTH, 0.7]
const EVENING_AT: Vec3 = [-0.35, PLINTH, 0.5]

/** Today's customer, or the evening visitor, walking up to the counter. */
function Visitor() {
  const job = useDayRun((s) => currentJob(s))
  const phase = useDayRun((s) => s.phase)
  const eveningVisitor = useDayRun((s) => currentScript(s)?.evening.visitor ?? 'rafiq')
  const evening = EVENING_PHASES.includes(phase)
  if (evening) {
    return (
      <Walker
        key={`evening-${eveningVisitor}`}
        outfit={EVENING_VISITORS[eveningVisitor]}
        from={eveningVisitor === 'rafiq' ? FROM_LEFT : FROM_RIGHT}
        exit={EXIT_LEFT}
        stand={EVENING_AT}
        evening
      />
    )
  }
  const entry = job ? MACHINES[job.id] : undefined
  if (!job || !entry) return null
  const fromLeft = job.customer.side === 'left'
  const stand = entry.customerAt ?? CUSTOMER_AT
  return (
    <Walker
      key={entry.allDay ?? job.id}
      outfit={entry.customer}
      from={entry.allDay ? stand : fromLeft ? FROM_LEFT : FROM_RIGHT}
      exit={fromLeft ? FROM_LEFT : EXIT_LEFT}
      stand={stand}
      evening={false}
      present={entry.allDay !== undefined}
    />
  )
}

function Walker({
  outfit,
  from,
  exit,
  stand,
  evening,
  present = false,
}: {
  outfit: Outfit
  from: Vec3
  exit: Vec3
  stand: Vec3
  evening: boolean
  /** Already on the street when the day starts (zone days). */
  present?: boolean
}) {
  const root = useRef<Group>(null)
  const limbs = useMemo(createLimbs, [])
  const walkPhase = useRef(0)

  useFrame((_, delta) => {
    const g = root.current
    if (!g) return
    const s = useDayRun.getState()
    const reduced = selectReducedMotion(useGame.getState())
    const t = (performance.now() - s.phaseAt) / 1000
    let a = stand
    let b = stand
    let k = 1
    let visible = s.phase !== 'idle' && (present || s.phase !== 'morning') && s.phase !== 'choose'
    if (evening && s.phase === 'dusk') {
      a = from
      k = reduced ? 1 : Math.min(1, t / 2.5)
    } else if (!evening && s.phase === 'arrive') {
      a = from
      k = reduced ? 1 : Math.min(1, t / 2.4)
    } else if (!evening && s.phase === 'leave') {
      b = exit
      k = reduced ? 1 : Math.min(1, t / 1.7)
      visible = k < 1
    }
    const walking = k < 1
    g.visible = visible
    g.position.set(a[0] + (b[0] - a[0]) * k, a[1], a[2] + (b[2] - a[2]) * k)
    g.rotation.y = walking ? (b[0] > a[0] ? 0 : Math.PI) : Math.PI / 2
    if (walking) walkPhase.current += Math.min(delta, 0.05) * 6
    const swing = walking ? Math.sin(walkPhase.current) : 0
    if (limbs.legL) limbs.legL.rotation.z = swing * 0.45
    if (limbs.legR) limbs.legR.rotation.z = -swing * 0.45
    if (limbs.armL) limbs.armL.rotation.z = outfit.holding && !walking ? 0.9 : -swing * 0.35
    const talking = !walking && (s.phase === 'talk' || s.phase === 'thanks' || s.phase === 'evening')
    if (limbs.armR) limbs.armR.rotation.z = talking && !reduced ? 0.25 + Math.sin(performance.now() * 0.004) * 0.2 : swing * 0.35
  })

  return (
    <group ref={root} visible={false}>
      <Person o={outfit} limbs={limbs} />
    </group>
  )
}
