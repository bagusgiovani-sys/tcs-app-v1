'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SHOP_ID } from '@/lib/utils/constants'
import { createTrustedOrder, orderAttempt, type OrderAttempt, type OrderRequest } from '@/lib/orders/create-order'
import MenuGrid from '@/components/pos/MenuGrid'
import OrderBuilder from '@/components/pos/OrderBuilder'
import dynamic from 'next/dynamic'
const POSQRISModal = dynamic(() => import('@/components/pos/POSQRISModal'), { ssr: false })

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
  const [error, setError] = useState<string | null>(null)
  const [orderTotal, setOrderTotal] = useState(0)
  const attempt = useRef<OrderAttempt | null>(null)
  const submitting = useRef(false)

  function addProduct(product: GridProduct) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }]
    })
  }

  async function handleCheckout() {
    if (items.length === 0 || submitting.current || orderId) return
    submitting.current = true
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sesi berakhir. Silakan masuk kembali.')
      const request: OrderRequest = {
        items: items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
        type: 'pickup', paymentMethod: 'qris',
      }
      attempt.current = orderAttempt(request, attempt.current)
      const order = await createTrustedOrder(supabase, request, attempt.current.key)
      setOrderId(order.id)
      setOrderTotal(order.total)
      setShowQRIS(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal membuat pesanan')
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  async function handleConfirm() {
    if (!orderId) return
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.from('orders')
        .update({ payment_status: 'paid', status: 'confirmed' }).eq('id', orderId).eq('shop_id', SHOP_ID)
        .select('id').single()
      if (updateError) throw new Error('Gagal konfirmasi pembayaran. Periksa sesi dan coba lagi.')
      setItems([])
      setOrderId(null)
      setShowQRIS(false)
      attempt.current = null
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal konfirmasi pembayaran')
      setShowQRIS(false)
    } finally {
      setLoading(false)
    }
  }

  const gridProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    imageUrl: p.image_url ?? undefined,
    isAvailable: p.is_available,
  }))

  return (
    <div className="min-h-dvh bg-brand-bg flex">
      <fieldset disabled={Boolean(orderId) || loading} className="flex-1 min-w-0 overflow-y-auto">
        <MenuGrid products={gridProducts} onSelect={addProduct} />
      </fieldset>
      <div className="w-72 shrink-0">
        {error && <p role="alert" className="p-4 text-red-400 text-sm">{error}</p>}
        {orderId && !showQRIS && <button className="p-4 text-brand-accent" onClick={() => setShowQRIS(true)}>Lanjutkan pembayaran</button>}
        <fieldset disabled={Boolean(orderId) || loading}>
          <OrderBuilder
            items={items}
            onIncrement={(id) => setItems((prev) => prev.map((i) => i.productId === id ? { ...i, quantity: i.quantity + 1 } : i))}
            onDecrement={(id) => setItems((prev) => prev.map((i) => i.productId === id ? { ...i, quantity: i.quantity - 1 } : i).filter((i) => i.quantity > 0))}
            onCheckout={handleCheckout}
            isLoading={loading}
          />
        </fieldset>
      </div>
      {orderId && (
        <POSQRISModal
          open={showQRIS}
          total={orderTotal}
          orderId={orderId}
          onConfirm={handleConfirm}
          onCancel={() => setShowQRIS(false)}
          isLoading={loading}
        />
      )}
    </div>
  )
}
