export interface DayDefinition {
  day: number
  /** Shown on the opening card, e.g. "DAY 1". */
  label: string
  subtitle: string
}

// Days are added here once their gameplay exists.
export const DAY_DEFINITIONS: readonly DayDefinition[] = [
  { day: 1, label: 'DAY 1', subtitle: 'First day. Let’s see how it goes.' },
  { day: 2, label: 'DAY 2', subtitle: 'Word is getting around.' },
]

export function getDayDefinition(day: number): DayDefinition | undefined {
  return DAY_DEFINITIONS.find((d) => d.day === day)
}

export function dayLabel(day: number): string {
  return getDayDefinition(day)?.label ?? `DAY ${day}`
}
