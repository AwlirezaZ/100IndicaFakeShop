import { ChevronLeft, ChevronRight, SearchX, SlidersHorizontal, Star, X } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AdCard } from '../components/Ads'
import ProductCard from '../components/ProductCard'
import { unlock } from '../lib/achievements'
import { LoadError, ProductGridSkeleton } from '../components/States'
import {
  categoryName,
  departmentName,
  departmentOf,
  getCategories,
  getDepartments,
  matchesQuery,
  queryWords,
  ratingScore,
  useProducts,
  type Product,
} from '../lib/api'

const PAGE_SIZE = 24

// Special replies for certain searches.
const EASTER_EGGS: Record<string, { emoji: string; title: string; text?: string; link?: { to: string; label: string } }> = {
  love: { emoji: '💘', title: 'We don’t sell love.', text: 'Try chocolate. It’s basically the same.', link: { to: '/products?category=chocolate-candy', label: 'Browse chocolate 🍫' } },
  gary: { emoji: '🛵', title: 'Gary is not for sale.', text: 'He’s barely for rent.' },
  money: { emoji: '💸', title: 'Haha. No.', text: 'If we had money, would we be selling things in bananas?' },
  potato: { emoji: '🥔', title: 'All hail the potato.', text: 'Undefeated in product comparisons. Beloved by all. We are not worthy.' },
  indica: { emoji: '⚡', title: 'You’re already here.', text: 'This is 100Indica. We are 100% out of explanations. (Try typing “indica” outside the search box, though.)' },
  happiness: { emoji: '😊', title: 'Happiness is out of stock.', text: 'Restocking never. Have you tried snacks?', link: { to: '/products?category=snacks', label: 'Browse snacks 🍿' } },
  boyfriend: { emoji: '💑', title: 'Sold out.', text: 'Someone already got the best one. 😌' },
  girlfriend: { emoji: '💑', title: 'Sold out.', text: 'Someone already got the best one. 😌' },
  nothing: { emoji: '✅', title: 'Found it!', text: 'Here’s nothing. Enjoy.' },
  help: { emoji: '🆘', title: 'Help is on the way.', text: 'Just kidding. Try Indi-bot in the corner. Actually, don’t.' },
}
const MAX_BRANDS = 25

const SORTS: Record<string, { label: string; fn: (a: Product, b: Product) => number }> = {
  featured: { label: 'Featured', fn: (a, b) => a.rank - b.rank },
  'price-asc': { label: 'Price: low to high', fn: (a, b) => a.price - b.price },
  'price-desc': { label: 'Price: high to low', fn: (a, b) => b.price - a.price },
  rating: { label: 'Top rated', fn: (a, b) => ratingScore(b) - ratingScore(a) },
  popular: { label: 'Most reviewed', fn: (a, b) => b.ratingCount - a.ratingCount },
  discount: { label: 'Biggest discount', fn: (a, b) => b.discountPercentage - a.discountPercentage },
  // Silly ones. "gary" is shuffled randomly in the results memo below.
  vibes: { label: 'Vibes ✨', fn: (a, b) => ((a.title.length * 7) % 11) - ((b.title.length * 7) % 11) || a.rank - b.rank },
  gary: { label: 'Gary’s mood', fn: (a, b) => a.rank - b.rank },
  regret: { label: 'Price: emotionally expensive', fn: (a, b) => b.price * (6 - b.rating) - a.price * (6 - a.rating) },
}

const GARY_MOODS = ['hungry', 'lost (again)', 'thinking about pigeons', 'surprisingly chipper', 'having a little nap', 'suspicious of cheese']
const SILLY_SORT_NOTES: Record<string, () => string> = {
  vibes: () => 'Sorted by vibes. Don’t ask how. We don’t know either.',
  gary: () => `Gary’s current mood: ${GARY_MOODS[Math.floor(Math.random() * GARY_MOODS.length)]}. Results reflect this.`,
  regret: () => 'Sorted by how much you’ll regret it. Most regrettable first.',
}

