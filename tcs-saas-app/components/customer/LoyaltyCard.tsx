interface LoyaltyCardProps {
  points: number
  customerName: string
}

export default function LoyaltyCard({ points, customerName }: LoyaltyCardProps) {
  return (
    <div className="bg-brand-accent rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -right-2 -bottom-8 w-24 h-24 rounded-full bg-white/10" />
      <p className="font-sans text-brand-on-accent text-sm font-semibold opacity-80">{customerName}</p>
      <p className="font-display font-semibold text-brand-on-accent text-4xl mt-2">{points}</p>
      <p className="font-sans text-brand-on-accent text-xs mt-0.5 opacity-80">poin loyalty</p>
      <p className="font-sans text-brand-on-accent text-[10px] mt-3 opacity-60">
        1 poin = setiap Rp 10.000 belanja
      </p>
    </div>
  )
}
