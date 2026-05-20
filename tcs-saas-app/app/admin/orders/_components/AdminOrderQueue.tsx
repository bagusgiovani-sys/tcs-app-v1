'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import OrderQueue from '@/components/admin/OrderQueue'

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'

export default function AdminOrderQueue({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders)

  async function handleStatusChange(id: string, status: OrderStatus) {
    const supabase = createClient()
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o))
  }

  return <OrderQueue orders={orders} onStatusChange={handleStatusChange} />
}
