import { describe, expect, it } from 'vitest'
import { COOLER_REPAIR, PEDAL_REPAIR } from '../src/days/day3/repairs'
import { DAY_THREE } from '../src/days/day3/script'
import { getDayDefinition } from '../src/days/dayDefinitions'
import { getDayScript } from '../src/days/registry'
import { slotAvailable } from '../src/repair/engine'
import { ITEMS } from '../src/repair/items'

describe('Day 3: Mishra Ji’s cooler', () => {
  it('only offers the tie once something bridges the gap', () => {
    expect(slotAvailable(COOLER_REPAIR, {}, 'tie')).toBe(false)
    expect(slotAvailable(COOLER_REPAIR, { pipe: 'innerTube' }, 'tie')).toBe(true)
  })

  it('stays dry with nothing, or with something solid', () => {
    expect(COOLER_REPAIR.evaluate({}).code).toBe('dry')
    expect(COOLER_REPAIR.evaluate({ pipe: 'woodenStick' })).toMatchObject({ pass: false, code: 'dry', returnJoints: ['pipe'] })
  })

  it('a pen refill is hollow but too thin and stiff: only a trickle', () => {
    expect(COOLER_REPAIR.evaluate({ pipe: 'penRefill' })).toMatchObject({ pass: false, code: 'trickle' })
  })

  it('the inner tube alone works until the pressure pops it off: an almost', () => {
    const r = COOLER_REPAIR.evaluate({ pipe: 'innerTube' })
    expect(r).toMatchObject({ pass: false, partial: true, code: 'pops', returnJoints: [] })
    expect(r.stages.map((s) => s.ok)).toEqual([true, true, false])
  })

  it('inner tube tied on with a rubber band passes', () => {
    const r = COOLER_REPAIR.evaluate({ pipe: 'innerTube', tie: 'rubberBand' })
    expect(r.pass).toBe(true)
    expect(r.stages.every((s) => s.ok)).toBe(true)
  })

  it('a wooden stick can’t tie anything', () => {
    expect(COOLER_REPAIR.evaluate({ pipe: 'innerTube', tie: 'woodenStick' })).toMatchObject({ partial: true, returnJoints: ['tie'] })
  })
})

describe('Day 3: Chhotu’s pedal', () => {
  it('a spoon doesn’t fit the pin hole', () => {
    expect(PEDAL_REPAIR.evaluate({ pin: 'spoon' })).toMatchObject({ pass: false, code: 'no-fit' })
  })

  it('a pen refill fits but bends as soon as it turns', () => {
    const r = PEDAL_REPAIR.evaluate({ pin: 'penRefill' })
    expect(r.code).toBe('wobble')
    expect(r.stages.map((s) => s.ok)).toEqual([true, false])
  })

  it('a wooden stick fits and turns, but snaps under load', () => {
    const r = PEDAL_REPAIR.evaluate({ pin: 'woodenStick' })
    expect(r).toMatchObject({ pass: false, code: 'snap', returnJoints: ['pin'] })
    expect(r.stages.map((s) => s.ok)).toEqual([true, true, false])
  })

  it('the steel bolt holds under load', () => {
    const r = PEDAL_REPAIR.evaluate({ pin: 'bolt' })
    expect(r.pass).toBe(true)
    expect(r.stages.map((s) => s.label)).toEqual(['Pedal fits', 'Pedal turns', 'Under load'])
  })
})

describe('Day 3 script', () => {
  it('is registered with two jobs, Ayesha in the evening and a finale', () => {
    expect(getDayScript(3)).toBe(DAY_THREE)
    expect(getDayDefinition(3)?.label).toBe('DAY 3')
    expect(DAY_THREE.jobs.map((j) => j.id)).toEqual(['cooler', 'pedal'])
    expect(DAY_THREE.evening.visitor).toBe('ayesha')
    expect(DAY_THREE.finale?.lines.length).toBeGreaterThan(0)
  })

  it('every job has needs, a walkthrough and only known parts', () => {
    for (const job of DAY_THREE.jobs) {
      expect(job.needs.length).toBeGreaterThan(0)
      expect(job.walkthrough.length).toBeGreaterThan(0)
      for (const id of job.repair.items) expect(ITEMS[id]).toBeDefined()
    }
  })

  it('Chhotu owns up to the chalk', () => {
    expect(DAY_THREE.jobs[1]!.thanks.some((l) => /chalk/i.test(l.text))).toBe(true)
  })

  it('is the last day of this build, so the shop stays on Day 3 after closing', () => {
    expect(getDayScript(4)).toBeUndefined()
    expect(getDayDefinition(4)).toBeUndefined()
  })
})
