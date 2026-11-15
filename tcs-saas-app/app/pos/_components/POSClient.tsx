'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { OrderRequest } from '@/lib/orders/create-order'
import { placePendingOrder, recoverPendingOrder, finishPendingOrder } from '@/lib/orders/pending-order'
import { confirmOrderPayment } from '@/lib/orders/confirm-payment'
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
  const pending = useRef<{ userId: string; key: string } | null>(null)
  const confirming = useRef(false)
  const [initializing, setInitializing] = useState(true)
  const submitting = useRef(false)

  useEffect(() => {
    let active = true
    async function recover() {
      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw new Error('Sesi berakhir. Silakan masuk kembali.')
        if (!active) return
        const previous = await recoverPendingOrder(supabase, user.id, 'pos')
        if (!active) return
        if (previous) {
          if (previous.payment_status === 'paid' || previous.status === 'cancelled') {
            await finishPendingOrder(user.id, 'pos', previous.attemptKey)
          } else {
            pending.current = { userId: user.id, key: previous.attemptKey }
            setOrderId(previous.id)
            setOrderTotal(previous.total)
          }
        }
        setInitializing(false)
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Gagal memeriksa checkout.')
      }
    }
    void recover()
    return () => { active = false }
  }, [])

  function addProduct(product: GridProduct) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }]
    })
  }

  async function handleCheckout() {
    if (initializing || items.length === 0 || submitting.current || orderId) return
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
      const order = await placePendingOrder(supabase, user.id, 'pos', request)
      pending.current = { userId: user.id, key: order.attemptKey }
      if (order.payment_status === 'paid' || order.status === 'cancelled') {
        await finishPendingOrder(user.id, 'pos', order.attemptKey)
        setItems([])
        pending.current = null
        return
      }
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
    if (!orderId || confirming.current) return
    confirming.current = true
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      await confirmOrderPayment(supabase, orderId)
      if (pending.current) await finishPendingOrder(pending.current.userId, 'pos', pending.current.key)
      setItems([])
      setOrderId(null)
      setShowQRIS(false)
      pending.current = null
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal konfirmasi pembayaran')
      setShowQRIS(false)
    } finally {
      confirming.current = false
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
      <fieldset disabled={initializing || Boolean(orderId) || loading} className="flex-1 min-w-0 overflow-y-auto">
        <MenuGrid products={gridProducts} onSelect={addProduct} />
      </fieldset>
      <div className="w-72 shrink-0">
        {error && <p role="alert" className="p-4 text-red-400 text-sm">{error}</p>}
        {orderId && !showQRIS && <button className="p-4 text-brand-accent" onClick={() => setShowQRIS(true)}>Lanjutkan pembayaran</button>}
        <fieldset disabled={initializing || Boolean(orderId) || loading}>
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
