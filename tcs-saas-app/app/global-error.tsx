'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="id">
      <body style={{ margin: 0, background: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '360px' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>☕</p>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1A0F0A', marginBottom: '0.5rem' }}>
            Terjadi kesalahan
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#7A4A2A', marginBottom: '1.5rem' }}>
            Aplikasi mengalami masalah tak terduga.
          </p>
          <button
            onClick={reset}
            style={{ background: '#CE9760', color: '#39260B', border: 'none', borderRadius: '12px', padding: '0.75rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
          >
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  )
}
