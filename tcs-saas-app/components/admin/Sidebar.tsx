'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/orders', label: 'Pesanan' },
  { href: '/admin/menu', label: 'Menu' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-brand-card border-r border-brand-border min-h-screen flex flex-col p-4 gap-1">
      <p className="font-display font-semibold text-brand-accent text-lg px-3 py-2 mb-2">TCS Admin</p>
      {navItems.map((item) => {
        const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              px-3 py-2.5 rounded-xl font-sans text-sm font-semibold transition-colors
              ${active ? 'bg-brand-accent text-brand-on-accent' : 'text-brand-subtext hover:bg-brand-surface'}
            `}
          >
            {item.label}
          </Link>
        )
      })}
    </aside>
  )
}
