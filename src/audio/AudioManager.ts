export type SoundName =
  | 'click'
  | 'shutter'
  | 'stamp'
  | 'pickup'
  | 'attach'
  | 'success'
  | 'fail'
  | 'pop'
  | 'static'
  | 'radio'
  | 'water'
  | 'carArrive'
  | 'carLeave'

type AudioContextCtor = typeof AudioContext

type SampleId = 'click' | 'shutter' | 'stamp' | 'pickup' | 'attach' | 'success' | 'fail' | 'snap' | 'static' | 'radio' | 'water' | 'motor' | 'engine' | 'street' | 'car'

interface Clip {
  sample: SampleId
  /** Where the useful part of the recording starts, and how long to play (seconds). */
  offset: number
  duration: number
  gain: number
}

/** CC0 recordings from Freesound (see ASSET_CREDITS.md), trimmed at play time. */
const CLIPS: Readonly<Record<SoundName, Clip>> = {
  click: { sample: 'click', offset: 0, duration: 0.2, gain: 0.8 },
  shutter: { sample: 'shutter', offset: 0.3, duration: 2.5, gain: 0.9 },
  stamp: { sample: 'stamp', offset: 0.55, duration: 0.6, gain: 0.55 },
  pickup: { sample: 'pickup', offset: 0.28, duration: 0.4, gain: 0.45 },
  attach: { sample: 'attach', offset: 0, duration: 0.3, gain: 0.6 },
  success: { sample: 'success', offset: 0, duration: 0.8, gain: 0.35 },
  fail: { sample: 'fail', offset: 0, duration: 0.3, gain: 0.5 },
  pop: { sample: 'snap', offset: 0.2, duration: 0.4, gain: 0.8 },
  static: { sample: 'static', offset: 1, duration: 1.8, gain: 0.3 },
  radio: { sample: 'radio', offset: 0.5, duration: 6, gain: 0.6 },
  water: { sample: 'water', offset: 0.5, duration: 2.4, gain: 0.6 },
  carArrive: { sample: 'car', offset: 0, duration: 5.5, gain: 0.9 },
  carLeave: { sample: 'car', offset: 19, duration: 6, gain: 0.9 },
}

const SAMPLE_IDS: readonly SampleId[] = ['click', 'shutter', 'stamp', 'pickup', 'attach', 'success', 'fail', 'snap', 'static', 'radio', 'water', 'motor', 'engine', 'street', 'car']

/** Loops for machines under test: a small electric motor, re-pitched per machine, and a car engine idling. */
const MOTOR_LOOP = { start: 1, end: 12 }
const ENGINE_LOOP = { start: 4.5, end: 9 }
const STREET_GAIN = 0.14

/**
 * Plays the game's recorded sounds (loaded after the first user gesture) and falls back to a tiny
 * synthesiser while they load or if loading fails. Every failure is swallowed: audio can never block play.
 */
