'use client'

import { useEffect } from 'react'

export default function POSError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[POSError]', error)
  }, [error])

  return (
    <div className="min-h-dvh bg-brand-bg flex flex-col items-center justify-center px-6 text-center gap-4">
      <p className="text-4xl">🖨️</p>
      <h1 className="font-sans font-bold text-xl text-brand-text">POS Error</h1>
      <p className="font-sans text-sm text-brand-subtext">
        Kasir mengalami masalah. Tap tombol di bawah untuk memuat ulang.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-xl bg-brand-accent text-brand-on-accent font-sans font-semibold text-sm"
      >
        Muat Ulang
      </button>
    </div>
  )
}
