'use client'

import Image from 'next/image'
import { useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createProduct, updateProduct, deleteProduct } from '@/lib/actions/products'
import { SHOP_ID } from '@/lib/utils/constants'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  is_available: boolean
  image_url: string | null
}

const CATEGORIES = [
  { value: 'coffee', label: 'Kopi' },
  { value: 'non-coffee', label: 'Non-Kopi' },
  { value: 'food', label: 'Makanan' },
  { value: 'merchandise', label: 'Merchandise' },
]

export default function AdminProductForm({ product }: { product?: Product }) {
  const isEdit = Boolean(product)
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product?.price?.toString() ?? '')
  const [category, setCategory] = useState(product?.category ?? 'coffee')
  const [isAvailable, setIsAvailable] = useState(product?.is_available ?? true)
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image_url ?? null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(file: File) {
    setUploading(true)
    setUploadError(null)
    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `products/${SHOP_ID}/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: true })
    if (error) {
      setUploadError('Gagal mengupload gambar. Coba lagi.')
    } else {
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      setImageUrl(data.publicUrl)
    }
    setUploading(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = {
      name,
      description,
      price: Number(price),
      category,
      isAvailable,
      imageUrl,
    }
    startTransition(async () => {
      if (isEdit && product) {
        await updateProduct(product.id, data)
      } else {
        await createProduct(data)
      }
    })
  }

  function handleDelete() {
    if (!product) return
    startTransition(async () => {
      await deleteProduct(product.id)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Image upload */}
      <div>
        <p className="text-sm font-semibold text-brand-text font-sans mb-2">Foto Produk</p>
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          className="relative w-full aspect-video rounded-2xl bg-brand-surface border-2 border-dashed border-brand-border flex items-center justify-center cursor-pointer overflow-hidden group"
        >
          {imageUrl ? (
            <>
              <Image src={imageUrl} alt="preview" fill className="object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <p className="text-white text-sm font-sans font-semibold">Ganti Foto</p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-brand-subtext">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="text-xs font-sans">
                {uploading ? 'Mengunggah...' : 'Klik untuk upload foto'}
              </p>
            </div>
          )}
        </div>
        {uploadError && (
          <p className="text-red-400 text-xs font-sans mt-1">{uploadError}</p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImageUpload(file)
            e.target.value = ''
          }}
        />
      </div>

      <Input
        label="Nama Produk"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Contoh: Arabica Cold Brew"
        required
      />
      <Input
        label="Deskripsi (opsional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Deskripsi singkat produk"
      />
      <Input
        label="Harga (Rp)"
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="25000"
        required
        min="0"
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-brand-text font-sans">Kategori</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-12 rounded-xl border border-brand-border bg-brand-card text-brand-text font-sans text-base px-4 outline-none focus:border-brand-accent"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => setIsAvailable((v) => !v)}
          className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
            isAvailable ? 'bg-brand-accent' : 'bg-brand-muted'
          }`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            isAvailable ? 'translate-x-5' : 'translate-x-0.5'
          }`} />
        </div>
        <span className="font-sans text-sm text-brand-text">
          {isAvailable ? 'Tampilkan di menu (aktif)' : 'Sembunyikan dari menu (nonaktif)'}
        </span>
      </label>

      <Button
        type="submit"
        fullWidth
        size="lg"
        disabled={isPending || uploading}
      >
        {isPending
          ? 'Menyimpan...'
          : isEdit
          ? 'Simpan Perubahan'
          : 'Tambah Produk'}
      </Button>

      {isEdit && (
        <div className="mt-2">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full text-red-400 text-sm font-sans font-semibold text-center py-2"
            >
              Hapus Produk Ini
            </button>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex flex-col gap-3">
              <p className="font-sans text-sm text-red-700 dark:text-red-400 font-semibold">
                Yakin ingin menghapus produk ini?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 h-11 rounded-xl border border-brand-border text-brand-text font-sans text-sm font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="flex-1 h-11 rounded-xl bg-red-500 text-white font-sans text-sm font-semibold disabled:opacity-60"
                >
                  {isPending ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  )
}
