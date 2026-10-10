import { useEffect, useState } from 'react'
import { unlock } from '../lib/achievements'
import { confetti } from '../lib/fun'
import { logo } from '../lib/brand'

const SECRET = 'indica'

/** Easter egg: type "indica" anywhere and a giant 100Indica logo bounces across the screen. */
export default function IndicaMode() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    let typed = ''
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1) return
      typed = (typed + e.key.toLowerCase()).slice(-SECRET.length)
      if (typed !== SECRET) return
      typed = ''
      setActive(Date.now())
      confetti()
      unlock('indica-mode')
      const main = document.querySelector('main')
      main?.classList.remove('zap-spin')
      void main?.offsetWidth // restart the animation if it's already running
      main?.classList.add('zap-spin')
      setTimeout(() => main?.classList.remove('zap-spin'), 1300)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => setActive(0), 3200)
    return () => clearTimeout(t)
  }, [active])

  if (!active) return null

  return (
    <div key={active} className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      <img src={logo} alt="" className="ball-across absolute top-0 left-0 size-36 drop-shadow-2xl" />
      <p className="animate-pop-in absolute inset-x-0 top-1/3 text-center text-6xl font-black tracking-tight text-brand-500 drop-shadow-[0_6px_16px_rgb(0_0_0/0.45)] [-webkit-text-stroke:3px_white] [paint-order:stroke_fill] md:text-8xl">
        ⚡ 100% INDICA ⚡
      </p>
    </div>
  )
}
