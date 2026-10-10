import { ArrowRight, Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import ProductCard from '../components/ProductCard'
import { LoadError, ProductGridSkeleton } from '../components/States'
import { AdBanner } from '../components/Ads'
// `?inline` so the single-file build carries the banner itself (see lib/brand.ts).
import banner from '../assets/banner.jpg?inline'
import { getDepartments, money, MYSTERY_ID, ratingScore, useProducts, type Product } from '../lib/api'

function Section({ title, link, children }: { title: string; link?: string; children: React.ReactNode }) {
  return (
    <section className="mt-16">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {link && (
          <Link to={link} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:gap-2 dark:text-brand-400">
            View all <ArrowRight size={16} className="transition-all" />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function Row({ items }: { items: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  )
}

const top = (items: Product[], n: number, by: (a: Product, b: Product) => number) => [...items].sort(by).slice(0, n)

export default function Home() {
  const { data, error, retry } = useProducts()

  const home = useMemo(() => {
    if (!data) return null
    const live = data.filter((p) => p.source === 'DummyJSON')
    const inDept = (d: string) => data.filter((p) => p.department === d)
    const byScore = (a: Product, b: Product) => ratingScore(b) - ratingScore(a)
    return {
      departments: getDepartments(data).map((d) => {
        // DummyJSON photos have clean cut-out backgrounds, so prefer them for the tiles.
        const pool = live.some((p) => p.department === d.slug) ? live.filter((p) => p.department === d.slug) : inDept(d.slug)
        return { ...d, image: top(pool, 1, byScore)[0]?.thumbnail }
      }),
      // Alternate studio-shot DummyJSON deals with open-data ones, so the row looks varied.
      deals: (() => {
        const byDeal = (a: Product, b: Product) => b.discountPercentage - a.discountPercentage || byScore(a, b)
        const a = top(live, 4, byDeal)
        const b = top(data.filter((p) => p.source !== 'DummyJSON'), 4, byDeal)
        return a.flatMap((p, i) => [p, b[i]]).filter(Boolean)
      })(),
      topRated: top(live, 8, byScore),
      books: top(inDept('books'), 8, (a, b) => b.ratingCount - a.ratingCount),
      grocery: top(inDept('grocery'), 8, (a, b) => b.ratingCount - a.ratingCount),
      tech: top(inDept('electronics'), 4, byScore),
    }
  }, [data])

  if (error) return <LoadError onRetry={retry} />

  return (
    <div className="pt-6">
      {/* Hero: the 100Indica banner. Its "Shop now" / "Today's deal" buttons are part of the image,
          so transparent links sit on top of them (positions are % of the banner). */}
      <section className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-line">
        <img
          src={banner}
          alt="Buy useless things. Feel something. Fake urges, fake orders: cure your shopoholism."
          width={1920}
          height={960}
          className="block h-auto w-full"
        />
        <Link
          to="/products"
          aria-label="Shop now"
          className="absolute top-[85%] left-[20%] h-[15%] w-[15%] rounded-t-[1.5vw] transition hover:bg-white/20"
        />
        <Link
          to="/products?sort=discount"
          aria-label="Today's deals"
          className="absolute top-[85%] left-[59.5%] h-[15%] w-[15%] rounded-t-[1.5vw] transition hover:bg-white/20"
        />
      </section>
      {/* On phones the drawn buttons are tiny, so add real ones under the banner. */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:hidden">
        <Link to="/products" className="rounded-full bg-indica-green py-3 text-center font-bold text-indica-night">
          Shop now
        </Link>
        <Link to="/products?sort=discount" className="rounded-full bg-brand-600 py-3 text-center font-bold text-white">
          Today's deals
        </Link>
      </div>

      {/* Perks */}
      <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: Truck, title: 'Free shipping', text: 'On orders over $50' },
          { icon: ShieldCheck, title: 'Secure checkout', text: '100% simulated, 0% risk' },
          { icon: RotateCcw, title: '30-day returns', text: 'No questions asked' },
          { icon: Headphones, title: '24/7 support', text: "We're always here" },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-tint text-tint-ink">
              <Icon size={22} />
            </div>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted">{text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Departments */}
      <Section title="Shop by department" link="/products">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {!home
            ? Array.from({ length: 7 }, (_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-soft" />)
            : home.departments.map((d) => (
                <Link
                  key={d.slug}
                  to={`/products?department=${d.slug}`}
                  className="group flex flex-col rounded-2xl border border-line bg-surface p-3 text-center transition hover:border-brand-300 hover:shadow-lg dark:hover:border-brand-500/50"
                >
                  <div className="aspect-square overflow-hidden rounded-xl bg-well p-3">
                    <img src={d.image} alt="" loading="lazy" className="size-full object-contain transition group-hover:scale-110" />
                  </div>
                  <p className="mt-3 text-sm font-semibold">{d.name}</p>
                  <p className="text-xs text-faint">{d.count.toLocaleString()} items</p>
                </Link>
              ))}
        </div>
      </Section>

      <Section title="🔥 Today's deals" link="/products?sort=discount">
        {home ? <Row items={home.deals} /> : <ProductGridSkeleton />}
      </Section>

      {/* IndiBox™ mystery box */}
      <Link
        to={`/product/${MYSTERY_ID}`}
        className="group mt-16 flex flex-wrap items-center gap-6 rounded-3xl bg-gradient-to-r from-indica-night to-brand-600 px-8 py-8 text-white shadow-xl"
      >
        <span className="text-7xl transition-transform group-hover:animate-[wiggle_.3s_infinite]">🎁</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-wide text-white/80 uppercase">New · IndiBox™</p>
          <p className="text-3xl font-black">What’s in the box?</p>
          <p className="text-white/85">One random product from our 10,000. Could be a phone. Could be pimentos. Only {money(9.99)}.</p>
        </div>
        <span className="rounded-full bg-indica-green px-6 py-3 font-bold text-indica-night transition group-hover:scale-105">Feeling lucky →</span>
      </Link>

      <AdBanner index={0} />

      {/* Promo banner — always dark, in both themes */}
      <section className="mt-16 grid overflow-hidden rounded-3xl bg-indica-night text-white ring-1 ring-line md:grid-cols-2">
        <div className="p-10 md:p-14">
          <p className="text-sm font-medium text-indica-green">Tech week</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Upgrade your everyday tech</h2>
          <p className="mt-3 text-brand-200">Phones, laptops and tablets from the brands you trust.</p>
          <Link
            to="/products?department=electronics"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-indica-green px-6 py-3 font-bold text-indica-night transition hover:gap-3"
          >
            Explore tech <ArrowRight size={18} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 bg-brand-900 p-6">
          {home?.tech.map((p) => (
            <Link key={p.id} to={`/product/${p.id}`} className="rounded-2xl bg-white p-3 transition hover:scale-105">
              <img src={p.thumbnail} alt={p.title} loading="lazy" className="aspect-square w-full object-contain" />
            </Link>
          ))}
        </div>
      </section>

      <Section title="📚 Bestselling books" link="/products?department=books&sort=popular">
        {home ? <Row items={home.books} /> : <ProductGridSkeleton />}
      </Section>

      <Section title="⭐ Top rated" link="/products?sort=rating">
        {home ? <Row items={home.topRated} /> : <ProductGridSkeleton />}
      </Section>

      <Section title="🛒 Grocery favourites" link="/products?department=grocery&sort=popular">
        {home ? <Row items={home.grocery} /> : <ProductGridSkeleton />}
      </Section>
    </div>
  )
}
