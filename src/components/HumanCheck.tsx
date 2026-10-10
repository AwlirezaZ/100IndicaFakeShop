import { Check, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

/**
 * A joke "are you human?" check shown before paying. Every answer passes eventually —
 * it's a parody, not a real security check.
 */
export default function HumanCheck({ images, onPass, onCancel }: { images: string[]; onPass: () => void; onCancel: () => void }) {
  const [kind] = useState<'gary' | 'hotdog'>(() => (Math.random() < 0.5 ? 'gary' : 'hotdog'))
  const [picked, setPicked] = useState<number[]>([])
  const [verdict, setVerdict] = useState<{ ok: boolean; text: string } | null>(null)
  const [wrongs, setWrongs] = useState(0)
  const [shake, setShake] = useState(0)

  const header = (
    <div className="flex items-center gap-2 border-b border-line pb-4 text-sm font-semibold text-tint-ink">
      <ShieldCheck size={18} /> IndiCHA™ · Human verification
    </div>
  )

  const passButton = (
    <button onClick={onPass} className="mt-5 w-full rounded-full bg-brand-600 py-3.5 font-semibold text-white hover:bg-brand-700">
      Continue to payment
    </button>
  )

  if (kind === 'gary') {
    return (
      <div>
        {header}
        <h2 className="mt-4 text-xl font-bold">Select all images containing Gary</h2>
        <p className="mt-1 text-sm text-muted">If there are none, click verify.</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {images.slice(0, 9).map((src, i) => {
            const on = picked.includes(i)
            return (
              <button
                key={i}
                disabled={!!verdict}
                onClick={() => setPicked(on ? picked.filter((x) => x !== i) : [...picked, i])}
                className={`relative aspect-square overflow-hidden rounded-xl bg-well p-2 transition ${on ? 'scale-90 ring-4 ring-brand-500' : 'hover:opacity-80'}`}
              >
                <img src={src} alt="" className="size-full object-contain" />
                {on && (
                  <span className="absolute top-1 left-1 grid size-5 place-items-center rounded-full bg-brand-600 text-white">
                    <Check size={12} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {verdict ? (
          <div className="animate-pop-in">
            <p className={`mt-4 rounded-xl p-3 text-sm ${verdict.ok ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200'}`}>
              {verdict.text}
            </p>
            {passButton}
          </div>
        ) : (
          <div className="mt-5 flex gap-2">
            <button onClick={onCancel} className="rounded-full border border-line px-5 py-3 text-sm font-medium hover:bg-soft">
              Cancel
            </button>
            <button
              onClick={() =>
                setVerdict(
                  picked.length === 0
                    ? { ok: true, text: '✅ Correct! Gary is never in pictures. He’s camera-shy. Welcome, human.' }
                    : {
                        ok: false,
                        text: `🤔 That’s not Gary. ${picked.length === 1 ? 'That’s a product.' : 'Those are products.'} Gary is never in pictures. You seem human enough though.`,
                      },
                )
              }
              className="flex-1 rounded-full bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700"
            >
              Verify
            </button>
          </div>
        )}
      </div>
    )
  }

  // Hotdog edition
  return (
    <div>
      {header}
      <div className="mt-6 text-center">
        <div key={shake} className={`text-6xl ${shake ? 'animate-[wiggle_.4s]' : ''}`}>
          🌭
        </div>
        <h2 className="mt-4 text-xl font-bold">Is a hotdog a sandwich?</h2>
        <p className="mt-1 text-sm text-muted">Only a human can answer this correctly.</p>

        {verdict ? (
          <div className="animate-pop-in">
            <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
              {verdict.text}
            </p>
            {passButton}
          </div>
        ) : (
          <>
            {wrongs > 0 && <p className="animate-pop-in mt-4 font-semibold text-rose-600 dark:text-rose-400">❌ Wrong.{wrongs > 1 && ' Also wrong.'}</p>}
            <div className="mt-5 grid grid-cols-2 gap-3">
              {['Yes', 'No'].map((a) => (
                <button
                  key={a}
                  onClick={() => {
                    setWrongs((w) => w + 1)
                    setShake((s) => s + 1)
                  }}
                  className="rounded-full border border-line py-3 font-semibold hover:bg-soft"
                >
                  {a}
                </button>
              ))}
            </div>
            {wrongs > 0 && (
              <button
                onClick={() => setVerdict({ ok: true, text: '✅ Correct. Nobody knows. Welcome, fellow human.' })}
                className="animate-pop-in mt-3 w-full rounded-full bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700"
              >
                It’s complicated
              </button>
            )}
            <button onClick={onCancel} className="mt-3 text-sm font-medium text-muted hover:text-ink">
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}
