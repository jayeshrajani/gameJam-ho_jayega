import { describe, expect, it } from 'vitest'
import { completedDays, selectActiveDay, selectProgress, useGame } from '../src/app/state'
import { createNewSave, emptyProgress } from '../src/app/storage'
import { fixedModeOf } from '../src/days/dayDefinitions'

const base = createNewSave('Jayesh', new Date('2026-09-24T08:00:00.000Z'))

describe('replayable days', () => {
  it('lists nothing before the first day is finished', () => {
    expect(completedDays(null)).toEqual([])
    expect(completedDays(base)).toEqual([])
  })

  it('lists the current day once it is finished', () => {
    expect(completedDays({ ...base, progress: { ...base.progress, finished: true } })).toEqual([1])
  })

  it('lists every earlier day, plus the current one if finished', () => {
    expect(completedDays({ ...base, currentDay: 2 })).toEqual([1])
    expect(completedDays({ ...base, currentDay: 2, progress: { ...base.progress, finished: true } })).toEqual([1, 2])
  })
})

describe('mandatory tutorial on Day 1', () => {
  it('Day 1 has a fixed mode; Day 2 lets the player choose', () => {
    expect(fixedModeOf(1)).toBe('tutorial')
    expect(fixedModeOf(2)).toBeUndefined()
  })

  it('refuses to switch Day 1 to play-it-yourself', () => {
    useGame.setState({ save: base, replay: { day: 1, progress: emptyProgress() } })
    useGame.getState().setPlayMode('self')
    expect(selectProgress(useGame.getState())?.mode).toBeNull()
    useGame.getState().setPlayMode('tutorial')
    expect(selectProgress(useGame.getState())?.mode).toBe('tutorial')
  })

  it('still allows either mode on Day 2', () => {
    useGame.setState({ save: { ...base, currentDay: 2 }, replay: { day: 2, progress: emptyProgress() } })
    useGame.getState().setPlayMode('self')
    expect(selectProgress(useGame.getState())?.mode).toBe('self')
  })
})

describe('active day during a replay', () => {
  const save = { ...base, currentDay: 2, money: 610 }
  const replay = { day: 1, progress: { ...emptyProgress(), failedTests: 4 } }

  it('uses the replay’s day and in-memory progress, not the save', () => {
    expect(selectActiveDay({ save, replay })).toBe(1)
    expect(selectProgress({ save, replay })?.failedTests).toBe(4)
  })

  it('falls back to the saved day when not replaying', () => {
    expect(selectActiveDay({ save, replay: null })).toBe(2)
    expect(selectProgress({ save, replay: null })).toBe(save.progress)
  })
})
