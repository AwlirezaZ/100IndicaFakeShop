import { BellRing, MessageCircleQuestion, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import { useState } from 'react'
import { unlock } from '../lib/achievements'
import { money, type Product } from '../lib/api'
import { Helpful } from './Trolls'

/** A simple modal shell used by the product-page gags. */
function Modal({ onClose, children, wide }: { onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="animate-fade-in absolute inset-0 bg-indica-night/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`animate-pop-in relative max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-surface p-6 shadow-2xl ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <button onClick={onClose} className="absolute top-4 right-4 rounded-full p-2 hover:bg-soft" aria-label="Close">
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  )
}

const TRY_ON_VERDICTS = ['Looks great on you!', 'Stunning. Truly.', 'It really brings out your eyes.', 'Very brave. We love it.', 'Gary says you look fabulous.']

/** "Try it on" — works for every product, including cheese and books. */
export function TryItOn({ p }: { p: Product }) {
  const [open, setOpen] = useState(false)
  const verdict = TRY_ON_VERDICTS[p.id % TRY_ON_VERDICTS.length]
  return (
    <>
      <button
        onClick={() => {
          setOpen(true)
          unlock('try-it-on')
        }}
        className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium hover:bg-soft"
      >
        👕 Try it on
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <h2 className="text-2xl font-bold">Virtual try-on</h2>
          <p className="text-sm text-muted">Powered by advanced AI (a drawing of a person).</p>
          <div className="relative mx-auto mt-6 h-72 w-56">
            {/* The "model" */}
            <svg viewBox="0 0 200 260" className="absolute inset-0 size-full">
              <circle cx="100" cy="110" r="42" fill="#fcd9b6" />
              <circle cx="85" cy="105" r="4" fill="#1e293b" />
              <circle cx="115" cy="105" r="4" fill="#1e293b" />
              <path d="M84 126 Q100 140 116 126" stroke="#1e293b" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M40 260 Q40 170 100 165 Q160 170 160 260 Z" fill="#bf55dd" />
            </svg>
            {/* The product, worn as a hat */}
            <img
              src={p.thumbnail}
              alt=""
              className="animate-pop-in absolute top-0 left-1/2 h-28 w-32 -translate-x-1/2 -rotate-6 object-contain drop-shadow-lg"
            />
          </div>
          <p className="mt-4 text-center text-xl font-bold">{verdict}</p>
          <p className="text-center text-sm text-muted">{p.title}, worn as a hat.</p>
        </Modal>
      )}
    </>
  )
}

const SIZE_GUIDES: Record<string, [string, string][]> = {
  books: [['S', 'Short story'], ['M', 'Novel'], ['L', 'War and Peace'], ['XL', 'The terms and conditions']],
  grocery: [['S', 'A snack'], ['M', 'A meal'], ['L', 'A feast'], ['XL', 'A lifestyle']],
  electronics: [['S', 'Fits in a pocket'], ['M', 'Fits in a bag'], ['L', 'Fits in a car'], ['XL', 'Needs its own room']],
  beauty: [['S', 'Travel size'], ['M', 'Normal size'], ['L', 'Bathtub size'], ['XL', 'You are now the product']],
  fashion: [['S', 'Small'], ['M', 'Medium'], ['L', 'Large'], ['XL', 'Gary-sized']],
  home: [['S', 'Shoebox'], ['M', 'Corner of a room'], ['L', 'Whole room'], ['XL', 'It’s your house now']],
  sports: [['S', 'Warm-up'], ['M', 'Workout'], ['L', 'Marathon'], ['XL', 'Olympics']],
  other: [['S', 'A small mystery'], ['M', 'A medium mystery'], ['L', 'A large mystery'], ['XL', 'An unsolved mystery']],
}

