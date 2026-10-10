import { ChevronRight, RotateCcw, ShieldCheck, ShoppingBag, Truck, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAchievements } from '../lib/achievements'
import ProductCard from '../components/ProductCard'
import { GaryReview, NotifyPriceDrop, PotatoCompare, ProductQA, SizeGuide, TryItOn } from '../components/ProductExtras'
import IndiLater from '../components/IndiLater'
import { Helpful, Hesitation, ShrinkNotice, shrinkFactor, shrinkValue, useRevisits, WarrantyLadder, Waitlist, WriteReview } from '../components/Trolls'
import QtyStepper from '../components/QtyStepper'
import SneakyPrice from '../components/SneakyPrice'
import Stars from '../components/Stars'
import { Loading, LoadError } from '../components/States'
import { categoryName, money, originalPrice, useProducts, type Product } from '../lib/api'
import { useShop } from '../lib/store'

export default function ProductDetail() {
  const { id } = useParams()
  const { data, error, retry } = useProducts()

  if (error) return <LoadError onRetry={retry} />
  if (!data) return <Loading label="Loading product…" />

  const p = data.find((x) => String(x.id) === id)
  if (!p) {
    return (
      <div className="py-32 text-center">
        <p className="text-lg font-medium">We couldn't find that product.</p>
        <Link to="/products" className="mt-4 inline-block font-medium text-brand-600 dark:text-brand-400 hover:underline">
          Browse all products
        </Link>
      </div>
    )
  }

  const related = data.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4)
  return <Detail key={p.id} p={p} related={related} weird={weirdPicks(data, p)} />
}

const WEIRD_CAPTIONS = [
  'Bought by 1 confused person',
  'Pairs perfectly. Trust us.',
  'Gary’s personal favourite',
  'Frequently bought at 3 a.m.',
  'Our algorithm is doing its best',
  'You’ll need this. Somehow.',
  'Customers cried, then bought this',
]

/** "Customers also bought": random products from *other* departments, the same each time for a given product. */
function weirdPicks(data: Product[], p: Product) {
  let seed = p.id * 9301 + 49297
  const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280
  const others = data.filter((x) => x.department !== p.department)
  const want = Math.min(4, new Set(others.map((o) => o.department)).size)
  const picks: Product[] = []
  while (picks.length < want) {
    const x = others[Math.floor(rand() * others.length)]
    if (!picks.some((y) => y.department === x.department)) picks.push(x)
  }
  const offset = Math.floor(rand() * WEIRD_CAPTIONS.length)
  return picks.map((x, i) => ({ product: x, caption: WEIRD_CAPTIONS[(offset + i) % WEIRD_CAPTIONS.length] }))
}

