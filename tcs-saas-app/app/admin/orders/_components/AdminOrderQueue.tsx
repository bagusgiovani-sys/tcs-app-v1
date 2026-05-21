'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SHOP_ID } from '@/lib/utils/constants'
import OrderQueue from '@/components/admin/OrderQueue'

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

function mapOrder(o: any): MappedOrder {
  return {
    id: o.id,
    orderNumber: o.id.slice(-6).toUpperCase(),
    customerName: o.users?.name ?? 'Tamu',
    type: o.type,
    tableNumber: o.table_number,
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

  async function handleStatusChange(id: string, status: OrderStatus) {
    const supabase = createClient()
    await supabase.from('orders').update({ status }).eq('id', id).eq('shop_id', SHOP_ID)
    setOrders((prev) =>
      prev
        .map((o) => o.id === id ? { ...o, status } : o)
        .filter((o) => !['completed', 'cancelled'].includes(o.status))
    )
  }

  async function handleConfirmPayment(id: string) {
    const supabase = createClient()
    await supabase.from('orders').update({ payment_status: 'paid', status: 'confirmed' }).eq('id', id).eq('shop_id', SHOP_ID)
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, paymentStatus: 'paid', status: 'confirmed' } : o))
  }

  return <OrderQueue orders={orders} onStatusChange={handleStatusChange} onConfirmPayment={handleConfirmPayment} />
}
