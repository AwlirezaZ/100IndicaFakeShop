import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { useCurrency } from './lib/currency'
import CartDrawer from './components/CartDrawer'
import CookieBanner from './components/CookieBanner'
import Footer from './components/Footer'
import Header from './components/Header'
import PressureToasts from './components/PressureToasts'
import IndicaMode from './components/IndicaMode'
import AchievementToast from './components/AchievementToast'
import { LostPage, StaticCharge } from './components/Trolls'
import {
  CursorTrail,
  NewsletterPopup,
  RageClick,
  RetroMode,
  Screensaver,
  TabTitle,
  TimeGreeting,
} from './components/SiteGags'
import About from './pages/About'
import Achievements from './pages/Achievements'
import SpinWheel from './components/SpinWheel'
import SupportBot from './components/SupportBot'
import Checkout from './pages/Checkout'
import Home from './pages/Home'
import OrderConfirmation from './pages/OrderConfirmation'
import Orders from './pages/Orders'
import ProductDetail from './pages/ProductDetail'
import Products from './pages/Products'
import Returns from './pages/Returns'
import TrackOrder from './pages/TrackOrder'
import Wrapped from './pages/Wrapped'

function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, search])
  return null
}

export default function App() {
  // Re-render everything when the currency changes, so every price redraws in bananas/pizzas/etc.
  useCurrency((s) => s.currency)

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4">
        <TimeGreeting />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderConfirmation />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/track/:id" element={<TrackOrder />} />
          <Route path="/wrapped" element={<Wrapped />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/about" element={<About />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="*" element={<LostPage />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <SupportBot />
      <PressureToasts />
      <SpinWheel />
      <IndicaMode />
      <TabTitle />
      <Screensaver />
      <RageClick />
      <StaticCharge />
      <RetroMode />
      <CursorTrail />
      <NewsletterPopup />
      <AchievementToast />
      <CookieBanner />
    </div>
  )
}
