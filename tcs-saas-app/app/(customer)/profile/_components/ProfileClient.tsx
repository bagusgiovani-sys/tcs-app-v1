'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { logout } from '@/lib/actions/auth'
import { THEME_KEY } from '@/lib/utils/constants'

interface ProfileClientProps {
  name: string
  email: string
}

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

export default function ProfileClient({ name, email }: ProfileClientProps) {
  const [isDark, setIsDark] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggleDark() {
    const html = document.documentElement
    const next = !isDark
    setIsDark(next)
    if (next) {
      html.classList.add('dark')
      localStorage.setItem(THEME_KEY, 'dark')
    } else {
      html.classList.remove('dark')
      localStorage.setItem(THEME_KEY, 'light')
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
  }

  return (
    <div className="px-5 pt-14 pb-28 flex flex-col gap-5">
      {/* Avatar + name */}
      <FadeUp delay={0}>
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-20 h-20 rounded-full bg-brand-accent flex items-center justify-center">
            <span className="font-display font-bold text-brand-on-accent text-3xl">
              {name[0].toUpperCase()}
            </span>
          </div>
          <div className="text-center">
            <p className="font-sans font-bold text-xl text-brand-text">{name}</p>
            <p className="font-sans text-sm text-brand-subtext mt-0.5">{email}</p>
          </div>
        </div>
      </FadeUp>

      {/* Settings list */}
      <FadeUp delay={0.07}>
        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden divide-y divide-brand-border">
          {/* Dark mode toggle */}
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="text-brand-subtext">
                {isDark ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                )}
              </span>
              <span className="font-sans text-sm font-semibold text-brand-text">
                {isDark ? 'Mode Gelap' : 'Mode Terang'}
              </span>
            </div>
            <button onClick={toggleDark} className="relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0" style={{ backgroundColor: isDark ? 'var(--color-brand-accent)' : 'var(--color-brand-muted)' }}>
              <motion.div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                animate={{ x: isDark ? 26 : 2 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              />
            </button>
          </div>

          {/* Order history */}
          <Link href="/order/history" className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="text-brand-subtext">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </span>
              <span className="font-sans text-sm font-semibold text-brand-text">Riwayat Pesanan</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-subtext">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>

          {/* Loyalty */}
          <Link href="/loyalty" className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="text-brand-subtext">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </span>
              <span className="font-sans text-sm font-semibold text-brand-text">Poin Loyalty</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-subtext">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>

          {/* Share via WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent('Yuk order kopi di TCS Coffee! ' + (process.env.NEXT_PUBLIC_APP_URL ?? ''))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-brand-subtext">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
              <span className="font-sans text-sm font-semibold text-brand-text">Bagikan via WhatsApp</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-subtext">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15,3 21,3 21,9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </FadeUp>

      {/* Logout */}
      <FadeUp delay={0.14}>
        <motion.button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full h-12 rounded-2xl border border-red-300 text-red-400 font-sans font-semibold text-sm disabled:opacity-50"
          whileTap={{ scale: 0.97 }}
        >
          {loggingOut ? 'Keluar...' : 'Keluar dari Akun'}
        </motion.button>
      </FadeUp>

      <FadeUp delay={0.18}>
        <p className="text-center text-brand-muted text-xs font-sans">TCS Coffee v1.0</p>
      </FadeUp>
    </div>
  )
}
