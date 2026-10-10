import { MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAchievements } from '../lib/achievements'

interface Msg {
  from: 'bot' | 'me'
  text: string
}

// [pattern, possible replies] — first matching pattern wins.
const REPLIES: [RegExp, string[]][] = [
  [/\b(coin|coins|indicoins|points|rewards?)\b/, ['IndiCoins are worth exactly $0.00. We checked twice.', 'You can redeem IndiCoins for nothing. Great value!']],
  [/\b(wheel|spin)\b/, ['The wheel is completely fair. 👀', 'Nobody has ever won 90% off. But you could be the first! (You won’t.)']],
  [/\b(potato|potatoes)\b/, ['The potato always wins. Always. 🥔', 'We don’t talk about the potato.']],
  [/\b(banana|bananas|pizza|currency)\b/, ['Prices in bananas are our most accurate prices. 🍌', 'One pizza is worth $12. This is economics.']],
  [/\b(tip|tips|tipping)\b/, ['Tipping is optional. Being sad about it is mandatory. 😢']],
  [/\b(pigeon|teleport)\b/, ['Our pigeon is named Kevin. Kevin does not take feedback.', 'Teleport is coming in 2087. Please be patient.']],
  [
    /\b(hi|hello|hey|yo|sup|salam|hiya)\b/,
    [
      'Oh. A customer. Hi. 🙄',
      'Hello. Please keep it short, I’m technically on my break.',
      'Welcome to 100Indica Shop support, where your problems become our problems. Unfortunately.',
    ],
  ],
  [
    /\b(where|track|tracking|deliver|delivery|shipping|ship|arrive|late|gary)\b/,
    [
      'Your order is somewhere between our warehouse and your house. Probably.',
      'Have you tried waiting? Waiting is very popular this season. 🕰️',
      'Gary is handling your delivery. I’m so sorry.',
      'You can watch your order live from the “Track order” button. Bring snacks. Gary did.',
    ],
  ],
  [
    /\b(refund|money back|return|returns|reimburse)\b/,
    [
      'Refunds are processed within 3–5 business centuries.',
      'I’ve forwarded your refund request to our Department of Ignoring Things.',
      'Sure! Please return the item by carrier pigeon. Pigeon not included. 🐦',
    ],
  ],
  [
    /\b(human|agent|person|manager|real|someone|operator)\b/,
    [
      'I AM the human. 🤖',
      'All our humans are busy pretending to be busy. Please hold. 🎵 (the hold music is me humming)',
      'Connecting you to a manager… … … the manager said no.',
    ],
  ],
  [
    /\b(price|prices|expensive|discount|coupon|code|cheap|sale|deal)\b/,
    [
      'Our prices are fake, so technically they’re the lowest on the internet.',
      'Use code NOPE at checkout for 0% off. You’re welcome.',
      'Expensive? Have you seen how much it costs to keep Gary fed?',
    ],
  ],
  [
    /\b(pay|paid|payment|card|charged|charge|money|bank)\b/,
    [
      'Relax, 100Indica Shop never charges real money. Our accountant is a goldfish. 🐟',
      'Your card details are safe. We forgot them immediately. On purpose, this time.',
    ],
  ],
  [/\b(cancel|cancellation)\b/, ['Cancelling is easy! Just travel back in time and don’t press “Pay”. ⏳']],
  [
    /\b(thanks|thank you|thx|ty|cheers)\b/,
    ['Finally, some appreciation. You may go now. 😌', 'You’re welcome. This chat will self-destruct in 5… 4…'],
  ],
  [
    /\b(bad|worst|terrible|hate|stupid|useless|awful|angry|rude|annoying)\b/,
    [
      'I’m sorry you feel that way. I, too, feel that way. 😔',
      'Your feedback has been printed out and placed directly in the recycling bin. ♻️',
      'Wow. Okay. I’m telling Gary.',
    ],
  ],
  [/\b(love|cute|nice|good bot|great|awesome)\b/, ['Ew. Feelings. 😳', 'Stop it, I’m blushing in binary. 01100010']],
  [
    /\b(joke|funny|laugh)\b/,
    [
      'Why did the shopping cart break up with the checkout? It needed space. 🛒',
      'Our delivery times. That’s the joke.',
    ],
  ],
  [/\b(indica|100indica)\b/, ['Yes, it’s called 100Indica Shop. No, we won’t explain the name. It’s 100% a lightning bolt. ⚡', 'Indica is not available to take your call. Indica is a logo.']],
  [/\b(help|problem|issue|question)\b/, ['Help is a strong word. Let’s say I’m “assistance-adjacent”.']],
]

