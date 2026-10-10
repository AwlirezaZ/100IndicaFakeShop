import { CircleX, Info, LoaderCircle, Lock, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import HumanCheck from '../components/HumanCheck'
import { unlock } from '../lib/achievements'
import IndiLater from '../components/IndiLater'
import { CouponBox, Hesitation, MumCheckbox, RelapsingProgress, TermsCheckbox } from '../components/Trolls'
import { money, useProducts } from '../lib/api'
import { confetti, playChaChing, playSadTrombone } from '../lib/fun'
import {
  computeTotals,
  deliveryEstimate,
  GIFT_WRAPS,
  SHIPPING_LABELS,
  useShop,
  type Address,
  type GiftWrapId,
  type Order,
  type ShippingMethod,
} from '../lib/store'

interface Card {
  number: string
  name: string
  expiry: string
  cvv: string
}

type Phase = 'idle' | 'human' | 'processing' | 'otp' | 'confirming' | 'declined'

const emptyAddress: Address = { email: '', fullName: '', phone: '', street: '', city: '', state: '', zip: '', country: '' }
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function cardBrand(num: string) {
  const d = num.replace(/\D/g, '')
  if (/^4/.test(d)) return 'VISA'
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard'
  if (/^3[47]/.test(d)) return 'AMEX'
  if (/^6/.test(d)) return 'Discover'
  return 'Card'
}

const formatCardNumber = (v: string) =>
  v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim()

const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

function Field({
  label,
  error,
  className = '',
  ...props
}: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-body">{label}</span>
      <input
        {...props}
        className={`h-12 w-full rounded-xl border bg-surface px-4 outline-none transition focus:ring-4 ${error ? 'border-rose-400 focus:ring-rose-100' : 'border-line focus:border-brand-500 focus:ring-focus'}`}
      />
      {error && <span data-error className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  )
}

function CardPreview({ card, flipped }: { card: Card; flipped: boolean }) {
  const brand = cardBrand(card.number)
  const digits = card.number.replace(/\D/g, '')
  const shown = (digits + '•'.repeat(Math.max(0, 16 - digits.length))).replace(/(.{4})/g, '$1 ').trim()
  const gradient =
    brand === 'VISA'
      ? 'from-blue-700 via-indigo-700 to-slate-900'
      : brand === 'Mastercard'
        ? 'from-orange-500 via-rose-600 to-slate-900'
        : brand === 'AMEX'
          ? 'from-teal-500 via-cyan-700 to-slate-900'
          : 'from-slate-700 via-slate-800 to-slate-950'

  return (
    <div className="card-3d mx-auto aspect-[1.586] w-full max-w-sm">
      <div className={`card-inner relative size-full ${flipped ? 'flipped' : ''}`}>
        <div className={`card-face absolute inset-0 flex flex-col justify-between rounded-2xl bg-gradient-to-br p-6 text-white shadow-2xl transition-colors duration-500 ${gradient}`}>
          <div className="flex items-start justify-between">
            <div className="h-9 w-12 rounded-md bg-gradient-to-br from-amber-200 to-amber-500 shadow-inner" />
            <span className="text-lg font-bold tracking-wider italic">{brand}</span>
          </div>
          <p className="font-mono text-xl tracking-widest sm:text-2xl">{shown}</p>
          <div className="flex justify-between text-sm">
            <div className="min-w-0">
              <p className="text-[10px] tracking-wider text-white/60 uppercase">Card holder</p>
              <p className="truncate font-medium uppercase">{card.name || 'Your name'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] tracking-wider text-white/60 uppercase">Expires</p>
              <p className="font-medium">{card.expiry || 'MM/YY'}</p>
            </div>
          </div>
        </div>
        <div className={`card-face card-back absolute inset-0 rounded-2xl bg-gradient-to-br py-6 text-white shadow-2xl ${gradient}`}>
          <div className="h-11 bg-slate-950" />
          <div className="mx-6 mt-6 flex h-10 items-center justify-end rounded bg-white/90 px-3 font-mono text-slate-900 italic">
            {card.cvv || '•••'}
          </div>
          <p className="mx-6 mt-2 text-right text-[10px] text-white/60 uppercase">Security code</p>
        </div>
      </div>
    </div>
  )
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="animate-fade-in absolute inset-0 bg-indica-night/60 backdrop-blur-sm" />
      <div className="animate-pop-in relative w-full max-w-md rounded-3xl bg-surface p-8 shadow-2xl">{children}</div>
    </div>
  )
}

