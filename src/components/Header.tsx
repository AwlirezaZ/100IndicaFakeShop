import { Moon, Package, Search, ShoppingBag, Sun, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { getDepartments, matchesQuery, money, queryWords, useProducts } from '../lib/api'
import { useShop } from '../lib/store'
import { unlock } from '../lib/achievements'
import { CURRENCIES, useCurrency, type Currency } from '../lib/currency'
import { useTheme } from '../lib/theme'
import IndiCoins from './IndiCoins'
import { DiscoBall } from './Icons'
import { logo } from '../lib/brand'
import { WHEEL_EVENT } from './SpinWheel'

function SearchBox({ className = '' }: { className?: string }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { data } = useProducts()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    setQ(params.get('q') ?? '')
  }, [params])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const suggestions = useMemo(() => {
    if (!data || q.trim().length < 2) return []
    const words = queryWords(q)
    const out = []
    for (const p of data) {
      if (matchesQuery(p, words)) out.push(p)
      if (out.length === 6) break
    }
    return out
  }, [data, q])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setOpen(false)
    navigate(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : '/products')
  }

  return (
    <form ref={boxRef} onSubmit={submit} className={`relative ${className}`}>
      <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search phones, books, coffee, shampoo…"
        className="h-11 w-full rounded-full border border-line bg-soft pr-28 pl-11 text-sm outline-none transition placeholder:text-faint focus:border-brand-500 focus:bg-surface focus:ring-4 focus:ring-focus"
      />
      {q && (
        <button
          type="button"
          onClick={() => setQ('')}
          className="absolute top-1/2 right-[5.5rem] -translate-y-1/2 p-1 text-faint hover:text-body"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
      <button className="absolute top-1 right-1 bottom-1 rounded-full bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">
        Search
      </button>

      {open && suggestions.length > 0 && (
        <div className="animate-fade-in absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
          {suggestions.map((p) => (
            <Link
              key={p.id}
              to={`/product/${p.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-soft"
            >
              <img src={p.thumbnail} alt="" className="size-10 rounded-lg bg-well object-contain" />
              <span className="flex-1 truncate text-sm">{p.title}</span>
              <span className="text-sm font-semibold">{money(p.price)}</span>
            </Link>
          ))}
          <button className="w-full border-t border-line px-4 py-2.5 text-left text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-soft">
            See all results for “{q.trim()}”
          </button>
        </div>
      )}
    </form>
  )
}

export default function Header() {
  const count = useShop((s) => s.cart.reduce((n, i) => n + i.qty, 0))
  const setCartOpen = useShop((s) => s.setCartOpen)
  const { data } = useProducts()
  const departments = useMemo(() => (data ? getDepartments(data) : []), [data])
  const { theme, toggle } = useTheme()
  const { currency, setCurrency } = useCurrency()
  const location = useLocation()
  const [params] = useSearchParams()
  const onProducts = location.pathname === '/products'
  const activeDept = onProducts ? params.get('department') : null

  const pill = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 transition ${active ? 'bg-ink text-page' : 'text-body hover:bg-soft'}`

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-lg">
      <div className="bg-indica-night px-4 py-2 text-center text-xs text-brand-100 dark:bg-black">
        🎉 Free shipping on orders over $50 · <span className="text-indica-green">Demo store — no real money is ever charged</span>{' '}
        ·{' '}
        <button onClick={() => window.dispatchEvent(new Event(WHEEL_EVENT))} className="font-semibold text-white underline-offset-2 hover:underline">
          🎡 Spin to win
        </button>{' '}
        ·{' '}
        <label className="inline-flex items-center gap-1">
          <span className="sr-only">Currency</span>
          <select
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value as Currency)
              unlock('banana-economist')
            }}
            className="cursor-pointer rounded bg-transparent font-semibold text-white outline-none [&>option]:text-slate-900"
          >
            {Object.entries(CURRENCIES).map(([k, c]) => (
              <option key={k} value={k}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:gap-8">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={logo} alt="" className="size-10" />
          <span className="text-xl font-bold tracking-tight">100Indica Shop</span>
        </Link>
        <SearchBox className="hidden flex-1 md:block" />
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {/* Cycles light → night → disco. The icon shows what you'll switch to next. */}
          <button
            onClick={toggle}
            className="grid size-10 place-items-center rounded-full hover:bg-soft"
            aria-label={{ light: 'Switch to night mode', dark: 'Switch to disco mode', disco: 'Switch to light mode' }[theme]}
            title={{ light: 'Night mode', dark: 'Disco mode 🕺', disco: 'Light mode' }[theme]}
          >
            {theme === 'light' ? (
              <Moon size={20} />
            ) : theme === 'dark' ? (
              <DiscoBall size={22} />
            ) : (
              <Sun size={20} className="text-amber-300" />
            )}
          </button>
          <IndiCoins />
          <Link to="/orders" className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium hover:bg-soft">
            <Package size={20} />
            <span className="hidden sm:inline">Orders</span>
          </Link>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium hover:bg-soft"
          >
            <ShoppingBag size={20} />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute top-0.5 left-6 grid h-5 min-w-5 place-items-center rounded-full bg-indica-green px-1 text-[11px] font-bold text-indica-night">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
      <div className="px-4 pb-3 md:hidden">
        <SearchBox />
      </div>
      <nav className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
        <Link to="/products" className={pill(onProducts && !activeDept && !params.get('category'))}>
          All products
        </Link>
        {departments.map((d) => (
          <Link key={d.slug} to={`/products?department=${d.slug}`} className={pill(activeDept === d.slug)}>
            {d.name}
          </Link>
        ))}
      </nav>
    </header>
  )
}
