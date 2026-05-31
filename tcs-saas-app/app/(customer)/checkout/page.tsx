'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/stores/cart'
import { createClient } from '@/lib/supabase/client'
import { SHOP_ID } from '@/lib/utils/constants'
import dynamic from 'next/dynamic'
const QRISDisplay = dynamic(() => import('@/components/customer/QRISDisplay'), { ssr: false })
import Button from '@/components/ui/Button'

type OrderType = 'pickup' | 'dine_in'
type PaymentMethod = 'qris' | 'cash'

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; desc: string }[] = [
  { value: 'qris', label: 'QRIS', desc: 'GoPay, OVO, Dana, semua e-wallet' },
  { value: 'cash', label: 'Tunai', desc: 'Bayar langsung di kasir' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clear } = useCartStore()
  const [orderType, setOrderType]       = useState<OrderType>('pickup')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris')
  const [tableNumber, setTableNumber]   = useState('')
  const [notes, setNotes]               = useState('')
  const [orderId, setOrderId]           = useState<string | null>(null)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)

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
        payment_method: paymentMethod,
        payment_status: 'pending',
        subtotal,
        total: subtotal,
        notes: notes || null,
      })
      .select('id')
      .single()

    if (orderErr || !order) { setError('Gagal membuat pesanan'); setLoading(false); return }

    const { error: itemsErr } = await supabase.from('order_items').insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
        notes: item.size ? `Ukuran: ${item.size}` : null,
      }))
    )

    if (itemsErr) {
      await supabase.from('orders').delete().eq('id', order.id)
      setError('Gagal membuat pesanan, coba lagi')
      setLoading(false)
      return
    }

    if (paymentMethod === 'cash') {
      clear()
      router.push(`/order/${order.id}`)
      return
    }

    setOrderId(order.id)
    setLoading(false)
  }

  async function handleConfirmPayment() {
    if (!orderId) return
    setLoading(true)
    const supabase = createClient()
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ payment_status: 'paid', status: 'confirmed' })
      .eq('id', orderId)
    if (updateErr) {
      setError('Gagal konfirmasi pembayaran, coba lagi')
      setLoading(false)
      return
    }
    clear()
    router.push(`/order/${orderId}`)
  }

  if (orderId) {
    return (
      <div className="px-5 pt-14 flex flex-col gap-6">
        <h1 className="font-sans font-bold text-xl text-brand-text">Pembayaran QRIS</h1>
        <QRISDisplay
          total={total()}
          onConfirmPayment={handleConfirmPayment}
          isPending={loading}
        />
      </div>
    )
  }

  return (
    <div className="px-5 pt-14 pb-8 flex flex-col gap-5">
      <h1 className="font-sans font-bold text-xl text-brand-text">Checkout</h1>

      {/* Order type */}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-semibold text-brand-text font-sans">Tipe Pesanan</p>
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
              {t === 'pickup' ? 'Ambil Sendiri' : 'Di Meja'}
            </button>
          ))}
        </div>
      </div>

      {orderType === 'dine_in' && (
        <input
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          placeholder="Nomor meja"
          className="h-12 rounded-xl border border-brand-border bg-brand-card text-brand-text font-sans text-base px-4 outline-none focus:border-brand-accent"
        />
      )}

      {/* Payment method */}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-semibold text-brand-text font-sans">Metode Pembayaran</p>
        <div className="flex flex-col gap-2">
          {PAYMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPaymentMethod(opt.value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                paymentMethod === opt.value
                  ? 'border-brand-accent bg-brand-accent/10'
                  : 'border-brand-border bg-brand-card'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                paymentMethod === opt.value ? 'border-brand-accent' : 'border-brand-border'
              }`}>
                {paymentMethod === opt.value && (
                  <div className="w-2 h-2 rounded-full bg-brand-accent" />
                )}
              </div>
              <div>
                <p className="font-sans font-semibold text-sm text-brand-text">{opt.label}</p>
                <p className="font-sans text-xs text-brand-subtext">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Catatan pesanan (opsional)"
        rows={3}
        className="rounded-xl border border-brand-border bg-brand-card text-brand-text font-sans text-sm px-4 py-3 outline-none focus:border-brand-accent resize-none"
      />

      {/* Order summary */}
      <div className="bg-brand-card rounded-2xl border border-brand-border p-4 flex flex-col gap-2">
        {items.map((item) => (
          <div key={`${item.productId}-${item.size}`} className="flex justify-between text-sm font-sans text-brand-subtext">
            <span>{item.name}{item.size ? ` (${item.size})` : ''} ×{item.quantity}</span>
            <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
          </div>
        ))}
        <div className="flex justify-between font-display font-semibold text-base text-brand-text border-t border-brand-border pt-3 mt-1">
          <span>Total</span>
          <span>Rp {total().toLocaleString('id-ID')}</span>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm font-sans text-center">{error}</p>}

      <Button fullWidth size="lg" onClick={handlePlaceOrder} disabled={loading || items.length === 0}>
        {loading
          ? 'Memproses...'
          : paymentMethod === 'qris'
            ? 'Lanjut ke QRIS'
            : 'Pesan Sekarang'}
      </Button>
    </div>
  )
}
