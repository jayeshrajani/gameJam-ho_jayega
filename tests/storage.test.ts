import { describe, expect, it } from 'vitest'
import {
  createNewSave,
  DEFAULT_SETTINGS,
  GameStorage,
  type KeyValueStore,
  parseSave,
  parseSettings,
  SAVE_KEY,
  SETTINGS_KEY,
} from '../src/app/storage'

class MapStore implements KeyValueStore {
  readonly data = new Map<string, string>()
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
}

class ThrowingStore implements KeyValueStore {
  getItem(): string | null {
    throw new DOMException('blocked', 'SecurityError')
  }
  setItem(): void {
    throw new DOMException('blocked', 'SecurityError')
  }
  removeItem(): void {
    throw new DOMException('blocked', 'SecurityError')
  }
}

class QuotaStore extends MapStore {
  override setItem(): void {
    throw new DOMException('full', 'QuotaExceededError')
  }
}

const validSave = createNewSave('Jayesh', new Date('2026-09-24T08:00:00.000Z'))

describe('createNewSave', () => {
  it('uses the milestone defaults', () => {
    expect(validSave).toEqual({
      version: 2,
      playerName: 'Jayesh',
      currentDay: 1,
      money: 0,
      reputation: 0,
      createdAt: '2026-09-24T08:00:00.000Z',
      updatedAt: '2026-09-24T08:00:00.000Z',
      progress: { completedJobs: [], failedTests: 0, earned: 0, reputationGained: 0, finished: false, mode: null },
    })
  })
})

describe('parseSave', () => {
  it('accepts a valid save', () => {
    expect(parseSave(JSON.stringify(validSave))).toEqual({ kind: 'ok', save: validSave })
  })

  it('rejects malformed JSON', () => {
    expect(parseSave('{"version":1,').kind).toBe('invalid')
    expect(parseSave('').kind).toBe('invalid')
  })

  it('rejects non-object JSON', () => {
    expect(parseSave('null').kind).toBe('invalid')
    expect(parseSave('[1,2]').kind).toBe('invalid')
    expect(parseSave('"hello"').kind).toBe('invalid')
  })

  it('reports unsupported versions instead of treating them as invalid', () => {
    expect(parseSave(JSON.stringify({ ...validSave, version: 3 }))).toEqual({ kind: 'unsupported', version: 3 })
  })

  it('migrates a v1 save (no progress) to v2 with an untouched Day 1', () => {
    const { progress: _p, ...v1 } = { ...validSave, version: 1, money: 40 }
    const result = parseSave(JSON.stringify(v1))
    expect(result).toEqual({ kind: 'ok', save: { ...validSave, money: 40 } })
  })

  it('keeps valid progress and de-duplicates completed jobs', () => {
    const progress = { completedJobs: ['fan', 'fan'], failedTests: 2, earned: 120, reputationGained: 5, finished: false, mode: 'self' }
    const result = parseSave(JSON.stringify({ ...validSave, progress }))
    expect(result.kind === 'ok' && result.save.progress).toEqual({ ...progress, completedJobs: ['fan'] })
  })

  it('treats a missing or unknown play mode as “not chosen yet”', () => {
    const base = { completedJobs: [], failedTests: 0, earned: 0, reputationGained: 0, finished: false }
    for (const progress of [base, { ...base, mode: 'expert' }]) {
      const result = parseSave(JSON.stringify({ ...validSave, progress }))
      expect(result.kind === 'ok' && result.save.progress.mode).toBeNull()
    }
  })

  it.each([
    null,
    { completedJobs: 'fan', failedTests: 0, earned: 0, reputationGained: 0, finished: false },
    { completedJobs: [3], failedTests: 0, earned: 0, reputationGained: 0, finished: false },
    { completedJobs: [], failedTests: -1, earned: 0, reputationGained: 0, finished: false },
    { completedJobs: [], failedTests: 0, earned: 0, reputationGained: 0, finished: 'yes' },
  ])('rejects invalid v2 progress %j', (progress) => {
    expect(parseSave(JSON.stringify({ ...validSave, progress })).kind).toBe('invalid')
  })

  it.each([
    ['playerName', 42],
    ['playerName', '   '],
    ['currentDay', 0],
    ['currentDay', 1.5],
    ['currentDay', '1'],
    ['money', Number.NaN],
    ['money', '0'],
    ['reputation', null],
    ['createdAt', 'not a date'],
    ['updatedAt', 12],
  ])('rejects invalid %s = %s', (field, value) => {
    expect(parseSave(JSON.stringify({ ...validSave, [field]: value })).kind).toBe('invalid')
  })

  it('rejects a missing version', () => {
    const { version: _omit, ...rest } = validSave
    expect(parseSave(JSON.stringify(rest)).kind).toBe('invalid')
  })

  it('drops unknown fields', () => {
    const result = parseSave(JSON.stringify({ ...validSave, admin: true }))
    expect(result.kind === 'ok' && 'admin' in result.save).toBe(false)
  })
})

