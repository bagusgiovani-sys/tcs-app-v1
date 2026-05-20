'use client'

import { useState } from 'react'
import CategoryTabs from '@/components/customer/CategoryTabs'
import ProductCard from '@/components/customer/ProductCard'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  image_url: string | null
}

interface CategoryProductListProps {
  products: Product[]
  categories: { value: string; label: string }[]
}

export default function CategoryProductList({ products, categories }: CategoryProductListProps) {
  const [active, setActive] = useState('all')

  const filtered = active === 'all'
    ? products
    : products.filter((p) => p.category === active)

  return (
    <>
      <CategoryTabs categories={categories} active={active} onChange={setActive} />
      <div className="grid grid-cols-2 gap-3 mt-2">
        {filtered.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            description={product.description ?? ''}
            price={product.price}
            imageUrl={product.image_url ?? undefined}
          />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-2 text-center text-brand-subtext text-sm font-sans py-10">
            Tidak ada produk di kategori ini
          </p>
        )}
      </div>
    </>
  )
}
