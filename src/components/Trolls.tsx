// The second wave of sarcastic features: coupons that hate you, relapsing progress bars, terms nobody reads,
// shrinkflation, a waitlist that only gets longer, ratings that refuse to be low, and a lot of static electricity.
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { unlock } from '../lib/achievements'
import { money, type Product } from '../lib/api'
import { confetti, playZap } from '../lib/fun'
import Stars from './Stars'

const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]

function readJSON<T>(key: string, fallback: T): T {
  try {
    return (JSON.parse(localStorage.getItem(key) ?? 'null') as T) ?? fallback
  } catch {
    return fallback
  }
}
function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode etc. The gag just won't remember.
  }
}

/* ------------------------------------------------------------------ Coupon box */

const COUPON_FAILS = [
  'Expired 3 minutes ago. So close.',
  'Only valid on February 30th.',
  'Valid for first-time customers born on a leap day, at noon.',
  'This code only works in Narnia.',
  'That code is for a different shop. A better one.',
  'Code accepted! Discount: emotional support. 💜',
  'Our coupon intern is on lunch. Try again never.',
  'Invalid. Also, who told you about this code?',
]

/** Returns a discount in dollars (almost always 0). */
export function CouponBox({ onDiscount }: { onDiscount: (amount: number, code: string) => void }) {
  const [code, setCode] = useState('')
  const [reply, setReply] = useState<{ text: string; good?: boolean } | null>(null)
  const tries = useRef(0)

  const apply = (e: React.FormEvent) => {
    e.preventDefault()
    const c = code.trim().toUpperCase()
    if (!c) return setReply({ text: 'An empty code? Bold. Still no.' })
    if (++tries.current >= 3) unlock('coupon-clipper')
    if (c === 'GARY') {
      onDiscount(0.01, c)
      return setReply({ text: 'GARY applied: you save $0.01. Don’t spend it all at once.', good: true })
    }
    onDiscount(0, '')
    if (c === 'NOTHING') return setReply({ text: 'Already used. By you. Just now. Somehow.' })
    if (c.includes('INDICA') || c === '100') return setReply({ text: 'Nice try. That’s the owner’s code. You get 100%… of the price. ⚡' })
    if (c === 'FREE' || c.includes('FREE')) return setReply({ text: 'Nothing is free. Except pigeon delivery. And this disappointment.' })
    if (/^\d+%?$/.test(c)) return setReply({ text: `${c}? You can’t just type a number and expect a discount. (You can, it just won’t work.)` })
    setReply({ text: pick(COUPON_FAILS) })
  }

  return (
    <form onSubmit={apply} className="mt-6 border-t border-line pt-4">
      <p className="text-sm font-semibold">🎟️ Coupon code</p>
      <div className="mt-2 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. SAVE50"
          className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-sm uppercase outline-none focus:border-brand-500 focus:ring-4 focus:ring-focus"
        />
        <button className="rounded-xl bg-ink px-4 text-sm font-semibold text-page hover:bg-body">Apply</button>
      </div>
      {reply && (
        <p key={reply.text + tries.current} className={`animate-fade-in mt-2 text-xs ${reply.good ? 'font-medium text-emerald-600' : 'text-rose-600'}`}>
          {reply.text}
        </p>
      )}
    </form>
  )
}

/* ------------------------------------------------------------------ Relapsing progress bar */

/** "Processing payment": crawls to 99%, falls back to 12% when Gary trips over the cable, then finishes. */
export function RelapsingProgress({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0)
  const [label, setLabel] = useState('Contacting your bank…')
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    const steps: [number, number, string][] = [
      // [delay ms, percent, label]
      [100, 35, 'Contacting your bank…'],
      [700, 72, 'Asking your bank nicely…'],
      [1400, 94, 'Almost there…'],
      [2100, 99, 'Almost there…'],
      [3300, 99, 'Almost there… (any second now)'],
      [4300, 12, 'Gary tripped over the cable. 🔌'],
      [5600, 48, 'Plugging it back in. With feeling.'],
      [6300, 86, 'Blowing on the cartridge…'],
      [7000, 100, 'Done! That was totally normal.'],
    ]
    const timers = steps.map(([ms, p, l]) => setTimeout(() => (setPct(p), setLabel(l)), ms))
    timers.push(setTimeout(() => done.current(), 7600))
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="py-4 text-center">
      <p className="text-4xl font-black tabular-nums">{pct}%</p>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-soft">
        <div
          className={`h-full rounded-full ${pct === 12 ? 'bg-rose-500' : 'bg-gradient-to-r from-brand-600 to-indica-green'}`}
          style={{ width: `${pct}%`, transition: pct === 12 ? 'width .25s ease-in' : 'width .7s ease-out' }}
        />
      </div>
      <p key={label} className="animate-fade-in mt-4 font-semibold">{label}</p>
      <p className="mt-1 text-sm text-muted">Please don’t close this window. Gary is doing his best.</p>
    </div>
  )
}

