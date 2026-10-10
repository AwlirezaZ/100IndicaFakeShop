import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { departmentName, money, useProducts } from '../lib/api'
import { coinStatus, SHIPPING_LABELS, useShop, type ShippingMethod } from '../lib/store'

const SLIDE_MS = 4500

const PERSONAS: Record<string, { emoji: string; name: string; text: string }> = {
  books: { emoji: '📚', name: 'The Reader Who Doesn’t Read', text: 'Your bookshelf is gorgeous. The books are still in their wrapping.' },
  grocery: { emoji: '🍿', name: 'The Midnight Snacker', text: 'You don’t shop. You forage.' },
  electronics: { emoji: '🔌', name: 'The Gadget Goblin', text: 'Your drawer of cables has its own drawer of cables.' },
  beauty: { emoji: '💅', name: 'The Self-Care Icon', text: 'Moisturised. Unbothered. Thriving.' },
  fashion: { emoji: '🕶️', name: 'The Drip Lord', text: 'You dress for the job you want: celebrity.' },
  home: { emoji: '🛋️', name: 'The Cushion Collector', text: 'One more throw pillow and the sofa disappears.' },
  sports: { emoji: '🏋️', name: 'The Weekend Warrior (On Paper)', text: 'Bought the gear. That counts as exercise, right?' },
  other: { emoji: '🌀', name: 'The Chaos Shopper', text: 'Nobody, including you, knows what you’re doing.' },
}

const GRADIENTS = [
  'from-brand-700 to-brand-500',
  'from-rose-500 to-orange-400',
  'from-emerald-500 to-cyan-500',
  'from-amber-400 to-rose-500',
  'from-sky-500 to-indigo-600',
  'from-brand-500 to-brand-900',
  'from-lime-400 to-emerald-600',
  'from-orange-500 to-red-600',
  'from-brand-800 to-indica-night',
]

