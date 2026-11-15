'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SHOP_ID } from '@/lib/utils/constants'
import OrderQueue from '@/components/admin/OrderQueue'
import { confirmOrderPayment } from '@/lib/orders/confirm-payment'

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'

interface MappedOrder {
  id: string
  orderNumber: string
  customerName: string
  type: 'pickup' | 'dine_in'
  tableNumber?: string
  itemCount: number
  total: number
  status: OrderStatus
  paymentMethod: string
  paymentStatus: string
  createdAt: string
}

export interface OrderQueueRow {
  id: string
  users: { name: string | null } | { name: string | null }[] | null
  type: 'pickup' | 'dine_in'
  table_number: string | null
  order_items: { id: string }[] | null
  total: number
  status: OrderStatus
  payment_method: string
  payment_status: string
  created_at: string
}

function mapOrder(o: OrderQueueRow): MappedOrder {
  return {
    id: o.id,
    orderNumber: o.id.slice(-6).toUpperCase(),
    customerName: (Array.isArray(o.users) ? o.users[0]?.name : o.users?.name) ?? 'Tamu',
    type: o.type,
    tableNumber: o.table_number ?? undefined,
    itemCount: o.order_items?.length ?? 0,
    total: o.total,
    status: o.status,
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    createdAt: o.created_at,
  }
}

export default function AdminOrderQueue({ initialOrders }: { initialOrders: MappedOrder[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const mutations = useRef(new Set<string>())
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `shop_id=eq.${SHOP_ID}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('orders')
          .select('id, status, type, table_number, total, created_at, payment_method, payment_status, users(name), order_items(id)')
          .eq('id', payload.new.id)
          .eq('shop_id', SHOP_ID)
          .single()
        if (data) setOrders((prev) => [...prev, mapOrder(data)])
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `shop_id=eq.${SHOP_ID}`,
      }, (payload) => {
        const updated = payload.new
        setOrders((prev) =>
          prev
            .map((o) => o.id === updated.id ? { ...o, status: updated.status, paymentStatus: updated.payment_status } : o)
            .filter((o) => !['completed', 'cancelled'].includes(o.status))
        )
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function mutateOrder(id: string, action: () => Promise<void>) {
    if (mutations.current.has(id)) return
    mutations.current.add(id)
    setBusyIds(new Set(mutations.current))
    setError(null)
    try { await action() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal memperbarui pesanan.') }
    finally {
      mutations.current.delete(id)
      setBusyIds(new Set(mutations.current))
    }
  }

  async function handleStatusChange(id: string, status: OrderStatus) {
    await mutateOrder(id, async () => {
      const supabase = createClient()
      const { error: updateError } = await supabase.from('orders').update({ status }).eq('id', id).eq('shop_id', SHOP_ID)
        .select('id').single()
      if (updateError) throw new Error('Gagal memperbarui pesanan. Periksa pembayaran dan coba lagi.')
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o)
        .filter((o) => !['completed', 'cancelled'].includes(o.status)))
    })
  }

  async function handleConfirmPayment(id: string) {
    await mutateOrder(id, async () => {
      const current = await confirmOrderPayment(createClient(), id)
      setOrders((prev) => prev.map((o) => o.id === id
        ? { ...o, paymentStatus: current.payment_status, status: current.status as OrderStatus } : o)
        .filter((o) => !['completed', 'cancelled'].includes(o.status)))
    })
  }

  return <>
    {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
    <OrderQueue busyIds={busyIds} orders={orders} onStatusChange={handleStatusChange} onConfirmPayment={handleConfirmPayment} />
  </>
}
