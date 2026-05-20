'use client'

import Button from '@/components/ui/Button'

interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
}

interface OrderBuilderProps {
  items: OrderItem[]
  onIncrement: (productId: string) => void
  onDecrement: (productId: string) => void
  onCheckout: () => void
  isLoading?: boolean
}

export default function OrderBuilder({ items, onIncrement, onDecrement, onCheckout, isLoading }: OrderBuilderProps) {
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <div className="flex flex-col h-full bg-brand-card border-l border-brand-border">
      <div className="p-4 border-b border-brand-border">
        <p className="font-display font-semibold text-brand-text">Pesanan</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {items.length === 0 && (
          <p className="text-brand-subtext text-sm font-sans text-center mt-8">Pilih item dari menu</p>
        )}
        {items.map((item) => (
          <div key={item.productId} className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm text-brand-text font-semibold truncate">{item.name}</p>
              <p className="font-display text-xs text-brand-subtext">Rp {item.price.toLocaleString('id-ID')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onDecrement(item.productId)} className="w-6 h-6 rounded bg-brand-accent text-brand-on-accent font-bold text-sm flex items-center justify-center">−</button>
              <span className="font-display font-semibold text-brand-text w-4 text-center text-sm">{item.quantity}</span>
              <button onClick={() => onIncrement(item.productId)} className="w-6 h-6 rounded bg-brand-accent text-brand-on-accent font-bold text-sm flex items-center justify-center">+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-brand-border flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="font-sans text-brand-subtext text-sm">Total</span>
          <span className="font-display font-semibold text-brand-text text-lg">Rp {total.toLocaleString('id-ID')}</span>
        </div>
        <Button fullWidth size="lg" onClick={onCheckout} disabled={items.length === 0 || isLoading}>
          {isLoading ? 'Memproses...' : 'Bayar QRIS'}
        </Button>
      </div>
    </div>
  )
}
