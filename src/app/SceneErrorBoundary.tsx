import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  onError(error: unknown): void
  children: ReactNode
}

/** Catches 3D start-up failures so the menu keeps working with the HTML fallback. */
export class SceneErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('3D scene failed', error, info.componentStack)
    this.props.onError(error)
  }

  render(): ReactNode {
    return this.state.failed ? null : this.props.children
  }
}

export function detectWebGL(): boolean {
  if (new URLSearchParams(window.location.search).get('renderer') === 'fallback') return false
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}
