'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useCartStore } from '@/lib/stores/cart'

const sideItems = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    href: '/loyalty',
    label: 'Poin',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profil',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const cartCount = useCartStore((s) => s.count())
  const isCartActive = pathname.startsWith('/cart')

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30">
      {/* FAB Cart — floats above bar */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
        <motion.div whileTap={{ scale: 0.88 }} transition={{ type: 'spring', damping: 18, stiffness: 400 }}>
          <Link href="/cart" className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg"
            style={{ backgroundColor: isCartActive ? 'var(--color-brand-text)' : 'var(--color-brand-accent)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-on-accent)" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
              >
                {cartCount > 9 ? '9+' : cartCount}
              </motion.span>
            )}
          </Link>
        </motion.div>
      </div>

      {/* Bar */}
      <div className="h-16 bg-brand-card border-t border-brand-border flex items-center">
        {/* Left: Home, Loyalty */}
        <div className="flex-1 flex items-center justify-around">
          {sideItems.slice(0, 2).map((item) => (
            <NavItem key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </div>

        {/* Center spacer for FAB */}
        <div className="w-16 shrink-0" />

        {/* Right: Profile */}
        <div className="flex-1 flex items-center justify-around">
          {sideItems.slice(2).map((item) => (
            <NavItem key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </div>
      </div>
    </nav>
  )
}

function NavItem({ item, active }: { item: typeof sideItems[number]; active: boolean }) {
  return (
    <motion.div whileTap={{ scale: 0.85 }} transition={{ type: 'spring', damping: 18, stiffness: 400 }}>
      <Link href={item.href} className="flex flex-col items-center gap-1 px-3">
        <motion.span
          animate={{ color: active ? 'var(--color-brand-accent)' : 'var(--color-brand-subtext)' }}
          transition={{ duration: 0.2 }}
        >
          {item.icon}
        </motion.span>
        <div className="relative h-1 w-full flex justify-center">
          {active && (
            <motion.div
              layoutId="navIndicator"
              className="w-4 h-1 rounded-full bg-brand-accent"
              transition={{ type: 'spring', damping: 22, stiffness: 400 }}
            />
          )}
        </div>
        <span className={`text-[9px] font-sans font-semibold transition-colors ${active ? 'text-brand-accent' : 'text-brand-subtext'}`}>
          {item.label}
        </span>
      </Link>
    </motion.div>
  )
}
