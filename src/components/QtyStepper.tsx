import { Minus, Plus } from 'lucide-react'

export default function QtyStepper({
  value,
  max,
  onChange,
  small,
}: {
  value: number
  max: number
  onChange: (n: number) => void
  small?: boolean
}) {
  const btn = `grid place-items-center text-body hover:bg-soft disabled:opacity-30 disabled:hover:bg-transparent ${small ? 'size-7' : 'size-11'}`
  return (
    <div data-no-rage className="inline-flex items-center rounded-full border border-line bg-surface">
      <button className={`${btn} rounded-l-full`} disabled={value <= 1} onClick={() => onChange(value - 1)} aria-label="Decrease">
        <Minus size={small ? 14 : 16} />
      </button>
      <span className={`text-center font-medium tabular-nums ${small ? 'w-7 text-sm' : 'w-10'}`}>{value}</span>
      <button className={`${btn} rounded-r-full`} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="Increase">
        <Plus size={small ? 14 : 16} />
      </button>
    </div>
  )
}
