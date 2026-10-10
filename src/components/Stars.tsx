import { Star } from 'lucide-react'

export default function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  const row = (cls: string) => (
    <div className="flex gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={size} className={`shrink-0 ${cls}`} />
      ))}
    </div>
  )
  return (
    <div className="relative inline-block" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {row('fill-line text-line dark:fill-slate-700 dark:text-slate-700')}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${(rating / 5) * 100}%` }}>
        {row('fill-amber-400 text-amber-400')}
      </div>
    </div>
  )
}
