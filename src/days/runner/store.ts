import { create } from 'zustand'
import { selectActiveDay, selectProgress, selectReducedMotion, useGame } from '../../app/state'
import type { PlayMode } from '../../app/storage'
import { fixedModeOf } from '../dayDefinitions'
import { audio } from '../../audio/AudioManager'
import { canTest, jointForSlot, jointOfItem, place, removeJoint, removeJoints, slotAvailable } from '../../repair/engine'
import type { ItemId, Placements, Rating, TestOutcome } from '../../repair/types'
import { BENCH_POSE } from '../layout'
import { getDayScript } from '../registry'
import type { DayScript, JobScript, Line } from '../types'

export type Phase =
  | 'idle'
  | 'choose'
  | 'pick'
  | 'morning'
  | 'arrive'
  | 'talk'
  | 'inspect'
  | 'inspecting'
  | 'diagnosis'
  | 'build'
  | 'testing'
  | 'result'
  | 'thanks'
  | 'leave'
  | 'dusk'
  | 'evening'
  | 'report'

export interface DayState {
  day: number
  jobIndex: number
  phase: Phase
  phaseAt: number
  line: number
  /** Inspection targets found so far, in the order found. */
  seen: readonly string[]
  /** When the latest inspection target was found. */
  stepAt: number
  /** Why the last inspection click did nothing (e.g. "switch it on first"). */
  blocked: string | null
  held: ItemId | null
  /** First endpoint chosen for a two-point joint. */
  pendingSlot: string | null
  placements: Placements
  outcome: TestOutcome | null
  lastHint: string | null
  /** Play-it-yourself players can ask Mama for the NEEDS list, at the cost of one star. */
  askedMama: boolean
  fails: number
  /** A partial result has shown the player that it can be better. */
  refined: boolean
  testId: number
  /** Length of the running test in ms (shorter with reduced motion). */
  testMs: number

  begin(): void
  dispose(): void
  choose(mode: PlayMode): void
  /** Zone days: start the job the player picked. */
  pickZone(index: number): void
  next(): void
  startInspect(): void
  inspectTarget(target: string): void
  pick(item: ItemId): void
  clickSlot(slot: string): void
  askMama(): void
  /** Drop the held part anywhere but an attach point: it goes back to the tray. */
  letGo(): void
  removeJoint(joint: string): void
  test(): void
  retry(): void
  resetBench(): void
}

const ms = (full: number, reduced: number) => (selectReducedMotion(useGame.getState()) ? reduced : full)

/** The current day's play mode; tutorial until the player has chosen. */
export function playMode(): PlayMode {
  return selectProgress(useGame.getState())?.mode ?? 'tutorial'
}

let timers: number[] = []
function after(delay: number, fn: () => void): void {
  const id = window.setTimeout(() => {
    timers = timers.filter((t) => t !== id)
    fn()
  }, delay)
  timers.push(id)
}

export function currentScript(state: Pick<DayState, 'day'>): DayScript | undefined {
  return getDayScript(state.day)
}

export function currentJob(state: Pick<DayState, 'day' | 'jobIndex'>): JobScript | undefined {
  return currentScript(state)?.jobs[state.jobIndex]
}

/** Asking Mama costs one star (never below ★). */
export function withMamaPenalty(outcome: TestOutcome, askedMama: boolean): TestOutcome {
  if (!askedMama || !outcome.rating || outcome.rating === 1) return outcome
  return { ...outcome, rating: (outcome.rating - 1) as Rating, note: 'One star off: you asked Mama.' }
}

/** The thanks lines, opened by the customer's reaction to the Jugaad Rating when there is one. */
export function thanksLines(job: JobScript, outcome: TestOutcome | null): readonly Line[] {
  const first = outcome?.rating ? job.ratingLines?.[outcome.rating] : undefined
  return first ? [first, ...job.thanks] : job.thanks
}

const RATING_PAY = { 1: 0.5, 2: 0.75, 3: 1 } as const

/** A ★ fix earns half; ★★★ earns the full price. */
export function rewardFor(job: JobScript, outcome: TestOutcome | null): { money: number; reputation: number } {
  const r = outcome?.rating
  if (!r) return job.reward
  return { money: Math.round(job.reward.money * RATING_PAY[r]), reputation: Math.ceil((job.reward.reputation * r) / 3) }
}

/** The dialogue line shown for the current phase, if any. */
export function currentLine(state: DayState): Line | undefined {
  const script = currentScript(state)
  const job = currentJob(state)
  switch (state.phase) {
    case 'morning':
      return script?.morning?.[state.line]
    case 'talk':
      return job?.arrival[state.line]
    case 'diagnosis':
      return job?.diagnosis[state.line]
    case 'thanks':
      return job ? thanksLines(job, state.outcome)[state.line] : undefined
    case 'evening':
      return script?.evening.lines[state.line]
    default:
      return undefined
  }
}

