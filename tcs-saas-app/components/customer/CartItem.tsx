import Image from 'next/image'

interface CartItemProps {
  id: string
  name: string
  size?: string
  price: number
  quantity: number
  imageUrl?: string
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onRemove: (id: string) => void
}

export default function CartItem({
  id, name, size, price, quantity, imageUrl,
  onIncrement, onDecrement, onRemove,
}: CartItemProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-brand-border last:border-0">
      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-brand-surface shrink-0">
        {imageUrl && (
          <Image src={imageUrl} alt={name} fill className="object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans font-semibold text-brand-text text-sm leading-tight truncate">{name}</p>
        {size && <p className="font-sans text-xs text-brand-subtext mt-0.5">{size}</p>}
        <p className="font-display font-semibold text-brand-accent text-sm mt-1">
          Rp {(price * quantity).toLocaleString('id-ID')}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => quantity === 1 ? onRemove(id) : onDecrement(id)}
          className="w-7 h-7 rounded-lg bg-brand-accent text-brand-on-accent font-bold flex items-center justify-center text-lg leading-none"
        >
          −
        </button>
        <span className="font-display font-semibold text-brand-text w-4 text-center">{quantity}</span>
        <button
          onClick={() => onIncrement(id)}
          className="w-7 h-7 rounded-lg bg-brand-accent text-brand-on-accent font-bold flex items-center justify-center text-lg leading-none"
        >
          +
        </button>
      </div>
    </div>
  )
}
