import { Link } from 'react-router'
import { InstagramIcon } from '../components/Icons'
import { OWNER_INSTAGRAM } from '../lib/brand'

const TEAM = [
  { emoji: '🧔', name: 'Gary', role: 'Head of Delivery', bio: 'Has never once used a map. Gets lost professionally. Loves snacks, long drives, and your neighbour’s cat.' },
  { emoji: '🐦', name: 'Kevin', role: 'Chief Logistics Pigeon', bio: 'Handles our “Carrier pigeon” shipping. Does not take feedback. Has bitten two managers.' },
  { emoji: '🧑‍🎓', name: 'The Intern', role: 'Packing & Enthusiasm', bio: 'Packs every order with love and an unreasonable amount of bubble wrap. Unpaid. In IndiCoins.' },
  { emoji: '🤖', name: 'Indi-bot', role: 'Customer “Support”', bio: 'Available 24/7. Helpful 0/7. Currently on break.' },
  { emoji: '🥔', name: 'The Potato', role: 'Board Member', bio: 'Undefeated in product comparisons. Holds the deciding vote on everything.' },
  { emoji: '⚡', name: 'Indica', role: 'Not a person', bio: 'People keep asking to speak to Indica. There is no Indica. There is only the bolt.' },
]

const HISTORY = [
  ['2019', '100Indica Shop is founded in a garage. It was Gary’s garage. He didn’t know.'],
  ['2020', 'First order delivered. Only 3 weeks late. Gary calls it “a personal best”.'],
  ['2021', 'Kevin the pigeon joins the logistics team after landing on the desk and refusing to leave.'],
  ['2023', 'The potato is appointed to the board. Share prices rise 400% (in bananas).'],
  ['2024', 'Indi-bot launches. Customer satisfaction drops to an all-time low. Indi-bot is proud.'],
  ['2026', '100Indica Shop reaches 10,000 products and $0.00 in revenue. Champagne is ordered. It hasn’t arrived.'],
]

export default function About() {
  return (
    <div className="mx-auto max-w-4xl pt-10">
      <div className="text-center">
        <p className="text-sm font-semibold tracking-wide text-tint-ink uppercase">About us</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">We sell everything. Technically.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-body">
          100Indica Shop’s mission is simple: to deliver your dreams to your door*.
        </p>
        <p className="mt-1 text-xs text-faint">*or your neighbour’s door. Or a pigeon. Results may vary.</p>
      </div>

      <h2 className="mt-16 text-2xl font-bold tracking-tight">Meet the team</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEAM.map((t) => (
          <div key={t.name} className="rounded-3xl border border-line bg-surface p-6">
            <div className="grid size-16 place-items-center rounded-2xl bg-tint text-4xl">{t.emoji}</div>
            <p className="mt-4 text-lg font-bold">{t.name}</p>
            <p className="text-sm font-medium text-tint-ink">{t.role}</p>
            <p className="mt-2 text-sm text-body">{t.bio}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-16 text-2xl font-bold tracking-tight">Our (very real) history</h2>
      <ol className="mt-6 space-y-5 border-l-2 border-line pl-6">
        {HISTORY.map(([year, text]) => (
          <li key={year} className="relative">
            <span className="absolute top-1 -left-[33px] size-4 rounded-full border-4 border-page bg-brand-500" />
            <p className="font-bold">{year}</p>
            <p className="text-body">{text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-16 rounded-3xl bg-gradient-to-r from-brand-700 to-brand-500 p-8 text-center text-white">
        <h2 className="text-2xl font-black">Our values</h2>
        <p className="mt-2 text-white/85">Honesty (our prices are fake). Speed (Gary is not). Trust (in the potato).</p>
        <Link to="/products" className="mt-5 inline-block rounded-full bg-white px-6 py-3 font-bold text-brand-700">
          Start shopping
        </Link>
        <a
          href={OWNER_INSTAGRAM}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 ml-3 inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 font-bold hover:bg-white/10"
        >
          <InstagramIcon size={18} /> Follow @100indica
        </a>
      </div>
    </div>
  )
}
