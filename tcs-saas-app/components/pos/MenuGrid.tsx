import Image from 'next/image'

interface Product {
  id: string
  name: string
  price: number
  imageUrl?: string
  isAvailable: boolean
}

interface MenuGridProps {
  products: Product[]
  onSelect: (product: Product) => void
}

export default function MenuGrid({ products, onSelect }: MenuGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3 p-4 overflow-y-auto">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => product.isAvailable && onSelect(product)}
          disabled={!product.isAvailable}
          className={`
            bg-brand-accent rounded-xl p-3 text-left transition-opacity
            ${!product.isAvailable ? 'opacity-40 cursor-not-allowed' : 'active:opacity-80'}
          `}
        >
          {product.imageUrl && (
            <div className="relative w-full aspect-square mb-2">
              <Image src={product.imageUrl} alt={product.name} fill className="object-contain" />
            </div>
          )}
          <p className="font-sans font-semibold text-white text-sm leading-tight line-clamp-2">{product.name}</p>
          <p className="font-display font-semibold text-brand-on-accent text-sm mt-1">
            Rp {product.price.toLocaleString('id-ID')}
          </p>
        </button>
      ))}
    </div>
  )
}
