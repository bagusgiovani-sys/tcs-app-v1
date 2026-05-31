'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/stores/cart'
import Toast from '@/components/ui/Toast'
import CoffeeRadarChart, { type CoffeeProfile } from '@/components/customer/CoffeeRadarChart'

interface Ingredient {
  name: string
  icon_slug: string
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string
  coffee_profile: CoffeeProfile | null
  ingredients: Ingredient[] | null
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
      quantity: qty,
    })
    setToast(true)
  }

  const hasProfile = product.coffee_profile &&
    Object.values(product.coffee_profile).some((v) => v !== 3)
  const hasIngredients = product.ingredients && product.ingredients.length > 0

  return (
    <div className="relative min-h-dvh bg-black flex flex-col">

      {/* Full-bleed background — more faded to support content below */}
      <div className="fixed inset-0 z-0">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill className="object-cover" priority />
        ) : (
          <div className="absolute inset-0 bg-brand-surface" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />
      </div>

      {/* Top buttons */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-14 shrink-0">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4.5L6.5 9 11 13.5" />
          </svg>
        </button>
        <button
          onClick={() => setFavourite((f) => !f)}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={favourite ? 'white' : 'none'} stroke="white" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Push content down */}
      <div className="flex-1 min-h-[22vh]" />

      {/* Scrollable content over gradient */}
      <div className="relative z-10 px-5 pb-4">
        <h1 className="font-sans font-bold text-[26px] text-white leading-tight">{product.name}</h1>
        {product.description && (
          <p className="font-sans text-white/60 text-sm mt-2 leading-relaxed">{product.description}</p>
        )}

        <div className="h-px bg-white/15 my-4" />

        <p className="font-display font-bold text-3xl text-white">
          Rp {(product.price * qty).toLocaleString('id-ID')}
        </p>

        {showSizes && (
          <div className="mt-4">
            <p className="font-sans font-semibold text-white/60 text-xs mb-2 uppercase tracking-wide">Ukuran</p>
            <div className="flex gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`w-11 h-11 rounded-xl font-sans font-bold text-sm transition-colors ${
                    size === s ? 'bg-brand-accent text-brand-on-accent' : 'bg-white/15 text-white border border-white/25'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Coffee Profile Radar Chart */}
        {hasProfile && (
          <div className="mt-5 bg-black/35 backdrop-blur-md rounded-2xl border border-white/10 p-4">
            <p className="font-sans font-semibold text-white/60 text-xs uppercase tracking-wide mb-3">
              Profil Rasa
            </p>
            <div className="flex justify-center">
              <CoffeeRadarChart profile={product.coffee_profile!} />
            </div>
          </div>
        )}

        {/* Ingredients carousel */}
        {hasIngredients && (
          <div className="mt-4">
            <p className="font-sans font-semibold text-white/60 text-xs uppercase tracking-wide mb-3">
              Bahan · {product.ingredients!.length} item
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
              {product.ingredients!.map((ing, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="w-[60px] h-[60px] rounded-2xl bg-white/12 backdrop-blur-sm border border-white/18 flex items-center justify-center">
                    {/* Placeholder — replace with real icons when icon_slug is set */}
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 12 Q12 7 16 12 Q12 17 8 12Z" fill="rgba(255,255,255,0.3)" stroke="none" />
                    </svg>
                  </div>
                  <span className="text-white/65 text-[10px] font-sans text-center leading-tight" style={{ maxWidth: 60 }}>
                    {ing.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="sticky bottom-0 z-20 bg-black/60 backdrop-blur-md border-t border-white/10 px-5 py-4 flex items-center gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-9 h-9 rounded-lg bg-white/15 border border-white/20 text-white font-bold text-xl flex items-center justify-center"
          >−</button>
          <span className="font-display font-semibold text-white w-6 text-center text-lg">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="w-9 h-9 rounded-lg bg-white/15 border border-white/20 text-white font-bold text-xl flex items-center justify-center"
          >+</button>
        </div>
        <button
          onClick={handleAddToCart}
          className="flex-1 h-[52px] rounded-[10px] bg-brand-accent text-brand-on-accent font-sans font-bold text-base"
        >
          Beli Sekarang
        </button>
      </div>

      {toast && (
        <Toast message={`${product.name} ditambahkan ke keranjang`} type="success" onClose={() => setToast(false)} />
      )}
    </div>
  )
}
