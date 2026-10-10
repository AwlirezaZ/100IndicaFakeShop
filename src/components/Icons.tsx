// Inline SVG stand-ins for emojis that Windows can't draw (🪩 and 🪙 are missing from Segoe UI Emoji).

/** IndiCoin: a gold coin with the 100Indica lightning bolt. */
export function IndiCoin({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={`inline-block shrink-0 ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#f59e0b" />
      <circle cx="12" cy="12" r="8.5" fill="#fcd34d" stroke="#d97706" strokeWidth="1" />
      <path d="M13.6 5.5 8.6 13h3.2l-1.4 5.5 5-7.5h-3.2z" fill="#a855f7" stroke="#1f1235" strokeWidth=".8" strokeLinejoin="round" />
    </svg>
  )
}

/** A disco ball on a string. Also used by the disco-mode CSS (see `.disco` in index.css). */
export function DiscoBall({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={`inline-block shrink-0 ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#94a3b8" />
      <g fill="#e2e8f0">
        <rect x="6" y="5" width="3.4" height="3.4" rx=".5" />
        <rect x="10.3" y="3.2" width="3.4" height="3.4" rx=".5" />
        <rect x="14.6" y="5" width="3.4" height="3.4" rx=".5" />
        <rect x="4" y="9.6" width="3.4" height="3.4" rx=".5" />
        <rect x="10.3" y="10.3" width="3.4" height="3.4" rx=".5" />
        <rect x="16.6" y="9.6" width="3.4" height="3.4" rx=".5" />
        <rect x="6" y="15" width="3.4" height="3.4" rx=".5" />
        <rect x="14.6" y="15" width="3.4" height="3.4" rx=".5" />
      </g>
      <g fill="#f0abfc">
        <rect x="8.2" y="7.4" width="2.6" height="2.6" rx=".4" />
        <rect x="13.4" y="13.8" width="2.6" height="2.6" rx=".4" />
      </g>
      <g fill="#67e8f9">
        <rect x="13.2" y="7.4" width="2.6" height="2.6" rx=".4" />
        <rect x="8.2" y="13.8" width="2.6" height="2.6" rx=".4" />
      </g>
      <circle cx="8" cy="7" r="1.6" fill="#fff" />
    </svg>
  )
}

/** Instagram glyph (lucide 1.x dropped brand icons). */
export function InstagramIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`inline-block shrink-0 ${className}`} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".6" fill="currentColor" />
    </svg>
  )
}

