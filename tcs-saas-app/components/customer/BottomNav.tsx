'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useCartStore } from '@/lib/stores/cart'

const NAV_ITEMS = [
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

const SPRING = { type: 'spring' as const, damping: 26, stiffness: 280 }

export default function BottomNav() {
  const pathname = usePathname()
  const cartCount = useCartStore((s) => s.count())

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center px-4 pb-5">
      <nav
        className="relative w-full max-w-[430px] h-[60px] bg-brand-card rounded-[30px] flex items-center"
        style={{ overflow: 'visible', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          const isCart = item.href === '/cart'

          return (
            <div key={item.href} className="relative flex-1 h-full flex items-center justify-center">

              {/* Dip: page-bg circle that covers top edge of pill → concave illusion */}
              {active && (
                <motion.div
                  layoutId="navDip"
                  className="absolute left-1/2 -translate-x-1/2 rounded-full bg-brand-bg"
                  style={{ width: 66, height: 66, top: -18, zIndex: 1 }}
                  transition={SPRING}
                />
              )}

              {/* Raised bubble */}
              {active && (
                <motion.div
                  layoutId="navBubble"
                  className="absolute left-1/2 -translate-x-1/2 rounded-full bg-brand-surface border border-brand-border"
                  style={{ width: 54, height: 54, top: -13, zIndex: 2 }}
                  transition={SPRING}
                />
              )}

              {/* Inactive subtle circle */}
              {!active && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 rounded-full bg-brand-surface"
                  style={{ width: 44, height: 44, opacity: 0.55, zIndex: 0 }}
                />
              )}

              {/* Icon + label */}
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={SPRING}
                style={{ position: 'relative', zIndex: 10 }}
              >
                <Link href={item.href} className="flex flex-col items-center gap-0.5">
                  <motion.span
                    animate={{ y: active ? -10 : 0 }}
                    transition={SPRING}
                    className={active ? 'text-brand-accent' : 'text-brand-subtext'}
                  >
                    {item.icon}
                  </motion.span>
                  <motion.span
                    animate={{ y: active ? -10 : 0 }}
                    transition={SPRING}
                    className={`text-[9px] font-sans font-medium leading-none ${active ? 'text-brand-accent' : 'text-brand-subtext'}`}
                  >
                    {item.label}
                  </motion.span>
                  {isCart && cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, y: active ? -10 : 0 }}
                      transition={SPRING}
                      className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center z-20"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </motion.span>
                  )}
                </Link>
              </motion.div>

            </div>
          )
        })}
      </nav>
    </div>
  )
}
