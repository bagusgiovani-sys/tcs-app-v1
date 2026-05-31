'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SHOP_ID } from '@/lib/utils/constants'
import OrderStatusBadge from '@/components/customer/OrderStatusBadge'
import Skeleton from '@/components/ui/Skeleton'

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'

interface Order {
  id: string
  status: OrderStatus
  payment_status: string
  type: string
  table_number: string | null
  total: number
  created_at: string
}

const STATUS_MESSAGES: Record<OrderStatus, string> = {
  pending:   'Menunggu konfirmasi kasir...',
  confirmed: 'Pesanan dikonfirmasi, sedang disiapkan',
  preparing: 'Pesananmu sedang dibuat ☕',
  ready:     'Pesananmu siap diambil!',
  completed: 'Terima kasih! Selamat menikmati.',
  cancelled: 'Pesanan dibatalkan.',
}

export default function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const [orderId, setOrderId] = useState<string | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(({ id }) => setOrderId(id))
  }, [params])

  useEffect(() => {
    if (!orderId) return
    const supabase = createClient()

    supabase.from('orders').select('*').eq('id', orderId).eq('shop_id', SHOP_ID).single()
      .then(({ data }) => { setOrder(data); setLoading(false) })

    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => setOrder(payload.new as Order))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orderId])

  if (loading) {
    return (
      <div className="px-5 pt-14 flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="px-5 pt-14 text-center">
        <p className="font-sans text-brand-subtext">Pesanan tidak ditemukan</p>
      </div>
    )
  }

  return (
    <div className="px-5 pt-14 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="font-sans font-bold text-xl text-brand-text">Status Pesanan</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="bg-brand-card rounded-2xl border border-brand-border p-5 flex flex-col gap-3">
        <p className="font-sans text-brand-subtext text-xs">
          #{order.id.slice(-8).toUpperCase()}
        </p>
        <p className="font-sans font-semibold text-brand-text text-base">
          {STATUS_MESSAGES[order.status]}
        </p>
        <div className="flex gap-4 text-xs font-sans text-brand-subtext border-t border-brand-border pt-3">
          <span>{order.type === 'dine_in' ? `Meja ${order.table_number}` : 'Ambil Sendiri'}</span>
          <span>Rp {order.total.toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {(['pending','confirmed','preparing','ready','completed'] as OrderStatus[]).map((s, i) => {
          const statuses = ['pending','confirmed','preparing','ready','completed']
          const currentIdx = statuses.indexOf(order.status)
          const done = i <= currentIdx
          return (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${done ? 'bg-brand-accent' : 'bg-brand-border'}`}
            />
          )
        })}
      </div>

      {order.status === 'completed' && (
        <Link href="/" className="block">
          <div className="bg-brand-accent rounded-2xl p-4 text-center">
            <p className="font-sans font-semibold text-brand-on-accent">Pesan Lagi</p>
          </div>
        </Link>
      )}
    </div>
  )
}