const JOB_PHASES: readonly Phase[] = ['arrive', 'talk', 'inspect', 'inspecting', 'diagnosis', 'build', 'testing', 'result', 'thanks', 'leave']

function syncWorld(state: DayState): void {
  const game = useGame.getState()
  const job = currentJob(state)
  const zones = currentScript(state)?.zones
  const { phase } = state
  if (phase === 'inspecting' || phase === 'diagnosis') game.setShopCamera(job?.inspectPose ?? null)
  else if (phase === 'build' || phase === 'testing' || phase === 'result') game.setShopCamera(job?.buildPose ?? BENCH_POSE)
  else if (zones && (phase === 'pick' || phase === 'talk' || phase === 'inspect' || phase === 'thanks')) game.setShopCamera(zones.pose)
  else game.setShopCamera(null)
  const evening = phase === 'dusk' || phase === 'evening' || phase === 'report'
  const vendorBusy =
    (evening && currentScript(state)?.evening.visitor === 'rafiq') || (JOB_PHASES.includes(phase) && job?.customer.isVendor === true)
  game.setStreetMood({ timeOfDay: evening ? 'evening' : 'morning', vendorAway: vendorBusy, laneBlocked: zones !== undefined && !evening })
}

export const useDayRun = create<DayState>()((set, get) => {
  function go(phase: Phase, extra: Partial<DayState> = {}): void {
    set({ phase, phaseAt: performance.now(), line: 0, ...extra })
    syncWorld(get())
  }

  function startJob(index: number): void {
    const fresh = {
      jobIndex: index,
      seen: [],
      held: null,
      pendingSlot: null,
      placements: {},
      outcome: null,
      lastHint: null,
      askedMama: false,
      fails: 0,
      refined: false,
    }
    // On zone days the customer is already standing by the machine.
    if (currentScript(get())?.zones) {
      go('talk', fresh)
      return
    }
    go('arrive', fresh)
    after(ms(2600, 250), () => get().phase === 'arrive' && go('talk'))
  }

  function startEvening(): void {
    go('dusk', { jobIndex: currentScript(get())?.jobs.length ?? 0 })
    after(ms(2800, 250), () => get().phase === 'dusk' && go('evening'))
  }

  /** Picks up the day where the save left it. */
  function resume(): void {
    const progress = selectProgress(useGame.getState())
    const script = currentScript(get())
    if (!progress || !script) return
    const { completedJobs, finished } = progress
    if (finished) {
      go('report', { jobIndex: script.jobs.length })
      return
    }
    const index = script.jobs.findIndex((j) => !completedJobs.includes(j.id))
    if (index === -1) startEvening()
    else if (index === 0 && completedJobs.length === 0 && script.morning?.length) go('morning', { jobIndex: 0 })
    else if (script.zones) go('pick', { jobIndex: index })
    else startJob(index)
  }

  function advanceLine(lines: readonly Line[] | undefined, done: () => void): void {
    const { line } = get()
    if (lines && line < lines.length - 1) set({ line: line + 1 })
    else done()
  }

  return {
    day: 1,
    jobIndex: 0,
    phase: 'idle',
    phaseAt: 0,
    line: 0,
    seen: [],
    stepAt: 0,
    blocked: null,
    held: null,
    pendingSlot: null,
    placements: {},
    outcome: null,
    lastHint: null,
    askedMama: false,
    fails: 0,
    refined: false,
    testId: 0,
    testMs: 1,

    begin() {
      const game = useGame.getState()
      const day = selectActiveDay(game)
      const progress = selectProgress(game)
      if (day === null || !progress || !getDayScript(day)) return
      set({ day })
      const fixed = fixedModeOf(day)
      if (fixed && progress.mode !== fixed) game.setPlayMode(fixed)
      if (!fixed && progress.mode === null && !progress.finished) go('choose', { jobIndex: 0 })
      else resume()
    },

    dispose() {
      for (const id of timers) window.clearTimeout(id)
      timers = []
      set({ phase: 'idle', held: null, pendingSlot: null })
    },

    choose(mode) {
      if (get().phase !== 'choose') return
      useGame.getState().setPlayMode(mode)
      audio.play('click')
      resume()
    },

    next() {
      const state = get()
      const script = currentScript(state)
      const job = currentJob(state)
      switch (state.phase) {
        case 'morning':
          advanceLine(script?.morning, () => (script?.zones ? go('pick') : startJob(0)))
          break
        case 'talk':
          advanceLine(job?.arrival, () => go('inspect'))
          break
        case 'diagnosis':
          advanceLine(job?.diagnosis, () => go('build'))
          break
        case 'result':
          if (state.outcome?.pass) go('thanks')
          else get().retry()
          break
        case 'thanks':
          if (!job || !script) break
          advanceLine(thanksLines(job, state.outcome), () => {
            const reward = rewardFor(job, state.outcome)
            useGame.getState().recordRepair(job.id, reward.money, reward.reputation, state.outcome?.rating)
            const done = selectProgress(useGame.getState())?.completedJobs ?? []
            const remaining = script.jobs.findIndex((j) => !done.includes(j.id))
            if (script.zones && remaining !== -1) {
              go('pick', { jobIndex: remaining })
              return
            }
            go('leave')
            const nextIndex = get().jobIndex + 1
            after(ms(1800, 150), () => {
              if (get().phase !== 'leave') return
              if (nextIndex < script.jobs.length) startJob(nextIndex)
              else startEvening()
            })
          })
          break
        case 'evening':
          advanceLine(script?.evening.lines, () => {
            useGame.getState().finishDay()
            go('report')
          })
          break
      }
      audio.play('click')
    },

    startInspect() {
      if (get().phase !== 'inspect') return
      audio.play('click')
      go('inspecting', { seen: [], blocked: null })
    },

    inspectTarget(target) {
      const state = get()
      const job = currentJob(state)
      if (state.phase !== 'inspecting' || !job || state.seen.includes(target)) return
      const step = job.inspect.find((s) => s.target === target)
      if (!step) return
      if (step.requires && !state.seen.includes(step.requires)) {
        set({ blocked: step.blocked ?? 'Not yet. Something else has to happen first.' })
        audio.play('click')
        return
      }
      audio.play('pickup')
      const seen = [...state.seen, target]
      set({ seen, stepAt: performance.now(), blocked: null })
      if (seen.length >= job.inspect.length) {
        // Mama only explains the problem in tutorial mode; otherwise it's straight to the bench.
        after(ms(900, 0), () => get().phase === 'inspecting' && go(playMode() === 'tutorial' ? 'diagnosis' : 'build'))
      }
    },

    pick(item) {
      const state = get()
      if (state.phase !== 'build') return
      const placedIn = jointOfItem(state.placements, item)
      if (placedIn) {
        set({ placements: removeJoint(state.placements, placedIn), held: null, pendingSlot: null })
      } else {
        set({ held: state.held === item ? null : item, pendingSlot: null })
      }
      audio.play('pickup')
    },

    clickSlot(slot) {
      const state = get()
      const job = currentJob(state)
      if (state.phase !== 'build' || !job || !slotAvailable(job.repair, state.placements, slot)) return
      const joint = jointForSlot(job.repair, slot)
      if (!joint) return
      if (!state.held) {
        if (state.placements[joint.id]) {
          set({ placements: removeJoint(state.placements, joint.id) })
          audio.play('pickup')
        }
        return
      }
      if (joint.slots.length === 2) {
        if (state.pendingSlot === null || !joint.slots.includes(state.pendingSlot)) {
          set({ pendingSlot: slot })
          audio.play('attach')
          return
        }
        if (state.pendingSlot === slot) {
          set({ pendingSlot: null })
          return
        }
      }
      set({ placements: place(state.placements, joint.id, state.held), held: null, pendingSlot: null })
      audio.play('attach')
    },

    letGo() {
      const state = get()
      if (state.phase !== 'build' || (!state.held && !state.pendingSlot)) return
      set({ held: null, pendingSlot: null })
      audio.play('pickup')
    },

    removeJoint(joint) {
      const state = get()
      if (state.phase !== 'build') return
      set({ placements: removeJoint(state.placements, joint) })
      audio.play('pickup')
    },

    pickZone(index) {
      const state = get()
      const script = currentScript(state)
      const job = script?.jobs[index]
      if (state.phase !== 'pick' || !script?.zones || !job) return
      if (selectProgress(useGame.getState())?.completedJobs.includes(job.id)) return
      audio.play('click')
      startJob(index)
    },

    askMama() {
      const state = get()
      if (state.phase !== 'build' || state.askedMama || !currentScript(state)?.askMama) return
      set({ askedMama: true })
      audio.play('click')
    },

    test() {
      const state = get()
      const job = currentJob(state)
      if (state.phase !== 'build' || !job || !canTest(state.placements)) return
      const outcome = withMamaPenalty(job.repair.evaluate(state.placements), state.askedMama)
      const duration = ms(job.test.duration, 1200)
      go('testing', { outcome, held: null, pendingSlot: null, testId: state.testId + 1, testMs: duration })
      audio.play('click')
      if (job.test.hum) audio.hum(duration / 1000 - 0.3, job.test.hum)
      if (job.test.start) audio.play(job.test.start)
      for (const [code, at] of Object.entries(job.test.pops ?? {})) {
        if (outcome.code === code) after(duration * at, () => audio.play('pop'))
      }
      if (outcome.pass && job.test.pass) after(duration * 0.5, () => job.test.pass && audio.play(job.test.pass))
      after(duration, () => {
        if (get().phase !== 'testing') return
        if (outcome.pass) {
          audio.play('success')
          go('result')
        } else if (outcome.partial) {
          audio.play('attach')
          go('result', { refined: true, lastHint: outcome.hint ?? null })
        } else {
          audio.play('fail')
          useGame.getState().recordFailedTest()
          go('result', { fails: get().fails + 1, lastHint: outcome.hint ?? null })
        }
      })
    },

    retry() {
      const state = get()
      if (state.phase !== 'result' || !state.outcome || state.outcome.pass) return
      go('build', { placements: removeJoints(state.placements, state.outcome.returnJoints), outcome: null })
    },

    resetBench() {
      if (get().phase !== 'build') return
      set({ placements: {}, held: null, pendingSlot: null })
      audio.play('pickup')
    },
  }
})