describe('parseSettings', () => {
  it('falls back to defaults: muted, follow OS motion preference', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings('garbage')).toEqual(DEFAULT_SETTINGS)
    expect(DEFAULT_SETTINGS.soundEnabled).toBe(false)
    expect(DEFAULT_SETTINGS.reducedMotion).toBeNull()
  })

  it('keeps valid fields and repairs broken ones', () => {
    expect(parseSettings(JSON.stringify({ version: 1, soundEnabled: true, reducedMotion: 'yes' }))).toEqual({
      version: 1,
      soundEnabled: true,
      reducedMotion: null,
    })
  })
})

describe('GameStorage', () => {
  it('round-trips saves and settings through the backend', () => {
    const backend = new MapStore()
    const storage = new GameStorage(backend)
    expect(storage.loadSave()).toEqual({ kind: 'none' })
    expect(storage.writeSave(validSave)).toBe(true)
    expect(storage.writeSettings({ ...DEFAULT_SETTINGS, soundEnabled: true })).toBe(true)

    const reopened = new GameStorage(backend)
    expect(reopened.loadSave()).toEqual({ kind: 'ok', save: validSave })
    expect(reopened.loadSettings().soundEnabled).toBe(true)
    expect(reopened.mode).toBe('persistent')
  })

  it('does not destroy an unreadable save when loading it', () => {
    const backend = new MapStore()
    backend.setItem(SAVE_KEY, '{broken')
    const storage = new GameStorage(backend)
    expect(storage.loadSave().kind).toBe('invalid')
    expect(backend.getItem(SAVE_KEY)).toBe('{broken')
  })

  it('does not destroy a newer-version save when loading it', () => {
    const backend = new MapStore()
    const future = JSON.stringify({ ...validSave, version: 9 })
    backend.setItem(SAVE_KEY, future)
    expect(new GameStorage(backend).loadSave()).toEqual({ kind: 'unsupported', version: 9 })
    expect(backend.getItem(SAVE_KEY)).toBe(future)
  })

  it('works in memory when no backend is available', () => {
    const storage = new GameStorage(null)
    expect(storage.mode).toBe('memory')
    expect(storage.writeSave(validSave)).toBe(false)
    expect(storage.loadSave()).toEqual({ kind: 'ok', save: validSave })
  })

  it('switches to memory mode when reads throw', () => {
    const storage = new GameStorage(new ThrowingStore())
    expect(() => storage.loadSave()).not.toThrow()
    expect(storage.loadSave()).toEqual({ kind: 'none' })
    expect(storage.mode).toBe('memory')
    expect(storage.loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('switches to memory mode when writes fail (quota) and keeps the data for the session', () => {
    const storage = new GameStorage(new QuotaStore())
    expect(storage.writeSave(validSave)).toBe(false)
    expect(storage.mode).toBe('memory')
    expect(storage.loadSave()).toEqual({ kind: 'ok', save: validSave })
  })

  it('uses namespaced keys', () => {
    expect(SAVE_KEY).toBe('ho-jayega:save:v1')
    expect(SETTINGS_KEY).toBe('ho-jayega:settings:v1')
  })
})
