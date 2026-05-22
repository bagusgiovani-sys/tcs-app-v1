import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/utils/constants'
import dynamic from 'next/dynamic'
const AdminOrderQueue = dynamic(() => import('./_components/AdminOrderQueue'), {
  loading: () => (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-24 rounded-2xl bg-brand-muted animate-pulse" />
      ))}
    </div>
  ),
})

export default async function AdminOrdersPage() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, type, table_number, total, created_at, payment_method, payment_status,
      users (name),
      order_items (id)
    `)
    .eq('shop_id', SHOP_ID)
    .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
    .order('created_at')

  const mapped = (orders ?? []).map((o: any) => ({
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
  }))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-sans font-bold text-2xl text-brand-text">Antrian Pesanan</h1>
      <AdminOrderQueue initialOrders={mapped} />
    </div>
  )
}
