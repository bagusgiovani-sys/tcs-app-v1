'use client'

import { useState } from 'react'
import Link from 'next/link'
import { register } from '@/lib/actions/auth'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await register(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-brand-bg flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-[430px] flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-brand-accent flex items-center justify-center">
            <span className="font-display font-semibold text-brand-on-accent text-2xl">TC</span>
          </div>
          <h1 className="font-sans font-bold text-2xl text-brand-text">Buat Akun</h1>
          <p className="font-sans text-sm text-brand-subtext">Pesan kopi favoritmu langsung</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            name="name"
            type="text"
            label="Nama Lengkap"
            placeholder="Nama kamu"
            required
            autoComplete="name"
          />
          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="kamu@email.com"
            required
            autoComplete="email"
          />
          <Input
            name="password"
            type="password"
            label="Password"
            placeholder="Min. 8 karakter"
            required
            minLength={8}
            autoComplete="new-password"
          />

          {error && (
            <p className="text-red-400 text-sm font-sans text-center">{error}</p>
          )}

          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
          </Button>
        </form>

        {/* Footer */}
        <p className="font-sans text-sm text-brand-subtext text-center">
          Sudah punya akun?{' '}
          <Link href="/auth/login" className="text-brand-accent font-semibold">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}
