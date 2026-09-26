import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { audio } from '../audio/AudioManager'
import { getDayScript } from '../days/registry'
import { DayOverlay } from '../days/runner/DayOverlay'
import { BootLoader, FallbackNotice, FallbackStreet } from '../ui/BootScreen'
import { NameEntry } from '../ui/NameEntry'
import { ConfirmNewShopDialog, CreditsDialog, ReplayDialog, SettingsDialog } from '../ui/Overlays'
import { ShopHud } from '../ui/ShopHud'
import { SoundToggle } from '../ui/SoundToggle'
import { TitleScreen } from '../ui/TitleScreen'
import { DayCard, FadeVeil } from '../ui/Transitions'
import { detectWebGL, SceneErrorBoundary } from './SceneErrorBoundary'
import { selectActiveDay, selectReducedMotion, useGame } from './state'

// three.js lives in these chunks so the shell and menu paint before the 3D code arrives.
const WorkshopWorld = lazy(() => import('../world/WorkshopWorld').then((m) => ({ default: m.WorkshopWorld })))
const DayScene = lazy(() => import('../days/scene/DayScene').then((m) => ({ default: m.DayScene })))

export function App() {
  const screen = useGame((s) => s.screen)
  const overlay = useGame((s) => s.overlay)
  const renderMode = useGame((s) => s.renderMode)
  const fallbackReason = useGame((s) => s.fallbackReason)
  const storageMode = useGame((s) => s.storageMode)
  const showDayCard = useGame((s) => s.showDayCard)
  const currentDay = useGame(selectActiveDay)
  const playable = currentDay !== null && getDayScript(currentDay) !== undefined
  const reduced = useGame(selectReducedMotion)
  const setRenderMode = useGame((s) => s.setRenderMode)
  const setSystemReducedMotion = useGame((s) => s.setSystemReducedMotion)
  const [webgl] = useState(detectWebGL)

  // Focus the title's primary action when coming back to it, but not on first load.
  const previousScreen = useRef(screen)
  const titleAutoFocus = screen === 'TITLE' && previousScreen.current !== 'TITLE'
  useEffect(() => {
    previousScreen.current = screen
  }, [screen])

  useEffect(() => {
    if (!webgl) setRenderMode('fallback', 'WebGL is disabled or unsupported in this browser.')
  }, [webgl, setRenderMode])

  useEffect(() => {
    if (renderMode === '3d') void import('../days/scene/DayScene')
  }, [renderMode])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setSystemReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [setSystemReducedMotion])

  useEffect(() => {
    const unlock = () => audio.unlock()
    window.addEventListener('pointerdown', unlock, true)
    window.addEventListener('keydown', unlock, true)
    return () => {
      window.removeEventListener('pointerdown', unlock, true)
      window.removeEventListener('keydown', unlock, true)
    }
  }, [])

  const ready = renderMode !== 'loading'
  const inShop = screen === 'ENTERING_SHOP' || screen === 'SHOP'
  const use3d = webgl && renderMode !== 'fallback'

  return (
    <div className="app" data-screen={screen} data-motion={reduced ? 'reduced' : 'full'} data-render={renderMode}>
      <div className="scene" aria-hidden="true">
        {use3d ? (
          <SceneErrorBoundary onError={() => setRenderMode('fallback', 'The 3D scene failed to start.')}>
            <Suspense fallback={null}>
              <WorkshopWorld>
                {inShop && playable && (
                  <Suspense fallback={null}>
                    <DayScene />
                  </Suspense>
                )}
              </WorkshopWorld>
            </Suspense>
          </SceneErrorBoundary>
        ) : (
          <FallbackStreet open={inShop} />
        )}
      </div>
      <div className="scrim" aria-hidden="true" />
      <FadeVeil />

      <main className="ui">
        {ready && screen === 'TITLE' && <TitleScreen autoFocus={titleAutoFocus} />}
        {ready && screen === 'NAME_ENTRY' && <NameEntry />}
        {ready && !inShop && <SoundToggle corner />}
        {screen === 'SHOP' && (
          <>
            <ShopHud />
            {playable && <DayOverlay key={currentDay} />}
          </>
        )}
        {renderMode === 'fallback' && <FallbackNotice reason={fallbackReason} inShop={screen === 'SHOP'} />}
        {storageMode === 'memory' && (
          <p className="storage-note" role="status">
            Browser storage is unavailable — progress will be lost when this page closes.
          </p>
        )}
        <div className="day-card-slot" aria-live="polite">
          {showDayCard && currentDay !== null && <DayCard day={currentDay} />}
        </div>
      </main>

      <BootLoader done={ready} />
      {overlay === 'settings' && <SettingsDialog />}
      {overlay === 'credits' && <CreditsDialog />}
      {overlay === 'confirm-new' && <ConfirmNewShopDialog />}
      {overlay === 'replay' && <ReplayDialog />}
    </div>
  )
}
