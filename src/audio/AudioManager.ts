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

type AudioContextCtor = typeof AudioContext

/**
 * Tiny synthesiser for UI sounds. Everything is generated at runtime, nothing is downloaded.
 * The context is only created after a user gesture, and every failure is swallowed so
 * audio can never block navigation.
 */
export class AudioManager {
  private ctx: AudioContext | null = null
  private noise: AudioBuffer | null = null
  private enabled = false
  private broken = false

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled && this.ctx?.state === 'running') {
      this.ctx.suspend().catch(() => undefined)
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
    } catch {
      this.broken = true
      this.ctx = null
    }
  }

  play(name: SoundName): void {
    if (!this.enabled) return
    this.unlock()
    const ctx = this.ctx
    if (!ctx) return
    try {
      const t = ctx.currentTime + 0.01
      if (name === 'click') this.click(ctx, t)
      else if (name === 'stamp') this.stamp(ctx, t)
      else if (name === 'shutter') this.shutter(ctx, t)
      else if (name === 'pickup') this.tone(ctx, t, 'triangle', 700, 980, 0.08, 0.08)
      else if (name === 'attach') this.tone(ctx, t, 'square', 420, 260, 0.05, 0.06)
      else if (name === 'pop') this.tone(ctx, t, 'sine', 300, 900, 0.18, 0.2)
      else if (name === 'static') this.noiseBurst(ctx, t, 'bandpass', 2400, 1.1, 0.07)
      else if (name === 'water') this.noiseBurst(ctx, t, 'lowpass', 700, 2.4, 0.12)
      else if (name === 'radio') this.oldTune(ctx, t)
      else if (name === 'fail') {
        this.tone(ctx, t, 'sawtooth', 180, 120, 0.18, 0.08)
        this.tone(ctx, t + 0.2, 'sawtooth', 150, 90, 0.25, 0.08)
      } else {
        this.tone(ctx, t, 'triangle', 660, 660, 0.18, 0.12)
        this.tone(ctx, t + 0.14, 'triangle', 990, 990, 0.35, 0.12)
      }
    } catch {
      // Audio is decorative.
    }
  }

  /** A motor hum for repair tests. */
  hum(seconds: number, freq: number): void {
    if (!this.enabled || seconds <= 0) return
    this.unlock()
    const ctx = this.ctx
    if (!ctx) return
    try {
      const t = ctx.currentTime + 0.01
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq * 0.6, t)
      osc.frequency.exponentialRampToValueAtTime(freq, t + 0.4)
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = freq * 4
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.05, t + 0.3)
      gain.gain.setValueAtTime(0.05, t + seconds)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds + 0.3)
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + seconds + 0.35)
    } catch {
      // Audio is decorative.
    }
  }

  private noiseBurst(ctx: AudioContext, t: number, type: BiquadFilterType, freq: number, len: number, peak: number): void {
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer(ctx)
    src.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.value = freq
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.15)
    gain.gain.setValueAtTime(peak, t + len - 0.3)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + len)
    src.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    src.start(t)
    src.stop(t + len + 0.05)
  }

  /** A short original phrase through a narrow band-pass, like an old valve radio. */
  private oldTune(ctx: AudioContext, t: number): void {
    const notes = [392, 440, 523, 587, 523, 440, 392, 330, 392]
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 1100
    band.Q.value = 0.8
    const out = ctx.createGain()
    out.gain.value = 0.5
    band.connect(out)
    out.connect(ctx.destination)
    notes.forEach((f, i) => {
      const at = t + i * 0.28
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(f, at)
      osc.frequency.linearRampToValueAtTime(f * 1.004, at + 0.26)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, at)
      g.gain.exponentialRampToValueAtTime(0.18, at + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, at + (i === notes.length - 1 ? 0.8 : 0.3))
      osc.connect(g)
      g.connect(band)
      osc.start(at)
      osc.stop(at + 0.85)
    })
    this.noiseBurst(ctx, t, 'bandpass', 3000, notes.length * 0.28 + 0.6, 0.015)
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

  dispose(): void {
    const ctx = this.ctx
    this.ctx = null
    this.noise = null
    ctx?.close().catch(() => undefined)
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

  private click(ctx: AudioContext, t: number): void {
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1300, t)
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.06)
    osc.connect(this.envelope(ctx, t, 0.12, 0.004, 0.07))
    osc.start(t)
    osc.stop(t + 0.1)
  }

  private stamp(ctx: AudioContext, t: number): void {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(160, t)
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.14)
    osc.connect(this.envelope(ctx, t, 0.35, 0.005, 0.16))
    osc.start(t)
    osc.stop(t + 0.2)

    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer(ctx)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1800
    src.connect(filter)
    filter.connect(this.envelope(ctx, t, 0.12, 0.002, 0.06))
    src.start(t, 0.2, 0.1)
  }

  private shutter(ctx: AudioContext, t: number): void {
    const duration = 0.75
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer(ctx)
    src.loop = true
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.setValueAtTime(700, t)
    band.frequency.linearRampToValueAtTime(1300, t + duration)
    band.Q.value = 1.4

    // Square-wave amplitude modulation gives the slat-by-slat rattle.
    const rattle = ctx.createGain()
    rattle.gain.value = 0.5
    const lfo = ctx.createOscillator()
    lfo.type = 'square'
    lfo.frequency.setValueAtTime(18, t)
    lfo.frequency.linearRampToValueAtTime(30, t + duration)
    const lfoDepth = ctx.createGain()
    lfoDepth.gain.value = 0.45
    lfo.connect(lfoDepth)
    lfoDepth.connect(rattle.gain)

    const out = ctx.createGain()
    out.gain.setValueAtTime(0.0001, t)
    out.gain.exponentialRampToValueAtTime(0.22, t + 0.06)
    out.gain.setValueAtTime(0.22, t + duration - 0.12)
    out.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    out.connect(ctx.destination)

    src.connect(band)
    band.connect(rattle)
    rattle.connect(out)
    src.start(t)
    src.stop(t + duration + 0.05)
    lfo.start(t)
    lfo.stop(t + duration + 0.05)

    const clunk = ctx.createOscillator()
    clunk.type = 'sine'
    clunk.frequency.setValueAtTime(110, t + duration - 0.05)
    clunk.frequency.exponentialRampToValueAtTime(50, t + duration + 0.15)
    clunk.connect(this.envelope(ctx, t + duration - 0.05, 0.3, 0.005, 0.18))
    clunk.start(t + duration - 0.05)
    clunk.stop(t + duration + 0.25)
  }
}

export const audio = new AudioManager()
