import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// Very scientific exchange rates.
export const CURRENCIES = {
  usd: { label: '🇺🇸 US Dollars' },
  banana: { label: '🍌 Bananas' }, // 1 banana = $0.25
  pizza: { label: '🍕 Pizzas' }, // 1 pizza = $12
  gary: { label: '⏱️ Gary-hours' }, // Gary earns $7.25/hour
} as const
export type Currency = keyof typeof CURRENCIES

export const useCurrency = create<{ currency: Currency; setCurrency: (c: Currency) => void }>()(
  persist((set) => ({ currency: 'usd', setCurrency: (currency) => set({ currency }) }), {
    name: '100indica-currency',
    // If storage is blocked, zustand just skips saving; the choice lasts until reload.
    storage: createJSONStorage(() => localStorage),
  }),
)

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

/** Formats a USD amount in whatever silly currency is selected. */
export function formatMoney(n: number) {
  switch (useCurrency.getState().currency) {
    case 'banana':
      return `${Math.round(n * 4).toLocaleString()} 🍌`
    case 'pizza': {
      const p = n / 12
      return `${p.toLocaleString('en-US', { maximumFractionDigits: p < 1 ? 2 : 1 })} 🍕`
    }
    case 'gary':
      return `${(n / 7.25).toLocaleString('en-US', { maximumFractionDigits: 1 })} Gary-hrs`
    default:
      return usd.format(n)
  }
}