export default function Checkout() {
  const { cart, addOrder, clearCart } = useShop()
  const navigate = useNavigate()
  const [address, setAddress] = useState<Address>(emptyAddress)
  const [method, setMethod] = useState<ShippingMethod>('standard')
  const [card, setCard] = useState<Card>({ number: '', name: '', expiry: '', cvv: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [flipped, setFlipped] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [wrap, setWrap] = useState<GiftWrapId>('none')
  const [isHuman, setIsHuman] = useState(false)
  const [coupon, setCoupon] = useState({ amount: 0, code: '' })
  const [agreed, setAgreed] = useState(false)
  const [termsError, setTermsError] = useState(false)
  const { data: products } = useProducts()

  // Nine random product photos for the "select all images containing Gary" check.
  const checkImages = useMemo(() => {
    if (!products) return []
    return Array.from({ length: 9 }, () => products[Math.floor(Math.random() * products.length)].thumbnail)
  }, [products])

  const [tipPct, setTipPct] = useState(0.25) // pre-selected "suggested" tip, like every pushy tip screen

  const raw = computeTotals(cart, method, wrap, tipPct)
  const totals = { ...raw, total: raw.total - coupon.amount }

  const chooseTip = (pct: number) => {
    setTipPct(pct)
    if (pct === 0) {
      unlock('cheapskate')
      // No tip? The whole page gets sad for a few seconds.
      document.documentElement.classList.add('sad-mode')
      setTimeout(() => document.documentElement.classList.remove('sad-mode'), 3000)
    }
  }
  const last4 = card.number.replace(/\D/g, '').slice(-4)

  if (cart.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-32 text-center">
        <div className="grid size-16 place-items-center rounded-full bg-soft text-faint">
          <ShoppingBag size={28} />
        </div>
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="text-muted">Add a few things to your cart before checking out.</p>
        <Link to="/products" className="rounded-full bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700">
          Browse products
        </Link>
      </div>
    )
  }

  const setA = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [k]: e.target.value })
    setErrors({ ...errors, [k]: '' })
  }

  const setC = (k: keyof Card, format: (v: string) => string = (v) => v) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCard({ ...card, [k]: format(e.target.value) })
    setErrors({ ...errors, [k]: '' })
  }

  const autofill = () => {
    setAddress({
      email: 'jane.doe@example.com',
      fullName: 'Jane Doe',
      phone: '+1 555 0134',
      street: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'OR',
      zip: '97403',
      country: 'United States',
    })
    setCard({ number: '4242 4242 4242 4242', name: 'Jane Doe', expiry: '12/29', cvv: '123' })
    setErrors({})
  }

  // Deliberately loose: any data is accepted as long as it looks roughly like the right shape.
  const validate = () => {
    const e: Record<string, string> = {}
    const required: (keyof Address)[] = ['email', 'fullName', 'street', 'city', 'zip', 'country']
    for (const k of required) if (!address[k].trim()) e[k] = 'Required'
    if (card.number.replace(/\D/g, '').length < 12) e.number = 'Enter at least 12 digits'
    if (!card.name.trim()) e.name = 'Required'
    const [mm] = card.expiry.split('/')
    if (!/^\d{2}\/\d{2}$/.test(card.expiry) || +mm < 1 || +mm > 12) e.expiry = 'Use MM/YY'
    if (!/^\d{3,4}$/.test(card.cvv)) e.cvv = '3 or 4 digits'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const pay = () => {
    if (!agreed) setTermsError(true)
    if (!validate() || !agreed) {
      setTimeout(() => document.querySelector('[data-error]')?.closest('label')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
      return
    }
    // The joke human check only appears once per checkout.
    if (!isHuman && checkImages.length) return setPhase('human')
    void charge()
  }

  // The "processing" phase shows RelapsingProgress, which calls this when Gary is done tripping over things.
  const charge = () => setPhase('processing')
  const afterProcessing = () => {
    if (last4 === '0000') {
      playSadTrombone()
      unlock('declined')
      return setPhase('declined')
    }
    setOtp('')
    setOtpError('')
    setPhase('otp')
  }

  const confirmOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(otp)) return setOtpError('Please enter the 6-digit code')
    setPhase('confirming')
    await wait(1500)
    const order: Order = {
      id: 'IND-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
      createdAt: new Date().toISOString(),
      items: cart,
      address,
      shippingMethod: method,
      ...totals,
      giftWrapLabel: wrap === 'none' ? undefined : GIFT_WRAPS.find((w) => w.id === wrap)?.label,
      payment: { brand: cardBrand(card.number), last4, holder: card.name },
    }
    playChaChing()
    confetti()
    addOrder(order)
    unlock('first-order')
    navigate(`/order/${order.id}`, { replace: true })
    clearCart()
  }

  const now = new Date().toISOString()
  const step = (n: number, title: string) => (
    <h2 className="flex items-center gap-3 text-lg font-semibold">
      <span className="grid size-7 place-items-center rounded-full bg-ink text-sm text-page">{n}</span>
      {title}
    </h2>
  )

  return (
    <div className="pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <button
          onClick={autofill}
          className="flex items-center gap-2 rounded-full border border-brand-200 bg-tint px-4 py-2 text-sm font-medium text-tint-ink hover:bg-brand-100 dark:border-brand-500/40 dark:hover:bg-brand-500/25"
        >
          <Sparkles size={16} /> Autofill demo details
        </button>
      </div>

      <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <Info size={18} className="mt-0.5 shrink-0" />
        <p>
          <b>This is a demo store.</b> No real payment is made — type any name, address and card number you like. Tip: a
          card number ending in <b>0000</b> will be declined, so you can see what that looks like too.
        </p>
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* Contact & shipping */}
          <section className="rounded-3xl border border-line bg-surface p-6 md:p-8">
            {step(1, 'Contact & shipping address')}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Email" type="email" value={address.email} onChange={setA('email')} error={errors.email} placeholder="you@example.com" className="sm:col-span-2" />
              <Field label="Full name" value={address.fullName} onChange={setA('fullName')} error={errors.fullName} autoComplete="name" />
              <Field label="Phone (optional)" type="tel" value={address.phone} onChange={setA('phone')} />
              <Field label="Street address" value={address.street} onChange={setA('street')} error={errors.street} className="sm:col-span-2" />
              <Field label="City" value={address.city} onChange={setA('city')} error={errors.city} />
              <Field label="State / Province (optional)" value={address.state} onChange={setA('state')} />
              <Field label="ZIP / Postal code" value={address.zip} onChange={setA('zip')} error={errors.zip} />
              <Field label="Country" value={address.country} onChange={setA('country')} error={errors.country} />
            </div>
          </section>

          {/* Delivery */}
          <section className="rounded-3xl border border-line bg-surface p-6 md:p-8">
            {step(2, 'Delivery method')}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {(
                [
                  ['standard', '📦', totals.subtotal >= 50 ? 'Free' : money(4.99)],
                  ['express', '🛵', money(14.99)],
                  ['pigeon', '🐦', 'Free'],
                ] as const
              ).map(([value, icon, price]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition ${method === value ? 'border-brand-500 bg-tint' : 'border-line hover:border-faint'}`}
                >
                  <input type="radio" name="method" checked={method === value} onChange={() => setMethod(value)} className="mt-1 accent-brand-600" />
                  <div className="flex-1">
                    <div className="flex justify-between gap-2 font-medium">
                      <span>
                        {icon} {SHIPPING_LABELS[value]}
                      </span>
                      <span>{price}</span>
                    </div>
                    <p className="text-sm text-muted">Arrives by {deliveryEstimate(now, value)}</p>
                  </div>
                </label>
              ))}
              <label
                className="flex cursor-not-allowed items-start gap-3 rounded-2xl border-2 border-dashed border-line p-4 opacity-60"
                title="Our scientists are working on it"
              >
                <input type="radio" disabled className="mt-1" />
                <div className="flex-1">
                  <div className="flex justify-between gap-2 font-medium">
                    <span>✨ Teleport</span>
                    <span>{money(999)}</span>
                  </div>
                  <p className="text-sm text-muted">Coming in 2087. Probably.</p>
                </div>
              </label>
            </div>

            <h3 className="mt-8 font-semibold">🎁 Gift wrap</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {GIFT_WRAPS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWrap(w.id)}
                  className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition ${wrap === w.id ? 'border-brand-500 bg-tint text-tint-ink' : 'border-line hover:border-faint'}`}
                >
                  {w.label}
                  {w.price > 0 && <span className="ml-1.5 text-muted">+{money(w.price)}</span>}
                </button>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-3xl border border-line bg-surface p-6 md:p-8">
            {step(3, 'Payment')}
            <div className="mt-6 grid items-center gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <Field
                  label="Card number"
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  value={card.number}
                  onChange={setC('number', formatCardNumber)}
                  onFocus={() => setFlipped(false)}
                  error={errors.number}
                />
                <Field
                  label="Name on card"
                  placeholder="Jane Doe"
                  value={card.name}
                  onChange={setC('name')}
                  onFocus={() => setFlipped(false)}
                  error={errors.name}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Expiry"
                    inputMode="numeric"
                    placeholder="MM/YY"
                    value={card.expiry}
                    onChange={setC('expiry', formatExpiry)}
                    onFocus={() => setFlipped(false)}
                    error={errors.expiry}
                  />
                  <Field
                    label="CVV"
                    inputMode="numeric"
                    placeholder="123"
                    value={card.cvv}
                    onChange={setC('cvv', (v) => v.replace(/\D/g, '').slice(0, 4))}
                    onFocus={() => setFlipped(true)}
                    onBlur={() => setFlipped(false)}
                    error={errors.cvv}
                  />
                </div>
              </div>
              <CardPreview card={card} flipped={flipped} />
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="rounded-3xl border border-line bg-surface p-6 lg:sticky lg:top-44">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <ul className="mt-4 max-h-72 space-y-4 overflow-y-auto pr-1">
            {cart.map((i) => (
              <li key={i.id} className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <img src={i.thumbnail} alt="" className="size-14 rounded-xl bg-well object-contain" />
                  <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-slate-700 text-[11px] font-bold text-white">
                    {i.qty}
                  </span>
                </div>
                <p className="line-clamp-2 flex-1 text-sm">{i.title}</p>
                <p className="text-sm font-medium">{money(i.price * i.qty)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-sm font-semibold">☕ Tip the developers?</p>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {[
                [0, 'No tip 😢'],
                [0.15, '15%'],
                [0.2, '20%'],
                [0.25, '25%'],
              ].map(([pct, label]) => (
                <button
                  key={pct}
                  onClick={() => chooseTip(pct as number)}
                  className={`rounded-xl border-2 px-1 py-2 text-xs font-semibold transition ${tipPct === pct ? 'border-brand-500 bg-tint text-tint-ink' : 'border-line hover:border-faint'}`}
                >
                  {label}
                  {pct === 0.25 && <span className="block text-[10px] font-normal text-muted">suggested</span>}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              {
                {
                  0: 'That’s okay. We’ll just… be sad. 😢',
                  0.15: 'Thanks! The developers can now afford half a coffee. ☕',
                  0.2: 'A whole coffee! The developers are weeping. ☕',
                  0.25: 'You’re a legend. Gary is crying happy tears. 😢',
                }[tipPct]
              }
            </p>
          </div>
          <CouponBox onDiscount={(amount, code) => setCoupon({ amount, code })} />
          <dl className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{money(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd>{totals.shipping === 0 ? <span className="font-medium text-emerald-600">Free</span> : money(totals.shipping)}</dd>
            </div>
            {totals.tip > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Tip for the developers</dt>
                <dd>{money(totals.tip)}</dd>
              </div>
            )}
            {coupon.amount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Coupon {coupon.code}</dt>
                <dd className="text-emerald-600">−{money(coupon.amount)}</dd>
              </div>
            )}
            {totals.giftWrap > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Gift wrap</dt>
                <dd>{money(totals.giftWrap)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Estimated tax</dt>
              <dd>{money(totals.tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-lg font-bold">
              <dt>Total</dt>
              <dd>{money(totals.total)}</dd>
            </div>
          </dl>
          <TermsCheckbox
            checked={agreed}
            onChange={(v) => {
              setAgreed(v)
              setTermsError(false)
            }}
            error={termsError}
          />
          <MumCheckbox />
          <Hesitation className="mt-6">
            <button
              onClick={pay}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-4 font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 active:scale-[.99]"
            >
              <Lock size={18} /> Pay {money(totals.total)}
            </button>
          </Hesitation>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldCheck size={14} /> Simulated payment — nothing is charged
          </p>
          <div className="mt-2 text-center">
            <IndiLater className="text-xs" />
          </div>
        </aside>
      </div>

      {phase === 'human' && (
        <Modal>
          <HumanCheck
            images={checkImages}
            onCancel={() => setPhase('idle')}
            onPass={() => {
              setIsHuman(true)
              void charge()
            }}
          />
        </Modal>
      )}

      {phase === 'processing' && (
        <Modal>
          <RelapsingProgress onDone={afterProcessing} />
        </Modal>
      )}

      {phase === 'confirming' && (
        <Modal>
          <div className="flex flex-col items-center py-4 text-center">
            <LoaderCircle size={48} className="animate-spin text-brand-600 dark:text-brand-400" />
            <p className="mt-6 text-lg font-semibold">
              Confirming your payment…
            </p>
            <p className="mt-1 text-sm text-muted">Please don't close this window.</p>
          </div>
        </Modal>
      )}

      {phase === 'otp' && (
        <Modal>
          <form onSubmit={confirmOtp}>
            <div className="flex items-center gap-2 text-sm font-semibold text-tint-ink">
              <ShieldCheck size={18} /> SecurePay verification
            </div>
            <h2 className="mt-4 text-2xl font-bold">Verify it's you</h2>
            <p className="mt-2 text-sm text-body">
              We sent a 6-digit code to the phone number linked to your card. Enter it below to approve this payment.
            </p>
            <dl className="mt-5 space-y-1.5 rounded-2xl bg-soft p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Merchant</dt>
                <dd className="font-medium">100Indica Shop</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Amount</dt>
                <dd className="font-medium">{money(totals.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Card</dt>
                <dd className="font-medium">
                  {cardBrand(card.number)} •••• {last4}
                </dd>
              </div>
            </dl>
            <input
              autoFocus
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                setOtpError('')
              }}
              placeholder="••••••"
              className="mt-5 h-14 w-full rounded-xl border border-line text-center font-mono text-2xl tracking-[0.5em] outline-none focus:border-brand-500 focus:ring-4 focus:ring-focus"
            />
            {otpError ? (
              <p className="mt-2 text-center text-sm text-rose-600">{otpError}</p>
            ) : (
              <p className="mt-2 text-center text-xs text-faint">Demo: any 6 digits will work</p>
            )}
            <button className="mt-5 w-full rounded-full bg-brand-600 py-3.5 font-semibold text-white hover:bg-brand-700">
              Confirm payment
            </button>
            <button
              type="button"
              onClick={() => setPhase('idle')}
              className="mt-2 w-full py-2 text-sm font-medium text-muted hover:text-ink"
            >
              Cancel
            </button>
          </form>
        </Modal>
      )}

      {phase === 'declined' && (
        <Modal>
          <div className="flex flex-col items-center text-center">
            <div className="grid size-16 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-500/15">
              <CircleX size={36} />
            </div>
            <h2 className="mt-5 text-2xl font-bold">Payment declined</h2>
            <p className="mt-2 text-body">
              Your bank declined this payment of {money(totals.total)}. Please check your details or try a different card.
            </p>
            <p className="mt-2 text-xs text-faint">(Demo: cards ending in 0000 are always declined.)</p>
            <button
              onClick={() => setPhase('idle')}
              className="mt-6 w-full rounded-full bg-ink py-3.5 font-semibold text-page hover:bg-body"
            >
              Try another card
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
