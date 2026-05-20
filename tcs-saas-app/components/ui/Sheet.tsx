'use client'

import { useEffect, ReactNode } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-brand-card rounded-t-3xl max-h-[90dvh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-brand-border" />
        </div>
        {title && (
          <h2 className="text-brand-text font-semibold text-lg font-sans px-5 pt-2 pb-4">
            {title}
          </h2>
        )}
        <div className="px-5 pb-8">{children}</div>
      </div>
    </>
  )
}
