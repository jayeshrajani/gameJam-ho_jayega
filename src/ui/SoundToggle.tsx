import { useGame } from '../app/state'

/** A small speaker button: in the shop HUD, or pinned to a screen corner elsewhere. */
export function SoundToggle({ corner = false }: { corner?: boolean }) {
  const on = useGame((s) => s.settings.soundEnabled)
  const setSound = useGame((s) => s.setSoundEnabled)
  const label = on ? 'Sound on' : 'Sound off'
  return (
    <button
      type="button"
      className={`btn btn--small sound-toggle${corner ? ' sound-toggle--corner' : ''}`}
      aria-pressed={on}
      aria-label={label}
      title={`${label} (click to turn ${on ? 'off' : 'on'})`}
      onClick={() => setSound(!on)}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
        {on ? (
          <>
            <path d="M16.5 8.5a5 5 0 0 1 0 7" />
            <path d="M19 6a8.5 8.5 0 0 1 0 12" />
          </>
        ) : (
          <path d="M17 9l5 6M22 9l-5 6" />
        )}
      </svg>
    </button>
  )
}
