'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
      <motion.div className="grid grid-cols-2 gap-3 mt-2" layout>
        <AnimatePresence mode="popLayout">
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.055, duration: 0.28 }}
              layout
            >
              <ProductCard
                id={product.id}
                name={product.name}
                description={product.description ?? ''}
                price={product.price}
                imageUrl={product.image_url ?? undefined}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="col-span-2 text-center text-brand-subtext text-sm font-sans py-10"
          >
            Tidak ada produk di kategori ini
          </motion.p>
        )}
      </motion.div>
    </>
  )
}
