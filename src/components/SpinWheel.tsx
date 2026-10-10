import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { unlock } from '../lib/achievements'
import { confetti } from '../lib/fun'

/** Fire this event (e.g. from the header) to open the wheel. */
export const WHEEL_EVENT = '100indica:wheel'
const SEEN_KEY = '100indica-wheel'
const MAX_SPINS = 3

const SEGMENTS = [
  { label: '50% OFF', color: '#9d33bf' },
  { label: '0% off', color: '#f59e0b' },
  { label: '90% OFF', color: '#db2777' },
  { label: 'Try again', color: '#0ea5e9' },
  { label: 'FREE GARY', color: '#5f1f74' },
  { label: '+5% (oops)', color: '#ef4444' },
  { label: 'A hug 🤗', color: '#10b981' },
  { label: 'Nothing', color: '#64748b' },
]
const SLICE = 360 / SEGMENTS.length

// The wheel is rigged: it only ever lands on these, preferably *just* past a jackpot. 😇
const OUTCOMES: { index: number; nearMiss: boolean; text: string }[] = [
  { index: 1, nearMiss: true, text: '🎉 You won 0% off! Use code NOTHING at checkout.' },
  { index: 3, nearMiss: true, text: 'Sooo close! Try again.' },
  { index: 5, nearMiss: false, text: 'Oops. Everything is now 5% more expensive. (Not really. Probably.)' },
  { index: 6, nearMiss: false, text: 'You won a hug! 🤗 Redeemable from whoever is sitting next to you.' },
  { index: 7, nearMiss: false, text: 'You won… nothing! Congratulations?' },
]

function slicePath(i: number) {
  const r = 150
  const a0 = ((i * SLICE - 90) * Math.PI) / 180
  const a1 = (((i + 1) * SLICE - 90) * Math.PI) / 180
  return `M0 0 L${r * Math.cos(a0)} ${r * Math.sin(a0)} A${r} ${r} 0 0 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)} Z`
}

export default function SpinWheel() {
  const [open, setOpen] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [spins, setSpins] = useState(0)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    const show = () => {
      setSpins(0)
      setResult(null)
      setOpen(true)
    }
    window.addEventListener(WHEEL_EVENT, show)

    // Pop up by itself once, a while into the first visit (but not on top of the cookie banner).
    let seen = true
    try {
      seen = !!localStorage.getItem(SEEN_KEY)
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      // ignore
    }
    const auto = seen
      ? undefined
      : setTimeout(function tryShow() {
          if (document.querySelector('[data-cookie-banner]')) return void setTimeout(tryShow, 5000)
          show()
        }, 40000)

    return () => {
      window.removeEventListener(WHEEL_EVENT, show)
      clearTimeout(auto)
    }
  }, [])

  const spin = () => {
    if (spinning || spins >= MAX_SPINS) return
    const outcome = OUTCOMES[Math.floor(Math.random() * OUTCOMES.length)]
    // Angle on the wheel (clockwise from the top) that should end under the pointer.
    const target = outcome.nearMiss ? outcome.index * SLICE + 2 + Math.random() * 2 : outcome.index * SLICE + SLICE / 2
    const turn = (((-target - rotation) % 360) + 360) % 360
    setResult(null)
    setSpinning(true)
    setRotation(rotation + 360 * 5 + turn)
    setTimeout(() => {
      setSpinning(false)
      setSpins((s) => s + 1)
      if (spins + 1 >= MAX_SPINS) unlock('wheel-addict')
      setResult(outcome.text)
      if (outcome.index === 1 || outcome.index === 6) confetti()
    }, 5200)
  }

  if (!open) return null
  const out = spins >= MAX_SPINS

  return (
    <div className="fixed inset-0 z-[55] grid place-items-center p-4">
      <div className="animate-fade-in absolute inset-0 bg-indica-night/60 backdrop-blur-sm" onClick={() => !spinning && setOpen(false)} />
      <div className="animate-pop-in relative w-full max-w-md rounded-3xl bg-surface p-6 text-center shadow-2xl">
        <button
          onClick={() => setOpen(false)}
          disabled={spinning}
          className="absolute top-4 right-4 rounded-full p-2 hover:bg-soft disabled:opacity-30"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold">🎡 Spin to win!</h2>
        <p className="mt-1 text-sm text-muted">Win up to 90% off! (Statistically, you won’t.)</p>

        <div className="relative mx-auto mt-6 aspect-square w-full max-w-80">
          {/* Pointer */}
          <div className="absolute -top-2 left-1/2 z-10 h-0 w-0 -translate-x-1/2 border-x-[14px] border-t-[26px] border-x-transparent border-t-ink drop-shadow" />
          <svg
            viewBox="-160 -160 320 320"
            className="size-full drop-shadow-xl"
            style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 5s cubic-bezier(.15,.65,.1,1)' : 'none' }}
          >
            <circle r="158" className="fill-ink" />
            {SEGMENTS.map((s, i) => (
              <g key={s.label}>
                <path d={slicePath(i)} fill={s.color} stroke="white" strokeWidth="2" />
                <text
                  transform={`rotate(${i * SLICE + SLICE / 2}) translate(0 -98) rotate(90)`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="15"
                  fontWeight="700"
                >
                  {s.label}
                </text>
              </g>
            ))}
            <circle r="34" fill="white" />
          </svg>
          <button
            onClick={spin}
            disabled={spinning || out}
            className="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white shadow-lg hover:bg-brand-700 disabled:opacity-60"
          >
            SPIN
          </button>
        </div>

        <div className="mt-5 min-h-12">
          {spinning ? (
            <p className="animate-pulse font-medium text-muted">Spinning… 🤞</p>
          ) : result ? (
            <p className="animate-pop-in font-semibold">{result}</p>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-faint">
          {out ? 'Out of spins. Come back never. 🙃' : `${MAX_SPINS - spins} spin${MAX_SPINS - spins === 1 ? '' : 's'} left`}
        </p>
      </div>
    </div>
  )
}
