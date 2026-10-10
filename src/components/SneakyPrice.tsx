import { useEffect, useRef, useState } from 'react'
import { money } from '../lib/api'

/**
 * Shows a price that slowly creeps up while you hover over it ("dynamic pricing"),
 * and snaps back when you move away. Only the display changes — the cart uses the real price.
 */
export default function SneakyPrice({ price, className = '' }: { price: number; className?: string }) {
  const [markup, setMarkup] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval>>(undefined)

  useEffect(() => () => clearInterval(timer.current), [])

  const start = () => {
    clearInterval(timer.current)
    // The first bump comes after 600ms, so a quick pass of the mouse doesn't trigger it.
    timer.current = setInterval(() => setMarkup((m) => Math.min(m + 0.03, 0.42)), 600)
  }
  const stop = () => {
    clearInterval(timer.current)
    setMarkup(0)
  }

  return (
    <span className="relative inline-block" onMouseEnter={start} onMouseLeave={stop}>
      <span className={`${className} transition-colors ${markup > 0 ? 'text-rose-600 dark:text-rose-400' : ''}`}>
        {money(price * (1 + markup))}
      </span>
      {markup > 0 && (
        <span className="animate-pop-in absolute bottom-full left-0 z-10 mb-1 w-max max-w-56 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-page shadow-lg">
          Price updated due to your interest 😏 (+{Math.round(markup * 100)}%)
        </span>
      )}
    </span>
  )
}
