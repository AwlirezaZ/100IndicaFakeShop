import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { coinStatus, useShop } from '../lib/store'
import { IndiCoin } from './Icons'
import { TickerChart, useIndiTicker } from './Trolls'

/** Header button showing the user's IndiCoins: 1 per dollar spent, worth $0.00. */
export default function IndiCoins() {
  const orders = useShop((s) => s.orders)
  const { coins, level, next } = coinStatus(orders)
  const [open, setOpen] = useState(false)
  const [redeemed, setRedeemed] = useState(false)
  const ticker = useIndiTicker()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const progress = next ? ((coins - level.min) / (next.min - level.min)) * 100 : 100

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen(!open)
          setRedeemed(false)
        }}
        className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold hover:bg-soft"
        title="IndiCoins"
      >
        <IndiCoin /> <span className="tabular-nums">{coins.toLocaleString()}</span>
        <span className="hidden text-[10px] font-bold text-rose-500 tabular-nums lg:inline">▼{ticker.drop}%</span>
      </button>

      {open && (
        <div className="animate-pop-in absolute top-full right-0 z-50 mt-2 w-72 rounded-2xl border border-line bg-surface p-5 shadow-2xl">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">IndiCoins</p>
          <p className="mt-1 flex items-center gap-2 text-3xl font-bold tabular-nums"><IndiCoin size={30} /> {coins.toLocaleString()}</p>
          <p className="text-sm text-muted">Cash value: $0.00</p>

          <div className="mt-3 rounded-xl border border-line p-3">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-semibold">IND · market price</span>
              <span className="font-bold text-rose-500 tabular-nums">▼ {ticker.drop}% today</span>
            </div>
            <TickerChart history={ticker.history} />
            <p key={ticker.analyst} className="animate-fade-in text-[11px] text-muted">{ticker.analyst}</p>
          </div>

          <div className="mt-4 rounded-xl bg-soft p-3">
            <p className="text-sm">
              Status: <b>{level.emoji} {level.name}</b>
            </p>
            {next ? (
              <>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  {(next.min - coins).toLocaleString()} more to become {next.emoji} {next.name}
                </p>
              </>
            ) : (
              <p className="mt-1 text-xs text-muted">You’ve reached the top. There is nothing left. Go outside.</p>
            )}
          </div>

          <p className="mt-3 text-xs text-faint">Earn 1 IndiCoin for every $1 you (pretend to) spend.</p>
          <button
            onClick={() => setRedeemed(true)}
            className="mt-3 w-full rounded-full bg-amber-400 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-300"
          >
            {redeemed ? 'Redeemed for: absolutely nothing ✨' : 'Redeem coins'}
          </button>
          {orders.length > 0 && (
            <Link to="/wrapped" onClick={() => setOpen(false)} className="mt-2 block text-center text-sm font-medium text-tint-ink hover:underline">
              🎁 See your 100Indica Wrapped
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
