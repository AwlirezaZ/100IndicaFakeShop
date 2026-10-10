import { CircleCheckBig, CreditCard, MapPin, Truck } from 'lucide-react'
import { Link, useParams } from 'react-router'
import MysteryUnbox from '../components/MysteryUnbox'
import { IndiCoin } from '../components/Icons'
import { money, MYSTERY_ID } from '../lib/api'
import { coinsFor, deliveryEstimate, SHIPPING_LABELS, useShop } from '../lib/store'

export default function OrderConfirmation() {
  const { id } = useParams()
  const order = useShop((s) => s.orders.find((o) => o.id === id))

  if (!order) {
    return (
      <div className="py-32 text-center">
        <p className="text-lg font-medium">Order not found.</p>
        <Link to="/orders" className="mt-4 inline-block font-medium text-brand-600 dark:text-brand-400 hover:underline">
          View your orders
        </Link>
      </div>
    )
  }

  const a = order.address
  const firstName = a.fullName.split(' ')[0]

  return (
    <div className="mx-auto max-w-3xl pt-12">
      <div className="animate-pop-in text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15">
          <CircleCheckBig size={44} />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">Thank you, {firstName}!</h1>
        <p className="mt-2 text-lg text-body">Your payment was successful and your order is confirmed.</p>
        <p className="mt-4 inline-block rounded-full bg-soft px-4 py-1.5 font-mono text-sm">
          Order #{order.id}
        </p>
        <p className="mt-2 text-sm text-muted">A confirmation email has been sent to {a.email}.</p>
        <Link
          to={`/track/${order.id}`}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700"
        >
          🛵 Track your order live
        </Link>
        <p className="mt-4 text-sm text-muted">
          <IndiCoin className="-mt-0.5 mr-1 align-middle" /> You earned <b className="text-ink">{coinsFor(order).toLocaleString()} IndiCoins</b> (worth exactly $0.00)
        </p>
      </div>

      {order.items.some((i) => i.id === MYSTERY_ID) && <MysteryUnbox orderId={order.id} />}

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <Truck size={20} className="text-brand-600 dark:text-brand-400" />
          <p className="mt-3 text-sm text-muted">Estimated delivery</p>
          <p className="font-semibold">{deliveryEstimate(order.createdAt, order.shippingMethod)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <MapPin size={20} className="text-brand-600 dark:text-brand-400" />
          <p className="mt-3 text-sm text-muted">Shipping to</p>
          <p className="font-semibold">{a.fullName}</p>
          <p className="text-sm text-body">
            {a.street}, {a.city} {a.state} {a.zip}, {a.country}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <CreditCard size={20} className="text-brand-600 dark:text-brand-400" />
          <p className="mt-3 text-sm text-muted">Paid with</p>
          <p className="font-semibold">
            {order.payment.brand} •••• {order.payment.last4}
          </p>
          <p className="text-sm text-body">{order.payment.holder}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-surface p-6">
        <ul className="divide-y divide-line">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-4 py-3">
              <img src={i.thumbnail} alt="" className="size-14 rounded-xl bg-well object-contain" />
              <div className="flex-1">
                <p className="text-sm font-medium">{i.title}</p>
                <p className="text-xs text-muted">Qty {i.qty}</p>
              </div>
              <p className="text-sm font-medium">{money(i.price * i.qty)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{money(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Shipping ({SHIPPING_LABELS[order.shippingMethod] ?? order.shippingMethod})</dt>
            <dd>{order.shipping === 0 ? 'Free' : money(order.shipping)}</dd>
          </div>
          {!!order.tip && (
            <div className="flex justify-between">
              <dt className="text-muted">Tip for the developers ☕</dt>
              <dd>{money(order.tip)}</dd>
            </div>
          )}
          {order.giftWrapLabel && (
            <div className="flex justify-between">
              <dt className="text-muted">Gift wrap ({order.giftWrapLabel})</dt>
              <dd>{order.giftWrap ? money(order.giftWrap) : 'Free'}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Tax</dt>
            <dd>{money(order.tax)}</dd>
          </div>
          <div className="flex justify-between pt-2 text-lg font-bold">
            <dt>Total paid</dt>
            <dd>{money(order.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/products" className="rounded-full bg-ink px-6 py-3 font-semibold text-page hover:bg-body">
          Continue shopping
        </Link>
        <Link to="/orders" className="rounded-full border border-line bg-surface px-6 py-3 font-semibold hover:bg-soft">
          View all orders
        </Link>
      </div>
    </div>
  )
}
