import { validatePlayerName } from './playerName'

export const SAVE_KEY = 'ho-jayega:save:v1'
export const SETTINGS_KEY = 'ho-jayega:settings:v1'
export const SAVE_VERSION = 2
export const SETTINGS_VERSION = 1

export type PlayMode = 'tutorial' | 'self'

/** Progress within the current day. Mid-repair experiments are never saved. */
export interface DayProgress {
  completedJobs: string[]
  failedTests: number
  earned: number
  reputationGained: number
  finished: boolean
  /** Chosen at the start of each day; null means the player hasn't picked yet. */
  mode: PlayMode | null
  /** Jugaad Rating (1–3) per finished job, from Day 4 on. */
  ratings?: Record<string, number>
}

export interface SaveData {
  version: typeof SAVE_VERSION
  playerName: string
  currentDay: number
  money: number
  reputation: number
  createdAt: string
  updatedAt: string
  progress: DayProgress
}

export function emptyProgress(): DayProgress {
  return { completedJobs: [], failedTests: 0, earned: 0, reputationGained: 0, finished: false, mode: null }
}

export interface Settings {
  version: typeof SETTINGS_VERSION
  soundEnabled: boolean
  /** null = follow the operating system's reduced-motion preference. */
  reducedMotion: boolean | null
}

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  version: SETTINGS_VERSION,
  soundEnabled: false,
  reducedMotion: null,
})

export type SaveParseResult =
  | { kind: 'ok'; save: SaveData }
  | { kind: 'invalid'; reason: string }
  | { kind: 'unsupported'; version: number }

export type LoadedSave = { kind: 'none' } | SaveParseResult

/** Minimal subset of the Web Storage API so tests can inject failing backends. */
export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export type StorageMode = 'persistent' | 'memory'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 64 && !Number.isNaN(Date.parse(value))
}

function isSafeInt(value: unknown, min: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min
}

function parseProgress(value: unknown): DayProgress | null {
  if (!isRecord(value)) return null
  const { completedJobs, failedTests, earned, reputationGained, finished } = value
  if (
    !Array.isArray(completedJobs) ||
    completedJobs.length > 50 ||
    !completedJobs.every((j): j is string => typeof j === 'string' && j.length > 0 && j.length <= 40)
  ) {
    return null
  }
  if (!isSafeInt(failedTests, 0) || !isSafeInt(earned, Number.MIN_SAFE_INTEGER)) return null
  if (!isSafeInt(reputationGained, Number.MIN_SAFE_INTEGER) || typeof finished !== 'boolean') return null
  // Older v2 saves have no mode; that simply means "ask again".
  const mode = value.mode === 'tutorial' || value.mode === 'self' ? value.mode : null
  const progress: DayProgress = { completedJobs: [...new Set(completedJobs)], failedTests, earned, reputationGained, finished, mode }
  if (isRecord(value.ratings)) {
    const ratings = Object.entries(value.ratings).filter(
      (e): e is [string, number] => e[0].length <= 40 && (e[1] === 1 || e[1] === 2 || e[1] === 3),
    )
    if (ratings.length > 0 && ratings.length <= 50) progress.ratings = Object.fromEntries(ratings)
  }
  return progress
}

