import { useRef } from 'react'
import { completedDays, selectReducedMotion, useGame } from '../app/state'
import { dayLabel, getDayDefinition } from '../days/dayDefinitions'
import { Dialog } from './Dialog'

function Toggle(props: { id: string; label: string; description: string; checked: boolean; onChange(v: boolean): void }) {
  return (
    <div className="setting">
      <div className="setting__text">
        <label htmlFor={props.id} className="setting__label">
          {props.label}
        </label>
        <p id={`${props.id}-desc`} className="setting__desc">
          {props.description}
        </p>
      </div>
      <input
        id={props.id}
        type="checkbox"
        role="switch"
        className="switch"
        checked={props.checked}
        aria-describedby={`${props.id}-desc`}
        onChange={(e) => props.onChange(e.target.checked)}
      />
    </div>
  )
}

export function SettingsDialog() {
  const close = useGame((s) => s.closeOverlay)
  const settings = useGame((s) => s.settings)
  const system = useGame((s) => s.systemReducedMotion)
  const reduced = useGame(selectReducedMotion)
  const memoryOnly = useGame((s) => s.storageMode === 'memory')
  const setSound = useGame((s) => s.setSoundEnabled)
  const setReducedMotion = useGame((s) => s.setReducedMotion)
  const closeBtn = useRef<HTMLButtonElement>(null)

  return (
    <Dialog labelledBy="settings-title" onClose={close} className="dialog--settings" initialFocus={closeBtn}>
      <h2 id="settings-title" className="dialog__title">
        Settings
      </h2>
      <Toggle
        id="setting-sound"
        label="Sound effects"
        description="Small clicks and the shutter rattle, made in your browser. Off until you turn it on."
        checked={settings.soundEnabled}
        onChange={setSound}
      />
      <Toggle
        id="setting-motion"
        label="Reduce motion"
        description="Skips the camera push and freezes street animation."
        checked={reduced}
        onChange={setReducedMotion}
      />
      <p className="setting__source">
        {settings.reducedMotion === null ? (
          <>Following your system setting ({system ? 'reduce motion on' : 'reduce motion off'}).</>
        ) : (
          <>
            Your choice overrides the system setting.{' '}
            <button type="button" className="link-btn" onClick={() => setReducedMotion(null)}>
              Use system setting
            </button>
          </>
        )}
      </p>
      <p className="dialog__fine">
        {memoryOnly
          ? 'Browser storage is unavailable, so settings and progress last only until this page closes.'
          : 'Settings and progress are stored only in this browser.'}
      </p>
      <div className="dialog__actions">
        <button ref={closeBtn} type="button" className="btn btn--small" onClick={close}>
          Done
        </button>
      </div>
    </Dialog>
  )
}

export function CreditsDialog() {
  const close = useGame((s) => s.closeOverlay)
  const closeBtn = useRef<HTMLButtonElement>(null)
  return (
    <Dialog labelledBy="credits-title" onClose={close} className="dialog--credits" initialFocus={closeBtn}>
      <h2 id="credits-title" className="dialog__title">
        Credits
      </h2>
      <p>
        <strong>HO JAYEGA</strong> is a prototype set in a fictional lane inspired by Old Bhopal. Every shop, sign and
        brand in it is invented.
      </p>
      <h3 className="dialog__subtitle">Art &amp; sound</h3>
      <p>
        All 3D visuals are built in code from three.js primitives; signs, paper and surfaces are painted at runtime
        with Canvas 2D. UI sounds are synthesised live with the Web Audio API. No photographs, models, music or sound
        files are used.
      </p>
      <h3 className="dialog__subtitle">Fonts (SIL Open Font License 1.1)</h3>
      <ul className="credits">
        <li>
          Baloo 2 — Ek Type (<a href="licenses/Baloo2-OFL.txt">licence</a>)
        </li>
        <li>
          Mukta — Girish Dalvi, Ek Type (<a href="licenses/Mukta-OFL.txt">licence</a>)
        </li>
        <li>
          Kalam — Indian Type Foundry (<a href="licenses/Kalam-OFL.txt">licence</a>)
        </li>
      </ul>
      <h3 className="dialog__subtitle">Libraries (MIT)</h3>
      <ul className="credits">
        <li>three.js, React, React Three Fiber, Zustand</li>
        <li>Built with Vite and TypeScript; tested with Vitest</li>
      </ul>
      <div className="dialog__actions">
        <button ref={closeBtn} type="button" className="btn btn--small" onClick={close}>
          Close
        </button>
      </div>
    </Dialog>
  )
}

export function ReplayDialog() {
  const close = useGame((s) => s.closeOverlay)
  const replayDay = useGame((s) => s.replayDay)
  const save = useGame((s) => s.save)
  const days = completedDays(save)
  const closeBtn = useRef<HTMLButtonElement>(null)

  return (
    <Dialog labelledBy="replay-title" describedBy="replay-desc" onClose={close} className="dialog--replay" initialFocus={closeBtn}>
      <h2 id="replay-title" className="dialog__title">
        Play a day again
      </h2>
      <p id="replay-desc">
        Replays are just for fun. Your saved shop, money, reputation and progress stay exactly as they are.
      </p>
      <ul className="replay-list">
        {days.map((day) => {
          const def = getDayDefinition(day)
          return (
            <li key={day}>
              <button type="button" className="replay-day" onClick={() => replayDay(day)}>
                <span className="replay-day__label">{def?.label ?? `DAY ${day}`}</span>
                <span className="replay-day__sub">{def?.subtitle}</span>
                <span className="replay-day__go">Replay ›</span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="dialog__actions">
        <button ref={closeBtn} type="button" className="btn btn--small" onClick={close}>
          Close
        </button>
      </div>
    </Dialog>
  )
}

export function ConfirmNewShopDialog() {
  const close = useGame((s) => s.closeOverlay)
  const confirm = useGame((s) => s.confirmNewShop)
  const save = useGame((s) => s.save)
  const problem = useGame((s) => s.saveProblem)
  const keep = useRef<HTMLButtonElement>(null)

  return (
    <Dialog labelledBy="confirm-title" describedBy="confirm-desc" onClose={close} className="dialog--confirm" initialFocus={keep}>
      <h2 id="confirm-title" className="dialog__title">
        Start a new shop?
      </h2>
      <div id="confirm-desc">
        {save ? (
          <p>
            <bdi className="dialog__name">{save.playerName}</bdi>’s shop ({dayLabel(save.currentDay)}) is saved in this
            browser. It will be replaced once you sign the new register. Until then, nothing changes.
          </p>
        ) : (
          <p>
            There is a saved shop here that this version can’t open. {problem?.detail} Starting a new shop will replace
            it once you sign the new register.
          </p>
        )}
      </div>
      <div className="dialog__actions">
        <button ref={keep} type="button" className="btn btn--small" onClick={close}>
          Keep my shop
        </button>
        <button type="button" className="btn btn--small btn--danger" onClick={confirm}>
          Start new shop
        </button>
      </div>
    </Dialog>
  )
}
