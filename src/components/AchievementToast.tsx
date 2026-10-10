import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ACHIEVEMENTS, useAchievements, type AchievementId } from '../lib/achievements'
import { playAchievement } from '../lib/fun'

/** Xbox-style "Achievement unlocked" pop-up. Shows unlocks one at a time. */
export default function AchievementToast() {
  const latest = useAchievements((s) => s.latest)
  const [queue, setQueue] = useState<AchievementId[]>([])
  const [showing, setShowing] = useState<AchievementId | null>(null)

  useEffect(() => {
    if (latest) setQueue((q) => [...q, latest.id])
  }, [latest])

  useEffect(() => {
    if (showing || !queue.length) return
    const [next, ...rest] = queue
    setShowing(next)
    setQueue(rest)
    playAchievement()
  }, [queue, showing])

  useEffect(() => {
    if (!showing) return
    const t = setTimeout(() => setShowing(null), 4200)
    return () => clearTimeout(t)
  }, [showing])

  if (!showing) return null
  const a = ACHIEVEMENTS[showing]

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[88] flex justify-center px-4">
      <Link
        to="/achievements"
        onClick={() => setShowing(null)}
        className="animate-pop-in pointer-events-auto flex items-center gap-4 rounded-full bg-slate-900 py-2.5 pr-6 pl-2.5 text-white shadow-2xl ring-2 ring-amber-400/70"
      >
        <span className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-2xl">{a.emoji}</span>
        <span>
          <span className="block text-xs font-semibold tracking-wide text-amber-300 uppercase">🏆 Achievement unlocked</span>
          <span className="block font-bold">{a.title}</span>
          <span className="block text-xs text-white/70">{a.desc}</span>
        </span>
      </Link>
    </div>
  )
}
