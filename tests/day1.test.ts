import { describe, expect, it } from 'vitest'
import { GRAMOPHONE_REPAIR, SCALE_REPAIR } from '../src/days/day1/repairs'
import { DAY_ONE } from '../src/days/day1/script'
import { canTest, itemsOnBench, jointForSlot, jointOfItem, place, removeJoint, removeJoints } from '../src/repair/engine'
import { ITEMS } from '../src/repair/items'

describe('repair engine', () => {
  it('finds the joint for a slot', () => {
    expect(jointForSlot(GRAMOPHONE_REPAIR, 'needleHolder')?.id).toBe('needle')
    expect(jointForSlot(SCALE_REPAIR, 'springCase')?.id).toBe('spring')
    expect(jointForSlot(SCALE_REPAIR, 'nope')).toBeUndefined()
  })

  it('moves an item between joints instead of duplicating it', () => {
    const a = place({}, 'hook', 'spring')
    const b = place(a, 'spring', 'spring')
    expect(b).toEqual({ spring: 'spring' })
    expect(jointOfItem(b, 'spring')).toBe('spring')
  })

  it('swaps out whatever was already in a joint', () => {
    const p = place(place({}, 'hook', 'bottleCap'), 'hook', 'wire')
    expect(p).toEqual({ hook: 'wire' })
    expect(itemsOnBench(SCALE_REPAIR, p)).toEqual(['spring', 'bottleCap'])
  })

  it('removes joints and knows when a test is possible', () => {
    const p = place(place({}, 'hook', 'wire'), 'spring', 'spring')
    expect(canTest({})).toBe(false)
    expect(canTest(p)).toBe(true)
    expect(removeJoint(p, 'hook')).toEqual({ spring: 'spring' })
    expect(removeJoints(p, ['hook', 'spring'])).toEqual({})
  })
})

describe('Day 1: gramophone', () => {
  it('plays with the safety pin as the needle', () => {
    const r = GRAMOPHONE_REPAIR.evaluate({ needle: 'safetyPin' })
    expect(r.pass).toBe(true)
    expect(r.stages.every((s) => s.ok)).toBe(true)
  })

  it('scratches harmlessly with the blunt spoon and returns it to the bench', () => {
    const r = GRAMOPHONE_REPAIR.evaluate({ needle: 'spoon' })
    expect(r).toMatchObject({ pass: false, code: 'scratch', returnJoints: ['needle'] })
    expect(r.hint).toBeTruthy()
  })

  it('stays silent with something soft', () => {
    expect(GRAMOPHONE_REPAIR.evaluate({ needle: 'rubberBand' }).code).toBe('silent')
  })
})

describe('Day 1: shop scale', () => {
  it('passes with a copper-wire hook and the spring inside', () => {
    const r = SCALE_REPAIR.evaluate({ hook: 'wire', spring: 'spring' })
    expect(r.pass).toBe(true)
    expect(r.stages.map((s) => s.ok)).toEqual([true, true, true])
  })

  it('never comes back to zero without something springy inside', () => {
    const r = SCALE_REPAIR.evaluate({ hook: 'wire', spring: 'bottleCap' })
    expect(r).toMatchObject({ pass: false, code: 'no-zero', returnJoints: ['spring'] })
    expect(r.stages.map((s) => s.ok)).toEqual([true, false])
    expect(SCALE_REPAIR.evaluate({ hook: 'wire' })).toMatchObject({ code: 'no-zero', returnJoints: [] })
  })

  it('drops the pan without a proper hook, and bounces on a spring hook', () => {
    expect(SCALE_REPAIR.evaluate({ hook: 'bottleCap', spring: 'spring' })).toMatchObject({ code: 'drop', returnJoints: ['hook'] })
    expect(SCALE_REPAIR.evaluate({ spring: 'spring' })).toMatchObject({ code: 'drop', returnJoints: [] })
    expect(SCALE_REPAIR.evaluate({ hook: 'spring', spring: 'wire' }).code).toBe('bounce')
  })
})

describe('Day 1 script', () => {
  it('has two jobs, each with a reachable solution among its own items', () => {
    expect(DAY_ONE.jobs.map((j) => j.id)).toEqual(['gramophone', 'scale'])
    for (const job of DAY_ONE.jobs) {
      for (const id of job.repair.items) expect(ITEMS[id]).toBeDefined()
      for (const step of job.inspect) expect(step.target).toBeTruthy()
    }
  })

  it('rewards a clean day with the proper title', () => {
    expect(DAY_ONE.reportTitle(0)).toBe('Local Engineering Department')
    expect(DAY_ONE.reportTitle(3)).toBe('Jugaad Research Institute')
  })
})
