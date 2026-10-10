import { ChevronRight, Package } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { money } from '../lib/api'
import { useShop } from '../lib/store'

export default function Orders() {
  const orders = useShop((s) => s.orders)
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-3xl pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Your orders</h1>
        {orders.length > 0 && (
          <Link
            to="/wrapped"
            className="rounded-full bg-gradient-to-r from-brand-700 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:opacity-90"
          >
            🎁 Your 100Indica Wrapped
          </Link>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-faint py-20 text-center">
          <Package size={40} className="text-faint" />
          <p className="text-lg font-semibold">No orders yet</p>
          <p className="text-muted">When you place an order, it will show up here.</p>
          <Link to="/products" className="rounded-full bg-brand-600 px-6 py-2.5 font-medium text-white hover:bg-brand-700">
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                to={`/order/${o.id}`}
                className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 transition hover:shadow-lg sm:flex-row sm:items-center"
              >
                <div className="flex -space-x-3">
                  {o.items.slice(0, 3).map((i) => (
                    <img key={i.id} src={i.thumbnail} alt="" className="size-14 rounded-xl border-2 border-surface bg-well object-contain" />
                  ))}
                  {o.items.length > 3 && (
                    <span className="grid size-14 place-items-center rounded-xl border-2 border-surface bg-soft text-sm font-medium">
                      +{o.items.length - 3}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-mono text-sm font-semibold">#{o.id}</p>
                  <p className="text-sm text-muted">
                    {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ·{' '}
                    {o.items.reduce((n, i) => n + i.qty, 0)} items
                  </p>
                </div>
                <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                  Paid · Preparing
                </span>
                {/* A button, not a link: the whole row is already a link to the order. */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(`/track/${o.id}`)
                  }}
                  className="w-fit rounded-full border border-line px-3 py-1 text-xs font-semibold hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400"
                >
                  🛵 Track
                </button>
                <p className="text-lg font-bold">{money(o.total)}</p>
                <ChevronRight size={18} className="hidden text-faint sm:block" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
