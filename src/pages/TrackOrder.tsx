import { ArrowLeft, RotateCcw, Star } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { unlock } from '../lib/achievements'
import { useShop } from '../lib/store'

// The courier's (very scenic) route on a 600×360 cartoon map.
// t = seconds since tracking started; progress/eta are what the page shows from that moment on.
interface Stop {
  t: number
  x: number
  y: number
  progress: number
  eta: string
  msg?: string
  lost?: boolean
}

const STORE = { x: 70, y: 300 }
const HOME = { x: 530, y: 60 }

const ROUTE: Stop[] = [
  { t: 0, ...STORE, progress: 5, eta: '8 min', msg: '📦 Your order was packed by a very enthusiastic intern.' },
  { t: 4, ...STORE, progress: 10, eta: '8 min', msg: '🛵 Courier Gary picked up your order. Gary seems confident.' },
  { t: 8, x: 70, y: 180, progress: 25, eta: '6 min', msg: 'Gary is on his way!' },
  { t: 12, x: 230, y: 180, progress: 40, eta: '4 min', msg: 'Gary is making great progress. Suspiciously great.' },
  { t: 16, x: 230, y: 60, progress: 35, eta: '9 min', msg: '🤔 Gary took a “shortcut”.' },
  { t: 20, x: 400, y: 60, progress: 45, eta: '12 min', msg: '🍩 Gary stopped for a snack.' },
  { t: 25, x: 400, y: 60, progress: 45, eta: '17 min', msg: 'Gary is still eating the snack. It’s a big snack.' },
  { t: 29, x: 400, y: 180, progress: 40, eta: '25 min', msg: '😵 Gary is lost.', lost: true },
  { t: 32, x: 230, y: 180, progress: 30, eta: '40 min', lost: true },
  { t: 35, x: 230, y: 60, progress: 25, eta: '1 hr', msg: '🐦 Gary is asking a pigeon for directions.', lost: true },
  { t: 39, x: 400, y: 60, progress: 35, eta: '2 hr', msg: 'The pigeon was not helpful.', lost: true },
  { t: 41, ...HOME, progress: 90, eta: '1 min', msg: '👀 Gary drove right past your house. He waved, though.' },
  { t: 43, x: 530, y: 180, progress: 70, eta: '3 min', msg: '↩️ Gary is turning around… eventually.' },
  { t: 47, x: 530, y: 300, progress: 50, eta: '?? min', msg: '🏠 Gary delivered your package to the wrong house.' },
  { t: 50, x: 530, y: 300, progress: 50, eta: '?? min', msg: '😬 …and took it back. The neighbour is not happy.' },
  { t: 53, x: 400, y: 300, progress: 40, eta: '∞', msg: '🌀 Gary is driving in circles to “build suspense”.', lost: true },
  { t: 56, x: 400, y: 180, progress: 45, eta: '∞', lost: true },
  { t: 59, x: 530, y: 180, progress: 85, eta: '2 min', msg: '🗺️ Gary finally opened a map.' },
  { t: 63, ...HOME, progress: 100, eta: 'Delivered', msg: '🎉 Delivered! Left with your neighbour’s cat. 🐈' },
]
const DURATION = ROUTE[ROUTE.length - 1].t

/** Where Gary is at `t` seconds: interpolated between the surrounding stops. */
function positionAt(t: number) {
  const i = ROUTE.findIndex((s) => s.t > t)
  if (i === -1) return { ...ROUTE[ROUTE.length - 1], index: ROUTE.length - 1 }
  const a = ROUTE[i - 1]
  const b = ROUTE[i]
  const k = (t - a.t) / (b.t - a.t)
  return {
    ...a,
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k,
    progress: a.progress + (b.progress - a.progress) * k,
    index: i - 1,
  }
}

const pct = (x: number, y: number) => ({ left: `${(x / 600) * 100}%`, top: `${(y / 360) * 100}%` })