export function parseSave(raw: string): SaveParseResult {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { kind: 'invalid', reason: 'The save is not valid JSON.' }
  }
  if (!isRecord(data)) return { kind: 'invalid', reason: 'The save is not an object.' }

  const { version } = data
  if (typeof version !== 'number' || !Number.isInteger(version)) {
    return { kind: 'invalid', reason: 'The save has no version number.' }
  }
  if (version !== 1 && version !== SAVE_VERSION) return { kind: 'unsupported', version }

  if (typeof data.playerName !== 'string') {
    return { kind: 'invalid', reason: 'The mechanic name is missing.' }
  }
  const name = validatePlayerName(data.playerName)
  if (!name.ok) return { kind: 'invalid', reason: 'The mechanic name is not valid.' }
  if (!isSafeInt(data.currentDay, 1)) return { kind: 'invalid', reason: 'The current day is not valid.' }
  if (!isSafeInt(data.money, Number.MIN_SAFE_INTEGER)) return { kind: 'invalid', reason: 'Money is not valid.' }
  if (!isSafeInt(data.reputation, Number.MIN_SAFE_INTEGER)) {
    return { kind: 'invalid', reason: 'Reputation is not valid.' }
  }
  if (!isIsoDate(data.createdAt) || !isIsoDate(data.updatedAt)) {
    return { kind: 'invalid', reason: 'The save dates are not valid.' }
  }

  // v1 saves predate day progress; they migrate to an untouched Day 1.
  const progress = version === 1 ? emptyProgress() : parseProgress(data.progress)
  if (!progress) return { kind: 'invalid', reason: 'The day progress is not valid.' }

  return {
    kind: 'ok',
    save: {
      version: SAVE_VERSION,
      playerName: name.name,
      currentDay: data.currentDay,
      money: data.money,
      reputation: data.reputation,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      progress,
    },
  }
}

/** Settings are low-stakes: unknown or broken fields fall back to defaults individually. */
export function parseSettings(raw: string | null): Settings {
  if (raw === null) return { ...DEFAULT_SETTINGS }
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
  if (!isRecord(data) || data.version !== SETTINGS_VERSION) return { ...DEFAULT_SETTINGS }
  return {
    version: SETTINGS_VERSION,
    soundEnabled: typeof data.soundEnabled === 'boolean' ? data.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
    reducedMotion:
      typeof data.reducedMotion === 'boolean' || data.reducedMotion === null
        ? data.reducedMotion
        : DEFAULT_SETTINGS.reducedMotion,
  }
}

export function createNewSave(playerName: string, now: Date = new Date()): SaveData {
  const iso = now.toISOString()
  return {
    version: SAVE_VERSION,
    playerName,
    currentDay: 1,
    money: 0,
    reputation: 0,
    createdAt: iso,
    updatedAt: iso,
    progress: emptyProgress(),
  }
}

/**
 * Wraps localStorage with an in-memory fallback. Once any read or write fails, the
 * repository switches to memory mode for the rest of the session and says so.
 */
export class GameStorage {
  private readonly memory = new Map<string, string>()
  private readonly backend: KeyValueStore | null
  private currentMode: StorageMode

  constructor(backend: KeyValueStore | null) {
    this.backend = backend
    this.currentMode = backend ? 'persistent' : 'memory'
  }

  get mode(): StorageMode {
    return this.currentMode
  }

  private read(key: string): string | null {
    if (this.backend && this.currentMode === 'persistent') {
      try {
        return this.backend.getItem(key)
      } catch {
        this.currentMode = 'memory'
      }
    }
    return this.memory.get(key) ?? null
  }

  private write(key: string, value: string): boolean {
    this.memory.set(key, value)
    if (this.backend && this.currentMode === 'persistent') {
      try {
        this.backend.setItem(key, value)
        return true
      } catch {
        this.currentMode = 'memory'
      }
    }
    return false
  }

  loadSave(): LoadedSave {
    const raw = this.read(SAVE_KEY)
    if (raw === null) return { kind: 'none' }
    return parseSave(raw)
  }

  /** Returns true when the save reached persistent storage. Never throws. */
  writeSave(save: SaveData): boolean {
    return this.write(SAVE_KEY, JSON.stringify(save))
  }

  loadSettings(): Settings {
    return parseSettings(this.read(SETTINGS_KEY))
  }

  writeSettings(settings: Settings): boolean {
    return this.write(SETTINGS_KEY, JSON.stringify(settings))
  }
}

export function getBrowserStorage(): KeyValueStore | null {
  try {
    const storage = window.localStorage
    const probe = 'ho-jayega:probe'
    storage.setItem(probe, '1')
    storage.removeItem(probe)
    return storage
  } catch {
    return null
  }
}
