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
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    href: '/cart',
    label: 'order',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profil',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

const SPRING = { type: 'spring' as const, damping: 24, stiffness: 260 }

export default function BottomNav() {
  const pathname = usePathname()
  const cartCount = useCartStore((s) => s.count())

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center px-5" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
      {/* Pill — always dark warm brown regardless of mode */}
      <nav
        className="relative w-full max-w-[430px] h-[64px] rounded-[32px] flex items-center bg-brand-card"
        style={{ overflow: 'visible', boxShadow: '0 8px 40px rgba(0,0,0,0.28)' }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          const isCart = item.href === '/cart'

          return (
            <div
              key={item.href}
              className="relative flex-1 h-full flex items-center justify-center"
            >
              {/* Page-bg dip — hides the pill's top edge to create concave look */}
              {active && (
                <motion.div
                  layoutId="navDip"
                  className="absolute rounded-full bg-brand-bg"
                  style={{ width: 71, height: 68, top: -22, left: '50%', marginLeft: -36, zIndex: 1 }}
                  transition={SPRING}
                />
              )}

              {/* Raised active bubble */}
              {active && (
                <motion.div
                  layoutId="navBubble"
                  style={{
                    width: 58,
                    height: 58,
                    top: -18,
                    left: '50%',
                    marginLeft: -29,
                    zIndex: 2,
                    position: 'absolute',
                    borderRadius: '50%',
                    background: 'var(--color-brand-bg)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.22)',
                  }}
                  transition={SPRING}
                />
              )}

              {/* Inactive subtle circle */}
              {!active && (
                <div
                  style={{
                    position: 'absolute',
                    width: 56,
                    height: 56,
                    borderRadius: '100%',
                    background: 'rgba(255,255,255,0.07)',
                    left: '50%',
                    marginLeft: -26,
                    zIndex: 0,
                  }}
                />
              )}

              {/* Icon + label */}
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={SPRING}
                style={{ position: 'relative', zIndex: 10 }}
              >
                <Link href={item.href} className="flex flex-col items-center gap-1">
                  <motion.span
                    animate={{ y: active ? -18 : 0 }}
                    transition={SPRING}
                    style={{ color: active ? 'var(--color-brand-accent)' : 'var(--color-brand-subtext)' }}
                  >
                    {item.icon}
                  </motion.span>
                  <motion.span
                    animate={{ y: active ? -18 : -0 }}
                    transition={SPRING}
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      fontFamily: 'var(--font-sans)',
                      color: active ? 'var(--color-muted)' : 'var(--color-brand-subtext)',
                    }}
                  >
                    {item.label}
                  </motion.span>
                  {isCart && cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, y: active ? -12 : 0 }}
                      transition={SPRING}
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 20,
                      }}
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
