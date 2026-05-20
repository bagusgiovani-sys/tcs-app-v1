'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/stores/cart'
import { createClient } from '@/lib/supabase/client'
import { SHOP_ID } from '@/lib/utils/constants'
import QRISDisplay from '@/components/customer/QRISDisplay'
import Button from '@/components/ui/Button'

type OrderType = 'pickup' | 'dine_in'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clear } = useCartStore()
  const [orderType, setOrderType] = useState<OrderType>('pickup')
  const [tableNumber, setTableNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePlaceOrder() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login?redirectTo=/checkout'); return }

    const subtotal = total()
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        shop_id: SHOP_ID,
        customer_id: user.id,
        type: orderType,
        table_number: orderType === 'dine_in' ? tableNumber : null,
        status: 'pending',
        payment_method: 'qris',
        payment_status: 'pending',
        subtotal,
        total: subtotal,
        notes: notes || null,
      })
      .select('id')
      .single()

    if (orderErr || !order) { setError('Gagal membuat pesanan'); setLoading(false); return }

    await supabase.from('order_items').insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
        notes: item.size ? `Ukuran: ${item.size}` : null,
      }))
    )

    setOrderId(order.id)
    setLoading(false)
  }

  async function handleConfirmPayment() {
    if (!orderId) return
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('orders')
      .update({ payment_status: 'paid', status: 'confirmed' })
      .eq('id', orderId)
    clear()
    router.push(`/order/${orderId}`)
  }

  if (orderId) {
    return (
      <div className="px-5 pt-14 flex flex-col gap-6">
        <h1 className="font-sans font-bold text-xl text-brand-text">Pembayaran</h1>
        <QRISDisplay
          total={total()}
          onConfirmPayment={handleConfirmPayment}
          isPending={loading}
        />
      </div>
    )
  }

  return (
    <div className="px-5 pt-14 flex flex-col gap-5">
      <h1 className="font-sans font-bold text-xl text-brand-text">Checkout</h1>

      {/* Order type */}
      <div className="flex gap-3">
        {(['pickup', 'dine_in'] as OrderType[]).map((t) => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className={`flex-1 py-3 rounded-xl font-sans font-semibold text-sm border transition-colors ${
              orderType === t
                ? 'bg-brand-accent text-brand-on-accent border-brand-accent'
                : 'border-brand-border text-brand-subtext'
            }`}
          >
            {t === 'pickup' ? 'Ambil Sendiri' : 'Meja'}
          </button>
        ))}
      </div>

      {orderType === 'dine_in' && (
        <input
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          placeholder="Nomor meja"
          className="h-12 rounded-xl border border-brand-border bg-brand-card text-brand-text font-sans text-base px-4 outline-none focus:border-brand-accent"
        />
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Catatan pesanan (opsional)"
        rows={3}
        className="rounded-xl border border-brand-border bg-brand-card text-brand-text font-sans text-sm px-4 py-3 outline-none focus:border-brand-accent resize-none"
      />

      <div className="bg-brand-card rounded-2xl border border-brand-border p-4 flex justify-between font-display font-semibold text-lg text-brand-text">
        <span>Total</span>
        <span>Rp {total().toLocaleString('id-ID')}</span>
      </div>

      {error && <p className="text-red-400 text-sm font-sans text-center">{error}</p>}

      <Button fullWidth size="lg" onClick={handlePlaceOrder} disabled={loading || items.length === 0}>
        {loading ? 'Memproses...' : 'Bayar dengan QRIS'}
      </Button>
    </div>
  )
}
