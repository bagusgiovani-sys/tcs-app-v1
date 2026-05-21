'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/stores/cart'
import Toast from '@/components/ui/Toast'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string
}

const SIZES = ['S', 'M', 'L']
const COFFEE_CATEGORIES = ['coffee', 'non-coffee']

export default function ProductDetail({ product }: { product: Product }) {
  const router = useRouter()
  const [size, setSize] = useState('M')
  const [qty, setQty] = useState(1)
  const [toast, setToast] = useState(false)
  const [favourite, setFavourite] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const showSizes = COFFEE_CATEGORIES.includes(product.category)

  function handleAddToCart() {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      size: showSizes ? size : undefined,
      imageUrl: product.image_url ?? undefined,
    })
    setToast(true)
  }

  return (
    <div className="relative min-h-dvh bg-black flex flex-col">
      {/* Full-bleed background image */}
      <div className="absolute inset-0 z-0">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-brand-surface" />
        )}
        {/* Gradient: transparent top → dark bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      </div>

      {/* Top buttons */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-14">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
          aria-label="Kembali"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4.5L6.5 9 11 13.5" />
          </svg>
        </button>
        <button
          onClick={() => setFavourite((f) => !f)}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
          aria-label="Favorit"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={favourite ? 'white' : 'none'} stroke="white" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Push content to bottom */}
      <div className="flex-1 min-h-[28vh]" />

      {/* Content overlaid on gradient */}
      <div className="relative z-10 px-5 pb-6">
        <h1 className="font-sans font-bold text-[26px] text-white leading-tight">
          {product.name}
        </h1>
        {product.description && (
          <p className="font-sans text-white/65 text-sm mt-2 leading-relaxed">
            {product.description}
          </p>
        )}

        <div className="h-px bg-white/20 my-4" />

        <p className="font-display font-bold text-3xl text-white">
          Rp {(product.price * qty).toLocaleString('id-ID')}
        </p>

        {showSizes && (
          <div className="mt-4">
            <p className="font-sans font-semibold text-white/75 text-xs mb-2 uppercase tracking-wide">
              Ukuran
            </p>
            <div className="flex gap-2">
              {SIZES.map((s) => {
                const active = size === s
                return (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`w-11 h-11 rounded-xl font-sans font-bold text-sm transition-colors ${
                      active
                        ? 'bg-brand-accent text-brand-on-accent'
                        : 'bg-white/15 text-white border border-white/25'
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="sticky bottom-0 z-20 bg-black/55 backdrop-blur-md border-t border-white/10 px-5 py-4 flex items-center gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-9 h-9 rounded-lg bg-white/15 border border-white/20 text-white font-bold text-xl flex items-center justify-center"
          >
            −
          </button>
          <span className="font-display font-semibold text-white w-6 text-center text-lg">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="w-9 h-9 rounded-lg bg-white/15 border border-white/20 text-white font-bold text-xl flex items-center justify-center"
          >
            +
          </button>
        </div>
        <button
          onClick={handleAddToCart}
          className="flex-1 h-[52px] rounded-[10px] bg-brand-accent text-brand-on-accent font-sans font-bold text-base"
        >
          Beli Sekarang
        </button>
      </div>

      {toast && (
        <Toast
          message={`${product.name} ditambahkan ke keranjang`}
          type="success"
          onClose={() => setToast(false)}
        />
      )}
    </div>
  )
}
