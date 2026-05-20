interface BadgeProps {
  label: string
  variant?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'default'
  className?: string
}

const variantStyles = {
  pending:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  preparing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  ready:     'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-brand-surface text-brand-subtext',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  default:   'bg-brand-muted text-brand-text',
}

export default function Badge({ label, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold font-sans
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {label}
    </span>
  )
}
