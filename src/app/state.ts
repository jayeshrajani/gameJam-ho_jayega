import { create } from 'zustand'
import { audio } from '../audio/AudioManager'
import type { CameraPose } from './cameraPose'
import { type NameValidation, validatePlayerName } from './playerName'
import {
  createNewSave,
  type DayProgress,
  emptyProgress,
  GameStorage,
  getBrowserStorage,
  type LoadedSave,
  type PlayMode,
  type SaveData,
  type Settings,
  type StorageMode,
} from './storage'
import { DAY_CARD_MS, timelineFor } from './transition'
import { DAY_DEFINITIONS, fixedModeOf, getDayDefinition } from '../days/dayDefinitions'

export type Screen = 'TITLE' | 'NAME_ENTRY' | 'ENTERING_SHOP' | 'SHOP'
export type Overlay = 'settings' | 'credits' | 'confirm-new' | 'replay' | null
export type RenderMode = 'loading' | '3d' | 'fallback'
export type TimeOfDay = 'morning' | 'evening'

/** A finished day being played again for fun. Lives in memory only. */
export interface Replay {
  day: number
  progress: DayProgress
}

export interface SaveProblem {
  kind: 'invalid' | 'unsupported'
  detail: string
}

interface GameState {
  screen: Screen
  overlay: Overlay
  save: SaveData | null
  saveProblem: SaveProblem | null
  storageMode: StorageMode
  settings: Settings
  systemReducedMotion: boolean
  renderMode: RenderMode
  fallbackReason: string | null
  /** performance.now() when the shop-opening sequence started. */
  enterStartedAt: number
  enterReduced: boolean
  showDayCard: boolean
  /** Bumped whenever the view should fade in from dark (e.g. returning to the title). */
  returnFadeKey: number
  /** Day content can steer the workshop camera; null means the default counter view. */
  shopCamera: CameraPose | null
  timeOfDay: TimeOfDay
  /** The chai vendor has walked over to our counter. */
  vendorAway: boolean
  replay: Replay | null

  openShopPressed(): void
  confirmNewShop(): void
  backFromNameEntry(): void
  submitName(raw: string): NameValidation
  continueShop(): void
  /** Plays a finished day again without changing the saved shop. */
  replayDay(day: number): void
  leaveShop(): void
  openOverlay(overlay: Exclude<Overlay, null>): void
  closeOverlay(): void
  setSoundEnabled(enabled: boolean): void
  setReducedMotion(value: boolean | null): void
  setSystemReducedMotion(value: boolean): void
  setRenderMode(mode: RenderMode, reason?: string): void
  setShopCamera(pose: CameraPose | null): void
  setStreetMood(mood: { timeOfDay?: TimeOfDay; vendorAway?: boolean }): void
  recordRepair(jobId: string, money: number, reputation: number, rating?: number): void
  recordFailedTest(): void
  finishDay(): void
  setPlayMode(mode: PlayMode): void
  /** Shuts the shop for the night; moves to the next day if it has been built. */
  closeDay(): void
}

const storage = new GameStorage(getBrowserStorage())

function problemFrom(loaded: LoadedSave): SaveProblem | null {
  if (loaded.kind === 'invalid') return { kind: 'invalid', detail: loaded.reason }
  if (loaded.kind === 'unsupported') {
    return { kind: 'unsupported', detail: `It was made by a newer version of the game (save v${loaded.version}).` }
  }
  return null
}

const initialLoad = storage.loadSave()
const initialSettings = storage.loadSettings()
const systemPrefersReduced =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

audio.setEnabled(initialSettings.soundEnabled)

let timers: number[] = []
function later(ms: number, fn: () => void): void {
  const id = window.setTimeout(() => {
    timers = timers.filter((t) => t !== id)
    fn()
  }, ms)
  timers.push(id)
}

export function clearGameTimers(): void {
  for (const id of timers) window.clearTimeout(id)
  timers = []
}

export function selectReducedMotion(state: Pick<GameState, 'settings' | 'systemReducedMotion'>): boolean {
  return state.settings.reducedMotion ?? state.systemReducedMotion
}

/** The day being played: a replay if one is running, otherwise the saved day. */
export function selectActiveDay(state: Pick<GameState, 'save' | 'replay'>): number | null {
  return state.replay?.day ?? state.save?.currentDay ?? null
}

/** Progress for the day being played (in-memory during a replay). */
export function selectProgress(state: Pick<GameState, 'save' | 'replay'>): DayProgress | null {
  return state.replay?.progress ?? state.save?.progress ?? null
}

/** Days the player has finished and can replay. */
export function completedDays(save: SaveData | null): number[] {
  if (!save) return []
  return DAY_DEFINITIONS.map((d) => d.day).filter(
    (day) => day < save.currentDay || (day === save.currentDay && save.progress.finished),
  )
}

