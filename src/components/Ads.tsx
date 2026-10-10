import { useState } from 'react'

// Parody banner ads. Clicking the button just admits the ad is fake.
const ADS = [
  { emoji: '🍲', title: 'Hot SOUPS in your area', text: 'They’re waiting for you. They’re very warm.', cta: 'Meet soups', bg: 'from-orange-500 to-red-600' },
  { emoji: '🥔', title: 'Doctors HATE this one weird potato', text: 'Number 7 will shock you. (It’s also a potato.)', cta: 'Learn its secret', bg: 'from-amber-500 to-yellow-600' },
  { emoji: '🛵', title: 'Gary is ready to mingle', text: 'Likes: long drives, getting lost, snacks.', cta: 'Swipe right', bg: 'from-pink-500 to-rose-600' },
  { emoji: '🐦', title: 'Kevin the pigeon is HIRING', text: 'Must be able to fly. Or walk very fast.', cta: 'Apply now', bg: 'from-sky-500 to-indigo-600' },
  { emoji: '🍌', title: 'You won’t BELIEVE what this banana costs', text: 'Economists are furious.', cta: 'Find out ($0.25)', bg: 'from-lime-500 to-green-600' },
  { emoji: '🧀', title: 'Cheese lovers: you are not alone', text: 'Weekly support group. Crackers provided.', cta: 'Join us', bg: 'from-yellow-400 to-orange-500' },
]

function useAd(index: number) {
  const [clicked, setClicked] = useState(false)
  return { ad: ADS[index % ADS.length], clicked, click: () => setClicked(true) }
}

/** An ad the size of a product card, for product grids. */
export function AdCard({ index }: { index: number }) {
  const { ad, clicked, click } = useAd(index)
  return (
    <div className={`relative flex flex-col justify-between rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg ${ad.bg}`}>
      <span className="absolute top-3 right-3 rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">Sponsored</span>
      <div className="mt-6 text-6xl">{ad.emoji}</div>
      <div>
        <p className="mt-4 text-xl leading-tight font-black">{ad.title}</p>
        <p className="mt-2 text-sm text-white/85">{clicked ? '😏 This ad was fake. Like everything here.' : ad.text}</p>
        <button onClick={click} className="mt-4 w-full rounded-full bg-white py-2 text-sm font-bold text-slate-900 hover:bg-white/90">
          {clicked ? 'Gotcha' : ad.cta}
        </button>
      </div>
    </div>
  )
}

/** A wide banner ad, for between page sections. */
export function AdBanner({ index }: { index: number }) {
  const { ad, clicked, click } = useAd(index)
  return (
    <div className={`relative mt-16 flex flex-wrap items-center gap-6 rounded-3xl bg-gradient-to-r px-8 py-6 text-white shadow-lg ${ad.bg}`}>
      <span className="absolute top-3 right-4 rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">Sponsored</span>
      <span className="text-6xl">{ad.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-black">{ad.title}</p>
        <p className="text-white/85">{clicked ? '😏 This ad was fake. Like everything here.' : ad.text}</p>
      </div>
      <button onClick={click} className="rounded-full bg-white px-6 py-3 font-bold text-slate-900 hover:bg-white/90">
        {clicked ? 'Gotcha' : ad.cta}
      </button>
    </div>
  )
}
