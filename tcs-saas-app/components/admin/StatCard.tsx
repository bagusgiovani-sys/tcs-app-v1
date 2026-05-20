interface StatCardProps {
  label: string
  value: string | number
  sub?: string
}

export default function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
      <p className="font-sans text-brand-subtext text-xs">{label}</p>
      <p className="font-display font-semibold text-brand-text text-2xl mt-1">{value}</p>
      {sub && <p className="font-sans text-brand-subtext text-xs mt-1">{sub}</p>}
    </div>
  )
}