export interface Guidance {
  text: string
  glowItem?: ItemId
  glowSlots: readonly string[]
  glowButton?: 'inspect' | 'test'
}

/** Failures before the diary spells out the answer. */
export const SOLUTION_AFTER: Readonly<Record<PlayMode, number>> = { tutorial: 2, self: 3 }

/** What Mama's diary says right now, and what should glow. Only tutorial mode glows. */
export function guidance(state: DayState, mode: PlayMode): Guidance | null {
  const job = currentJob(state)
  if (!job) return null
  const tutorial = mode === 'tutorial'

  if (state.phase === 'inspect') {
    return tutorial
      ? { text: `${job.rule} Press INSPECT.`, glowSlots: [], glowButton: 'inspect' }
      : { text: 'Inspect the machine.', glowSlots: [] }
  }
  if (state.phase === 'inspecting') {
    if (state.blocked) return { text: state.blocked, glowSlots: [] }
    if (!tutorial) return { text: 'Check the machine. Find what works and what doesn’t.', glowSlots: [] }
    const step = job.inspect.find((s) => !state.seen.includes(s.target) && (!s.requires || state.seen.includes(s.requires)))
    return { text: step ? `${step.prompt}.` : 'Hmm…', glowSlots: [] }
  }
  if (state.phase !== 'build') return null

  const { repair } = job
  const openSlots = repair.joints
    .filter((j) => !state.placements[j.id])
    .flatMap((j) => [...j.slots])
    .filter((s) => slotAvailable(repair, state.placements, s))
  const test: Guidance = { text: 'Now press TEST REPAIR.', glowSlots: [], glowButton: tutorial ? 'test' : undefined }

  if (state.fails >= SOLUTION_AFTER[mode]) {
    return { text: `Full answer: ${job.solution}`, glowSlots: tutorial ? openSlots : [] }
  }

  if (!tutorial) {
    if (openSlots.length === 0) return { text: 'Test it when you’re ready.', glowSlots: [] }
    if (state.held) return { text: 'Where does it go?', glowSlots: [] }
    return { text: state.refined && job.refine ? job.refine.text : job.goal, glowSlots: [] }
  }

  // Tutorial: walk the steps in order, one placement at a time.
  for (let i = 0; i < job.walkthrough.length; i++) {
    const step = job.walkthrough[i]
    const joint = repair.joints.find((j) => j.id === step?.joint)
    if (!step || !joint) continue
    const placed = state.placements[joint.id]
    if (placed === step.item) {
      if (step.testAfter && !state.refined) return test
      continue
    }
    if (placed) {
      return { text: 'Not what Mama would pick. Test it and see, or tap the glowing spot to take it off.', glowSlots: [joint.slots[0]] }
    }
    if (state.held === null) return { text: step.pick, glowItem: step.item, glowSlots: [] }
    const prefix = state.held !== step.item ? 'Well, let’s try it anyway. ' : ''
    const first = joint.slots[0]
    const second = joint.slots[1]
    if (state.pendingSlot && second) {
      const other = state.pendingSlot === first ? second : first
      return { text: `${prefix}${step.attach[1] ?? step.attach[0] ?? ''}`, glowSlots: [other] }
    }
    return { text: `${prefix}${step.attach[0] ?? ''}`, glowSlots: [first] }
  }
  return test
}

/** Needs listed in the diary (tutorial mode). */
export function currentNeeds(state: DayState): readonly string[] {
  const job = currentJob(state)
  if (!job) return []
  return state.refined && job.refine ? [...job.needs, ...job.refine.needs] : job.needs
}
