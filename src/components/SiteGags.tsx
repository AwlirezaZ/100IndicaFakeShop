import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { unlock } from '../lib/achievements'
import { useCurrency } from '../lib/currency'
import { confetti, playChaChing } from '../lib/fun'
import { logo as logoSrc } from '../lib/brand'

const NEWSLETTER_KEY = '100indica-newsletter'

/** A newsletter pop-up whose "no" button guilt-trips you, parodying shops that do this for real. */
export function NewsletterPopup() {
  const [stage, setStage] = useState<'hidden' | 'ask' | 'sure' | 'joined'>('hidden')
  const [email, setEmail] = useState('')
  const { pathname } = useLocation()

  useEffect(() => {
    let seen = true
    try {
      seen = !!localStorage.getItem(NEWSLETTER_KEY)
    } catch {
      // ignore
    }
    if (seen) return
    const t = setTimeout(function tryShow() {
      // Wait politely if another pop-up is open (or she's paying).
      if (document.querySelector('[data-cookie-banner], .z-\\[55\\]') || location.hash.includes('/checkout')) {
        return void setTimeout(tryShow, 8000)
      }
      setStage('ask')
      try {
        localStorage.setItem(NEWSLETTER_KEY, '1')
      } catch {
        // ignore
      }
    }, 75000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (pathname === '/checkout') setStage((s) => (s === 'ask' || s === 'sure' ? 'hidden' : s))
  }, [pathname])

  if (stage === 'hidden') return null

  return (
    <div className="fixed inset-0 z-[57] grid place-items-center p-4">
      <div className="animate-fade-in absolute inset-0 bg-indica-night/60 backdrop-blur-sm" />
      <div className="animate-pop-in relative w-full max-w-md rounded-3xl bg-surface p-7 text-center shadow-2xl">
        {stage === 'ask' && (
          <>
            <div className="text-5xl">📧</div>
            <h2 className="mt-3 text-2xl font-bold">Want 10% off your next (fake) order?</h2>
            <p className="mt-2 text-body">Join 0 other subscribers. We promise to email you exactly never.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (email.trim()) setStage('joined')
              }}
              className="mt-5 flex flex-col gap-2"
            >
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="h-12 rounded-full border border-line bg-soft px-5 text-center outline-none placeholder:text-faint focus:border-brand-500 focus:ring-4 focus:ring-focus"
              />
              <button className="rounded-full bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700">Sign me up!</button>
            </form>
            <button onClick={() => setStage('sure')} className="mt-3 text-xs text-muted underline hover:text-ink">
              No thanks, I hate saving money
            </button>
          </>
        )}
        {stage === 'sure' && (
          <>
            <div className="text-5xl">🥺</div>
            <h2 className="mt-3 text-2xl font-bold">Are you sure?</h2>
            <p className="mt-2 text-body">Saving money is great. Everyone says so. Even Gary.</p>
            <div className="mt-5 flex flex-col gap-2">
              <button onClick={() => setStage('ask')} className="rounded-full bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700">
                Okay, I love saving money
              </button>
              <button
                onClick={() => {
                  unlock('newsletter-hater')
                  setStage('hidden')
                }}
                className="text-xs text-muted underline hover:text-ink"
              >
                Yes. I enjoy paying full price, like a fool.
              </button>
            </div>
          </>
        )}
        {stage === 'joined' && (
          <>
            <div className="text-5xl">🎉</div>
            <h2 className="mt-3 text-2xl font-bold">You’re in!</h2>
            <p className="mt-2 text-body">Expect 0 emails a week. Your 10% off code is: NOTHING10. It does nothing.</p>
            <button onClick={() => setStage('hidden')} className="mt-5 w-full rounded-full border border-line py-3 font-semibold hover:bg-soft">
              Can’t wait
            </button>
          </>
        )}
        {stage !== 'joined' && (
          <button onClick={() => setStage('hidden')} className="absolute top-3 right-3 rounded-full p-1 text-faint opacity-40 hover:opacity-100" aria-label="Close">
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

/** A little comment that depends on the time and day. */
export function TimeGreeting() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return !!sessionStorage.getItem('100indica-greeting')
    } catch {
      return false
    }
  })
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay()
  const nightOwl = hour < 5

  useEffect(() => {
    if (nightOwl) unlock('night-owl')
  }, [nightOwl])

  const message =
    hour === 3
      ? '🕒 Nothing good is bought at 3 a.m. (Go on then.)'
      : nightOwl
        ? '🌙 Shouldn’t you be asleep? Gary is.'
        : day === 1
          ? '😩 It’s Monday. Everything is Monday quality today.'
          : day === 5
            ? '🎉 It’s Friday! Prices are exactly the same, but it feels better.'
            : (day === 0 || day === 6) && hour < 10
              ? '☕ Early weekend shopping? Respect.'
              : null

  if (!message || dismissed) return null
  return (
    <div className="animate-pop-in mx-auto mt-4 flex w-fit items-center gap-3 rounded-full border border-line bg-surface py-2 pr-2 pl-5 text-sm shadow-sm">
      {message}
      <button
        onClick={() => {
          setDismissed(true)
          try {
            sessionStorage.setItem('100indica-greeting', '1')
          } catch {
            // ignore
          }
        }}
        className="rounded-full p-1 text-faint hover:bg-soft hover:text-ink"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

/** ↑↑↓↓←→←→BA toggles an 8-bit look (see .retro in index.css). */
export function RetroMode() {
  const [on, setOn] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    let pos = 0
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      pos = key === KONAMI[pos] ? pos + 1 : key === KONAMI[0] ? 1 : 0
      if (pos < KONAMI.length) return
      pos = 0
      const next = !document.documentElement.classList.contains('retro')
      document.documentElement.classList.toggle('retro', next)
      setOn(next)
      setToast(next ? '🎮 8-BIT MODE: ON' : '🎮 8-BIT MODE: OFF')
      unlock('retro-gamer')
      setTimeout(playChaChing, 0)
      setTimeout(() => setToast(null), 2200)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {on && <div className="retro-scanlines pointer-events-none fixed inset-0 z-[94]" />}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-1/3 z-[90] text-center">
          <span className="animate-pop-in inline-block bg-black px-6 py-4 font-mono text-3xl font-black text-lime-400 shadow-[6px_6px_0_#84cc16]">
            {toast}
          </span>
        </div>
      )}
    </>
  )
}

