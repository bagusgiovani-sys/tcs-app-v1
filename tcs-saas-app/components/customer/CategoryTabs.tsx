'use client'

interface CategoryTabsProps {
  categories: { value: string; label: string }[]
  active: string
  onChange: (value: string) => void
}

export default function CategoryTabs({ categories, active, onChange }: CategoryTabsProps) {
  return (
    <div className="flex gap-5 overflow-x-auto scrollbar-none px-1">
      {categories.map((cat) => {
        const isActive = cat.value === active
        return (
          <button
            key={cat.value}
            onClick={() => onChange(cat.value)}
            className={`
              shrink-0 font-display font-semibold text-base pb-1 border-b-2 transition-colors whitespace-nowrap
              ${isActive
                ? 'text-brand-accent border-brand-accent'
                : 'text-brand-muted border-transparent'
              }
            `}
          >
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}
