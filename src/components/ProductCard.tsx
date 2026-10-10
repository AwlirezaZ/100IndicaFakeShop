import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { money, originalPrice, type Product } from '../lib/api'
import { useShop } from '../lib/store'
import SneakyPrice from './SneakyPrice'
import Stars from './Stars'

const compact = new Intl.NumberFormat('en-US', { notation: 'compact' })

// What a product says when you hover over its photo for a moment.
const PLEAS = [
  'Pick me! 🥺',
  'I’ve been on this shelf since 2019.',
  'Take me home. I’m house-trained.',
  'Don’t look at the potato. Look at me.',
  'I’d look great in your cart.',
  'Psst. Gary dropped me once. I’m fine.',
  'Buy me and I’ll stop talking.',
]

const isMonday = new Date().getDay() === 1

export default function ProductCard({ p }: { p: Product }) {
  const addToCart = useShop((s) => s.addToCart)
  const setCartOpen = useShop((s) => s.setCartOpen)
  const discount = Math.round(p.discountPercentage)
  const [plea, setPlea] = useState<string | null>(null)
  const pleaTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(pleaTimer.current), [])

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/70 dark:hover:shadow-black/40">
      <Link
        to={`/product/${p.id}`}
        className="relative block aspect-square overflow-hidden bg-well"
        onMouseEnter={() => {
          pleaTimer.current = setTimeout(() => setPlea(PLEAS[Math.floor(Math.random() * PLEAS.length)]), 700)
        }}
        onMouseLeave={() => {
          clearTimeout(pleaTimer.current)
          setPlea(null)
        }}
      >
        {plea && (
          <span className="animate-pop-in absolute inset-x-3 bottom-3 z-10 rounded-2xl rounded-bl-sm bg-ink px-3 py-2 text-center text-xs font-semibold text-page shadow-lg">
            {plea}
          </span>
        )}
        {isMonday && (
          <span className="absolute bottom-3 left-3 rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-white">
            😩 Monday quality
          </span>
        )}
        <img
          src={p.thumbnail}
          alt={p.title}
          loading="lazy"
          className="absolute inset-0 size-full object-contain p-4 transition duration-300 group-hover:scale-105"
        />
        {discount >= 5 && (
          <span className="absolute top-3 left-3 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
            -{discount}%
          </span>
        )}
        {p.stock === 0 ? (
          <span className="absolute top-3 right-3 rounded-full bg-line px-2 py-0.5 text-xs font-medium text-body">
            Sold out
          </span>
        ) : (
          p.stock < 10 && (
            <span className="absolute top-3 right-3 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Only {p.stock} left
            </span>
          )
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        {p.brand && <p className="text-xs font-medium tracking-wide text-muted uppercase">{p.brand}</p>}
        <Link to={`/product/${p.id}`} className="mt-1 line-clamp-2 leading-snug font-medium hover:text-brand-600 dark:hover:text-brand-400">
          {p.title}
        </Link>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <Stars rating={p.rating} size={12} />
          <span>{p.rating.toFixed(1)}</span>
          <span>({compact.format(p.ratingCount)})</span>
        </div>
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <SneakyPrice price={p.price} className="block text-lg font-bold" />
            {discount >= 5 && <p className="text-xs text-faint line-through">{money(originalPrice(p))}</p>}
          </div>
          <button
            onClick={() => {
              addToCart(p)
              setCartOpen(true)
            }}
            disabled={p.stock === 0}
            className="grid size-10 place-items-center rounded-full bg-ink text-page transition hover:bg-brand-600 hover:text-white active:scale-95 disabled:bg-line disabled:text-faint"
            aria-label={`Add ${p.title} to cart`}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
