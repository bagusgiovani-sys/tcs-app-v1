'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { toggleProductAvailability, deleteProduct } from '@/lib/actions/products'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  image_url: string | null
  is_available: boolean
}

const CATEGORY_LABEL: Record<string, string> = {
  coffee: 'Kopi',
  'non-coffee': 'Non-Kopi',
  food: 'Makanan',
  merchandise: 'Merch',
}

export default function AdminMenuList({ products: initial }: { products: Product[] }) {
  const [products, setProducts] = useState(initial)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPendingDelete, setPendingDelete] = useState(false)

  async function handleToggle(id: string, current: boolean) {
    setTogglingId(id)
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_available: !current } : p))
    )
    await toggleProductAvailability(id, !current)
    setTogglingId(null)
  }

  async function handleDelete() {
    if (!deletingId) return
    setPendingDelete(true)
    await deleteProduct(deletingId)
  }

  if (products.length === 0) {
    return (
      <p className="text-brand-subtext text-sm font-sans text-center py-16">
        Belum ada produk. Tambah produk pertamamu!
      </p>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-brand-card border border-brand-border rounded-2xl flex items-center gap-4 p-3"
          >
            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-xl bg-brand-surface shrink-0 overflow-hidden relative">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-muted">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-sans font-semibold text-brand-text text-sm leading-tight truncate">
                {product.name}
              </p>
              <p className="font-sans text-brand-subtext text-xs mt-0.5">
                {CATEGORY_LABEL[product.category] ?? product.category}
              </p>
              <p className="font-display font-semibold text-brand-accent text-sm mt-1">
                Rp {product.price.toLocaleString('id-ID')}
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                onClick={() => handleToggle(product.id, product.is_available)}
                disabled={togglingId === product.id}
                className={`text-xs font-semibold font-sans px-2.5 py-1 rounded-full transition-colors ${
                  product.is_available
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-brand-muted text-brand-subtext'
                }`}
              >
                {product.is_available ? 'Aktif' : 'Nonaktif'}
              </button>
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/menu/${product.id}`}
                  className="text-xs font-semibold font-sans text-brand-accent"
                >
                  Edit
                </Link>
                <button
                  onClick={() => setDeletingId(product.id)}
                  className="text-xs font-semibold font-sans text-red-400"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-0">
          <div className="bg-brand-card rounded-t-3xl p-6 w-full max-w-[430px]">
            <p className="font-sans font-bold text-brand-text text-lg">Hapus Produk?</p>
            <p className="font-sans text-brand-subtext text-sm mt-1">
              Tindakan ini permanen dan tidak bisa dibatalkan.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 h-12 rounded-xl border border-brand-border text-brand-text font-sans font-semibold text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isPendingDelete}
                className="flex-1 h-12 rounded-xl bg-red-500 text-white font-sans font-semibold text-sm disabled:opacity-60"
              >
                {isPendingDelete ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
