import { ITEMS } from './items'
import type { ItemDef, ItemId, Placements, Rating, TestOutcome } from './types'

/** One joint of a graded repair: which parts pass (and how well), and what failure looks like. */
export interface GradedCheck {
  joint: string
  stage: string
  code: string
  grades: Partial<Record<ItemId, Rating>>
  /** Why this joint fails, given what is in it (undefined = empty). */
  fail(item: ItemDef | undefined): string
  hint: string
}

/**
 * Evaluates joints in order. Every failing joint goes back to the bench; the first one explains why.
 * If everything passes, the Jugaad Rating is the rounded average of the joint grades.
 */
export function evaluateGraded(
  p: Placements,
  checks: readonly GradedCheck[],
  pass: { code: string; message(rating: Rating): string },
  title = 'IT WORKS!',
): TestOutcome {
  const results = checks.map((c) => {
    const id = p[c.joint]
    const grade = id ? c.grades[id] : undefined
    return { c, item: id ? ITEMS[id] : undefined, grade }
  })
  const failing = results.filter((r) => !r.grade)
  const stages = results.map((r) => ({ label: r.c.stage, ok: r.grade !== undefined }))
  const first = failing[0]
  if (first) {
    return {
      pass: false,
      code: first.c.code,
      title: failing.length > 1 ? `${failing.length} THINGS WRONG` : 'NOT YET',
      message: first.c.fail(first.item) + (failing.length > 1 ? ` (And ${failing.length - 1} more to sort out.)` : ''),
      stages,
      returnJoints: failing.filter((r) => r.item).map((r) => r.c.joint),
      hint: first.c.hint,
    }
  }
  const avg = results.reduce((sum, r) => sum + (r.grade ?? 0), 0) / results.length
  const rating = Math.min(3, Math.max(1, Math.round(avg))) as Rating
  return { pass: true, code: pass.code, title, message: pass.message(rating), stages, returnJoints: [], rating }
}
