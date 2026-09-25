import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  Color,
  type DirectionalLight,
  Fog,
  type HemisphereLight,
  type MeshBasicMaterial,
  NeutralToneMapping,
} from 'three'
import { selectReducedMotion, useGame } from '../app/state'
import { AmbientContext, type AmbientClock, AmbientDriver } from './ambient'
import { Director, titlePose } from './Director'
import { createWorldKit, KitContext, type WorldKit } from './kit'
import { RepairShop } from './RepairShop'
import { createShopRig } from './rig'
import { Street } from './Street'
import { StreetLife } from './StreetLife'

const FONT_PROBES = ['800 64px "Baloo 2"', '700 64px "Baloo 2"', '600 32px Mukta', '700 32px Kalam', '400 32px Kalam']
const FONT_TIMEOUT_MS = 3000

/** Signs are painted into textures, so the bundled fonts must be ready first. */
async function waitForFonts(): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return
  const loads = FONT_PROBES.map((f) => document.fonts.load(f, 'हो जाएगा Ho Jayega ₹'))
  await Promise.race([Promise.allSettled(loads), new Promise((r) => setTimeout(r, FONT_TIMEOUT_MS))])
}

const MORNING = { sky: new Color('#fff0d4'), ground: new Color('#8a6a50'), sun: new Color('#ffd9a6'), air: new Color('#efdcbc'), tint: new Color('#ffffff'), hemi: 1.2, sunI: 2.7 }
const EVENING = { sky: new Color('#f5b98c'), ground: new Color('#553a2c'), sun: new Color('#ff8f4a'), air: new Color('#dca37e'), tint: new Color('#f3b48e'), hemi: 0.72, sunI: 1.6 }

/** Sun, sky and haze; eases between morning and evening when a day asks for it. */
function DayLight() {
  const kit = useContext(KitContext)
  const hemi = useRef<HemisphereLight>(null)
  const sun = useRef<DirectionalLight>(null)
  const scene = useThree((s) => s.scene)
  const mix = useRef(useGame.getState().timeOfDay === 'evening' ? 1 : 0)
  const air = useMemo(() => new Color(MORNING.air), [])
  const fog = useMemo(() => new Fog(air.getHex(), 26, 80), [air])

  useEffect(() => {
    scene.background = air
    scene.fog = fog
    return () => {
      scene.background = null
      scene.fog = null
    }
  }, [scene, air, fog])

  useFrame((_, delta) => {
    const s = useGame.getState()
    const goal = s.timeOfDay === 'evening' ? 1 : 0
    const reduced = selectReducedMotion(s)
    mix.current = reduced || s.screen !== 'SHOP' ? goal : mix.current + (goal - mix.current) * (1 - Math.exp(-Math.min(delta, 0.05) * 1.2))
    const k = mix.current
    if (hemi.current) {
      hemi.current.color.lerpColors(MORNING.sky, EVENING.sky, k)
      hemi.current.groundColor.lerpColors(MORNING.ground, EVENING.ground, k)
      hemi.current.intensity = MORNING.hemi + (EVENING.hemi - MORNING.hemi) * k
    }
    if (sun.current) {
      sun.current.color.lerpColors(MORNING.sun, EVENING.sun, k)
      sun.current.intensity = MORNING.sunI + (EVENING.sunI - MORNING.sunI) * k
    }
    air.lerpColors(MORNING.air, EVENING.air, k)
    fog.color.copy(air)
    const sky = kit?.texMat('sky', { basic: true, fog: false })
    if (sky && 'color' in sky) (sky as MeshBasicMaterial).color.lerpColors(MORNING.tint, EVENING.tint, k)
  })

  return (
    <>
      <hemisphereLight ref={hemi} args={['#fff0d4', '#8a6a50', 1.2]} />
      <directionalLight
        ref={sun}
        position={[-9, 14, 11]}
        intensity={2.7}
        color="#ffd9a6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={14}
        shadow-camera-bottom={-10}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
    </>
  )
}

function ReadySignal() {
  const setRenderMode = useGame((s) => s.setRenderMode)
  const sent = useRef(false)
  useFrame(() => {
    if (sent.current) return
    sent.current = true
    requestAnimationFrame(() => setRenderMode('3d'))
  })
  return null
}

/** The single renderer and scene shared by the title screen and the workshop. */
export function WorkshopWorld({ children }: { children?: ReactNode }) {
  const [kit, setKit] = useState<WorldKit | null>(null)
  const rig = useMemo(createShopRig, [])
  const ambient = useRef<AmbientClock>({ t: 0, dt: 0, animate: true })
  const setRenderMode = useGame((s) => s.setRenderMode)

  useEffect(() => {
    let cancelled = false
    let created: WorldKit | null = null
    waitForFonts().then(() => {
      if (cancelled) return
      try {
        created = createWorldKit()
        setKit(created)
      } catch {
        setRenderMode('fallback', 'The street textures could not be generated in this browser.')
      }
    })
    return () => {
      cancelled = true
      created?.dispose()
    }
  }, [setRenderMode])

  if (!kit) return null
  const start = titlePose(window.innerWidth / Math.max(1, window.innerHeight))

  return (
    <Canvas
      className="scene-canvas"
      shadows="percentage"
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: start.fov, near: 0.1, far: 160, position: [...start.pos] }}
      onCreated={({ gl }) => {
        gl.toneMapping = NeutralToneMapping
        gl.toneMappingExposure = 1.15
        if (import.meta.env.DEV) {
          // Dev-only probe for checking that navigation doesn't leak GPU resources.
          ;(window as unknown as { __hjRendererInfo?: () => object }).__hjRendererInfo = () => ({
            ...gl.info.memory,
            programs: gl.info.programs?.length ?? 0,
          })
        }
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          setRenderMode('fallback', 'The graphics context was lost (the GPU may be busy or the driver reset).')
        }, { once: true })
      }}
    >
      <KitContext.Provider value={kit}>
        <AmbientContext.Provider value={ambient}>
          <DayLight />
          <AmbientDriver />
          <Street rig={rig} />
          <RepairShop rig={rig} />
          <StreetLife />
          {children}
          <Director rig={rig} />
          <ReadySignal />
        </AmbientContext.Provider>
      </KitContext.Provider>
    </Canvas>
  )
}
