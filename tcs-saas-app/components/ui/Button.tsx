import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const variants = {
  primary: 'bg-brand-accent text-brand-on-accent active:opacity-90',
  secondary: 'border border-brand-accent text-brand-accent bg-transparent active:bg-brand-accent active:text-brand-on-accent',
  ghost: 'text-brand-subtext bg-transparent active:bg-brand-surface',
}

const sizes = {
  sm: 'h-9 px-4 text-sm rounded-lg',
  md: 'h-12 px-6 text-base rounded-xl',
  lg: 'h-[59px] px-6 text-lg rounded-[10px]',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center font-sans font-semibold
          transition-opacity duration-150
          disabled:opacity-40 disabled:cursor-not-allowed
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
