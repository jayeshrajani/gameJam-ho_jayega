import { describe, expect, it } from 'vitest'
import { LIGHTS_REPAIR, SPEAKER_REPAIR } from '../src/days/day5/repairs'
import { DAY_FIVE } from '../src/days/day5/script'
import { getDayDefinition } from '../src/days/dayDefinitions'
import { getDayScript } from '../src/days/registry'
import { type DayState, useDayRun, withMamaPenalty } from '../src/days/runner/store'
import { ITEMS } from '../src/repair/items'

describe('Day 5: Bunty’s loudspeaker', () => {
  it('copper wire + bolt + tape is ★★★', () => {
    expect(SPEAKER_REPAIR.evaluate({ lead: 'wire', screw: 'bolt', patch: 'tape' })).toMatchObject({ pass: true, rating: 3 })
  })

  it('the terminal only appears once a wire is joined', () => {
    expect(SPEAKER_REPAIR.slots.find((s) => s.id === 'terminal')?.requires).toBe('lead')
  })

  it('a rubber band carries no signal', () => {
    expect(SPEAKER_REPAIR.evaluate({ lead: 'rubberBand', screw: 'bolt', patch: 'tape' })).toMatchObject({ code: 'silent', returnJoints: ['lead'] })
  })

  it('using the safety pin as the wire leaves a weaker terminal: ★★ at best', () => {
    expect(SPEAKER_REPAIR.evaluate({ lead: 'safetyPin', screw: 'bolt', patch: 'tape' }).rating).toBe(2)
  })
})

describe('Day 5: Ayesha’s lights', () => {
  it('copper join + tape cover + hair clip contact is ★★★', () => {
    expect(LIGHTS_REPAIR.evaluate({ splice: 'wire', insulate: 'tape', contact: 'hairClip' })).toMatchObject({ pass: true, rating: 3 })
  })

  it('a bare joint is never acceptable, and metal over it is worse', () => {
    const bare = LIGHTS_REPAIR.evaluate({ splice: 'wire', contact: 'hairClip' })
    expect(bare).toMatchObject({ pass: false, code: 'bare' })
    expect(bare.message).toMatch(/Never leave a joint bare/)
    expect(LIGHTS_REPAIR.evaluate({ splice: 'wire', insulate: 'safetyPin', contact: 'hairClip' }).message).toMatch(/metal/)
  })

  it('one dark bulb keeps the whole string dark', () => {
    expect(LIGHTS_REPAIR.evaluate({ splice: 'wire', insulate: 'tape' }).message).toMatch(/one dark bulb/i)
  })

  it('the inspection has more red herrings than faults', () => {
    const job = DAY_FIVE.jobs[1]!
    expect(job.inspect.filter((s) => s.ok).length).toBeGreaterThan(job.inspect.filter((s) => !s.ok).length)
  })
})

describe('Ask Mama', () => {
  it('costs one star, never below ★', () => {
    const three = SPEAKER_REPAIR.evaluate({ lead: 'wire', screw: 'bolt', patch: 'tape' })
    expect(withMamaPenalty(three, true)).toMatchObject({ rating: 2, note: expect.stringMatching(/asked Mama/) })
    expect(withMamaPenalty(three, false).rating).toBe(3)
    const one = SPEAKER_REPAIR.evaluate({ lead: 'safetyPin', screw: 'hairClip', patch: 'clothStrip' })
    expect(withMamaPenalty(one, true).rating).toBe(1)
  })

  it('is only offered on days that allow it, while building', () => {
    const base = { jobIndex: 0, phase: 'build', askedMama: false, placements: {}, seen: [], fails: 0 } as unknown as DayState
    useDayRun.setState({ ...base, day: 4 })
    useDayRun.getState().askMama()
    expect(useDayRun.getState().askedMama).toBe(false)
    useDayRun.setState({ ...base, day: 5 })
    useDayRun.getState().askMama()
    expect(useDayRun.getState().askedMama).toBe(true)
  })
})

describe('Undo', () => {
  const build = () =>
    ({ day: 5, jobIndex: 0, phase: 'build', askedMama: false, placements: {}, history: [], held: null, pendingSlot: null, seen: [], fails: 0 }) as unknown as DayState
  const fit = (item: 'wire' | 'tape' | 'clothStrip', slot: string) => {
    useDayRun.getState().pick(item)
    useDayRun.getState().clickSlot(slot)
  }

  it('steps back one placement at a time', () => {
    useDayRun.setState(build())
    fit('wire', 'speakerWire')
    fit('tape', 'cone')
    useDayRun.getState().undo()
    expect(useDayRun.getState().placements).toEqual({ lead: 'wire' })
    useDayRun.getState().undo()
    expect(useDayRun.getState().placements).toEqual({})
    useDayRun.getState().undo()
    expect(useDayRun.getState().placements).toEqual({})
  })

  it('brings back a swapped-out part and a cleared bench', () => {
    useDayRun.setState(build())
    fit('tape', 'cone')
    fit('clothStrip', 'cone')
    useDayRun.getState().undo()
    expect(useDayRun.getState().placements).toEqual({ patch: 'tape' })
    useDayRun.getState().resetBench()
    useDayRun.getState().undo()
    expect(useDayRun.getState().placements).toEqual({ patch: 'tape' })
  })

  it('tapping a fitted part or its spot no longer takes it off', () => {
    useDayRun.setState(build())
    fit('tape', 'cone')
    useDayRun.getState().pick('tape')
    useDayRun.getState().clickSlot('cone')
    expect(useDayRun.getState()).toMatchObject({ placements: { patch: 'tape' }, held: null })
  })
})

describe('Day 5 script', () => {
  it('is registered with two jobs, Rocky softening in the evening, and Ask Mama on', () => {
    expect(getDayScript(5)).toBe(DAY_FIVE)
    expect(getDayDefinition(5)?.label).toBe('DAY 5')
    expect(DAY_FIVE.jobs.map((j) => j.id)).toEqual(['speaker', 'lights'])
    expect(DAY_FIVE.evening.visitor).toBe('rocky')
    expect(DAY_FIVE.askMama).toBe(true)
    for (const job of DAY_FIVE.jobs) for (const id of job.repair.items) expect(ITEMS[id]).toBeDefined()
  })

  it('the tutorial walkthrough builds the ★★★ fix', () => {
    for (const job of DAY_FIVE.jobs) {
      const placements = Object.fromEntries(job.walkthrough.map((w) => [w.joint, w.item]))
      expect(job.repair.evaluate(placements)).toMatchObject({ pass: true, rating: 3 })
    }
  })
})
