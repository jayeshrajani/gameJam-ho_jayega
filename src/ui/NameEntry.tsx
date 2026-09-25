import { type FormEvent, useEffect, useRef, useState } from 'react'
import { countCharacters, NAME_INPUT_MAX_LENGTH, NAME_MAX_CHARS, normalizePlayerName } from '../app/playerName'
import { useGame } from '../app/state'

const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export function NameEntry() {
  const submitName = useGame((s) => s.submitName)
  const back = useGame((s) => s.backFromNameEntry)
  const replacing = useGame((s) => s.save !== null || s.saveProblem !== null)
  const memoryOnly = useGame((s) => s.storageMode === 'memory')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    input.current?.focus()
  }, [])

  const count = countCharacters(normalizePlayerName(value))

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    const result = submitName(value)
    if (!result.ok) {
      setError(result.error)
      input.current?.focus()
      return
    }
    setBusy(true)
  }

  return (
    <section className="register-wrap" aria-labelledby="name-heading">
      <form className="register" onSubmit={onSubmit} noValidate>
        <header className="register__head">
          <span>KHATA No. 001</span>
          <span>{today}</span>
        </header>
        <span className="register__stamp" aria-hidden="true">
          NAYA KHATA
        </span>

        <h2 id="name-heading" className="register__title">
          Naam batao, ustad.
        </h2>
        <p className="register__sub">What should we call the mechanic?</p>

        <label htmlFor="player-name" className="register__label">
          Your name
        </label>
        <input
          id="player-name"
          ref={input}
          className="register__input"
          type="text"
          name="playerName"
          placeholder="e.g. Jayesh"
          autoComplete="nickname"
          spellCheck={false}
          maxLength={NAME_INPUT_MAX_LENGTH}
          value={value}
          readOnly={busy}
          aria-invalid={error !== null}
          aria-describedby="name-help name-error"
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError(null)
          }}
        />
        <div className="register__meta">
          <span id="name-help">1–24 characters, any script — देवनागरी, English, anything.</span>
          <span className={count > NAME_MAX_CHARS ? 'register__count is-over' : 'register__count'} aria-hidden="true">
            {count}/{NAME_MAX_CHARS}
          </span>
        </div>
        <p id="name-error" className="register__error" role="alert">
          {error}
        </p>

        <p className="register__privacy">
          No account needed. Your shop is saved only in this browser
          {memoryOnly ? ' — but browser storage is unavailable right now, so it will be forgotten when this page closes.' : '.'}
        </p>
        {replacing && (
          <p className="register__warn">Signing this page replaces the shop currently saved in this browser.</p>
        )}

        <div className="register__actions">
          <button type="button" className="btn btn--plain btn--ink" onClick={back} disabled={busy}>
            Back
          </button>
          <button type="submit" className="btn btn--stamp" disabled={busy} aria-disabled={busy}>
            DUKAAN KHOLO
          </button>
        </div>
      </form>
    </section>
  )
}
