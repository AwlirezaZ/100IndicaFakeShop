import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Product } from './api'

export interface CartItem {
  id: number
  title: string
  brand?: string
  thumbnail: string
  price: number
  stock: number
  qty: number
}

export interface Address {
  email: string
  fullName: string
  phone: string
  street: string
  city: string
  state: string
  zip: string
  country: string
}

export type ShippingMethod = 'standard' | 'express' | 'pigeon'

export interface Order {
  id: string
  createdAt: string
  items: CartItem[]
  address: Address
  shippingMethod: ShippingMethod
  subtotal: number
  shipping: number
  /** Optional: orders placed before gift wrap existed don't have these. */
  giftWrap?: number
  giftWrapLabel?: string
  tip?: number
  tax: number
  total: number
  payment: { brand: string; last4: string; holder: string }
}

// Falls back to memory if the browser blocks localStorage (e.g. strict privacy settings).
function safeStorage(): Storage | Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  try {
    localStorage.setItem('__test', '1')
    localStorage.removeItem('__test')
    return localStorage
  } catch {
    const mem = new Map<string, string>()
    return {
      getItem: (k) => mem.get(k) ?? null,
      setItem: (k, v) => void mem.set(k, v),
      removeItem: (k) => void mem.delete(k),
    }
  }
}

interface ShopState {
  cart: CartItem[]
  orders: Order[]
  cartOpen: boolean
  addToCart: (p: Product, qty?: number) => void
  setQty: (id: number, qty: number) => void
  remove: (id: number) => void
  clearCart: () => void
  setCartOpen: (open: boolean) => void
  addOrder: (o: Order) => void
}

export const useShop = create<ShopState>()(
  persist(
    (set) => ({
      cart: [],
      orders: [],
      cartOpen: false,
      addToCart: (p, qty = 1) =>
        set((s) => {
          if (p.stock <= 0) return s
          const existing = s.cart.find((i) => i.id === p.id)
          if (existing) {
            return {
              cart: s.cart.map((i) =>
                i.id === p.id ? { ...i, qty: Math.min(i.qty + qty, i.stock) } : i,
              ),
            }
          }
          const item: CartItem = {
            id: p.id,
            title: p.title,
            brand: p.brand,
            thumbnail: p.thumbnail,
            price: p.price,
            stock: p.stock,
            qty: Math.min(qty, p.stock),
          }
          return { cart: [...s.cart, item] }
        }),
      setQty: (id, qty) =>
        set((s) => ({
          cart: s.cart.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.stock)) } : i)),
        })),
      remove: (id) => set((s) => ({ cart: s.cart.filter((i) => i.id !== id) })),
      clearCart: () => set({ cart: [] }),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      addOrder: (o) => set((s) => ({ orders: [o, ...s.orders] })),
    }),
    {
      name: 'shopnest',
      storage: createJSONStorage(safeStorage),
      partialize: (s) => ({ cart: s.cart, orders: s.orders }),
    },
  ),
)

export const FREE_SHIPPING_MIN = 50
export const TAX_RATE = 0.08

export const SHIPPING_LABELS: Record<ShippingMethod, string> = {
  standard: 'Standard',
  express: 'Gary (express-ish)',
  pigeon: 'Carrier pigeon',
}

export const GIFT_WRAPS = [
  { id: 'none', label: 'No gift wrap', price: 0 },
  { id: 'gary', label: 'Wrapped by Gary (badly)', price: 0 },
  { id: 'newspaper', label: 'Newspaper from 1997', price: 1.99 },
  { id: 'box', label: 'Inside a much bigger box', price: 2.99 },
] as const
export type GiftWrapId = (typeof GIFT_WRAPS)[number]['id']

export function computeTotals(items: CartItem[], method: ShippingMethod = 'standard', wrap: GiftWrapId = 'none', tipPct = 0) {
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0)
  const shipping =
    items.length === 0 || method === 'pigeon'
      ? 0
      : method === 'express'
        ? 14.99
        : subtotal >= FREE_SHIPPING_MIN
          ? 0
          : 4.99
  const giftWrap = GIFT_WRAPS.find((w) => w.id === wrap)?.price ?? 0
  const tax = subtotal * TAX_RATE
  const tip = subtotal * tipPct
  return { subtotal, shipping, giftWrap, tip, tax, total: subtotal + shipping + giftWrap + tip + tax }
}

export function deliveryEstimate(createdAt: string, method: ShippingMethod) {
  const d = new Date(createdAt)
  d.setDate(d.getDate() + ({ express: 2, standard: 6, pigeon: 14 } as const)[method])
  const date = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return method === 'pigeon' ? `${date} (pigeon permitting)` : date
}

// IndiCoins: 1 coin per dollar spent, worth exactly $0.00.
export const COIN_LEVELS = [
  { min: 0, name: 'Bronze', emoji: '🥉' },
  { min: 100, name: 'Couch Potato', emoji: '🥔' },
  { min: 500, name: 'Snack Enthusiast', emoji: '🍿' },
  { min: 2000, name: 'Legendary Snacker', emoji: '🏆' },
  { min: 10000, name: 'Fully Charged', emoji: '⚡' },
]

export const coinsFor = (order: Pick<Order, 'total'>) => Math.floor(order.total)

export function coinStatus(orders: Order[]) {
  const coins = orders.reduce((n, o) => n + coinsFor(o), 0)
  const i = COIN_LEVELS.filter((l) => coins >= l.min).length - 1
  return { coins, level: COIN_LEVELS[i], next: COIN_LEVELS[i + 1] }
}
