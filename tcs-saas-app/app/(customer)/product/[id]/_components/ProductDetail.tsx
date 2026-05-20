'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useCartStore } from '@/lib/stores/cart'
import Button from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string
}

const SIZES = [
  { value: 'S', label: 'Small' },
  { value: 'M', label: 'Medium' },
  { value: 'L', label: 'Large' },
]

export default function ProductDetail({ product }: { product: Product }) {
  const [size, setSize] = useState('M')
  const [qty, setQty] = useState(1)
  const [toast, setToast] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  function handleAddToCart() {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      size,
      imageUrl: product.image_url ?? undefined,
    })
    setToast(true)
  }

  return (
    <div className="min-h-dvh bg-brand-card flex flex-col relative">
      {/* Hero image */}
      <div className="relative w-full h-72 bg-brand-surface">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-brand-surface" />
        )}
        <div className="absolute inset-0 bg-black/16" />
        <Link href="/" className="absolute top-14 left-5 text-white">
          <svg width="33" height="33" viewBox="0 0 33 33" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 8L13 16.5L21 25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1 className="absolute bottom-4 left-0 right-0 text-center font-sans font-bold text-2xl text-white px-5">
          {product.name}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 bg-brand-surface rounded-t-3xl -mt-4 px-5 pt-6 pb-32 flex flex-col gap-6">
        {product.description && (
          <p className="font-sans text-brand-subtext text-sm leading-relaxed">{product.description}</p>
        )}

        {/* Size selector */}
        <div>
          <p className="font-sans font-semibold text-brand-text text-lg mb-3">Ukuran</p>
          <div className="flex gap-3">
            {SIZES.map((s, i) => {
              const active = size === s.value
              const iconSize = i === 0 ? 'w-9 h-9' : i === 1 ? 'w-14 h-14' : 'w-20 h-20'
              return (
                <button
                  key={s.value}
                  onClick={() => setSize(s.value)}
                  className={`flex flex-col items-center gap-1 px-4 py-3 rounded-[10px] transition-colors ${
                    active ? 'bg-brand-accent' : 'bg-brand-card border border-brand-border'
                  }`}
                >
                  <div className={`${iconSize} rounded bg-current opacity-30`} />
                  <span className={`font-sans font-bold text-xs ${active ? 'text-brand-on-accent' : 'text-brand-subtext'}`}>
                    {s.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-brand-card border-t border-brand-border px-5 py-4 flex items-center gap-4">
        <p className="font-display font-semibold text-2xl text-brand-text">
          Rp {(product.price * qty).toLocaleString('id-ID')}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-8 h-8 rounded-lg bg-brand-accent text-brand-on-accent font-bold text-lg flex items-center justify-center"
          >
            −
          </button>
          <span className="font-display font-semibold text-brand-text w-5 text-center">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="w-8 h-8 rounded-lg bg-brand-accent text-brand-on-accent font-bold text-lg flex items-center justify-center"
          >
            +
          </button>
        </div>
        <Button size="lg" onClick={handleAddToCart} className="flex-1">
          Tambah
        </Button>
      </div>

      {toast && (
        <Toast message="Ditambahkan ke keranjang" type="success" onClose={() => setToast(false)} />
      )}
    </div>
  )
}
