import { describe, expect, it, vi } from 'vitest'
import { selectGameComplete, useGame } from '../src/app/state'
import { createNewSave, emptyProgress } from '../src/app/storage'
import { FUSE_REPAIR, GENERATOR_REPAIR, STAGE_REPAIR } from '../src/days/day7/repairs'
import { DAY_SEVEN } from '../src/days/day7/script'
import { dayDifficulty } from '../src/days/difficulty'
import { getDayDefinition } from '../src/days/dayDefinitions'
import { getDayScript } from '../src/days/registry'
import { type DayState, useDayRun } from '../src/days/runner/store'

const GEN_BEST = { fuel: 'penRefill', clamp: 'steelWire', cord: 'nylonRope', belt: 'innerTube' } as const

describe('Day 7: the generator', () => {
  it('refill sleeve + wire clamp + rope cord + tube belt is ★★★', () => {
    expect(GENERATOR_REPAIR.evaluate(GEN_BEST)).toMatchObject({ pass: true, rating: 3 })
  })

  it('the petrol leak is checked first, and gum dissolves in petrol', () => {
    const r = GENERATOR_REPAIR.evaluate({ ...GEN_BEST, fuel: 'chewingGum' })
    expect(r).toMatchObject({ pass: false, code: 'leak' })
    expect(r.message).toMatch(/dissolves/)
  })

  it('a sleeve needs its clamp, and the clamp spot only opens once the sleeve is on', () => {
    expect(GENERATOR_REPAIR.slots.find((s) => s.id === 'sleeveClamp')?.requires).toBe('fuel')
    expect(GENERATOR_REPAIR.evaluate({ fuel: 'innerTube', cord: 'nylonRope', belt: 'nylonRope' }).code).toBe('slide')
  })

  it('a rubber band snaps as a belt and stretches as a starter cord', () => {
    expect(GENERATOR_REPAIR.evaluate({ ...GEN_BEST, belt: 'rubberBand' }).message).toMatch(/snaps/)
    expect(GENERATOR_REPAIR.evaluate({ ...GEN_BEST, cord: 'rubberBand' }).message).toMatch(/stretches/)
  })
})

describe('Day 7: the fuse box (safety trap)', () => {
  const rest = { screw: 'spoon', cover: 'tape' } as const

  it('a single copper strand is the only safe fuse', () => {
    expect(FUSE_REPAIR.evaluate({ fuse: 'fuseStrand', ...rest })).toMatchObject({ pass: true, rating: 3 })
  })

  it('a coin, steel or thick copper "works" for a moment, then the wiring burns', () => {
    for (const cheat of ['coin', 'steelWire', 'wire'] as const) {
      const r = FUSE_REPAIR.evaluate({ fuse: cheat, ...rest })
      expect(r).toMatchObject({ pass: false, code: 'burn', returnJoints: ['fuse'] })
      expect(r.message).toMatch(/never melts/)
    }
  })

  it('metal over the cracked cover is a shock hazard', () => {
    expect(FUSE_REPAIR.evaluate({ fuse: 'fuseStrand', screw: 'spoon', cover: 'sodaCan' }).message).toMatch(/shock/)
  })

  it('the box can only be opened once the main is off', () => {
    const job = DAY_SEVEN.jobs[1]!
    for (const t of ['fuseCarrier', 'terminal']) expect(job.inspect.find((s) => s.target === t)?.requires).toBe('mainSwitch')
  })
})

describe('Day 7: the stage', () => {
  it('copper join + tape + tube spacer is ★★★', () => {
    expect(STAGE_REPAIR.evaluate({ splice: 'wire', wrap: 'tape', separate: 'innerTube' })).toMatchObject({ pass: true, rating: 3 })
  })

  it('metal between touching wires is still a short', () => {
    expect(STAGE_REPAIR.evaluate({ splice: 'wire', wrap: 'tape', separate: 'sodaCan' }).code).toBe('short')
  })
})

describe('Day 7: the countdown', () => {
  const base = createNewSave('Jayesh', new Date('2026-09-26T08:00:00.000Z'))
  const build = (clockLeft: number) =>
    ({ day: 7, jobIndex: 2, phase: 'build', askedMama: false, placements: {}, history: [], held: null, pendingSlot: null, seen: [], fails: 0, clockLeft, testId: 0 }) as unknown as DayState

  it('only runs while the player works, and stops at zero', () => {
    useDayRun.setState({ ...build(5000), phase: 'talk' })
    useDayRun.getState().tickClock(1000)
    expect(useDayRun.getState().clockLeft).toBe(5000)
    useDayRun.setState({ phase: 'build' })
    useDayRun.getState().tickClock(9000)
    expect(useDayRun.getState().clockLeft).toBe(0)
  })

  it('a fix finished after the deadline loses one star, with a note', () => {
    vi.stubGlobal('window', { setTimeout, clearTimeout, setInterval, clearInterval })
    useGame.setState({ save: { ...base, currentDay: 7 }, replay: { day: 7, progress: { ...emptyProgress(), mode: 'self' } } })
    useDayRun.setState({ ...build(0), placements: { splice: 'wire', wrap: 'tape', separate: 'innerTube' } })
    useDayRun.getState().test()
    expect(useDayRun.getState().outcome).toMatchObject({ rating: 2, note: expect.stringMatching(/pheras started late/) })
    useDayRun.getState().dispose()
    vi.unstubAllGlobals()
  })
})

describe('Day 7 script', () => {
  it('is the last day: registered, at night, three zones, Mama comes home', () => {
    expect(getDayScript(7)).toBe(DAY_SEVEN)
    expect(getDayDefinition(7)?.label).toBe('DAY 7')
    expect(getDayDefinition(8)).toBeUndefined()
    expect(DAY_SEVEN.night).toBe(true)
    expect(DAY_SEVEN.countdown?.ms).toBe(12 * 60_000)
    expect(DAY_SEVEN.jobs.map((j) => j.id)).toEqual(['generator', 'fuseBox', 'stage'])
    expect(DAY_SEVEN.evening.visitor).toBe('mama')
    expect(DAY_SEVEN.finale?.sign).toEqual({ before: 'HO JAYEGA', after: 'HO GAYA' })
  })

  it('the tutorial walkthrough builds the ★★★ fix in every zone', () => {
    for (const job of DAY_SEVEN.jobs) {
      const placements = Object.fromEntries(job.walkthrough.map((w) => [w.joint, w.item]))
      expect(job.repair.evaluate(placements)).toMatchObject({ pass: true, rating: 3 })
    }
  })

  it('is the hardest day of the week', () => {
    const d6 = dayDifficulty(getDayScript(6)!)
    const d7 = dayDifficulty(DAY_SEVEN)
    expect(d7.total).toBeGreaterThan(d6.total)
    expect(d7.hardest).toBeGreaterThanOrEqual(d6.hardest)
  })

  it('finishing it completes the game: the sign turns to HO GAYA', () => {
    const base = createNewSave('Jayesh', new Date('2026-09-26T08:00:00.000Z'))
    expect(selectGameComplete({ save: { ...base, currentDay: 7 } })).toBe(false)
    expect(selectGameComplete({ save: { ...base, currentDay: 7, progress: { ...emptyProgress(), finished: true } } })).toBe(true)
    expect(selectGameComplete({ save: { ...base, currentDay: 6, progress: { ...emptyProgress(), finished: true } } })).toBe(false)
  })
})
