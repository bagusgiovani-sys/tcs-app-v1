import Image from 'next/image'
import Link from 'next/link'

interface ProductCardProps {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string
  isFavourite?: boolean
  onFavouriteToggle?: (id: string) => void
}

export default function ProductCard({
  id,
  name,
  description,
  price,
  imageUrl,
  isFavourite = false,
  onFavouriteToggle,
}: ProductCardProps) {
  return (
    <Link href={`/product/${id}`} className="block">
      <div className="bg-brand-accent rounded-[7px] p-3 relative shadow-[0px_0px_15px_1px_rgba(0,0,0,0.06)]">
        {onFavouriteToggle && (
          <button
            onClick={(e) => { e.preventDefault(); onFavouriteToggle(id) }}
            className="absolute top-2 right-2 z-10 text-white"
            aria-label="Toggle favourite"
          >
            <svg width="17" height="16" viewBox="0 0 17 16" fill={isFavourite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
              <path d="M8.5 14S2 10.314 2 5.857A3.857 3.857 0 0 1 8.5 3.21 3.857 3.857 0 0 1 15 5.857C15 10.314 8.5 14 8.5 14z" />
            </svg>
          </button>
        )}
        {imageUrl ? (
          <div className="relative w-full aspect-square mb-2">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-contain drop-shadow-[0px_11px_14px_rgba(0,0,0,0.38)]"
            />
          </div>
        ) : (
          <div className="w-full aspect-square mb-2 bg-brand-surface rounded-md" />
        )}
        <p className="font-display font-semibold text-lg text-white leading-tight">{name}</p>
        <p className="font-sans text-[9px] text-brand-on-accent leading-[11px] mt-1 line-clamp-2">{description}</p>
        <p className="font-display font-semibold text-base text-brand-on-accent mt-1">
          Rp {price.toLocaleString('id-ID')}
        </p>
      </div>
    </Link>
  )
}