export default function Wrapped() {
  const orders = useShop((s) => s.orders)
  const { data } = useProducts()
  const [slide, setSlide] = useState(0)
  const [run, setRun] = useState(0)

  const stats = useMemo(() => {
    if (!orders.length) return null
    const byId = new Map((data ?? []).map((p) => [p.id, p]))
    const items = orders.flatMap((o) => o.items)
    const deptQty = new Map<string, number>()
    for (const i of items) {
      const d = byId.get(i.id)?.department ?? 'other'
      deptQty.set(d, (deptQty.get(d) ?? 0) + i.qty)
    }
    const [topDept, topQty] = [...deptQty.entries()].sort((a, b) => b[1] - a[1])[0]
    const methods = new Map<ShippingMethod, number>()
    for (const o of orders) methods.set(o.shippingMethod, (methods.get(o.shippingMethod) ?? 0) + 1)
    const favMethod = [...methods.entries()].sort((a, b) => b[1] - a[1])[0][0]
    return {
      orders: orders.length,
      items: items.reduce((n, i) => n + i.qty, 0),
      spent: orders.reduce((n, o) => n + o.total, 0),
      topDept,
      topQty,
      fanciest: [...items].sort((a, b) => b.price - a.price)[0],
      favMethod,
      coins: coinStatus(orders),
      persona: PERSONAS[topDept] ?? PERSONAS.other,
    }
  }, [orders, data])

  const slides = stats
    ? [
        { emoji: '🎁', title: 'Your 100Indica Wrapped', text: 'Let’s look back at your (completely fake) shopping year.' },
        {
          emoji: '🛍️',
          title: `You placed ${stats.orders} order${stats.orders === 1 ? '' : 's'}`,
          text: `and bought ${stats.items} thing${stats.items === 1 ? '' : 's'} you probably didn’t need.`,
        },
        { emoji: '💸', title: `You spent ${money(stats.spent)}`, text: 'Real money spent: $0.00. Financially, you’re a genius.' },
        { emoji: '🏆', title: `Your top department: ${departmentName(stats.topDept)}`, text: `${stats.topQty} item${stats.topQty === 1 ? '' : 's'}. We see you. 👀` },
        {
          emoji: '✨',
          title: 'Your fanciest purchase',
          text: `${stats.fanciest.title} — ${money(stats.fanciest.price)}`,
          image: stats.fanciest.thumbnail,
        },
        {
          emoji: '🛵',
          title: `Gary got lost ${stats.orders * 4} times`,
          text: `delivering your orders. Your favourite delivery method: ${SHIPPING_LABELS[stats.favMethod] ?? stats.favMethod}.`,
        },
        {
          emoji: '💰',
          title: `You earned ${stats.coins.coins.toLocaleString()} IndiCoins`,
          text: `Total value: $0.00. Status: ${stats.coins.level.emoji} ${stats.coins.level.name}.`,
        },
        { emoji: stats.persona.emoji, title: `You are: ${stats.persona.name}`, text: stats.persona.text },
        { emoji: '💜', title: 'See you next year!', text: 'Gary will still be lost. You are in the top 100% of 100Indica Shop customers.' },
      ]
    : []
  const last = slides.length - 1

  useEffect(() => {
    if (!slides.length || slide >= last) return
    const t = setTimeout(() => setSlide((s) => s + 1), SLIDE_MS)
    return () => clearTimeout(t)
  }, [slide, last, slides.length, run])

  if (!stats) {
    return (
      <div className="mx-auto max-w-md py-32 text-center">
        <div className="text-6xl">🎁</div>
        <h1 className="mt-4 text-3xl font-bold">Nothing to wrap yet</h1>
        <p className="mt-2 text-muted">Place an order first. Your Wrapped is currently as empty as Gary’s map.</p>
        <Link to="/products" className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
          Go shopping
        </Link>
      </div>
    )
  }

  const s = slides[slide]

  return (
    <div className="flex justify-center pt-8">
      <div
        className={`relative flex aspect-[9/16] w-full max-w-sm cursor-pointer flex-col overflow-hidden rounded-3xl bg-gradient-to-br p-8 text-white shadow-2xl transition-colors duration-500 select-none ${GRADIENTS[slide % GRADIENTS.length]}`}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const back = e.clientX - rect.left < rect.width / 3
          setSlide((n) => Math.max(0, Math.min(last, n + (back ? -1 : 1))))
        }}
      >
        {/* Story progress bars */}
        <div className="absolute inset-x-4 top-4 flex gap-1">
          {slides.map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                key={`${i}-${slide}-${run}`}
                className="h-full bg-white"
                style={{
                  width: i < slide ? '100%' : '0%',
                  animation: i === slide && slide < last ? `wrapped-progress ${SLIDE_MS}ms linear forwards` : undefined,
                  ...(i === slide && slide === last ? { width: '100%' } : {}),
                }}
              />
            </div>
          ))}
        </div>

        <div key={slide} className="animate-pop-in my-auto text-center">
          <div className="text-7xl">{s.emoji}</div>
          {s.image && <img src={s.image} alt="" className="mx-auto mt-5 size-36 rounded-2xl bg-white/90 object-contain p-2 shadow-xl" />}
          <h1 className="mt-6 text-3xl leading-tight font-black">{s.title}</h1>
          <p className="mt-3 text-lg text-white/85">{s.text}</p>
        </div>

        {slide === last ? (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setSlide(0)
                setRun((r) => r + 1)
              }}
              className="flex-1 rounded-full bg-white/20 py-3 font-semibold backdrop-blur hover:bg-white/30"
            >
              Watch again
            </button>
            <Link to="/products" className="flex-1 rounded-full bg-white py-3 text-center font-semibold text-slate-900 hover:bg-white/90">
              Keep shopping
            </Link>
          </div>
        ) : (
          <p className="text-center text-xs text-white/60">Tap to continue · tap the left side to go back</p>
        )}
      </div>
    </div>
  )
}
