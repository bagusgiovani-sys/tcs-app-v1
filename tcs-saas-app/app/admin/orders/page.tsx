import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/utils/constants'
import AdminOrderQueue from './_components/AdminOrderQueue'

export default async function AdminOrdersPage() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, type, table_number, total, created_at, payment_status,
      users (name),
      order_items (id)
    `)
    .eq('shop_id', SHOP_ID)
    .not('status', 'in', '("completed","cancelled")')
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
    createdAt: o.created_at,
  }))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-sans font-bold text-2xl text-brand-text">Antrian Pesanan</h1>
      <AdminOrderQueue initialOrders={mapped} />
    </div>
  )
}
