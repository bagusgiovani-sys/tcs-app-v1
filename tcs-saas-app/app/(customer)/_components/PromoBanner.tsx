export default function PromoBanner() {
  return (
    <div className="mx-5 mt-4 rounded-[10px] overflow-hidden bg-[rgba(206,151,96,0.49)] backdrop-blur-[10px] border border-brand-border p-4">
      <p className="font-sans font-semibold text-brand-text text-base leading-tight">
        Diskon 20% untuk<br />Pesanan Pertamamu!
      </p>
      <p className="font-sans text-brand-subtext text-xs mt-1">
        Gunakan kode: <span className="font-semibold text-brand-accent">PERTAMA20</span>
      </p>
    </div>
  )
}
