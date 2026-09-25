import { describe, expect, it } from 'vitest'
import { DAY_ONE } from '../src/days/day1/script'
import { DAY_TWO } from '../src/days/day2/script'
import { DAY_THREE } from '../src/days/day3/script'
import { DAY_FOUR } from '../src/days/day4/script'
import { DAY_FIVE } from '../src/days/day5/script'
import { type DayState, guidance, useDayRun } from '../src/days/runner/store'
import type { DayScript } from '../src/days/types'
import type { Placements } from '../src/repair/types'

const DAYS: readonly DayScript[] = [DAY_ONE, DAY_TWO, DAY_THREE, DAY_FOUR, DAY_FIVE]

function state(day: number, jobIndex: number, over: Partial<DayState> = {}): DayState {
  return {
    day,
    jobIndex,
    phase: 'build',
    phaseAt: 0,
    line: 0,
    seen: [],
    stepAt: 0,
    blocked: null,
    held: null,
    pendingSlot: null,
    placements: {} as Placements,
    outcome: null,
    lastHint: null,
    fails: 0,
    refined: false,
    testId: 0,
    testMs: 1,
    ...over,
  } as DayState
}

describe('gameplay text', () => {
  const allText = DAYS.flatMap((d) => [
    ...(d.morning ?? []).map((l) => l.text),
    ...d.evening.lines.map((l) => l.text),
    d.endLine,
    ...d.jobs.flatMap((j) => [
      ...j.arrival.map((l) => l.text),
      ...j.diagnosis.map((l) => l.text),
      ...j.thanks.map((l) => l.text),
      j.goal,
      j.rule,
      j.solution,
      ...j.inspect.flatMap((s) => [s.prompt, s.observation]),
      ...j.walkthrough.flatMap((w) => [w.pick, ...w.attach]),
    ]),
  ])

  it('is English only (no Devanagari in dialogue or instructions)', () => {
    for (const t of allText) expect(t).not.toMatch(/[\u0900-\u097F]/)
  })

  it('has no narrator: every line belongs to a speaker', () => {
    const speakers = new Set(
      DAYS.flatMap((d) => [...(d.morning ?? []), ...d.evening.lines, ...d.jobs.flatMap((j) => [...j.arrival, ...j.diagnosis, ...j.thanks])]).map(
        (l) => l.who,
      ),
    )
    expect([...speakers].every((w) => ['customer', 'player', 'mama', 'visitor'].includes(w))).toBe(true)
  })
})

describe('guidance by play mode', () => {
  it('tutorial mode glows the next part, then the slot, then the test button', () => {
    expect(guidance(state(1, 0), 'tutorial')).toMatchObject({ glowItem: 'rubberBand' })
    expect(guidance(state(1, 0, { held: 'rubberBand' }), 'tutorial')?.glowSlots).toEqual(['motorPulley'])
    expect(guidance(state(1, 0, { held: 'rubberBand', pendingSlot: 'motorPulley' }), 'tutorial')?.glowSlots).toEqual(['fanPulley'])
    expect(guidance(state(1, 0, { placements: { drive: 'rubberBand' } }), 'tutorial')?.glowButton).toBe('test')
  })

  it('play-it-yourself mode never glows anything', () => {
    for (const s of [state(1, 0), state(1, 0, { held: 'rubberBand' }), state(1, 0, { placements: { drive: 'rubberBand' } })]) {
      const g = guidance(s, 'self')
      expect(g?.glowItem).toBeUndefined()
      expect(g?.glowSlots).toEqual([])
      expect(g?.glowButton).toBeUndefined()
    }
  })

  it('play-it-yourself spells out the answer only after three failures', () => {
    expect(guidance(state(2, 0, { fails: 2 }), 'self')?.text).not.toMatch(/Full answer/)
    expect(guidance(state(2, 0, { fails: 3 }), 'self')?.text).toMatch(/Full answer/)
    expect(guidance(state(2, 0, { fails: 2 }), 'tutorial')?.text).toMatch(/Full answer/)
  })

  it('the pump tutorial asks for a test after the tape, then moves on to the clamp', () => {
    const taped = { seal: 'tape' } as Placements
    expect(guidance(state(2, 1, { placements: taped }), 'tutorial')?.glowButton).toBe('test')
    expect(guidance(state(2, 1, { placements: taped, refined: true }), 'tutorial')).toMatchObject({ glowItem: 'wire' })
  })

  it('the mixer tutorial walks both parts in order', () => {
    expect(guidance(state(1, 1), 'tutorial')).toMatchObject({ glowItem: 'bottleCap' })
    expect(guidance(state(1, 1, { placements: { pusher: 'bottleCap' } }), 'tutorial')).toMatchObject({ glowItem: 'spring' })
  })

  it('inspection prompts only appear in tutorial mode', () => {
    const inspecting = state(1, 0, { phase: 'inspecting' })
    expect(guidance(inspecting, 'tutorial')?.text).toMatch(/switch the fan on/i)
    expect(guidance(inspecting, 'self')?.text).not.toMatch(/switch the fan on/i)
  })
})

