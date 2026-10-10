import { LoaderCircle, WifiOff } from 'lucide-react'

export function Loading({ label = 'Loading products…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-32 text-muted">
      <LoaderCircle className="animate-spin text-brand-600 dark:text-brand-400" size={32} />
      {label}
    </div>
  )
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-32 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/15">
        <WifiOff />
      </div>
      <h2 className="text-xl font-semibold">Couldn't load products</h2>
      <p className="text-muted">The product catalog comes from the internet. Please check your connection and try again.</p>
      <button onClick={onRetry} className="rounded-full bg-brand-600 px-6 py-2.5 font-medium text-white hover:bg-brand-700">
        Try again
      </button>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-line bg-surface p-4">
          <div className="aspect-square rounded-xl bg-soft" />
          <div className="mt-4 h-3 w-1/3 rounded bg-soft" />
          <div className="mt-2 h-4 w-4/5 rounded bg-soft" />
          <div className="mt-4 h-5 w-1/4 rounded bg-soft" />
        </div>
      ))}
    </div>
  )
}
