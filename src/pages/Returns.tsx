import { useState } from 'react'
import { Link } from 'react-router'
import { unlock } from '../lib/achievements'
import { money } from '../lib/api'
import { confetti } from '../lib/fun'
import { useShop } from '../lib/store'

const REASONS = [
  'It looked at me funny',
  'My cat disapproves',
  'It’s too good. I don’t deserve it.',
  'Gary delivered it to my ex',
  'Bought it at 3 a.m. Regretted it at 9 a.m.',
  'The potato was better',
  'It doesn’t spark joy. Or anything.',
  'Other (please attach a 2,000-word essay)',
]

const REFUNDS = [
  { id: 'coins', label: 'IndiCoins (worth $0.00)', disabled: false },
  { id: 'card', label: 'Original payment method — unavailable, it’s too far away', disabled: true },
  { id: 'cash', label: 'Cash — Gary spent it', disabled: true },
  { id: 'hug', label: 'A hug — out of stock', disabled: true },
]

const select = 'mt-1.5 h-12 w-full rounded-xl border border-line bg-surface px-4 outline-none focus:border-brand-500 focus:ring-4 focus:ring-focus'

/** Returns & refunds: every refund is paid in IndiCoins, every label is carried by Kevin the pigeon. */
export default function Returns() {
  const orders = useShop((s) => s.orders)
  const items = orders.flatMap((o) => o.items.map((i) => ({ key: `${o.id}-${i.id}`, label: `${i.title} (order ${o.id})` })))
  const [item, setItem] = useState(items[0]?.key ?? 'unbought')
  const [reason, setReason] = useState(REASONS[0])
  const [label, setLabel] = useState<string | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setLabel('RTN-' + Math.random().toString(36).slice(2, 9).toUpperCase())
    confetti()
    unlock('serial-returner')
  }

  const itemName = items.find((i) => i.key === item)?.label ?? 'Something you haven’t bought yet'

  if (label)
    return (
      <div className="mx-auto max-w-lg pt-10">
        <h1 className="text-3xl font-bold tracking-tight">Return approved! 📦</h1>
        <p className="mt-2 text-muted">Print this label, tape it to the box, and leave it on your windowsill. Kevin will find it. Eventually.</p>
        <div className="mt-6 rounded-3xl border-2 border-dashed border-ink bg-white p-6 font-mono text-sm text-slate-900">
          <div className="flex items-start justify-between">
            <p className="text-2xl font-black">RETURN LABEL</p>
            <span className="text-3xl">🐦</span>
          </div>
          <div className="mt-4 flex h-14 items-stretch gap-[2px]" aria-hidden="true">
            {Array.from({ length: 48 }, (_, i) => (
              <span key={i} className="bg-slate-900" style={{ width: ((i * 7) % 4) + 1 }} />
            ))}
          </div>
          <p className="mt-1 text-center tracking-[0.3em]">{label}</p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-slate-500">Item</dt>
            <dd className="line-clamp-2">{itemName}</dd>
            <dt className="text-slate-500">Reason</dt>
            <dd>{reason}</dd>
            <dt className="text-slate-500">Carrier</dt>
            <dd>Kevin (pigeon, unlicensed)</dd>
            <dt className="text-slate-500">Refund</dt>
            <dd>{money(0)} in IndiCoins</dd>
            <dt className="text-slate-500">Refund ETA</dt>
            <dd>When pigs fly (Kevin’s cousins)</dd>
          </dl>
        </div>
        <Link to="/" className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-2.5 font-medium text-white hover:bg-brand-700">
          Back to shopping (and regretting)
        </Link>
      </div>
    )

  return (
    <div className="mx-auto max-w-lg pt-10">
      <h1 className="text-3xl font-bold tracking-tight">Returns & refunds</h1>
      <p className="mt-2 text-muted">30-day returns, no questions asked. (We ask several questions.)</p>
      <form onSubmit={submit} className="mt-8 space-y-5 rounded-3xl border border-line bg-surface p-6">
        <label className="block text-sm font-medium text-body">
          What are you returning?
          <select value={item} onChange={(e) => setItem(e.target.value)} className={select}>
            {items.map((i) => (
              <option key={i.key} value={i.key}>
                {i.label}
              </option>
            ))}
            <option value="unbought">Something I haven’t bought yet (pre-return)</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-body">
          Why?
          <select value={reason} onChange={(e) => setReason(e.target.value)} className={select}>
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="text-sm font-medium text-body">Refund to</legend>
          <div className="mt-2 space-y-2">
            {REFUNDS.map((r) => (
              <label key={r.id} className={`flex items-center gap-3 rounded-xl border border-line p-3 text-sm ${r.disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
                <input type="radio" name="refund" defaultChecked={r.id === 'coins'} disabled={r.disabled} className="accent-brand-600" />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="rounded-xl bg-soft p-3 text-sm">🐦 Return shipping: <b>Kevin the pigeon</b> (the only option, he insisted).</p>
        <button className="w-full rounded-full bg-brand-600 py-3.5 font-semibold text-white hover:bg-brand-700">Start my return</button>
      </form>
    </div>
  )
}
