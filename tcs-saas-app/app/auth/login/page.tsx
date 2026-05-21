'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { login } from '@/lib/actions/auth'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/'
  const [toast, setToast] = useState<{ message: string; type: 'error' } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setToast(null)
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('redirectTo', redirectTo)
    const result = await login(formData)
    if (result?.error) {
      setToast({ message: result.error, type: 'error' })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-brand-bg flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-[430px] flex flex-col gap-8">
        <FadeUp delay={0}>
          <div className="flex flex-col items-center gap-2">
            <motion.div
              className="w-16 h-16 rounded-2xl bg-brand-accent flex items-center justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, type: 'spring', damping: 14 }}
            >
              <span className="font-display font-semibold text-brand-on-accent text-2xl">TC</span>
            </motion.div>
            <h1 className="font-sans font-bold text-2xl text-brand-text">Masuk</h1>
            <p className="font-sans text-sm text-brand-subtext">Selamat datang kembali</p>
          </div>
        </FadeUp>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FadeUp delay={0.08}>
            <Input name="email" type="email" label="Email" placeholder="kamu@email.com" required autoComplete="email" />
          </FadeUp>
          <FadeUp delay={0.14}>
            <Input name="password" type="password" label="Password" placeholder="••••••••" required autoComplete="current-password" />
          </FadeUp>
          <FadeUp delay={0.2}>
            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? 'Masuk...' : 'Masuk'}
            </Button>
          </FadeUp>
        </form>

        <FadeUp delay={0.26}>
          <p className="font-sans text-sm text-brand-subtext text-center">
            Belum punya akun?{' '}
            <Link href="/auth/register" className="text-brand-accent font-semibold">Daftar</Link>
          </p>
        </FadeUp>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