/** A size guide for everything, whether or not it has sizes. */
export function SizeGuide({ p }: { p: Product }) {
  const [open, setOpen] = useState(false)
  const rows = SIZE_GUIDES[p.department] ?? SIZE_GUIDES.other
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium hover:bg-soft">
        📏 Size guide
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <h2 className="text-2xl font-bold">Size guide</h2>
          <p className="text-sm text-muted">For: {p.title}</p>
          <table className="mt-5 w-full text-left text-sm">
            <tbody>
              {rows.map(([size, meaning]) => (
                <tr key={size} className="border-t border-line">
                  <td className="w-16 py-3 text-lg font-black">{size}</td>
                  <td className="py-3">{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 rounded-xl bg-soft p-3 text-sm text-muted">Not sure which size? Order all of them. (We only have one.)</p>
        </Modal>
      )}
    </>
  )
}

const GARY_REVIEWS: Record<string, [string, number]> = {
  books: ['Didn’t read it. Used it as a doorstop. Great doorstop.', 5],
  grocery: ['Ate one on the way. Customer didn’t notice.', 4],
  electronics: ['Pressed all the buttons. Something beeped. Scary.', 4],
  beauty: ['Smelled it. Now I smell fancy.', 5],
  fashion: ['Wore it to deliver it. Nobody asked questions.', 4],
  home: ['Sat on it during my break. Very comfy.', 5],
  sports: ['Tried to use it. Pulled a muscle.', 2],
  other: ['Shook it. It rattled. Mysterious.', 5],
}

/** A one-line review from Gary the courier. */
export function GaryReview({ p }: { p: Product }) {
  const [text, stars] = GARY_REVIEWS[p.department] ?? GARY_REVIEWS.other
  return (
    <div className="mt-6 flex gap-4 rounded-2xl border-2 border-dashed border-brand-300 bg-tint p-5 dark:border-brand-500/40">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface text-2xl">🧔</span>
      <div>
        <p className="font-semibold">
          Gary’s review <span className="text-xs font-normal text-muted">· Verified courier, unverified opinion</span>
        </p>
        <p className="mt-0.5 text-amber-500">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</p>
        <p className="mt-1 text-body">“{text}”</p>
        <Helpful />
      </div>
    </div>
  )
}

/** "Notify me when the price drops" — we will not. */
export function NotifyPriceDrop() {
  const [on, setOn] = useState(false)
  return (
    <button
      onClick={() => setOn(true)}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${on ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300' : 'border-line hover:bg-soft'}`}
    >
      <BellRing size={16} />
      {on ? 'Done! We’ll notify you never. ✅' : 'Notify me when the price drops'}
    </button>
  )
}

/** A very serious side-by-side comparison of this product and a potato. */
export function PotatoCompare({ p }: { p: Product }) {
  const [open, setOpen] = useState(false)
  const [potatoTried, setPotatoTried] = useState(false)

  // [feature, this product, potato, winner]
  const rows: [string, string, string, 'p' | 'potato'][] = [
    ['Price', money(p.price), money(0.89), 'potato'],
    ['Customer rating', `${p.rating.toFixed(1)} ★`, '4.9 ★ (beloved by all)', p.rating >= 4.9 ? 'p' : 'potato'],
    ['Battery life', p.department === 'electronics' ? 'A few hours' : 'N/A', 'Infinite. Never needs charging.', 'potato'],
    ['Can be mashed', p.department === 'grocery' ? 'Technically' : 'Please don’t', 'Yes ✅', 'potato'],
    ['Emotional support', 'Questionable', 'Always there for you', 'potato'],
    ['Grows more of itself if planted', 'No', 'Yes 🌱', 'potato'],
    ['Has a barcode', 'Yes', 'No', 'p'],
    ['Gary’s opinion', 'Never heard of it', 'Ate one for lunch', 'potato'],
  ]
  const potatoWins = rows.filter((r) => r[3] === 'potato').length

  return (
    <>
      <button
        onClick={() => {
          setOpen(true)
          unlock('potato-believer')
        }}
        className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium hover:bg-soft"
      >
        🥔 Compare with a potato
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="animate-fade-in absolute inset-0 bg-indica-night/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="animate-pop-in relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-surface p-6 shadow-2xl">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 rounded-full p-2 hover:bg-soft" aria-label="Close">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold">Product comparison</h2>
            <p className="text-sm text-muted">Independent, unbiased, and 100% scientific.</p>

            <div className="mt-6 grid grid-cols-[1.2fr_1fr_1fr] gap-x-4 text-sm">
              <div />
              <div className="text-center">
                <img src={p.thumbnail} alt="" className="mx-auto size-20 rounded-xl bg-well object-contain" />
                <p className="mt-2 line-clamp-2 font-semibold">{p.title}</p>
              </div>
              <div className="text-center">
                <div className="mx-auto grid size-20 place-items-center rounded-xl bg-well text-5xl">🥔</div>
                <p className="mt-2 font-semibold">A potato</p>
              </div>
              {rows.map(([feature, a, b, winner]) => (
                <div key={feature} className="contents">
                  <p className="border-t border-line py-3 font-medium text-muted">{feature}</p>
                  <p className={`border-t border-line py-3 text-center ${winner === 'p' ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''}`}>{a}</p>
                  <p className={`border-t border-line py-3 text-center ${winner === 'potato' ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''}`}>{b}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-tint p-4 text-center">
              <p className="text-lg font-bold text-tint-ink">
                🏆 The potato wins {potatoWins}–{rows.length - potatoWins}.
              </p>
              <p className="text-sm text-body">Have you considered buying a potato instead?</p>
              <button
                onClick={() => setPotatoTried(true)}
                className="mt-3 rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-300"
              >
                {potatoTried ? 'Sorry, potatoes are sold out. Gary ate them. 😢' : 'Add potato to cart 🥔'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const QA = [
  ['Is this edible?', 'Not with that attitude.'],
  ['Does it come in blue?', 'Everything comes in blue if you believe hard enough.'],
  ['Will this fix my life?', 'No, but it might fix your afternoon. Results not guaranteed.'],
  ['Is it waterproof?', 'Only one way to find out. (Please don’t.)'],
  ['Can my cat use it?', 'Your cat will use it whether you like it or not.'],
  ['Is this a good gift for my mother-in-law?', 'Nothing is a good gift for your mother-in-law.'],
  ['Does it work in space?', 'Gary tried. We lost Gary for a week.'],
  ['Why does the price keep changing?', 'Stop staring at it. 😏'],
  ['Is it real?', 'As real as our prices.'],
  ['Can I return it if I don’t like it?', 'Sure, by carrier pigeon. Kevin the pigeon does not take feedback.'],
  ['Is it worth it?', 'Compared to a potato? Honestly, no.'],
  ['Does it come with batteries?', 'It comes with hope. Batteries sold separately.'],
]

/** Made-up customer questions with sarcastic answers (the same three for a given product). */
export function ProductQA({ p }: { p: Product }) {
  const [asked, setAsked] = useState(false)
  const [question, setQuestion] = useState('')
  const start = p.id % QA.length
  const picks = [0, 1, 2].map((i) => QA[(start + i * 5) % QA.length])

  return (
    <section className="mt-20">
      <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <MessageCircleQuestion /> Questions & answers
      </h2>
      <div className="mt-6 space-y-4">
        {picks.map(([q, a], i) => (
          <div key={q} className="rounded-2xl border border-line bg-surface p-5">
            <p className="font-semibold">Q: {q}</p>
            <p className="mt-1 text-body">
              <span className="font-semibold text-tint-ink">A:</span> {a}
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted">
              <span>Answered by 100Indica Support</span>
              <span className="flex items-center gap-1">
                <ThumbsUp size={13} /> {i}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsDown size={13} /> {(2341 + p.id * 7 + i * 113).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (question.trim()) setAsked(true)
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value)
            setAsked(false)
          }}
          placeholder="Ask a question about this product…"
          className="h-11 flex-1 rounded-full border border-line bg-surface px-4 text-sm outline-none placeholder:text-faint focus:border-brand-500 focus:ring-4 focus:ring-focus"
        />
        <button className="rounded-full bg-ink px-5 text-sm font-semibold text-page hover:bg-body">Ask</button>
      </form>
      {asked && (
        <p className="animate-pop-in mt-3 text-sm text-muted">
          Thanks! Your question has been sent to our team of 0 experts. Expect an answer never. 📮
        </p>
      )}
    </section>
  )
}
