import { Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { unlock } from '../lib/achievements'

const KEY = '100indica-cookies'
/** Fire this event (e.g. from the footer) to show the banner again. */
export const REOPEN_EVENT = '100indica:cookies'

type Stage = 'hidden' | 'main' | 'customize' | 'confirm' | 'declined' | 'accepted'

const CONFIRMS = [
  { title: 'Are you sure? 🥺', text: 'The cookies will be sad.' },
  { title: 'Really sure?', text: 'These are chocolate chip. 🍫🍪' },
  { title: 'The cookies have families, you know.', text: '👨‍👩‍👧 Little cookie families. With little cookie kids.', swap: true },
  { title: 'What if we said please? 🙏', text: 'Pretty please. With sprinkles on top.' },
  { title: 'Final answer?', text: 'Grandma baked these. 👵 She’s watching.', swap: true },
]

// What the "decline" link says each time it dodges the mouse.
const DODGE_LABELS = ['decline', 'nope', 'too slow', 'almost!', 'hehe', 'ok fine, click me 😮‍💨']

function remember(value: string) {
  try {
    localStorage.setItem(KEY, value)
  } catch {
    // Storage blocked: the banner will just show again next time. Very on-brand.
  }
}

function seen() {
  try {
    return !!localStorage.getItem(KEY)
  } catch {
    return false
  }
}

export default function CookieBanner() {
  const [stage, setStage] = useState<Stage>('hidden')
  const [step, setStep] = useState(0)
  const [dodges, setDodges] = useState(0)
  const [pos, setPos] = useState<{ left: string; top: string } | null>(null)
  const [tracking, setTracking] = useState(true)
  const [spooky, setSpooky] = useState(false)

  const open = () => {
    setStep(0)
    setDodges(0)
    setPos(null)
    setTracking(true)
    setSpooky(false)
    setStage('main')
  }

  useEffect(() => {
    const t = seen() ? undefined : setTimeout(open, 1200)
    window.addEventListener(REOPEN_EVENT, open)
    return () => {
      clearTimeout(t)
      window.removeEventListener(REOPEN_EVENT, open)
    }
  }, [])

  const accept = () => {
    remember('accepted')
    setStage('accepted')
    setTimeout(() => setStage('hidden'), 1800)
  }

  const declineStep = () => {
    if (step + 1 < CONFIRMS.length) return setStep(step + 1)
    remember('declined')
    setStage('declined')
    unlock('cookie-enemy')
  }

  const dodge = () => {
    if (dodges >= DODGE_LABELS.length - 1) return
    setDodges((d) => d + 1)
    setPos({ left: `${8 + Math.random() * 70}%`, top: `${10 + Math.random() * 75}%` })
  }

  if (stage === 'hidden') return null

  const confirm = CONFIRMS[step]
  const btnPrimary = 'rounded-full bg-brand-600 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700'
  const btnSecondary = 'rounded-full border border-line px-5 py-2.5 text-sm font-medium hover:bg-soft'

  return (
    <div data-cookie-banner className="fixed inset-0 z-[60] grid items-end justify-center p-4 sm:items-center">
      <div className="animate-fade-in absolute inset-0 bg-indica-night/50 backdrop-blur-sm" />
      <div className="animate-pop-in relative w-full max-w-lg rounded-3xl bg-surface p-7 shadow-2xl">
        {stage === 'main' && (
          <>
            <div className="text-5xl">🍪</div>
            <h2 className="mt-3 text-2xl font-bold">We value your privacy*</h2>
            <p className="mt-2 text-body">
              We use cookies to improve your experience, remember your snacks, and tell our friends about you. By breathing,
              you agree to all cookies.
            </p>
            <p className="mt-2 text-xs text-faint">*we don’t</p>
            <div className="mt-6 flex flex-col gap-3">
              <button onClick={accept} className={`${btnPrimary} py-4 text-lg`}>
                Accept all cookies 🍪
              </button>
              <button onClick={accept} className={btnSecondary}>
                Accept even more cookies
              </button>
              <button onClick={() => setStage('customize')} className="text-sm font-medium text-muted hover:text-ink">
                Manage preferences
              </button>
            </div>
            <button
              onMouseEnter={dodge}
              onClick={() => setStage('confirm')}
              className={`text-[10px] whitespace-nowrap text-faint underline transition-all duration-200 hover:text-muted ${pos ? 'absolute' : 'mx-auto mt-4 block'}`}
              style={pos ?? undefined}
            >
              {DODGE_LABELS[dodges]}
            </button>
          </>
        )}

        {stage === 'customize' && (
          <>
            <h2 className="text-2xl font-bold">Cookie preferences</h2>
            <p className="mt-1 text-sm text-muted">You’re in full control.** </p>
            <ul className="mt-5 space-y-3">
              {[
                ['Strictly necessary cookies', 'The site would literally explode without them.'],
                ['Chocolate chip cookies', 'Required by law (our law).'],
                ['Fortune cookies', 'Your fortune: you will accept these cookies.'],
              ].map(([name, desc]) => (
                <li key={name} className="flex items-center gap-4 rounded-2xl bg-soft p-4">
                  <div className="flex-1">
                    <p className="font-medium">{name}</p>
                    <p className="text-xs text-muted">{desc}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-faint">
                    <Lock size={12} /> Always on
                  </span>
                </li>
              ))}
              <li className="flex items-center gap-4 rounded-2xl bg-soft p-4">
                <div className="flex-1">
                  <p className="font-medium">Tracking cookies</p>
                  <p className="text-xs text-muted">{spooky ? 'It turned itself back on. Spooky. 👻' : 'Totally optional.'}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={tracking}
                  onClick={() => {
                    if (!tracking) return
                    setTracking(false)
                    setTimeout(() => {
                      setTracking(true)
                      setSpooky(true)
                    }, 700)
                  }}
                  className={`relative h-7 w-12 rounded-full transition-colors ${tracking ? 'bg-brand-600' : 'bg-line'}`}
                >
                  <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${tracking ? 'left-6' : 'left-1'}`} />
                </button>
              </li>
            </ul>
            <p className="mt-3 text-xs text-faint">**you’re not</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <button onClick={accept} className={`${btnPrimary} flex-1`}>
                Save preferences
              </button>
              <button onClick={() => setStage('main')} className={btnSecondary}>
                Back
              </button>
            </div>
          </>
        )}

        {stage === 'confirm' && (
          <div key={step} className="animate-pop-in text-center">
            <div className="text-5xl">{['🥺', '🍫', '👨‍👩‍👧', '🙏', '👵'][step]}</div>
            <h2 className="mt-3 text-2xl font-bold">{confirm.title}</h2>
            <p className="mt-2 text-body">{confirm.text}</p>
            <p className="mt-1 text-xs text-faint">
              Step {step + 1} of {CONFIRMS.length} to decline cookies
            </p>
            <div className={`mt-6 flex flex-col gap-3 ${confirm.swap ? 'sm:flex-row-reverse' : 'sm:flex-row'}`}>
              <button onClick={accept} className={`${btnPrimary} flex-1`}>
                Okay fine, accept cookies 🍪
              </button>
              <button onClick={declineStep} className={`${btnSecondary} flex-1`}>
                Yes, decline
              </button>
            </div>
          </div>
        )}

        {stage === 'declined' && (
          <div className="animate-pop-in text-center">
            <div className="text-5xl">💔🍪</div>
            <h2 className="mt-3 text-2xl font-bold">Fine. Cookies declined.</h2>
            <p className="mt-2 text-body">We’ll remember this. (We won’t. You declined cookies.)</p>
            <button onClick={() => setStage('hidden')} className={`${btnSecondary} mt-6`}>
              Okay…
            </button>
          </div>
        )}

        {stage === 'accepted' && (
          <div className="animate-pop-in py-4 text-center">
            <div className="text-5xl">🎉🍪</div>
            <h2 className="mt-3 text-2xl font-bold">Cookies accepted!</h2>
            <p className="mt-2 text-body">Nom nom nom.</p>
          </div>
        )}
      </div>
    </div>
  )
}
