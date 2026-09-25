import '@fontsource/baloo-2/latin-600.css'
import '@fontsource/baloo-2/latin-700.css'
import '@fontsource/baloo-2/latin-800.css'
import '@fontsource/baloo-2/devanagari-600.css'
import '@fontsource/baloo-2/devanagari-700.css'
import '@fontsource/baloo-2/devanagari-800.css'
import '@fontsource/mukta/latin-400.css'
import '@fontsource/mukta/latin-600.css'
import '@fontsource/mukta/devanagari-400.css'
import '@fontsource/mukta/devanagari-600.css'
import '@fontsource/kalam/latin-400.css'
import '@fontsource/kalam/latin-700.css'
import '@fontsource/kalam/devanagari-400.css'
import '@fontsource/kalam/devanagari-700.css'
import './ui/styles.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { clearGameTimers } from './app/state'
import { audio } from './audio/AudioManager'

const container = document.getElementById('app')
if (!container) throw new Error('Missing #app container')

const root = createRoot(container)
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    root.unmount()
    clearGameTimers()
    audio.dispose()
  })
}