describe('common-sense inspection order', () => {
  it('every inspect step has a readable label, and every requirement points at an earlier step', () => {
    for (const job of DAYS.flatMap((d) => d.jobs)) {
      job.inspect.forEach((step, i) => {
        expect(step.label.length).toBeGreaterThan(0)
        if (step.requires) expect(job.inspect.slice(0, i).map((s) => s.target)).toContain(step.requires)
      })
    }
  })

  it('machines with a power switch are switched on before anything that needs power', () => {
    const radio = DAY_TWO.jobs[0]!.inspect
    expect(radio.find((s) => s.target === 'tuning')?.requires).toBe('power')
    const fan = DAY_ONE.jobs[0]!.inspect
    expect(fan[0]?.target).toBe('fanSwitch')
    expect(fan.find((s) => s.target === 'fanPulley')?.requires).toBe('fanSwitch')
  })

  it('tuning a radio that is off is refused with a friendly reason', () => {
    useDayRun.setState(state(2, 0, { phase: 'inspecting' }))
    useDayRun.getState().inspectTarget('tuning')
    expect(useDayRun.getState().seen).toEqual([])
    expect(useDayRun.getState().blocked).toMatch(/switch it on first/i)
    expect(guidance(useDayRun.getState(), 'self')?.text).toMatch(/switch it on first/i)

    useDayRun.getState().inspectTarget('power')
    useDayRun.getState().inspectTarget('tuning')
    expect(useDayRun.getState().seen).toEqual(['power', 'tuning'])
    expect(useDayRun.getState().blocked).toBeNull()
  })

  it('the tutorial prompt skips steps whose requirement is not met yet', () => {
    const g = guidance(state(2, 0, { phase: 'inspecting' }), 'tutorial')
    expect(g?.text).toMatch(/switch it on/i)
  })
})

describe('drag and drop', () => {
  it('dropping a half-hooked belt anywhere else sends it back to the tray', () => {
    useDayRun.setState(state(1, 0))
    useDayRun.getState().pick('rubberBand')
    useDayRun.getState().clickSlot('motorPulley')
    expect(useDayRun.getState().pendingSlot).toBe('motorPulley')
    useDayRun.getState().letGo()
    expect(useDayRun.getState()).toMatchObject({ held: null, pendingSlot: null, placements: {} })
  })

  it('hooking one pulley then dropping on the other fits the belt', () => {
    useDayRun.setState(state(1, 0))
    useDayRun.getState().pick('rubberBand')
    useDayRun.getState().clickSlot('motorPulley')
    useDayRun.getState().clickSlot('fanPulley')
    expect(useDayRun.getState().placements).toEqual({ drive: 'rubberBand' })
  })
})