const FALLBACK = [
  'Hmm. Interesting. Anyway.',
  'I have read your message and chosen to feel nothing.',
  'Could you rephrase that, but less?',
  'Have you tried turning your expectations off and on again?',
  'Let me check… (doesn’t check) …nope.',
  '*sighs in customer service*',
]

const QUICK = ['Where is my order?', 'I want a refund', 'Talk to a human']

const pick = <T,>(arr: T[], avoid?: T) => {
  const options = arr.length > 1 ? arr.filter((x) => x !== avoid) : arr
  return options[Math.floor(Math.random() * options.length)]
}

export default function SupportBot() {
  const [open, setOpen] = useState(false)
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([
    { from: 'bot', text: 'Hi, I’m Indi-bot 🤖. How can I pretend to help you today?' },
  ])
  const listRef = useRef<HTMLDivElement>(null)
  const lastReply = useRef<string>(undefined)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing, open])

  const send = (text: string) => {
    const clean = text.trim()
    if (!clean || typing) return
    setInput('')
    setMessages((m) => [...m, { from: 'me', text: clean }])
    useAchievements.getState().countBotMessage()
    setTyping(true)

    const lower = clean.toLowerCase()
    const pool = REPLIES.find(([re]) => re.test(lower))?.[1] ?? FALLBACK
    const reply = pick(pool, lastReply.current)
    lastReply.current = reply

    // Pretend to think. Customer service is hard.
    setTimeout(() => {
      setTyping(false)
      setMessages((m) => [...m, { from: 'bot', text: reply }])
    }, 900 + Math.random() * 1300)
  }

  return (
    <>
      {open && (
        <div className="animate-pop-in fixed right-4 bottom-24 z-40 flex h-[min(520px,calc(100vh-8rem))] w-[min(370px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl">
          <div className="flex items-center gap-3 bg-gradient-to-r from-brand-700 to-brand-500 px-4 py-3 text-white">
            <div className="grid size-10 place-items-center rounded-full bg-white/20 text-xl">🤖</div>
            <div className="flex-1">
              <p className="font-semibold">Indi-bot</p>
              <p className="flex items-center gap-1.5 text-xs text-white/80">
                <span className="size-2 rounded-full bg-emerald-400" /> Online (unfortunately)
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-white/15" aria-label="Close chat">
              <X size={18} />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : ''}`}>
                <p
                  className={`animate-pop-in max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.from === 'me' ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md bg-soft'}`}
                >
                  {m.text}
                </p>
              </div>
            ))}
            {typing && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="flex gap-1 rounded-2xl rounded-bl-md bg-soft px-3.5 py-3">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="size-1.5 animate-bounce rounded-full bg-faint" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
                Indi-bot is typing (reluctantly)…
              </div>
            )}
          </div>

          {messages.length < 3 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-line px-3 py-1 text-xs font-medium hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="flex gap-2 border-t border-line p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your complaint…"
              className="h-10 flex-1 rounded-full border border-line bg-soft px-4 text-sm outline-none placeholder:text-faint focus:border-brand-500 focus:ring-4 focus:ring-focus"
            />
            <button
              disabled={!input.trim() || typing}
              className="grid size-10 place-items-center rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed right-4 bottom-4 z-40 grid size-14 place-items-center rounded-full bg-gradient-to-br from-brand-700 to-brand-500 text-white shadow-xl transition hover:scale-105 active:scale-95"
        aria-label={open ? 'Close support chat' : 'Open support chat'}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </>
  )
}
