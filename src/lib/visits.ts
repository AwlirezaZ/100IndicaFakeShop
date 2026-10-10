// Visitor counting without a backend: each page open pings Abacus, a free counting API
// (https://v2.jasoncameron.dev/abacus/). Only numbers are stored there, nothing about the visitor.
//
// See the totals any time by opening these in a browser:
//   https://abacus.jasoncameron.dev/get/sadindica-staticdomains-app/visitors  (each browser once, ever)
//   https://abacus.jasoncameron.dev/get/sadindica-staticdomains-app/visits    (once per browsing session)
const API = 'https://abacus.jasoncameron.dev'
const NAMESPACE = 'sadindica-staticdomains-app'

// Opening the file locally or on the dev server only reads the numbers, so testing doesn't inflate them.
const isLocal = !location.hostname || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)

// "Already counted" markers. They're only set after a count succeeds, so a blocked request is retried next time.
const VISITOR_KEY = '100indica-visitor-counted' // localStorage: this browser has been counted as a visitor
const SESSION_KEY = '100indica-visit-counted' // sessionStorage: this browsing session has been counted as a visit

function counted(storage: () => Storage, key: string) {
  try {
    return !!storage().getItem(key)
  } catch {
    return true // storage blocked: don't count, rather than count every page view
  }
}
function markCounted(storage: () => Storage, key: string) {
  try {
    storage().setItem(key, '1')
  } catch {
    // ignore
  }
}

/**
 * Calls Abacus with a <script> tag (JSONP) instead of fetch(): static.app serves pages with
 * `Content-Security-Policy: connect-src 'self' …`, which blocks fetch() to other sites but not scripts.
 */
function jsonp(path: string): Promise<{ value: number }> {
  return new Promise((resolve, reject) => {
    const name = '__abacus' + Math.random().toString(36).slice(2)
    const script = document.createElement('script')
    const w = window as unknown as Record<string, unknown>
    const cleanup = () => {
      delete w[name]
      script.remove()
      clearTimeout(timer)
    }
    const timer = setTimeout(() => (cleanup(), reject(new Error('timeout'))), 10000)
    w[name] = (data: { value: number }) => (cleanup(), resolve(data))
    script.onerror = () => (cleanup(), reject(new Error('blocked')))
    script.src = `${API}/${path}?callback=${name}`
    document.head.append(script)
  })
}

let cached: Promise<number | null> | null = null

/** Counts this visit (once) and resolves to the total number of visitors, or null if the API is unreachable. */
export function countVisit(): Promise<number | null> {
  cached ??= (async () => {
    try {
      if (!isLocal && !counted(() => sessionStorage, SESSION_KEY)) {
        jsonp(`hit/${NAMESPACE}/visits`)
          .then(() => markCounted(() => sessionStorage, SESSION_KEY))
          .catch(() => {})
      }
      const newVisitor = !isLocal && !counted(() => localStorage, VISITOR_KEY)
      const { value } = await jsonp(`${newVisitor ? 'hit' : 'get'}/${NAMESPACE}/visitors`)
      if (newVisitor) markCounted(() => localStorage, VISITOR_KEY)
      return value
    } catch {
      return null
    }
  })()
  return cached
}
