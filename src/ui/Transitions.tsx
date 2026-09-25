import { useEffect, useRef } from 'react'
import { selectReducedMotion, useGame } from '../app/state'
import { RETURN_FADE_MS, timelineFor } from '../app/transition'
import { getDayDefinition } from '../days/dayDefinitions'

/** Full-screen dark veil driven by the shared opening timeline (Web Animations API). */
export function FadeVeil() {
  const ref = useRef<HTMLDivElement>(null)
  const screen = useGame((s) => s.screen)
  const enterReduced = useGame((s) => s.enterReduced)
  const returnKey = useGame((s) => s.returnFadeKey)
  const reduced = useGame(selectReducedMotion)

  useEffect(() => {
    const el = ref.current
    if (screen !== 'ENTERING_SHOP' || !el || typeof el.animate !== 'function') return
    const tl = timelineFor(enterReduced)
    const d = tl.duration
    const anim = el.animate(
      [
        { opacity: 0, offset: 0 },
        { opacity: 0, offset: tl.fadeIn[0] / d },
        { opacity: 1, offset: tl.fadeIn[1] / d },
        { opacity: 1, offset: Math.min(1, (tl.cut + 0.06) / d) },
        { opacity: 0, offset: 1 },
      ],
      { duration: d * 1000, easing: 'linear' },
    )
    return () => anim.cancel()
  }, [screen, enterReduced])

  useEffect(() => {
    const el = ref.current
    if (returnKey === 0 || !el || typeof el.animate !== 'function') return
    const anim = el.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: reduced ? 150 : RETURN_FADE_MS,
      easing: 'ease-out',
    })
    return () => anim.cancel()
    // Only a new return should trigger the fade.
  }, [returnKey])

  return <div ref={ref} className="fade-veil" aria-hidden="true" />
}

export function DayCard({ day }: { day: number }) {
  const def = getDayDefinition(day)
  return (
    <div className="day-card">
      <div className="day-card__stamp">
        <p className="day-card__label">{def?.label ?? `DAY ${day}`}</p>
        {def && (
          <>
            <p className="day-card__sub">{def.subtitle}</p>
          </>
        )}
      </div>
    </div>
  )
}
