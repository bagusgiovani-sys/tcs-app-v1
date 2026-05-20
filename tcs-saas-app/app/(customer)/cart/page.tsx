'use client'

import Link from 'next/link'
import { useCartStore } from '@/lib/stores/cart'
import CartItem from '@/components/customer/CartItem'
import Button from '@/components/ui/Button'

export default function CartPage() {
  const { items, increment, decrement, remove, total } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4 px-5">
        <p className="font-sans text-brand-subtext text-center">Keranjangmu kosong</p>
        <Link href="/">
          <Button variant="secondary">Lihat Menu</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="px-5 pt-14 flex flex-col gap-4">
      <h1 className="font-sans font-bold text-xl text-brand-text">Keranjang</h1>
      <div className="bg-brand-card rounded-2xl border border-brand-border px-4">
        {items.map((item) => (
          <CartItem
            key={`${item.productId}-${item.size}`}
            id={item.productId}
            name={item.name}
            size={item.size}
            price={item.price}
            quantity={item.quantity}
            imageUrl={item.imageUrl}
            onIncrement={(id) => increment(id, item.size)}
            onDecrement={(id) => decrement(id, item.size)}
            onRemove={(id) => remove(id, item.size)}
          />
        ))}
      </div>
      <div className="bg-brand-card rounded-2xl border border-brand-border p-4 flex flex-col gap-3">
        <div className="flex justify-between text-sm font-sans text-brand-subtext">
          <span>Subtotal</span>
          <span>Rp {total().toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between font-display font-semibold text-lg text-brand-text border-t border-brand-border pt-3">
          <span>Total</span>
          <span>Rp {total().toLocaleString('id-ID')}</span>
        </div>
      </div>
      <Link href="/checkout">
        <Button fullWidth size="lg">Pesan Sekarang</Button>
      </Link>
    </div>
  )
}
