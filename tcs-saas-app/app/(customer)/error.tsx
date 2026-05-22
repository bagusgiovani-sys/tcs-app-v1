'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[CustomerError]', error)
  }, [error])

  return (
    <div className="min-h-dvh bg-brand-bg flex flex-col items-center justify-center px-6 text-center gap-4">
      <p className="text-4xl">☕</p>
      <h1 className="font-sans font-bold text-xl text-brand-text">Ups, ada yang salah</h1>
      <p className="font-sans text-sm text-brand-subtext">
        Halaman ini mengalami masalah. Coba lagi atau kembali ke menu.
      </p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-brand-accent text-brand-on-accent font-sans font-semibold text-sm"
        >
          Coba lagi
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl border border-brand-border text-brand-subtext font-sans font-semibold text-sm"
        >
          Ke Menu
        </Link>
      </div>
    </div>
  )
}