/* ------------------------------------------------------------------ Terms & conditions */

const LEGAL_FILLER = [
  'The Customer (hereinafter “You”, “Ur”, or “That Person”) acknowledges that the Shop (hereinafter “We”, “Us”, or “The Bolt”) exists.',
  'Notwithstanding the foregoing, and without prejudice to the aforementioned, the parties agree to keep agreeing.',
  'All prices are final, except when they are not, which is always.',
  'Any dispute shall be settled by a game of rock-paper-scissors, best of 47, refereed by the Potato.',
  'This clause intentionally left blank. Please do not read it.',
  'You agree that you have read this paragraph. You haven’t. That’s fine. We know.',
  'The Shop reserves the right to reserve rights, including the right to reserve further rights.',
  'Delivery times are estimates. Estimates are guesses. Guesses are vibes. Vibes are not legally binding.',
  'If any provision is found unenforceable, the remaining provisions shall continue to be ignored as usual.',
  'Refunds are paid in IndiCoins at the official exchange rate of 1 IndiCoin = $0.00.',
]
const LEGAL_SECRETS: Record<number, string> = {
  7: 'You agree that Gary may borrow your car. He will return it. Probably with snacks in the cup holder.',
  14: 'You agree to name your firstborn “Kevin”, after our logistics pigeon. Middle names are negotiable.',
  21: 'By scrolling this far you have adopted a potato. It is your responsibility now.',
  29: 'The Shop may, at any time, without notice, turn on disco mode.',
  36: 'You agree that a hotdog is a sandwich. This is non-negotiable.',
}

