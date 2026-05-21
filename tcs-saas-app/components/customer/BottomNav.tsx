'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useCartStore } from '@/lib/stores/cart'

const navItems = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    href: '/cart',
    label: 'Keranjang',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    href: '/loyalty',
    label: 'Poin',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profil',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const cartCount = useCartStore((s) => s.count())

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pb-4 px-5">
      <nav className="w-full max-w-[430px] h-16 bg-brand-card rounded-3xl flex items-center justify-around px-2"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
        {navItems.map((item) => {
          const active = isActive(item.href)
          const isCart = item.href === '/cart'

          return (
            <motion.div
              key={item.href}
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', damping: 20, stiffness: 400 }}
              className="relative flex-1 flex justify-center"
            >
              <Link href={item.href} className="flex flex-col items-center gap-1">
                <div className="relative flex items-center justify-center w-11 h-11 rounded-full">
                  {active && (
                    <motion.div
                      layoutId="navPill"
                      className="absolute inset-0 rounded-full bg-brand-accent"
                      transition={{ type: 'spring', damping: 24, stiffness: 320 }}
                    />
                  )}
                  <span className={`relative z-10 transition-colors duration-150 ${active ? 'text-brand-on-accent' : 'text-brand-subtext'}`}>
                    {item.icon}
                  </span>
                  {isCart && cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 z-20 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </motion.span>
                  )}
                </div>
                <span className={`text-[9px] font-sans font-medium transition-colors duration-150 ${active ? 'text-brand-accent' : 'text-brand-subtext'}`}>
                  {item.label}
                </span>
              </Link>
            </motion.div>
          )
        })}
      </nav>
    </div>
  )
}
