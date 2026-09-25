import { describe, expect, it } from 'vitest'
import { COOLER_REPAIR, PEDAL_REPAIR } from '../src/days/day3/repairs'
import { DAY_THREE } from '../src/days/day3/script'
import { getDayDefinition } from '../src/days/dayDefinitions'
import { dayDifficulty, jobDifficulty } from '../src/days/difficulty'
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
  const good = { link: 'steelWire', pin: 'bolt', lock: 'wire' } as const

  it('only offers the pin lock once a pin is in', () => {
    expect(slotAvailable(PEDAL_REPAIR, {}, 'pinEnd')).toBe(false)
    expect(slotAvailable(PEDAL_REPAIR, { pin: 'bolt' }, 'pinEnd')).toBe(true)
  })

  it('a rubber band doesn’t fit the pin hole', () => {
    expect(PEDAL_REPAIR.evaluate({ ...good, pin: 'rubberBand' })).toMatchObject({ pass: false, code: 'no-fit' })
  })

  it('a pen refill fits but bends as soon as it turns', () => {
    const r = PEDAL_REPAIR.evaluate({ ...good, pin: 'penRefill' })
    expect(r.code).toBe('wobble')
    expect(r.stages.map((s) => s.ok)).toEqual([true, false])
  })

  it('without a lock, or with a stretchy one, the pedal slides off', () => {
    expect(PEDAL_REPAIR.evaluate({ link: 'steelWire', pin: 'bolt' })).toMatchObject({ code: 'slides', returnJoints: [] })
    expect(PEDAL_REPAIR.evaluate({ ...good, lock: 'rubberBand' })).toMatchObject({ code: 'slides', returnJoints: ['lock'] })
  })

  it('without a metal link the chain still hangs loose', () => {
    expect(PEDAL_REPAIR.evaluate({ pin: 'bolt', lock: 'wire' }).code).toBe('chain-off')
    expect(PEDAL_REPAIR.evaluate({ ...good, link: 'rubberBand' })).toMatchObject({ code: 'chain-off', returnJoints: ['link'] })
  })

  it('swapping the wires puts the weak one on the chain: it snaps under load', () => {
    const r = PEDAL_REPAIR.evaluate({ link: 'wire', pin: 'bolt', lock: 'steelWire' })
    expect(r).toMatchObject({ pass: false, code: 'link-snap', returnJoints: ['link'] })
    expect(r.stages.map((s) => s.ok)).toEqual([true, true, true, false])
  })

  it('a wooden stick pin snaps under load and takes the lock with it', () => {
    expect(PEDAL_REPAIR.evaluate({ ...good, pin: 'woodenStick' })).toMatchObject({ code: 'snap', returnJoints: ['pin', 'lock'] })
  })

  it('steel wire on the chain, bolt as the pin, copper wire as the lock passes', () => {
    const r = PEDAL_REPAIR.evaluate(good)
    expect(r.pass).toBe(true)
    expect(r.stages.map((s) => s.label)).toEqual(['Pedal fits', 'Pedal stays on', 'Chain drives the wheel', 'Under load'])
  })
})

describe('difficulty curve', () => {
  const days = [1, 2, 3, 4, 5, 6].map((d) => dayDifficulty(getDayScript(d)!))

  it('every day is harder than the one before', () => {
    for (let i = 1; i < days.length; i++) {
      expect(days[i]!.total).toBeGreaterThan(days[i - 1]!.total)
      expect(days[i]!.hardest).toBeGreaterThanOrEqual(days[i - 1]!.hardest)
    }
  })

  it('the pedal is the hardest job of the first three days', () => {
    expect(jobDifficulty(DAY_THREE.jobs[1]!)).toBe(Math.max(...days.slice(0, 3).map((d) => d.hardest)))
  })
})

describe('Day 3 script', () => {
  it('is registered with two jobs and Ayesha in the evening', () => {
    expect(getDayScript(3)).toBe(DAY_THREE)
    expect(getDayDefinition(3)?.label).toBe('DAY 3')
    expect(DAY_THREE.jobs.map((j) => j.id)).toEqual(['cooler', 'pedal'])
    expect(DAY_THREE.evening.visitor).toBe('ayesha')
    expect(DAY_THREE.finale).toBeUndefined()
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

  it('leads on to Day 4', () => {
    expect(getDayScript(4)).toBeDefined()
    expect(getDayDefinition(4)).toBeDefined()
  })
})
