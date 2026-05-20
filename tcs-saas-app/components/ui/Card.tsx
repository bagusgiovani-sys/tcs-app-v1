import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-5',
}

export default function Card({ padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`
        bg-brand-card border border-brand-border rounded-2xl
        shadow-[0px_0px_15px_1px_rgba(0,0,0,0.06)]
        ${paddings[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}
