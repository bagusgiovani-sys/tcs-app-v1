'use client'

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AdminError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-center px-6">
      <p className="text-3xl">⚠️</p>
      <h2 className="font-sans font-bold text-lg text-brand-text">Halaman admin error</h2>
      <p className="font-sans text-sm text-brand-subtext">
        Terjadi kesalahan saat memuat halaman ini.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-xl bg-brand-accent text-brand-on-accent font-sans font-semibold text-sm"
      >
        Coba lagi
      </button>
    </div>
  )
}