function Detail({ p, related, weird }: { p: Product; related: Product[]; weird: { product: Product; caption: string }[] }) {
  const [img, setImg] = useState(0)
  const [qty, setQty] = useState(1)
  const addToCart = useShop((s) => s.addToCart)
  const setCartOpen = useShop((s) => s.setCartOpen)
  const navigate = useNavigate()
  const discount = Math.round(p.discountPercentage)
  const images = p.images.length ? p.images : [p.thumbnail]
  // Full-size photos are remote; fall back to the bundled thumbnail if the image host is unreachable.
  const toThumb = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.src !== p.thumbnail) e.currentTarget.src = p.thumbnail
  }
  const countProductView = useAchievements((s) => s.countProductView)
  const revisits = useRevisits(p.id)
  const shrink = shrinkFactor(p.id === 999999 ? 0 : revisits)

  useEffect(() => {
    countProductView()
  }, [countProductView])

  return (
    <div className="pt-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted">
        <Link to="/" className="hover:text-ink">Home</Link>
        <ChevronRight size={14} />
        <Link to={`/products?category=${p.category}`} className="hover:text-ink">
          {categoryName(p.category)}
        </Link>
        <ChevronRight size={14} />
        <span className="truncate text-ink">{p.title}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden rounded-3xl border border-line bg-well">
            <img src={images[img]} alt={p.title} onError={toThumb} className="animate-fade-in size-full object-contain p-8" key={img} />
          </div>
          {images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setImg(i)}
                  className={`size-20 shrink-0 overflow-hidden rounded-xl border-2 bg-well p-1 transition ${i === img ? 'border-brand-500' : 'border-transparent hover:border-faint'}`}
                >
                  <img src={src} alt="" onError={toThumb} className="size-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {p.brand && <p className="text-sm font-semibold tracking-wide text-brand-600 uppercase dark:text-brand-400">{p.brand}</p>}
          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">{p.title}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Stars rating={p.rating} />
            <span className="font-medium">{p.rating.toFixed(1)}</span>
            <a href="#reviews" onClick={(e) => { e.preventDefault(); document.getElementById('reviews')?.scrollIntoView() }} className="text-muted hover:underline">
              {p.ratingCount.toLocaleString()} ratings
            </a>
          </div>

          <div className="mt-6 flex items-end gap-3">
            <SneakyPrice price={p.price} className="text-4xl font-bold" />
            {discount >= 5 && (
              <>
                <p className="pb-1 text-lg text-faint line-through">{money(originalPrice(p))}</p>
                <span className="mb-1.5 rounded-full bg-rose-100 px-2.5 py-0.5 text-sm font-semibold text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                  Save {discount}%
                </span>
              </>
            )}
          </div>
          <IndiLater className="mt-2" />
          <ShrinkNotice p={p} revisits={revisits} />

          <p className="mt-6 leading-relaxed text-body">{p.description}</p>

          {p.details && p.details.length > 0 && (
            <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-2xl bg-soft p-4 text-sm">
              {p.details.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium">
                    {label === 'Nutri-Score' ? (
                      <span
                        className={`inline-grid size-6 place-items-center rounded-md text-xs font-bold text-white ${
                          { A: 'bg-emerald-600', B: 'bg-lime-500', C: 'bg-yellow-500', D: 'bg-orange-500', E: 'bg-red-600' }[value]
                        }`}
                      >
                        {value}
                      </span>
                    ) : label === 'Size' || label === 'Pages' ? (
                      shrinkValue(value, shrink)
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <p
            className={`mt-6 text-sm font-medium ${p.stock === 0 ? 'text-rose-600' : p.stock < 10 ? 'text-amber-600' : 'text-emerald-600'}`}
          >
            ●{' '}
            {p.stock === 0
              ? 'Sold out — check back soon'
              : p.stock < 10
                ? `Hurry — only ${p.stock} left in stock`
                : 'In stock, ready to ship'}
          </p>
          {p.stock === 0 && <Waitlist p={p} />}

          <fieldset disabled={p.stock === 0} className="mt-4 flex flex-wrap items-center gap-3 disabled:opacity-40">
            <QtyStepper value={qty} max={p.stock} onChange={setQty} />
            <button
              onClick={() => {
                addToCart(p, qty)
                setCartOpen(true)
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 font-semibold text-page transition hover:bg-body"
            >
              <ShoppingBag size={18} /> Add to cart
            </button>
            <Hesitation className="flex flex-1">
              <button
                onClick={() => {
                  addToCart(p, qty)
                  navigate('/checkout')
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-semibold whitespace-nowrap text-white transition hover:bg-brand-700"
              >
                <Zap size={18} /> Buy now
              </button>
            </Hesitation>
          </fieldset>

          <div className="mt-3 flex flex-wrap gap-2">
            <NotifyPriceDrop />
            <PotatoCompare p={p} />
            <TryItOn p={p} />
            <SizeGuide p={p} />
          </div>
          {p.stock > 0 && <WarrantyLadder p={p} />}

          <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-surface">
            {[
              { icon: Truck, title: 'Delivery', text: p.shippingInformation ?? 'Ships in 3-5 business days' },
              { icon: ShieldCheck, title: 'Warranty', text: p.warrantyInformation ?? 'Standard warranty' },
              { icon: RotateCcw, title: 'Returns', text: p.returnPolicy ?? '30 days return policy' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-center gap-4 p-4">
                <Icon size={20} className="shrink-0 text-brand-600 dark:text-brand-400" />
                <div className="text-sm">
                  <p className="font-medium">{title}</p>
                  <p className="text-muted">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-faint">
            Product info from {p.source}
            {p.source !== 'DummyJSON' && ' · price and stock are simulated'}
          </p>

          {p.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {p.tags.map((t) => (
                <Link
                  key={t}
                  to={`/products?q=${encodeURIComponent(t)}`}
                  className="rounded-full bg-soft px-3 py-1 text-xs font-medium text-body hover:bg-line"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <section id="reviews" className="mt-20 scroll-mt-40">
        <h2 className="text-2xl font-bold tracking-tight">Customer reviews</h2>
        <div className="mt-4 flex items-center gap-3 text-sm text-muted">
          <Stars rating={p.rating} size={16} />
          <span>
            <b className="text-ink">{p.rating.toFixed(1)} out of 5</b> · {p.ratingCount.toLocaleString()} ratings
          </span>
        </div>
        <GaryReview p={p} />
        <WriteReview />
        {p.reviews.length === 0 && <p className="mt-4 text-muted">No written reviews from customers yet.</p>}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {p.reviews.map((r, i) => (
            <div key={i} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-brand-400 font-semibold text-white">
                  {r.reviewerName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{r.reviewerName}</p>
                  <p className="text-xs text-faint">{new Date(r.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-3">
                <Stars rating={r.rating} size={13} />
              </div>
              <p className="mt-2 text-body">{r.comment}</p>
              <Helpful />
            </div>
          ))}
        </div>
      </section>

      <ProductQA p={p} />

      {weird.length > 0 && (
        <section className="mt-20">
          <h2 className="text-2xl font-bold tracking-tight">Customers who bought this also bought 🤔</h2>
          <p className="mt-1 mb-6 text-muted">Our recommendation algorithm is very confident about this.</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {weird.map(({ product, caption }) => (
              <div key={product.id} className="flex flex-col gap-2">
                <p className="text-center text-xs font-medium text-tint-ink italic">“{caption}”</p>
                <ProductCard p={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((r) => (
              <ProductCard key={r.id} p={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