/** Page numbers to show, with null for "…" gaps: 1 … 4 5 6 … 20 */
function pageList(page: number, pages: number): (number | null)[] {
  const set = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages))
  const sorted = [...set].sort((a, b) => a - b)
  const out: (number | null)[] = []
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(null)
    out.push(n)
  })
  return out
}

export default function Products() {
  const { data, error, retry } = useProducts()
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const q = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const department = params.get('department') ?? (category ? departmentOf(category) : '')
  const min = params.get('min') ?? ''
  const max = params.get('max') ?? ''
  const rating = Number(params.get('rating') ?? 0)
  const brandParam = params.get('brand') ?? ''
  const brands = useMemo(() => brandParam.split(',').filter(Boolean), [brandParam])
  const sort = params.get('sort') ?? 'featured'
  const page = Math.max(1, Number(params.get('page') ?? 1))
  const egg = EASTER_EGGS[q.trim().toLowerCase()]

  useEffect(() => {
    if (egg) unlock('easter-egg')
  }, [egg])

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    if (!('page' in changes)) next.delete('page')
    setParams(next)
  }

  // Search matches, used for the department/category counts in the sidebar.
  const searched = useMemo(() => {
    const words = queryWords(q)
    return (data ?? []).filter((p) => matchesQuery(p, words))
  }, [data, q])

  const departments = useMemo(() => getDepartments(searched), [searched])
  const categories = useMemo(
    () => getCategories(searched.filter((p) => p.department === department)),
    [searched, department],
  )

  // Products matching search + department/category: used to offer only relevant brands.
  const base = useMemo(
    () =>
      searched.filter(
        (p) => (!department || p.department === department) && (!category || p.category === category),
      ),
    [searched, department, category],
  )

  const brandOptions = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of base) if (p.brand) counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1)
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_BRANDS)
    // Keep selected brands visible even if they're not in the top list.
    for (const b of brands) if (!top.some(([x]) => x === b)) top.push([b, counts.get(b) ?? 0])
    return top
  }, [base, brands])

  const results = useMemo(() => {
    const lo = min ? Number(min) : -Infinity
    const hi = max ? Number(max) : Infinity
    const words = queryWords(q)
    // With a search and the default sort, products with the words in their title come first.
    const relevance = (p: Product) => words.filter((w) => p.title.toLowerCase().includes(w)).length
    const mood = new Map<number, number>()
    const moodOf = (p: Product) => mood.get(p.id) ?? mood.set(p.id, Math.random()).get(p.id)!
    const cmp =
      sort === 'gary'
        ? (a: Product, b: Product) => moodOf(a) - moodOf(b)
        : sort === 'featured' && words.length
        ? (a: Product, b: Product) => relevance(b) - relevance(a) || ratingScore(b) - ratingScore(a)
        : (SORTS[sort]?.fn ?? SORTS.featured.fn)
    return base
      .filter(
        (p) =>
          p.price >= lo &&
          p.price <= hi &&
          p.rating >= rating &&
          (!brands.length || (p.brand && brands.includes(p.brand))),
      )
      .sort(cmp)
  }, [base, q, min, max, rating, brands, sort])
  // `results` is a dependency on purpose: Gary gets a new mood each time the results change.
  const sortNote = useMemo(() => SILLY_SORT_NOTES[sort]?.(), [sort, results])

  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const shown = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const brandLabel = department === 'books' ? 'Author' : 'Brand'

  const chips = [
    q && { label: `“${q}”`, clear: { q: null } },
    department && !category && { label: departmentName(department), clear: { department: null, brand: null } },
    category && { label: categoryName(category), clear: { category: null, brand: null } },
    (min || max) && { label: `$${min || '0'} – ${max ? '$' + max : 'any'}`, clear: { min: null, max: null } },
    rating > 0 && { label: `${rating}★ & up`, clear: { rating: null } },
    ...brands.map((b) => ({ label: b, clear: { brand: brands.filter((x) => x !== b).join(',') || null } })),
  ].filter(Boolean) as { label: string; clear: Record<string, null | string> }[]

  if (error) return <LoadError onRetry={retry} />

  const title = q
    ? `Results for “${q}”`
    : category
      ? categoryName(category)
      : department
        ? departmentName(department)
        : 'All products'

  const option = (active: boolean) =>
    `flex w-full justify-between gap-2 rounded-lg px-3 py-1.5 text-left ${active ? 'bg-tint font-medium text-tint-ink' : 'hover:bg-soft'}`

  const filters = (
    <div className="space-y-8 text-sm">
      <div>
        <h3 className="mb-3 font-semibold">Department</h3>
        <ul className="space-y-0.5">
          <li>
            <button onClick={() => update({ department: null, category: null, brand: null })} className={option(!department)}>
              All departments
              <span className="text-faint">{searched.length.toLocaleString()}</span>
            </button>
          </li>
          {departments.map((d) => (
            <li key={d.slug}>
              <button
                onClick={() => update({ department: d.slug, category: null, brand: null })}
                className={option(department === d.slug && !category)}
              >
                {d.name}
                <span className="text-faint">{d.count.toLocaleString()}</span>
              </button>
              {department === d.slug && categories.length > 1 && (
                <ul className="mt-0.5 mb-2 ml-3 space-y-0.5 border-l border-line pl-2">
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <button
                        onClick={() => update({ department: d.slug, category: c.slug, brand: null })}
                        className={option(category === c.slug)}
                      >
                        {c.name}
                        <span className="text-faint">{c.count.toLocaleString()}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <PriceFilter key={`${min}-${max}`} min={min} max={max} onApply={(mn, mx) => update({ min: mn, max: mx })} />

      <div>
        <h3 className="mb-3 font-semibold">Customer rating</h3>
        <div className="space-y-1">
          {[4, 3, 2].map((r) => (
            <button
              key={r}
              onClick={() => update({ rating: rating === r ? null : String(r) })}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 ${rating === r ? 'bg-tint font-medium text-tint-ink' : 'hover:bg-soft'}`}
            >
              <span className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i <= r ? 'fill-amber-400 text-amber-400' : 'fill-line text-line dark:fill-slate-700 dark:text-slate-700'}
                  />
                ))}
              </span>
              & up
            </button>
          ))}
        </div>
      </div>

      {brandOptions.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold">{brandLabel}</h3>
          <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {brandOptions.map(([b, n]) => (
              <li key={b}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-1.5 hover:bg-soft">
                  <input
                    type="checkbox"
                    checked={brands.includes(b)}
                    onChange={(e) =>
                      update({
                        brand: (e.target.checked ? [...brands, b] : brands.filter((x) => x !== b)).join(',') || null,
                      })
                    }
                    className="size-4 rounded accent-brand-600"
                  />
                  <span className="flex-1 truncate">{b}</span>
                  <span className="text-faint">{n}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  return (
    <div className="pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-muted">{data ? `${results.length.toLocaleString()} product${results.length === 1 ? '' : 's'}` : 'Loading…'}</p>
          {sortNote && <p className="mt-1 text-sm font-medium text-tint-ink">{sortNote}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium lg:hidden"
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
          <select
            value={sort}
            onChange={(e) => update({ sort: e.target.value === 'featured' ? null : e.target.value })}
            className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium outline-none focus:ring-4 focus:ring-focus"
          >
            {Object.entries(SORTS).map(([k, s]) => (
              <option key={k} value={k}>
                Sort: {k === 'featured' && q ? 'Best match' : s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {egg && (
        <div className="animate-pop-in mt-6 flex items-center gap-4 rounded-3xl bg-gradient-to-r from-brand-700 to-brand-500 p-6 text-white shadow-lg">
          <span className="text-5xl">{egg.emoji}</span>
          <div>
            <p className="text-xl font-black">{egg.title}</p>
            {egg.text && <p className="text-white/85">{egg.text}</p>}
            {egg.link && (
              <Link to={egg.link.to} className="mt-2 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-bold text-brand-700">
                {egg.link.label}
              </Link>
            )}
          </div>
        </div>
      )}

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button
              key={c.label}
              onClick={() => update(c.clear)}
              className="flex items-center gap-1.5 rounded-full bg-ink py-1 pr-2 pl-3 text-sm text-page hover:bg-body"
            >
              {c.label} <X size={14} />
            </button>
          ))}
          <button onClick={() => setParams({})} className="px-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">
            Clear all
          </button>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>

        <div>
          {!data ? (
            <ProductGridSkeleton count={12} />
          ) : shown.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-faint py-24 text-center">
              <SearchX size={40} className="text-faint" />
              <p className="text-lg font-semibold">No products found</p>
              <p className="text-muted">Try a different search or remove some filters.</p>
              <button
                onClick={() => setParams({})}
                className="mt-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-white"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {shown.map((p, i) => (
                  <Fragment key={p.id}>
                    {(i === 5 || i === 17) && <AdCard index={page * 2 + (i === 5 ? 0 : 1)} />}
                    <ProductCard p={p} />
                  </Fragment>
                ))}
              </div>
              {pages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => update({ page: String(page - 1) })}
                    className="grid size-10 place-items-center rounded-full hover:bg-surface disabled:opacity-30"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {pageList(page, pages).map((n, i) =>
                    n === null ? (
                      <span key={`gap${i}`} className="w-6 text-center text-faint">
                        …
                      </span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => update({ page: n === 1 ? null : String(n) })}
                        className={`h-10 min-w-10 rounded-full px-2 text-sm font-medium ${n === page ? 'bg-ink text-page' : 'hover:bg-surface'}`}
                      >
                        {n}
                      </button>
                    ),
                  )}
                  <button
                    disabled={page >= pages}
                    onClick={() => update({ page: String(page + 1) })}
                    className="grid size-10 place-items-center rounded-full hover:bg-surface disabled:opacity-30"
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-indica-night/40" onClick={() => setFiltersOpen(false)} />
          <div className="animate-pop-in absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-surface p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button onClick={() => setFiltersOpen(false)} className="rounded-full p-2 hover:bg-soft">
                <X size={20} />
              </button>
            </div>
            {filters}
            <button
              onClick={() => setFiltersOpen(false)}
              className="mt-8 w-full rounded-full bg-ink py-3 font-semibold text-page"
            >
              Show {results.length.toLocaleString()} products
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PriceFilter({ min, max, onApply }: { min: string; max: string; onApply: (min: string | null, max: string | null) => void }) {
  const [lo, setLo] = useState(min)
  const [hi, setHi] = useState(max)
  const input =
    'w-full rounded-lg border border-line bg-surface py-2 pr-2 pl-6 outline-none focus:border-brand-500 focus:ring-4 focus:ring-focus'
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onApply(lo || null, hi || null)
      }}
    >
      <h3 className="mb-3 font-semibold">Price</h3>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-faint">$</span>
          <input type="number" min={0} placeholder="Min" value={lo} onChange={(e) => setLo(e.target.value)} className={input} />
        </div>
        <span className="text-faint">–</span>
        <div className="relative flex-1">
          <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-faint">$</span>
          <input type="number" min={0} placeholder="Max" value={hi} onChange={(e) => setHi(e.target.value)} className={input} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[
          ['Under $25', null, '25'],
          ['$25–100', '25', '100'],
          ['$100–500', '100', '500'],
          ['$500+', '500', null],
        ].map(([label, a, b]) => (
          <button
            type="button"
            key={label}
            onClick={() => onApply(a, b)}
            className="rounded-full border border-line px-2.5 py-1 text-xs hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400"
          >
            {label}
          </button>
        ))}
      </div>
      <button className="mt-3 w-full rounded-lg bg-soft py-2 font-medium hover:bg-line">Apply</button>
    </form>
  )
}
