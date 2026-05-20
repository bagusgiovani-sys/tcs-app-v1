import { InputHTMLAttributes, forwardRef, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-semibold text-brand-text font-sans">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-brand-subtext">{leftIcon}</span>
          )}
          <input
            ref={ref}
            className={`
              w-full h-12 rounded-xl border border-brand-border bg-brand-card
              text-brand-text placeholder:text-brand-muted font-sans text-base
              px-4 outline-none
              focus:border-brand-accent
              disabled:opacity-40 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${error ? 'border-red-400 focus:border-red-400' : ''}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-brand-subtext">{rightIcon}</span>
          )}
        </div>
        {error && (
          <p className="text-red-400 text-xs font-sans">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
