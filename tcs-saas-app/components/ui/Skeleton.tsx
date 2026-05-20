interface SkeletonProps {
  className?: string
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

const roundeds = {
  sm:   'rounded',
  md:   'rounded-xl',
  lg:   'rounded-2xl',
  full: 'rounded-full',
}

export default function Skeleton({ className = '', rounded = 'md' }: SkeletonProps) {
  return (
    <div
      className={`
        bg-brand-muted animate-pulse
        ${roundeds[rounded]}
        ${className}
      `}
    />
  )
}
