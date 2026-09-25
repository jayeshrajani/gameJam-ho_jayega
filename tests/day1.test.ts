import { describe, expect, it } from 'vitest'
import { FAN_REPAIR, MIXER_REPAIR } from '../src/days/day1/repairs'
import { DAY_ONE } from '../src/days/day1/script'
import { canTest, itemsOnBench, jointForSlot, jointOfItem, place, removeJoint, removeJoints } from '../src/repair/engine'
import { ITEMS } from '../src/repair/items'

describe('repair engine', () => {
  it('finds the joint for a slot', () => {
    expect(jointForSlot(FAN_REPAIR, 'fanPulley')?.id).toBe('drive')
    expect(jointForSlot(MIXER_REPAIR, 'contact')?.id).toBe('return')
    expect(jointForSlot(MIXER_REPAIR, 'nope')).toBeUndefined()
  })

  it('moves an item between joints instead of duplicating it', () => {
    const a = place({}, 'pusher', 'spring')
    const b = place(a, 'return', 'spring')
    expect(b).toEqual({ return: 'spring' })
    expect(jointOfItem(b, 'spring')).toBe('return')
  })

  it('swaps out whatever was already in a joint', () => {
    const p = place(place({}, 'pusher', 'wire'), 'pusher', 'bottleCap')
    expect(p).toEqual({ pusher: 'bottleCap' })
    expect(itemsOnBench(MIXER_REPAIR, p)).toEqual(['spring', 'wire'])
  })

  it('removes joints and knows when a test is possible', () => {
    const p = place(place({}, 'pusher', 'bottleCap'), 'return', 'spring')
    expect(canTest({})).toBe(false)
    expect(canTest(p)).toBe(true)
    expect(removeJoint(p, 'pusher')).toEqual({ return: 'spring' })
    expect(removeJoints(p, ['pusher', 'return'])).toEqual({})
  })
})

describe('Day 1: table fan', () => {
  it('passes with the rubber band as a belt', () => {
    const r = FAN_REPAIR.evaluate({ drive: 'rubberBand' })
    expect(r.pass).toBe(true)
    expect(r.stages.every((s) => s.ok)).toBe(true)
  })

  it('jams harmlessly with the spoon and returns it to the bench', () => {
    const r = FAN_REPAIR.evaluate({ drive: 'spoon' })
    expect(r).toMatchObject({ pass: false, code: 'jam', returnJoints: ['drive'] })
    expect(r.hint).toBeTruthy()
  })

  it('slips with a flexible item that has no grip', () => {
    expect(FAN_REPAIR.evaluate({ drive: 'wire' }).code).toBe('slip')
  })
})

describe('Day 1: mixer switch', () => {
  it('passes with the cap as pusher and the spring as return', () => {
    const r = MIXER_REPAIR.evaluate({ pusher: 'bottleCap', return: 'spring' })
    expect(r.pass).toBe(true)
    expect(r.stages.map((s) => s.ok)).toEqual([true, true])
  })

  it('fails a permanent wire bridge: it runs but never stops', () => {
    const r = MIXER_REPAIR.evaluate({ pusher: 'bottleCap', return: 'wire' })
    expect(r).toMatchObject({ pass: false, code: 'bridge', returnJoints: ['return'] })
    expect(r.stages.map((s) => s.ok)).toEqual([true, false])
    expect(MIXER_REPAIR.evaluate({ pusher: 'wire' }).code).toBe('bridge')
  })

  it('fails when nothing brings the button back', () => {
    expect(MIXER_REPAIR.evaluate({ pusher: 'bottleCap' })).toMatchObject({ pass: false, code: 'no-return', returnJoints: [] })
  })

  it('fails a soft pusher, and an empty button', () => {
    expect(MIXER_REPAIR.evaluate({ pusher: 'spring', return: 'bottleCap' }).code).toBe('soft-push')
    expect(MIXER_REPAIR.evaluate({ return: 'spring' }).code).toBe('no-push')
  })
})

describe('Day 1 script', () => {
  it('has two jobs, each with a reachable solution among its own items', () => {
    expect(DAY_ONE.jobs.map((j) => j.id)).toEqual(['fan', 'mixer'])
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
