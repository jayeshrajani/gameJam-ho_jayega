import type { PlayMode } from '../app/storage'

export interface DayDefinition {
  day: number
  /** Shown on the opening card, e.g. "DAY 1". */
  label: string
  subtitle: string
  /** The day is always played in this mode: no choice card, no Tutorial switch. */
  fixedMode?: PlayMode
}

// Days are added here once their gameplay exists.
export const DAY_DEFINITIONS: readonly DayDefinition[] = [
  { day: 1, label: 'DAY 1', subtitle: 'First day. Let’s see how it goes.', fixedMode: 'tutorial' },
  { day: 2, label: 'DAY 2', subtitle: 'Word is getting around.' },
  { day: 3, label: 'DAY 3', subtitle: 'Time to think.' },
  { day: 4, label: 'DAY 4', subtitle: 'There’s more than one way.' },
  { day: 5, label: 'DAY 5', subtitle: 'Look closely.' },
  { day: 6, label: 'DAY 6', subtitle: 'Step outside.' },
  { day: 7, label: 'DAY 7', subtitle: 'The wedding night.' },
]

export function getDayDefinition(day: number): DayDefinition | undefined {
  return DAY_DEFINITIONS.find((d) => d.day === day)
}

export function dayLabel(day: number): string {
  return getDayDefinition(day)?.label ?? `DAY ${day}`
}

export function fixedModeOf(day: number | null): PlayMode | undefined {
  return day === null ? undefined : getDayDefinition(day)?.fixedMode
}
