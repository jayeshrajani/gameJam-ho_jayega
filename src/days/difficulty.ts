import type { DayScript, JobScript } from './types'

/**
 * A rough difficulty score, used to keep the curve rising from day to day
 * (see storyline/repair_logic.md, "Difficulty curve").
 */
export function jobDifficulty(job: JobScript): number {
  const needed = new Set(job.walkthrough.map((w) => w.item))
  const distractors = job.repair.items.filter((i) => !needed.has(i)).length
  return 3 * job.repair.joints.length + 2 * distractors + job.inspect.length + (job.refine ? 2 : 0)
}

export function dayDifficulty(day: DayScript): { total: number; hardest: number } {
  const scores = day.jobs.map(jobDifficulty)
  return { total: scores.reduce((a, b) => a + b, 0), hardest: Math.max(...scores) }
}
