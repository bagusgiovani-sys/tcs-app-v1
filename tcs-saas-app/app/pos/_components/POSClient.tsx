'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SHOP_ID } from '@/lib/utils/constants'
import MenuGrid from '@/components/pos/MenuGrid'
import OrderBuilder from '@/components/pos/OrderBuilder'
import POSQRISModal from '@/components/pos/POSQRISModal'

interface DBProduct {
  id: string
  name: string
  price: number
  image_url: string | null
  is_available: boolean
}

interface GridProduct {
  id: string
  name: string
  price: number
  imageUrl?: string
  isAvailable: boolean
}

interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export default function POSClient({ products }: { products: DBProduct[] }) {
  const [items, setItems] = useState<OrderItem[]>([])
  const [orderId, setOrderId] = useState<string | null>(null)
  const [showQRIS, setShowQRIS] = useState(false)
  const [loading, setLoading] = useState(false)

  function addProduct(product: GridProduct) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }]
    })
  }

  async function handleCheckout() {
    if (items.length === 0) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const { data: order } = await supabase.from('orders').insert({
      shop_id: SHOP_ID,
      customer_id: user.id,
      type: 'pickup',
      status: 'pending',
      payment_method: 'qris',
      payment_status: 'pending',
      subtotal: total,
      total,
    }).select('id').single()

    if (order) {
      const { error: itemsErr } = await supabase.from('order_items').insert(
        items.map((i) => ({
          order_id: order.id,
          product_id: i.productId,
          quantity: i.quantity,
          unit_price: i.price,
          subtotal: i.price * i.quantity,
        }))
      )
      if (itemsErr) {
        await supabase.from('orders').delete().eq('id', order.id)
        setLoading(false)
        return
      }
      setOrderId(order.id)
      setShowQRIS(true)
    }
    setLoading(false)
  }

  async function handleConfirm() {
    if (!orderId) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('orders').update({ payment_status: 'paid', status: 'confirmed' }).eq('id', orderId).eq('shop_id', SHOP_ID)
    setItems([])
    setOrderId(null)
    setShowQRIS(false)
    setLoading(false)
  }

  const gridProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    imageUrl: p.image_url ?? undefined,
    isAvailable: p.is_available,
  }))
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <div className="min-h-dvh bg-brand-bg flex">
      <div className="flex-1 overflow-y-auto">
        <MenuGrid products={gridProducts} onSelect={addProduct} />
      </div>
      <div className="w-72 shrink-0">
        <OrderBuilder
          items={items}
          onIncrement={(id) => setItems((prev) => prev.map((i) => i.productId === id ? { ...i, quantity: i.quantity + 1 } : i))}
          onDecrement={(id) => setItems((prev) => prev.map((i) => i.productId === id ? { ...i, quantity: i.quantity - 1 } : i).filter((i) => i.quantity > 0))}
          onCheckout={handleCheckout}
          isLoading={loading}
        />
      </div>
      {orderId && (
        <POSQRISModal
          open={showQRIS}
          total={total}
          orderId={orderId}
          onConfirm={handleConfirm}
          onCancel={() => setShowQRIS(false)}
          isLoading={loading}
        />
      )}
    </div>
  )
}