export const useGame = create<GameState>()((set, get) => {
  function beginEntering(): void {
    const state = get()
    if (state.screen === 'ENTERING_SHOP' || state.screen === 'SHOP' || !state.save) return
    const reduced = selectReducedMotion(state)
    set({
      screen: 'ENTERING_SHOP',
      overlay: null,
      enterStartedAt: performance.now(),
      enterReduced: reduced,
      showDayCard: false,
    })
    if (!reduced) audio.play('shutter')
    const timeline = timelineFor(reduced)
    later(timeline.duration * 1000, () => {
      if (get().screen !== 'ENTERING_SHOP') return
      set({ screen: 'SHOP', showDayCard: true })
      later(DAY_CARD_MS, () => set({ showDayCard: false }))
    })
  }

  function persistSettings(settings: Settings): void {
    storage.writeSettings(settings)
    set({ settings, storageMode: storage.mode })
  }

  function updateSave(change: (save: SaveData) => SaveData): void {
    const current = get().save
    if (!current) return
    const save = { ...change(current), updatedAt: new Date().toISOString() }
    storage.writeSave(save)
    set({ save, storageMode: storage.mode })
  }

  /** Day progress goes to the replay while one runs, otherwise into the save. */
  function updateProgress(change: (progress: DayProgress) => DayProgress, onSave?: (save: SaveData) => SaveData): void {
    const replay = get().replay
    if (replay) {
      set({ replay: { ...replay, progress: change(replay.progress) } })
      return
    }
    updateSave((save) => {
      const next = { ...save, progress: change(save.progress) }
      return onSave ? onSave(next) : next
    })
  }

  return {
    screen: 'TITLE',
    overlay: null,
    save: initialLoad.kind === 'ok' ? initialLoad.save : null,
    saveProblem: problemFrom(initialLoad),
    storageMode: storage.mode,
    settings: initialSettings,
    systemReducedMotion: systemPrefersReduced,
    renderMode: 'loading',
    fallbackReason: null,
    enterStartedAt: 0,
    enterReduced: false,
    showDayCard: false,
    returnFadeKey: 0,
    shopCamera: null,
    timeOfDay: 'morning',
    vendorAway: false,
    replay: null,

    openShopPressed() {
      const { screen, save, saveProblem } = get()
      if (screen !== 'TITLE') return
      audio.play('click')
      // Anything already stored — valid or not — must be replaced deliberately.
      if (save || saveProblem) set({ overlay: 'confirm-new' })
      else set({ screen: 'NAME_ENTRY', overlay: null })
    },

    confirmNewShop() {
      if (get().screen !== 'TITLE') return
      audio.play('click')
      set({ screen: 'NAME_ENTRY', overlay: null })
    },

    backFromNameEntry() {
      if (get().screen !== 'NAME_ENTRY') return
      audio.play('click')
      set({ screen: 'TITLE' })
    },

    submitName(raw) {
      const result = validatePlayerName(raw)
      if (!result.ok || get().screen !== 'NAME_ENTRY') return result
      const save = createNewSave(result.name)
      storage.writeSave(save)
      audio.play('stamp')
      set({ save, saveProblem: null, storageMode: storage.mode })
      beginEntering()
      return result
    },

    continueShop() {
      if (get().screen !== 'TITLE' || !get().save) return
      audio.play('click')
      set({ replay: null })
      beginEntering()
    },

    replayDay(day) {
      if (get().screen !== 'TITLE' || !completedDays(get().save).includes(day)) return
      audio.play('click')
      set({ replay: { day, progress: emptyProgress() }, overlay: null })
      beginEntering()
    },

    leaveShop() {
      if (get().screen !== 'SHOP') return
      audio.play('click')
      clearGameTimers()
      set((s) => ({
        screen: 'TITLE',
        overlay: null,
        showDayCard: false,
        returnFadeKey: s.returnFadeKey + 1,
        shopCamera: null,
        timeOfDay: 'morning',
        vendorAway: false,
        replay: null,
      }))
    },

    openOverlay(overlay) {
      if (get().screen === 'ENTERING_SHOP') return
      audio.play('click')
      set({ overlay })
    },

    closeOverlay() {
      set({ overlay: null })
    },

    setSoundEnabled(enabled) {
      audio.setEnabled(enabled)
      persistSettings({ ...get().settings, soundEnabled: enabled })
      if (enabled) audio.play('click')
    },

    setReducedMotion(value) {
      persistSettings({ ...get().settings, reducedMotion: value })
    },

    setSystemReducedMotion(value) {
      set({ systemReducedMotion: value })
    },

    setRenderMode(mode, reason) {
      set({ renderMode: mode, fallbackReason: reason ?? null })
    },

    setShopCamera(pose) {
      set({ shopCamera: pose })
    },

    setStreetMood(mood) {
      set(mood)
    },

    recordRepair(jobId, money, reputation, rating) {
      if (selectProgress(get())?.completedJobs.includes(jobId)) return
      updateProgress(
        (p) => ({
          ...p,
          completedJobs: [...p.completedJobs, jobId],
          earned: p.earned + money,
          reputationGained: p.reputationGained + reputation,
          ...(rating ? { ratings: { ...p.ratings, [jobId]: rating } } : {}),
        }),
        (save) => ({ ...save, money: save.money + money, reputation: save.reputation + reputation }),
      )
    },

    recordFailedTest() {
      updateProgress((p) => ({ ...p, failedTests: p.failedTests + 1 }))
    },

    finishDay() {
      updateProgress((p) => ({ ...p, finished: true }))
    },

    setPlayMode(mode) {
      const fixed = fixedModeOf(selectActiveDay(get()))
      if (fixed && mode !== fixed) return
      updateProgress((p) => ({ ...p, mode }))
    },

    closeDay() {
      const save = get().save
      if (!get().replay && save?.progress.finished && getDayDefinition(save.currentDay + 1)) {
        updateSave((s) => ({ ...s, currentDay: s.currentDay + 1, progress: emptyProgress() }))
      }
      get().leaveShop()
    },
  }
})
