import { useState } from 'react'
import { Link } from 'react-router'
import { unlock } from '../lib/achievements'
import { money, MYSTERY_ID, useProducts } from '../lib/api'
import { confetti } from '../lib/fun'

const REACTIONS = ['Wow! Exactly what you never asked for.', 'Incredible. Truly a mystery.', 'You could have just bought this. But where’s the fun in that?', 'Gary picked this one personally.']

/** Shown on the order confirmation page when the order contains a IndiBox™. */
export default function MysteryUnbox({ orderId }: { orderId: string }) {
  const { data } = useProducts()
  const [stage, setStage] = useState<'closed' | 'shaking' | 'open'>('closed')

  if (!data) return null
  // The same order always reveals the same product.
  const seed = [...orderId].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7)
  const pool = data.filter((p) => p.id !== MYSTERY_ID)
  const prize = pool[seed % pool.length]
  const reaction = REACTIONS[seed % REACTIONS.length]

  const open = () => {
    setStage('shaking')
    setTimeout(() => {
      setStage('open')
      confetti()
      unlock('mystery-solver')
    }, 1600)
  }

  return (
    <div className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-indica-night to-brand-600 p-6 text-center text-white shadow-xl">
      {stage !== 'open' ? (
        <>
          <p className="text-sm font-semibold tracking-wide text-white/80 uppercase">You bought a IndiBox™!</p>
          <button
            onClick={open}
            disabled={stage === 'shaking'}
            className={`mx-auto mt-3 block text-8xl transition-transform hover:scale-110 ${stage === 'shaking' ? 'animate-[wiggle_.25s_infinite]' : ''}`}
            aria-label="Open the mystery box"
          >
            🎁
          </button>
          <p className="mt-2 font-semibold">{stage === 'shaking' ? 'Opening…' : 'Click the box to open it!'}</p>
        </>
      ) : (
        <div className="animate-pop-in">
          <p className="text-sm font-semibold tracking-wide text-white/80 uppercase">Your IndiBox™ contained…</p>
          <Link to={`/product/${prize.id}`} className="mx-auto mt-4 block w-fit">
            <img src={prize.thumbnail} alt="" className="mx-auto size-36 rounded-2xl bg-white object-contain p-2 shadow-xl" />
            <p className="mt-3 text-2xl font-black">{prize.title}</p>
          </Link>
          <p className="mt-1 text-white/80">Normally {money(prize.price)} · {reaction}</p>
        </div>
      )}
    </div>
  )
}
