import { useEffect, useRef } from 'react'
import { completedDays, useGame } from '../app/state'
import { dayLabel } from '../days/dayDefinitions'

export function TitleScreen({ autoFocus }: { autoFocus: boolean }) {
  const save = useGame((s) => s.save)
  const problem = useGame((s) => s.saveProblem)
  const openShopPressed = useGame((s) => s.openShopPressed)
  const continueShop = useGame((s) => s.continueShop)
  const openOverlay = useGame((s) => s.openOverlay)
  const canReplay = useGame((s) => completedDays(s.save).length > 0)
  const primary = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (autoFocus) primary.current?.focus()
  }, [autoFocus])

  return (
    <section className="title" aria-labelledby="title-heading">
      <div className="title__block">
        <p className="title__kicker">
          <span lang="hi">पुराना भोपाल</span> · Old Bhopal
        </p>
        <h1 id="title-heading" className="title__logo">
          <span className="title__en">HO JAYEGA</span>
          <span className="title__hi" lang="hi">
            हो जाएगा
          </span>
        </h1>
        <p className="title__tagline">“Sahi part nahi hai? Koi baat nahi.”</p>
        <p className="title__desc">A little repair shop. A lot of jugaad.</p>
        <p className="sr-only">
          Behind the menu, a busy morning lane in a fictional corner of Old Bhopal: a tea stall, a tailor, and your
          repair shop with its shutter still down.
        </p>

        {save && (
          <p className="title__welcome">
            Welcome back, <bdi className="title__name">{save.playerName}</bdi>.
          </p>
        )}
        {problem && (
          <p className="notice notice--warn" role="status">
            We found a saved shop we can’t open. {problem.detail} It has not been deleted — it will only be replaced if
            you start a new shop.
          </p>
        )}

        <div className="menu">
          {save ? (
            <>
              <button ref={primary} type="button" className="btn btn--primary" onClick={continueShop}>
                CONTINUE · {dayLabel(save.currentDay)}
              </button>
              {canReplay && (
                <button type="button" className="btn btn--secondary" onClick={() => openOverlay('replay')}>
                  PLAY A DAY AGAIN
                </button>
              )}
              <button type="button" className="btn btn--secondary" onClick={openShopPressed}>
                NEW SHOP
              </button>
            </>
          ) : (
            <button ref={primary} type="button" className="btn btn--primary" onClick={openShopPressed}>
              {problem ? 'NEW SHOP' : 'OPEN SHOP'}
            </button>
          )}
          <div className="menu__row">
            <button type="button" className="btn btn--plain" onClick={() => openOverlay('settings')}>
              SETTINGS
            </button>
            <button type="button" className="btn btn--plain" onClick={() => openOverlay('credits')}>
              CREDITS
            </button>
          </div>
        </div>
      </div>
      <p className="title__build">Milestone 0 · prototype build</p>
    </section>
  )
}
