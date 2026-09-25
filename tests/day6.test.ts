import { describe, expect, it } from 'vitest'
import { useGame } from '../src/app/state'
import { createNewSave, emptyProgress } from '../src/app/storage'
import { CAR_ENGINE_REPAIR, CAR_SILENCER_REPAIR, CAR_TYRE_REPAIR } from '../src/days/day6/repairs'
import { DAY_SIX } from '../src/days/day6/script'
import { getDayDefinition } from '../src/days/dayDefinitions'
import { getDayScript } from '../src/days/registry'
import { type DayState, useDayRun } from '../src/days/runner/store'
import { ITEMS } from '../src/repair/items'

describe('Day 6: under the bonnet', () => {
  it('rope belt + tube sleeve + coin shim is ★★★', () => {
    expect(CAR_ENGINE_REPAIR.evaluate({ belt: 'nylonRope', hose: 'innerTube', terminal: 'coin' })).toMatchObject({ pass: true, rating: 3 })
  })

  it('a rubber band snaps at engine speed', () => {
    expect(CAR_ENGINE_REPAIR.evaluate({ belt: 'rubberBand', hose: 'innerTube', terminal: 'coin' }).message).toMatch(/snaps/)
  })

  it('using the tube as the belt leaves only tape for the hose: ★★ at best', () => {
    expect(CAR_ENGINE_REPAIR.evaluate({ belt: 'innerTube', hose: 'tape', terminal: 'coin' }).rating).toBe(2)
  })
})

describe('Day 6: the silencer (heat!)', () => {
  it('anything soft melts on the exhaust', () => {
    for (const soft of ['nylonRope', 'rubberBand', 'clothStrip'] as const) {
      expect(CAR_SILENCER_REPAIR.evaluate({ hang: soft, patch: 'sodaCan', wrap: 'wire' }).message).toMatch(/melts/)
    }
    expect(CAR_SILENCER_REPAIR.evaluate({ hang: 'steelWire', patch: 'tape', wrap: 'wire' }).message).toMatch(/burns/)
  })

  it('steel wire hanger + soda can + copper wrap is ★★★', () => {
    expect(CAR_SILENCER_REPAIR.evaluate({ hang: 'steelWire', patch: 'sodaCan', wrap: 'wire' })).toMatchObject({ pass: true, rating: 3 })
  })

  it('swapping the wires (copper hanger) drops to ★★', () => {
    expect(CAR_SILENCER_REPAIR.evaluate({ hang: 'wire', patch: 'sodaCan', wrap: 'steelWire' }).rating).toBe(2)
  })
})

describe('Day 6: the tyre (safety first)', () => {
  it('skipping the chock fails, however good the rest is', () => {
    const r = CAR_TYRE_REPAIR.evaluate({ plug: 'innerTube', inflate: 'cyclePump' })
    expect(r).toMatchObject({ pass: false, code: 'rolls' })
    expect(r.message).toMatch(/Never skip the chock/)
  })

  it('a plugged tyre still needs air, and only the pump gives it', () => {
    expect(CAR_TYRE_REPAIR.evaluate({ chock: 'brick', plug: 'innerTube' }).code).toBe('flat')
    expect(CAR_TYRE_REPAIR.evaluate({ chock: 'brick', plug: 'innerTube', inflate: 'spoon' }).code).toBe('flat')
  })

  it('brick + tube plug + pump is ★★★; chewing gum is ★★ overall', () => {
    expect(CAR_TYRE_REPAIR.evaluate({ chock: 'brick', plug: 'innerTube', inflate: 'cyclePump' }).rating).toBe(3)
    expect(CAR_TYRE_REPAIR.evaluate({ chock: 'brick', plug: 'chewingGum', inflate: 'cyclePump' }).rating).toBe(2)
  })
})

describe('Day 6: zone flow', () => {
  const base = createNewSave('Jayesh', new Date('2026-09-25T08:00:00.000Z'))

  it('the player picks zones in any order; finished ones can’t be picked again', () => {
    useGame.setState({ save: { ...base, currentDay: 6 }, replay: { day: 6, progress: { ...emptyProgress(), completedJobs: ['carSilencer'], mode: 'self' } } })
    const pick = { day: 6, jobIndex: 0, phase: 'pick', seen: [], placements: {}, fails: 0 } as unknown as DayState
    useDayRun.setState(pick)
    useDayRun.getState().pickZone(1)
    expect(useDayRun.getState().phase).toBe('pick')
    useDayRun.getState().pickZone(2)
    expect(useDayRun.getState()).toMatchObject({ phase: 'talk', jobIndex: 2 })
  })

  it('every zone job belongs to the same customer and the same car', () => {
    expect(new Set(DAY_SIX.jobs.map((j) => j.customer.name))).toEqual(new Set(['Mr. Khanna']))
    for (const job of DAY_SIX.jobs) {
      expect(job.zone).toBeDefined()
      expect(job.buildPose).toBeDefined()
    }
  })
})

describe('Day 6 script', () => {
  it('is registered: a morning scene with Rocky, three zones, Rocky in the evening', () => {
    expect(getDayScript(6)).toBe(DAY_SIX)
    expect(getDayDefinition(6)?.label).toBe('DAY 6')
    expect(DAY_SIX.morning?.some((l) => l.who === 'visitor')).toBe(true)
    expect(DAY_SIX.zones).toBeDefined()
    expect(DAY_SIX.jobs.map((j) => j.id)).toEqual(['carEngine', 'carSilencer', 'carTyre'])
    expect(DAY_SIX.evening.visitor).toBe('rocky')
  })

  it('introduces new parts that earlier days never used', () => {
    const earlier = new Set([1, 2, 3, 4, 5].flatMap((d) => getDayScript(d)!.jobs.flatMap((j) => j.repair.items)))
    const fresh = new Set(DAY_SIX.jobs.flatMap((j) => j.repair.items).filter((i) => !earlier.has(i)))
    expect([...fresh].sort()).toEqual(['brick', 'chewingGum', 'coin', 'cyclePump', 'nylonRope', 'sodaCan'])
    for (const id of fresh) expect(ITEMS[id]).toBeDefined()
  })

  it('the tutorial walkthrough builds the ★★★ fix in every zone', () => {
    for (const job of DAY_SIX.jobs) {
      const placements = Object.fromEntries(job.walkthrough.map((w) => [w.joint, w.item]))
      expect(job.repair.evaluate(placements)).toMatchObject({ pass: true, rating: 3 })
    }
  })
})
