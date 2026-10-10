import confettiLib from 'canvas-confetti'

/** Two bursts of confetti from the bottom corners. */
export function confetti() {
  const base = { particleCount: 90, spread: 70, startVelocity: 55, zIndex: 100 }
  confettiLib({ ...base, angle: 60, origin: { x: 0, y: 0.9 } })
  confettiLib({ ...base, angle: 120, origin: { x: 1, y: 0.9 } })
}

// Sounds are synthesized with the Web Audio API, so there are no audio files to bundle.
let ctx: AudioContext | null = null
function audio() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(c: AudioContext, opts: { freq: number; start: number; dur: number; type: OscillatorType; vol?: number; slideTo?: number; vibrato?: boolean }) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  const t0 = c.currentTime + opts.start
  osc.type = opts.type
  osc.frequency.setValueAtTime(opts.freq, t0)
  if (opts.slideTo) osc.frequency.linearRampToValueAtTime(opts.slideTo, t0 + opts.dur)
  if (opts.vibrato) {
    const lfo = c.createOscillator()
    const depth = c.createGain()
    lfo.frequency.value = 6
    depth.gain.value = 6
    lfo.connect(depth).connect(osc.frequency)
    lfo.start(t0)
    lfo.stop(t0 + opts.dur)
  }
  const vol = opts.vol ?? 0.2
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur)
  osc.connect(gain).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + opts.dur + 0.05)
}

/** Achievement unlocked: a quick rising chime. */
export function playAchievement() {
  const c = audio()
  if (!c) return
  ;[784, 988, 1175, 1568].forEach((f, i) => tone(c, { freq: f, start: i * 0.08, dur: 0.25, type: 'triangle', vol: 0.12 }))
}

/** Cash-register "cha-ching!" — or an 8-bit coin sound in retro mode. */
export function playChaChing() {
  const c = audio()
  if (!c) return
  if (document.documentElement.classList.contains('retro')) {
    tone(c, { freq: 988, start: 0, dur: 0.08, type: 'square', vol: 0.1 })
    tone(c, { freq: 1319, start: 0.08, dur: 0.4, type: 'square', vol: 0.1 })
    return
  }
  tone(c, { freq: 1318, start: 0, dur: 0.12, type: 'square', vol: 0.08 })
  tone(c, { freq: 1760, start: 0.12, dur: 0.5, type: 'triangle', vol: 0.18 })
  tone(c, { freq: 2637, start: 0.12, dur: 0.45, type: 'sine', vol: 0.1 })
}

/** Wah wah wah waaaah. */
export function playSadTrombone() {
  const c = audio()
  if (!c) return
  const notes = [392, 370, 349]
  notes.forEach((f, i) => tone(c, { freq: f, start: i * 0.45, dur: 0.42, type: 'sawtooth', vol: 0.09 }))
  tone(c, { freq: 330, start: 1.35, dur: 1.3, type: 'sawtooth', vol: 0.09, slideTo: 300, vibrato: true })
}

/** Electric zap: a buzzy downward sweep. */
export function playZap() {
  const c = audio()
  if (!c) return
  tone(c, { freq: 1800, start: 0, dur: 0.35, type: 'sawtooth', vol: 0.12, slideTo: 60 })
  tone(c, { freq: 2400, start: 0.05, dur: 0.25, type: 'square', vol: 0.06, slideTo: 120 })
}