export default function TrackOrder() {
  const { id } = useParams()
  const order = useShop((s) => s.orders.find((o) => o.id === id))
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [rating, setRating] = useState(0)
  const frame = useRef(0)

  useEffect(() => {
    const tick = () => {
      const s = (Date.now() - startedAt) / 1000
      setElapsed(Math.min(s, DURATION))
      if (s < DURATION) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [startedAt])

  useEffect(() => {
    if (elapsed >= DURATION) unlock('gary-fan')
  }, [elapsed])

  if (!order) {
    return (
      <div className="py-32 text-center">
        <p className="text-lg font-medium">Order not found. Gary may have lost it.</p>
        <Link to="/orders" className="mt-4 inline-block font-medium text-brand-600 hover:underline dark:text-brand-400">
          View your orders
        </Link>
      </div>
    )
  }

  const here = positionAt(elapsed)
  const delivered = elapsed >= DURATION
  const events = ROUTE.filter((s) => s.msg && s.t <= elapsed).reverse()
  const trail = [...ROUTE.slice(0, here.index + 1), here].map((s) => `${s.x},${s.y}`).join(' ')
  const clock = (t: number) =>
    new Date(startedAt + t * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })

  return (
    <div className="mx-auto max-w-5xl pt-8">
      <Link to={`/order/${order.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> Back to order
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live tracking</h1>
          <p className="mt-1 font-mono text-sm text-muted">Order #{order.id}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted">Estimated arrival</p>
          <p
            className={`text-3xl font-bold tabular-nums transition-colors ${delivered ? 'text-emerald-600 dark:text-emerald-400' : here.lost ? 'text-rose-600 dark:text-rose-400' : ''}`}
          >
            {here.eta}
          </p>
        </div>
      </div>

      {/* Progress bar — yes, it goes backwards sometimes */}
      <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-soft">
        <div
          className={`h-full rounded-full transition-colors ${delivered ? 'bg-emerald-500' : here.lost ? 'bg-rose-500' : 'bg-gradient-to-r from-brand-600 to-brand-400'}`}
          style={{ width: `${here.progress}%` }}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Map */}
        <div className="relative aspect-[5/3] overflow-hidden rounded-3xl border border-line bg-surface">
          <svg viewBox="0 0 600 360" className="absolute inset-0 size-full" aria-hidden>
            <rect width="600" height="360" className="fill-soft" />
            <rect x="250" y="80" width="130" height="80" rx="16" className="fill-emerald-200 dark:fill-emerald-900/60" />
            <text x="315" y="126" textAnchor="middle" className="fill-emerald-700 text-[13px] dark:fill-emerald-300">
              🌳 Park 🌳
            </text>
            <ellipse cx="465" cy="240" rx="42" ry="34" className="fill-sky-200 dark:fill-sky-900/60" />
            <text x="465" y="245" textAnchor="middle" className="fill-sky-700 text-[12px] dark:fill-sky-300">
              Lake
            </text>
            {[70, 230, 400, 530].map((x) => (
              <line key={x} x1={x} y1="20" x2={x} y2="340" strokeWidth="16" strokeLinecap="round" className="stroke-surface" />
            ))}
            {[60, 180, 300].map((y) => (
              <line key={y} x1="40" y1={y} x2="560" y2={y} strokeWidth="16" strokeLinecap="round" className="stroke-surface" />
            ))}
            <polyline
              points={trail}
              fill="none"
              strokeWidth="4"
              strokeDasharray="2 9"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="stroke-brand-500"
            />
          </svg>

          <div className="absolute -translate-x-1/2 -translate-y-full pb-1 text-center" style={pct(STORE.x, STORE.y)}>
            <span className="text-3xl">🏬</span>
            <p className="rounded-full bg-surface px-2 text-[11px] font-semibold shadow">100Indica Shop</p>
          </div>
          <div className="absolute -translate-x-1/2 -translate-y-full pb-1 text-center" style={pct(HOME.x, HOME.y)}>
            <span className="text-3xl">🏠</span>
            <p className="rounded-full bg-surface px-2 text-[11px] font-semibold shadow">You</p>
          </div>

          {/* Gary */}
          <div className="absolute -translate-x-1/2 -translate-y-1/2" style={pct(here.x, here.y)}>
            {here.lost && <span className="absolute -top-7 left-1/2 -translate-x-1/2 animate-bounce text-xl">❓</span>}
            <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/40" />
            <span className="relative grid size-11 place-items-center rounded-full bg-surface text-2xl shadow-lg ring-4 ring-brand-500">
              🛵
            </span>
          </div>
        </div>

        {/* Updates */}
        <div className="rounded-3xl border border-line bg-surface p-6">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-full bg-tint text-2xl">🧔</div>
            <div>
              <p className="font-semibold">Gary</p>
              <p className="text-xs text-muted">Your courier · ★ 2.1 (it’s complicated)</p>
            </div>
          </div>

          {delivered && (
            <div className="animate-pop-in mt-5 rounded-2xl bg-emerald-50 p-4 text-center dark:bg-emerald-500/15">
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">Rate your delivery</p>
              <div className="mt-2 flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                    <Star size={26} className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-faint'} />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="mt-2 text-sm text-body">
                  {rating >= 4 ? 'Gary is crying happy tears. 😢' : 'Gary has been informed. Gary is sad. 😔'}
                </p>
              )}
            </div>
          )}

          <ol className="mt-5 space-y-4">
            {events.map((e, i) => (
              <li key={e.t} className={`flex gap-3 ${i === 0 ? 'animate-pop-in' : 'opacity-70'}`}>
                <span
                  className={`mt-1.5 size-2.5 shrink-0 rounded-full ${i === 0 ? (e.lost ? 'bg-rose-500' : 'bg-brand-500') : 'bg-line'}`}
                />
                <div>
                  <p className={`text-sm ${i === 0 ? 'font-medium' : ''}`}>{e.msg}</p>
                  <p className="text-xs text-faint">{clock(e.t)}</p>
                </div>
              </li>
            ))}
          </ol>

          {delivered && (
            <button
              onClick={() => {
                setStartedAt(Date.now())
                setElapsed(0)
                setRating(0)
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-line py-2.5 text-sm font-medium hover:bg-soft"
            >
              <RotateCcw size={16} /> Watch Gary again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