function TermsModal({ onClose, onAgree }: { onClose: () => void; onAgree: () => void }) {
  const [reachedEnd, setReachedEnd] = useState(false)
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (!reachedEnd && el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
      setReachedEnd(true)
      unlock('terms-reader')
    }
  }
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div className="animate-fade-in absolute inset-0 bg-indica-night/60 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-pop-in relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-bold">📜 Terms & Conditions <span className="text-xs font-normal text-muted">(40 pages)</span></h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-soft" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div onScroll={onScroll} className="flex-1 space-y-4 overflow-y-auto px-6 py-4 font-serif text-xs leading-relaxed text-body">
          {Array.from({ length: 40 }, (_, i) => (
            <section key={i}>
              <p className="font-sans font-bold text-ink">Page {i + 1}. {['Definitions', 'More definitions', 'Liability', 'Even more liability', 'Miscellaneous', 'Other miscellaneous', 'Gary'][i % 7]}</p>
              <p className="mt-1">
                <b>§{i + 1}.1</b> {LEGAL_FILLER[i % LEGAL_FILLER.length]} <b>§{i + 1}.2</b> {LEGAL_FILLER[(i * 3 + 1) % LEGAL_FILLER.length]}{' '}
                {LEGAL_SECRETS[i] && <b className="text-ink">§{i + 1}.3 {LEGAL_SECRETS[i]}</b>}
              </p>
            </section>
          ))}
          <p className="pb-2 text-center font-sans text-sm font-bold text-ink">— End of terms. You made it. Nobody makes it. —</p>
        </div>
        <div className="border-t border-line p-4">
          {reachedEnd && (
            <p className="animate-pop-in mb-3 text-center text-sm font-medium text-tint-ink">
              You actually read all of it?! Our lawyer is crying. Here’s a trophy. 🏆
            </p>
          )}
          <button
            onClick={() => {
              onAgree()
              onClose()
            }}
            className="w-full rounded-full bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700"
          >
            {reachedEnd ? 'I agree (and I mean it)' : 'I agree (I didn’t read it)'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Required "I agree to the terms" box. Opening the terms is optional, as is tradition. */
export function TermsCheckbox({ checked, onChange, error }: { checked: boolean; onChange: (v: boolean) => void; error?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-4">
      <label className={`flex items-start gap-2 text-xs ${error ? 'text-rose-600' : 'text-body'}`}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 accent-brand-600" />
        <span>
          I have read and agree to the{' '}
          <button type="button" onClick={() => setOpen(true)} className="font-semibold text-tint-ink underline">
            Terms & Conditions
          </button>{' '}
          (40 pages){error && ' — you must agree to the terms you didn’t read.'}
        </span>
      </label>
      {/* Portal: the checkout summary is sticky, which would trap the modal under the site header. */}
      {open && createPortal(<TermsModal onClose={() => setOpen(false)} onAgree={() => onChange(true)} />, document.body)}
    </div>
  )
}

/* ------------------------------------------------------------------ Gary's mum newsletter */

const MUM_PLEAS = [
  'Are you sure? She’s been looking forward to this all week.',
  'Really sure? She already bought stamps. For emails.',
  'Fine. She’s not mad. Just disappointed.',
]

/** Pre-ticked troll box. Unticking takes three confirmations. */
export function MumCheckbox() {
  const [checked, setChecked] = useState(true)
  const [step, setStep] = useState(-1)

  const next = () => {
    if (step + 1 >= MUM_PLEAS.length - 1) {
      setStep(MUM_PLEAS.length - 1)
      setChecked(false)
      unlock('mum-ghoster')
    } else setStep(step + 1)
  }

  return (
    <div className="mt-3 text-xs text-body">
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => (checked ? next() : (setChecked(true), setStep(-1)))}
          className="mt-0.5 accent-brand-600"
        />
        <span>Yes, email me daily updates from Gary’s mum 👵</span>
      </label>
      {step >= 0 && (
        <div key={step} className="animate-pop-in mt-2 rounded-xl bg-soft p-2.5">
          <p>{MUM_PLEAS[step]}</p>
          {checked && (
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={next} className="rounded-full border border-line px-2.5 py-1 font-medium hover:border-rose-400 hover:text-rose-600">
                Yes, untick it
              </button>
              <button type="button" onClick={() => setStep(-1)} className="rounded-full bg-brand-600 px-2.5 py-1 font-semibold text-white">
                Keep her emails 💌
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Warranty for your warranty */

const WARRANTY_LEVELS = [
  { title: '3-year protection plan', note: 'Covers drops, spills and existential dread.' },
  { title: 'Protection for your protection plan', note: 'In case your protection plan gets scratched.' },
  { title: 'Protection for THAT protection plan', note: 'It’s protection plans all the way down.' },
  { title: 'The Warranty Singularity™', note: 'Gary is scared. We’ve gone too far.' },
]

export function WarrantyLadder({ p }: { p: Product }) {
  const [level, setLevel] = useState(0)
  const base = Math.max(2.99, p.price * 0.35)
  return (
    <div className="mt-4 space-y-2">
      {WARRANTY_LEVELS.slice(0, Math.min(level + 1, WARRANTY_LEVELS.length)).map((w, i) => (
        <label
          key={w.title}
          className={`animate-fade-in flex cursor-pointer items-start gap-3 rounded-2xl border p-3 text-sm transition ${i < level ? 'border-brand-300 bg-tint dark:border-brand-500/40' : 'border-line hover:bg-soft'}`}
          style={{ marginLeft: i * 16 }}
        >
          <input
            type="checkbox"
            checked={i < level}
            onChange={(e) => {
              setLevel(e.target.checked ? i + 1 : i)
              if (e.target.checked && i === WARRANTY_LEVELS.length - 1) unlock('over-insured')
            }}
            className="mt-0.5 accent-brand-600"
          />
          <span className="flex-1">
            <span className="font-medium">{'🛡️'.repeat(i + 1)} {w.title}</span>{' '}
            <span className="text-muted">+{money(base * 1.6 ** i)}</span>
            <span className="block text-xs text-muted">
              {w.note}
              {i === 0 && base > p.price && ' Costs more than the product. Peace of mind is priceless.'}
            </span>
          </span>
        </label>
      ))}
      {level > 0 && (
        <p className="text-xs text-faint">
          {level >= WARRANTY_LEVELS.length ? 'Fully protected. From everything. Including common sense.' : 'Added! (To our hearts. Not your cart. We’re not monsters.)'}
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Shrinkflation */

const SHRINK_THING: Record<string, string> = {
  grocery: 'snack',
  books: 'pages',
  beauty: 'goo',
  electronics: 'battery',
  fashion: 'fabric',
  home: 'furniture',
  sports: 'sport',
}

/** Counts visits to a product (once per page view) and returns how many times it's been seen before. */
export function useRevisits(id: number) {
  const [revisits, setRevisits] = useState(0)
  const counted = useRef(false)
  useEffect(() => {
    if (counted.current) return // StrictMode runs effects twice in dev
    counted.current = true
    const visits = readJSON<Record<string, number>>('100indica-visits', {})
    const n = (visits[id] ?? 0) + 1
    writeJSON('100indica-visits', { ...visits, [id]: n })
    setRevisits(n - 1)
  }, [id])
  return revisits
}

/** Fraction of the original size left after shrinkflation (6% per revisit, never below 40%). */
export const shrinkFactor = (revisits: number) => Math.max(0.4, 1 - revisits * 0.06)

/** "200 g" → "176 g". Leaves values without a number alone. */
export function shrinkValue(value: string, factor: number) {
  if (factor === 1) return value
  return value.replace(/\d+(?:[.,]\d+)?/, (n) => {
    const x = parseFloat(n.replace(',', '.')) * factor
    return String(x >= 10 ? Math.round(x) : Math.round(x * 10) / 10)
  })
}

export function ShrinkNotice({ p, revisits }: { p: Product; revisits: number }) {
  if (revisits < 1 || p.id === 999999) return null
  const pct = Math.round((1 - shrinkFactor(revisits)) * 100)
  return (
    <p className="animate-pop-in mt-3 w-fit rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
      📉 <b>Shrinkflation update:</b> now {pct}% less {SHRINK_THING[p.department] ?? 'stuff'}. Same price. You’re welcome.
      {revisits >= 3 && ' (Stop coming back, it keeps shrinking.)'}
    </p>
  )
}

/* ------------------------------------------------------------------ Hesitation detector */

/** Wrap a button: hover it for a while without clicking and get some (diminishing) encouragement. */
export function Hesitation({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [msg, setMsg] = useState<string | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setMsg(null)
  }
  useEffect(() => clear, [])
  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => {
        clear()
        timers.current = [
          setTimeout(() => setMsg('Just do it. Gary believes in you. 💪'), 3000),
          setTimeout(() => setMsg('Any day now…'), 7000),
          setTimeout(() => setMsg('Gary has stopped believing in you.'), 11000),
        ]
      }}
      onMouseLeave={clear}
      onClick={clear}
    >
      {children}
      {msg && (
        <span key={msg} className="animate-pop-in pointer-events-none absolute -top-11 right-0 z-10 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-page shadow-lg">
          {msg}
        </span>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Hopeless waitlist */

export function Waitlist({ p }: { p: Product }) {
  const key = '100indica-waitlist'
  const [state, setState] = useState<{ pos: number; moved: number } | null>(null)
  const checked = useRef(false)

  // If already in the queue, every visit pushes you further back.
  useEffect(() => {
    if (checked.current) return
    checked.current = true
    const all = readJSON<Record<string, number>>(key, {})
    if (!all[p.id]) return
    const moved = 1 + Math.floor(Math.random() * 7)
    writeJSON(key, { ...all, [p.id]: all[p.id] + moved })
    setState({ pos: all[p.id] + moved, moved })
  }, [p.id])

  const join = () => {
    const pos = 48000 + Math.floor(Math.random() * 900)
    writeJSON(key, { ...readJSON<Record<string, number>>(key, {}), [p.id]: pos })
    setState({ pos, moved: 0 })
    unlock('waitlisted')
  }

  if (!state)
    return (
      <button onClick={join} className="mt-3 rounded-full border border-line px-4 py-2 text-sm font-medium hover:bg-soft">
        🕰️ Join the waitlist
      </button>
    )
  return (
    <p className="animate-pop-in mt-3 rounded-xl bg-soft px-3 py-2 text-sm">
      You’re <b>#{state.pos.toLocaleString()}</b> in line.
      {state.moved > 0 && ` You moved back ${state.moved} place${state.moved > 1 ? 's' : ''} since last time. Someone cut in. It was Gary.`}
    </p>
  )
}

/* ------------------------------------------------------------------ Reviews */

/** "Was this review helpful?" Yes / No / I'm Gary. */
export function Helpful() {
  const [answer, setAnswer] = useState<string | null>(null)
  if (answer) return <p className="animate-fade-in mt-3 text-xs text-muted">{answer}</p>
  const btn = 'rounded-full border border-line px-2.5 py-0.5 hover:bg-soft'
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted">
      <span>Helpful?</span>
      <button onClick={() => setAnswer('Thanks! 1 person found this helpful (you).')} className={btn}>Yes</button>
      <button onClick={() => setAnswer('Noted. The reviewer has been informed and is crying.')} className={btn}>No</button>
      <button onClick={() => setAnswer('Hi Gary. Get back to work. 🛵')} className={btn}>I’m Gary</button>
    </div>
  )
}

const LOW_STAR_REPLIES = ['1 star? You mean 5. ⭐', '2 stars? Typo. Fixed it for you.', '3 stars? We rounded up. You’re welcome.', '4 stars? Close enough to 5.']

/** A review form whose star rating refuses to go below 5. */
export function WriteReview() {
  const [stars, setStars] = useState(5)
  const [hover, setHover] = useState(0)
  const [note, setNote] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [posted, setPosted] = useState(false)

  const rate = (n: number) => {
    if (n < 5) {
      setStars(n)
      unlock('brutally-honest')
      setNote(LOW_STAR_REPLIES[n - 1])
      setTimeout(() => setStars(5), 450) // snap back
    } else {
      setStars(5)
      setNote('Great choice. The only choice.')
    }
  }

  if (posted)
    return (
      <div className="animate-pop-in mt-6 rounded-2xl border border-line bg-surface p-5">
        <Stars rating={5} size={14} />
        <p className="mt-2 text-body">“{text.trim() || 'Absolutely perfect. 10/10. No notes.'}”</p>
        <p className="mt-2 text-xs text-faint">Your 5-star review has been posted to our hearts. (It’s not posted anywhere.)</p>
      </div>
    )

  return (
    <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
      <p className="font-semibold">Write a review</p>
      <div className="mt-2 flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onClick={() => rate(n)}
            className={`text-2xl transition ${(hover || stars) >= n ? 'text-amber-400' : 'text-line'}`}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>
      {note && <p key={note + stars} className="animate-fade-in mt-1 text-xs font-medium text-tint-ink">{note}</p>}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Tell everyone how perfect it is…"
        className="mt-3 w-full rounded-xl border border-line bg-surface p-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-focus"
      />
      <button onClick={() => setPosted(true)} className="mt-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
        Post 5-star review
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ Static charge */

/** Click fast, anywhere, and a charge meter fills up. At 100% the whole page gets zapped. */
export function StaticCharge() {
  const [charge, setCharge] = useState(0)
  const [zap, setZap] = useState(0)
  const chargeRef = useRef(0)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element).closest('[data-no-rage]')) return
      chargeRef.current = Math.min(100, chargeRef.current + 9)
      if (chargeRef.current >= 100) {
        chargeRef.current = 0
        setZap(Date.now())
        playZap()
        unlock('fully-charged')
        const main = document.querySelector('main')
        main?.classList.remove('zap-shake')
        void main?.offsetWidth
        main?.classList.add('zap-shake')
        setTimeout(() => main?.classList.remove('zap-shake'), 600)
      }
      setCharge(chargeRef.current)
    }
    // Charge leaks away when you calm down.
    const leak = setInterval(() => {
      if (chargeRef.current <= 0) return
      chargeRef.current = Math.max(0, chargeRef.current - 6)
      setCharge(chargeRef.current)
    }, 500)
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      clearInterval(leak)
    }
  }, [])

  useEffect(() => {
    if (!zap) return
    const t = setTimeout(() => setZap(0), 1800)
    return () => clearTimeout(t)
  }, [zap])

  return (
    <>
      {charge >= 25 && !zap && (
        <div className="animate-fade-in pointer-events-none fixed bottom-4 left-4 z-30 w-44 rounded-2xl border border-line bg-surface p-3 shadow-xl">
          <p className="text-xs font-semibold">⚡ Static charge: {charge}%</p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-soft">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indica-green transition-all" style={{ width: `${charge}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-muted">{charge > 70 ? 'Do NOT touch the doorknob.' : 'Stop clicking so fast…'}</p>
        </div>
      )}
      {zap > 0 && (
        <div key={zap} className="pointer-events-none fixed inset-0 z-[92]">
          <div className="zap-flash absolute inset-0 bg-white" />
          <p className="animate-pop-in absolute inset-x-0 top-1/3 text-center text-5xl font-black tracking-tight text-indica-green drop-shadow-[0_6px_16px_rgb(0_0_0/0.5)] [-webkit-text-stroke:2px_#1f0631] [paint-order:stroke_fill] md:text-7xl">
            ⚡ 100% CHARGED ⚡
          </p>
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ IndiCoin stock ticker */

const ANALYSTS = ['Analysts: “lol”', 'Gary: “buy the dip”', 'Analysts: “have you tried turning it off and on?”', 'The Potato: “hold”', 'Kevin: “coo”', 'Analysts: “we’re also confused”']

/** IndiCoin's market price: always crashing. */
export function useIndiTicker() {
  const [tick, setTick] = useState({ drop: 99.8, analyst: ANALYSTS[0], history: [100, 60, 41, 30, 18, 9, 4, 2] })
  useEffect(() => {
    const t = setInterval(
      () =>
        setTick((s) => ({
          drop: Math.min(99.9, Math.round((97 + Math.random() * 2.9) * 10) / 10),
          analyst: pick(ANALYSTS),
          history: [...s.history.slice(1), Math.max(0.5, s.history[s.history.length - 1] * (0.3 + Math.random() * 0.9))],
        })),
      2500,
    )
    return () => clearInterval(t)
  }, [])
  return tick
}

export function TickerChart({ history }: { history: number[] }) {
  const max = Math.max(...history)
  const pts = history.map((v, i) => `${(i / (history.length - 1)) * 100},${30 - (v / max) * 28}`).join(' ')
  return (
    <svg viewBox="0 0 100 32" className="h-8 w-full" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="#f43f5e" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/* ------------------------------------------------------------------ Lost page: find Gary */

const HIDING_SPOTS = ['📦', '🌳', '🗑️', '🛋️', '🚪', '🧺', '🧳', '🎁', '📦', '🌳', '🗑️', '🛋️']
const NOT_GARY = ['🐦 Kevin. Not Gary.', '🥔 A potato. Classic.', '🧦 One sock. Not Gary.', '🍕 Cold pizza. Gary was here.', '💨 Nothing. Just vibes.', '🛵 Gary’s scooter! He’s close.']

/** 404 page: Gary lost this page. Help him find… himself. */
export function LostPage() {
  const [gary] = useState(() => Math.floor(Math.random() * HIDING_SPOTS.length))
  const [opened, setOpened] = useState<Record<number, string>>({})
  const [found, setFound] = useState(false)
  const [clue, setClue] = useState('Click a hiding spot.')
  const tries = Object.keys(opened).length

  const open = (i: number) => {
    if (found || opened[i]) return
    if (i === gary) {
      setFound(true)
      setOpened({ ...opened, [i]: '🧔' })
      confetti()
      unlock('gary-finder')
    } else {
      const what = pick(NOT_GARY)
      setOpened({ ...opened, [i]: what })
      setClue(what)
    }
  }

  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="text-7xl font-black text-line">404</p>
      <h1 className="mt-4 text-2xl font-bold">Gary lost this page.</h1>
      <p className="mt-2 text-muted">He also lost himself. Help find Gary and maybe he’ll remember where he put it.</p>
      <div className="mx-auto mt-8 grid max-w-sm grid-cols-4 gap-2">
        {HIDING_SPOTS.map((spot, i) => (
          <button
            key={i}
            onClick={() => open(i)}
            className={`grid aspect-square place-items-center rounded-2xl border border-line text-3xl transition ${opened[i] ? 'bg-soft' : 'bg-surface hover:scale-105 hover:bg-tint'}`}
            title={opened[i]}
          >
            {opened[i] ? opened[i].split(' ')[0] : spot}
          </button>
        ))}
      </div>
      <p className="mt-4 min-h-6 text-sm font-medium">
        {found ? `You found Gary in ${tries} ${tries === 1 ? 'try' : 'tries'}! He still doesn’t know where the page is.` : clue}
      </p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-2.5 font-medium text-white hover:bg-brand-700">
        Back to home
      </Link>
    </div>
  )
}
