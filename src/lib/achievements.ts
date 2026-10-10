import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export const ACHIEVEMENTS = {
  'first-order': { emoji: '🛍️', title: 'Big Spender (of Fake Money)', desc: 'Placed your first order.' },
  'window-shopper': { emoji: '👀', title: 'Window Shopper', desc: 'Looked at 10 products. Bought… we’ll see.' },
  'night-owl': { emoji: '🦉', title: 'Night Owl', desc: 'Shopped between midnight and 5 a.m.' },
  'potato-believer': { emoji: '🥔', title: 'Potato Believer', desc: 'Compared a product with a potato.' },
  'cart-abandoner': { emoji: '💔', title: 'Heartbreaker', desc: 'Broke up with an item in your cart.' },
  declined: { emoji: '💳', title: 'Broke (Not Really)', desc: 'Had a card declined.' },
  cheapskate: { emoji: '💸', title: 'Cheapskate', desc: 'Chose “No tip”. The developers saw that.' },
  'wheel-addict': { emoji: '🎡', title: 'Gambling Problem', desc: 'Used every spin on the wheel.' },
  'indica-mode': { emoji: '⚡', title: 'Secret Agent', desc: 'Found the secret word.' },
  'dancing-queen': { emoji: '🕺', title: 'Dancing Queen', desc: 'Turned on disco mode.' },
  'anger-management': { emoji: '😤', title: 'Anger Management', desc: 'Rage-clicked something.' },
  'banana-economist': { emoji: '🍌', title: 'Banana Economist', desc: 'Changed the currency.' },
  'bot-whisperer': { emoji: '🤖', title: 'Glutton for Punishment', desc: 'Sent 5 messages to Indi-bot.' },
  'gary-fan': { emoji: '🛵', title: 'Gary’s Biggest Fan', desc: 'Watched a whole delivery.' },
  'mystery-solver': { emoji: '🎁', title: 'Mystery Solver', desc: 'Opened a IndiBox™.' },
  'retro-gamer': { emoji: '🎮', title: 'Retro Gamer', desc: 'Entered the Konami code.' },
  'cookie-enemy': { emoji: '🍪', title: 'Cookie Monster’s Enemy', desc: 'Declined all the cookies.' },
  'newsletter-hater': { emoji: '📧', title: 'Hates Saving Money', desc: 'Said no to the newsletter.' },
  'easter-egg': { emoji: '🥚', title: 'Egg Hunter', desc: 'Searched for something special.' },
  'try-it-on': { emoji: '👕', title: 'Fashion Victim', desc: 'Tried on something that isn’t clothing.' },
  'coupon-clipper': { emoji: '🎟️', title: 'Coupon Clipper', desc: 'Tried 3 coupon codes. None worked. Obviously.' },
  'terms-reader': { emoji: '📜', title: 'Lawyer Mode', desc: 'Actually read the terms and conditions. All of them.' },
  'mum-ghoster': { emoji: '👵', title: 'Ghosted Gary’s Mum', desc: 'Unsubscribed before even subscribing.' },
  'over-insured': { emoji: '🛡️', title: 'Over-Insured', desc: 'Protected your protection plan’s protection plan.' },
  'brutally-honest': { emoji: '⭐', title: 'Brutally Honest', desc: 'Tried to leave a low rating. Failed.' },
  waitlisted: { emoji: '🕰️', title: 'Eternal Queue', desc: 'Joined a waitlist. Still waiting.' },
  'fully-charged': { emoji: '⚡', title: 'Fully Charged', desc: 'Built up 100% static charge. Please touch a doorknob.' },
  'gary-finder': { emoji: '🔍', title: 'Where’s Gary?', desc: 'Found Gary on the lost page.' },
  'serial-returner': { emoji: '📦', title: 'Serial Returner', desc: 'Returned something. Kevin is exhausted.' },
} as const

export type AchievementId = keyof typeof ACHIEVEMENTS

interface AchievementState {
  unlocked: Partial<Record<AchievementId, string>> // id → ISO date
  productViews: number
  botMessages: number
  /** Most recent unlock, for the toast. */
  latest: { id: AchievementId; at: number } | null
  unlock: (id: AchievementId) => void
  countProductView: () => void
  countBotMessage: () => void
}

export const useAchievements = create<AchievementState>()(
  persist(
    (set, get) => ({
      unlocked: {},
      productViews: 0,
      botMessages: 0,
      latest: null,
      unlock: (id) => {
        if (get().unlocked[id]) return
        set((s) => ({ unlocked: { ...s.unlocked, [id]: new Date().toISOString() }, latest: { id, at: Date.now() } }))
      },
      countProductView: () => {
        const n = get().productViews + 1
        set({ productViews: n })
        if (n >= 10) get().unlock('window-shopper')
      },
      countBotMessage: () => {
        const n = get().botMessages + 1
        set({ botMessages: n })
        if (n >= 5) get().unlock('bot-whisperer')
      },
    }),
    {
      name: '100indica-achievements',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ unlocked: s.unlocked, productViews: s.productViews, botMessages: s.botMessages }),
    },
  ),
)

/** Shorthand for use outside React components and event handlers. */
export const unlock = (id: AchievementId) => useAchievements.getState().unlock(id)
