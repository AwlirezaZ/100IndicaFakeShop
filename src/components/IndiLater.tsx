import { Info } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { money } from '../lib/api'

/** "Buy now, pay never": a parody of pay-later offers. Every installment is $0.00. */
export default function IndiLater({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const when = ['Today', 'In 2 weeks', 'In 4 weeks', 'In 6 weeks']

  return (
    <span ref={ref} className={`relative inline-flex items-center gap-1 text-sm text-muted ${className}`}>
      or 4 interest-free payments of <b className="text-ink">{money(0)}</b> with{' '}
      <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-1 font-bold text-tint-ink hover:underline">
        IndiLater™ <Info size={13} />
      </button>
      {open && (
        <span className="animate-pop-in absolute top-full left-0 z-30 mt-2 block w-72 rounded-2xl border border-line bg-surface p-4 text-left text-sm text-ink shadow-2xl">
          <b className="block text-base">Buy now, pay never.</b>
          <span className="mt-3 block space-y-1.5">
            {when.map((w) => (
              <span key={w} className="flex justify-between">
                <span className="text-muted">{w}</span>
                <span className="font-medium">{money(0)}</span>
              </span>
            ))}
          </span>
          <span className="mt-3 block border-t border-line pt-3 text-xs text-muted">
            Interest: 0%. Late fees: 0%. Sense this makes: also 0%.
          </span>
        </span>
      )}
    </span>
  )
}
