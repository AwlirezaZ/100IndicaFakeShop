import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { loadProducts, type Product } from '../lib/api'

// Parody of the "someone just bought this!" pop-ups that pushy online shops love.
const PLACES = ['Antarctica', 'the Moon', 'a submarine', 'Narnia', 'Ohio', 'a Wi-Fi-less cabin', 'the year 2087', 'Atlantis']
const NAMES = ['A raccoon', 'Grandma Doris', 'A suspicious pigeon', 'Someone named Steve', 'A very tired penguin', 'Gary’s cousin']

const TEMPLATES: ((p: Product) => { icon: string; text: string })[] = [
  (p) => ({ icon: '🔥', text: `${20 + Math.floor(Math.random() * 80)} people are looking at ${p.title} right now` }),
  (p) => ({ icon: '🐧', text: `Someone in ${pick(PLACES)} just bought ${p.title}` }),
  (p) => ({ icon: '⚡', text: `Only 3 left of ${p.title}! (we have ${(2000 + Math.floor(Math.random() * 8000)).toLocaleString()})` }),
  (p) => ({ icon: '🛒', text: `${pick(NAMES)} just added ${p.title} to their cart` }),
  (p) => ({ icon: '👀', text: `Your neighbour is looking at ${p.title}. Suspicious.` }),
  (p) => ({ icon: '⭐', text: `${pick(NAMES)} rated ${p.title} 5 stars. They didn’t buy it.` }),
  () => ({ icon: '⏰', text: 'Hurry! This deal ends in 23:59:59. (It always says that.)' }),
]

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface Toast {
  key: number
  icon: string
  text: string
  product: Product
}

export default function PressureToasts() {
  const [toast, setToast] = useState<Toast | null>(null)
  const { pathname } = useLocation()
  const quiet = pathname === '/checkout' // don't distract while paying

  useEffect(() => {
    if (quiet) return
    let hide: ReturnType<typeof setTimeout>
    let next: ReturnType<typeof setTimeout>
    let alive = true

    const show = async () => {
      const products = await loadProducts().catch(() => null)
      if (!alive || !products) return
      const product = pick(products)
      setToast({ key: Date.now(), ...pick(TEMPLATES)(product), product })
      hide = setTimeout(() => setToast(null), 7000)
      next = setTimeout(show, 25000 + Math.random() * 20000)
    }

    next = setTimeout(show, 12000)
    return () => {
      alive = false
      clearTimeout(hide)
      clearTimeout(next)
      setToast(null)
    }
  }, [quiet])

  if (!toast) return null

  return (
    <div
      key={toast.key}
      // Top-left, just under the sticky header (its height changes when it wraps on small screens).
      style={{ top: (document.querySelector('header')?.offsetHeight ?? 0) + 16 }}
      className="animate-pop-in fixed left-4 z-30 flex w-[min(340px,calc(100vw-6rem))] items-center gap-3 rounded-2xl border border-line bg-surface p-3 pr-9 shadow-2xl"
    >
      <Link to={`/product/${toast.product.id}`} onClick={() => setToast(null)} className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <img src={toast.product.thumbnail} alt="" className="size-12 rounded-xl bg-well object-contain" />
          <span className="absolute -right-1.5 -bottom-1.5 text-lg">{toast.icon}</span>
        </div>
        <p className="line-clamp-3 text-sm">{toast.text}</p>
      </Link>
      <button
        onClick={() => setToast(null)}
        className="absolute top-2 right-2 rounded-full p-1 text-faint hover:bg-soft hover:text-ink"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}
