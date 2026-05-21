'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { login } from '@/lib/actions/auth'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'
import AuthBackground from '@/components/auth/AuthBackground'

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, type: 'spring', damping: 18 }}
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
    <AuthBackground>
      {/* Frosted glass card */}
      <motion.div
        className="w-full max-w-[430px] rounded-3xl overflow-hidden"
        style={{ background: 'rgba(251,227,194,0.82)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', damping: 20 }}
      >
        <div className="px-6 pt-7 pb-8 flex flex-col gap-6">
          {/* Logo */}
          <FadeUp delay={0.05}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white/60 flex items-center justify-center shadow-sm overflow-hidden">
                <Image src="/tcs-logo.png" alt="TCS Coffee" width={52} height={52} className="object-contain" />
              </div>
              <div className="text-center">
                <h1 className="font-sans font-bold text-2xl" style={{ color: '#2D1810' }}>Masuk</h1>
                <p className="font-sans text-sm mt-0.5" style={{ color: '#8B4A2C' }}>Selamat datang kembali</p>
              </div>
            </div>
          </FadeUp>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FadeUp delay={0.1}>
              <Input name="email" type="email" label="Email" placeholder="kamu@email.com" required autoComplete="email" />
            </FadeUp>
            <FadeUp delay={0.16}>
              <Input name="password" type="password" label="Password" placeholder="••••••••" required autoComplete="current-password" />
            </FadeUp>
            <FadeUp delay={0.22}>
              <Button type="submit" fullWidth size="lg" disabled={loading}>
                {loading ? 'Masuk...' : 'Masuk'}
              </Button>
            </FadeUp>
          </form>

          <FadeUp delay={0.28}>
            <p className="font-sans text-sm text-center" style={{ color: '#8B4A2C' }}>
              Belum punya akun?{' '}
              <Link href="/auth/register" className="font-semibold" style={{ color: '#2D1810' }}>Daftar</Link>
            </p>
          </FadeUp>
        </div>
      </motion.div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </AuthBackground>
  )
}
