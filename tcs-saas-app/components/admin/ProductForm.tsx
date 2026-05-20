'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface ProductFormProps {
  initialValues?: {
    name: string
    description: string
    price: number
    category: string
    isAvailable: boolean
  }
  onSubmit: (values: {
    name: string
    description: string
    price: number
    category: string
    isAvailable: boolean
  }) => void
  isLoading?: boolean
}

const categories = [
  { value: 'coffee', label: 'Kopi' },
  { value: 'non-coffee', label: 'Non-Kopi' },
  { value: 'food', label: 'Makanan' },
  { value: 'merchandise', label: 'Merchandise' },
]

export default function ProductForm({ initialValues, onSubmit, isLoading }: ProductFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [price, setPrice] = useState(initialValues?.price?.toString() ?? '')
  const [category, setCategory] = useState(initialValues?.category ?? 'coffee')
  const [isAvailable, setIsAvailable] = useState(initialValues?.isAvailable ?? true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, description, price: Number(price), category, isAvailable })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Nama Produk" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="Deskripsi" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Input label="Harga (Rp)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-brand-text font-sans">Kategori</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-12 rounded-xl border border-brand-border bg-brand-card text-brand-text font-sans text-base px-4 outline-none focus:border-brand-accent"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isAvailable}
          onChange={(e) => setIsAvailable(e.target.checked)}
          className="w-4 h-4 accent-brand-accent"
        />
        <span className="font-sans text-sm text-brand-text">Tersedia</span>
      </label>
      <Button type="submit" fullWidth size="lg" disabled={isLoading}>
        {isLoading ? 'Menyimpan...' : 'Simpan Produk'}
      </Button>
    </form>
  )
}
