import { useEffect, useRef } from 'react'
import { selectActiveDay, selectProgress, useGame } from '../app/state'
import { dayLabel, fixedModeOf } from '../days/dayDefinitions'
import { SoundToggle } from './SoundToggle'

const inr = new Intl.NumberFormat('en-IN')

export function ShopHud() {
  const save = useGame((s) => s.save)
  const openOverlay = useGame((s) => s.openOverlay)
  const leaveShop = useGame((s) => s.leaveShop)
  const setPlayMode = useGame((s) => s.setPlayMode)
  const day = useGame(selectActiveDay)
  const progress = useGame(selectProgress)
  const replay = useGame((s) => s.replay !== null)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [])

  if (!save) return null
  return (
    <header className="hud">
      <div className="hud__group">
        <div className="plate plate--teal">
          <span className="plate__label">Mechanic</span>
          <bdi className="plate__value">{save.playerName}</bdi>
        </div>
        <h2 ref={heading} tabIndex={-1} className="plate plate--mustard hud__day">
          {dayLabel(day ?? save.currentDay)}
        </h2>
        {replay && (
          <p className="plate plate--maroon" title="Nothing you do in a replay changes your saved shop.">
            <span className="plate__label">Replay</span>
            <span className="plate__value">Not saved</span>
          </p>
        )}
        {progress && progress.mode !== null && !progress.finished && !fixedModeOf(day) && (
          <label className="plate plate--paper hud__mode">
            <span className="plate__label">Tutorial</span>
            <input
              type="checkbox"
              role="switch"
              className="switch"
              checked={progress.mode === 'tutorial'}
              onChange={(e) => setPlayMode(e.target.checked ? 'tutorial' : 'self')}
            />
          </label>
        )}
      </div>
      <div className="hud__group">
        <dl className="hud__stats">
          <div className="plate plate--paper">
            <dt className="plate__label">Money</dt>
            <dd className="plate__value">₹{inr.format(save.money)}</dd>
          </div>
          <div className="plate plate--paper">
            <dt className="plate__label">Reputation</dt>
            <dd className="plate__value">{inr.format(save.reputation)}</dd>
          </div>
        </dl>
        <div className="hud__actions">
          <SoundToggle />
          <button type="button" className="btn btn--small" onClick={() => openOverlay('settings')}>
            Settings
          </button>
          <button type="button" className="btn btn--small" onClick={leaveShop}>
            Back to title
          </button>
        </div>
      </div>
    </header>
  )
}
