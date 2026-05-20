'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

const typeStyles = {
  success: 'bg-green-600 text-white',
  error:   'bg-red-600 text-white',
  info:    'bg-brand-accent text-brand-on-accent',
}

export default function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [duration, onClose])

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <div
        className={`
          px-5 py-3 rounded-2xl shadow-lg font-sans font-semibold text-sm
          max-w-sm w-full text-center
          ${typeStyles[type]}
        `}
      >
        {message}
      </div>
    </div>
  )
}
