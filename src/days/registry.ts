import { DAY_ONE } from './day1/script'
import { DAY_TWO } from './day2/script'
import type { DayScript } from './types'

const DAYS: Readonly<Record<number, DayScript>> = { 1: DAY_ONE, 2: DAY_TWO }

export function getDayScript(day: number): DayScript | undefined {
  return DAYS[day]
}
