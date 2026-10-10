import { ShoppingBag, Trash2, Truck, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { unlock } from '../lib/achievements'
import { money, useProducts, type Product } from '../lib/api'
import { computeTotals, FREE_SHIPPING_MIN, useShop, type CartItem } from '../lib/store'
import QtyStepper from './QtyStepper'

const BREAKUP_REASONS = ['It’s not you, it’s me', 'I found someone cheaper', 'I need some space', 'Gary told me to']

// Sometimes an item wanders off while the cart is closed.
const WANDERED = [
  'went to get milk. Back in 5 minutes. (It said that 3 hours ago.)',
  'is having a little lie-down.',
  'went to find itself. Spiritually.',
  'is on a smoke break. It doesn’t even smoke.',
  'got distracted by a pigeon.',
]
const FOUND = ['Found it behind the fridge.', 'It was in Gary’s pocket. Weird.', 'It came back with a tan.', 'It says it was “just looking around”.']

/** A sarcastic comment about what's in the cart. */
function judge(cart: CartItem[], byId: Map<number, Product>, subtotal: number) {
  const qtyWhere = (test: (p: Product) => boolean) =>
    cart.reduce((n, i) => {
      const p = byId.get(i.id)
      return p && test(p) ? n + i.qty : n
    }, 0)
  const total = cart.reduce((n, i) => n + i.qty, 0)
  const dept = (d: string) => qtyWhere((p) => p.department === d)
  const cheese = qtyWhere((p) => p.category === 'cheese')

  if (subtotal > 2000) return 'Big spender! Shame it’s all fake money. 💸'
  if (total >= 10) return `That’s ${total} things. Are you opening your own shop?`
  if (cheese >= 2) return `${cheese} cheeses? Rough week? 🧀`
  if (dept('books') >= 3) return `${dept('books')} books. Sure, you’ll read them all. 😏`
  if (dept('books') && dept('grocery')) return 'Snacks and a book. Honestly? Respect. 📚🍿'
  if (dept('grocery') >= 3) return 'That’s a lot of snacks. No judgment. (Some judgment.)'
  if (dept('electronics')) return 'Another gadget? Your drawer of tangled cables says hi. 🔌'
  if (dept('beauty')) return 'Self-care! Gary approves. 💅'
  if (dept('fashion')) return 'Ooh, fancy. Who are we dressing up for? 👀'
  if (subtotal < 5) return `Bold move, spending ${money(subtotal)} like that.`
  return 'Interesting choices. Very… interesting. 🤔'
}

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, setQty, remove } = useShop()
  const navigate = useNavigate()
  const { data } = useProducts()
  const byId = useMemo(() => new Map((data ?? []).map((p) => [p.id, p])), [data])
  const [breakingUp, setBreakingUp] = useState<number | null>(null)
  const [wanderer, setWanderer] = useState<{ id: number; text: string; back?: boolean } | null>(null)

  // Each time the cart opens there's a 1 in 4 chance one item has wandered off.
  useEffect(() => {
    if (!cartOpen) return setWanderer(null)
    const items = useShop.getState().cart
    if (items.length && Math.random() < 0.25) {
      const i = items[Math.floor(Math.random() * items.length)]
      setWanderer({ id: i.id, text: WANDERED[Math.floor(Math.random() * WANDERED.length)] })
    }
  }, [cartOpen])

  const callBack = () => {
    setWanderer((w) => w && { ...w, back: true, text: FOUND[Math.floor(Math.random() * FOUND.length)] })
    setTimeout(() => setWanderer(null), 1800)
  }
  const { subtotal } = computeTotals(cart)
  const toFree = FREE_SHIPPING_MIN - subtotal

  useEffect(() => {
    if (!cartOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCartOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [cartOpen, setCartOpen])

  if (!cartOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="animate-fade-in absolute inset-0 bg-indica-night/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
      <aside className="animate-slide-in absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-semibold">Your cart</h2>
          <button onClick={() => setCartOpen(false)} className="rounded-full p-2 hover:bg-soft" aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-soft text-faint">
              <ShoppingBag size={28} />
            </div>
            <p className="font-medium">Your cart is empty</p>
            <p className="text-sm text-muted">Find something you love and it'll show up here.</p>
            <Link
              to="/products"
              onClick={() => setCartOpen(false)}
              className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-line px-6 py-3 text-sm">
              <div className="flex items-center gap-2 text-body">
                <Truck size={16} className="text-brand-600 dark:text-brand-400" />
                {toFree > 0 ? (
                  <span>
                    Add <b>{money(toFree)}</b> more for free shipping
                  </span>
                ) : (
                  <span className="font-medium text-emerald-600">You've unlocked free shipping!</span>
                )}
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-soft">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all"
                  style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_MIN) * 100)}%` }}
                />
              </div>
            </div>
            <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-2xl bg-tint p-3 text-sm">
              <span className="text-xl leading-none">🧐</span>
              <p>
                <span className="block text-xs font-semibold text-tint-ink">100Indica thinks:</span>
                {judge(cart, byId, subtotal)}
              </p>
            </div>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {cart.map((i) => (
                <li key={i.id} className="relative flex gap-4 py-4">
                  {wanderer?.id === i.id && (
                    <div className="animate-pop-in absolute inset-0 z-10 flex flex-col justify-center gap-2 rounded-2xl bg-surface/95 p-3 backdrop-blur">
                      {wanderer.back ? (
                        <p className="text-sm font-semibold">🎉 {wanderer.text}</p>
                      ) : (
                        <>
                          <p className="text-sm">
                            🚶 <b className="line-clamp-1 inline">{i.title}</b> {wanderer.text}
                          </p>
                          <button onClick={callBack} className="w-fit rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700">
                            Call it back
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {breakingUp === i.id && (
                    <div className="animate-pop-in absolute inset-0 z-10 flex flex-col justify-center gap-2 rounded-2xl bg-surface/95 p-3 backdrop-blur">
                      <p className="text-sm font-semibold">Wait! What did I do wrong? 🥺</p>
                      <div className="flex flex-wrap gap-1.5">
                        {BREAKUP_REASONS.map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              remove(i.id)
                              setBreakingUp(null)
                              unlock('cart-abandoner')
                            }}
                            className="rounded-full border border-line px-2.5 py-1 text-xs hover:border-rose-400 hover:text-rose-600"
                          >
                            {r}
                          </button>
                        ))}
                        <button
                          onClick={() => setBreakingUp(null)}
                          className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                        >
                          Stay 💖
                        </button>
                      </div>
                    </div>
                  )}
                  <Link to={`/product/${i.id}`} onClick={() => setCartOpen(false)} className="shrink-0">
                    <img src={i.thumbnail} alt="" className="size-20 rounded-xl bg-well object-contain" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-medium">{i.title}</p>
                      <button onClick={() => setBreakingUp(i.id)} className="h-fit text-faint hover:text-rose-500" aria-label="Remove">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {i.brand && <p className="text-xs text-muted">{i.brand}</p>}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <QtyStepper small value={i.qty} max={i.stock} onChange={(n) => setQty(i.id, n)} />
                      <p className="font-semibold">{money(i.price * i.qty)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-line p-6">
              <div className="flex justify-between text-base">
                <span className="text-body">Subtotal</span>
                <span className="font-semibold">{money(subtotal)}</span>
              </div>
              <p className="text-xs text-muted">Shipping and taxes calculated at checkout.</p>
              <button
                onClick={() => {
                  setCartOpen(false)
                  navigate('/checkout')
                }}
                className="w-full rounded-full bg-ink py-3.5 font-semibold text-page transition hover:bg-brand-600 hover:text-white"
              >
                Checkout
              </button>
              <button
                onClick={() => setCartOpen(false)}
                className="w-full py-1 text-sm font-medium text-body hover:text-ink"
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
