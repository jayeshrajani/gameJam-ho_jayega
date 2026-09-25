import { describe, expect, it } from 'vitest'
import { PUMP_REPAIR, RADIO_REPAIR } from '../src/days/day2/repairs'
import { DAY_TWO } from '../src/days/day2/script'
import { getDayDefinition } from '../src/days/dayDefinitions'
import { getDayScript } from '../src/days/registry'
import { slotAvailable } from '../src/repair/engine'
import { ITEMS } from '../src/repair/items'

describe('Day 2: Ayesha’s radio', () => {
  it('works with the steel wire: conductive and long', () => {
    const r = RADIO_REPAIR.evaluate({ antenna: 'steelWire' })
    expect(r.pass).toBe(true)
    expect(r.stages.every((s) => s.ok)).toBe(true)
  })

  it('rejects a long stick that doesn’t conduct', () => {
    expect(RADIO_REPAIR.evaluate({ antenna: 'woodenStick' })).toMatchObject({ pass: false, code: 'no-signal', returnJoints: ['antenna'] })
  })

  it('rejects a rubber band that is neither', () => {
    expect(RADIO_REPAIR.evaluate({ antenna: 'rubberBand' }).code).toBe('no-signal')
  })
})

describe('Day 2: Rafiq Bhai’s pump', () => {
  it('only offers the clamp spot once something covers the crack', () => {
    expect(slotAvailable(PUMP_REPAIR, {}, 'clamp')).toBe(false)
    expect(slotAvailable(PUMP_REPAIR, { seal: 'tape' }, 'clamp')).toBe(true)
  })

  it('leaks with nothing, or with something that doesn’t seal', () => {
    expect(PUMP_REPAIR.evaluate({ seal: 'spoon' })).toMatchObject({ pass: false, code: 'leak', returnJoints: ['seal'] })
  })

  it('tape alone is a partial fix that keeps the tape on', () => {
    const r = PUMP_REPAIR.evaluate({ seal: 'tape' })
    expect(r).toMatchObject({ pass: false, partial: true, code: 'drip', returnJoints: [] })
    expect(r.stages.map((s) => s.ok)).toEqual([true, true, false])
  })

  it('a spoon over the tape can’t clamp it', () => {
    expect(PUMP_REPAIR.evaluate({ seal: 'tape', clamp: 'spoon' })).toMatchObject({ partial: true, returnJoints: ['clamp'] })
  })

  it('tape plus a wire clamp holds under pressure', () => {
    const r = PUMP_REPAIR.evaluate({ seal: 'tape', clamp: 'wire' })
    expect(r.pass).toBe(true)
    expect(r.stages.map((s) => s.ok)).toEqual([true, true, true])
  })
})

describe('Day 2 script', () => {
  it('is registered with two jobs and an evening visitor (no morning scene)', () => {
    expect(getDayScript(2)).toBe(DAY_TWO)
    expect(getDayDefinition(2)?.label).toBe('DAY 2')
    expect(DAY_TWO.morning).toBeUndefined()
    expect(DAY_TWO.jobs.map((j) => j.id)).toEqual(['radio', 'pump'])
    expect(DAY_TWO.evening.visitor).toBe('sharma')
  })

  it('lists needs and a tutorial walkthrough for every job', () => {
    for (const job of DAY_TWO.jobs) {
      expect(job.needs.length).toBeGreaterThan(0)
      expect(job.walkthrough.length).toBeGreaterThan(0)
      for (const id of job.repair.items) expect(ITEMS[id]).toBeDefined()
    }
  })

  it('recommends playing it yourself', () => {
    expect(DAY_TWO.recommend).toBe('self')
  })

  it('has no Day 3 yet, so the shop stays on Day 2 after closing', () => {
    expect(getDayScript(3)).toBeUndefined()
    expect(getDayDefinition(3)).toBeUndefined()
  })
})