export class AudioManager {
  private ctx: AudioContext | null = null
  private noise: AudioBuffer | null = null
  private enabled = false
  private broken = false
  private buffers = new Map<SampleId, AudioBuffer>()
  private loading = false
  private street: { src: AudioBufferSourceNode; gain: GainNode } | null = null

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.stopAmbience()
      if (this.ctx?.state === 'running') this.ctx.suspend().catch(() => undefined)
    } else if (this.ctx) {
      this.ctx.resume().catch(() => undefined)
      this.startAmbience()
    }
  }

  /** Call from inside a user-gesture handler. */
  unlock(): void {
    if (!this.enabled || this.broken) return
    try {
      if (!this.ctx) {
        const Ctor: AudioContextCtor | undefined =
          window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
        if (!Ctor) {
          this.broken = true
          return
        }
        this.ctx = new Ctor()
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => undefined)
      this.load(this.ctx)
    } catch {
      this.broken = true
      this.ctx = null
    }
  }

  private load(ctx: AudioContext): void {
    if (this.loading) return
    this.loading = true
    const base = import.meta.env.BASE_URL ?? '/'
    for (const id of SAMPLE_IDS) {
      fetch(`${base}audio/${id}.mp3`)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.statusText))))
        .then((data) => ctx.decodeAudioData(data))
        .then((buffer) => {
          this.buffers.set(id, buffer)
          if (id === 'street') this.startAmbience()
        })
        .catch(() => undefined)
    }
  }

  play(name: SoundName): void {
    if (!this.enabled) return
    this.unlock()
    const ctx = this.ctx
    if (!ctx) return
    try {
      const clip = CLIPS[name]
      const buffer = this.buffers.get(clip.sample)
      if (buffer) this.playClip(ctx, buffer, clip)
      else this.synth(ctx, name)
    } catch {
      // Audio is decorative.
    }
  }

  /** A running machine during a repair test: the car engine for low pitches, a small motor otherwise. */
  hum(seconds: number, freq: number): void {
    if (!this.enabled || seconds <= 0) return
    this.unlock()
    const ctx = this.ctx
    if (!ctx) return
    try {
      const car = freq < 65
      const buffer = this.buffers.get(car ? 'engine' : 'motor')
      if (!buffer) {
        this.synthHum(ctx, seconds, freq)
        return
      }
      const loop = car ? ENGINE_LOOP : MOTOR_LOOP
      const t = ctx.currentTime + 0.01
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      src.loopStart = loop.start
      src.loopEnd = Math.min(loop.end, buffer.duration)
      src.playbackRate.value = car ? 1 : Math.min(1.6, Math.max(0.6, freq / 110))
      const gain = ctx.createGain()
      const peak = car ? 0.55 : 0.4
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(peak, t + 0.35)
      gain.gain.setValueAtTime(peak, t + seconds)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds + 0.4)
      src.connect(gain)
      gain.connect(ctx.destination)
      src.start(t, loop.start)
      src.stop(t + seconds + 0.45)
    } catch {
      // Audio is decorative.
    }
  }

  dispose(): void {
    this.stopAmbience()
    const ctx = this.ctx
    this.ctx = null
    this.noise = null
    this.buffers.clear()
    this.loading = false
    ctx?.close().catch(() => undefined)
  }

  // ---------------------------------------------------------------- recordings

  private playClip(ctx: AudioContext, buffer: AudioBuffer, clip: Clip): void {
    const t = ctx.currentTime + 0.01
    const offset = Math.min(clip.offset, Math.max(0, buffer.duration - 0.05))
    const duration = Math.min(clip.duration, buffer.duration - offset)
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const gain = ctx.createGain()
    // Short fades so trimmed clips never click at their edges.
    const fade = Math.min(0.03, duration / 4)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(clip.gain, t + fade)
    gain.gain.setValueAtTime(clip.gain, t + duration - fade * 2)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    src.connect(gain)
    gain.connect(ctx.destination)
    src.start(t, offset, duration)
  }

  /** The lane's background: traffic, voices and horns, looping quietly under everything. */
  private startAmbience(): void {
    const ctx = this.ctx
    const buffer = this.buffers.get('street')
    if (!this.enabled || !ctx || !buffer || this.street) return
    try {
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(STREET_GAIN, ctx.currentTime + 2)
      src.connect(gain)
      gain.connect(ctx.destination)
      src.start()
      this.street = { src, gain }
    } catch {
      // Audio is decorative.
    }
  }

  private stopAmbience(): void {
    const street = this.street
    this.street = null
    try {
      street?.src.stop()
    } catch {
      // Already stopped.
    }
  }

  // ---------------------------------------------------------------- fallback synth (while loading)

  private synth(ctx: AudioContext, name: SoundName): void {
    const t = ctx.currentTime + 0.01
    if (name === 'click' || name === 'shutter' || name === 'stamp') this.tone(ctx, t, 'triangle', 1300, 520, 0.07, 0.12)
    else if (name === 'pickup') this.tone(ctx, t, 'triangle', 700, 980, 0.08, 0.08)
    else if (name === 'attach') this.tone(ctx, t, 'square', 420, 260, 0.05, 0.06)
    else if (name === 'pop') this.tone(ctx, t, 'sine', 300, 900, 0.18, 0.2)
    else if (name === 'fail') this.tone(ctx, t, 'sawtooth', 180, 110, 0.35, 0.08)
    else if (name === 'success') {
      this.tone(ctx, t, 'triangle', 660, 660, 0.18, 0.12)
      this.tone(ctx, t + 0.14, 'triangle', 990, 990, 0.35, 0.12)
    } else if (name === 'static' || name === 'water') this.noiseBurst(ctx, t, name === 'static' ? 2400 : 700, 1.2, 0.08)
  }

  private synthHum(ctx: AudioContext, seconds: number, freq: number): void {
    const t = ctx.currentTime + 0.01
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(freq, t)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = freq * 4
    osc.connect(filter)
    filter.connect(this.envelope(ctx, t, 0.05, 0.3, seconds))
    osc.start(t)
    osc.stop(t + seconds + 0.35)
  }

  private noiseBurst(ctx: AudioContext, t: number, freq: number, len: number, peak: number): void {
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer(ctx)
    src.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = freq
    src.connect(filter)
    filter.connect(this.envelope(ctx, t, peak, 0.15, len))
    src.start(t)
    src.stop(t + len + 0.2)
  }

  private tone(ctx: AudioContext, t: number, type: OscillatorType, from: number, to: number, len: number, peak: number): void {
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(from, t)
    osc.frequency.exponentialRampToValueAtTime(to, t + len)
    osc.connect(this.envelope(ctx, t, peak, 0.005, len))
    osc.start(t)
    osc.stop(t + len + 0.05)
  }

  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noise) return this.noise
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let seed = 1234567
    for (let i = 0; i < data.length; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      data[i] = (seed / 0x7fffffff) * 2 - 1
    }
    this.noise = buffer
    return buffer
  }

  private envelope(ctx: AudioContext, t: number, peak: number, attack: number, release: number): GainNode {
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(peak, t + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + release)
    gain.connect(ctx.destination)
    return gain
  }
}

export const audio = new AudioManager()
