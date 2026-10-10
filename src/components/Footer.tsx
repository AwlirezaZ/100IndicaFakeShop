import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { REOPEN_EVENT } from './CookieBanner'
import { logo, OWNER_INSTAGRAM } from '../lib/brand'
import { InstagramIcon } from './Icons'
import { countVisit } from '../lib/visits'

/** A 90s-style "You are visitor #0001337" odometer. Also where the visit gets counted (see lib/visits.ts). */
function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    let alive = true
    void countVisit().then((n) => alive && setCount(n))
    return () => {
      alive = false
    }
  }, [])
  if (count === null) return null
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-6 text-xs text-faint">
      <span>🎉 Congratulations! You are visitor</span>
      <span className="flex gap-0.5 rounded-md bg-black p-1 font-mono text-sm font-bold text-indica-green shadow-inner" aria-label={String(count)}>
        {String(count).padStart(7, '0').split('').map((d, i) => (
          <span key={i} className="rounded-sm bg-white/10 px-1">
            {d}
          </span>
        ))}
      </span>
      <span>(No prize. Obviously.)</span>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 text-sm text-muted md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 text-ink">
            <img src={logo} alt="" className="size-9" />
            <span className="text-lg font-bold">100Indica Shop</span>
          </div>
          <p className="mt-3 max-w-sm">
            A demo online store with real products from free open-data sources — DummyJSON, Open Library, Open Food
            Facts and Open Beauty Facts. Prices are made up and checkout is fully simulated: no real payments are ever made.
          </p>
        </div>
        <div>
          <p className="font-semibold text-ink">Help</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link to="/about" className="hover:text-ink">
                👋 About us
              </Link>
            </li>
            <li>
              <Link to="/achievements" className="hover:text-ink">
                🏆 Trophy cabinet
              </Link>
            </li>
            <li>
              <Link to="/returns" className="hover:text-ink">
                📦 Returns & refunds
              </Link>
            </li>
            <li>
              <button onClick={() => window.dispatchEvent(new Event(REOPEN_EVENT))} className="hover:text-ink">
                🍪 Cookie settings
              </button>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-ink">We accept</p>
          <p className="mt-3">Any card you can imagine 💳</p>
          <p className="mt-6 font-semibold text-ink">Follow the owner</p>
          <a href={OWNER_INSTAGRAM} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 hover:text-ink">
            <InstagramIcon /> @100indica
          </a>
        </div>
      </div>
      <div className="border-t border-line">
        <VisitorCounter />
      </div>
      <p className="py-6 text-center text-xs text-faint">
        © {new Date().getFullYear()} 100Indica Shop · Demo only · Made for{' '}
        <a href={OWNER_INSTAGRAM} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-ink">
          @100indica
        </a>
      </p>
    </footer>
  )
}