const TRAIL_EMOJI = { banana: '🍌', pizza: '🍕', gary: '⏱️' } as const

/** When prices are in bananas (or pizzas…), the mouse leaves a little trail of them. */
export function CursorTrail() {
  const currency = useCurrency((s) => s.currency)

  useEffect(() => {
    if (currency === 'usd') return
    const emoji = TRAIL_EMOJI[currency]
    let last = 0
    let live = 0
    const onMove = (e: MouseEvent) => {
      const now = performance.now()
      if (now - last < 45 || live > 25) return
      last = now
      live++
      const el = document.createElement('span')
      el.textContent = emoji
      el.className = 'cursor-trail'
      el.style.left = `${e.clientX}px`
      el.style.top = `${e.clientY}px`
      document.body.appendChild(el)
      setTimeout(() => {
        el.remove()
        live--
      }, 800)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [currency])

  return null
}

/** When you switch to another browser tab, the page title begs you to come back. */
export function TabTitle() {
  useEffect(() => {
    const original = document.title
    let timers: ReturnType<typeof setTimeout>[] = []
    const later = (ms: number, title: string) => timers.push(setTimeout(() => (document.title = title), ms))

    const onVisibility = () => {
      timers.forEach(clearTimeout)
      timers = []
      if (document.hidden) {
        document.title = 'Come back! 🥺'
        later(5000, 'Gary misses you 🛵')
        later(12000, 'The cheese misses you too 🧀')
      } else {
        document.title = 'Yay, you’re back! 🎉'
        later(2000, original)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      timers.forEach(clearTimeout)
      document.title = original
    }
  }, [])
  return null
}

const IDLE_MS = 60_000
const COLORS = ['#57ff53', '#bf55dd', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444', '#d896ec']

/** After a minute of doing nothing, the logo bounces around like an old DVD player. Hitting a corner = 🎉 */
export function Screensaver() {
  const [active, setActive] = useState(false)
  const [corners, setCorners] = useState(0)
  const { pathname } = useLocation()
  const logo = useRef<HTMLDivElement>(null)

  // Watching Gary deliver counts as "doing something", so no screensaver on the tracking page.
  const allowed = !pathname.startsWith('/track')

  useEffect(() => {
    if (!allowed) return
    let timer = setTimeout(() => setActive(true), IDLE_MS)
    const wake = () => {
      setActive(false)
      clearTimeout(timer)
      timer = setTimeout(() => setActive(true), IDLE_MS)
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }))
    return () => {
      clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, wake))
    }
  }, [allowed])

  useEffect(() => {
    if (!active || !logo.current) return
    const el = logo.current
    let x = Math.random() * (innerWidth - el.offsetWidth)
    let y = Math.random() * (innerHeight - el.offsetHeight)
    let vx = 2.4
    let vy = 1.9
    let color = 0
    let last = performance.now()
    let frame = 0

    const step = (now: number) => {
      const dt = Math.min(48, now - last) / 16.7
      last = now
      x += vx * dt
      y += vy * dt
      const maxX = innerWidth - el.offsetWidth
      const maxY = innerHeight - el.offsetHeight
      let hitX = false
      let hitY = false
      if (x <= 0 || x >= maxX) {
        vx = -vx
        x = Math.max(0, Math.min(x, maxX))
        hitX = true
      }
      if (y <= 0 || y >= maxY) {
        vy = -vy
        y = Math.max(0, Math.min(y, maxY))
        hitY = true
      }
      if (hitX || hitY) {
        color = (color + 1) % COLORS.length
        el.style.color = COLORS[color]
      }
      // A corner hit: one wall now, and the other wall is (almost) touching too.
      if ((hitX && (y < 6 || y > maxY - 6)) || (hitY && (x < 6 || x > maxX - 6))) {
        setCorners((c) => c + 1)
        confetti()
      }
      el.style.transform = `translate(${x}px, ${y}px)`
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [active])

  if (!active) return null

  return (
    <div className="animate-fade-in fixed inset-0 z-[80] bg-black/90">
      <div ref={logo} className="absolute top-0 left-0 flex items-center gap-3 text-5xl font-black" style={{ color: COLORS[0] }}>
        <img src={logoSrc} alt="" className="size-16" /> 100Indica Shop
      </div>
      {corners > 0 && (
        <p className="animate-pop-in absolute top-8 inset-x-0 text-center text-3xl font-black text-white">
          🎉 IT HIT THE CORNER! 🎉{corners > 1 && ` ×${corners}`}
        </p>
      )}
      <p className="absolute inset-x-0 bottom-8 text-center text-sm text-white/50">
        Still there? Move the mouse to keep shopping.
      </p>
    </div>
  )
}

const CALM_DOWN = [
  'Calm down. Have a cookie. 🍪',
  'Clicking harder won’t help. Trust us. 😌',
  'Whoa there, speedy. Breathe in… breathe out. 🧘',
  'Ouch. It felt that. 😢',
]

/** Click the same thing 5 times in a row, quickly, and get told to calm down. */
export function RageClick() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let lastTarget: Element | null = null
    let times: number[] = []
    let hide: ReturnType<typeof setTimeout>

    const onClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest('button, a, img, [role="button"]') ?? (e.target as Element)
      if (target.closest('[data-no-rage]')) return // e.g. quantity steppers, where fast clicking is normal
      const now = Date.now()
      times = target === lastTarget ? [...times.filter((t) => now - t < 2500), now] : [now]
      lastTarget = target
      if (times.length >= 5) {
        times = []
        unlock('anger-management')
        setMessage(CALM_DOWN[Math.floor(Math.random() * CALM_DOWN.length)])
        clearTimeout(hide)
        hide = setTimeout(() => setMessage(null), 3000)
      }
    }
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      clearTimeout(hide)
    }
  }, [])

  if (!message) return null
  return (
    <div className="animate-pop-in pointer-events-none fixed inset-x-0 top-24 z-[85] flex justify-center px-4">
      <p className="rounded-full bg-ink px-6 py-3 text-lg font-semibold text-page shadow-2xl">{message}</p>
    </div>
  )
}
