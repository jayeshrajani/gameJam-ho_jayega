export function BootLoader({ done }: { done: boolean }) {
  return (
    <div className={done ? 'boot is-done' : 'boot'} aria-hidden={done} role="status">
      <div className="boot__shutter" aria-hidden="true" />
      <p className="boot__hi" lang="hi">
        दुकान खुल रही है…
      </p>
      <p className="boot__en">Opening the lane</p>
    </div>
  )
}

/** Lightweight HTML/CSS street used when WebGL is unavailable. */
export function FallbackStreet({ open }: { open: boolean }) {
  return (
    <div className={open ? 'fb is-open' : 'fb'} aria-hidden="true">
      <div className="fb__row">
        <div className="fb__bld fb__bld--chai">
          <div className="fb__win" />
          <div className="fb__board fb__board--chai" lang="hi">
            चाय • पोहा
          </div>
          <div className="fb__awning fb__awning--chai" />
          <div className="fb__open fb__open--dark" />
        </div>
        <div className="fb__bld fb__bld--shop">
          <div className="fb__wins">
            <div className="fb__arch" />
            <div className="fb__arch" />
          </div>
          <div className="fb__sign">
            <span className="fb__sign-hi" lang="hi">
              हो जाएगा
            </span>
            <span className="fb__sign-en">REPAIR WORKS</span>
          </div>
          <div className="fb__open">
            <div className="fb__counter" />
            <div className="fb__shutter" />
          </div>
        </div>
        <div className="fb__bld fb__bld--tailor">
          <div className="fb__win" />
          <div className="fb__board fb__board--tailor" lang="hi">
            नाज़ टेलर्स
          </div>
          <div className="fb__awning fb__awning--tailor" />
          <div className="fb__open fb__open--dark" />
        </div>
      </div>
      <div className="fb__road" />
    </div>
  )
}

export function FallbackNotice({ reason, inShop }: { reason: string | null; inShop: boolean }) {
  return (
    <aside className="fallback-note" role="status">
      <strong>3D workshop unavailable.</strong> {reason ?? 'WebGL is disabled or unsupported in this browser.'}{' '}
      {inShop
        ? 'The workbench can’t be drawn here, but the on-screen repair controls still work.'
        : 'The menu, name entry and saving still work; the 3D street and workbench need WebGL.'}
    </aside>
  )
}
