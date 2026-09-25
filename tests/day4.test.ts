import { describe, expect, it } from 'vitest'
import { parseSave } from '../src/app/storage'
import { FAN_AGAIN_REPAIR, SEWING_REPAIR } from '../src/days/day4/repairs'
import { DAY_FOUR } from '../src/days/day4/script'
import { getDayDefinition } from '../src/days/dayDefinitions'
import { getDayScript } from '../src/days/registry'
import { rewardFor, thanksLines } from '../src/days/runner/store'
import { ITEMS } from '../src/repair/items'

describe('Day 4: Master Ji’s sewing machine', () => {
  it('the best parts everywhere give ★★★', () => {
    const r = SEWING_REPAIR.evaluate({ belt: 'innerTube', clamp: 'bolt', tension: 'spring' })
    expect(r).toMatchObject({ pass: true, rating: 3 })
  })

  it('other working parts pass with a lower rating', () => {
    expect(SEWING_REPAIR.evaluate({ belt: 'clothStrip', clamp: 'safetyPin', tension: 'hairClip' }).rating).toBe(2)
    expect(SEWING_REPAIR.evaluate({ belt: 'tape', clamp: 'safetyPin', tension: 'rubberBand' }).rating).toBe(1)
    expect(SEWING_REPAIR.evaluate({ belt: 'innerTube', clamp: 'tape', tension: 'rubberBand' }).rating).toBe(2)
  })

  it('a rubber band is too short for the belt', () => {
    const r = SEWING_REPAIR.evaluate({ belt: 'rubberBand', clamp: 'bolt', tension: 'spring' })
    expect(r).toMatchObject({ pass: false, code: 'no-drive', returnJoints: ['belt'] })
    expect(r.message).toMatch(/too short/)
  })

  it('every wrong joint goes back, and the message counts the rest', () => {
    const r = SEWING_REPAIR.evaluate({ belt: 'bolt', clamp: 'spring', tension: 'safetyPin' })
    expect(r.returnJoints).toEqual(['belt', 'clamp', 'tension'])
    expect(r.title).toBe('3 THINGS WRONG')
    expect(r.stages.map((s) => s.ok)).toEqual([false, false, false])
  })
})

describe('Day 4: Sharma Uncle’s fan, again', () => {
  it('rubber band + bolt + wire passes, but only ★★', () => {
    expect(FAN_AGAIN_REPAIR.evaluate({ drive: 'rubberBand', neck: 'bolt', guard: 'wire' })).toMatchObject({ pass: true, rating: 2 })
  })

  it('the inner tube belt makes it ★★★', () => {
    expect(FAN_AGAIN_REPAIR.evaluate({ drive: 'innerTube', neck: 'bolt', guard: 'wire' }).rating).toBe(3)
  })

  it('a pen refill can’t hold the head up', () => {
    expect(FAN_AGAIN_REPAIR.evaluate({ drive: 'innerTube', neck: 'penRefill', guard: 'wire' })).toMatchObject({ code: 'droop' })
  })

  it('copper wire as a belt slips', () => {
    expect(FAN_AGAIN_REPAIR.evaluate({ drive: 'wire', neck: 'bolt', guard: 'safetyPin' }).message).toMatch(/slips/)
  })
})

describe('Jugaad Rating rewards and lines', () => {
  const job = DAY_FOUR.jobs[0]!
  it('pays half for ★, three quarters for ★★ and full for ★★★', () => {
    const at = (rating: 1 | 2 | 3) => rewardFor(job, { ...SEWING_REPAIR.evaluate({ belt: 'innerTube', clamp: 'bolt', tension: 'spring' }), rating })
    expect(at(3).money).toBe(job.reward.money)
    expect(at(2).money).toBe(Math.round(job.reward.money * 0.75))
    expect(at(1).money).toBe(Math.round(job.reward.money / 2))
  })

  it('the customer reacts to the rating first', () => {
    const outcome = SEWING_REPAIR.evaluate({ belt: 'tape', clamp: 'safetyPin', tension: 'rubberBand' })
    expect(thanksLines(job, outcome)[0]).toBe(job.ratingLines?.[1])
    expect(thanksLines(job, outcome).length).toBe(job.thanks.length + 1)
  })

  it('saves ratings per job, and ignores junk', () => {
    const now = new Date().toISOString()
    const base = { version: 2, playerName: 'J', currentDay: 4, money: 0, reputation: 0, createdAt: now, updatedAt: now }
    const progress = { completedJobs: ['sewing'], failedTests: 0, earned: 0, reputationGained: 0, finished: false, mode: 'self' }
    const ok = parseSave(JSON.stringify({ ...base, progress: { ...progress, ratings: { sewing: 3, bad: 9 } } }))
    expect(ok.kind === 'ok' && ok.save.progress.ratings).toEqual({ sewing: 3 })
  })
})

describe('Day 4 script', () => {
  it('is registered with two jobs, Rocky in the evening, and ratings on every job', () => {
    expect(getDayScript(4)).toBe(DAY_FOUR)
    expect(getDayDefinition(4)?.label).toBe('DAY 4')
    expect(DAY_FOUR.jobs.map((j) => j.id)).toEqual(['sewing', 'fanAgain'])
    expect(DAY_FOUR.evening.visitor).toBe('rocky')
    for (const job of DAY_FOUR.jobs) {
      expect(job.ratingLines).toBeDefined()
      for (const id of job.repair.items) expect(ITEMS[id]).toBeDefined()
    }
  })

  it('the tutorial walkthrough builds the ★★★ fix', () => {
    for (const job of DAY_FOUR.jobs) {
      const placements = Object.fromEntries(job.walkthrough.map((w) => [w.joint, w.item]))
      expect(job.repair.evaluate(placements)).toMatchObject({ pass: true, rating: 3 })
    }
  })
})
