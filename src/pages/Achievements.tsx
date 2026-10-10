import { ACHIEVEMENTS, useAchievements, type AchievementId } from '../lib/achievements'

export default function Achievements() {
  const unlocked = useAchievements((s) => s.unlocked)
  const ids = Object.keys(ACHIEVEMENTS) as AchievementId[]
  const count = ids.filter((id) => unlocked[id]).length

  return (
    <div className="mx-auto max-w-4xl pt-8">
      <h1 className="text-3xl font-bold tracking-tight">🏆 Trophy cabinet</h1>
      <p className="mt-1 text-muted">
        {count} of {ids.length} unlocked · Real-world value of all trophies: $0.00
      </p>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-soft">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all" style={{ width: `${(count / ids.length) * 100}%` }} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {ids.map((id) => {
          const a = ACHIEVEMENTS[id]
          const date = unlocked[id]
          return (
            <div
              key={id}
              className={`flex items-center gap-4 rounded-2xl border p-4 ${date ? 'border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10' : 'border-line bg-surface'}`}
            >
              <span
                className={`grid size-14 shrink-0 place-items-center rounded-full text-3xl ${date ? 'bg-gradient-to-br from-amber-300 to-amber-500' : 'bg-soft grayscale'}`}
              >
                {date ? a.emoji : '🔒'}
              </span>
              <div>
                <p className="font-semibold">{date ? a.title : '???'}</p>
                <p className="text-sm text-muted">{a.desc}</p>
                {date && <p className="mt-0.5 text-xs text-faint">Unlocked {new Date(date).toLocaleDateString()}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
